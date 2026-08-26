"""限时限行执行器。

每条 SQL 在独立线程中执行，主线程用 join(timeout) 控制超时；
超时即判定 TIMEOUT 并放弃该连接（线程为 daemon，不阻塞后续请求）。
每次执行开一个新的只读连接，避免跨线程污染。
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass

from .duckdb_runtime import connect_readonly

DEFAULT_TIMEOUT = 5.0
DEFAULT_ROW_LIMIT = 100_000


@dataclass
class ExecResult:
    columns: list[str]
    rows: list[tuple]
    row_count: int
    elapsed_ms: float
    truncated: bool
    code: str = "OK"          # OK | EXEC_ERROR | TIMEOUT
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.code == "OK"


def execute_sql(
    db_path: str,
    sql: str,
    timeout: float = DEFAULT_TIMEOUT,
    row_limit: int = DEFAULT_ROW_LIMIT,
) -> ExecResult:
    """在只读连接上执行一条已翻译的 SQL，返回结构化结果。"""
    holder: dict = {}
    err: dict = {}

    def _run() -> None:
        try:
            con = connect_readonly(db_path)
            try:
                t0 = time.perf_counter()
                con.execute(sql)
                cols = [d[0] for d in con.description] if con.description else []
                rows = con.fetchall()
                elapsed = (time.perf_counter() - t0) * 1000.0
                holder["cols"] = cols
                holder["rows"] = rows
                holder["elapsed"] = elapsed
            finally:
                con.close()
        except Exception as e:  # noqa: BLE001
            err["e"] = e

    th = threading.Thread(target=_run, daemon=True)
    th.start()
    th.join(timeout)

    if th.is_alive():
        return ExecResult([], [], 0, timeout * 1000.0, False,
                          code="TIMEOUT",
                          error="查询超过 %.1f 秒，可能被笛卡尔积或缺少过滤条件拖慢" % timeout)

    if "e" in err:
        return ExecResult([], [], 0, 0.0, False,
                          code="EXEC_ERROR",
                          error=str(err["e"]))

    cols = holder["cols"]
    rows = holder["rows"]
    truncated = len(rows) > row_limit
    if truncated:
        rows = rows[:row_limit]
    return ExecResult(cols, rows, len(rows), holder.get("elapsed", 0.0), truncated, code="OK")
