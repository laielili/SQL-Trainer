"""学习闭环存储（SQLite，与训练数据物理隔离）。

表：
  attempts        每次提交记录
  question_state  每题最佳判定与尝试次数
  srs_queue       间隔重练排期（1/3/7/21/60 天梯度）
"""

from __future__ import annotations

import os
import sqlite3
from datetime import date, datetime, timedelta
from typing import Optional

_HERE = os.path.dirname(os.path.abspath(__file__))
_RUNTIME = os.path.abspath(os.path.join(_HERE, "..", "..", "runtime"))
DB_PATH = os.path.join(_RUNTIME, "progress.sqlite")

SRS_INTERVALS = [1, 3, 7, 21, 60]

_schema = """
CREATE TABLE IF NOT EXISTS attempts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id   TEXT NOT NULL,
    submitted_at  TEXT NOT NULL,
    sql_text      TEXT,
    verdict       TEXT,
    elapsed_ms    REAL,
    rows_returned INTEGER,
    hints_used    INTEGER,
    revealed_answer INTEGER
);
CREATE TABLE IF NOT EXISTS question_state (
    question_id   TEXT PRIMARY KEY,
    best_verdict  TEXT,
    first_pass_at TEXT,
    last_pass_at  TEXT,
    attempt_count INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS srs_queue (
    question_id   TEXT PRIMARY KEY,
    interval_idx  INTEGER DEFAULT 0,
    due_date      TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    active        INTEGER DEFAULT 1
);
"""


def _conn() -> sqlite3.Connection:
    os.makedirs(_RUNTIME, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript(_schema)
    return con


def record_attempt(
    question_id: str,
    sql_text: str,
    verdict: str,
    elapsed_ms: float,
    rows_returned: int,
    hints_used: bool,
    revealed_answer: bool,
) -> None:
    con = _conn()
    try:
        now = datetime.now().isoformat(timespec="seconds")
        con.execute(
            "INSERT INTO attempts (question_id, submitted_at, sql_text, verdict, "
            "elapsed_ms, rows_returned, hints_used, revealed_answer) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (question_id, now, sql_text, verdict, elapsed_ms, rows_returned,
             1 if hints_used else 0, 1 if revealed_answer else 0),
        )
        # 更新 question_state
        row = con.execute(
            "SELECT best_verdict, attempt_count FROM question_state WHERE question_id=?",
            (question_id,)).fetchone()
        passed = verdict in ("PASS", "REFERENCE_PASS")
        if row is None:
            # 首次尝试：最佳判定就是本次判定（PASS/REFERENCE_PASS/FAIL 都如实记录，
            # 否则首次 FAIL 会被存成 None，导致错题本永远收不到失败题）。
            best = verdict
            con.execute(
                "INSERT INTO question_state (question_id, best_verdict, first_pass_at, "
                "last_pass_at, attempt_count) VALUES (?,?,?,?,1)",
                (question_id, best, now if passed else None, now if passed else None))
        else:
            best_verdict, attempt_count = row
            new_best = verdict if (passed and best_verdict in (None, "FAIL")) else best_verdict
            if passed and best_verdict in (None, "FAIL"):
                con.execute(
                    "UPDATE question_state SET best_verdict=?, first_pass_at=?, "
                    "last_pass_at=? WHERE question_id=?",
                    (verdict, now, now, question_id))
            elif passed:
                con.execute(
                    "UPDATE question_state SET last_pass_at=? WHERE question_id=?",
                    (now, question_id))
            con.execute(
                "UPDATE question_state SET attempt_count=? WHERE question_id=?",
                (attempt_count + 1, question_id))
        # SRS 排期
        update_srs(con, question_id, passed)
        con.commit()
    finally:
        con.close()


def update_srs(con: sqlite3.Connection, question_id: str, passed: bool) -> None:
    if passed:
        row = con.execute(
            "SELECT interval_idx FROM srs_queue WHERE question_id=?",
            (question_id,)).fetchone()
        if row is None:
            idx = 0
        else:
            idx = min(row[0] + 1, len(SRS_INTERVALS) - 1)
        due = (date.today() + timedelta(days=SRS_INTERVALS[idx])).isoformat()
        con.execute(
            "INSERT INTO srs_queue (question_id, interval_idx, due_date, created_at, active) "
            "VALUES (?,?,?,?,1) "
            "ON CONFLICT(question_id) DO UPDATE SET interval_idx=excluded.interval_idx, "
            "due_date=excluded.due_date, active=1",
            (question_id, idx, due, date.today().isoformat()))
    else:
        con.execute("UPDATE srs_queue SET active=0 WHERE question_id=?", (question_id,))


def scenario_stats(dataset: str) -> list[dict]:
    """返回该数据集六场景的完成度。"""
    from app.core import content_loader
    out = []
    for sc in content_loader.scenarios_of(dataset):
        total = sc["count"]
        passed = 0
        ref_pass = 0
        for q in sc["questions"]:
            st = _state(q["id"])
            if st and st[0] in ("PASS", "REFERENCE_PASS"):
                passed += 1
                if st[0] == "REFERENCE_PASS":
                    ref_pass += 1
        out.append({
            "scenario": sc["scenario"],
            "name": sc["name"],
            "total": total,
            "passed": passed,
            "reference_passed": ref_pass,
        })
    return out


def _state(qid: str) -> Optional[tuple]:
    con = _conn()
    try:
        return con.execute(
            "SELECT best_verdict, attempt_count FROM question_state WHERE question_id=?",
            (qid,)).fetchone()
    finally:
        con.close()


def overall_progress(dataset: str) -> dict:
    from app.core import content_loader
    qs = [q for q in content_loader.all_questions() if q.dataset == dataset]
    total = len(qs)
    passed = sum(1 for q in qs if (_state(q.id) or (None,))[0] in ("PASS", "REFERENCE_PASS"))
    return {"total": total, "passed": passed,
            "percent": round(passed / total * 100, 1) if total else 0.0}


def wrong_book() -> list[dict]:
    """错题本：从未通过（best_verdict 非 PASS/REFERENCE_PASS）的题，按能力点聚类。"""
    from app.core import content_loader
    by_cap: dict[str, list[dict]] = {}
    for q in content_loader.all_questions():
        st = _state(q.id)
        best = st[0] if st else None
        # 错题本只包含「尝试过且当前判为 FAIL」的题；
        # 从未尝试（best 为 None）或已通过的不应出现。
        if best != "FAIL":
            continue
        caps = q.get("capability_points") or ["(未标注)"]
        for cap in caps:
            by_cap.setdefault(cap, []).append({
                "id": q.id, "dataset": q.dataset, "scenario": q.scenario,
                "title": q.get("title"), "best_verdict": best,
            })
    return [{"capability": k, "questions": v} for k, v in sorted(by_cap.items())]


def wrong_count() -> int:
    ids = set()
    for g in wrong_book():
        for q in g["questions"]:
            ids.add(q["id"])
    return len(ids)


def srs_queue() -> list[dict]:
    """间隔重练队列：所有 active 的排期题（含今日到期与未来排期），按到期日升序。"""
    from app.core import content_loader
    today = date.today().isoformat()
    con = _conn()
    try:
        rows = con.execute(
            "SELECT question_id, interval_idx, due_date FROM srs_queue "
            "WHERE active=1 ORDER BY due_date ASC").fetchall()
    finally:
        con.close()
    out = []
    for qid, idx, due in rows:
        q = content_loader.get_question(qid)
        if q:
            out.append({
                "id": qid, "dataset": q.dataset, "scenario": q.scenario,
                "title": q.get("title"),
                "interval_days": SRS_INTERVALS[idx] if idx < len(SRS_INTERVALS) else SRS_INTERVALS[-1],
                "due_date": due,
                "due_today": due <= today,
            })
    return out
