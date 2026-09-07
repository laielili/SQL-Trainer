"""生成静态原型所需的数据文件（docs/data/*.js）。

数据来源（全部来自本项目真实资产，非编造）：
- 题库：content/questions/**/*.yaml（48 题，经 app.core.content_loader 加载）
- 表结构：content/datasets/*/meta.yaml
- 结果样例：把每题 reference_sql 经「MySQL → DuckDB 翻译层」翻译后，
  在真实训练库 data/duckdb/{ds}_a.duckdb 上只读执行，取前 N 行作为静态样例。

运行：
    .venv/Scripts/python.exe docs/tools/build_static_data.py

产物（均为 window.SQLT.* 挂载的 JS，便于 file:// 直接打开）：
    docs/data/datasets.js   数据集 + 表结构树 + 场景/能力点定义 + 构建元信息
    docs/data/questions.js  48 题题面 / 提示 / MySQL 参考解 / 翻译后 SQL / 结果样例
    docs/data/progress.js   演示用的学习状态（覆盖标记 / 错题 / SRS 排期）
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import duckdb  # noqa: E402

from app.core import content_loader as CL  # noqa: E402
from app.core.mysql_to_duckdb import translate  # noqa: E402

OUT_DIR = ROOT / "docs" / "data"
DB_DIR = ROOT / "data" / "duckdb"

MAX_SAMPLE_ROWS = 15          # 每题预置的结果样例行数
FAIL_SAMPLE_ROWS = 5          # 差异对照展示的最大行数

# --------------------------------------------------------------------------
# 静态定义：数据集 / 场景 / 能力点（与 docs/PRD.md §3、§4 对齐）
# --------------------------------------------------------------------------
DATASET_LABELS = {
    "shop": {"name": "电商交易", "tagline": "订单 + 埋点，题量最大，六场景全覆盖"},
    "feed": {"name": "内容社区", "tagline": "曝光 / 点击 / 播放埋点，主打留存与漏斗"},
    "saas": {"name": "SaaS 订阅", "tagline": "订阅制指标，主打同环比与续费留存"},
}

SCENARIOS = [
    ("agg", "多维聚合统计"),
    ("window", "窗口函数排序"),
    ("retention", "留存率分析"),
    ("growth", "同环比计算"),
    ("pivot", "行列转换"),
    ("funnel", "漏斗转化分析"),
]

CAPABILITY_POINTS = {
    "agg": [
        ("agg.multi_group", "多列分组与分组粒度控制"),
        ("agg.rollup", "小计与合计行"),
        ("agg.grouping_sets", "任意维度组合汇总"),
        ("agg.conditional", "条件聚合"),
        ("agg.distinct_count", "去重计数与多粒度对齐"),
        ("agg.ratio", "组内占比与总计占比"),
        ("agg.having", "聚合后过滤"),
    ],
    "window": [
        ("window.rank_family", "三种排名函数的选择"),
        ("window.topn", "组内 TopN"),
        ("window.dedup", "取每组最新一条"),
        ("window.lag_lead", "取相邻记录"),
        ("window.cumulative", "累计值"),
        ("window.moving_avg", "移动平均"),
        ("window.frame_trap", "窗口帧默认值陷阱"),
    ],
    "retention": [
        ("retention.anchor", "首次行为锚点"),
        ("retention.cohort", "Cohort 划分"),
        ("retention.nday", "次日 / 7 日 / 30 日留存"),
        ("retention.matrix", "留存矩阵"),
        ("retention.denominator", "分母口径"),
        ("retention.churn_return", "流失与回流"),
        ("retention.date_fill", "日期空档补全"),
    ],
    "growth": [
        ("growth.date_spine", "日期维表补全空档"),
        ("growth.mom", "环比"),
        ("growth.yoy", "同比"),
        ("growth.ytd", "累计同比"),
        ("growth.grain_align", "时间粒度对齐"),
        ("growth.safe_div", "除零与空值"),
        ("growth.boundary", "跨年跨月边界"),
    ],
    "pivot": [
        ("pivot.long2wide", "长转宽"),
        ("pivot.wide2long", "宽转长"),
        ("pivot.multi_metric", "多指标同时透视"),
        ("pivot.dynamic_col", "动态列问题"),
        ("pivot.string_agg", "字符串聚合"),
        ("pivot.split_rows", "单列拆多行"),
    ],
    "funnel": [
        ("funnel.unordered", "无序漏斗"),
        ("funnel.ordered", "有序漏斗"),
        ("funnel.time_window", "时间窗约束"),
        ("funnel.session", "会话内漏斗"),
        ("funnel.step_vs_total", "单步 vs 整体转化率"),
        ("funnel.by_channel", "分渠道漏斗对比"),
        ("funnel.drop_off", "流失定位"),
    ],
}

# 用于生成「判题签名」的关键词白名单（从参考解中抽取，供静态原型做宽松匹配）
KEYWORD_TOKENS = [
    ("DENSE_RANK", r"\bdense_rank\s*\("),
    ("ROW_NUMBER", r"\brow_number\s*\("),
    ("RANK", r"(?<!dense_)(?<!row_)\brank\s*\("),
    ("LAG", r"\blag\s*\("),
    ("LEAD", r"\blead\s*\("),
    ("FIRST_VALUE", r"\bfirst_value\s*\("),
    ("OVER", r"\bover\s*\("),
    ("PARTITION BY", r"\bpartition\s+by\b"),
    ("WITH ROLLUP", r"\bwith\s+rollup\b"),
    ("GROUPING", r"\bgrouping\s*\("),
    ("GROUP_CONCAT", r"\bgroup_concat\s*\("),
    ("UNION ALL", r"\bunion\s+all\b"),
    ("CASE WHEN", r"\bcase\s+when\b"),
    ("SUM(", r"\bsum\s*\("),
    ("COUNT(", r"\bcount\s*\("),
    ("COUNT(DISTINCT", r"\bcount\s*\(\s*distinct\b"),
    ("AVG(", r"\bavg\s*\("),
    ("MAX(", r"\bmax\s*\("),
    ("MIN(", r"\bmin\s*\("),
    ("HAVING", r"\bhaving\b"),
    ("LEFT JOIN", r"\bleft\s+join\b"),
    ("JOIN", r"\bjoin\b"),
    ("DATEDIFF", r"\bdatediff\s*\("),
    ("TIMESTAMPDIFF", r"\btimestampdiff\s*\("),
    ("DATE_FORMAT", r"\bdate_format\s*\("),
    ("DATE_ADD", r"\bdate_add\s*\("),
    ("DATE_SUB", r"\bdate_sub\s*\("),
    ("INTERVAL", r"\binterval\b"),
    ("NOT IN", r"\bnot\s+in\b"),
    ("COALESCE", r"\bcoalesce\s*\("),
    ("NULLIF", r"\bnullif\s*\("),
    ("IFNULL", r"\bifnull\s*\("),
    ("ROUND(", r"\bround\s*\("),
    ("YEAR(", r"\byear\s*\("),
    ("MONTH(", r"\bmonth\s*\("),
    ("WITH", r"(?is)^\s*with\b|\bwith\s+\w+\s+as\b"),
]

# --------------------------------------------------------------------------
# 演示用的学习状态（固定写死，保证每次构建一致）
# --------------------------------------------------------------------------
PASSED = [
    "shop-agg-001", "shop-agg-002", "shop-agg-003", "shop-agg-004",
    "shop-window-001", "shop-window-002", "shop-window-003",
    "shop-growth-001", "shop-growth-002",
    "shop-pivot-002", "shop-retention-001",
    "feed-retention-001", "feed-funnel-001", "feed-agg-001",
    "saas-growth-001", "saas-agg-001",
]
REFERENCE_PASSED = ["shop-window-004", "shop-pivot-001", "feed-window-002", "saas-pivot-001"]
FAILED = [
    "shop-retention-002", "shop-funnel-003", "shop-growth-003",
    "feed-agg-002", "feed-window-001", "saas-pivot-002",
]
# 重练排期：{题号: (通过距今天数, 当前间隔天数)}
SRS_SCHEDULE = {
    "shop-agg-001": (62, 60), "shop-agg-002": (21, 21), "shop-agg-003": (8, 21),
    "shop-agg-004": (3, 7), "shop-window-001": (7, 7), "shop-window-002": (2, 3),
    "shop-window-003": (1, 1), "shop-growth-001": (9, 21), "shop-growth-002": (4, 7),
    "shop-pivot-002": (2, 3), "shop-retention-001": (1, 1),
    "feed-retention-001": (5, 7), "feed-funnel-001": (3, 7), "feed-agg-001": (1, 1),
    "saas-growth-001": (6, 7), "saas-agg-001": (2, 3),
    "shop-window-004": (1, 1), "shop-pivot-001": (3, 7),
    "feed-window-002": (2, 3), "saas-pivot-001": (1, 1),
}
FAILED_META = {  # 错题：最近一次失败距今天数 + 尝试次数
    "shop-retention-002": (1, 3), "shop-funnel-003": (2, 2), "shop-growth-003": (5, 2),
    "feed-agg-002": (1, 4), "feed-window-001": (3, 2), "saas-pivot-002": (6, 1),
}


# --------------------------------------------------------------------------
# 工具
# --------------------------------------------------------------------------
def py_regex_to_js(pattern: str) -> tuple[str, str]:
    """把 Python 风格的内联标志 (?i) / (?is) 转成 JS 的 RegExp(pattern, flags)。"""
    flags = ""
    m = re.match(r"^\(\?([a-z]+)\)", pattern)
    if m:
        flags = "".join(sorted(set(m.group(1)) & set("ims")))
        pattern = pattern[m.end():]
    return pattern, flags


def encode_cell(v):
    if v is None:
        return None
    if isinstance(v, dt.datetime):
        return v.isoformat(sep=" ")
    if isinstance(v, dt.date):
        return v.isoformat()
    if isinstance(v, bool):
        return v
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        return round(v, 4)
    try:
        from decimal import Decimal
        if isinstance(v, Decimal):
            return round(float(v), 4)
    except Exception:
        pass
    return str(v)


def is_number(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def deterministic_factor(seed: str, spread: float = 0.12) -> float:
    h = hashlib.md5(seed.encode("utf-8")).hexdigest()
    n = int(h[:8], 16) % 1000 / 1000.0
    return 1.0 + round(n * spread + 0.04, 4)


def perturb_rows(rows, columns, seed):
    """由真实结果派生一份「错误写法」样例：改数值 + 少一行。

    仅用于静态原型演示 VALUE_MISMATCH / ROW_COUNT_MISMATCH 的反馈形态，
    UI 上明确标注为演示样例，不代表任何真实执行结果。
    """
    factor = deterministic_factor(seed)
    out = []
    for i, row in enumerate(rows):
        new_row = []
        for v in row:
            if is_number(v) and i % 2 == 1:
                new_row.append(round(v * factor, 2) if isinstance(v, float) else int(v * factor))
            else:
                new_row.append(v)
        out.append(new_row)
    if len(out) > 4:                       # 制造行数差异
        out = out[:-1]
    return out


def build_diff(expected_rows, actual_rows, columns):
    diffs = []
    n = min(len(expected_rows), len(actual_rows))
    for i in range(n):
        e, a = expected_rows[i], actual_rows[i]
        if any(x != y for x, y in zip(e, a)):
            diffs.append({"row": i + 1, "expected": e, "actual": a})
        if len(diffs) >= FAIL_SAMPLE_ROWS:
            break
    return diffs


def extract_keywords(sql: str) -> list[str]:
    found = []
    for label, pat in KEYWORD_TOKENS:
        if re.search(pat, sql, re.IGNORECASE):
            found.append(label)
    return found


def build_safe_literals(ds: str, tables) -> set:
    """合法字面量集合：字段名 + 枚举值。出现在这些集合里的字符串不算「写死答案」。"""
    safe = set()
    for t in tables:
        for c in t["columns"]:
            safe.add(c["name"])
            for e in c.get("enum", []):
                safe.add(str(e))
    return safe


def extract_hardcode_markers(rows, reference_sql: str, safe_literals: set) -> list[str]:
    """从真实输出里挑出「写死答案」的线索值。

    判定逻辑：只有那些**参考解里没有出现过**的结果值才算线索 ——
    漏斗步骤名、状态枚举这类值合法出现在参考解的 CASE / IN 列表里，不能当成硬编码。
    """
    seen, markers = set(), []
    for row in rows:
        for v in row:
            if not isinstance(v, str):
                continue
            s = v.strip()
            if len(s) < 2 or len(s) > 14:
                continue
            if re.fullmatch(r"[\d\-/:. ]+", s):          # 日期 / 纯数字串不算
                continue
            if s in safe_literals:                        # 字段名 / 枚举值
                continue
            if s in reference_sql:                        # 参考解里用过 → 合法过滤条件
                continue
            if s not in seen:
                seen.add(s)
                markers.append(s)
    return markers


def run_reference(ds: str, sql: str) -> dict:
    """翻译 + 只读执行，返回 {columns, rows, elapsed_ms, row_count, ok, error}。"""
    db = DB_DIR / f"{ds}_a.duckdb"
    if not db.exists():
        return {"ok": False, "error": f"missing db {db.name}"}
    try:
        executable = translate(sql)
    except Exception as exc:                      # 翻译失败则退回原 SQL
        executable = sql
        translate_error = str(exc)
    else:
        translate_error = ""
    con = duckdb.connect(str(db), read_only=True)
    try:
        t0 = dt.datetime.now()
        cur = con.execute(executable)
        cols = [d[0] for d in cur.description]
        fetched = cur.fetchmany(MAX_SAMPLE_ROWS)
        elapsed = (dt.datetime.now() - t0).total_seconds() * 1000
        rows = [[encode_cell(v) for v in r] for r in fetched]
        total = None
        try:
            total = con.execute(
                f"SELECT COUNT(*) FROM ({executable.rstrip().rstrip(';')}) _t"
            ).fetchone()[0]
        except Exception:
            total = None
        return {
            "ok": True, "columns": cols, "rows": rows,
            "elapsed_ms": round(elapsed, 1), "row_count": total,
            "translate_error": translate_error,
        }
    except Exception as exc:
        return {"ok": False, "error": str(exc), "translate_error": translate_error}
    finally:
        con.close()


def load_schema(ds: str) -> list[dict]:
    meta = CL.load_meta(ds) or {}
    tables = []
    for t in meta.get("tables", []):
        cols = []
        for c in t.get("columns", []):
            if str(c.get("type", "")).upper() == "KEY":
                continue
            cols.append({
                "name": c.get("name"),
                "type": c.get("type"),
                "comment": c.get("comment") or "",
                "pk": bool(c.get("pk")),
                "enum": c.get("enum") or [],
            })
        tables.append({"name": t.get("name"), "comment": t.get("comment") or "", "columns": cols})
    return tables


def table_row_counts(ds: str, tables: list[dict]) -> dict:
    db = DB_DIR / f"{ds}_a.duckdb"
    if not db.exists():
        return {}
    con = duckdb.connect(str(db), read_only=True)
    out = {}
    try:
        for t in tables:
            try:
                out[t["name"]] = con.execute(f"SELECT COUNT(*) FROM {t['name']}").fetchone()[0]
            except Exception:
                out[t["name"]] = None
    finally:
        con.close()
    return out


# --------------------------------------------------------------------------
# 构建
# --------------------------------------------------------------------------
def build_datasets() -> dict:
    datasets = []
    for ds, label in DATASET_LABELS.items():
        tables = load_schema(ds)
        datasets.append({
            "key": ds,
            "name": label["name"],
            "tagline": label["tagline"],
            "db_file": f"{ds}_a.duckdb",
            "tables": tables,
            "row_counts": table_row_counts(ds, tables),
        })
    return {
        "datasets": datasets,
        "scenarios": [{"key": k, "name": n} for k, n in SCENARIOS],
        "capability_points": {
            sc: [{"id": cid, "name": cname} for cid, cname in CAPABILITY_POINTS[sc]]
            for sc, _ in SCENARIOS
        },
    }


def build_questions() -> tuple[dict, list[str]]:
    warnings: list[str] = []
    out: dict[str, dict] = {}
    SAFE_LITERALS = {ds: build_safe_literals(ds, load_schema(ds)) for ds in DATASET_LABELS}
    for q in sorted(CL.all_questions(), key=lambda x: x.id):
        raw = q.raw
        ref = q.reference_sql or ""
        res = run_reference(q.dataset, ref) if ref else {"ok": False, "error": "no reference_sql"}

        demo = {
            "executed": bool(res.get("ok")),
            "elapsed_ms": res.get("elapsed_ms", 0),
            "columns": res.get("columns", []),
            "rows": res.get("rows", []),
            "row_count": res.get("row_count"),
            "translated_sql": translate(ref) if ref else "",
            "signature": {
                "tables": list(raw.get("tables") or []),
                "keywords": extract_keywords(ref),
            },
        }
        if not res.get("ok"):
            warnings.append(f"{q.id}: 参考解执行失败 -> {res.get('error', '')[:120]}")
        else:
            actual_rows = perturb_rows(demo["rows"], demo["columns"], q.id)
            demo["actual_rows"] = actual_rows
            demo["actual_row_count"] = (demo["row_count"] - 1) if demo["row_count"] else len(actual_rows)
            demo["diff"] = build_diff(demo["rows"], actual_rows, demo["columns"])
            demo["hardcode_markers"] = extract_hardcode_markers(
                demo["rows"], ref, SAFE_LITERALS.get(q.dataset, set())
            )

        constraints = {"must_match": [], "must_not_match": []}
        for key in ("must_match", "must_not_match"):
            for item in (q.constraints.get(key) or []):
                pat, flags = py_regex_to_js(item.get("pattern", ""))
                constraints[key].append({
                    "pattern": pat, "flags": flags,
                    "reason": item.get("reason", ""),
                })

        out[q.id] = {
            "id": q.id,
            "dataset": q.dataset,
            "scenario": q.scenario,
            "chain": raw.get("chain") or "",
            "chain_step": raw.get("chain_step") or 1,
            "title": raw.get("title") or q.id,
            "business_prompt": (raw.get("business_prompt") or "").strip(),
            "context_notes": list(raw.get("context_notes") or []),
            "tables": list(raw.get("tables") or []),
            "expected_columns": [
                {"name": c.get("name"), "type": c.get("type")}
                for c in (raw.get("expected_columns") or []) if isinstance(c, dict)
            ],
            "order_sensitive": bool(raw.get("order_sensitive", False)),
            "row_limit": raw.get("row_limit"),
            "constraints": constraints,
            "hints": list(raw.get("hints") or []),
            "reference_sql": ref.strip(),
            "alt_solutions": [s.strip() for s in q.alt_solutions],
            "explanation": (raw.get("explanation") or "").strip(),
            "pitfalls": list(raw.get("pitfalls") or []),
            "capability_points": list(raw.get("capability_points") or []),
            "demo": demo,
        }
    return out, warnings


def build_progress(questions: dict) -> dict:
    state: dict[str, dict] = {}
    for qid in questions:
        status = "TODO"
        attempts = 0
        days_ago = None
        if qid in PASSED:
            status, attempts = "PASS", 2
        elif qid in REFERENCE_PASSED:
            status, attempts = "REFERENCE_PASS", 3
        elif qid in FAILED:
            status = "FAIL"
            days_ago, attempts = FAILED_META.get(qid, (1, 1))
        entry = {"status": status, "attempts": attempts}
        if qid in SRS_SCHEDULE:
            since, interval = SRS_SCHEDULE[qid]
            entry["days_since_pass"] = since
            entry["interval_days"] = interval
        if days_ago is not None:
            entry["days_since_fail"] = days_ago
        state[qid] = entry
    return {
        "srs_intervals": [1, 3, 7, 21, 60],
        "state": state,
    }


def dump_js(filename: str, varname: str, obj) -> None:
    body = json.dumps(obj, ensure_ascii=False, indent=1)
    text = (
        "/* 自动生成，请勿手改。来源：docs/tools/build_static_data.py */\n"
        "window.SQLT = window.SQLT || {};\n"
        f"window.SQLT.{varname} = {body};\n"
    )
    (OUT_DIR / filename).write_text(text, encoding="utf-8", newline="\n")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    datasets = build_datasets()
    questions, warnings = build_questions()
    progress = build_progress(questions)

    meta = {
        "generated_at": dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "question_count": len(questions),
        "dataset_count": len(datasets["datasets"]),
        "engine": "DuckDB（只读）· 表面纯 MySQL",
        "sample_rows": MAX_SAMPLE_ROWS,
    }
    datasets["meta"] = meta

    dump_js("datasets.js", "DATASETS", datasets)
    dump_js("questions.js", "QUESTIONS", questions)
    dump_js("progress.js", "PROGRESS", progress)

    executed = sum(1 for q in questions.values() if q["demo"]["executed"])
    print(f"[ok] 题库 {len(questions)} 题，其中 {executed} 题取到真实执行结果样例")
    for w in warnings:
        print(f"[warn] {w}")
    for f in ("datasets.js", "questions.js", "progress.js"):
        p = OUT_DIR / f
        print(f"[ok] {p.relative_to(ROOT)}  {p.stat().st_size / 1024:.1f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
