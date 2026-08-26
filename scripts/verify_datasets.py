"""数据地基自检：抽样验证埋坑规范与 A/B 差异真实存在。

用法：
    python scripts/verify_datasets.py

仅对 A 库做详尽断言；B 库仅核对「规模/分布与 A 不同」以保证反作弊有效。
连接以 read_only 打开，不触碰数据。
"""
from __future__ import annotations

import os

import duckdb

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data", "duckdb")

results: list[tuple[str, bool, str]] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    results.append((name, cond, detail))
    mark = "PASS" if cond else "FAIL"
    print(f"[{mark}] {name} {detail}")


def q1(con, sql):
    return con.execute(sql).fetchone()[0]


# ---------------- shop_a ----------------
con = duckdb.connect(os.path.join(DATA, "shop_a.duckdb"), read_only=True)

check("shop: 未支付订单 pay_time 为 NULL",
      q1(con, "SELECT COUNT(*) FROM orders WHERE pay_time IS NULL") > 0)
check("shop: 用户渠道/城市存在 NULL（埋坑）",
      q1(con, "SELECT COUNT(*) FROM users WHERE register_channel_id IS NULL") > 0
      and q1(con, "SELECT COUNT(*) FROM users WHERE city_id IS NULL") > 0)
check("shop: 埋点 product_id 存在 NULL（非商品事件）",
      q1(con, "SELECT COUNT(*) FROM events WHERE product_id IS NULL") > 0)
st = dict(con.execute("SELECT status, COUNT(*) FROM orders GROUP BY 1").fetchall())
check("shop: 含 cancelled / refunded 状态",
      "cancelled" in st and "refunded" in st, str(st))
check("shop: refunds 表非空", q1(con, "SELECT COUNT(*) FROM refunds") > 0)
dup = q1(con, "SELECT COUNT(*) FROM ("
            "SELECT user_id, event_time, event_name FROM events "
            "GROUP BY 1,2,3 HAVING COUNT(*) > 1) t")
check("shop: 存在重复事件（同 user/同秒/同事件）", dup > 0, f"重复组={dup}")
miss = q1(con, "SELECT COUNT(*) FROM orders "
              "WHERE CAST(order_time AS DATE) = DATE '2024-02-10'")
check("shop: 缺失日期 2024-02-10 无订单", miss == 0,
      f"该日订单数={miss}")
check("shop: dim_date 含 2024-02-10（空洞存在）",
      q1(con, "SELECT COUNT(*) FROM dim_date WHERE date_key = DATE '2024-02-10'") == 1)
tie = con.execute(
    "SELECT product_id, SUM(item_amount) s FROM order_items "
    "WHERE product_id IN (1,2) GROUP BY 1 ORDER BY 1").fetchall()
check("shop: 商品 1 与 2 销售额并列（DENSE_RANK 训练）",
      len(tie) == 2 and abs(tie[0][1] - tie[1][1]) < 0.01, str(tie))
yrs = set(r[0] for r in con.execute(
    "SELECT DISTINCT EXTRACT(year FROM order_time) FROM orders").fetchall())
check("shop: 跨年边界（2024 与 2025 都有订单）",
      2024 in yrs and 2025 in yrs, str(sorted(yrs)))
check("shop: 极端值 订单1 pay_amount=999999",
      q1(con, "SELECT pay_amount FROM orders WHERE order_id=1") == 999999.0)
con.close()

# ---------------- feed_a ----------------
con = duckdb.connect(os.path.join(DATA, "feed_a.duckdb"), read_only=True)
check("feed: 埋点 content_id 存在 NULL（follow/impression）",
      q1(con, "SELECT COUNT(*) FROM events WHERE content_id IS NULL") > 0)
dupf = q1(con, "SELECT COUNT(*) FROM ("
             "SELECT user_id, event_time, event_name FROM events "
             "GROUP BY 1,2,3 HAVING COUNT(*) > 1) t")
check("feed: 存在重复事件", dupf > 0, f"重复组={dupf}")
check("feed: 用户2 全部埋点已删除（注册即流失边界）",
      q1(con, "SELECT COUNT(*) FROM events WHERE user_id=2") == 0)
check("feed: 极端值 单用户单日 5000 分钟活跃",
      q1(con, "SELECT COUNT(*) FROM daily_active WHERE active_minutes=5000") > 0)
missf = q1(con, "SELECT COUNT(*) FROM events "
               "WHERE CAST(event_time AS DATE) = DATE '2024-03-15'")
check("feed: 缺失日期 2024-03-15 无事件", missf == 0)
con.close()

# ---------------- saas_a ----------------
con = duckdb.connect(os.path.join(DATA, "saas_a.duckdb"), read_only=True)
check("saas: 极端值 订阅1 mrr=999999",
      q1(con, "SELECT mrr FROM subscriptions WHERE sub_id=1") == 999999.0)
churn = q1(con, "SELECT COUNT(*) FROM subscriptions "
               "WHERE status='churned' AND end_date IS NOT NULL")
check("saas: churned 订阅有 end_date", churn > 0, f"churned+end_date={churn}")
missi = q1(con, "SELECT COUNT(*) FROM invoices "
               "WHERE bill_date = DATE '2024-04-20'")
check("saas: 缺失日期 2024-04-20 无账单", missi == 0)
conv = dict(con.execute(
    "SELECT converted, COUNT(*) FROM trial_conversion GROUP BY 1").fetchall())
check("saas: trial_conversion 含已转化/未转化",
      True in conv and False in conv, str(conv))
con.close()

# ---------------- A / B 差异（反作弊基础） ----------------
ca = duckdb.connect(os.path.join(DATA, "shop_a.duckdb"), read_only=True)
cb = duckdb.connect(os.path.join(DATA, "shop_b.duckdb"), read_only=True)
na = q1(ca, "SELECT COUNT(*) FROM orders")
nb = q1(cb, "SELECT COUNT(*) FROM orders")
check("shop: A/B 库订单规模不同（防硬编码）", na != nb, f"A={na} B={nb}")
sum_a = q1(ca, "SELECT ROUND(SUM(pay_amount),2) FROM orders")
sum_b = q1(cb, "SELECT ROUND(SUM(pay_amount),2) FROM orders")
check("shop: A/B 库总实付金额不同", abs(sum_a - sum_b) > 1, f"A={sum_a} B={sum_b}")
ca.close(); cb.close()

# ---------------- 汇总 ----------------
failed = [r for r in results if not r[1]]
print("\n" + ("=" * 40))
if not failed:
    print(f"ALL CHECKS PASSED ({len(results)} assertions)")
else:
    print(f"{len(failed)} CHECK(S) FAILED:")
    for n, _, d in failed:
        print(f"  - {n} {d}")
    raise SystemExit(1)
