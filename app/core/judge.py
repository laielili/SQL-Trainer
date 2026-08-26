"""判题编排（最严档）。

流水线：静态检查（含 PG 拦截）→ 翻译 → A 库执行 → 归一化比对 →
B 库反作弊复核 → 写法约束。全部通过才 PASS；用过提示判 REFERENCE_PASS。

对外主入口：judge(...)
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field

from . import executor
from .duckdb_runtime import db_paths
from .mysql_to_duckdb import TranslateError, translate
from .normalizer import compare
from .sanitizer import sanitize


@dataclass
class JudgeResult:
    verdict: str          # PASS | REFERENCE_PASS | FAIL
    code: str             # 具体反馈码
    message: str
    details: dict = field(default_factory=dict)
    stages: dict = field(default_factory=dict)
    elapsed_ms: float = 0.0
    translated_sql: str | None = None

    def to_dict(self) -> dict:
        return {
            "verdict": self.verdict,
            "code": self.code,
            "message": self.message,
            "details": self.details,
            "stages": self.stages,
            "elapsed_ms": round(self.elapsed_ms, 1),
            "translated_sql": self.translated_sql,
        }


def _fail(code: str, message: str, details: dict | None = None,
          stage: str = "", translated: str | None = None) -> JudgeResult:
    return JudgeResult(
        verdict="FAIL", code=code, message=message,
        details=details or {},
        stages={stage: code} if stage else {},
        translated_sql=translated,
    )


def _check_constraints(student_sql: str, constraints: dict) -> tuple[bool, str, str]:
    """返回 (ok, code, message)。约束作用于学习者原始 MySQL 代码。"""
    for item in constraints.get("must_match", []):
        pat = item.get("pattern", "")
        try:
            if not re.search(pat, student_sql, re.IGNORECASE):
                reason = item.get("reason", "本题要求使用特定写法。")
                return False, "CONSTRAINT_VIOLATED", \
                    f"未满足写法约束（{pat}）：{reason}"
        except re.error as e:
            return False, "CONSTRAINT_VIOLATED", f"约束正则无效：{e}"
    for item in constraints.get("must_not_match", []):
        pat = item.get("pattern", "")
        try:
            if re.search(pat, student_sql, re.IGNORECASE):
                reason = item.get("reason", "本题不允许使用该写法。")
                return False, "CONSTRAINT_VIOLATED", \
                    f"违反了写法约束（{pat}）：{reason}"
        except re.error as e:
            return False, "CONSTRAINT_VIOLATED", f"约束正则无效：{e}"
    return True, "", ""


def judge(
    dataset: str,
    student_sql: str,
    reference_sql: str | None = None,
    constraints: dict | None = None,
    hints_used: bool = False,
    order_sensitive: bool = False,
    tolerances: dict | None = None,
    timeout: float = 5.0,
    row_limit: int = 100_000,
) -> JudgeResult:
    t0 = time.perf_counter()
    stages: dict = {}

    # ① 静态检查 + PG 拦截
    san = sanitize(student_sql)
    stages["sanitize"] = san.code
    if not san.ok:
        return _fail(san.code, san.message,
                     {"suggestion": san.suggestion}, "sanitize")

    # ② 翻译
    try:
        stu_sql_t = translate(student_sql)
    except TranslateError as e:
        stages["translate"] = "TRANSLATE_FAILED"
        return JudgeResult("FAIL", "TRANSLATE_FAILED",
                           f"MySQL 写法无法转换为执行引擎格式：{e}",
                           stages=stages, elapsed_ms=(time.perf_counter() - t0) * 1000.0)
    stages["translate"] = "OK"

    # ③ A 库执行
    path_a, path_b = db_paths(dataset)
    ex_a = executor.execute_sql(path_a, stu_sql_t, timeout, row_limit)
    stages["exec_A"] = ex_a.code
    if ex_a.code != "OK":
        msg = ex_a.error or ""
        if ex_a.code == "TIMEOUT":
            msg = "执行超时（>%.1fs），可能存在笛卡尔积或缺少过滤条件。" % timeout
        else:
            msg = (msg + "\n提示：DuckDB 较严格，常见原因有双引号字符串、隐式类型转换、"
                   "列名拼错、GROUP BY 不完整（需 full group by）。")
        return _fail(ex_a.code, msg, {}, "exec_A", stu_sql_t)

    # ④ 与参考解比对（A）
    if reference_sql:
        try:
            ref_sql_t = translate(reference_sql)
        except TranslateError as e:
            stages["translate_ref"] = "TRANSLATE_FAILED"
            return JudgeResult("FAIL", "TRANSLATE_FAILED",
                               f"参考解翻译失败（内容错误）：{e}",
                               stages=stages, elapsed_ms=(time.perf_counter() - t0) * 1000.0)
        ref_a = executor.execute_sql(path_a, ref_sql_t, timeout, row_limit)
        stages["ref_A"] = ref_a.code
        if ref_a.code != "OK":
            # 参考解本身执行失败属于内容缺陷，透传给开发者
            return JudgeResult("FAIL", "EXEC_ERROR",
                               f"参考解在 A 库执行失败（请联系内容维护）：{ref_a.error}",
                               stages=stages, elapsed_ms=(time.perf_counter() - t0) * 1000.0)
        cmp_a = compare(ex_a, ref_a, order_sensitive, tolerances)
        stages["compare_A"] = cmp_a.code
        if not cmp_a.ok:
            return _fail(cmp_a.code, cmp_a.message, cmp_a.details, "compare_A", stu_sql_t)

        # ⑥ B 库反作弊复核
        ex_b = executor.execute_sql(path_b, stu_sql_t, timeout, row_limit)
        ref_b = executor.execute_sql(path_b, ref_sql_t, timeout, row_limit)
        stages["exec_B"] = ex_b.code
        stages["ref_B"] = ref_b.code
        if ex_b.code != "OK" or ref_b.code != "OK":
            return _fail("HARDCODE_SUSPECTED",
                         "你的 SQL 在另一份数据上执行失败或结果异常，疑似写死了某些值或"
                         "依赖了特定数据分布。请基于口径而非具体数值来写查询。",
                         {}, "exec_B", stu_sql_t)
        cmp_b = compare(ex_b, ref_b, order_sensitive, tolerances)
        stages["compare_B"] = cmp_b.code
        if not cmp_b.ok:
            return _fail("HARDCODE_SUSPECTED",
                         "你的 SQL 在另一份（分布不同的）数据上结果与参考解不一致，"
                         "疑似写死了特定数据。请检查是否硬编码了日期/金额/ID 等。",
                         cmp_b.details, "compare_B", stu_sql_t)

    # ⑦ 写法约束
    if constraints:
        ok, code, msg = _check_constraints(student_sql, constraints)
        stages["constraints"] = code or "OK"
        if not ok:
            return _fail(code, msg, {}, "constraints", stu_sql_t)

    # ⑧ 通过
    verdict = "REFERENCE_PASS" if hints_used else "PASS"
    return JudgeResult(verdict, verdict,
                       "通过：结果与参考解一致，且在变体数据集上复核通过。"
                       + ("（使用了提示，记为参考通过）" if hints_used else ""),
                       stages=stages, elapsed_ms=(time.perf_counter() - t0) * 1000.0,
                       translated_sql=stu_sql_t)
