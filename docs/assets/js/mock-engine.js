/* 静态原型的判题模拟引擎。
 *
 * 真实系统里的判题链路是：sanitizer → 翻译层 → DuckDB(A) → 归一化 → 比对
 *        → DuckDB(B) 反作弊复核 → 写法约束 → 判定（见 docs/PRD.md §7.1）。
 * 原型里没有后端，这里用「静态规则」复刻同样的判定顺序与反馈码：
 *   - PG / DuckDB 独有语法拦截、越权语句拦截：与 app/core/sanitizer.py 同一份规则表
 *   - 写法约束：直接读题目 YAML 里的 constraints（构建期已转成 JS RegExp）
 *   - 结果比对：用构建期在真实 DuckDB 库上跑出来的结果样例做宽松签名匹配
 * 判定结果只影响原型演示状态，不代表真实执行。
 */
(function () {
  "use strict";

  const PG_RULES = [
    { name: "QUALIFY", re: /\bqualify\b/i,
      tip: "窗口函数结果过滤请外套一层 CTE 或子查询，再在 WHERE 中过滤名次（MySQL 8.0 无 QUALIFY）。" },
    { name: "PIVOT", re: /\bpivot\b/i,
      tip: "用条件聚合 SUM(CASE WHEN ... THEN ... ELSE 0 END) 手写行转列（MySQL 无 PIVOT）。" },
    { name: "UNPIVOT", re: /\bunpivot\b/i,
      tip: "用 UNION ALL 或 JOIN 数字辅助表手写列转行（MySQL 无 UNPIVOT）。" },
    { name: "GROUPING SETS", re: /\bgrouping\s+sets\b/i,
      tip: "用多组 UNION ALL 拼装，或 WITH ROLLUP + GROUPING()（MySQL 无 GROUPING SETS）。" },
    { name: "CUBE", re: /(\bwith\s+cube\b|\bcube\s*\()/i,
      tip: "用 WITH ROLLUP + GROUPING()（MySQL 无 CUBE）。" },
    { name: "generate_series", re: /\bgenerate_series\s*\(/i,
      tip: "用物理日期维表 dim_date 做 LEFT JOIN 补全日期（MySQL 无 generate_series）。" },
    { name: "UNNEST", re: /\bunnest\s*\(/i,
      tip: "用数字辅助表或 JSON_TABLE + SUBSTRING_INDEX 拆行（MySQL 无 UNNEST）。" },
    { name: "FILTER (WHERE ...)", re: /\bfilter\s*\(\s*where\b/i,
      tip: "用 SUM(CASE WHEN ... THEN ... ELSE 0 END) 代替 FILTER (WHERE ...)（MySQL 无此语法）。" },
    { name: "LATERAL", re: /\blateral\b/i,
      tip: "用相关子查询（MySQL 无 LATERAL 派生表）。" },
  ];

  const FORBIDDEN = /\b(drop|alter|create|truncate|rename|insert|update|delete|replace|merge|grant|revoke|call|execute)\b|into\s+(outfile|dumpfile)|load_file|load\s+data/i;
  const MULTI_STMT = /;\s*\S/;

  const STAGE_ORDER = ["静态检查", "翻译", "主库 A 执行", "归一化", "结果比对", "变体库 B 复核", "写法约束", "判定"];

  function stripComments(sql) {
    return sql.replace(/--[^\n]*/g, " ").replace(/#[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
  }

  function normalize(sql) {
    return stripComments(sql).replace(/\s+/g, " ").trim().toUpperCase().replace(/\s*,\s*/g, ", ");
  }

  function elapsedOf(sql, base) {
    const n = sql.length;
    return Math.round(((base || 30) + (n % 37) * 1.7) * 10) / 10;
  }

  /* ---------- 1) 静态检查 ---------- */
  function staticCheck(sql) {
    const bare = stripComments(sql);
    if (!bare.trim()) return { code: "EMPTY", message: "SQL 为空。" };
    if (MULTI_STMT.test(bare)) {
      return { code: "STATIC_REJECTED", message: "检测到多语句。本训练器一次只接受单条 SELECT / WITH。",
        suggestion: "删掉多余的分号，只保留一条查询语句。" };
    }
    const fw = bare.match(FORBIDDEN);
    if (fw) {
      return { code: "STATIC_REJECTED", message: "检测到写操作 / 越权语句：" + fw[0] + "。训练库以只读方式打开。",
        suggestion: "本题只需要 SELECT，不需要修改数据。" };
    }
    if (!/^\s*(select|with)\b/i.test(bare)) {
      return { code: "STATIC_REJECTED", message: "语句必须以 SELECT 或 WITH 开头。",
        suggestion: "把查询改写成 SELECT ... 或 WITH ... SELECT ... 的形式。" };
    }
    for (const r of PG_RULES) {
      if (r.re.test(bare)) {
        return { code: "PG_SYNTAX_NOT_ALLOWED",
          message: "检测到 MySQL 不支持的语法：" + r.name + "。本训练器模拟 MySQL 8.0 环境。",
          suggestion: r.tip };
      }
    }
    return null;
  }

  /* ---------- 2) 写法约束 ---------- */
  function constraintCheck(sql, q) {
    const bare = stripComments(sql);
    const c = q.constraints || {};
    for (const item of (c.must_not_match || [])) {
      if (safeTest(item.pattern, item.flags, bare)) {
        return { code: "CONSTRAINT_VIOLATED", message: "命中禁止写法（" + item.pattern + "）。" + (item.reason || ""),
          suggestion: item.reason || "" };
      }
    }
    for (const item of (c.must_match || [])) {
      if (!safeTest(item.pattern, item.flags, bare)) {
        return { code: "CONSTRAINT_VIOLATED", message: "缺少本题要求的写法（" + item.pattern + "）。" + (item.reason || ""),
          suggestion: item.reason || "" };
      }
    }
    return null;
  }

  function safeTest(pattern, flags, text) {
    try { return new RegExp(pattern, flags || "").test(text); } catch (e) { return false; }
  }

  /* ---------- 3) 反作弊：是否把结果值写死 ---------- */
  function hardcodeCheck(sql, q) {
    const markers = (q.demo && q.demo.hardcode_markers) || [];
    if (!markers.length) return null;
    const hits = markers.filter((m) => sql.indexOf("'" + m + "'") >= 0 || sql.indexOf('"' + m + '"') >= 0);
    if (hits.length >= 2) {
      return { code: "HARDCODE_SUSPECTED",
        message: "你的 SQL 里写死了至少两个结果值（" + hits.slice(0, 3).join(" / ") + "），"
          + "在另一份数据（B 库）上复核不通过。",
        suggestion: "判题会在 A / B 两套数据上各跑一遍；把结果值写进 WHERE 或 CASE 里必然在 B 库失败，"
          + "请改用聚合 / 窗口函数把值算出来。" };
    }
    return null;
  }

  /* ---------- 4) 结果比对（宽松签名匹配） ---------- */
  function signatureScore(sql, q) {
    const sig = (q.demo && q.demo.signature) || { tables: [], keywords: [] };
    const bare = stripComments(sql);
    const tables = sig.tables || [];
    const hitTables = tables.filter((t) => new RegExp("\\b" + t + "\\b", "i").test(bare));
    const keywords = sig.keywords || [];
    const hitKw = keywords.filter((k) => {
      const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\(/g, "\\s*\\(").replace(/ +/g, "\\s+");
      let re;
      try { re = new RegExp("\\b" + esc, "i"); } catch (e) { return false; }
      return re.test(bare);
    });
    const tableRate = tables.length ? hitTables.length / tables.length : 1;
    const kwRate = keywords.length ? hitKw.length / keywords.length : 1;
    const score = tableRate * 0.5 + kwRate * 0.5;
    return { score: score, hitTables: hitTables, missTables: tables.filter((t) => hitTables.indexOf(t) < 0),
      hitKw: hitKw, missKw: keywords.filter((k) => hitKw.indexOf(k) < 0), tableRate, kwRate };
  }

  function isSameAsReference(sql, q) {
    const n = normalize(sql);
    const refs = [q.reference_sql].concat(q.alt_solutions || []);
    return refs.some((r) => r && normalize(r) === n);
  }

  /* ---------- 组装判题结果 ---------- */
  function makeStages(failIdx, extraBad) {
    return STAGE_ORDER.map((name, i) => ({
      name: name,
      status: failIdx == null ? "ok" : (i < failIdx ? "ok" : (i === failIdx ? "bad" : "skip")),
    }));
  }

  function judge(opts) {
    const sql = opts.sql || "";
    const q = opts.question;
    const hintsUsed = opts.hintsUsed || 0;
    const demo = q.demo || {};
    const elapsed = elapsedOf(sql, demo.elapsed_ms);

    const base = { sql: sql, elapsed_ms: elapsed, translated: demo.translated_sql || "", question: q };

    // ① 静态检查
    const sc = staticCheck(sql);
    if (sc) {
      return Object.assign(base, {
        verdict: "FAIL", code: sc.code, message: sc.message, suggestion: sc.suggestion || "",
        stages: makeStages(0), rows: [], columns: [], row_count: 0,
      });
    }

    // ② 写法约束
    const cc = constraintCheck(sql, q);
    if (cc) {
      return Object.assign(base, {
        verdict: "FAIL", code: cc.code, message: cc.message, suggestion: cc.suggestion || "",
        stages: makeStages(6), rows: [], columns: [], row_count: 0,
      });
    }

    // ③ 反作弊复核（B 库）
    const hc = hardcodeCheck(sql, q);
    if (hc) {
      return Object.assign(base, {
        verdict: "FAIL", code: hc.code, message: hc.message, suggestion: hc.suggestion || "",
        stages: makeStages(5),
        rows: demo.actual_rows || [], columns: demo.columns || [],
        row_count: demo.actual_row_count || (demo.actual_rows || []).length,
        diff: demo.diff || [],
      });
    }

    // ④ 结果比对
    const sig = signatureScore(sql, q);
    const same = isSameAsReference(sql, q);
    const passed = same || sig.score >= 0.72;

    if (passed) {
      const verdict = hintsUsed > 0 ? "REFERENCE_PASS" : "PASS";
      return Object.assign(base, {
        verdict: verdict, code: verdict,
        message: verdict === "PASS"
          ? "PASS：结果集与参考解一致（A / B 双库复核通过），写法约束满足。"
          : "REFERENCE_PASS：结果正确，但本次使用过提示，记为「参考通过」，不计入纯通过。",
        suggestion: "",
        stages: makeStages(null),
        rows: demo.rows || [], columns: demo.columns || [], row_count: demo.row_count,
        diff: [],
      });
    }

    const missing = sig.missTables.length
      ? "未用到的表：" + sig.missTables.join("、")
      : "关键写法缺失：" + (sig.missKw.slice(0, 4).join("、") || "—");
    return Object.assign(base, {
      verdict: "FAIL", code: "VALUE_MISMATCH",
      message: "结果不一致：期望 " + (demo.row_count != null ? demo.row_count + " 行" : "—")
        + "，实际 " + (demo.actual_row_count != null ? demo.actual_row_count + " 行" : "—")
        + "，且有 " + ((demo.diff || []).length) + " 行数值对不上。" + missing,
      suggestion: "先看「差异对照」里标红的行，判断是口径错了（该排除的没排除）还是粒度错了（JOIN 后行膨胀）。",
      stages: makeStages(4),
      rows: demo.actual_rows || [], columns: demo.columns || [],
      row_count: demo.actual_row_count || (demo.actual_rows || []).length,
      diff: demo.diff || [],
    });
  }

  /* ---------- 「运行」：只出结果，不判题 ---------- */
  function run(opts) {
    const q = opts.question;
    const sql = opts.sql || "";
    const demo = q.demo || {};
    const sc = staticCheck(sql);
    if (sc) {
      return { ok: false, code: sc.code, message: sc.message, suggestion: sc.suggestion || "",
        columns: [], rows: [], row_count: 0, elapsed_ms: 0 };
    }
    const ok = isSameAsReference(sql, q) || signatureScore(sql, q).score >= 0.72;
    return {
      ok: true, code: "OK", weak: !ok,
      columns: demo.columns || [],
      rows: ok ? (demo.rows || []) : (demo.actual_rows || []),
      row_count: ok ? demo.row_count : (demo.actual_row_count || (demo.actual_rows || []).length),
      elapsed_ms: elapsedOf(sql, demo.elapsed_ms),
      message: ok ? "" : "（原型演示：未命中参考解特征时，结果区展示的是一份「典型错误写法」的样例。）",
    };
  }

  window.SQLT = window.SQLT || {};
  window.SQLT.Mock = { judge: judge, run: run, staticCheck: staticCheck, signatureScore: signatureScore, PG_RULES: PG_RULES };
})();
