"""静态安全检查 + PG/DuckDB 独有语法拦截。

在翻译与执行之前运行。两件事：
1. 形态与安全：必须是单条 SELECT / WITH，拦截 DDL/DML/多语句等越权写法。
2. 模拟纯 MySQL：拦截 MySQL 不支持的 PG/DuckDB 语法，给出 MySQL 替代写法提示。

返回 SanitizeResult；ok=False 时携带反馈码与建议。
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# ---- 形态 / 安全检查 ----------------------------------------------------
# 多语句、DDL、DML、危险子句。仅训练环境需要 SELECT/WITH。
_FORBIDDEN_RE = re.compile(
    r"""(?is)
    (?:
        # 多语句
        ;\s*\S
        # DDL
        |drop\b | alter\b | create\b | truncate\b | rename\b
        # DML
        | insert\b | update\b | delete\b | replace\b | merge\b
        # 权限 / 过程
        | grant\b | revoke\b | call\b | execute\b | prepare\b | declare\b
        # 文件 / 危险函数
        | into\s+outfile | into\s+dumpfile | load_file | load\s+data
        # 会话变量
        | \bset\s+(?:session|global|@@)
    )
    """,
    re.VERBOSE,
)

# ---- PG / DuckDB 独有语法拦截（表面纯 MySQL）---------------------------
PG_RULES = [
    ("QUALIFY", re.compile(r"(?is)\bqualify\b"),
     "窗口函数结果过滤请外套一层 CTE 或子查询，再在 WHERE 中过滤名次（MySQL 8.0 无 QUALIFY）。"),
    ("PIVOT", re.compile(r"(?is)\bpivot\b"),
     "用条件聚合 SUM(CASE WHEN ... THEN ... ELSE 0 END) 手写行转列（MySQL 无 PIVOT）。"),
    ("UNPIVOT", re.compile(r"(?is)\bunpivot\b"),
     "用 UNION ALL 或 JOIN 数字辅助表手写列转行（MySQL 无 UNPIVOT）。"),
    ("GROUPING SETS", re.compile(r"(?is)\bgrouping\s+sets\b"),
     "用多组 UNION ALL 拼装，或 WITH ROLLUP + GROUPING()（MySQL 无 GROUPING SETS）。"),
    ("CUBE", re.compile(r"(?is)(\bwith\s+cube\b|\bcube\s*\()"),
     "用 WITH ROLLUP + GROUPING()（MySQL 无 CUBE）。"),
    ("generate_series", re.compile(r"(?is)\bgenerate_series\s*\("),
     "用物理日期维表 dim_date 做 LEFT JOIN 补全日期（MySQL 无 generate_series）。"),
    ("UNNEST", re.compile(r"(?is)\bunnest\s*\("),
     "用数字辅助表或 JSON_TABLE + SUBSTRING_INDEX 拆行（MySQL 无 UNNEST）。"),
    ("FILTER (WHERE ...)", re.compile(r"(?is)\bfilter\s*\(\s*where\b"),
     "用 SUM(CASE WHEN ... THEN ... ELSE 0 END) 代替 FILTER (WHERE ...)（MySQL 无此语法）。"),
    ("LATERAL", re.compile(r"(?is)\blateral\b"),
     "用相关子查询（MySQL 无 LATERAL 派生表）。"),
]


@dataclass
class SanitizeResult:
    ok: bool
    code: str            # OK | STATIC_REJECTED | PG_SYNTAX_NOT_ALLOWED
    message: str
    suggestion: str = ""

    def to_dict(self) -> dict:
        return {"ok": self.ok, "code": self.code,
                "message": self.message, "suggestion": self.suggestion}


def strip_comments(sql: str) -> str:
    """去除 SQL 注释，但保留字符串/标识符内的内容。"""
    out = []
    i, n = 0, len(sql)
    in_str = None
    while i < n:
        c = sql[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(sql[i + 1])
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ("'", '"', "`"):
            in_str = c
            out.append(c)
            i += 1
            continue
        # 行注释 --
        if c == "-" and i + 1 < n and sql[i + 1] == "-":
            while i < n and sql[i] != "\n":
                i += 1
            continue
        # # 行注释（MySQL）
        if c == "#":
            while i < n and sql[i] != "\n":
                i += 1
            continue
        # 块注释
        if c == "/" and i + 1 < n and sql[i + 1] == "*":
            i += 2
            while i + 1 < n and not (sql[i] == "*" and sql[i + 1] == "/"):
                i += 1
            i += 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


def _first_keyword(sql: str) -> str:
    m = re.match(r"\s*(\w+)", sql)
    return m.group(1).lower() if m else ""


def _find_double_quote_strings(sql: str) -> list[str]:
    """找出看起来像字符串字面量的双引号片段（MySQL 误把双引号当字符串）。"""
    found = []
    for m in re.finditer(r'"([^"\\]*(?:\\.[^"\\]*)*)"', sql):
        inner = m.group(1)
        # 像字符串：含空格、日期样式、或多词短语（而非单个标识符单词）
        if re.search(r"\s", inner) or re.fullmatch(r"\d{4}-\d{2}-\d{2}", inner) \
           or re.fullmatch(r"[A-Za-z][A-Za-z ]+", inner):
            found.append(inner)
    return found


def _blank_strings(sql: str) -> str:
    """把字符串字面量内部替换为空格，便于关键字扫描时不误伤字符串内容。"""
    out: list[str] = []
    in_str = None
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if in_str:
            out.append(" ")
            if c == "\\" and i + 1 < n:
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ("'", '"', "`"):
            in_str = c
            out.append(c)
            i += 1
            continue
        out.append(c)
        i += 1
    return "".join(out)


def sanitize(sql: str) -> SanitizeResult:
    if not sql or not sql.strip():
        return SanitizeResult(False, "STATIC_REJECTED", "提交内容为空", "请输入一条 SELECT 语句。")

    cleaned = strip_comments(sql)
    # 把字符串字面量内容抹掉，避免关键字扫描误伤（如 WHERE name LIKE '%call%'）
    blanked = _blank_strings(cleaned)

    # 多语句 / DDL / DML 检查（仅看字符串之外的内容）
    forbidden = _FORBIDDEN_RE.search(blanked)
    if forbidden:
        token = forbidden.group(0).strip()
        # 把 ";" 单独出现的情形描述得更友好
        if token.startswith(";"):
            return SanitizeResult(False, "STATIC_REJECTED",
                                  "检测到多条语句；本训练器每次只接受一条查询。",
                                  "请只提交单条 SELECT / WITH 语句。")
        return SanitizeResult(
            False, "STATIC_REJECTED",
            f"不允许的语句或关键字：{token.upper()}。本训练器仅运行只读 SELECT/WITH 查询。",
            "请改用纯 SELECT / WITH 查询；写入与结构变更均不被允许。")

    kw = _first_keyword(cleaned)
    if kw not in ("select", "with"):
        return SanitizeResult(
            False, "STATIC_REJECTED",
            f"语句必须以 SELECT 或 WITH 开头，当前为 {kw.upper() or '空'}。",
            "请提交一条 SELECT 查询（可用 WITH 起手做 CTE）。")

    # PG / DuckDB 独有语法拦截
    for name, pat, suggestion in PG_RULES:
        if pat.search(cleaned):
            return SanitizeResult(
                False, "PG_SYNTAX_NOT_ALLOWED",
                f"使用了 MySQL 不支持的语法：{name}。本训练器运行环境模拟 MySQL 8.0。",
                suggestion)

    # 双引号字符串字面量提示
    dq = _find_double_quote_strings(cleaned)
    if dq:
        sample = dq[0]
        return SanitizeResult(
            False, "PG_SYNTAX_NOT_ALLOWED",
            f"检测到双引号字符串字面量：\"{sample}\"。在 MySQL 中双引号默认是标识符，"
            f"字符串请改用单引号。",
            "把字符串的双引号改为单引号（例如 '2024-01-01'）；若确为标识符，MySQL 习惯用反引号 `col`。")

    return SanitizeResult(True, "OK", "静态检查通过。")
