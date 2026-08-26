-- ============================================================================
-- SaaS 订阅数据集 · saas（A / B 双库）
-- 命名与语义按 MySQL 习惯；底层由 DuckDB 静默执行。
-- ============================================================================

CREATE TABLE dim_date (
    date_key            DATE      NOT NULL PRIMARY KEY,
    y                   INTEGER   NOT NULL,
    q                   INTEGER   NOT NULL,
    m                   INTEGER   NOT NULL,
    w                   INTEGER   NOT NULL,
    dow                 INTEGER   NOT NULL,
    is_weekend          BOOLEAN   NOT NULL,
    is_holiday          BOOLEAN   NOT NULL,
    last_year_same_date DATE      NOT NULL,
    prev_month_date     DATE      NOT NULL
);

-- 企业账号
CREATE TABLE accounts (
    account_id     INTEGER   NOT NULL PRIMARY KEY,
    signup_date    DATE      NOT NULL,
    industry       VARCHAR   NOT NULL,  -- SaaS/Ecommerce/Finance/Education/Healthcare/Manufacturing/Media
    company_size   VARCHAR   NOT NULL,  -- 1-10 / 11-50 / 51-200 / 201-1000 / 1000+
    source_channel VARCHAR   NOT NULL   -- ads / referral / organic / event
);

-- 成员（一个账号多个成员）
CREATE TABLE users (
    user_id   INTEGER   NOT NULL PRIMARY KEY,
    account_id INTEGER   NOT NULL,
    join_date DATE      NOT NULL,
    role      VARCHAR   NOT NULL       -- owner / admin / member
);

-- 订阅
CREATE TABLE subscriptions (
    sub_id    INTEGER   NOT NULL PRIMARY KEY,
    account_id INTEGER  NOT NULL,
    plan      VARCHAR   NOT NULL,  -- free / starter / pro / enterprise
    seats     INTEGER   NOT NULL,
    start_date DATE      NOT NULL,
    end_date  DATE,                -- NULL = 仍生效；churned 时有值
    mrr       DOUBLE    NOT NULL,  -- 月度经常性收入
    status    VARCHAR   NOT NULL,  -- trialing/active/past_due/churned/upgraded/downgraded
    is_trial  BOOLEAN   NOT NULL
);

-- 账单
CREATE TABLE invoices (
    invoice_id INTEGER   NOT NULL PRIMARY KEY,
    account_id INTEGER   NOT NULL,
    bill_date  DATE      NOT NULL,
    amount     DOUBLE    NOT NULL,
    paid       BOOLEAN   NOT NULL,
    pay_date   DATE                  -- 未支付为 NULL
);

-- 功能使用日志
CREATE TABLE feature_usage (
    log_id      INTEGER    NOT NULL PRIMARY KEY,
    account_id  INTEGER    NOT NULL,
    user_id     INTEGER    NOT NULL,
    use_time    TIMESTAMP  NOT NULL,
    feature_code VARCHAR   NOT NULL   -- dashboard/report/export/api/invite/billing/search
);

-- 试用转化
CREATE TABLE trial_conversion (
    account_id  INTEGER   NOT NULL PRIMARY KEY,
    trial_start DATE      NOT NULL,
    trial_end   DATE      NOT NULL,
    converted   BOOLEAN   NOT NULL,
    convert_date DATE                 -- 未转化则为 NULL
);
