# SQL 业务场景训练器 · 产品需求文档

| 项 | 内容 |
| --- | --- |
| 版本 | v1.3（完整闭环 · 表面纯 MySQL · DuckDB 静默执行） |
| 日期 | 2026-08-06 |
| 状态 | 需求确认完毕，已进入 M0（数据地基）开发 |
| 形态 | 本地单机应用，Python 后端 + Web 前端 |

---

## 1. 项目概述

### 1.1 要解决的问题

市面上的 SQL 练习产品普遍存在两个错配：

1. **按难度分级，而非按业务场景分级。** 「简单 / 中等 / 困难」是刷题产品的组织方式，它训练的是「解题」；而业务取数训练的是「把一句模糊的业务需求翻译成正确口径的 SQL」。这两件事的能力结构完全不同。
2. **题目脱离业务语境。** 大量题目是 `employee` / `salary` 这类玩具表，做完之后面对真实的订单表、埋点表依然无从下手——因为真正的难点从来不是语法，而是口径判断（要不要排除退款单？分母用注册用户还是活跃用户？跨月边界怎么切？）。

### 1.2 项目目标

构建一个**本地运行、场景化**的 SQL 取数训练环境，系统性地提供六大业务场景下的真实需求描述与数据，让使用者在贴近实战的语境中反复训练。解题判定的核心是**结果正确性**，参考解提供 **MySQL 语法的最优解**供对照。

> 本项目的核心价值是**系统性提供业务场景与需求**（题面 + 数据 + 判题），而非教学讲解平台。学习者如需更深入的讲解，可借助外部 AI 协助；本项目保证每个场景都有高质量、口径真实的题目与即时判题反馈。

### 1.3 明确的非目标

- 不做 SQL 语法入门教学（假定使用者已掌握 SELECT / JOIN / GROUP BY 基础）
- 不做多用户、账号体系、权限管理
- 不做在线部署、云同步、社交功能
- 不做性能调优训练（执行计划、索引优化属于另一个能力域，V2 再议）
- **不做真实 MySQL 引擎**：用 DuckDB 作静默执行引擎（轻量、数据留项目内）；但对学习者而言运行环境**表现与纯 MySQL 一致**
- **不暴露任何 PostgreSQL / DuckDB 独有语法**：QUALIFY / PIVOT / GROUPING SETS / generate_series 等一律不可用于题解，写了即拦截并提示改用 MySQL 写法

### 1.4 目标用户与典型场景

单用户（项目所有者本人），具备 MySQL 基础。典型使用节奏：

> 打开应用 → 选一个数据集和场景 → 读业务需求 → 写 MySQL → 运行看结果 → 提交判题 → 看差异定位 / 对照 MySQL 参考解 → 换下一道

---

## 2. 已确认的核心决策

| 决策项 | 结论 | 影响 |
| --- | --- | --- |
| **运行环境** | **表面纯 MySQL；DuckDB 作静默执行引擎（Python 加载）** | 学习者只接触 MySQL 语法；DuckDB 在内部把 MySQL 翻译成可执行形式，单文件落 `data/duckdb/` |
| **数据集** | 三套并存：电商交易、内容社区、SaaS 订阅，运行时可自由切换 | 需要数据集抽象层；题库按「数据集 × 场景」二维组织 |
| **判题严格度** | 最严档：结果集比对 + 写法约束 + 变体数据集反作弊 | 每套数据集需生成 A/B 双份数据；每次提交跑两遍；内容维护成本翻倍 |
| **参考解** | **MySQL 语法的最优解**（经翻译层执行，与学习者同一执行路径，避免学习混乱） | 参考解、提示、讲解全部 MySQL；不使用任何 PG 独有语法 |
| **首版范围** | 完整学习闭环：场景提供 + 判题 + MySQL 参考解 + 错题本（按能力点聚类）+ 间隔重练 SRS（1/3/7/21/60 天梯度） | 48 题 + 判题引擎 + 三级提示 + MySQL 参考解 + 覆盖标记 + 错题本 + SRS |

### 2.1 设计原则

1. **需求驱动，而非语法驱动。** 题面是业务方的一句话需求，绝不是"请使用 DENSE_RANK 完成以下查询"。
2. **场景内用「业务任务链」代替难度阶。** 同一场景下的题目是同一条业务线上连续演进的需求，前后有剧情关系，递进感来自业务复杂度。
3. **同一套 schema 反复用。** 每个数据集内的所有场景共用一套表结构，schema 记熟之后注意力才能集中到取数逻辑本身。
4. **判结果不判写法**，除非该题的训练目标本身就是某种写法（此时用显式约束声明，并在反馈中说明原因）。
5. **数据不出项目目录。** 训练库、题库、进度、日志、缓存全部落在项目路径内。
6. **运行环境 = 纯 MySQL（表面）。** DuckDB 只是执行底座；学习者写 MySQL、参考解写 MySQL、提示讲 MySQL。PG 独有语法在提交时被静态拦截，从入口杜绝"在题解里看到 PG"的可能。
7. **参考解即 MySQL 最优解。** 参考解经过与学习者完全相同的翻译层执行，保证对照一致、不产生 PG 语法干扰。

---

## 3. 场景与能力点体系

六大场景，每个场景下拆解为可独立训练、可独立评估的能力点。能力点是进度统计和错题归因的最小单位。**运行环境模拟 MySQL 8.0**，因此以下"实现要求"列均按 MySQL 能力描述；底层由 DuckDB 翻译执行，学习者无需感知。

### 3.1 多维聚合统计 `agg`

| 能力点 ID | 能力点 | 实现要求（模拟 MySQL 环境） |
| --- | --- | --- |
| `agg.multi_group` | 多列分组与分组粒度控制 | `GROUP BY` 多列 |
| `agg.rollup` | 小计与合计行 | `WITH ROLLUP` + `GROUPING()` 区分真 NULL 与小计行 |
| `agg.grouping_sets` | 任意维度组合汇总 | MySQL 无 `GROUPING SETS`，须用 `UNION ALL` 手工拼装 |
| `agg.conditional` | 条件聚合 | `SUM(CASE WHEN ... THEN ... ELSE 0 END)`，无 `FILTER` 子句 |
| `agg.distinct_count` | 去重计数与多粒度对齐 | `COUNT(DISTINCT ...)`；识别 JOIN 导致的行膨胀 |
| `agg.ratio` | 组内占比与总计占比 | 窗口 `SUM() OVER (PARTITION BY ...)` 或子查询回连 |
| `agg.having` | 聚合后过滤 | `HAVING` 与 `WHERE` 的执行顺序差异 |

### 3.2 窗口函数排序 `window`

| 能力点 ID | 能力点 | 实现要求（模拟 MySQL 环境） |
| --- | --- | --- |
| `window.rank_family` | 三种排名函数的选择 | `ROW_NUMBER` / `RANK` / `DENSE_RANK` 的并列语义差异 |
| `window.topn` | 组内 TopN | `PARTITION BY` + 排名，外层 CTE 过滤（MySQL 无 `QUALIFY`，写了即被拦截） |
| `window.dedup` | 取每组最新一条 | 极高频真实需求：按 `ROW_NUMBER() = 1` 去重 |
| `window.lag_lead` | 取相邻记录 | `LAG` / `LEAD` 及其 `default` 参数 |
| `window.cumulative` | 累计值 | `SUM() OVER (ORDER BY ... ROWS UNBOUNDED PRECEDING)` |
| `window.moving_avg` | 移动平均 | `ROWS BETWEEN n PRECEDING AND CURRENT ROW`，以及 `ROWS` 与 `RANGE` 的陷阱 |
| `window.frame_trap` | 窗口帧默认值陷阱 | 有 `ORDER BY` 时默认帧是 `RANGE UNBOUNDED PRECEDING`，遇重复值会出错 |

### 3.3 留存率分析 `retention`

| 能力点 ID | 能力点 | 实现要求（模拟 MySQL 环境） |
| --- | --- | --- |
| `retention.anchor` | 首次行为锚点 | 用 `MIN(date)` 确定每个用户的 Day 0 |
| `retention.cohort` | Cohort 划分 | 按注册日 / 首单日 / 首次活跃日分组，三者口径不同 |
| `retention.nday` | 次日 / 7 日 / 30 日留存 | 「第 N 日留存」与「N 日内留存」是两个口径，必须区分 |
| `retention.matrix` | 留存矩阵 | cohort（行）× day_diff（列）的二维输出 |
| `retention.denominator` | 分母口径 | 分母是否剔除观察期不足的 cohort，直接决定数字对不对 |
| `retention.churn_return` | 流失与回流 | 连续 N 日无行为定义流失；流失后再活跃定义回流 |
| `retention.date_fill` | 日期空档补全 | MySQL 无 `generate_series`，必须 `LEFT JOIN dim_date` 物理日期维表 |

### 3.4 同环比计算 `growth`

| 能力点 ID | 能力点 | 实现要求（模拟 MySQL 环境） |
| --- | --- | --- |
| `growth.date_spine` | 日期维表补全空档 | MySQL 无 `generate_series`，必须 `LEFT JOIN dim_date` |
| `growth.mom` | 环比 | `LAG` 按时间序取上期；注意缺失月份会让 `LAG` 取错 |
| `growth.yoy` | 同比 | 自连接对齐去年同期，或对 `dim_date` 做偏移 |
| `growth.ytd` | 累计同比 | YTD / MTD 累计窗口 |
| `growth.grain_align` | 时间粒度对齐 | 自然月 vs 滚动 30 天；自然周 vs 最近 7 天 |
| `growth.safe_div` | 除零与空值 | `NULLIF(prev, 0)`；上期为 0 时增长率应为 NULL 还是 100% |
| `growth.boundary` | 跨年跨月边界 | 1 月的环比要取去年 12 月 |

### 3.5 行列转换 `pivot`

| 能力点 ID | 能力点 | 实现要求（模拟 MySQL 环境） |
| --- | --- | --- |
| `pivot.long2wide` | 长转宽 | MySQL 无 `PIVOT`，必须条件聚合手写列 |
| `pivot.wide2long` | 宽转长 | MySQL 无 `UNPIVOT`，用 `UNION ALL` 或 `JOIN` 数字表 |
| `pivot.multi_metric` | 多指标同时透视 | 一次透视出「金额 + 订单数 + 客单价」三组列 |
| `pivot.dynamic_col` | 动态列问题 | 认知层面：SQL 无法动态出列，须固定枚举或交给应用层 |
| `pivot.string_agg` | 字符串聚合 | `GROUP_CONCAT(... ORDER BY ... SEPARATOR ...)` 及长度截断陷阱 |
| `pivot.split_rows` | 单列拆多行 | `JSON_TABLE` 或数字辅助表 + `SUBSTRING_INDEX` |

### 3.6 漏斗转化分析 `funnel`

| 能力点 ID | 能力点 | 实现要求（模拟 MySQL 环境） |
| --- | --- | --- |
| `funnel.unordered` | 无序漏斗 | 只看各步是否发生过，不看先后 |
| `funnel.ordered` | 有序漏斗 | 事件必须按序发生，用 `MIN(time)` 逐级递增约束 |
| `funnel.time_window` | 时间窗约束 | 「30 分钟内完成」的漏斗，用自连接 + 时间差过滤 |
| `funnel.session` | 会话内漏斗 | 按 `session_id` 划定漏斗边界 |
| `funnel.step_vs_total` | 单步 vs 整体转化率 | 分母是上一步还是第一步，两个指标都要会算 |
| `funnel.by_channel` | 分渠道漏斗对比 | 漏斗 × 维度的交叉输出 |
| `funnel.drop_off` | 流失定位 | 找出流失最严重的环节及流失用户特征 |

---

## 4. 数据集设计

三套数据集并存，运行时通过顶部切换器自由切换。每套数据集 **A（主）/ B（变体）** 两个 DuckDB 文件，共 6 个 `.duckdb` 文件（仅作静默存储，学习者不感知 DuckDB）。

| 数据集 | 文件（A / B） | 定位 | 强项场景 |
| --- | --- | --- | --- |
| 电商交易 | `data/duckdb/shop_a.duckdb` / `shop_b.duckdb` | 主数据集，题量最大 | 全部六场景，尤以多维聚合、同环比、行列转换见长 |
| 内容社区 | `data/duckdb/feed_a.duckdb` / `feed_b.duckdb` | 埋点行为为主 | 留存、漏斗、窗口排序 |
| SaaS 订阅 | `data/duckdb/saas_a.duckdb` / `saas_b.duckdb` | 订阅制指标 | 同环比、留存（续费）、多维聚合 |

每个文件以**只读模式**打开（`duckdb.connect(path, read_only=True)`），从机制上杜绝任何写操作。

### 4.1 电商交易 `shop`

```
dim_date         日期维表（date_key, y, q, m, w, dow, is_weekend, is_holiday,
                            last_year_same_date, prev_month_date）
dim_channel      渠道维表（channel_id, channel_name, channel_type）
dim_city         城市维表（city_id, city_name, province, region, city_tier）
dim_product      商品维表（product_id, product_name, cat_l1, cat_l2, brand,
                            list_price, launch_date, is_new）
users            用户（user_id, register_date, register_channel_id, city_id, gender, age_band）
orders           订单（order_id, user_id, order_time, pay_time, status,
                       channel_id, total_amount, discount_amount, pay_amount）
                 status ∈ (created, paid, shipped, completed, cancelled, refunded)
order_items      订单明细（order_id, item_seq, product_id, qty, unit_price, item_amount）
refunds          退款（refund_id, order_id, refund_time, refund_amount, reason）
events           埋点（event_id, user_id, session_id, event_time, event_name,
                       page, product_id, channel_id）
                 event_name ∈ (view_home, view_product, add_cart, submit_order, pay_success)
```

### 4.2 内容社区 `feed`

```
dim_date         同上
users            用户（user_id, register_date, register_channel, city_tier, is_creator）
contents         内容（content_id, author_id, publish_time, topic_id, content_type, duration_sec）
topics           话题（topic_id, topic_name, category）
events           行为（event_id, user_id, session_id, event_time, event_name,
                       content_id, stay_sec）
                 event_name ∈ (impression, click, play, finish, like, comment, share, follow)
daily_active     日活快照（stat_date, user_id, active_minutes, is_new）
```

### 4.3 SaaS 订阅 `saas`

```
dim_date         同上
accounts         企业账号（account_id, signup_date, industry, company_size, source_channel）
users            成员（user_id, account_id, join_date, role）
subscriptions    订阅（sub_id, account_id, plan, seats, start_date, end_date,
                       mrr, status, is_trial）
                 status ∈ (trialing, active, past_due, churned, upgraded, downgraded)
invoices         账单（invoice_id, account_id, bill_date, amount, paid, pay_date）
feature_usage    功能使用日志（log_id, account_id, user_id, use_time, feature_code）
trial_conversion 试用转化（account_id, trial_start, trial_end, converted, convert_date）
```

### 4.4 数据生成规范

生成脚本必须满足以下要求，否则题目训练不到真实的口径判断：

1. **固定随机种子。** A 库 `seed=42`，B 库 `seed=20260806`，保证可复现、可重建。
2. **故意埋坑。** 数据中必须包含：
   - NULL 值（未支付订单的 `pay_time`、未填写的城市）
   - 取消单与退款单（不排除就会算错 GMV）
   - 重复事件（同一用户同一秒多次点击）
   - 中间缺失日期（某些日期完全无数据，考察 `dim_date` 补全）
   - 并列值（销售额完全相同的商品，考察 RANK 与 DENSE_RANK 的差异）
   - 跨年跨月边界数据（考察同环比的边界处理）
   - 极端值（单笔巨额订单、注册当天即流失的用户）
3. **A / B 库同 schema、异数据。** B 库不是 A 库的简单缩放，用户规模、时间跨度、品类分布都要不同，确保硬编码答案必然在 B 库失败。
4. **规模控制。** 单库总数据量控制在使得典型查询 1 秒内返回：
   - `shop`：users ≈ 3 万，orders ≈ 20 万，order_items ≈ 50 万，events ≈ 120 万
   - `feed`：users ≈ 5 万，events ≈ 200 万
   - `saas`：accounts ≈ 5 千，feature_usage ≈ 50 万
5. **时间跨度统一**为 2024-01-01 至 2025-12-31，两个完整自然年，保证同比可算。

---

## 5. DuckDB 静默执行引擎 + 模拟纯 MySQL 环境

**v1.2 的核心架构约束。** DuckDB 是轻量、单文件、零服务进程的执行底座；但对使用者而言，运行环境**就是纯 MySQL**——题面、参考解、提示、报错提示全部围绕 MySQL 8.0 能力展开，PG/DuckDB 独有语法从入口被拦截。

### 5.1 为什么用 DuckDB（表面仍是 MySQL）

- 数据必须留在项目路径内 + 轻量化优先级最高 → DuckDB 单文件 + 无服务进程完美契合。
- 但学习者写的是 MySQL；DuckDB 在内部把它翻译成可执行形式。学习者全程不接触 PG 语法。
- 参考解同样用 MySQL 编写，经**同一条**翻译层执行，保证与学习者代码在同一执行路径上对照，避免"参考解是 PG、我的代码是 MySQL"的混乱。

### 5.2 运行时模拟纯 MySQL：PG 独有语法静态拦截

提交 SQL 先过静态检查，除了拦截 DDL/DML，**还要拦截 MySQL 不支持的 PG/DuckDB 语法**，并给出 MySQL 替代写法提示。这一条直接实现"表面纯 MySQL"。

| 被拦截的语法（PG/DuckDB 独有） | 反馈提示：改用 MySQL 写法 |
| --- | --- |
| `QUALIFY` | 窗口函数结果过滤请外套一层 CTE 或子查询，再在 WHERE 中过滤名次 |
| `PIVOT` / `UNPIVOT` | 用条件聚合（`SUM(CASE WHEN ...)`）/ `UNION ALL` 手写行列转换 |
| `GROUPING SETS` / `CUBE` | 用 `WITH ROLLUP` + `GROUPING()`，或多组 `UNION ALL` |
| `generate_series` | 用物理日期维表 `dim_date` 做 `LEFT JOIN` 补全日期 |
| `UNNEST` / 数组展开 | 用数字辅助表或 `JSON_TABLE` + `SUBSTRING_INDEX` 拆行 |
| `FILTER (WHERE ...)` | 用 `SUM(CASE WHEN ... THEN ... ELSE 0 END)` |
| `LATERAL` | 用相关子查询 |
| 双引号字符串字面量（MySQL 习惯误写） | 字符串请使用单引号；双引号在 MySQL 中是标识符 |

> 注意：拦截发生在"执行前"，因此学习者永远不会在运行结果或报错里看到 PG 语法提示；只有明确的"请用 MySQL 写法"引导。

### 5.3 翻译层（MySQL → DuckDB，仅内部执行用）

仅对**通过静态检查后的 MySQL 代码**做翻译，翻译一次后在 A、B 两库各执行一次。参考解也走同一翻译路径。

| MySQL 写法 | DuckDB 目标 | 说明 |
| --- | --- | --- |
| `` `col` `` 反引号标识符 | `"col"` | 统一风格 |
| `DATE_FORMAT(d, '%Y-%m-%d')` | `strftime(d, '%Y-%m-%d')` | 格式符 `%i→%M`、`%s→%S`、`%T` 等需映射 |
| `LIMIT off, n`（偏移,条数） | `LIMIT n OFFSET off` | 顺序对调 |
| `DATEDIFF(a, b)` | `date_diff('day', b, a)` | 参数顺序反转 |
| `DATE_ADD(d, INTERVAL n UNIT)` | `d + INTERVAL n UNIT` | DuckDB 支持 `INTERVAL n DAY` 字面量 |
| `DATE_SUB(d, INTERVAL n UNIT)` | `d - INTERVAL n UNIT` | 同上 |
| `GROUP_CONCAT(x ORDER BY c SEPARATOR s)` | `string_agg(x, s ORDER BY c)` | 顺序/分隔符映射 |
| `IF(c, a, b)` | `CASE WHEN c THEN a ELSE b END` | DuckDB 也有 `if()`，转换以保兼容 |
| `IFNULL(a, b)` | `coalesce(a, b)` | 同上 |
| `CURDATE()` | `current_date` | |
| `NOW()` | `now()` | 二者均支持，基本无需改 |
| `col REGEXP 'pat'` | `regexp_matches(col, 'pat')` | |
| `CONCAT_WS(s, ...)` | `concat_ws(s, ...)` | DuckDB 原生支持，直过 |
| `INSERT ... ON DUPLICATE KEY` / `REPLACE` | （不支持） | 训练题不涉及 DML，越权拦截即可 |

### 5.4 翻译层的已知边界（如实告知学习者）

规则化翻译无法覆盖**语义级**差异，以下情况翻译后仍可能报错或结果不符，反馈中明确提示：

1. **双引号字符串字面量**：MySQL 非 ANSI 模式下 `"abc"` 是字符串，DuckDB 中 `"abc"` 是标识符。学习者务必用**单引号**写字符串。
2. **隐式类型转换**：MySQL 较宽松（如 `'123' + 1`、日期与字符串比较），DuckDB 较严格。这类问题需学习者自行修正写法。
3. **DML / 存储过程**：训练题只涉及 SELECT，写入类语句本就被静态检查拦截，与翻译层无关。

> 设计取舍：翻译层目标是覆盖学习者 95% 的 MySQL SELECT 代码，而非做一个完整的 MySQL 兼容层。越界部分用友好报错 + 提示引导。

### 5.5 静态安全检查（保留）

翻译之前先做安全与形态检查，仅允许单条 `SELECT` / `WITH` 语句：

- 拦截 DDL / DML / 多语句 / `INTO OUTFILE` / `LOAD_FILE` / `CALL` / `INSERT / UPDATE / DELETE / REPLACE / DROP / ALTER`
- 拦截 PG/DuckDB 独有语法（见 5.2）
- **不拦截**纯 MySQL 的合法能力（含窗口函数、CTE、`WITH ROLLUP`、`GROUP_CONCAT` 等）

---

## 6. 题目内容模型

每道题是一个 YAML 文件，路径 `content/questions/{dataset}/{scenario}/{id}.yaml`。**所有 SQL 字段（reference_sql / alt_solutions / hints 中的示例）一律 MySQL 8.0 语法。**

```yaml
id: shop-window-002
dataset: shop
scenario: window
chain: shop-window-chain-a          # 业务任务链标识
chain_step: 2                       # 链内序号，非难度
title: 各一级品类销售额 Top3 商品

business_prompt: |
  运营同学在群里 @ 你：
  "大促复盘要用，帮我拉一下 2025 年 Q2 每个一级品类里实付金额排前三的商品，
   要商品名、品类名、实付金额和名次。金额一样的算并列，并列之后名次别跳号。"

context_notes:                      # 业务背景补充，模拟"你本来就该知道的事"
  - 实付金额指订单明细的 item_amount 之和
  - 已取消和已退款的订单不计入销售额

tables: [orders, order_items, dim_product]

expected_columns:
  - {name: cat_l1,       type: string}
  - {name: product_name, type: string}
  - {name: pay_amount,   type: decimal, tolerance: 0.01}
  - {name: rn,           type: int}

order_sensitive: false              # 行序不敏感，判题时统一排序后比对
row_limit: 500

constraints:
  must_match:
    - pattern: '(?i)\bdense_rank\s*\(\s*\)\s*over\b'
      reason: 本题的训练目标是并列不跳号的排名，必须使用 DENSE_RANK
  must_not_match:
    - pattern: '(?i)\blimit\s+3\b'
      reason: 用 LIMIT 只能取全局前三，无法实现分组 TopN

hints:                              # 三级提示，逐级解锁（使用提示后判为"参考通过"）
  - 先确认"实付金额"的口径：需要排除哪些订单状态？
  - 名次并列且不跳号 —— ROW_NUMBER、RANK、DENSE_RANK 三者选哪个？
  - MySQL 8.0 没有 QUALIFY，窗口函数算出的名次必须先放进 CTE 或子查询，才能在外层过滤。

reference_sql: |                    # MySQL 8.0 最优解（经翻译层执行，与学习者同路径）
  WITH item_amt AS (
      SELECT p.cat_l1, p.product_name, SUM(oi.item_amount) AS pay_amount
      FROM order_items oi
      JOIN orders o    ON o.order_id = oi.order_id
      JOIN dim_product p ON p.product_id = oi.product_id
      WHERE o.order_time >= '2025-04-01'
        AND o.order_time <  '2025-07-01'
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.cat_l1, p.product_name
  ),
  ranked AS (
      SELECT cat_l1, product_name, pay_amount,
             DENSE_RANK() OVER (PARTITION BY cat_l1 ORDER BY pay_amount DESC) AS rn
      FROM item_amt
  )
  SELECT cat_l1, product_name, pay_amount, rn
  FROM ranked
  WHERE rn <= 3;

alt_solutions:                      # 等价 MySQL 解，用于内容自检验证判题不误杀
  - |                                # 用子查询而非 CTE 的等价写法
    SELECT * FROM (
        SELECT p.cat_l1, p.product_name,
               DENSE_RANK() OVER (PARTITION BY p.cat_l1 ORDER BY SUM(oi.item_amount) DESC) AS rn
        FROM order_items oi
        JOIN orders o ON o.order_id = oi.order_id
        JOIN dim_product p ON p.product_id = oi.product_id
        WHERE o.order_time >= '2025-04-01' AND o.order_time < '2025-07-01'
          AND o.status NOT IN ('cancelled', 'refunded')
        GROUP BY p.cat_l1, p.product_name
    ) t WHERE t.rn <= 3;

explanation: |                      # 讲解同样基于 MySQL 写法
  三个层次（均为 MySQL 8.0 可行写法）：
  1. 口径 —— "实付金额"必须落到 order_items 粒度求和。
  2. 排名 —— "并列且不跳号"精确对应 DENSE_RANK。
  3. 过滤 —— MySQL 无 QUALIFY，窗口函数不能出现在 WHERE 中，必须分层（CTE 或子查询）。

pitfalls:
  - 直接对 orders.pay_amount 求和，多商品订单会被重复计入每个商品
  - 忘记排除 cancelled / refunded 状态
  - 用 RANK 导致并列后名次跳号，Top3 实际只返回 2 个不同名次
  - 试图在 WHERE 里直接写 DENSE_RANK() <= 3

capability_points: [window.rank_family, window.topn, agg.multi_group]
```

---

## 7. 判题引擎

采用**最严档**：静态检查（含 PG 语法拦截）→ 翻译 → 主库执行 → 归一化比对 → 变体库复核 → 写法约束，全部通过才判定 PASS。

### 7.1 执行流程

```
①  静态安全与形态检查
    ├─ 必须是单条语句，以 SELECT 或 WITH 开头
    ├─ 拦截 DDL / DML / 多语句 / INTO OUTFILE / LOAD_FILE / CALL
    ├─ 拦截 PG/DuckDB 独有语法（QUALIFY / PIVOT / GROUPING SETS / generate_series / UNNEST / FILTER / LATERAL）
    └─ 失败 → STATIC_REJECTED（含具体违规项 + MySQL 替代写法）或 PG_SYNTAX_NOT_ALLOWED

②  MySQL → DuckDB 翻译（学习者 SQL 与参考解走同一条路径）
    ├─ 应用 5.3 规则表
    ├─ 翻译异常 → TRANSLATE_FAILED，提示具体哪段写法无法转换 + 改用建议
    └─ 翻译后 SQL 同时用于 A、B 两库

③  主库 A 只读执行
    ├─ duckdb.connect('data/duckdb/{ds}_a.duckdb', read_only=True)
    ├─ Python 层超时（默认 5s，线程 watchdog）+ 结果行数上限 100,000
    └─ 失败 → EXEC_ERROR（透传 DuckDB 报错，并附"可能因双引号字符串/隐式类型转换导致"提示）或 TIMEOUT

④  结果归一化
    ├─ 列名：大小写不敏感、去首尾空格后按名称匹配
    ├─ 行序：order_sensitive=false 时对全部列做稳定排序后比对
    ├─ 数值：DECIMAL 统一精度，浮点按题目声明的 tolerance 容差
    ├─ 空值：NULL 与 NULL 视为相等
    └─ 类型：INT / DECIMAL / DOUBLE 之间允许跨类型数值比较

⑤  与 A 库参考解结果比对（参考解结果在构建期预计算并缓存为 parquet）
    └─ 失败 → COLUMN_MISMATCH / ROW_COUNT_MISMATCH / VALUE_MISMATCH

⑥  变体库 B 复核（反作弊核心）
    ├─ 同一条（已翻译的）SQL 在 {ds}_b.duckdb 上再跑一遍，与 B 库参考解比对
    └─ A 通过而 B 失败 → HARDCODE_SUSPECTED（判定为未通过，并明确提示原因）

⑦  写法约束校验
    ├─ must_match / must_not_match 正则
    └─ 失败 → CONSTRAINT_VIOLATED，反馈中必须说明"为什么这题要求这么写"

⑧  PASS（或使用提示时为 REFERENCE_PASS）
```

### 7.2 反馈码与反馈粒度

| 反馈码 | 含义 | 反馈内容 |
| --- | --- | --- |
| `PASS` | 通过 | 耗时、行数、可选的参考解对照 |
| `REFERENCE_PASS` | 参考通过 | 使用过提示后判定通过；达到目标结果，但标记为"借助提示" |
| `STATIC_REJECTED` | 静态检查未过 | 具体违规项（如包含写操作） |
| `PG_SYNTAX_NOT_ALLOWED` | 使用了 PG/DuckDB 独有语法 | 明确提示"本训练器模拟 MySQL 环境"，并给出 MySQL 替代写法 |
| `TRANSLATE_FAILED` | 翻译失败 | 哪段 MySQL 写法无法转换 + 改用 DuckDB 的建议（理论上极少触发） |
| `EXEC_ERROR` | SQL 执行报错 | DuckDB 错误 + "可能因双引号字符串 / 隐式类型转换导致，请用单引号"等提示 |
| `TIMEOUT` | 超过 5 秒 | 提示可能存在笛卡尔积或缺少过滤条件 |
| `COLUMN_MISMATCH` | 列不匹配 | 缺哪几列、多哪几列、名称拼写差异 |
| `ROW_COUNT_MISMATCH` | 行数不符 | 多算 N 行 / 漏算 M 行，并给出示例行 |
| `VALUE_MISMATCH` | 值不符 | 差异最大的前 5 行，逐列高亮期望值与实际值 |
| `HARDCODE_SUSPECTED` | 换数据后失败 | 明确说明"你的 SQL 在另一份数据上结果不对，可能写死了某些值或依赖了特定数据分布" |
| `CONSTRAINT_VIOLATED` | 写法不符 | 违反了哪条约束、这条约束存在的原因 |

### 7.3 运行 vs 提交

- **运行**（Ctrl+Enter）：执行（含翻译）看结果，不判题、不计入尝试次数、不触发反作弊复核。用于探索数据。
- **提交**：走完整判题流水线，计入尝试记录；使用过提示则判为 `REFERENCE_PASS`。

### 7.4 内容自检脚本

`scripts/validate_content.py` 在每次内容变更后运行，确保：

- 每题的 `reference_sql`（MySQL 语法）经翻译层后在 A / B 两库均能执行成功且结果非空
- `reference_sql` 自身满足该题的 `constraints`，且**不包含任何被 5.2 拦截的 PG 语法**（防止参考解偷偷用 PG）
- 实际输出列与 `expected_columns` 完全一致
- 所有 `alt_solutions`（MySQL 语法）均能被判定为 PASS（**验证判题不会误杀等价写法**）
- 引用的表名均存在于该数据集的 schema 中
- **翻译层验证**：对每题构造一段"典型 MySQL 写法"的等价 SQL，确认经翻译层后也能被判定 PASS

这一步是最严判题模式能否成立的前提，不做自检必然出现大量误判。

---

## 8. 进度与学习闭环（完整版）

经 v1.3 决策（第 15 章 #1 选 (c)）：本项目保留**完整学习闭环** —— 轻量覆盖标记 + 错题本 + 间隔重练 SRS。三者统一存于 `runtime/progress.sqlite`，与训练数据物理隔离。

### 8.1 覆盖标记与尝试记录（基础层）

```
attempts        (id, question_id, submitted_at, sql_text, verdict, elapsed_ms,
                 rows_returned, hints_used, revealed_answer)
question_state  (question_id, best_verdict, first_pass_at, last_pass_at, attempt_count)
scenario_stat    (dataset, scenario, total, passed, reference_passed)   # 场景完成度
```

- `verdict` ∈ `PASS` / `REFERENCE_PASS` / `FAIL`
- 场景完成度 = 该场景下 `best_verdict ∈ {PASS, REFERENCE_PASS}` 的题数 / 总题数
- 使用过提示 → `REFERENCE_PASS`，不计入"纯通过"，但计入覆盖标记

### 8.2 错题本（按能力点聚类）

- 判定为 `FAIL` 或 `HARDCODE_SUSPECTED` 的提交自动进入错题本，按题目声明的 `capability_points` 聚类归因。
- 错题本首页展示：每个能力点下有多少题尚未稳定通过，引导"哪块最该补"。
- 错题可一键重做；重做通过后从"活跃错题"移出（保留历史记录）。

### 8.3 间隔重练 SRS

- 通过（含 `REFERENCE_PASS`）的题按 **1 / 3 / 7 / 21 / 60 天**梯度排期重练，到期出现在"今日重练"队列。
- 重练时若再次 `FAIL` 或 `HARDCODE_SUSPECTED`，重置排期并回到错题本。
- 重练仅重新判题、不重新出题，保证"练过的场景别忘"而不增加新负担。

---

## 9. 前端设计

### 9.1 页面结构

```
┌──────────────────────────────────────────────────────────────────────┐
│  SQL Trainer   [数据集 ▾ 电商交易]        场景完成度 12/48            │
├──────────────────────────────────────────────────────────────────────┤
│ 场景导航 │                                                            │
│          │  ┌── 业务需求 ─────────────────────────────────────────┐   │
│ ● 多维聚合│  │ 运营同学在群里 @ 你："大促复盘要用，帮我拉一下…"    │   │
│   3/8    │  │ 补充说明：实付金额指订单明细之和；排除取消退款单    │   │
│          │  └────────────────────────────────────────────────────┘   │
│ ● 窗口排序│                                                            │
│   1/8    │  ┌── 期望输出 ──┐  ┌── SQL 编辑器 ──────────────────────┐  │
│          │  │ cat_l1       │  │ WITH item_amt AS (                 │   │
│ ○ 留存分析│  │ product_name │  │   SELECT ...                       │   │
│   0/8    │  │ pay_amount   │  │ )                                  │   │
│          │  │ rn           │  │                                    │   │
│ ○ 同环比  │  └──────────────┘  └────────────────────────────────────┘  │
│   0/8    │                     [运行 Ctrl+Enter]  [提交]  [提示 1/3]  │
│          │                                                            │
│ ○ 行列转换│  ┌── 结果 / 判题反馈 ─────────────────────────────────┐   │
│   0/8    │  │ ✗ 值不匹配：3 行数值有差异                          │   │
│          │  │ 提示：检查是否排除了退款订单                        │   │
│ ○ 漏斗转化│  └────────────────────────────────────────────────────┘   │
├──────────┴────────────────────────────────────────────────────────────┤
│ Schema 侧栏（可折叠）：表 → 字段 → 类型 → 注释，点击插入编辑器        │
└───────────────────────────────────────────────────────────────────────┘
```

### 9.2 P0 功能清单

| 模块 | 功能 |
| --- | --- |
| 数据集切换 | 顶部下拉，切换后场景进度与题库同步刷新 |
| 场景导航 | 六场景侧栏，显示各自完成度；场景内按任务链分组展示题目 |
| 题目区 | 业务需求描述 + 业务背景补充 + 期望输出列清单 |
| Schema 侧栏 | 当前数据集的表结构树，含字段注释与枚举值说明，点击插入编辑器 |
| SQL 编辑器 | CodeMirror 6，MySQL 方言高亮 + 表名/列名自动补全 + 格式化 + Ctrl+Enter 运行 |
| 结果区 | 分页表格、列类型标注、行数与耗时显示 |
| 判题反馈 | 分级反馈码 + 差异行高亮对照 |
| 提示系统 | 三级提示逐级解锁（使用提示后判为"参考通过"） |
| 参考解 | 解锁后展示 **MySQL** 参考 SQL + 讲解（一律 MySQL 写法，无 PG） |
| 错题本 | 按能力点聚类的错题列表，一键重做 |
| 间隔重练 | 「今日重练」队列，SRS（1/3/7/21/60 天）梯度排期 |
| 进度总览 | 按场景的完成度（含错题本 / 重练到期提示） |

### 9.3 P1 / P2（V2 考虑）

- 能力点雷达图
- 我的历史解法归档
- 自由探索 sandbox 模式
- 自定义加题界面
- 学习报告导出

---

## 10. 技术架构

### 10.1 技术选型

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 数据库 | **DuckDB（Python `duckdb` 包）** | 单文件、零服务进程、启动即开；表面模拟 MySQL，底层翻译执行 |
| 后端 | Python 3.13 + FastAPI | 异步、自带 OpenAPI、启动快 |
| DB 驱动 | `duckdb`（Python，内置） | 进程内执行，无网络开销 |
| 结果比对 | pandas + pyarrow | 归一化比对与 parquet 缓存 |
| 进度存储 | SQLite（标准库 `sqlite3`） | 零依赖，与训练数据物理隔离 |
| 内容格式 | YAML（PyYAML） | 手写友好，便于版本管理 |
| 前端 | React 18 + TypeScript + Vite | 生态成熟，编辑器组件齐全 |
| 编辑器 | CodeMirror 6 + `@codemirror/lang-sql`（MySQL 方言） | 高亮贴合 MySQL 习惯，补全可注入 schema |
| 样式 | Tailwind CSS | 快速搭建舒适界面 |
| 打包分发 | Vite 构建到 `web/dist`，FastAPI 静态托管 | 单端口、单进程、一条命令启动 |

### 10.2 数据库运行模式

| 模式 | 说明 | 数据位置 |
| --- | --- | --- |
| **A · 项目内单文件（默认）** | 6 个 `.duckdb` 文件（3 数据集 × A/B）置于 `data/duckdb/`，以只读模式打开 | 完全在项目路径内 ✅，零服务进程 |
| B · 外部文件 | 在 `config.yaml` 中指定各数据集 A/B 的 `.duckdb` 绝对路径 | 训练库落在指定位置；题库、进度、缓存仍在项目内 |

**DuckDB 模式的代价极低**：`pip install duckdb` 体积约几十 MB，无服务进程、无端口、无首次初始化等待。冷启动即开。

**清理机制**：提供 `python run.py --reset` 一键删除 `data/duckdb/` 并重建，避免用户手动删文件出错。

### 10.3 目录结构

```
SQL-Trainer/
├─ run.py                      # 唯一入口：起 API → 开浏览器 → 退出时优雅关闭（无需启停数据库）
├─ config.yaml                 # 数据集路径、超时、行数上限
├─ requirements.txt            # 含 duckdb / fastapi / pyarrow / pyyaml / pandas
├─ docs/
│  └─ PRD.md
├─ app/
│  ├─ main.py
│  ├─ api/
│  │  ├─ datasets.py  scenarios.py  questions.py
│  │  ├─ execute.py   submit.py
│  │  └─ progress.py
│  ├─ core/
│  │  ├─ duckdb_runtime.py    # DuckDB 连接管理（只读模式）
│  │  ├─ sanitizer.py         # 静态安全检查 + PG 语法拦截（5.2）
│  │  ├─ mysql_to_duckdb.py   # MySQL → DuckDB 翻译层（5.3 规则）
│  │  ├─ executor.py          # 限时限行执行（Python watchdog）
│  │  ├─ normalizer.py        # 结果集归一化
│  │  ├─ judge.py             # 双库比对与反馈生成
│  │  └─ content_loader.py    # YAML 题库加载与校验
│  └─ storage/progress.py      # SQLite 读写（轻量覆盖标记）
├─ content/
│  ├─ datasets/
│  │  ├─ shop/{schema.sql, generate.py, meta.yaml}
│  │  ├─ feed/{...}
│  │  └─ saas/{...}
│  └─ questions/
│     ├─ shop/{agg,window,retention,growth,pivot,funnel}/*.yaml
│     ├─ feed/{...}
│     └─ saas/{...}
├─ data/duckdb/                # 6 个训练库文件（不进版本库）
│  ├─ shop_a.duckdb  shop_b.duckdb
│  ├─ feed_a.duckdb  feed_b.duckdb
│  └─ saas_a.duckdb  saas_b.duckdb
├─ runtime/
│  ├─ progress.sqlite
│  └─ logs/
├─ scripts/
│  ├─ build_datasets.py        # 建表 + 生成 A/B 数据 + 预计算参考解（落 DuckDB + parquet 缓存）
│  └─ validate_content.py      # 题库自检（含 PG 语法检查 + 翻译覆盖验证）
└─ web/
   ├─ src/
   └─ dist/                    # 构建产物，由 FastAPI 托管
```

### 10.4 API 草案

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/datasets` | 三套数据集列表与各自进度 |
| GET | `/api/datasets/{ds}/schema` | 表结构树（供 Schema 侧栏与编辑器补全） |
| GET | `/api/scenarios?dataset=` | 六场景及完成度 |
| GET | `/api/questions?dataset=&scenario=` | 题目列表（按任务链分组） |
| GET | `/api/questions/{id}` | 题目详情（不含参考解） |
| POST | `/api/execute` | `{dataset, sql}` → 结果预览（含翻译），不判题 |
| POST | `/api/submit` | `{question_id, sql}` → 完整判题结果（含翻译 + PG 拦截 + B 库复核） |
| POST | `/api/questions/{id}/hint` | `{level}` → 解锁指定级别提示 |
| POST | `/api/questions/{id}/reveal` | 解锁 **MySQL** 参考解与讲解 |
| GET | `/api/progress/overview` | 总览：场景维度完成度 |

---

## 11. 内容规模与分配

首版共 **48 题**，覆盖「数据集 × 场景」全部 18 个组合，切换任意数据集都不会遇到空场景。

| 数据集 | 每场景题量 | 小计 |
| --- | --- | --- |
| 电商交易 `shop` | 4 | 24 |
| 内容社区 `feed` | 2 | 12 |
| SaaS 订阅 `saas` | 2 | 12 |
| **合计** | | **48** |

任务链组织：`shop` 每场景 4 题构成一条完整业务链；`feed` / `saas` 每场景 2 题构成一条短链。所有参考解与提示均为 MySQL 语法。

V2 内容目标：每个组合补齐到 4–6 题，总量约 90–110 题。

---

## 12. 验收标准

| 类别 | 指标 |
| --- | --- |
| 启动 | `python run.py` 一条命令完成全部启动；冷启动 < 3 秒（DuckDB 无初始化） |
| 响应 | 题目切换 < 200 ms；典型查询执行 < 1 秒；判题全流程（含 B 库复核）< 3 秒 |
| 判题准确性 | 全部 48 题的 `reference_sql`（MySQL）与 `alt_solutions` 100% 判定 PASS；`validate_content.py` 零告警 |
| 翻译覆盖 | 每题构造的"典型 MySQL 写法"等价 SQL 经翻译层后 100% 判定 PASS |
| PG 语法拦截 | 构造的 10 条含 QUALIFY/PIVOT/GROUPING SETS 等的 SQL 100% 被 `PG_SYNTAX_NOT_ALLOWED` 拦截 |
| 反作弊有效性 | 人工构造的 5 条硬编码 SQL 100% 被 `HARDCODE_SUSPECTED` 拦截 |
| 数据隔离 | 训练库文件均在项目 `data/duckdb/` 内；删除项目目录即彻底清除 |
| 安全性 | 只读模式连接 + 静态检查，构造的 10 条越权 SQL 全部被拦截 |
| 内容质量 | 每题的业务需求描述可独立阅读；参考解无任何 PG 语法 |

---

## 13. 里程碑

| 阶段 | 交付物 | 完成标志 |
| --- | --- | --- |
| **M0 · 数据地基** | 三套 schema + A/B 数据生成器（`build_datasets.py`），全部 MySQL 风格 | 一键建好 6 个 `.duckdb` 文件，数据符合埋坑规范 |
| **M1 · 判题内核** | sanitizer（含 PG 拦截）/ mysql_to_duckdb / executor / normalizer / judge + CLI 验证 | 命令行提交一条 MySQL SQL 能得到完整分级反馈（含 PG 拦截 + 翻译 + 反作弊） |
| **M2 · 内容管线** | 题目 YAML 模型、加载器、`validate_content.py`（含 PG 语法检查 + 翻译覆盖验证） | `shop` 数据集六场景各 1 题跑通全流程自检 |
| **M3 · 前端 MVP** | 完整交互界面，接通全部 P0 API，参考解展示为 MySQL | 能在浏览器里完成「选题 → 写 → 提交 → 看反馈 → 看 MySQL 参考解」 |
| **M4 · 内容填充** | 48 题全部完成（参考解/提示/讲解均为 MySQL） | 内容自检全绿，三套数据集均可切换使用 |
| **M5 · 完整闭环** | 错题本（按能力点聚类）+ 间隔重练 SRS + 覆盖标记 | 场景完成度统计准确；错题本能按能力点归因；SRS 重练队列按 1/3/7/21/60 天梯度触发 |

---

## 14. 风险与对策

| 编号 | 风险 | 影响 | 对策 |
| --- | --- | --- | --- |
| R1 | 翻译层误翻 / 漏翻，学习者 MySQL 代码在 DuckDB 报语法错 | 体验差 | 覆盖常见 ~20 条规则 + 友好报错提示改用单引号/具体语法；内容自检对每题用一段"典型 MySQL 写法"也跑通（见 7.4） |
| R2 | 最严判题误杀等价写法 | 挫败感强 | `alt_solutions` 强制每题至少 1 条（MySQL 等价解）；`validate_content.py` 把等价解通过率纳入自检；`must_match` 只在训练目标确实是特定写法时才加，且反馈必须解释原因 |
| R3 | B 库数据分布不同导致参考解结果为空 | 反作弊误报 | 构建期校验：参考解在 B 库结果行数必须 > 0，否则报错阻断 |
| R4 | 三套数据集 × 六场景内容工作量大 | 拖慢交付 | 先把 `shop` 全套跑通形成模板，`feed` / `saas` 复用同一套内容结构 |
| R5 | DuckDB 无内置语句超时 | 恶意/失误 SQL 拖垮本机 | Python 线程 watchdog 超时 + 结果行数上限（100,000）双重保险 |
| R6 | 参考解偷偷用了 PG 语法，造成学习混乱 | 违背"纯 MySQL"原则 | `validate_content.py` 强制扫描 `reference_sql` / `alt_solutions` 不含 5.2 拦截清单中的任何语法 |
| R7 | 题目业务描述不够真实，退化成语法题 | 失去项目核心价值 | 题面统一用「业务方对话体」撰写，且必须包含至少一个需要自行判断的口径歧义点 |

---

## 15. 待定项

以下细节需在开发前最终确认：

1. **进度/学习闭环的范围**：已确认 → **(c) 保留完整闭环**：轻量覆盖标记 + 错题本（按能力点聚类）+ 间隔重练 SRS（1/3/7/21/60 天梯度）。✅
2. **提示使用是否影响判定**：已确认 → 使用提示后仍可通过，但标记为 **`REFERENCE_PASS`（参考通过）**，与纯 `PASS` 区分。✅
3. **是否需要中文列名支持**：已确认 → 英文列名（与真实工作一致）。✅
4. **参考解是否经过翻译层**：已确认 → **必须经过**。参考解用 MySQL 编写，与学习者走同一条翻译路径，避免学习混乱；题解中绝不出现 PG 语法。✅

---

*文档结束 · v1.3（完整闭环 · 表面纯 MySQL · DuckDB 静默执行）*
