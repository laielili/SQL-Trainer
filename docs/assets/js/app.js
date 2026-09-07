/* SQL 业务场景训练器 · 静态原型交互层
 * 数据来自 docs/data/*.js（构建期从真实题库 + 真实 DuckDB 训练库导出）。
 * 没有后端：判题由 assets/js/mock-engine.js 的规则模拟，见 docs/README.md。
 */
(function () {
  "use strict";

  const S = window.SQLT || {};
  const QUESTIONS = S.QUESTIONS || {};
  const DATASETS = S.DATASETS || {};
  const CAPS = DATASETS.capability_points || {};
  const escapeHtml = S.escapeHtml || ((s) => String(s));
  const hl = S.highlight || ((s) => escapeHtml(s));

  const FEEDBACK_CODES = [
    ["PASS", "通过", "耗时、行数、可选的参考解对照"],
    ["REFERENCE_PASS", "参考通过", "使用过提示后判定通过，标记为「借助提示」"],
    ["STATIC_REJECTED", "静态检查未过", "具体违规项，如包含写操作 / 多语句"],
    ["PG_SYNTAX_NOT_ALLOWED", "用了 PG/DuckDB 独有语法", "提示本训练器模拟 MySQL，并给出 MySQL 替代写法"],
    ["TRANSLATE_FAILED", "翻译失败", "哪段 MySQL 写法无法转换 + 改用建议"],
    ["EXEC_ERROR", "SQL 执行报错", "错误原因 + 双引号字符串 / 隐式类型转换提示"],
    ["TIMEOUT", "超过 5 秒", "提示可能存在笛卡尔积或缺少过滤条件"],
    ["COLUMN_MISMATCH", "列不匹配", "缺哪几列、多哪几列、名称拼写差异"],
    ["ROW_COUNT_MISMATCH", "行数不符", "多算 N 行 / 漏算 M 行，并给出示例行"],
    ["VALUE_MISMATCH", "值不符", "差异最大的前 5 行，逐列高亮期望值与实际值"],
    ["HARDCODE_SUSPECTED", "换数据后失败", "说明 SQL 在另一份数据上结果不对，可能写死了值"],
    ["CONSTRAINT_VIOLATED", "写法不符", "违反了哪条约束，以及这条约束存在的原因"],
  ];

  const state = {
    dataset: "shop",
    current: null,
    progress: JSON.parse(JSON.stringify((S.PROGRESS && S.PROGRESS.state) || {})),
    srsIntervals: (S.PROGRESS && S.PROGRESS.srs_intervals) || [1, 3, 7, 21, 60],
    hints: {},
    revealed: {},
    view: "practice",
    pane: "rows",
    last: null,
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------------- 数据辅助 ---------------- */
  function datasetMeta(key) {
    return (DATASETS.datasets || []).find((d) => d.key === key) || { key: key, name: key, tables: [] };
  }
  function scenarioLabel(key) {
    const s = (DATASETS.scenarios || []).find((x) => x.key === key);
    return s ? s.name : key;
  }
  function questionsOf(ds, sc) {
    return Object.values(QUESTIONS)
      .filter((q) => q.dataset === ds && (!sc || q.scenario === sc))
      .sort((a, b) => (a.chain || "").localeCompare(b.chain || "") || a.chain_step - b.chain_step);
  }
  function statusOf(qid) {
    return (state.progress[qid] || {}).status || "TODO";
  }
  function scenarioStats(ds, sc) {
    const qs = questionsOf(ds, sc);
    const st = { total: qs.length, pass: 0, ref: 0, fail: 0 };
    qs.forEach((q) => {
      const s = statusOf(q.id);
      if (s === "PASS") st.pass++;
      else if (s === "REFERENCE_PASS") st.ref++;
      else if (s === "FAIL") st.fail++;
    });
    st.done = st.pass + st.ref;
    return st;
  }
  function datasetStats(ds) {
    const st = { total: 0, pass: 0, ref: 0, fail: 0, done: 0 };
    (DATASETS.scenarios || []).forEach((sc) => {
      const x = scenarioStats(ds, sc.key);
      st.total += x.total; st.pass += x.pass; st.ref += x.ref; st.fail += x.fail; st.done += x.done;
    });
    return st;
  }
  function wrongEntries() {
    return Object.keys(state.progress)
      .filter((qid) => statusOf(qid) === "FAIL" && QUESTIONS[qid])
      .map((qid) => ({ q: QUESTIONS[qid], p: state.progress[qid] }));
  }
  function srsEntries() {
    return Object.keys(state.progress)
      .filter((qid) => {
        const p = state.progress[qid];
        return p && (p.status === "PASS" || p.status === "REFERENCE_PASS") && p.interval_days;
      })
      .map((qid) => {
        const p = state.progress[qid];
        const dueIn = p.interval_days - (p.days_since_pass || 0);
        return { q: QUESTIONS[qid], p: p, dueIn: dueIn, due: dueIn <= 0 };
      })
      .sort((a, b) => a.dueIn - b.dueIn);
  }

  /* ---------------- 顶栏 / 导航 ---------------- */
  function renderDatasetSelect() {
    const sel = $("#datasetSelect");
    sel.innerHTML = "";
    (DATASETS.datasets || []).forEach((d) => {
      const st = datasetStats(d.key);
      const o = el("option", null, d.name + "（" + st.done + "/" + st.total + "）");
      o.value = d.key;
      sel.appendChild(o);
    });
    sel.value = state.dataset;
    sel.onchange = () => {
      state.dataset = sel.value;
      renderAll();
      const first = questionsOf(state.dataset)[0];
      if (first) loadQuestion(first.id);
    };
  }

  function renderOverall() {
    const st = datasetStats(state.dataset);
    $("#overallStat").innerHTML = "完成度 <b>" + st.done + "/" + st.total + "</b>"
      + " · 纯通过 " + st.pass + " · 参考通过 " + st.ref + " · 错题 " + st.fail;
    $("#wrongBadge").textContent = wrongEntries().length;
    const due = srsEntries().filter((e) => e.due).length;
    $("#srsBadge").textContent = due;
  }

  function renderNav() {
    const nav = $("#scenarioNav");
    nav.innerHTML = "";
    (DATASETS.scenarios || []).forEach((sc) => {
      const st = scenarioStats(state.dataset, sc.key);
      const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
      const box = el("div", "scenario");
      const head = el("div", "scenario-head");
      head.innerHTML = "<span>" + scenarioLabel(sc.key) + "</span>"
        + '<span class="cnt">' + st.done + "/" + st.total + "</span>"
        + '<div class="bar" style="flex-basis:100%"><i style="width:' + pct + '%"></i></div>';
      head.style.flexWrap = "wrap";
      box.appendChild(head);
      const body = el("div", "scenario-body");
      questionsOf(state.dataset, sc.key).forEach((q) => {
        const stt = statusOf(q.id);
        const row = el("div", "qitem " + (stt === "PASS" ? "pass" : stt === "REFERENCE_PASS" ? "ref" : stt === "FAIL" ? "fail" : ""));
        row.innerHTML = '<span class="dot"></span><span>' + escapeHtml(q.title)
          + '<span class="step"> · 第 ' + q.chain_step + " 步</span></span>";
        if (q.id === state.current) row.classList.add("is-active");
        row.onclick = () => loadQuestion(q.id);
        body.appendChild(row);
      });
      box.appendChild(body);
      nav.appendChild(box);
    });
  }

  function renderSchema() {
    const tree = $("#schemaTree");
    const meta = datasetMeta(state.dataset);
    tree.innerHTML = "";
    meta.tables.forEach((t, i) => {
      const d = el("details", "schema-table");
      if (i === 0) d.open = true;
      const cnt = (meta.row_counts || {})[t.name];
      const sum = el("summary", null,
        escapeHtml(t.name)
        + '<span class="tcomment">' + escapeHtml(t.comment) + "</span>"
        + '<span class="tcount">' + (cnt != null ? cnt.toLocaleString() + " 行" : "") + "</span>");
      d.appendChild(sum);
      t.columns.forEach((c) => {
        const row = el("div", "col-row");
        row.title = c.name + " · " + c.type + (c.comment ? " · " + c.comment : "")
          + (c.enum.length ? "\n枚举：" + c.enum.join(" / ") : "");
        row.innerHTML = '<span class="cname' + (c.pk ? " pk" : "") + '">' + escapeHtml(c.name) + "</span>"
          + '<span class="ctype">' + escapeHtml(shortType(c.type)) + "</span>"
          + (c.comment || c.enum.length
            ? '<span class="cnote">' + escapeHtml(c.comment || ("枚举：" + c.enum.join(" / "))) + "</span>"
            : "");
        row.onclick = () => insertAtCursor(c.name);
        d.appendChild(row);
      });
      tree.appendChild(d);
    });
  }

  function shortType(t) {
    return String(t).replace("TIMESTAMP", "TS").replace("INTEGER", "INT")
      .replace("VARCHAR", "STR").replace("BOOLEAN", "BOOL").replace("DOUBLE", "DBL").replace("DECIMAL", "DEC");
  }

  /* ---------------- 题目 ---------------- */
  function loadQuestion(qid) {
    const q = QUESTIONS[qid];
    if (!q) return;
    state.current = qid;
    state.last = null;

    $("#chainMeta").textContent = "任务链 " + (q.chain || "—") + " · 第 " + q.chain_step + " 步";
    $("#capChips").innerHTML = (q.capability_points || [])
      .map((c) => '<span class="chip">' + escapeHtml(c) + "</span>").join(" ");
    $("#qTitle").textContent = q.title;
    $("#businessPrompt").textContent = q.business_prompt;

    const notes = q.context_notes || [];
    $("#notesCount").textContent = notes.length ? "（" + notes.length + " 条）" : "";
    $("#contextNotes").innerHTML = notes.map((n) => "<li>" + escapeHtml(n) + "</li>").join("");
    $("#notesFold").hidden = notes.length === 0;

    $("#expectedCols").innerHTML = (q.expected_columns || [])
      .map((c) => '<span class="chip">' + escapeHtml(c.name) + "</span>").join("");

    $("#sqlEditor").value = "";
    syncHighlight();

    state.hints[qid] = state.hints[qid] || 0;
    renderHints();
    renderRef();
    resetResult();
    renderNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderHints() {
    const q = QUESTIONS[state.current];
    const used = state.hints[state.current] || 0;
    const total = (q && q.hints ? q.hints.length : 0) || 3;
    $("#hintCounter").textContent = used + "/" + total;
    const card = $("#hintCard");
    if (!used) { card.hidden = true; $("#hintList").innerHTML = ""; return; }
    card.hidden = false;
    $("#hintList").innerHTML = (q.hints || []).slice(0, used)
      .map((h) => "<li>" + escapeHtml(h) + "</li>").join("");
    $("#hintWarn").textContent = "已用 " + used + " 级 · 提交后记为参考通过";
  }

  function renderRef() {
    const q = QUESTIONS[state.current];
    const card = $("#refCard");
    if (!state.revealed[state.current]) { card.hidden = true; return; }
    card.hidden = false;
    $("#refSql").innerHTML = hl(q.reference_sql || "—");
    $("#refExplanation").textContent = q.explanation || "—";
    $("#refPitfalls").innerHTML = (q.pitfalls || []).map((p) => "<li>" + escapeHtml(p) + "</li>").join("");
    $("#pitCount").textContent = "（" + (q.pitfalls || []).length + " 条）";
    $("#refTranslated").innerHTML = hl((q.demo && q.demo.translated_sql) || "—");
  }

  /* ---------------- 结果 / 反馈 ---------------- */
  function resetResult() {
    state.last = null;
    state.pane = "rows";
    setPane("rows");
    $("#feedback").innerHTML = '<span class="muted">运行或提交后显示反馈。</span>';
    $("#resultTableWrap").innerHTML = "";
    $("#verdictBadge").className = "verdict hidden";
    $("#verdictBadge").textContent = "";
  }

  function setPane(pane) {
    state.pane = pane;
    document.querySelectorAll("#resultSeg .seg-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.pane === pane);
    });
    renderResultPane();
  }

  function renderFeedback(res) {
    const badge = $("#verdictBadge");
    if (!res) return;
    const cls = res.verdict === "INFO" ? "INFO" : res.verdict;
    badge.className = "verdict " + cls;
    badge.textContent = res.code;

    let html = '<div class="msg">' + escapeHtml(res.message || "") + "</div>";
    if (res.suggestion) html += '<div class="suggest">→ ' + escapeHtml(res.suggestion) + "</div>";
    if (res.stageNote) html += '<div class="muted" style="margin-top:4px">' + escapeHtml(res.stageNote) + "</div>";
    if (res.demoFlag) html += '<span class="demo-flag">样例数据（非真实执行）</span>';
    $("#feedback").innerHTML = html;
  }

  function renderResultPane() {
    const res = state.last;
    const wrap = $("#resultTableWrap");
    if (!res) { wrap.innerHTML = '<div class="empty">尚无结果。</div>'; return; }

    if (state.pane === "pipeline") {
      const stages = res.stages || [];
      let html = '<div class="stages">' + stages.map((s) =>
        '<span class="stage ' + s.status + '">' + (s.status === "ok" ? "✓" : s.status === "bad" ? "✕" : "·")
        + " " + escapeHtml(s.name) + "</span>").join("") + "</div>";
      html += '<div class="muted" style="margin:10px 0 4px">流水线：静态检查 → 翻译 → 主库 A 执行 → 归一化'
        + " → 结果比对 → 变体库 B 复核 → 写法约束 → 判定（PRD §7.1）</div>";
      html += '<div class="muted" style="margin:8px 0 4px">翻译后 SQL（DuckDB 实际执行，构建期由翻译层生成）</div>';
      html += '<pre class="code">' + hl(res.translated || "—") + "</pre>";
      wrap.innerHTML = html;
      return;
    }

    if (state.pane === "diff") {
      const diff = res.diff || [];
      if (!diff.length) {
        wrap.innerHTML = '<div class="empty">本次没有差异（或尚未提交判题）。</div>';
        return;
      }
      const cols = res.columns || [];
      let html = '<table class="grid"><thead><tr><th></th>'
        + cols.map((c) => "<th>" + escapeHtml(c) + "</th>").join("") + "</tr></thead><tbody>";
      diff.forEach((d) => {
        html += '<tr><td class="row-lab">#' + d.row + " 期望</td>"
          + d.expected.map((v) => '<td class="diff-ok">' + cell(v) + "</td>").join("") + "</tr>";
        html += '<tr><td class="row-lab">#' + d.row + " 实际</td>"
          + d.actual.map((v) => '<td class="diff-bad">' + cell(v) + "</td>").join("") + "</tr>";
      });
      html += "</tbody></table>";
      wrap.innerHTML = html;
      return;
    }

    const cols = res.columns || [];
    const rows = res.rows || [];
    if (!cols.length) { wrap.innerHTML = '<div class="empty">无结果集。</div>'; return; }
    let html = '<table class="grid"><thead><tr>'
      + cols.map((c) => "<th>" + escapeHtml(c) + "</th>").join("") + "</tr></thead><tbody>";
    rows.forEach((r) => {
      html += "<tr>" + r.map((v) => {
        const num = typeof v === "number";
        return '<td class="' + (num ? "num" : "") + '">' + cell(v) + "</td>";
      }).join("") + "</tr>";
    });
    html += "</tbody></table>";
    if (res.row_count != null && rows.length < res.row_count) {
      html += '<div class="muted" style="padding:6px 10px">共 ' + res.row_count
        + " 行，原型仅预置前 " + rows.length + " 行。</div>";
    }
    wrap.innerHTML = html;
  }

  function cell(v) {
    if (v === null || v === undefined) return '<span class="null">NULL</span>';
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return String(v);
    return escapeHtml(String(v));
  }

  /* ---------------- 动作 ---------------- */
  function runSql() {
    if (!state.current) return;
    const sql = $("#sqlEditor").value;
    const q = QUESTIONS[state.current];
    const r = S.Mock.run({ sql: sql, question: q });
    if (!r.ok) {
      renderFeedback({ verdict: "FAIL", code: r.code, message: r.message, suggestion: r.suggestion,
        stages: [], translated: "" });
      $("#resultTableWrap").innerHTML = '<div class="empty">语句未通过静态检查，没有产生结果。</div>';
      $("#verdictBadge").className = "verdict FAIL";
      state.last = null;
      return;
    }
    state.last = { verdict: "INFO", code: "OK", message: "", columns: r.columns, rows: r.rows,
      row_count: r.row_count, diff: [], stages: [], translated: (q.demo || {}).translated_sql || "" };
    renderFeedback({
      verdict: "INFO", code: "OK",
      message: "运行结果（未判题）· 耗时 " + r.elapsed_ms + " ms · " + r.row_count + " 行"
        + (r.message ? " " + r.message : ""),
      suggestion: r.weak ? "看起来与参考解特征差异较大，试试对照「期望输出列」检查口径。" : "",
      demoFlag: true, stages: [],
    });
    renderResultPane();
  }

  function submitSql() {
    if (!state.current) return;
    const qid = state.current;
    const q = QUESTIONS[qid];
    const sql = $("#sqlEditor").value;
    const res = S.Mock.judge({ sql: sql, question: q, hintsUsed: state.hints[qid] || 0 });
    state.last = res;
    renderFeedback({
      verdict: res.verdict, code: res.code, message: res.message, suggestion: res.suggestion,
      stages: res.stages, demoFlag: res.code === "VALUE_MISMATCH" || res.code === "HARDCODE_SUSPECTED",
    });
    renderResultPane();

    const p = state.progress[qid] || { status: "TODO", attempts: 0 };
    p.attempts = (p.attempts || 0) + 1;
    if (res.verdict === "PASS" || res.verdict === "REFERENCE_PASS") {
      const prev = p.interval_days || 0;
      const next = state.srsIntervals.find((x) => x > prev) || state.srsIntervals[state.srsIntervals.length - 1];
      p.status = res.verdict;
      p.days_since_pass = 0;
      p.interval_days = next;
      delete p.days_since_fail;
      if (res.verdict === "PASS") toast("PASS：已排入 " + next + " 天后的重练队列");
      else toast("REFERENCE_PASS：用了提示，记为参考通过");
    } else {
      p.status = "FAIL";
      p.days_since_fail = 0;
    }
    state.progress[qid] = p;
    renderOverall();
    renderNav();
  }

  function showHint() {
    if (!state.current) return;
    const q = QUESTIONS[state.current];
    const total = (q.hints || []).length || 3;
    const used = state.hints[state.current] || 0;
    if (used >= total) { toast("提示已全部展开"); return; }
    state.hints[state.current] = used + 1;
    renderHints();
  }

  function revealRef() {
    if (!state.current) return;
    state.revealed[state.current] = true;
    renderRef();
    $("#refCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------------- 编辑器 ---------------- */
  function syncHighlight() {
    $("#highlight").innerHTML = hl($("#sqlEditor").value);
  }
  function insertAtCursor(text) {
    const ta = $("#sqlEditor");
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.focus();
    syncHighlight();
  }

  function bindEditor() {
    const ta = $("#sqlEditor");
    ta.addEventListener("input", syncHighlight);
    ta.addEventListener("scroll", () => {
      const h = $("#highlight");
      h.scrollTop = ta.scrollTop;
      h.scrollLeft = ta.scrollLeft;
    });
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runSql(); }
      if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const INDENT = "  ";
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + INDENT + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + INDENT.length;
        syncHighlight();
      }
    });
    $("#btnRun").onclick = runSql;
    $("#btnSubmit").onclick = submitSql;
    $("#btnHint").onclick = showHint;
    $("#btnReveal").onclick = revealRef;
    $("#btnClear").onclick = () => { ta.value = ""; syncHighlight(); ta.focus(); };
    $("#schemaSearch").addEventListener("input", (e) => filterSchema(e.target.value.trim().toLowerCase()));
    document.querySelectorAll("#resultSeg .seg-btn").forEach((b) => {
      b.onclick = () => setPane(b.dataset.pane);
    });
  }

  function filterSchema(kw) {
    document.querySelectorAll("#schemaTree .schema-table").forEach((d) => {
      const name = (d.querySelector("summary") || {}).textContent || "";
      let hit = !kw || name.toLowerCase().indexOf(kw) >= 0;
      let colHit = false;
      d.querySelectorAll(".col-row").forEach((r) => {
        const t = r.textContent.toLowerCase();
        const ok = !kw || t.indexOf(kw) >= 0;
        r.style.display = ok ? "" : "none";
        if (ok && kw && name.toLowerCase().indexOf(kw) < 0) colHit = true;
      });
      d.style.display = (hit || colHit) ? "" : "none";
      if (kw && (hit || colHit)) d.open = true;
    });
  }

  /* ---------------- 视图切换 ---------------- */
  function switchView(view) {
    state.view = view;
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
    ["practice", "wrong", "srs", "overview"].forEach((v) => {
      $("#view-" + v).hidden = v !== view;
    });
    if (view === "wrong") renderWrong();
    if (view === "srs") renderSrs();
    if (view === "overview") renderOverview();
  }

  function renderWrong() {
    const box = $("#wrongList");
    box.innerHTML = "";
    const entries = wrongEntries();
    if (!entries.length) { box.innerHTML = '<div class="empty">暂无错题。</div>'; return; }

    const byCap = {};
    entries.forEach((e) => {
      (e.q.capability_points || ["未标注"]).forEach((c) => {
        (byCap[c] = byCap[c] || []).push(e);
      });
    });
    Object.keys(byCap).sort().forEach((cap) => {
      const list = byCap[cap];
      const g = el("div", "group");
      const name = capName(cap);
      g.appendChild(el("h3", null, escapeHtml(name) + '<span class="cnt">' + list.length + " 题</span>"));
      list.forEach((e) => {
        const row = el("div", "qrow");
        row.innerHTML = "<span>" + escapeHtml(e.q.title) + "</span>"
          + '<span class="meta">' + escapeHtml(datasetMeta(e.q.dataset).name) + " / "
          + escapeHtml(scenarioLabel(e.q.scenario)) + " · 尝试 " + (e.p.attempts || 0) + " 次 · "
          + (e.p.days_since_fail != null ? e.p.days_since_fail + " 天前" : "最近") + "</span>";
        row.onclick = () => {
          state.dataset = e.q.dataset;
          renderDatasetSelect(); renderAll();
          switchView("practice");
          loadQuestion(e.q.id);
        };
        g.appendChild(row);
      });
      box.appendChild(g);
    });
  }

  function capName(id) {
    for (const sc of Object.keys(CAPS)) {
      const hit = CAPS[sc].find((c) => c.id === id);
      if (hit) return hit.name;
    }
    return id;
  }

  function renderSrs() {
    const box = $("#srsList");
    box.innerHTML = "";
    const all = srsEntries();
    if (!all.length) { box.innerHTML = '<div class="empty">暂无排期。</div>'; return; }
    const due = all.filter((e) => e.due).length;
    const g = el("div", "group");
    g.appendChild(el("h3", null, "重练队列<span class='cnt'>共 " + all.length + " 题 · 今日到期 " + due + " 题</span>"));
    all.forEach((e) => {
      const row = el("div", "qrow");
      const tag = e.due ? '<span class="tag due">今日到期</span>'
        : '<span class="tag ' + (e.dueIn <= 2 ? "soon" : "") + '">' + e.dueIn + " 天后</span>";
      row.innerHTML = "<span>" + escapeHtml(e.q.title) + tag + "</span>"
        + '<span class="meta">' + escapeHtml(datasetMeta(e.q.dataset).name) + " / "
        + escapeHtml(scenarioLabel(e.q.scenario)) + " · 间隔 " + e.p.interval_days + " 天 · 已过 "
        + (e.p.days_since_pass || 0) + " 天</span>";
      row.onclick = () => {
        state.dataset = e.q.dataset;
        renderDatasetSelect(); renderAll();
        switchView("practice");
        loadQuestion(e.q.id);
      };
      g.appendChild(row);
    });
    box.appendChild(g);
  }

  function renderOverview() {
    const box = $("#overviewScenarios");
    box.innerHTML = "";
    (DATASETS.scenarios || []).forEach((sc) => {
      const st = scenarioStats(state.dataset, sc.key);
      const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
      const c = el("div", "stat-card");
      c.innerHTML = '<div class="name"><span>' + escapeHtml(scenarioLabel(sc.key)) + "</span>"
        + "<span>" + st.done + "/" + st.total + "</span></div>"
        + '<div class="bar"><i style="width:' + pct + '%"></i></div>'
        + '<div class="nums">纯通过 ' + st.pass + " · 参考通过 " + st.ref + " · 错题 " + st.fail + " · " + pct + "%</div>";
      c.onclick = () => {
        switchView("practice");
        const first = questionsOf(state.dataset, sc.key)[0];
        if (first) loadQuestion(first.id);
      };
      box.appendChild(c);
    });

    const capBox = $("#overviewCaps");
    capBox.innerHTML = "";
    const qs = questionsOf(state.dataset);
    const agg = {};
    qs.forEach((q) => {
      (q.capability_points || []).forEach((c) => {
        agg[c] = agg[c] || { total: 0, done: 0 };
        agg[c].total++;
        const s = statusOf(q.id);
        if (s === "PASS" || s === "REFERENCE_PASS") agg[c].done++;
      });
    });
    Object.keys(agg).sort().forEach((cap) => {
      const a = agg[cap];
      const pct = Math.round((a.done / a.total) * 100);
      const row = el("div", "cap-row" + (a.done === 0 ? " weak" : ""));
      row.innerHTML = '<span class="cap-name">' + escapeHtml(capName(cap)) + "</span>"
        + '<span class="cap-bar"><i style="width:' + pct + '%"></i></span>'
        + '<span class="cap-num">' + a.done + "/" + a.total + "</span>";
      capBox.appendChild(row);
    });

    const t = $("#codeTable");
    if (!t.dataset.init) {
      t.innerHTML = "<thead><tr><th>反馈码</th><th>含义</th><th>反馈内容</th></tr></thead><tbody>"
        + FEEDBACK_CODES.map((r) => "<tr><td>" + escapeHtml(r[0]) + "</td><td>" + escapeHtml(r[1])
          + "</td><td>" + escapeHtml(r[2]) + "</td></tr>").join("")
        + "</tbody>";
      t.dataset.init = "1";
    }
  }

  function renderAll() {
    renderNav();
    renderSchema();
    renderOverall();
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    const meta = DATASETS.meta || {};
    $("#buildNotice").textContent = "静态原型 · 题库 " + (meta.question_count || 0) + " 题 / "
      + (meta.dataset_count || 0) + " 套数据集 · 结果样例为构建期（" + (meta.generated_at || "—")
      + "）在真实 " + (meta.engine || "DuckDB") + " 训练库上预执行的前 " + (meta.sample_rows || 15)
      + " 行；判题为规则模拟，无后端参与。";

    state.dataset = (DATASETS.datasets[0] || {}).key || "shop";
    renderDatasetSelect();
    bindEditor();
    renderAll();

    document.querySelectorAll(".tab").forEach((b) => { b.onclick = () => switchView(b.dataset.view); });

    $("#themeToggle").onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
    };

    const first = questionsOf(state.dataset)[0];
    if (first) loadQuestion(first.id);
  }

  init();
})();
