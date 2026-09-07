# SQL 业务场景训练器 · 静态可展示原型

一个**零后端、零构建**的静态原型：双击 `docs/index.html` 即可打开，不需要起 FastAPI、不需要 DuckDB、不需要联网。

它用来展示真实产品的完整交互与判题反馈形态，可直接用于演示、截图、挂在 GitHub Pages 上。

---

## 1. 目录结构

```
docs/
├─ index.html                    原型入口（直接双击打开）
├─ README.md                     本文件
├─ PRD.md                        产品需求文档 v1.3（真实系统的需求来源）
├─ assets/
│  ├─ css/prototype.css          样式（暗色 / 亮色双主题，右上角 ◐ 切换）
│  └─ js/
│     ├─ sql-highlight.js        MySQL 语法高亮
│     ├─ mock-engine.js          判题模拟引擎（规则链，见 §4）
│     └─ app.js                  界面渲染与交互
├─ data/                         静态数据（构建期生成，window.SQLT.* 挂载）
│  ├─ datasets.js                3 套数据集 + 表结构树 + 场景 / 能力点定义
│  ├─ questions.js               48 题：题面 / 提示 / MySQL 参考解 / 结果样例
│  └─ progress.js                演示用学习状态（覆盖标记 / 错题 / SRS 排期）
└─ tools/
   ├─ build_static_data.py       从真实题库 + 真实训练库导出 data/*.js
   └─ smoke_test.js              冒烟测试（Node，无依赖）
```

## 2. 数据是真的，判题是模拟的

| 内容 | 来源 | 真实性 |
| --- | --- | --- |
| 48 道题的题面、业务背景、三级提示、参考解、讲解、常见坑 | `content/questions/**/*.yaml` | ✅ 真实 |
| 表结构树、字段类型、枚举值、注释 | `content/datasets/*/meta.yaml` | ✅ 真实 |
| 每张表的行数（如 orders 200,000 / events 1,211,965） | 训练库实时统计 | ✅ 真实 |
| 每题「结果集 / 差异对照」里的行 | 参考解经 **MySQL→DuckDB 翻译层**翻译后，在真实 `data/duckdb/{ds}_a.duckdb` 上**只读执行**取到的前 15 行 | ✅ 真实（构建期预执行） |
| 「翻译后 SQL」 | 构建期调用 `app.core.mysql_to_duckdb.translate()` 生成 | ✅ 真实 |
| 判题结果、耗时、反作弊复核 | 浏览器内规则模拟（无 SQL 引擎） | ⚠️ 模拟 |
| 学习进度、错题本、重练排期 | `docs/data/progress.js` 的固定演示状态 | ⚠️ 预置 |

「差异对照」里标红的**实际值**是由真实结果派生的演示样例（见 `build_static_data.py: perturb_rows`），UI 上以「样例数据」标签标注，不代表任何真实执行结果。

## 3. 打开方式

- **方式一（推荐）**：直接双击 `docs/index.html`。
  数据以 `<script>` 形式加载（而非 `fetch`），因此 `file://` 协议下也能正常工作。
- **方式二**：`python -m http.server` 后访问 `http://localhost:8000/docs/`。

刷新页面会重置演示状态（进度、提示、判题结果均为内存态，不写入 localStorage）。

## 4. 判题模拟规则

`assets/js/mock-engine.js` 按真实判题流水线（PRD §7.1）的顺序做规则判定，反馈码与真实系统一致：

| 顺序 | 环节 | 原型实现 | 触发示例 |
| --- | --- | --- | --- |
| ① | 静态检查 | 与 `app/core/sanitizer.py` 同一份 PG 拦截表 + 越权/多语句拦截 | 写 `QUALIFY` → `PG_SYNTAX_NOT_ALLOWED`；写 `DROP` → `STATIC_REJECTED` |
| ② | 写法约束 | 直接读题目 YAML 的 `must_match` / `must_not_match`（构建期已转成 JS RegExp） | TopN 题用 `LIMIT 3` → `CONSTRAINT_VIOLATED` |
| ③ | 变体库 B 反作弊复核 | SQL 中出现 ≥2 个**参考解里没有的**结果值字面量 | `WHERE cat_l1='食品' AND product_name='…'` → `HARDCODE_SUSPECTED` |
| ④ | 结果比对 | 宽松签名匹配：题目声明的表名 + 参考解关键词命中率 ≥72%，或与参考解/等价解归一化后完全相同 | 命中 → `PASS`（用过提示则 `REFERENCE_PASS`） |
| ⑤ | 兜底 | 未命中 → `VALUE_MISMATCH` + 差异行对照 | — |

「判题流水线」分页会画出 8 个环节（静态检查 → 翻译 → 主库 A 执行 → 归一化 → 结果比对 → 变体库 B 复核 → 写法约束 → 判定）的通过/失败状态。

## 5. 建议的演示动线

1. 数据集选「电商交易」→ 场景「窗口函数排序」→ 第 2 题（各品类 Top3）。
2. 写 `SELECT ... LIMIT 3` 提交 → 看 `CONSTRAINT_VIOLATED`，反馈里会说明「LIMIT 只能取全局前三」。
3. 改成 `QUALIFY DENSE_RANK() <= 3` 提交 → 看 `PG_SYNTAX_NOT_ALLOWED` 与 MySQL 替代写法提示。
4. 写死两个商品名提交 → 看 `HARDCODE_SUSPECTED`（B 库复核失败）。
5. 点「参考解」看 MySQL 最优解 + 翻译后 SQL，或点「提示」逐级解锁。
6. 提交正确解 → `PASS`，题目状态变绿并进入重练队列；用过提示则显示 `REFERENCE_PASS`。
7. 切到「错题本 / 今日重练 / 进度总览」看闭环：能力点归因、SRS 梯度（1/3/7/21/60 天）、场景完成度。

## 6. 重新生成数据 / 跑测试

```bash
# 重建静态数据（需要 .venv 里的 duckdb / PyYAML）
.venv/Scripts/python.exe docs/tools/build_static_data.py

# 冒烟测试（Node，无依赖）
node docs/tools/smoke_test.js
```

冒烟测试会校验：48 题参考解全部 PASS、48 条等价解不被误杀、参考解不含 PG 语法、
以及 PG 拦截 / 越权拦截 / 多语句拦截 / 反作弊 / 约束校验 / 提示降级六类反馈码。
