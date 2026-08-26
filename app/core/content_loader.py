"""题库加载与校验。

题目以 YAML 存放于 content/questions/{dataset}/{scenario}/{id}.yaml。
全部 SQL 字段（reference_sql / alt_solutions / hints 示例）均为 MySQL 8.0 语法。
本模块负责把磁盘上的题目加载成内存索引，并提供按 id / dataset / scenario 的查询。
"""

from __future__ import annotations

import glob
import os
from dataclasses import dataclass, field
from typing import Any

import yaml

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
QUESTIONS_DIR = os.path.join(_ROOT, "content", "questions")
META_DIR = os.path.join(_ROOT, "content", "datasets")

DATASETS = ["shop", "feed", "saas"]
SCENARIOS = ["agg", "window", "retention", "growth", "pivot", "funnel"]
SCENARIO_NAMES = {
    "agg": "多维聚合统计",
    "window": "窗口函数排序",
    "retention": "留存率分析",
    "growth": "同环比计算",
    "pivot": "行列转换",
    "funnel": "漏斗转化分析",
}


@dataclass
class Question:
    id: str
    dataset: str
    scenario: str
    file: str
    raw: dict = field(default_factory=dict)

    def __getitem__(self, key):
        return self.raw[key]

    def get(self, key, default=None):
        return self.raw.get(key, default)

    @property
    def reference_sql(self) -> str:
        return self.raw.get("reference_sql", "")

    @property
    def alt_solutions(self) -> list:
        return self.raw.get("alt_solutions", []) or []

    @property
    def constraints(self) -> dict:
        return self.raw.get("constraints", {}) or {}

    @property
    def order_sensitive(self) -> bool:
        return bool(self.raw.get("order_sensitive", False))

    @property
    def tolerances(self) -> dict:
        tol = {}
        for col in self.raw.get("expected_columns", []) or []:
            if isinstance(col, dict) and col.get("tolerance") is not None:
                tol[col["name"]] = float(col["tolerance"])
        return tol


_INDEX: dict | None = None  # dataset -> scenario -> [Question]


def _scan() -> dict:
    idx: dict[str, dict[str, list[Question]]] = {ds: {sc: [] for sc in SCENARIOS}
                                                  for ds in DATASETS}
    if not os.path.isdir(QUESTIONS_DIR):
        return idx
    for ds in DATASETS:
        for sc in SCENARIOS:
            pat = os.path.join(QUESTIONS_DIR, ds, sc, "*.yaml")
            for fp in sorted(glob.glob(pat)):
                with open(fp, "r", encoding="utf-8") as f:
                    raw = yaml.safe_load(f)
                if not isinstance(raw, dict):
                    continue
                qid = raw.get("id") or os.path.splitext(os.path.basename(fp))[0]
                raw.setdefault("id", qid)
                raw.setdefault("dataset", ds)
                raw.setdefault("scenario", sc)
                idx[ds][sc].append(Question(id=qid, dataset=ds,
                                            scenario=sc, file=fp, raw=raw))
    return idx


def load() -> dict:
    global _INDEX
    if _INDEX is None:
        _INDEX = _scan()
    return _INDEX


def invalidate() -> None:
    global _INDEX
    _INDEX = None


def get_question(qid: str) -> Question | None:
    for ds, scen in load().items():
        for sc, qs in scen.items():
            for q in qs:
                if q.id == qid:
                    return q
    return None


def all_questions() -> list[Question]:
    out: list[Question] = []
    for ds, scen in load().items():
        for sc, qs in scen.items():
            out.extend(qs)
    return out


def list_datasets() -> list[str]:
    """返回至少有一个题目的数据集。"""
    out = []
    for ds in DATASETS:
        if any(load()[ds][sc] for sc in SCENARIOS):
            out.append(ds)
    return out


def scenarios_of(dataset: str) -> list[dict]:
    """返回该数据集下六场景的元信息（含题数）。"""
    out = []
    idx = load().get(dataset, {})
    for sc in SCENARIOS:
        qs = idx.get(sc, [])
        out.append({
            "scenario": sc,
            "name": SCENARIO_NAMES[sc],
            "count": len(qs),
            "questions": [q.raw for q in qs],
        })
    return out


def load_meta(dataset: str) -> dict:
    """读取 content/datasets/{ds}/meta.yaml（表结构树）。"""
    fp = os.path.join(META_DIR, dataset, "meta.yaml")
    if not os.path.isfile(fp):
        return {"dataset": dataset, "tables": []}
    with open(fp, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {"dataset": dataset, "tables": []}
