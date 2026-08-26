"""从 content/datasets/{ds}/schema.sql 解析表结构，生成 meta.yaml（供前端 Schema 侧栏）。

列注释取自 schema.sql 行内 `--` 注释；枚举值取自下方 ENUMS 字典。
"""

from __future__ import annotations

import os
import re

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, ".."))
SCHEMA_DIR = os.path.join(_ROOT, "content", "datasets")

ENUMS = {
    "shop": {
        "orders.status": ["created", "paid", "shipped", "completed", "cancelled", "refunded"],
        "users.gender": ["M", "F", "U"],
        "users.age_band": ["18-25", "26-35", "36-45", "46-55", "55+"],
        "dim_channel.channel_type": ["app", "web", "offline", "mini_program"],
        "dim_city.region": ["north", "east", "south", "west", "central"],
        "events.event_name": ["view_home", "view_product", "add_cart", "submit_order", "pay_success"],
        "refunds.reason": ["质量问题", "七天无理由", "发错货", "其他"],
    },
    "feed": {
        "users.register_channel": ["app", "web", "mini_program", "ad", "organic"],
        "users.city_tier": ["1", "2", "3", "4"],
        "topics.category": ["娱乐", "知识", "游戏", "美食", "旅行", "财经"],
        "contents.content_type": ["short_video", "article", "live", "image"],
        "events.event_name": ["impression", "click", "play", "finish", "like", "comment", "share", "follow"],
    },
    "saas": {
        "accounts.industry": ["SaaS", "Ecommerce", "Finance", "Education", "Healthcare", "Manufacturing", "Media"],
        "accounts.company_size": ["1-10", "11-50", "51-200", "201-1000", "1000+"],
        "accounts.source_channel": ["ads", "referral", "organic", "event"],
        "users.role": ["owner", "admin", "member"],
        "subscriptions.plan": ["free", "starter", "pro", "enterprise"],
        "subscriptions.status": ["trialing", "active", "past_due", "churned", "upgraded", "downgraded"],
        "invoices.paid": ["0", "1"],
        "trial_conversion.converted": ["0", "1"],
        "feature_usage.feature_code": ["dashboard", "report", "export", "api", "invite", "billing", "search"],
    },
}

_TABLE_COMMENT = {
    "dim_date": "日期维表（连续 2024-01-01 ~ 2025-12-31，含闰年）",
    "dim_channel": "渠道维表",
    "dim_city": "城市维表",
    "dim_product": "商品维表",
    "users": "用户表",
    "orders": "订单主表",
    "order_items": "订单明细",
    "refunds": "退款表",
    "events": "埋点事件表",
    "topics": "话题表",
    "contents": "内容表",
    "daily_active": "日活快照",
    "accounts": "企业账号",
    "subscriptions": "订阅表",
    "invoices": "账单表",
    "feature_usage": "功能使用日志",
    "trial_conversion": "试用转化",
}


def parse_schema(path: str) -> list[dict]:
    text = open(path, "r", encoding="utf-8").read()
    # 去掉被 -- 注释掉的整行（以 -- 开头的行）
    text = "\n".join(
        ln for ln in text.splitlines()
        if not ln.lstrip().startswith("--")
    )
    tables = []
    # 匹配 CREATE TABLE name ( ... );
    blocks = re.findall(r"CREATE\s+TABLE\s+(\w+)\s*\((.*?)\)\s*;", text, re.IGNORECASE | re.DOTALL)
    for tname, body in blocks:
        cols = []
        for ln in body.splitlines():
            ln = ln.strip()
            if not ln or ln.startswith("--"):
                continue
            m = re.match(r"^([`\w]+)\s+([A-Za-z0-9]+)\s*(.*)$", ln)
            if not m:
                continue
            cname = m.group(1).strip("`")
            ctype = m.group(2)
            rest = m.group(3)
            # 注释在行内 -- 之后
            cm = re.search(r"--\s*(.*)$", rest)
            comment = cm.group(1).strip() if cm else ""
            pk = "PRIMARY KEY" in rest.upper()
            cols.append({
                "name": cname,
                "type": ctype,
                "comment": comment,
                "pk": pk,
            })
        tables.append({"name": tname, "comment": _TABLE_COMMENT.get(tname, ""), "columns": cols})
    return tables


def main() -> None:
    for ds in ["shop", "feed", "saas"]:
        sp = os.path.join(SCHEMA_DIR, ds, "schema.sql")
        tables = parse_schema(sp)
        enums = ENUMS.get(ds, {})
        for t in tables:
            for c in t["columns"]:
                key = f"{t['name']}.{c['name']}"
                if key in enums:
                    c["enum"] = enums[key]
        out = os.path.join(SCHEMA_DIR, ds, "meta.yaml")
        import yaml
        with open(out, "w", encoding="utf-8") as f:
            yaml.safe_dump({"dataset": ds, "tables": tables},
                           f, allow_unicode=True, sort_keys=False)
        print(f"{ds}: {len(tables)} 表 -> {out}")


if __name__ == "__main__":
    main()
