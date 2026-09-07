/* 静态原型冒烟测试（Node，无依赖）：
 *   1. 语法检查 assets/js/*.js
 *   2. 载入 data/*.js 与 mock-engine.js，对 48 题跑一遍判题模拟
 *   3. 校验 PG 语法拦截 / 越权拦截 / 反作弊 / 约束校验四类反馈码
 *
 * 运行：node docs/tools/smoke_test.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const DOCS = path.join(ROOT, "docs");

let failures = 0;
function check(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { failures++; console.log("  FAIL " + label); }
}

function loadInto(sandbox, file) {
  const code = fs.readFileSync(file, "utf8");
  vm.runInNewContext(code, sandbox);
}

const sandbox = { window: {}, console };
sandbox.globalThis = sandbox;

console.log("1) 载入静态数据");
loadInto(sandbox, path.join(DOCS, "data", "datasets.js"));
loadInto(sandbox, path.join(DOCS, "data", "questions.js"));
loadInto(sandbox, path.join(DOCS, "data", "progress.js"));
loadInto(sandbox, path.join(DOCS, "assets", "js", "sql-highlight.js"));
loadInto(sandbox, path.join(DOCS, "assets", "js", "mock-engine.js"));

const SQLT = sandbox.window.SQLT;
const Q = SQLT.QUESTIONS;
const ids = Object.keys(Q);
check(ids.length === 48, "题库数量 = 48（实际 " + ids.length + "）");
check(ids.every((id) => Q[id].demo.executed), "每题都有构建期预执行的结果样例");
check(ids.every((id) => Q[id].reference_sql && Q[id].reference_sql.length > 10), "每题都有 MySQL 参考解");
check(ids.every((id) => !/\b(qualify|pivot|grouping\s+sets|generate_series)\b/i.test(Q[id].reference_sql)),
  "参考解不含被拦截的 PG 语法");

console.log("2) 参考解判题（应全部 PASS）");
let pass = 0;
for (const id of ids) {
  const r = SQLT.Mock.judge({ sql: Q[id].reference_sql, question: Q[id], hintsUsed: 0 });
  if (r.verdict === "PASS") pass++;
  else console.log("     " + id + " -> " + r.code + " " + r.message.slice(0, 90));
}
check(pass === ids.length, "48 题参考解全部 PASS（实际 " + pass + "）");

console.log("3) 等价解判题（alt_solutions 不应被误杀）");
let altTotal = 0, altPass = 0;
for (const id of ids) {
  for (const alt of Q[id].alt_solutions || []) {
    altTotal++;
    if (SQLT.Mock.judge({ sql: alt, question: Q[id], hintsUsed: 0 }).verdict === "PASS") altPass++;
  }
}
check(altPass === altTotal, "等价解全部 PASS（" + altPass + "/" + altTotal + "）");

console.log("4) 反馈码覆盖");
const probe = Q["shop-window-002"];
check(SQLT.Mock.judge({ sql: "SELECT * FROM orders QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_time) = 1", question: probe }).code === "PG_SYNTAX_NOT_ALLOWED", "PG 语法 -> PG_SYNTAX_NOT_ALLOWED");
check(SQLT.Mock.judge({ sql: "DROP TABLE orders", question: probe }).code === "STATIC_REJECTED", "写操作 -> STATIC_REJECTED");
check(SQLT.Mock.judge({ sql: "SELECT 1; SELECT 2", question: probe }).code === "STATIC_REJECTED", "多语句 -> STATIC_REJECTED");
const hcq = ids.map((id) => Q[id]).find((q) => (q.demo.hardcode_markers || []).length >= 2
  && !(q.constraints.must_match || []).length && !(q.constraints.must_not_match || []).length);
if (hcq) {
  const m = hcq.demo.hardcode_markers;
  const sql = "SELECT '" + m[0] + "' AS a, '" + m[1] + "' AS b FROM " + (hcq.tables[0] || "orders") + " LIMIT 1";
  const r = SQLT.Mock.judge({ sql: sql, question: hcq });
  check(r.code === "HARDCODE_SUSPECTED", "写死结果值 -> HARDCODE_SUSPECTED（" + hcq.id + "）");
} else {
  console.log("  skip 没有可用于反作弊演示的题目");
}
check(SQLT.Mock.judge({ sql: probe.reference_sql, question: probe, hintsUsed: 2 }).code === "REFERENCE_PASS", "用过提示 -> REFERENCE_PASS");

const constrained = ids.map((id) => Q[id]).find((q) => (q.constraints.must_match || []).length);
if (constrained) {
  const r = SQLT.Mock.judge({ sql: "SELECT cat_l1 FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN dim_product p ON p.product_id = oi.product_id WHERE o.order_time >= '2025-04-01' AND o.order_time < '2025-07-01' AND o.status NOT IN ('cancelled','refunded') GROUP BY p.cat_l1, p.product_name", question: constrained });
  check(r.code === "CONSTRAINT_VIOLATED", "缺少 must_match 写法 -> CONSTRAINT_VIOLATED（" + constrained.id + "）");
} else {
  console.log("  skip 没有带 must_match 的题目");
}

console.log("5) 语法检查前端源码");
for (const f of ["assets/js/app.js", "assets/js/mock-engine.js", "assets/js/sql-highlight.js"]) {
  const p = path.join(DOCS, f);
  try { new vm.Script(fs.readFileSync(p, "utf8"), { filename: p }); check(true, f + " 语法通过"); }
  catch (e) { check(false, f + " -> " + e.message); }
}

console.log(failures === 0 ? "\n全部通过 ✅" : "\n失败 " + failures + " 项 ❌");
process.exit(failures === 0 ? 0 : 1);
