-- ============================================================================
-- 电商交易数据集 · shop（A / B 双库，结构完全一致，数据不同）
-- 命名与语义按 MySQL 习惯；底层由 DuckDB 静默执行。
-- 本文件供前端 Schema 树 / 编辑器自动补全展示，实际建表由 generate.py 完成。
-- ============================================================================

-- 日期维表：完整连续 2024-01-01 .. 2025-12-31（含闰年，共 731 天）
CREATE TABLE dim_date (
    date_key            DATE      NOT NULL PRIMARY KEY,   -- 日期
    y                   INTEGER   NOT NULL,               -- 年
    q                   INTEGER   NOT NULL,               -- 季度 1-4
    m                   INTEGER   NOT NULL,               -- 月 1-12
    w                   INTEGER   NOT NULL,               -- 年周序号 y*100+week
    dow                 INTEGER   NOT NULL,               -- 周几 1=Mon..7=Sun
    is_weekend          BOOLEAN   NOT NULL,               -- 是否周末
    is_holiday          BOOLEAN   NOT NULL,               -- 是否节假日
    last_year_same_date DATE      NOT NULL,               -- 去年同期日期
    prev_month_date     DATE      NOT NULL                -- 上月同日
);

-- 渠道维表
CREATE TABLE dim_channel (
    channel_id   INTEGER   NOT NULL PRIMARY KEY,
    channel_name VARCHAR   NOT NULL,
    channel_type VARCHAR   NOT NULL    -- app / web / offline / mini_program
);

-- 城市维表
CREATE TABLE dim_city (
    city_id   INTEGER   NOT NULL PRIMARY KEY,
    city_name VARCHAR   NOT NULL,
    province  VARCHAR   NOT NULL,
    region    VARCHAR   NOT NULL,      -- north / east / south / west / central
    city_tier INTEGER   NOT NULL       -- 1 / 2 / 3 / 4
);

-- 商品维表
CREATE TABLE dim_product (
    product_id   INTEGER   NOT NULL PRIMARY KEY,
    product_name VARCHAR   NOT NULL,
    cat_l1       VARCHAR   NOT NULL,   -- 一级品类：手机 / 电脑 / 家电 / 服饰 / 美妆 / 食品
    cat_l2       VARCHAR   NOT NULL,   -- 二级品类
    brand        VARCHAR   NOT NULL,
    list_price   DOUBLE    NOT NULL,   -- 标价
    launch_date  DATE      NOT NULL,   -- 上市日期
    is_new       BOOLEAN   NOT NULL    -- 是否新品（上市 < 180 天）
);

-- 用户
CREATE TABLE users (
    user_id            INTEGER   NOT NULL PRIMARY KEY,
    register_date      DATE      NOT NULL,
    register_channel_id INTEGER   NOT NULL,  -- 可为 NULL（埋坑：未登记渠道）
    city_id            INTEGER   NOT NULL,   -- 可为 NULL（埋坑：未填城市）
    gender             VARCHAR   NOT NULL,   -- M / F / U（U=未知）
    age_band           VARCHAR   NOT NULL    -- 18-25 / 26-35 / 36-45 / 46-55 / 55+
);

-- 订单
CREATE TABLE orders (
    order_id        INTEGER   NOT NULL PRIMARY KEY,
    user_id         INTEGER   NOT NULL,
    order_time      TIMESTAMP NOT NULL,
    pay_time        TIMESTAMP,             -- NULL = 未支付（埋坑）
    status          VARCHAR   NOT NULL,     -- created/paid/shipped/completed/cancelled/refunded
    channel_id      INTEGER   NOT NULL,
    total_amount    DOUBLE    NOT NULL,     -- 含折扣前
    discount_amount DOUBLE    NOT NULL,
    pay_amount      DOUBLE    NOT NULL      -- 实付 = total - discount（未支付时为 0）
);

-- 订单明细
CREATE TABLE order_items (
    order_id    INTEGER NOT NULL,
    item_seq    INTEGER NOT NULL,
    product_id  INTEGER NOT NULL,
    qty         INTEGER NOT NULL,
    unit_price  DOUBLE  NOT NULL,
    item_amount DOUBLE  NOT NULL,          -- = qty * unit_price
    PRIMARY KEY (order_id, item_seq)
);

-- 退款
CREATE TABLE refunds (
    refund_id     INTEGER   NOT NULL PRIMARY KEY,
    order_id      INTEGER   NOT NULL,       -- 对应 status='refunded' 的订单
    refund_time   TIMESTAMP NOT NULL,
    refund_amount DOUBLE    NOT NULL,
    reason        VARCHAR   NOT NULL        -- 质量问题 / 七天无理由 / 发错货 / 其他
);

-- 埋点事件
CREATE TABLE events (
    event_id   INTEGER   NOT NULL PRIMARY KEY,
    user_id    INTEGER   NOT NULL,
    session_id VARCHAR   NOT NULL,
    event_time TIMESTAMP NOT NULL,
    event_name VARCHAR   NOT NULL,  -- view_home/view_product/add_cart/submit_order/pay_success
    page       VARCHAR,             -- 部分事件无 page（NULL）
    product_id INTEGER,             -- 仅 view_product/add_cart/submit_order/pay_success 有值
    channel_id INTEGER              -- 部分事件无渠道（NULL）
);
