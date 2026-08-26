"""SaaS 订阅数据集生成器（saas）。

generate(con, seed, scale) 在给定 DuckDB 连接中建好全部表并灌入数据。
A 库 seed=42 / scale=1.0；B 库 seed=20260806 / scale=0.85。
强项场景：同环比、留存（续费）、多维聚合。
"""
from __future__ import annotations

import datetime as dt
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _common import (  # noqa: E402
    DATE_END,
    build_dim_date_rows,
    load_table,
    rng,
    sample_ts,
    valid_days_excluding,
)

MISSING_DATES = [dt.date(2024, 4, 20), dt.date(2024, 10, 10),
                 dt.date(2025, 6, 15), dt.date(2025, 9, 30)]

INDUSTRIES = ["SaaS", "Ecommerce", "Finance", "Education", "Healthcare",
              "Manufacturing", "Media"]
SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"]
PLAN_BASE = {"free": 0, "starter": 99, "pro": 499, "enterprise": 1999}
PLAN_SEATS = {"free": (1, 3), "starter": (3, 10), "pro": (10, 50), "enterprise": (50, 500)}
FEATURES = ["dashboard", "report", "export", "api", "invite", "billing", "search"]


def generate(con, seed: int = 42, scale: float = 1.0) -> None:
    r = rng(seed)
    n_accounts = int(5000 * scale)
    n_users = int(20000 * scale)
    n_sub = int(6000 * scale)
    n_invoices = int(30000 * scale)
    n_usage = int(500000 * scale)
    valid = valid_days_excluding(MISSING_DATES)

    # ----- dim_date / accounts -----
    dd = pd.DataFrame(build_dim_date_rows())
    load_table(con, "dim_date", dd,
               date_cols=["date_key", "last_year_same_date", "prev_month_date"])

    accounts = pd.DataFrame({
        "account_id": np.arange(1, n_accounts + 1),
        "signup_date": sample_ts(r, valid, n_accounts, seconds=False),
        "industry": r.choice(INDUSTRIES, size=n_accounts),
        "company_size": r.choice(SIZES, size=n_accounts,
                                 p=[0.30, 0.30, 0.22, 0.13, 0.05]),
        "source_channel": r.choice(["ads", "referral", "organic", "event"],
                                   size=n_accounts, p=[0.35, 0.20, 0.30, 0.15]),
    })
    load_table(con, "accounts", accounts, date_cols=["signup_date"])

    # ----- users（成员） -----
    members = pd.DataFrame({
        "user_id": np.arange(1, n_users + 1),
        "account_id": r.integers(1, n_accounts + 1, n_users),
        "join_date": sample_ts(r, valid, n_users, seconds=False),
        "role": r.choice(["owner", "admin", "member"], size=n_users,
                         p=[0.10, 0.20, 0.70]),
    })
    load_table(con, "users", members, date_cols=["join_date"])

    # ----- subscriptions -----
    sub_account = r.integers(1, n_accounts + 1, n_sub)
    plan = r.choice(["free", "starter", "pro", "enterprise"],
                    size=n_sub, p=[0.20, 0.30, 0.35, 0.15])
    status = r.choice(
        ["trialing", "active", "past_due", "churned", "upgraded", "downgraded"],
        size=n_sub, p=[0.15, 0.45, 0.10, 0.20, 0.05, 0.05])
    seats = np.array([int(r.integers(*PLAN_SEATS[p])) for p in plan])
    start_date = sample_ts(r, valid, n_sub, seconds=False).astype("datetime64[D]")
    is_trial = status == "trialing"
    base = np.array([PLAN_BASE[p] for p in plan])
    mrr = np.where(is_trial, 0.0,
                   np.round(base * np.maximum(1.0, seats / 10.0), 2))

    # end_date：仅 churned 有值，且不超过窗口末
    end_list = []
    for i in range(n_sub):
        if status[i] == "churned":
            d = start_date[i] + np.timedelta64(int(r.integers(30, 400)), "D")
            if d > np.datetime64(DATE_END):
                d = np.datetime64(DATE_END)
            end_list.append(d.astype("datetime64[D]").tolist())
        else:
            end_list.append(None)
    subscriptions = pd.DataFrame({
        "sub_id": np.arange(1, n_sub + 1),
        "account_id": sub_account,
        "plan": plan,
        "seats": seats,
        "start_date": start_date.astype("datetime64[D]").tolist(),
        "end_date": end_list,
        "mrr": mrr,
        "status": status,
        "is_trial": is_trial,
    })
    load_table(con, "subscriptions", subscriptions,
               date_cols=["start_date", "end_date"])

    # ----- invoices -----
    inv_account = r.integers(1, n_accounts + 1, n_invoices)
    bill_date = sample_ts(r, valid, n_invoices, seconds=False).astype("datetime64[D]")
    amount = np.round(r.uniform(50, 5000, n_invoices), 2)
    paid = r.random(n_invoices) < 0.90
    pay_list = []
    for i in range(n_invoices):
        if paid[i]:
            d = bill_date[i] + np.timedelta64(int(r.integers(1, 10)), "D")
            if d > np.datetime64(DATE_END):
                d = np.datetime64(DATE_END)
            pay_list.append(d.astype("datetime64[D]").tolist())
        else:
            pay_list.append(None)
    invoices = pd.DataFrame({
        "invoice_id": np.arange(1, n_invoices + 1),
        "account_id": inv_account,
        "bill_date": bill_date.astype("datetime64[D]").tolist(),
        "amount": amount,
        "paid": paid,
        "pay_date": pay_list,
    })
    load_table(con, "invoices", invoices, date_cols=["bill_date", "pay_date"])

    # ----- feature_usage -----
    usage = pd.DataFrame({
        "log_id": np.arange(1, n_usage + 1),
        "account_id": r.integers(1, n_accounts + 1, n_usage),
        "user_id": r.integers(1, n_users + 1, n_usage),
        "use_time": sample_ts(r, valid, n_usage, seconds=True),
        "feature_code": r.choice(FEATURES, size=n_usage),
    })
    load_table(con, "feature_usage", usage, ts_cols=["use_time"])

    # ----- trial_conversion（每账号一条） -----
    trial_start = (accounts["signup_date"].to_numpy().astype("datetime64[D]")
                   + np.timedelta64(2, "D"))
    trial_end = trial_start + np.timedelta64(14, "D")
    converted = r.random(n_accounts) < 0.40
    convert_list = []
    for i in range(n_accounts):
        convert_list.append(trial_end[i].astype("datetime64[D]").tolist()
                            if converted[i] else None)
    trial = pd.DataFrame({
        "account_id": np.arange(1, n_accounts + 1),
        "trial_start": trial_start.astype("datetime64[D]").tolist(),
        "trial_end": trial_end.astype("datetime64[D]").tolist(),
        "converted": converted,
        "convert_date": convert_list,
    })
    load_table(con, "trial_conversion", trial,
               date_cols=["trial_start", "trial_end", "convert_date"])

    # ----- 埋坑后处理 -----
    con.execute(
        "UPDATE subscriptions SET mrr=999999.00 WHERE sub_id=1")
    con.execute(
        f"UPDATE invoices SET amount=999999.00 WHERE invoice_id=1")
    con.execute("DELETE FROM feature_usage WHERE user_id=2")

    dup = con.execute(
        "SELECT * FROM feature_usage ORDER BY log_id LIMIT "
        "CAST((SELECT COUNT(*) FROM feature_usage) * 0.01 AS INTEGER)").fetchdf()
    if len(dup) > 0:
        max_id = con.execute("SELECT MAX(log_id) FROM feature_usage").fetchone()[0]
        dup = dup.copy()
        dup["log_id"] = np.arange(max_id + 1, max_id + 1 + len(dup))
        con.register("_dup", dup)
        con.execute("INSERT INTO feature_usage SELECT * FROM _dup")
        con.unregister("_dup")
