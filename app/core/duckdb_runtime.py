"""DuckDB 只读连接管理。

所有训练库以只读模式打开，从机制上杜绝任何写操作。
每条 SQL 执行都开一个全新的只读连接（DuckDB 连接非线程安全），
执行完即关闭，避免跨线程污染与 TIMEOUT 后连接悬挂。
"""

from __future__ import annotations

import os
from pathlib import Path

import duckdb

# 项目根：app/core/duckdb_runtime.py -> 上三级
ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "duckdb"

VALID_DATASETS = ("shop", "feed", "saas")


def db_paths(dataset: str) -> tuple[str, str]:
    """返回某数据集 A / B 库的绝对路径。"""
    if dataset not in VALID_DATASETS:
        raise ValueError(f"未知数据集: {dataset!r}，可选 {VALID_DATASETS}")
    base = DATA_DIR / f"{dataset}_a.duckdb"
    base_b = DATA_DIR / f"{dataset}_b.duckdb"
    return str(base), str(base_b)


def connect_readonly(path: str) -> "duckdb.DuckDBPyConnection":
    """以只读模式打开一个 DuckDB 文件连接。"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"训练库不存在: {path}（请先运行 scripts/build_datasets.py）")
    return duckdb.connect(path, read_only=True)
