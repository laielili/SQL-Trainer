"""唯一入口：启动 FastAPI 服务（DuckDB 为静默只读引擎，无需启停数据库）。

用法：
    python run.py                # 启动并打开浏览器
    python run.py --no-browser  # 仅启动，不打开浏览器
    python run.py --port 8080   # 指定端口
"""

from __future__ import annotations

import argparse
import os
import sys
import webbrowser

_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, _ROOT)


def main() -> None:
    ap = argparse.ArgumentParser(description="SQL 业务场景训练器")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    import uvicorn
    url = f"http://{args.host}:{args.port}/"
    if not args.no_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    print(f"SQL Trainer 已启动：{url}")
    uvicorn.run("app.main:app", host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
