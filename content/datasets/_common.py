"""Common helpers for dataset generation (pure Python + numpy + pandas).

These helpers build tables into a DuckDB connection using CTAS with explicit
type casting, so the stored schema matches the MySQL-flavoured naming and the
DATE/TIMESTAMP distinction that the training questions rely on.
"""
from __future__ import annotations

import calendar
import datetime as dt
from typing import Iterable

import numpy as np
import pandas as pd

# Unified two-year window so year-over-year is always computable.
DATE_START = dt.date(2024, 1, 1)
DATE_END = dt.date(2025, 12, 31)


def date_range_days() -> list[dt.date]:
    d = DATE_START
    out: list[dt.date] = []
    while d <= DATE_END:
        out.append(d)
        d += dt.timedelta(days=1)
    return out


def prev_month_date(d: dt.date) -> dt.date:
    y, m = d.year, d.month
    if m == 1:
        y, m = y - 1, 12
    else:
        m -= 1
    last = calendar.monthrange(y, m)[1]
    return dt.date(y, m, min(d.day, last))


def build_dim_date_rows() -> list[dict]:
    """Full contiguous date dimension 2024-01-01 .. 2025-12-31 (731 rows)."""
    # A handful of fixed holidays; the gaps are what make LEFT JOIN dim_date
    # meaningful in growth/retention questions.
    holidays = {
        (1, 1), (5, 1), (10, 1), (12, 25),
        (2, 10), (2, 11), (2, 12), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17),
    }
    rows = []
    for d in date_range_days():
        iso = d.isocalendar()
        y, w, dow = iso[0], iso[1], iso[2]
        last_year = (
            dt.date(d.year - 1, 3, 1)
            if (d.month == 2 and d.day == 29)
            else d.replace(year=d.year - 1)
        )
        rows.append(
            {
                "date_key": d,
                "y": y,
                "q": (d.month - 1) // 3 + 1,
                "m": d.month,
                "w": y * 100 + w,
                "dow": dow,
                "is_weekend": dow >= 6,
                "is_holiday": (d.month, d.day) in holidays,
                "last_year_same_date": last_year,
                "prev_month_date": prev_month_date(d),
            }
        )
    return rows


def load_table(
    con,
    name: str,
    data: pd.DataFrame,
    date_cols: Iterable[str] = (),
    ts_cols: Iterable[str] = (),
) -> None:
    """Create-or-replace a DuckDB table from a DataFrame with explicit typing.

    date_cols are cast to DATE, ts_cols to TIMESTAMP; everything else keeps its
    inferred type. No primary/foreign keys are materialised (data integrity is
    guaranteed by the generator), which keeps bulk inserts fast.
    """
    df = data.copy()
    date_cols = list(date_cols)
    ts_cols = list(ts_cols)
    for c in date_cols + ts_cols:
        df[c] = pd.to_datetime(df[c])
    view = f"_df_{name}"
    con.register(view, df)
    casts = []
    for c in df.columns:
        if c in date_cols:
            casts.append(f"CAST({c} AS DATE) AS {c}")
        elif c in ts_cols:
            casts.append(f"CAST({c} AS TIMESTAMP) AS {c}")
        else:
            casts.append(c)
    con.execute(
        f"CREATE OR REPLACE TABLE {name} AS SELECT {', '.join(casts)} FROM {view}"
    )
    con.unregister(view)


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def valid_days_excluding(missing: list[dt.date]) -> np.ndarray:
    """All calendar days in the window minus the explicitly-missing ones."""
    all_days = np.array(date_range_days(), dtype="datetime64[D]")
    miss = np.array(missing, dtype="datetime64[D]")
    return np.setdiff1d(all_days, miss)


def sample_ts(
    r: np.random.Generator, valid_days: np.ndarray, size: int, seconds: bool = True
) -> np.ndarray:
    """Sample timestamps whose date part comes only from valid_days.

    When seconds=True the time-of-day is randomised (second resolution, which
    naturally produces some same-second collisions). When False, returns a
    date-only timestamp at 00:00:00.
    """
    day = valid_days[r.integers(0, len(valid_days), size)]
    if seconds:
        off = r.integers(0, 86400, size).astype("timedelta64[s]")
        return (day.astype("datetime64[s]") + off).astype("datetime64[s]")
    return day.astype("datetime64[s]")
