"""题库自检（每次内容变更后运行）。

校验每道题：
  1. reference_sql（MySQL）经判题内核在 A/B 两库均判定 PASS / REFERENCE_PASS
     —— 这一步同时覆盖了「PG 语法拦截」（sanitizer 会拦下 QUALIFY/PIVOT 等）
        与「参考解在变体数据上结果非空且正确」。
  2. 实际输出列名与 expected_columns 完全一致（大小写不敏感）。
  3. 每条 alt_solutions（MySQL 等价解）均判定 PASS —— 验证判题不会误杀等价写法。
  4. 引用的表名均存在于该数据集 schema 中。

任一题不通过即以非零码退出，阻断提交。
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core import content_loader, executor
from app.core.duckdb_runtime import db_paths, connect_readonly
from app.core.judge import judge
from app.core.mysql_to_duckdb import translate

OK = "✓"
FAIL = "✗"


def _norm_cols(cols):
    return [c.strip().lower() for c in cols]


def check_question(q) -> list[str]:
    """返回错误信息列表（空=通过）。"""
    errors: list[str] = []
    ds = q.dataset
    ref = q.reference_sql
    if not ref.strip():
        return [f"[{q.id}] 缺少 reference_sql"]

    # 1) 参考解判题（A/B 双库）
    r = judge(dataset=ds, student_sql=ref, reference_sql=ref,
              constraints=q.constraints, order_sensitive=q.order_sensitive,
              tolerances=q.tolerances)
    if r.verdict not in ("PASS", "REFERENCE_PASS"):
        errors.append(f"[{q.id}] 参考解判题未通过：{r.code} - {r.message[:120]}")
    else:
        print(f"  {OK} 参考解判题 {r.verdict}")

    # 2) 输出列匹配 expected_columns
    try:
        ref_t = translate(ref)
    except Exception as e:  # noqa
        errors.append(f"[{q.id}] 参考解翻译失败：{e}")
        ref_t = ref
    path_a, _ = db_paths(ds)
    ex = executor.execute_sql(path_a, ref_t, 5.0, 100_000)
    if ex.code != "OK":
        errors.append(f"[{q.id}] 参考解执行失败：{ex.error}")
    else:
        exp_cols = [c["name"] for c in (q.get("expected_columns") or [])]
        got = _norm_cols(ex.columns)
        want = _norm_cols(exp_cols)
        if set(got) != set(want):
            errors.append(f"[{q.id}] 列不匹配：期望 {want}，实际 {got}")
        else:
            print(f"  {OK} 列匹配 {got}")

    # 3) 等价解判题
    for i, alt in enumerate(q.alt_solutions, 1):
        ra = judge(dataset=ds, student_sql=alt, reference_sql=ref,
                   constraints=q.constraints, order_sensitive=q.order_sensitive,
                   tolerances=q.tolerances)
        if ra.verdict not in ("PASS", "REFERENCE_PASS"):
            errors.append(f"[{q.id}] 等价解#{i} 被判 FAIL（误杀风险）：{ra.code} - {ra.message[:100]}")
        else:
            print(f"  {OK} 等价解#{i} 判 PASS")

    # 4) 表存在性（从 A 库 SHOW TABLES）
    try:
        con = connect_readonly(path_a)
        tables = {t[0].lower() for t in con.execute("SHOW TABLES").fetchall()}
        con.close()
        for t in (q.get("tables") or []):
            if t.lower() not in tables:
                errors.append(f"[{q.id}] 引用了不存在的表：{t}")
    except Exception as e:  # noqa
        errors.append(f"[{q.id}] 表存在性检查异常：{e}")

    return errors


def main() -> int:
    questions = content_loader.all_questions()
    if not questions:
        print("未加载到任何题目，请确认 content/questions 目录。")
        return 1
    print(f"自检题目数：{len(questions)}\n")
    total_err: list[str] = []
    for q in questions:
        print(f"== {q.id} ({q.dataset}/{q.scenario}) ==")
        total_err.extend(check_question(q))
        print()
    if total_err:
        print(f"{FAIL} 自检未通过，共 {len(total_err)} 处问题：")
        for e in total_err:
            print("  -", e)
        return 1
    print(f"{OK} 全部 {len(questions)} 题自检通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
