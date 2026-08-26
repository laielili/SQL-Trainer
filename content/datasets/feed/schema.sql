-- ============================================================================
-- 内容社区数据集 · feed（A / B 双库）
-- 命名与语义按 MySQL 习惯；底层由 DuckDB 静默执行。
-- ============================================================================

-- 日期维表（与 shop / saas 完全一致）
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

-- 用户
CREATE TABLE users (
    user_id         INTEGER   NOT NULL PRIMARY KEY,
    register_date   DATE      NOT NULL,
    register_channel VARCHAR   NOT NULL,   -- app / web / mini_program / ad / organic
    city_tier       INTEGER   NOT NULL,   -- 1 / 2 / 3 / 4
    is_creator      BOOLEAN   NOT NULL    -- 是否创作者
);

-- 话题
CREATE TABLE topics (
    topic_id   INTEGER   NOT NULL PRIMARY KEY,
    topic_name VARCHAR   NOT NULL,
    category   VARCHAR   NOT NULL        -- 娱乐 / 知识 / 游戏 / 美食 / 旅行 / 财经
);

-- 内容
CREATE TABLE contents (
    content_id   INTEGER   NOT NULL PRIMARY KEY,
    author_id    INTEGER   NOT NULL,      -- 引用 users.user_id
    publish_time TIMESTAMP NOT NULL,
    topic_id     INTEGER   NOT NULL,
    content_type VARCHAR   NOT NULL,      -- short_video / article / live / image
    duration_sec INTEGER   NOT NULL       -- 时长（秒），live/short_video 较大
);

-- 行为埋点
CREATE TABLE events (
    event_id   INTEGER    NOT NULL PRIMARY KEY,
    user_id    INTEGER    NOT NULL,
    session_id VARCHAR    NOT NULL,
    event_time TIMESTAMP  NOT NULL,
    event_name VARCHAR    NOT NULL,  -- impression/click/play/finish/like/comment/share/follow
    content_id INTEGER,             -- click/play/finish/like/comment/share 有值；follow/impression 为 NULL
    stay_sec   INTEGER              -- play/finish 的停留秒数；其余为 NULL
);

-- 日活快照
CREATE TABLE daily_active (
    stat_date      DATE    NOT NULL,   -- 统计日期
    user_id        INTEGER NOT NULL,
    active_minutes INTEGER NOT NULL,   -- 当日活跃分钟数
    is_new         BOOLEAN NOT NULL    -- 是否当日新增活跃
);
