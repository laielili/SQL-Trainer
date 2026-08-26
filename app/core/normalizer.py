"""结果集归一化比对。

把学生结果与参考结果对齐后比较：列名大小写/空格归一、行序不敏感时排序、
数值按容差比对、NULL 与 NULL 相等、INT/DECIMAL/DOUBLE 跨类型数值比较。
输出 COLUMN_MISMATCH / ROW_COUNT_MISMATCH / VALUE_MISMATCH 及差异详情。
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

DEFAULT_TOL = 1e-6


@dataclass
class CompareResult:
    ok: bool
    code: str          # OK | COLUMN_MISMATCH | ROW_COUNT_MISMATCH | VALUE_MISMATCH
    message: str
    details: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {"ok": self.ok, "code": self.code,
                "message": self.message, "details": self.details}


def _norm_val(v: Any):
    """把单个单元格归一为可比较的规范值；None 保持为 None。"""
    if v is None:
        return None
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, (int, float, Decimal)):
        return float(v)
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.isoformat()
    return str(v)


def _canon(v: Any) -> str:
    """用于排序的规范键（保证全序）。"""
    if v is None:
        return ""
    if isinstance(v, bool):
        return f"N{int(v):.10f}"
    if isinstance(v, (int, float, Decimal)):
        try:
            return f"N{float(v):.10f}"
        except Exception:
            return f"S{str(v)}"
    return f"S{str(v)}"


def _rows_equal(a: tuple, b: tuple, tol_map: dict | None) -> bool:
    if len(a) != len(b):
        return False
    for i, (x, y) in enumerate(zip(a, b)):
        if x is None and y is None:
            continue
        if x is None or y is None:
            return False
        if isinstance(x, (int, float, Decimal)) and isinstance(y, (int, float, Decimal)):
            tol = (tol_map or {}).get(i, DEFAULT_TOL)
            if abs(float(x) - float(y)) <= tol:
                continue
            return False
        if _canon(x) != _canon(y):
            return False
    return True


def compare(
    student,
    ref,
    order_sensitive: bool = False,
    tolerances: dict | None = None,
) -> CompareResult:
    """student / ref 为 ExecResult。tolerances: {列名: 容差}。"""
    ref_cols_raw = ref.columns
    ref_cols = [c.strip().lower() for c in ref_cols_raw]
    stu_cols = [c.strip().lower() for c in student.columns]

    missing = [ref_cols_raw[i] for i, c in enumerate(ref_cols) if c not in stu_cols]
    extra = [student.columns[i] for i, c in enumerate(stu_cols) if c not in ref_cols]
    if missing or extra:
        return CompareResult(
            False, "COLUMN_MISMATCH",
            "输出的列与参考解不一致。" + (f"缺少：{missing}。" if missing else "") +
            (f"多余：{extra}。" if extra else ""),
            {"missing": missing, "extra": extra})

    # 按参考列顺序对齐学生列
    order = [stu_cols.index(c) for c in ref_cols]
    stu_rows = [[r[i] for i in order] for r in student.rows]
    ref_rows = [list(r) for r in ref.rows]

    # 容差按参考列名映射成列索引
    tol_map = None
    if tolerances:
        tol_map = {i: tolerances.get(ref_cols_raw[i]) for i in range(len(ref_cols_raw))
                   if tolerances.get(ref_cols_raw[i]) is not None}

    if len(stu_rows) != len(ref_rows):
        return CompareResult(
            False, "ROW_COUNT_MISMATCH",
            f"行数不符：期望 {len(ref_rows)} 行，实际 {len(stu_rows)} 行。",
            {"expected": len(ref_rows), "actual": len(stu_rows)})

    s_norm = [[_norm_val(v) for v in row] for row in stu_rows]
    r_norm = [[_norm_val(v) for v in row] for row in ref_rows]

    if not order_sensitive:
        s_norm.sort(key=lambda row: tuple(_canon(v) for v in row))
        r_norm.sort(key=lambda row: tuple(_canon(v) for v in row))

    diffs = []
    for idx, (s, r) in enumerate(zip(s_norm, r_norm)):
        if not _rows_equal(s, r, tol_map):
            diffs.append({"row": idx, "expected": r, "actual": s})
            if len(diffs) >= 5:
                break

    if diffs:
        return CompareResult(
            False, "VALUE_MISMATCH",
            f"有 {len(diffs)} 行（前 5 行）数值与参考解不一致。",
            {"ref_cols": ref_cols_raw, "diffs": diffs})

    return CompareResult(True, "OK", "结果集与参考解一致。")
