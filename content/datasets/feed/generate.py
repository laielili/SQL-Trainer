"""内容社区数据集生成器（feed）。

generate(con, seed, scale) 在给定 DuckDB 连接中建好全部表并灌入数据。
A 库 seed=42 / scale=1.0；B 库 seed=20260806 / scale=0.85。
强项场景：留存、漏斗、窗口排序。
"""
from __future__ import annotations

import datetime as dt
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _common import (  # noqa: E402
    build_dim_date_rows,
    load_table,
    rng,
    sample_ts,
    valid_days_excluding,
)

MISSING_DATES = [dt.date(2024, 3, 15), dt.date(2024, 9, 1),
                 dt.date(2025, 5, 20), dt.date(2025, 12, 1)]

TOPICS = [
    ("娱乐", 6), ("知识", 5), ("游戏", 4), ("美食", 4),
    ("旅行", 3), ("财经", 3), ("健身", 2), ("科技", 3),
]
CONTENT_TYPES = ["short_video", "article", "live", "image"]
EVENT_DIST = (["impression", "click", "play", "finish", "like", "comment", "share", "follow"],
              [0.35, 0.25, 0.15, 0.10, 0.07, 0.04, 0.02, 0.02])


def generate(con, seed: int = 42, scale: float = 1.0) -> None:
    r = rng(seed)
    n_users = int(50000 * scale)
    n_contents = int(2000 * scale)
    n_events = int(2000000 * scale)
    n_daily = int(1500000 * scale)

    valid = valid_days_excluding(MISSING_DATES)

    # ----- dim_date / topics -----
    dd = pd.DataFrame(build_dim_date_rows())
    load_table(con, "dim_date", dd,
               date_cols=["date_key", "last_year_same_date", "prev_month_date"])

    topic_rows = []
    tid = 1
    for cat, n in TOPICS:
        for i in range(n):
            topic_rows.append({"topic_id": tid, "topic_name": f"{cat}话题{tid}", "category": cat})
            tid += 1
    load_table(con, "topics", pd.DataFrame(topic_rows))
    n_topics = len(topic_rows)

    # ----- users -----
    reg_days = sample_ts(r, valid, n_users, seconds=False)
    users = pd.DataFrame({
        "user_id": np.arange(1, n_users + 1),
        "register_date": reg_days,
        "register_channel": r.choice(
            ["app", "web", "mini_program", "ad", "organic"],
            size=n_users, p=[0.30, 0.15, 0.25, 0.15, 0.15]),
        "city_tier": r.choice([1, 2, 3, 4], size=n_users, p=[0.15, 0.35, 0.30, 0.20]),
        "is_creator": r.random(n_users) < 0.10,
    })
    load_table(con, "users", users, date_cols=["register_date"])

    # ----- contents -----
    pub_time = sample_ts(r, valid, n_contents)
    contents = pd.DataFrame({
        "content_id": np.arange(1, n_contents + 1),
        "author_id": r.integers(1, n_users + 1, n_contents),
        "publish_time": pub_time,
        "topic_id": r.integers(1, n_topics + 1, n_contents),
        "content_type": r.choice(CONTENT_TYPES, size=n_contents,
                                  p=[0.45, 0.25, 0.15, 0.15]),
        "duration_sec": r.integers(15, 3600, n_contents),
    })
    load_table(con, "contents", contents, ts_cols=["publish_time"])

    # ----- events -----
    ev_user = r.integers(1, n_users + 1, n_events)
    ev_name = r.choice(EVENT_DIST[0], size=n_events, p=EVENT_DIST[1])
    ev_time = sample_ts(r, valid, n_events)
    sess = r.integers(1, 100000, n_events)
    session_id = np.array([f"{u}-{s}" for u, s in zip(ev_user, sess)], dtype=object)

    has_content = np.isin(ev_name, ["click", "play", "finish", "like", "comment", "share"])
    content_id = pd.array(
        np.where(has_content, r.integers(1, n_contents + 1, n_events), None).tolist(),
        dtype="Int64")
    has_stay = np.isin(ev_name, ["play", "finish"])
    stay_sec = pd.array(
        np.where(has_stay, r.integers(3, 1800, n_events), None).tolist(),
        dtype="Int64")

    events = pd.DataFrame({
        "event_id": np.arange(1, n_events + 1),
        "user_id": ev_user,
        "session_id": session_id,
        "event_time": ev_time,
        "event_name": ev_name,
        "content_id": content_id,
        "stay_sec": stay_sec,
    })
    load_table(con, "events", events, ts_cols=["event_time"])

    # ----- daily_active -----
    # 一部分是"注册当日新增活跃"，其余是随机活跃快照
    n_new = int(n_daily * 0.15)
    n_other = n_daily - n_new
    new_rows = pd.DataFrame({
        "stat_date": users["register_date"].to_numpy()[r.integers(0, n_users, n_new)],
        "user_id": r.integers(1, n_users + 1, n_new),
        "active_minutes": r.integers(1, 600, n_new),
        "is_new": True,
    })
    other_rows = pd.DataFrame({
        "stat_date": sample_ts(r, valid, n_other, seconds=False),
        "user_id": r.integers(1, n_users + 1, n_other),
        "active_minutes": r.integers(1, 600, n_other),
        "is_new": False,
    })
    daily = pd.concat([new_rows, other_rows], ignore_index=True)
    load_table(con, "daily_active", daily, date_cols=["stat_date"])

    # ----- 埋坑后处理 -----
    # 1) 重复事件：复制 ~1% 行制造同 user/同秒/同事件重复
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

    # 2) 注册当天即流失用户：删除该用户全部埋点（留存边界 case）
    con.execute("DELETE FROM events WHERE user_id=2")
    con.execute("DELETE FROM daily_active WHERE user_id=2")

    # 3) 极端值：单用户单日 5000 分钟活跃（数据异常点）
    if n_daily > 0:
        d0 = con.execute("SELECT MIN(stat_date) FROM daily_active").fetchone()[0]
        con.execute(
            f"INSERT INTO daily_active VALUES (DATE '{d0}', 2, 5000, FALSE)")
