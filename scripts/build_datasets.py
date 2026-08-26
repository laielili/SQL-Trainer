"""一键构建全部 6 个训练库（3 数据集 × A/B 双库）。

用法：
    python scripts/build_datasets.py

A 库 seed=42 / scale=1.0；B 库 seed=20260806 / scale=0.85（规模与分布都不同，
确保硬编码答案必然在 B 库失败）。生成的 .duckdb 落在 data/duckdb/。
"""
from __future__ import annotations

import os
import sys

import duckdb

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "content", "datasets"))

from feed.generate import generate as gen_feed  # noqa: E402
from saas.generate import generate as gen_saas  # noqa: E402
from shop.generate import generate as gen_shop  # noqa: E402

DATA_DIR = os.path.join(HERE, "..", "data", "duckdb")
os.makedirs(DATA_DIR, exist_ok=True)

PLAN = [
    ("shop_a", gen_shop, 42, 1.0),
    ("shop_b", gen_shop, 20260806, 0.85),
    ("feed_a", gen_feed, 42, 1.0),
    ("feed_b", gen_feed, 20260806, 0.85),
    ("saas_a", gen_saas, 42, 1.0),
    ("saas_b", gen_saas, 20260806, 0.85),
]


def build(name: str, gen, seed: int, scale: float) -> None:
    path = os.path.join(DATA_DIR, f"{name}.duckdb")
    if os.path.exists(path):
        os.remove(path)
    con = duckdb.connect(path)
    try:
        gen(con, seed=seed, scale=scale)
    finally:
        con.close()
    size_mb = os.path.getsize(path) / 1e6
    print(f"[OK] {name}: {size_mb:.1f} MB  (seed={seed}, scale={scale})")


if __name__ == "__main__":
    for name, gen, seed, scale in PLAN:
        build(name, gen, seed, scale)
    print("ALL DATASETS BUILT")
