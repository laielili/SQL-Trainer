/* SQL 业务场景训练器 · 前端逻辑（原生 JS，无构建） */
(function () {
  "use strict";

  const API = {
    datasets: () => fetchJSON("/api/datasets"),
    schema: (ds) => fetchJSON(`/api/datasets/${ds}/schema`),
    scenarios: (ds) => fetchJSON(`/api/scenarios?dataset=${ds}`),
    question: (id) => fetchJSON(`/api/questions/${id}`),
    execute: (ds, sql) => postJSON("/api/execute", { dataset: ds, sql }),
    submit: (id, sql, hints) => postJSON("/api/submit", { question_id: id, sql, hints_used: hints }),
    hint: (id, level) => postJSON(`/api/questions/${id}/hint`, { level }),
    reveal: (id) => postJSON(`/api/questions/${id}/reveal`, {}),
    overview: (ds) => fetchJSON(`/api/progress/overview?dataset=${ds}`),
    wrong: () => fetchJSON("/api/progress/wrongbook"),
    srs: () => fetchJSON("/api/progress/srs"),
  };

  const KEYWORDS = new Set(("select from where group by order having join inner left right outer on "
    + "and or not in like between exists union all as case when then else end limit distinct "
    + "with over partition by row_number rank dense_rank lag lead sum count avg min max "
    + "interval date_add date_sub cast coalesce ifnull if nullif round concat concat_ws "
    + "date_format str_to_date extract year month day hour minute second ").toUpperCase().split(" "));

  const state = {
    dataset: null,
    scenario: null,
    question: null,
    schema: null,
    hintsUsed: 0,
    hintsTotal: 0,
  };

  // ---------- utils ----------
  function fetchJSON(url) {
    return fetch(url).then((r) => r.json());
  }
  function postJSON(url, body) {
    return fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
  }
  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add("hidden"), 2200);
  }

  // ---------- dataset / nav ----------
  async function init() {
    const ds = await API.datasets();
    const sel = $("#datasetSelect");
    sel.innerHTML = "";
    ds.forEach((d) => {
      const o = el("option"); o.value = d.dataset; o.textContent = `${d.name}（${d.passed}/${d.total}）`;
      sel.appendChild(o);
    });
    sel.onchange = () => loadDataset(sel.value);
    if (ds.length) await loadDataset(ds[0].dataset);
    document.querySelectorAll(".tab").forEach((b) => {
      b.onclick = () => switchTab(b.dataset.tab);
    });
    bindEditor();
  }

  async function loadDataset(ds) {
    state.dataset = ds; state.scenario = null; state.question = null;
    const [scen, schema, ov] = await Promise.all([API.scenarios(ds), API.schema(ds), API.overview(ds)]);
    state.schema = schema;
    renderNav(scen);
    renderSchema(schema);
    renderOverall(ov);
    // 默认选中第一个有题的场景的第一个题
    const first = scen.find((s) => s.questions.length);
    if (first) await loadQuestion(first.questions[0].id);
  }

  function renderOverall(ov) {
    $("#overall").textContent = `完成度 ${ov.overall.passed}/${ov.overall.total}（${ov.overall.percent}%）`;
    $("#wrongBadge").textContent = ov.wrong_count;
    $("#srsBadge").textContent = ov.srs_count;
  }

  function renderNav(scen) {
    const nav = $("#scenarioNav");
    nav.innerHTML = "";
    scen.forEach((s) => {
      const g = el("div", "scenario-group");
      const title = el("div", "scenario-title");
      title.innerHTML = `<span>${s.name}</span><span class="count">${s.passed}/${s.count}</span>`;
      g.appendChild(title);
      s.questions.forEach((q) => {
        const row = el("div", "qitem");
        const done = q.best_verdict && q.best_verdict !== "FAIL";
        if (done) row.classList.add(q.best_verdict === "REFERENCE_PASS" ? "ref" : "done");
        row.dataset.id = q.id;
        row.innerHTML = `<span class="dot"></span><span>${q.title || q.id}</span>`;
        row.onclick = () => loadQuestion(q.id);
        g.appendChild(row);
      });
      nav.appendChild(g);
    });
  }

  function renderSchema(schema) {
    const tree = $("#schemaTree");
    tree.innerHTML = "";
    (schema.tables || []).forEach((t) => {
      const d = el("details");
      const sum = el("summary", null, t.name + (t.comment ? ` · ${t.comment}` : ""));
      d.appendChild(sum);
      (t.columns || []).forEach((c) => {
        const r = el("div", "col-row");
        r.innerHTML = `<span class="cname">${c.name}</span><span class="ctype">${c.type}</span>`
          + (c.comment ? `<span class="cnote">${c.comment}</span>` : "");
        r.onclick = () => insertAtCursor(c.name);
        d.appendChild(r);
      });
      tree.appendChild(d);
    });
  }

  // ---------- question ----------
  async function loadQuestion(id) {
    const q = await API.question(id);
    state.question = q; state.hintsUsed = 0; state.hintsTotal = (q.hints || []).length;
    document.querySelectorAll(".qitem").forEach((e) => e.classList.toggle("active", e.dataset.id === id));
    $("#chainMeta").textContent = q.chain ? `任务链：${q.chain} · 第 ${q.chain_step} 步` : "";
    $("#qTitle").textContent = q.title || q.id;
    $("#businessPrompt").textContent = q.business_prompt || "";
    const notes = $("#contextNotes");
    notes.innerHTML = "";
    if (q.context_notes && q.context_notes.length) {
      const h = el("div", null, "业务背景补充：");
      notes.appendChild(h);
      const ul = el("ul");
      q.context_notes.forEach((n) => ul.appendChild(el("li", null, n)));
      notes.appendChild(ul);
    }
    const exp = $("#expectedCols");
    exp.innerHTML = "";
    if (q.expected_columns && q.expected_columns.length) {
      exp.appendChild(el("div", null, "期望输出列："));
      const wrap = el("div", "cols");
      q.expected_columns.forEach((c) => wrap.appendChild(el("span", "chip", c.name)));
      exp.appendChild(wrap);
    }
    $("#sqlEditor").value = q.starter_sql || "";
    syncHighlight();
    $("#hintArea").hidden = true; $("#hintArea").innerHTML = "";
    $("#referencePane").hidden = true; $("#referencePane").innerHTML = "";
    $("#feedback").innerHTML = ""; $("#resultTableWrap").innerHTML = "";
    $("#verdictBadge").className = "verdict hidden";
    $("#hintCounter").textContent = `0/${state.hintsTotal || 3}`;
    renderNav(await API.scenarios(state.dataset)); // 刷新完成度点
  }

  // ---------- editor ----------
  function bindEditor() {
    const ta = $("#sqlEditor");
    ta.addEventListener("input", syncHighlight);
    ta.addEventListener("scroll", () => {
      const h = $("#highlight");
      h.scrollTop = ta.scrollTop; h.scrollLeft = ta.scrollLeft;
    });
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runSql(); }
      // Tab 在编辑器内缩进，而不是把焦点跳到右侧 schema
      if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const INDENT = "    "; // 4 个空格
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
    $("#btnFormat").onclick = () => { toast("本训练器不内置格式化，请用你习惯的 SQL 格式化工具"); };
  }

  function insertAtCursor(text) {
    const ta = $("#sqlEditor");
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.focus(); syncHighlight();
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function highlightSQL(src) {
    // 先去掉注释做字符串/关键字着色（简化版）
    let out = "";
    const re = /(--[^\n]*)|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
    let last = 0, m;
    while ((m = re.exec(src))) {
      out += escapeHtml(src.slice(last, m.index));
      const tok = m[0];
      if (m[1]) out += `<span class="tok-com">${escapeHtml(tok)}</span>`;
      else if (m[2] || m[3]) out += `<span class="tok-str">${escapeHtml(tok)}</span>`;
      else if (m[4]) out += `<span class="tok-num">${escapeHtml(tok)}</span>`;
      else if (KEYWORDS.has(tok.toUpperCase())) out += `<span class="tok-kw">${escapeHtml(tok)}</span>`;
      else out += escapeHtml(tok);
      last = re.lastIndex;
    }
    out += escapeHtml(src.slice(last));
    return out + "\n";
  }
  function syncHighlight() {
    $("#highlight").innerHTML = highlightSQL($("#sqlEditor").value);
  }

  // ---------- run / submit ----------
  async function runSql() {
    if (!state.dataset) return;
    const sql = $("#sqlEditor").value;
    const r = await API.execute(state.dataset, sql);
    if (r.code && r.code !== "OK") { renderFeedback(null, r); return; }
    renderResult(r);
    $("#verdictBadge").className = "verdict hidden";
    $("#feedback").innerHTML = `<span class="muted">运行结果（未判题）· 耗时 ${r.elapsed_ms}ms · ${r.row_count} 行</span>`;
  }

  async function submitSql() {
    if (!state.question) return;
    const sql = $("#sqlEditor").value;
    const r = await API.submit(state.question.id, sql, state.hintsUsed > 0);
    renderFeedback(r, null);
    if (r.translated_sql) {
      $("#feedback").insertAdjacentHTML("beforeend",
        `<div class="muted" style="margin-top:6px">执行 SQL（翻译后）：${escapeHtml(r.translated_sql.slice(0, 400))}</div>`);
    }
    // 刷新进度
    const ov = await API.overview(state.dataset);
    renderOverall(ov);
    renderNav(await API.scenarios(state.dataset));
  }

  async function showHint() {
    if (!state.question) return;
    if (state.hintsUsed >= state.hintsTotal) { toast("提示已全部展开"); return; }
    state.hintsUsed++;
    const r = await API.hint(state.question.id, state.hintsUsed);
    const area = $("#hintArea");
    area.hidden = false;
    if (!area.dataset.init) { area.innerHTML = "<b>提示</b>"; area.dataset.init = "1"; }
    area.insertAdjacentHTML("beforeend", `<div>${state.hintsUsed}. ${escapeHtml(r.hint || "")}</div>`);
    $("#hintCounter").textContent = `${state.hintsUsed}/${state.hintsTotal}`;
  }

  async function revealRef() {
    if (!state.question) return;
    const r = await API.reveal(state.question.id);
    const p = $("#referencePane");
    p.hidden = false;
    p.innerHTML = `<h3>MySQL 参考解</h3><pre>${escapeHtml(r.reference_sql || "")}</pre>`
      + (r.explanation ? `<div class="exp"><b>讲解</b>\n${escapeHtml(r.explanation)}</div>` : "")
      + (r.pitfalls ? `<div class="pit" style="margin-top:8px"><b>常见坑</b>\n${escapeHtml((r.pitfalls || []).join("\n- "))}</div>` : "");
  }

  // ---------- rendering ----------
  function renderResult(r) {
    const wrap = $("#resultTableWrap");
    if (!r.columns || !r.columns.length) { wrap.innerHTML = '<div class="muted" style="padding:8px">无输出列（可能是 DDL/无结果）。</div>'; return; }
    let html = "<table class='grid'><thead><tr>";
    r.columns.forEach((c) => html += `<th>${escapeHtml(c)}</th>`);
    html += "</tr></thead><tbody>";
    (r.rows || []).forEach((row) => {
      html += "<tr>";
      row.forEach((v) => html += `<td>${v == null ? "<i style='color:#94a3b8'>NULL</i>" : escapeHtml(String(v))}</td>`);
      html += "</tr>";
    });
    html += "</tbody></table>";
    wrap.innerHTML = html;
  }

  function renderFeedback(judge, err) {
    const badge = $("#verdictBadge");
    const fb = $("#feedback");
    if (err) {
      badge.className = "verdict FAIL"; badge.textContent = err.code || "ERROR";
      fb.innerHTML = `<div style="color:var(--fail)">${escapeHtml(err.message || "执行失败")}</div>`;
      $("#resultTableWrap").innerHTML = "";
      return;
    }
    badge.className = "verdict " + judge.verdict; badge.textContent = judge.verdict;
    let msg = `<div>${escapeHtml(judge.message)}</div>`;
    const d = judge.details || {};
    if (judge.code === "COLUMN_MISMATCH" && d.missing) {
      msg += `<div class="muted">缺少列：${d.missing.join(", ")} ｜ 多余列：${(d.extra || []).join(", ")}</div>`;
    } else if (judge.code === "ROW_COUNT_MISMATCH") {
      msg += `<div class="muted">期望 ${d.expected} 行，实际 ${d.actual} 行</div>`;
    } else if ((judge.code === "VALUE_MISMATCH" || judge.code === "HARDCODE_SUSPECTED") && d.diffs) {
      msg += renderDiffs(d.ref_cols, d.diffs);
    }
    fb.innerHTML = msg;
    // 运行预览（提交也返回 translated，但结果表显示参考对照更直观；这里仅显示消息）
    $("#resultTableWrap").innerHTML = "";
  }

  function renderDiffs(cols, diffs) {
    let html = "<table class='grid' style='margin-top:8px'><thead><tr>";
    html += "<th></th>" + cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("") + "</tr></thead><tbody>";
    diffs.forEach((df) => {
      html += "<tr><td class='muted'>期望</td>";
      df.expected.forEach((v) => html += `<td class="diff-ok">${v == null ? "NULL" : escapeHtml(String(v))}</td>`);
      html += "</tr><tr><td class='muted'>实际</td>";
      df.actual.forEach((v) => html += `<td class="diff">${v == null ? "NULL" : escapeHtml(String(v))}</td>`);
      html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
  }

  // ---------- tabs / lists ----------
  function switchTab(tab) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $("#view-practice").classList.toggle("hidden", tab !== "practice");
    $("#view-wrong").classList.toggle("hidden", tab !== "wrong");
    $("#view-srs").classList.toggle("hidden", tab !== "srs");
    if (tab === "wrong") renderWrong();
    if (tab === "srs") renderSrs();
  }

  async function renderWrong() {
    const data = await API.wrong();
    const box = $("#wrongList"); box.innerHTML = "";
    if (!data.length) { box.innerHTML = '<div class="muted">暂无错题，继续保持！</div>'; return; }
    data.forEach((g) => {
      const cap = el("div", "cap");
      cap.appendChild(el("h3", null, g.capability));
      g.questions.forEach((q) => {
        const row = el("div", "qrow");
        row.innerHTML = `<span>${escapeHtml(q.title || q.id)}</span>`
          + `<span class="meta">${q.dataset}/${q.scenario} · ${q.best_verdict || "未尝试"}</span>`;
        row.onclick = () => { switchTab("practice"); loadDataset(q.dataset).then(() => loadQuestion(q.id)); };
        cap.appendChild(row);
      });
      box.appendChild(cap);
    });
  }

  async function renderSrs() {
    const data = await API.srs();
    const box = $("#srsList"); box.innerHTML = "";
    if (!data.length) { box.innerHTML = '<div class="muted">暂无排期重练，通过题目后会自动进入队列。</div>'; return; }
    const due = data.filter((q) => q.due_today).length;
    const cap = el("div", "cap");
    cap.appendChild(el("h3", null, `间隔重练队列（共 ${data.length} 题，其中 ${due} 题今日到期）`));
    data.forEach((q) => {
      const row = el("div", "qrow");
      const tag = q.due_today ? "今日到期" : `排期 ${q.due_date}`;
      row.innerHTML = `<span>${escapeHtml(q.title || q.id)}</span>`
        + `<span class="meta">${q.dataset}/${q.scenario} · 间隔 ${q.interval_days} 天 · ${tag}</span>`;
      row.onclick = () => { switchTab("practice"); loadDataset(q.dataset).then(() => loadQuestion(q.id)); };
      cap.appendChild(row);
    });
    box.appendChild(cap);
  }

  init();
})();
