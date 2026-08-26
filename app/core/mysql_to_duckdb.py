"""MySQL → DuckDB 翻译层（仅内部执行用）。

DuckDB 表现层是纯 MySQL；学习者的 MySQL 代码在这里被翻译成 DuckDB 可执行的
形式。参考解走同一条路径（PRD §5.3）。规则覆盖学习者 95% 的 MySQL SELECT 写法；
越界部分由 executor 以 EXEC_ERROR + 友好提示兜底（PRD §5.4）。

实现要点：用带引号/括号感知的扫描器做函数级改写，避免朴素正则误伤字符串内的文字。
"""

from __future__ import annotations

import re
from functools import partial

# --------------------------------------------------------------------------
# 基础工具：括号 / 字符串感知扫描
# --------------------------------------------------------------------------

def _find_matching_paren(s: str, open_idx: int) -> int:
    """给定 '(' 的位置，返回匹配的 ')' 索引；找不到返回 -1。"""
    depth = 0
    in_str = None
    i = open_idx
    n = len(s)
    while i < n:
        c = s[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == in_str:
                in_str = None
        else:
            if c in ("'", '"', "`"):
                in_str = c
            elif c == "(":
                depth += 1
            elif c == ")":
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1


def _split_top_args(s: str) -> list[str]:
    """在顶层（不在括号/字符串内）按逗号拆分。"""
    args: list[str] = []
    depth = 0
    in_str = None
    cur: list[str] = []
    i, n = 0, len(s)
    while i < n:
        c = s[i]
        if in_str:
            cur.append(c)
            if c == "\\":
                i += 1
                if i < n:
                    cur.append(s[i])
                i += 1
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ("'", '"', "`"):
            in_str = c
            cur.append(c)
        elif c == "(":
            depth += 1
            cur.append(c)
        elif c == ")":
            depth -= 1
            cur.append(c)
        elif c == "," and depth == 0:
            args.append("".join(cur).strip())
            cur = []
        else:
            cur.append(c)
        i += 1
    if cur:
        args.append("".join(cur).strip())
    return [a for a in args if a != ""]


def _replace_func(sql: str, name: str, replace_cb) -> str:
    """扫描出函数调用 name(...)，对括号内参数调用 replace_cb 生成替换串。"""
    out: list[str] = []
    i, n = 0, len(sql)
    in_str = None
    name_up = name.upper()
    L = len(name)
    while i < n:
        c = sql[i]
        if in_str:
            out.append(c)
            if c == "\\":
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
        # 尝试匹配函数名（前后不是标识符字符）
        if (i == 0 or not (sql[i - 1].isalnum() or sql[i - 1] == "_")) \
           and sql[i:i + L].upper() == name_up:
            k = i + L
            while k < n and sql[k] in " \t\n\r":
                k += 1
            if k < n and sql[k] == "(":
                close = _find_matching_paren(sql, k)
                if close != -1:
                    inner = sql[k + 1:close]
                    out.append(replace_cb(inner))
                    i = close + 1
                    continue
        out.append(c)
        i += 1
    return "".join(out)


class TranslateError(Exception):
    """翻译失败：某段 MySQL 写法无法转换为 DuckDB。"""


# --------------------------------------------------------------------------
# DATE_FORMAT 格式符映射（仅列出与 DuckDB 不同的）
# --------------------------------------------------------------------------

MYSQL_TO_DUCK_FMT = {
    "%c": "%-m",   # 月（无前导零）
    "%e": "%-d",   # 日（无前导零）
    "%k": "%-H",   # 小时（无前导零）
    "%h": "%I",    # 12 小时制
    "%i": "%M",    # 分钟
    "%s": "%S",    # 秒
    "%r": "%I:%M:%S %p",
    "%T": "%H:%M:%S",
    "%W": "%A",    # 星期名
    "%M": "%B",    # 月份名
}


def _map_format(s: str) -> str:
    return re.sub(r"%-?[a-zA-Z]", lambda m: MYSQL_TO_DUCK_FMT.get(m.group(0), m.group(0)), s)


# --------------------------------------------------------------------------
# 各函数改写处理器（参数为括号内参数串，返回完整替换串）
# --------------------------------------------------------------------------

def _h_date_format(args_str: str) -> str:
    parts = _split_top_args(args_str)
    if len(parts) < 2:
        raise TranslateError("DATE_FORMAT 需要两个参数（表达式, 格式串）")
    expr, fmt = parts[0], parts[1]
    m = re.match(r"^([\"'])(.*)\1$", fmt, re.S)
    if not m:
        return f"strftime({expr}, {fmt})"
    q, inner = m.group(1), m.group(2)
    return f"strftime({expr}, {q}{_map_format(inner)}{q})"


def _h_datediff(args_str: str) -> str:
    parts = _split_top_args(args_str)
    if len(parts) < 2:
        raise TranslateError("DATEDIFF 需要两个参数（expr1, expr2）")
    a, b = parts[0], parts[1]
    return f"date_diff('day', {b}, {a})"   # 参数顺序反转


def _h_date_add_sub(args_str: str, op: str) -> str:
    parts = _split_top_args(args_str)
    if len(parts) < 2:
        raise TranslateError("DATE_ADD/DATE_SUB 需要（表达式, INTERVAL n UNIT）")
    expr = parts[0]
    im = re.match(r"(?is)\s*interval\s+(.+)$", parts[1])
    if not im:
        raise TranslateError("DATE_ADD/DATE_SUB 第二参数应为 INTERVAL n UNIT")
    return f"({expr} {op} INTERVAL {im.group(1)})"


def _h_group_concat(args_str: str) -> str:
    s = args_str.strip()
    # 先剥离 SEPARATOR 子句（位于 ORDER BY 之后），再处理 ORDER BY
    sep = None
    sm = re.search(r"(?is)\bseparator\s+([\"'])(.*?)\1", s)
    if sm:
        sep = sm.group(2)
        s = (s[:sm.start()] + s[sm.end():]).strip()
    order_by = None
    om = re.search(r"(?is)\border\s+by\b", s)
    if om:
        order_by = s[om.end():].strip()
        s = s[:om.start()].strip()
    expr = s
    sep = sep if sep is not None else ","
    ob = f" ORDER BY {order_by}" if order_by else ""
    return f"string_agg({expr}, '{sep}'{ob})"


def _h_if(args_str: str) -> str:
    parts = _split_top_args(args_str)
    if len(parts) != 3:
        raise TranslateError("IF 需要三个参数（条件, 真值, 假值）")
    c, a, b = parts
    return f"(CASE WHEN {c} THEN {a} ELSE {b} END)"


def _h_ifnull(args_str: str) -> str:
    parts = _split_top_args(args_str)
    if len(parts) != 2:
        raise TranslateError("IFNULL 需要两个参数")
    return f"coalesce({parts[0]}, {parts[1]})"


def _h_curdate(args_str: str) -> str:
    return "current_date"


# --------------------------------------------------------------------------
# 字符串/标识符保护下的正则替换
# --------------------------------------------------------------------------

def _protected_sub(sql: str, pattern, repl) -> str:
    """仅对字符串/反引号字面量之外的内容应用正则替换。"""
    out: list[str] = []
    buf: list[str] = []
    in_str = None
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if in_str:
            buf.append(c)
            if c == "\\" and i + 1 < n:
                buf.append(sql[i + 1])
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ("'", '"', "`"):
            if buf:
                out.append(re.sub(pattern, repl, "".join(buf)))
                buf = []
            in_str = c
            buf.append(c)
            i += 1
            continue
        buf.append(c)
        i += 1
    if buf:
        out.append(re.sub(pattern, repl, "".join(buf)))
    return "".join(out)


def _translate_regexp(sql: str) -> str:
    # col REGEXP 'pat' -> regexp_matches(col, 'pat')
    # 该模式含字符串字面量，无法用分段保护；REGEXP 出现在字符串内的概率极低，直接全量替换
    pat = re.compile(r"(?is)(\b[\w.]+\b)\s+regexp\s+('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")")
    return re.sub(pat, lambda m: f"regexp_matches({m.group(1)}, {m.group(2)})", sql)


def _translate_limit_offset(sql: str) -> str:
    # LIMIT off, n -> LIMIT n OFFSET off（LIMIT 不会出现在字符串内，可分段保护）
    pat = re.compile(r"(?i)\blimit\s+(\d+)\s*,\s*(\d+)\b")
    return _protected_sub(sql, pat, lambda m: f"LIMIT {m.group(2)} OFFSET {m.group(1)}")


def _translate_backticks(sql: str) -> str:
    return re.sub(r"`([^`]+)`", r'"\1"', sql)


# --------------------------------------------------------------------------
# 主入口
# --------------------------------------------------------------------------

def translate(sql: str) -> str:
    """把一条 MySQL SELECT 翻译成 DuckDB 可执行 SQL。"""
    s = sql
    s = _translate_regexp(s)
    s = _translate_limit_offset(s)
    s = _replace_func(s, "DATE_FORMAT", _h_date_format)
    s = _replace_func(s, "DATEDIFF", _h_datediff)
    s = _replace_func(s, "DATE_ADD", partial(_h_date_add_sub, op="+"))
    s = _replace_func(s, "DATE_SUB", partial(_h_date_add_sub, op="-"))
    s = _replace_func(s, "GROUP_CONCAT", _h_group_concat)
    s = _replace_func(s, "IF", _h_if)
    s = _replace_func(s, "IFNULL", _h_ifnull)
    s = _replace_func(s, "CURDATE", _h_curdate)
    s = _translate_backticks(s)
    return s.strip()
