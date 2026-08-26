"""电商交易数据集生成器（shop）。

generate(con, seed, scale) 在给定 DuckDB 连接中建好全部表并灌入数据。
A 库 seed=42 / scale=1.0；B 库 seed=20260806 / scale=0.85（规模与分布都不同，
确保硬编码答案必然在 B 库失败）。命名与口径模拟 MySQL 环境。
"""
from __future__ import annotations

import datetime as dt
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _common import build_dim_date_rows, date_range_days, load_table, rng  # noqa: E402

# 刻意制造"数据缺失日期"——这些日期完全没有订单与埋点，考察 LEFT JOIN dim_date 补全。
MISSING_DATES = [dt.date(2024, 2, 10), dt.date(2024, 7, 15),
                 dt.date(2025, 3, 8), dt.date(2025, 11, 22)]

CAT_L1 = ["手机", "电脑", "家电", "服饰", "美妆", "食品"]
CAT_L2 = {
    "手机": ["旗舰机", "中端机", "入门机"],
    "电脑": ["笔记本", "台式机", "平板"],
    "家电": ["电视", "冰箱", "洗衣机", "空调"],
    "服饰": ["男装", "女装", "运动"],
    "美妆": ["护肤", "彩妆", "香水"],
    "食品": ["零食", "饮品", "生鲜"],
}
BRANDS = {
    "手机": ["Huawei", "Xiaomi", "OPPO", "vivo", "Apple"],
    "电脑": ["Lenovo", "Dell", "HP", "Apple", "ASUS"],
    "家电": ["Haier", "Midea", "Gree", "Sony", "Hisense"],
    "服饰": ["Uniqlo", "Nike", "Adidas", "Zara", "LiNing"],
    "美妆": ["L'Oreal", "Estee", "Pechoin", "Winona", "Armani"],
    "食品": ["Mengniu", "Yili", "ThreeSquirrels", "Cofco", "MasterKong"],
}
PRICE_RANGE = {
    "手机": (2000, 8000), "电脑": (3000, 12000), "家电": (1000, 8000),
    "服饰": (50, 800), "美妆": (80, 1200), "食品": (5, 200),
}

CITIES = [
    ("北京", "北京", "north", 1), ("上海", "上海", "east", 1), ("广州", "广东", "south", 1),
    ("深圳", "广东", "south", 1), ("杭州", "浙江", "east", 1), ("成都", "四川", "west", 1),
    ("重庆", "重庆", "west", 1), ("武汉", "湖北", "central", 1), ("西安", "陕西", "west", 2),
    ("南京", "江苏", "east", 2), ("苏州", "江苏", "east", 2), ("天津", "天津", "north", 2),
    ("长沙", "湖南", "central", 2), ("郑州", "河南", "central", 2), ("青岛", "山东", "east", 2),
    ("沈阳", "辽宁", "north", 2), ("大连", "辽宁", "north", 2), ("厦门", "福建", "east", 2),
    ("福州", "福建", "east", 2), ("济南", "山东", "east", 2), ("合肥", "安徽", "central", 2),
    ("昆明", "云南", "west", 3), ("贵阳", "贵州", "west", 3), ("南宁", "广西", "south", 3),
    ("海口", "海南", "south", 3), ("兰州", "甘肃", "west", 3), ("太原", "山西", "north", 3),
    ("石家庄", "河北", "north", 3), ("哈尔滨", "黑龙江", "north", 3), ("长春", "吉林", "north", 3),
    ("南昌", "江西", "central", 3), ("温州", "浙江", "east", 3), ("东莞", "广东", "south", 3),
    ("佛山", "广东", "south", 3), ("无锡", "江苏", "east", 3), ("宁波", "浙江", "east", 2),
    ("常州", "江苏", "east", 3), ("珠海", "广东", "south", 3), ("中山", "广东", "south", 3),
    ("惠州", "广东", "south", 3), ("嘉兴", "浙江", "east", 3), ("泉州", "福建", "east", 3),
    ("烟台", "山东", "east", 3), ("潍坊", "山东", "east", 3), ("保定", "河北", "north", 3),
]


def _build_city_df() -> pd.DataFrame:
    rows = [
        {"city_id": i + 1, "city_name": c[0], "province": c[1],
         "region": c[2], "city_tier": c[3]}
        for i, c in enumerate(CITIES)
    ]
    return pd.DataFrame(rows)


def _build_product_df(r: np.random.Generator, n: int) -> pd.DataFrame:
    rows = []
    launch_lo = dt.date(2023, 1, 1).toordinal()
    launch_hi = dt.date(2025, 6, 30).toordinal()
    for i in range(1, n + 1):
        cat = CAT_L1[(i - 1) % len(CAT_L1)]
        sub = CAT_L2[cat][(i - 1) % len(CAT_L2[cat])]
        brand = BRANDS[cat][(i - 1) % len(BRANDS[cat])]
        lo, hi = PRICE_RANGE[cat]
        price = round(float(r.integers(lo, hi)) * r.uniform(0.9, 1.1), 2)
        launch = dt.date.fromordinal(int(r.integers(launch_lo, launch_hi)))
        is_new = launch >= (dt.date(2025, 12, 31) - dt.timedelta(days=180))
        rows.append({
            "product_id": i,
            "product_name": f"{brand} {sub} {i}",
            "cat_l1": cat,
            "cat_l2": sub,
            "brand": brand,
            "list_price": price,
            "launch_date": launch,
            "is_new": bool(is_new),
        })
    return pd.DataFrame(rows)


def generate(con, seed: int = 42, scale: float = 1.0) -> None:
    r = rng(seed)
    n_products = int(2000 * scale)
    n_cities = len(CITIES)
    n_users = int(30000 * scale)
    n_orders = int(200000 * scale)
    n_events = int(1200000 * scale)

    # ----- dim_date（完整连续，含缺失日期的"空洞"由采样避开） -----
    dd = pd.DataFrame(build_dim_date_rows())
    load_table(con, "dim_date", dd,
               date_cols=["date_key", "last_year_same_date", "prev_month_date"])

    # ----- dim_channel / dim_city / dim_product -----
    channels = pd.DataFrame([
        {"channel_id": 1, "channel_name": "App Store", "channel_type": "app"},
        {"channel_id": 2, "channel_name": "官网", "channel_type": "web"},
        {"channel_id": 3, "channel_name": "天猫旗舰店", "channel_type": "web"},
        {"channel_id": 4, "channel_name": "线下门店", "channel_type": "offline"},
        {"channel_id": 5, "channel_name": "微信小程序", "channel_type": "mini_program"},
        {"channel_id": 6, "channel_name": "抖音小店", "channel_type": "mini_program"},
    ])
    load_table(con, "dim_channel", channels)
    load_table(con, "dim_city", _build_city_df())
    products = _build_product_df(r, n_products)
    load_table(con, "dim_product", products, date_cols=["launch_date"])

    # ----- 有效日期集合（剔除缺失日期） -----
    all_days = np.array(date_range_days(), dtype="datetime64[D]")
    missing = np.array(MISSING_DATES, dtype="datetime64[D]")
    valid_days = np.setdiff1d(all_days, missing)

    def sample_ts(size: int, seconds: bool = True) -> np.ndarray:
        day = valid_days[r.integers(0, len(valid_days), size)]
        if seconds:
            off = r.integers(0, 86400, size).astype("timedelta64[s]")
            return (day.astype("datetime64[s]") + off).astype("datetime64[s]")
        return day.astype("datetime64[s]")

    # ----- users -----
    reg_days = sample_ts(n_users, seconds=False)
    users = pd.DataFrame({
        "user_id": np.arange(1, n_users + 1),
        "register_date": reg_days,
        "register_channel_id": pd.array(
            [None if x else int(y) for x, y in zip(
                r.random(n_users) < 0.03, r.integers(1, 7, n_users))],
            dtype="Int64"),
        "city_id": pd.array(
            [None if x else int(y) for x, y in zip(
                r.random(n_users) < 0.03, r.integers(1, n_cities + 1, n_users))],
            dtype="Int64"),
        "gender": r.choice(["M", "F", "U"], size=n_users, p=[0.45, 0.45, 0.10]),
        "age_band": r.choice(["18-25", "26-35", "36-45", "46-55", "55+"], size=n_users,
                             p=[0.25, 0.35, 0.22, 0.12, 0.06]),
    })
    load_table(con, "users", users, date_cols=["register_date"])

    # ----- orders（先生成行级字段，金额由明细聚合得到） -----
    status = r.choice(
        ["completed", "shipped", "paid", "created", "cancelled", "refunded"],
        size=n_orders, p=[0.50, 0.15, 0.10, 0.12, 0.08, 0.05])
    order_user = r.integers(1, n_users + 1, n_orders)
    order_time = sample_ts(n_orders)
    order_channel = r.integers(1, 7, n_orders)

    # ----- order_items（向量化展开） -----
    n_items_per = r.integers(1, 6, size=n_orders)  # 1..5
    total_items = int(n_items_per.sum())
    item_order = np.repeat(np.arange(1, n_orders + 1), n_items_per)
    prev = np.zeros(n_orders, dtype=int)
    prev[1:] = np.cumsum(n_items_per)[:-1]
    item_seq = (np.arange(total_items) - np.repeat(prev, n_items_per)) + 1
    item_product = r.integers(1, n_products + 1, total_items)
    item_qty = r.integers(1, 6, total_items)
    base_price = products["list_price"].to_numpy()
    unit_price = np.round(base_price[item_product - 1] * r.uniform(0.7, 1.0, total_items), 2)
    item_amount = np.round(item_qty * unit_price, 2)

    order_total = np.bincount(item_order, weights=item_amount, minlength=n_orders + 1)[1:]
    discount = np.round(order_total * r.uniform(0.0, 0.10, n_orders), 2)
    pay_null = (status == "created") | ((status == "cancelled") & (r.random(n_orders) < 0.5))
    pay_amount = np.where(pay_null, 0.0, np.round(order_total - discount, 2))
    pay_time = np.where(
        pay_null,
        pd.NaT,
        (order_time + r.integers(0, 3 * 86400, n_orders).astype("timedelta64[s]"))
        .astype("datetime64[s]"))

    orders = pd.DataFrame({
        "order_id": np.arange(1, n_orders + 1),
        "user_id": order_user,
        "order_time": order_time,
        "pay_time": pay_time,
        "status": status,
        "channel_id": order_channel,
        "total_amount": np.round(order_total, 2),
        "discount_amount": discount,
        "pay_amount": pay_amount,
    })
    load_table(con, "orders", orders, ts_cols=["order_time", "pay_time"])

    items = pd.DataFrame({
        "order_id": item_order,
        "item_seq": item_seq,
        "product_id": item_product,
        "qty": item_qty,
        "unit_price": unit_price,
        "item_amount": item_amount,
    })
    load_table(con, "order_items", items)

    # ----- refunds（仅对 refunded 订单） -----
    ref_mask = status == "refunded"
    ref_order_ids = np.where(ref_mask)[0] + 1
    if len(ref_order_ids) > 0:
        rpay = pay_amount[ref_mask]
        refund_amount = np.round(rpay * r.uniform(0.5, 1.0, len(ref_order_ids)), 2)
        refunds = pd.DataFrame({
            "refund_id": np.arange(1, len(ref_order_ids) + 1),
            "order_id": ref_order_ids,
            "refund_time": (order_time[ref_mask]
                            + r.integers(1, 10, len(ref_order_ids)).astype("timedelta64[D]")
                            ).astype("datetime64[s]"),
            "refund_amount": refund_amount,
            "reason": r.choice(["质量问题", "七天无理由", "发错货", "其他"],
                               size=len(ref_order_ids), p=[0.3, 0.4, 0.15, 0.15]),
        })
        load_table(con, "refunds", refunds, ts_cols=["refund_time"])

    # ----- events（埋点，含重复事件与缺失日期空洞） -----
    ev_user = r.integers(1, n_users + 1, n_events)
    ev_name = r.choice(
        ["view_home", "view_product", "add_cart", "submit_order", "pay_success"],
        size=n_events, p=[0.30, 0.30, 0.20, 0.12, 0.08])
    ev_time = sample_ts(n_events)
    sess = r.integers(1, 100000, n_events)
    session_id = np.array([f"{u}-{s}" for u, s in zip(ev_user, sess)], dtype=object)

    page_map = {"view_home": "home", "view_product": "product_detail",
                "add_cart": "cart", "submit_order": "checkout", "pay_success": "pay_result"}
    page = np.array([page_map[n] for n in ev_name], dtype=object)
    page[r.random(n_events) < 0.05] = None  # 部分事件无 page

    is_product_evt = np.isin(ev_name, ["view_product", "add_cart", "submit_order", "pay_success"])
    product_id = np.where(is_product_evt, r.integers(1, n_products + 1, n_events), None)
    product_id = pd.array(product_id.tolist(), dtype="Int64")
    channel_id = pd.array(
        [None if x else int(y) for x, y in zip(
            r.random(n_events) < 0.10, r.integers(1, 7, n_events))],
        dtype="Int64")

    events = pd.DataFrame({
        "event_id": np.arange(1, n_events + 1),
        "user_id": ev_user,
        "session_id": session_id,
        "event_time": ev_time,
        "event_name": ev_name,
        "page": page,
        "product_id": product_id,
        "channel_id": channel_id,
    })
    load_table(con, "events", events, ts_cols=["event_time"])

    # ----- 埋坑后处理（用真实 SQL 在已建表上调整） -----
    # 1) 极端值：单笔巨额订单（先加，避免干扰下面的并列对齐）
    con.execute(
        "UPDATE orders SET total_amount=999999.00, discount_amount=0, "
        "pay_amount=999999.00, status='completed' WHERE order_id=1")
    con.execute(
        "INSERT INTO order_items VALUES (1, 99, 1, 1, 999999.00, 999999.00)")

    # 2) 销售额并列：让 product 1 与 2 总额相等（训练 DENSE_RANK 并列）
    #    必须在极端值之后计算，确保两者最终一致
    tie = con.execute(
        "SELECT product_id, SUM(item_amount) s FROM order_items "
        "WHERE product_id IN (1,2) GROUP BY 1 ORDER BY 1").fetchall()
    if len(tie) == 2:
        hi = max(tie[0][1], tie[1][1])
        lo = min(tie[0][1], tie[1][1])
        diff = hi - lo
        smaller = tie[0][0] if tie[0][1] < tie[1][1] else tie[1][0]
        oid = con.execute(
            f"SELECT order_id FROM order_items WHERE product_id={smaller} LIMIT 1").fetchone()[0]
        con.execute(
            f"INSERT INTO order_items VALUES ({oid}, 99, {smaller}, 1, "
            f"{diff:.2f}, {diff:.2f})")

    # 3) 注册当天即流失用户：删除该用户全部埋点（留存边界 case）
    con.execute("DELETE FROM events WHERE user_id=2")

    # 4) 重复事件：复制 ~1% 的事件行，制造同 user/同秒/同事件 的重复
    dup = con.execute(
        "SELECT * FROM events ORDER BY event_id LIMIT "
        "CAST((SELECT COUNT(*) FROM events) * 0.01 AS INTEGER)").fetchdf()
    if len(dup) > 0:
        max_id = con.execute("SELECT MAX(event_id) FROM events").fetchone()[0]
        dup = dup.copy()
        dup["event_id"] = np.arange(max_id + 1, max_id + 1 + len(dup))
        con.register("_dup", dup)
        con.execute("INSERT INTO events SELECT * FROM _dup")
        con.unregister("_dup")
