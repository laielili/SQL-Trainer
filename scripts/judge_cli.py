#!/usr/bin/env python
r"""M1 判题内核命令行验证器。

用法示例：
  python scripts/judge_cli.py --dataset shop \
      --sql "SELECT COUNT(*) AS cnt FROM orders WHERE status='completed'" \
      --ref "SELECT COUNT(*) AS cnt FROM orders WHERE status='completed'"

  # 演示 PG 拦截
  python scripts/judge_cli.py --dataset shop --sql "SELECT * FROM orders QUALIFY ROW_NUMBER() OVER(ORDER BY 1)=1"

  # 演示反作弊（写死值，A 过 B 不过 -> HARDCODE_SUSPECTED）
  python scripts/judge_cli.py --dataset shop --sql "SELECT 1 AS x" --ref "SELECT COUNT(*) AS x FROM orders"

  # 写法约束（必须 DENSE_RANK，禁止 LIMIT 3）
  python scripts/judge_cli.py --dataset shop --sql "..." --ref "..." \
      --must-match "(?i)dense_rank" --must-not-match "(?i)limit\s+3"
"""

from __future__ import annotations

import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from app.core.judge import judge  # noqa: E402
from app.core.mysql_to_duckdb import translate  # noqa: E402


def _read_arg(val: str) -> str:
    """支持从文件读取（以 @ 前缀）。"""
    if val.startswith("@"):
        with open(val[1:], "r", encoding="utf-8") as f:
            return f.read().strip()
    return val


def main() -> int:
    ap = argparse.ArgumentParser(description="SQL 训练器判题内核 CLI")
    ap.add_argument("--dataset", required=True, choices=("shop", "feed", "saas"))
    ap.add_argument("--sql", required=True, help="学习者 SQL（MySQL 风格）")
    ap.add_argument("--ref", default=None, help="参考解 SQL（MySQL 风格），用于 A/B 比对")
    ap.add_argument("--must-match", action="append", default=[], help="强制包含正则（学习者原始 SQL）")
    ap.add_argument("--must-not-match", action="append", default=[], help="禁止包含正则")
    ap.add_argument("--order-sensitive", action="store_true", help="行序敏感比对")
    ap.add_argument("--hints", action="store_true", help="标记使用过提示（-> REFERENCE_PASS）")
    ap.add_argument("--show-translated", action="store_true", help="打印翻译后的执行 SQL")
    args = ap.parse_args()

    student_sql = _read_arg(args.sql)
    ref_sql = _read_arg(args.ref) if args.ref else None

    constraints = None
    if args.must_match or args.must_not_match:
        constraints = {
            "must_match": [{"pattern": p, "reason": "（CLI 未提供理由）"} for p in args.must_match],
            "must_not_match": [{"pattern": p, "reason": "（CLI 未提供理由）"} for p in args.must_not_match],
        }

    res = judge(
        dataset=args.dataset,
        student_sql=student_sql,
        reference_sql=ref_sql,
        constraints=constraints,
        hints_used=args.hints,
        order_sensitive=args.order_sensitive,
    )

    if args.show_translated:
        try:
            print(">>> 翻译后（已翻译的学生 SQL）:\n", translate(student_sql), "\n")
        except Exception as e:  # noqa: BLE001
            print(">>> 翻译失败:", e, "\n")

    print(json.dumps(res.to_dict(), ensure_ascii=False, indent=2, default=str))

    # 人类友好摘要
    print("\n--- 摘要 ---")
    print(f"判定: {res.verdict} ({res.code})")
    print(f"说明: {res.message}")
    print(f"流水线: {res.stages}")
    return 0 if res.verdict in ("PASS", "REFERENCE_PASS") else 1


if __name__ == "__main__":
    raise SystemExit(main())
