"""FastAPI 主程序：API 路由 + 静态托管前端。"""

from __future__ import annotations

import os
import sys

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core import content_loader
from app.core.judge import judge
from app.core.mysql_to_duckdb import TranslateError, translate
from app.core.sanitizer import sanitize
from app.core.duckdb_runtime import db_paths
from app.core import executor
from app.storage import progress

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_WEB_DIR = os.path.join(_ROOT, "web")
_HERE = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="SQL 业务场景训练器")

DATASET_NAMES = {"shop": "电商交易", "feed": "内容社区", "saas": "SaaS 订阅"}
PREVIEW_LIMIT = 200


# ----------------------------- Schemas -----------------------------
class ExecuteReq(BaseModel):
    dataset: str
    sql: str


class SubmitReq(BaseModel):
    question_id: str
    sql: str
    hints_used: bool = False


class HintReq(BaseModel):
    level: int


# ----------------------------- Helpers -----------------------------
def _preview(dataset: str, sql: str):
    """执行（含翻译），返回预览结果或错误。用于运行模式（不判题）。"""
    san = sanitize(sql)
    if not san.ok:
        return None, {
            "code": san.code,
            "message": san.message,
            "suggestion": san.suggestion,
        }
    try:
        sql_t = translate(sql)
    except TranslateError as e:
        return None, {"code": "TRANSLATE_FAILED",
                      "message": f"MySQL 写法无法转换：{e}"}
    path_a, _ = db_paths(dataset)
    ex = executor.execute_sql(path_a, sql_t, 5.0, 100_000)
    if ex.code != "OK":
        msg = ex.error or ""
        if ex.code == "TIMEOUT":
            msg = "执行超时（>5s），可能存在笛卡尔积或缺少过滤条件。"
        else:
            msg += "\n提示：请使用单引号字符串；检查列名、GROUP BY、隐式类型转换。"
        return None, {"code": ex.code, "message": msg}
    rows = ex.rows[:PREVIEW_LIMIT]
    return {
        "code": "OK",
        "columns": ex.columns,
        "rows": rows,
        "row_count": ex.row_count,
        "truncated": ex.truncated or ex.row_count > PREVIEW_LIMIT,
        "elapsed_ms": round(ex.elapsed_ms, 1),
        "translated_sql": sql_t,
    }, None


def _question_public(q) -> dict:
    """对外暴露的题目详情（不含参考解/讲解）。"""
    raw = dict(q.raw)
    raw.pop("reference_sql", None)
    raw.pop("explanation", None)
    raw.pop("alt_solutions", None)
    raw["scenario_name"] = content_loader.SCENARIO_NAMES.get(q.scenario, q.scenario)
    # 附带进度状态，供前端侧栏标记「已完成/参考通过」
    try:
        from app.storage import progress as _prog
        st = _prog._state(q.id)
        raw["best_verdict"] = st[0] if st else None
    except Exception:
        raw["best_verdict"] = None
    return raw


# ----------------------------- Routes -----------------------------
@app.get("/api/datasets")
def get_datasets():
    out = []
    for ds in content_loader.list_datasets():
        prog = progress.overall_progress(ds)
        out.append({
            "dataset": ds,
            "name": DATASET_NAMES.get(ds, ds),
            "total": prog["total"],
            "passed": prog["passed"],
            "percent": prog["percent"],
        })
    return out


@app.get("/api/datasets/{ds}/schema")
def get_schema(ds: str):
    return content_loader.load_meta(ds)


@app.get("/api/scenarios")
def get_scenarios(dataset: str):
    stats = {s["scenario"]: s for s in progress.scenario_stats(dataset)}
    scen = content_loader.scenarios_of(dataset)
    out = []
    for s in scen:
        qs = [_question_public(content_loader.get_question(q["id"])) for q in s["questions"]]
        out.append({
            "scenario": s["scenario"],
            "name": s["name"],
            "count": s["count"],
            "passed": stats[s["scenario"]]["passed"],
            "questions": qs,
        })
    return out


@app.get("/api/questions/{qid}")
def get_question(qid: str):
    q = content_loader.get_question(qid)
    if not q:
        return JSONResponse(status_code=404, content={"error": "题目不存在"})
    return _question_public(q)


@app.post("/api/execute")
def api_execute(req: ExecuteReq):
    data, err = _preview(req.dataset, req.sql)
    if err:
        return JSONResponse(status_code=200, content=err)
    return data


@app.post("/api/submit")
def api_submit(req: SubmitReq):
    q = content_loader.get_question(req.question_id)
    if not q:
        return JSONResponse(status_code=404, content={"error": "题目不存在"})
    res = judge(
        dataset=q.dataset,
        student_sql=req.sql,
        reference_sql=q.reference_sql,
        constraints=q.constraints,
        hints_used=req.hints_used,
        order_sensitive=q.order_sensitive,
        tolerances=q.tolerances,
    )
    # 记录尝试
    rows = 0
    data, err = _preview(q.dataset, req.sql)
    if data:
        rows = data["row_count"]
    progress.record_attempt(
        question_id=q.id, sql_text=req.sql, verdict=res.verdict,
        elapsed_ms=res.elapsed_ms, rows_returned=rows,
        hints_used=req.hints_used, revealed_answer=False,
    )
    payload = res.to_dict()
    return payload


@app.post("/api/questions/{qid}/hint")
def api_hint(qid: str, req: HintReq):
    q = content_loader.get_question(qid)
    if not q:
        return JSONResponse(status_code=404, content={"error": "题目不存在"})
    hints = q.get("hints") or []
    idx = max(0, min(req.level, len(hints))) - 1
    if idx < 0 or idx >= len(hints):
        return {"hint": None, "total": len(hints)}
    return {"level": req.level, "total": len(hints), "hint": hints[idx]}


@app.post("/api/questions/{qid}/reveal")
def api_reveal(qid: str):
    q = content_loader.get_question(qid)
    if not q:
        return JSONResponse(status_code=404, content={"error": "题目不存在"})
    return {
        "reference_sql": q.reference_sql,
        "explanation": q.get("explanation"),
        "pitfalls": q.get("pitfalls"),
    }


@app.get("/api/progress/overview")
def api_overview(dataset: str):
    return {
        "overall": progress.overall_progress(dataset),
        "scenarios": progress.scenario_stats(dataset),
        "wrong_count": progress.wrong_count(),
        "srs_count": len(progress.srs_queue()),
    }


@app.get("/api/progress/wrongbook")
def api_wrongbook():
    return progress.wrong_book()


@app.get("/api/progress/srs")
def api_srs():
    return progress.srs_queue()


# ----------------------------- Static -----------------------------
if os.path.isdir(_WEB_DIR):
    app.mount("/", StaticFiles(directory=_WEB_DIR, html=True), name="web")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
