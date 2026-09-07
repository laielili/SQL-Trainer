/* 自动生成，请勿手改。来源：docs/tools/build_static_data.py */
window.SQLT = window.SQLT || {};
window.SQLT.QUESTIONS = {
 "feed-agg-001": {
  "id": "feed-agg-001",
  "dataset": "feed",
  "scenario": "agg",
  "chain": "feed-agg-chain-a",
  "chain_step": 1,
  "title": "分类 × 内容类型的播放规模与平均停留",
  "business_prompt": "内容运营要看盘子：“2025 年，按话题分类和内容类型两个维度，\n 统计播放次数、播放人数和平均停留秒数，按分类、类型排。”",
  "context_notes": [
   "播放事件 = events.event_name = 'play'，其 stay_sec 有值",
   "content_id 需经 contents 关联到 topics 拿 category",
   "平均停留保留 2 位小数；播放人数是去重用户数"
  ],
  "tables": [
   "events",
   "contents",
   "topics"
  ],
  "expected_columns": [
   {
    "name": "category",
    "type": "string"
   },
   {
    "name": "content_type",
    "type": "string"
   },
   {
    "name": "play_cnt",
    "type": "int"
   },
   {
    "name": "play_users",
    "type": "int"
   },
   {
    "name": "avg_stay_sec",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "两个维度就是 GROUP BY 两列，先把 events → contents → topics 三张表串起来。",
   "播放次数 COUNT(*) 与播放人数 COUNT(DISTINCT user_id) 是两个不同口径。",
   "AVG 会自动忽略 NULL，但本题 play 事件的 stay_sec 都有值。"
  ],
  "reference_sql": "SELECT t.category,\n       c.content_type,\n       COUNT(*) AS play_cnt,\n       COUNT(DISTINCT e.user_id) AS play_users,\n       ROUND(AVG(e.stay_sec), 2) AS avg_stay_sec\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name = 'play'\n  AND e.event_time >= '2025-01-01'\n  AND e.event_time <  '2026-01-01'\nGROUP BY t.category, c.content_type\nORDER BY t.category, c.content_type;",
  "alt_solutions": [
   "WITH play AS (\n    SELECT e.user_id, e.stay_sec, c.content_type, c.topic_id\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    WHERE e.event_name = 'play'\n      AND e.event_time >= '2025-01-01' AND e.event_time < '2026-01-01'\n)\nSELECT t.category,\n       p.content_type,\n       COUNT(*) AS play_cnt,\n       COUNT(DISTINCT p.user_id) AS play_users,\n       ROUND(SUM(p.stay_sec) * 1.0 / COUNT(*), 2) AS avg_stay_sec\nFROM play p\nJOIN topics t ON t.topic_id = p.topic_id\nGROUP BY 1, 2\nORDER BY 1, 2;"
  ],
  "explanation": "1. 多维聚合的第一步是把维度补齐：事实表 events 只有 content_id，维度要靠 JOIN 补。\n2. 次数 vs 人数是分析里最容易混的一对口径，题目问“次”就 COUNT(*)，问“人”就去重。\n3. AVG(x) 等价于 SUM(x)/COUNT(x)，注意 COUNT(x) 会跳过 NULL 而 COUNT(*) 不会。",
  "pitfalls": [
   "用 COUNT(DISTINCT content_id) 冒充播放次数",
   "忘记过滤 event_name='play'，把 impression/click 也算进来",
   "用 SUM(stay_sec)/COUNT(*) 但 stay_sec 有 NULL 时，与 AVG 结果不一致"
  ],
  "capability_points": [
   "agg.multi_dim",
   "agg.count_semantics",
   "agg.join_dimension"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 25.5,
   "columns": [
    "category",
    "content_type",
    "play_cnt",
    "play_users",
    "avg_stay_sec"
   ],
   "rows": [
    [
     "健身",
     "article",
     2061,
     1995,
     898.72
    ],
    [
     "健身",
     "image",
     1802,
     1742,
     894.46
    ],
    [
     "健身",
     "live",
     1549,
     1514,
     894.24
    ],
    [
     "健身",
     "short_video",
     4722,
     4445,
     910.78
    ],
    [
     "娱乐",
     "article",
     8196,
     7446,
     901.04
    ],
    [
     "娱乐",
     "image",
     5044,
     4759,
     903.8
    ],
    [
     "娱乐",
     "live",
     3374,
     3232,
     894.93
    ],
    [
     "娱乐",
     "short_video",
     16531,
     14029,
     906.77
    ],
    [
     "旅行",
     "article",
     3537,
     3371,
     896.3
    ],
    [
     "旅行",
     "image",
     1665,
     1618,
     918.31
    ],
    [
     "旅行",
     "live",
     1917,
     1845,
     904.12
    ],
    [
     "旅行",
     "short_video",
     7447,
     6817,
     902.08
    ],
    [
     "游戏",
     "article",
     4548,
     4300,
     896.98
    ],
    [
     "游戏",
     "image",
     2642,
     2544,
     889.76
    ],
    [
     "游戏",
     "live",
     2354,
     2277,
     884.07
    ]
   ],
   "row_count": 32,
   "translated_sql": "SELECT t.category,\n       c.content_type,\n       COUNT(*) AS play_cnt,\n       COUNT(DISTINCT e.user_id) AS play_users,\n       ROUND(AVG(e.stay_sec), 2) AS avg_stay_sec\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name = 'play'\n  AND e.event_time >= '2025-01-01'\n  AND e.event_time <  '2026-01-01'\nGROUP BY t.category, c.content_type\nORDER BY t.category, c.content_type;",
   "signature": {
    "tables": [
     "events",
     "contents",
     "topics"
    ],
    "keywords": [
     "COUNT(",
     "COUNT(DISTINCT",
     "AVG(",
     "JOIN",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "健身",
     "article",
     2061,
     1995,
     898.72
    ],
    [
     "健身",
     "image",
     1964,
     1899,
     975.14
    ],
    [
     "健身",
     "live",
     1549,
     1514,
     894.24
    ],
    [
     "健身",
     "short_video",
     5147,
     4845,
     992.93
    ],
    [
     "娱乐",
     "article",
     8196,
     7446,
     901.04
    ],
    [
     "娱乐",
     "image",
     5498,
     5188,
     985.32
    ],
    [
     "娱乐",
     "live",
     3374,
     3232,
     894.93
    ],
    [
     "娱乐",
     "short_video",
     18022,
     15294,
     988.56
    ],
    [
     "旅行",
     "article",
     3537,
     3371,
     896.3
    ],
    [
     "旅行",
     "image",
     1815,
     1763,
     1001.14
    ],
    [
     "旅行",
     "live",
     1917,
     1845,
     904.12
    ],
    [
     "旅行",
     "short_video",
     8118,
     7431,
     983.45
    ],
    [
     "游戏",
     "article",
     4548,
     4300,
     896.98
    ],
    [
     "游戏",
     "image",
     2880,
     2773,
     970.02
    ]
   ],
   "actual_row_count": 31,
   "diff": [
    {
     "row": 2,
     "expected": [
      "健身",
      "image",
      1802,
      1742,
      894.46
     ],
     "actual": [
      "健身",
      "image",
      1964,
      1899,
      975.14
     ]
    },
    {
     "row": 4,
     "expected": [
      "健身",
      "short_video",
      4722,
      4445,
      910.78
     ],
     "actual": [
      "健身",
      "short_video",
      5147,
      4845,
      992.93
     ]
    },
    {
     "row": 6,
     "expected": [
      "娱乐",
      "image",
      5044,
      4759,
      903.8
     ],
     "actual": [
      "娱乐",
      "image",
      5498,
      5188,
      985.32
     ]
    },
    {
     "row": 8,
     "expected": [
      "娱乐",
      "short_video",
      16531,
      14029,
      906.77
     ],
     "actual": [
      "娱乐",
      "short_video",
      18022,
      15294,
      988.56
     ]
    },
    {
     "row": 10,
     "expected": [
      "旅行",
      "image",
      1665,
      1618,
      918.31
     ],
     "actual": [
      "旅行",
      "image",
      1815,
      1763,
      1001.14
     ]
    }
   ],
   "hardcode_markers": [
    "健身"
   ]
  }
 },
 "feed-agg-002": {
  "id": "feed-agg-002",
  "dataset": "feed",
  "scenario": "agg",
  "chain": "feed-agg-chain-a",
  "chain_step": 2,
  "title": "渠道 × 城市等级的创作者浓度（HAVING 过滤分组）",
  "business_prompt": "创作者运营要找高浓度人群：“按注册渠道和城市等级分组，\n 给我用户数、创作者数和创作者占比。样本太小的组别没参考价值，\n 只保留用户数不少于 500 的组。”",
  "context_notes": [
   "只用 users 一张表；is_creator 为布尔",
   "创作者占比 = 创作者数 / 该组用户数，保留 4 位小数",
   "“只保留用户数 >= 500 的组”是对分组结果的过滤，属于 HAVING 而非 WHERE"
  ],
  "tables": [
   "users"
  ],
  "expected_columns": [
   {
    "name": "register_channel",
    "type": "string"
   },
   {
    "name": "city_tier",
    "type": "int"
   },
   {
    "name": "user_cnt",
    "type": "int"
   },
   {
    "name": "creator_cnt",
    "type": "int"
   },
   {
    "name": "creator_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 200,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\bhaving\\b",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "WHERE 在分组前过滤行，HAVING 在分组后过滤组，本题属于后者。",
   "布尔列求和：SUM(CASE WHEN is_creator THEN 1 ELSE 0 END)。",
   "占比记得乘 1.0 再除，避免整数除法。"
  ],
  "reference_sql": "SELECT register_channel,\n       city_tier,\n       COUNT(*) AS user_cnt,\n       SUM(CASE WHEN is_creator THEN 1 ELSE 0 END) AS creator_cnt,\n       ROUND(SUM(CASE WHEN is_creator THEN 1 ELSE 0 END) * 1.0\n           / NULLIF(COUNT(*), 0), 4) AS creator_rate\nFROM users\nGROUP BY register_channel, city_tier\nHAVING COUNT(*) >= 500\nORDER BY register_channel, city_tier;",
  "alt_solutions": [
   "SELECT register_channel,\n       city_tier,\n       COUNT(user_id) AS user_cnt,\n       COUNT(CASE WHEN is_creator THEN 1 END) AS creator_cnt,\n       ROUND(COUNT(CASE WHEN is_creator THEN 1 END) * 1.0\n           / NULLIF(COUNT(user_id), 0), 4) AS creator_rate\nFROM users\nGROUP BY 1, 2\nHAVING COUNT(user_id) >= 500\nORDER BY 1, 2;"
  ],
  "explanation": "1. WHERE → GROUP BY → HAVING → SELECT → ORDER BY 是逻辑执行顺序，HAVING 能引用聚合结果。\n2. 布尔条件计数有两种等价写法：SUM(CASE ... THEN 1 ELSE 0 END) 与 COUNT(CASE ... THEN 1 END)。\n3. 占比类指标统一用 NULLIF 保护分母，是可复用的防御习惯。",
  "pitfalls": [
   "把 COUNT(*) >= 500 写进 WHERE，MySQL 会直接报错",
   "COUNT(CASE WHEN ... THEN 1 ELSE 0 END) 加了 ELSE 0，计数变成全量",
   "整数相除得到 0（MySQL 中整数除法会退化），忘记乘 1.0"
  ],
  "capability_points": [
   "agg.multi_dim",
   "agg.having",
   "agg.conditional_count",
   "agg.safe_div"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 5.1,
   "columns": [
    "register_channel",
    "city_tier",
    "user_cnt",
    "creator_cnt",
    "creator_rate"
   ],
   "rows": [
    [
     "ad",
     1,
     1130,
     106,
     0.0938
    ],
    [
     "ad",
     2,
     2604,
     242,
     0.0929
    ],
    [
     "ad",
     3,
     2344,
     220,
     0.0939
    ],
    [
     "ad",
     4,
     1485,
     129,
     0.0869
    ],
    [
     "app",
     1,
     2191,
     217,
     0.099
    ],
    [
     "app",
     2,
     5240,
     533,
     0.1017
    ],
    [
     "app",
     3,
     4467,
     461,
     0.1032
    ],
    [
     "app",
     4,
     2997,
     305,
     0.1018
    ],
    [
     "mini_program",
     1,
     1961,
     209,
     0.1066
    ],
    [
     "mini_program",
     2,
     4384,
     426,
     0.0972
    ],
    [
     "mini_program",
     3,
     3700,
     358,
     0.0968
    ],
    [
     "mini_program",
     4,
     2535,
     235,
     0.0927
    ],
    [
     "organic",
     1,
     1109,
     103,
     0.0929
    ],
    [
     "organic",
     2,
     2596,
     277,
     0.1067
    ],
    [
     "organic",
     3,
     2261,
     226,
     0.1
    ]
   ],
   "row_count": 20,
   "translated_sql": "SELECT register_channel,\n       city_tier,\n       COUNT(*) AS user_cnt,\n       SUM(CASE WHEN is_creator THEN 1 ELSE 0 END) AS creator_cnt,\n       ROUND(SUM(CASE WHEN is_creator THEN 1 ELSE 0 END) * 1.0\n           / NULLIF(COUNT(*), 0), 4) AS creator_rate\nFROM users\nGROUP BY register_channel, city_tier\nHAVING COUNT(*) >= 500\nORDER BY register_channel, city_tier;",
   "signature": {
    "tables": [
     "users"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "COUNT(",
     "HAVING",
     "NULLIF",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "ad",
     1,
     1130,
     106,
     0.0938
    ],
    [
     "ad",
     2,
     3019,
     280,
     0.11
    ],
    [
     "ad",
     3,
     2344,
     220,
     0.0939
    ],
    [
     "ad",
     4,
     1722,
     149,
     0.1
    ],
    [
     "app",
     1,
     2191,
     217,
     0.099
    ],
    [
     "app",
     2,
     6076,
     618,
     0.12
    ],
    [
     "app",
     3,
     4467,
     461,
     0.1032
    ],
    [
     "app",
     4,
     3475,
     353,
     0.12
    ],
    [
     "mini_program",
     1,
     1961,
     209,
     0.1066
    ],
    [
     "mini_program",
     2,
     5083,
     493,
     0.11
    ],
    [
     "mini_program",
     3,
     3700,
     358,
     0.0968
    ],
    [
     "mini_program",
     4,
     2939,
     272,
     0.11
    ],
    [
     "organic",
     1,
     1109,
     103,
     0.0929
    ],
    [
     "organic",
     2,
     3010,
     321,
     0.12
    ]
   ],
   "actual_row_count": 19,
   "diff": [
    {
     "row": 2,
     "expected": [
      "ad",
      2,
      2604,
      242,
      0.0929
     ],
     "actual": [
      "ad",
      2,
      3019,
      280,
      0.11
     ]
    },
    {
     "row": 4,
     "expected": [
      "ad",
      4,
      1485,
      129,
      0.0869
     ],
     "actual": [
      "ad",
      4,
      1722,
      149,
      0.1
     ]
    },
    {
     "row": 6,
     "expected": [
      "app",
      2,
      5240,
      533,
      0.1017
     ],
     "actual": [
      "app",
      2,
      6076,
      618,
      0.12
     ]
    },
    {
     "row": 8,
     "expected": [
      "app",
      4,
      2997,
      305,
      0.1018
     ],
     "actual": [
      "app",
      4,
      3475,
      353,
      0.12
     ]
    },
    {
     "row": 10,
     "expected": [
      "mini_program",
      2,
      4384,
      426,
      0.0972
     ],
     "actual": [
      "mini_program",
      2,
      5083,
      493,
      0.11
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "feed-funnel-001": {
  "id": "feed-funnel-001",
  "dataset": "feed",
  "scenario": "funnel",
  "chain": "feed-funnel-chain-a",
  "chain_step": 1,
  "title": "消费漏斗 曝光→点击→播放→完播",
  "business_prompt": "推荐团队看消费漏斗：“2025 年，曝光 / 点击 / 播放 / 完播 四步各有多少去重用户，\n 再给出相邻步骤转化率和相对曝光的整体转化率。”",
  "context_notes": [
   "四步事件名：impression / click / play / finish",
   "人数 = COUNT(DISTINCT user_id)，无序口径（只看是否发生过）",
   "第 1 步的 step_conv_rate 为 NULL，total_conv_rate 为 1.0"
  ],
  "tables": [
   "events"
  ],
  "expected_columns": [
   {
    "name": "step_no",
    "type": "int"
   },
   {
    "name": "step_name",
    "type": "string"
   },
   {
    "name": "user_cnt",
    "type": "int"
   },
   {
    "name": "step_conv_rate",
    "type": "decimal"
   },
   {
    "name": "total_conv_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\bover\\s*\\(",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "先用 CASE 把 event_name 映射成 step_no，聚合出四行小表。",
   "LAG(user_cnt) OVER (ORDER BY step_no) 拿上一步人数。",
   "FIRST_VALUE(user_cnt) OVER (ORDER BY step_no) 拿第一步人数。"
  ],
  "reference_sql": "WITH base AS (\n    SELECT CASE event_name\n               WHEN 'impression' THEN 1\n               WHEN 'click'      THEN 2\n               WHEN 'play'       THEN 3\n               ELSE 4\n           END AS step_no,\n           event_name AS step_name,\n           COUNT(DISTINCT user_id) AS user_cnt\n    FROM events\n    WHERE event_name IN ('impression', 'click', 'play', 'finish')\n      AND event_time >= '2025-01-01'\n      AND event_time <  '2026-01-01'\n    GROUP BY 1, 2\n)\nSELECT step_no,\n       step_name,\n       user_cnt,\n       ROUND(user_cnt * 1.0\n           / NULLIF(LAG(user_cnt) OVER (ORDER BY step_no), 0), 4) AS step_conv_rate,\n       ROUND(user_cnt * 1.0\n           / NULLIF(FIRST_VALUE(user_cnt) OVER (ORDER BY step_no), 0), 4) AS total_conv_rate\nFROM base\nORDER BY step_no;",
  "alt_solutions": [
   "WITH base AS (\n    SELECT 1 AS step_no, 'impression' AS step_name, COUNT(DISTINCT user_id) AS user_cnt\n    FROM events WHERE event_name='impression'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    UNION ALL\n    SELECT 2, 'click', COUNT(DISTINCT user_id) FROM events WHERE event_name='click'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    UNION ALL\n    SELECT 3, 'play', COUNT(DISTINCT user_id) FROM events WHERE event_name='play'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    UNION ALL\n    SELECT 4, 'finish', COUNT(DISTINCT user_id) FROM events WHERE event_name='finish'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n),\nw AS (\n    SELECT step_no, step_name, user_cnt,\n           LAG(user_cnt) OVER (ORDER BY step_no) AS prev_cnt,\n           MAX(CASE WHEN step_no = 1 THEN user_cnt END) OVER () AS first_cnt\n    FROM base\n)\nSELECT step_no, step_name, user_cnt,\n       ROUND(user_cnt * 1.0 / NULLIF(prev_cnt, 0), 4) AS step_conv_rate,\n       ROUND(user_cnt * 1.0 / NULLIF(first_cnt, 0), 4) AS total_conv_rate\nFROM w\nORDER BY step_no;"
  ],
  "explanation": "1. 漏斗的顺序不能靠字母序，必须显式造一个 step_no。\n2. 单步转化率定位瓶颈环节，整体转化率衡量端到端效率，两者要一起看。\n3. MAX(...) OVER () 是取“全局某个值”的常用技巧，可替代 FIRST_VALUE。",
  "pitfalls": [
   "按 event_name 排序，漏斗顺序变成 click < finish < impression < play",
   "COUNT(*) 代替 COUNT(DISTINCT user_id)，曝光被重复埋点放大数倍",
   "第 4 步用 ELSE 4 兜底时忘了 WHERE 过滤，其它事件被误归为 finish"
  ],
  "capability_points": [
   "funnel.unordered",
   "funnel.conv_rate",
   "window.lag",
   "window.first_value"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 27.7,
   "columns": [
    "step_no",
    "step_name",
    "user_cnt",
    "step_conv_rate",
    "total_conv_rate"
   ],
   "rows": [
    [
     1,
     "impression",
     49951,
     null,
     1.0
    ],
    [
     2,
     "click",
     49654,
     0.9941,
     0.9941
    ],
    [
     3,
     "play",
     47550,
     0.9576,
     0.9519
    ],
    [
     4,
     "finish",
     43266,
     0.9099,
     0.8662
    ]
   ],
   "row_count": 4,
   "translated_sql": "WITH base AS (\n    SELECT CASE event_name\n               WHEN 'impression' THEN 1\n               WHEN 'click'      THEN 2\n               WHEN 'play'       THEN 3\n               ELSE 4\n           END AS step_no,\n           event_name AS step_name,\n           COUNT(DISTINCT user_id) AS user_cnt\n    FROM events\n    WHERE event_name IN ('impression', 'click', 'play', 'finish')\n      AND event_time >= '2025-01-01'\n      AND event_time <  '2026-01-01'\n    GROUP BY 1, 2\n)\nSELECT step_no,\n       step_name,\n       user_cnt,\n       ROUND(user_cnt * 1.0\n           / NULLIF(LAG(user_cnt) OVER (ORDER BY step_no), 0), 4) AS step_conv_rate,\n       ROUND(user_cnt * 1.0\n           / NULLIF(FIRST_VALUE(user_cnt) OVER (ORDER BY step_no), 0), 4) AS total_conv_rate\nFROM base\nORDER BY step_no;",
   "signature": {
    "tables": [
     "events"
    ],
    "keywords": [
     "LAG",
     "FIRST_VALUE",
     "OVER",
     "COUNT(",
     "COUNT(DISTINCT",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "impression",
     49951,
     null,
     1.0
    ],
    [
     2,
     "click",
     57320,
     1.15,
     1.15
    ],
    [
     3,
     "play",
     47550,
     0.9576,
     0.9519
    ],
    [
     4,
     "finish",
     49946,
     1.05,
     1.0
    ]
   ],
   "actual_row_count": 3,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      "click",
      49654,
      0.9941,
      0.9941
     ],
     "actual": [
      2,
      "click",
      57320,
      1.15,
      1.15
     ]
    },
    {
     "row": 4,
     "expected": [
      4,
      "finish",
      43266,
      0.9099,
      0.8662
     ],
     "actual": [
      4,
      "finish",
      49946,
      1.05,
      1.0
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "feed-funnel-002": {
  "id": "feed-funnel-002",
  "dataset": "feed",
  "scenario": "funnel",
  "chain": "feed-funnel-chain-a",
  "chain_step": 2,
  "title": "同一内容上的有序转化（点击→播放→完播）",
  "business_prompt": "算法同学要严谨口径：“同一个用户对同一条内容，必须先点击、再播放、最后完播，\n 时间严格递增才算走通。统计 2025 年三步各有多少『用户-内容』对。”",
  "context_notes": [
   "主体是「user_id + content_id」这一对，而不是会话",
   "每步时间取该主体上该事件的最早时间 MIN(event_time)",
   "严格递增：t_play > t_click，t_finish > t_play",
   "只考虑 content_id 非空的事件（impression / follow 无 content_id）"
  ],
  "tables": [
   "events"
  ],
  "expected_columns": [
   {
    "name": "step_no",
    "type": "int"
   },
   {
    "name": "step_name",
    "type": "string"
   },
   {
    "name": "pair_cnt",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "union\\s+all",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "先把事件压平：GROUP BY user_id, content_id，三个条件 MIN(event_time) 拿到三个时间戳。",
   "压平后顺序判断就是时间戳比大小。",
   "每一步的条件必须包含前面所有步，漏斗才会单调递减。"
  ],
  "reference_sql": "WITH pair AS (\n    SELECT user_id,\n           content_id,\n           MIN(CASE WHEN event_name = 'click'  THEN event_time END) AS t1,\n           MIN(CASE WHEN event_name = 'play'   THEN event_time END) AS t2,\n           MIN(CASE WHEN event_name = 'finish' THEN event_time END) AS t3\n    FROM events\n    WHERE content_id IS NOT NULL\n      AND event_time >= '2025-01-01'\n      AND event_time <  '2026-01-01'\n    GROUP BY user_id, content_id\n)\nSELECT 1 AS step_no, 'click' AS step_name, COUNT(*) AS pair_cnt\nFROM pair WHERE t1 IS NOT NULL\nUNION ALL\nSELECT 2, 'play', COUNT(*)\nFROM pair WHERE t1 IS NOT NULL AND t2 > t1\nUNION ALL\nSELECT 3, 'finish', COUNT(*)\nFROM pair WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2\nORDER BY step_no;",
  "alt_solutions": [
   "WITH pair AS (\n    SELECT user_id, content_id,\n           MIN(CASE WHEN event_name = 'click'  THEN event_time END) AS t1,\n           MIN(CASE WHEN event_name = 'play'   THEN event_time END) AS t2,\n           MIN(CASE WHEN event_name = 'finish' THEN event_time END) AS t3\n    FROM events\n    WHERE content_id IS NOT NULL\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    GROUP BY 1, 2\n),\nflag AS (\n    SELECT CASE WHEN t1 IS NOT NULL THEN 1 ELSE 0 END AS s1,\n           CASE WHEN t1 IS NOT NULL AND t2 > t1 THEN 1 ELSE 0 END AS s2,\n           CASE WHEN t1 IS NOT NULL AND t2 > t1 AND t3 > t2 THEN 1 ELSE 0 END AS s3\n    FROM pair\n)\nSELECT 1 AS step_no, 'click' AS step_name, SUM(s1) AS pair_cnt FROM flag\nUNION ALL SELECT 2, 'play',   SUM(s2) FROM flag\nUNION ALL SELECT 3, 'finish', SUM(s3) FROM flag\nORDER BY step_no;"
  ],
  "explanation": "1. 有序漏斗的主体可以是 session、user，也可以是「user × 对象」，取决于业务口径。\n2. 压平（多列条件 MIN）之后，顺序约束退化成时间戳比较，逻辑最清晰。\n3. 条件层层继承，是保证漏斗单调递减的关键。",
  "pitfalls": [
   "GROUP BY 只写 user_id，把不同内容上的行为串成一条路径",
   "第 3 步只判断 t3 > t2，漏掉 t2 > t1，出现下一步比上一步多的怪现象",
   "忘记 content_id IS NOT NULL，impression/follow 事件混进来干扰分组"
  ],
  "capability_points": [
   "funnel.ordered",
   "funnel.flatten",
   "funnel.subject_grain",
   "funnel.monotonic"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 30.3,
   "columns": [
    "step_no",
    "step_name",
    "pair_cnt"
   ],
   "rows": [
    [
     1,
     "click",
     249862
    ],
    [
     2,
     "play",
     155
    ],
    [
     3,
     "finish",
     0
    ]
   ],
   "row_count": 3,
   "translated_sql": "WITH pair AS (\n    SELECT user_id,\n           content_id,\n           MIN(CASE WHEN event_name = 'click'  THEN event_time END) AS t1,\n           MIN(CASE WHEN event_name = 'play'   THEN event_time END) AS t2,\n           MIN(CASE WHEN event_name = 'finish' THEN event_time END) AS t3\n    FROM events\n    WHERE content_id IS NOT NULL\n      AND event_time >= '2025-01-01'\n      AND event_time <  '2026-01-01'\n    GROUP BY user_id, content_id\n)\nSELECT 1 AS step_no, 'click' AS step_name, COUNT(*) AS pair_cnt\nFROM pair WHERE t1 IS NOT NULL\nUNION ALL\nSELECT 2, 'play', COUNT(*)\nFROM pair WHERE t1 IS NOT NULL AND t2 > t1\nUNION ALL\nSELECT 3, 'finish', COUNT(*)\nFROM pair WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2\nORDER BY step_no;",
   "signature": {
    "tables": [
     "events"
    ],
    "keywords": [
     "UNION ALL",
     "CASE WHEN",
     "COUNT(",
     "MIN(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "click",
     249862
    ],
    [
     2,
     "play",
     164
    ],
    [
     3,
     "finish",
     0
    ]
   ],
   "actual_row_count": 2,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      "play",
      155
     ],
     "actual": [
      2,
      "play",
      164
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "feed-growth-001": {
  "id": "feed-growth-001",
  "dataset": "feed",
  "scenario": "growth",
  "chain": "feed-growth-chain-a",
  "chain_step": 1,
  "title": "月活 MAU 环比",
  "business_prompt": "运营周报第一页：“全量 24 个月的 MAU（月度去重活跃用户数），\n 再加上上月 MAU 和环比增长率，按月份升序。”",
  "context_notes": [
   "MAU = 该月 daily_active 中的去重 user_id 数",
   "环比 = (本月 - 上月) / 上月；首月无上月，返回 NULL",
   "数据覆盖 2024-01 ~ 2025-12 共 24 个月"
  ],
  "tables": [
   "daily_active"
  ],
  "expected_columns": [
   {
    "name": "ym",
    "type": "string"
   },
   {
    "name": "mau",
    "type": "int"
   },
   {
    "name": "prev_mau",
    "type": "int"
   },
   {
    "name": "mom_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "先聚合出月表 (ym, mau)，环比一律在月表上做。",
   "LAG(mau) OVER (ORDER BY ym) 取上月；ym 是 'YYYY-MM' 字符串，字典序恰好等于时间序。",
   "整数相减再相除要乘 1.0，否则可能被截断成 0。"
  ],
  "reference_sql": "WITH monthly AS (\n    SELECT DATE_FORMAT(stat_date, '%Y-%m') AS ym,\n           COUNT(DISTINCT user_id) AS mau\n    FROM daily_active\n    GROUP BY 1\n)\nSELECT ym,\n       mau,\n       LAG(mau) OVER (ORDER BY ym) AS prev_mau,\n       ROUND((mau - LAG(mau) OVER (ORDER BY ym)) * 1.0\n           / NULLIF(LAG(mau) OVER (ORDER BY ym), 0), 4) AS mom_rate\nFROM monthly\nORDER BY ym;",
  "alt_solutions": [
   "WITH monthly AS (\n    SELECT DATE_FORMAT(stat_date, '%Y-%m') AS ym,\n           COUNT(DISTINCT user_id) AS mau\n    FROM daily_active\n    GROUP BY 1\n),\nw AS (\n    SELECT ym, mau, LAG(mau) OVER (ORDER BY ym) AS prev_mau\n    FROM monthly\n)\nSELECT ym, mau, prev_mau,\n       ROUND((mau - prev_mau) * 1.0 / NULLIF(prev_mau, 0), 4) AS mom_rate\nFROM w\nORDER BY ym;"
  ],
  "explanation": "1. 环比 = 与上一期比，本质是“错一行”，LAG 是最直接的实现。\n2. 'YYYY-MM' 字符串的字典序与时间序一致，可以直接拿来排序（'2024-09' < '2024-10'）。\n3. 把 LAG 结果先落成一列（alt 写法）能显著提升可读性，也避免写错三次。",
  "pitfalls": [
   "用 DATE_FORMAT(stat_date,'%Y-%c') 之类无前导零的格式，字符串排序会乱（'2024-10' < '2024-9'）",
   "忘记乘 1.0，整数除法把环比截成 0",
   "对全量数据 COUNT(DISTINCT) 之前先做了别的聚合，导致去重口径丢失"
  ],
  "capability_points": [
   "growth.mom",
   "window.lag",
   "agg.distinct_count",
   "growth.safe_div"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 39.8,
   "columns": [
    "ym",
    "mau",
    "prev_mau",
    "mom_rate"
   ],
   "rows": [
    [
     "2024-01",
     35934,
     null,
     null
    ],
    [
     "2024-02",
     34873,
     35934,
     -0.0295
    ],
    [
     "2024-03",
     35315,
     34873,
     0.0127
    ],
    [
     "2024-04",
     35503,
     35315,
     0.0053
    ],
    [
     "2024-05",
     36064,
     35503,
     0.0158
    ],
    [
     "2024-06",
     35514,
     36064,
     -0.0153
    ],
    [
     "2024-07",
     36113,
     35514,
     0.0169
    ],
    [
     "2024-08",
     36245,
     36113,
     0.0037
    ],
    [
     "2024-09",
     34928,
     36245,
     -0.0363
    ],
    [
     "2024-10",
     35935,
     34928,
     0.0288
    ],
    [
     "2024-11",
     35485,
     35935,
     -0.0125
    ],
    [
     "2024-12",
     36149,
     35485,
     0.0187
    ],
    [
     "2025-01",
     35981,
     36149,
     -0.0046
    ],
    [
     "2025-02",
     34124,
     35981,
     -0.0516
    ],
    [
     "2025-03",
     36149,
     34124,
     0.0593
    ]
   ],
   "row_count": 24,
   "translated_sql": "WITH monthly AS (\n    SELECT strftime(stat_date, '%Y-%m') AS ym,\n           COUNT(DISTINCT user_id) AS mau\n    FROM daily_active\n    GROUP BY 1\n)\nSELECT ym,\n       mau,\n       LAG(mau) OVER (ORDER BY ym) AS prev_mau,\n       ROUND((mau - LAG(mau) OVER (ORDER BY ym)) * 1.0\n           / NULLIF(LAG(mau) OVER (ORDER BY ym), 0), 4) AS mom_rate\nFROM monthly\nORDER BY ym;",
   "signature": {
    "tables": [
     "daily_active"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "COUNT(",
     "COUNT(DISTINCT",
     "DATE_FORMAT",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "2024-01",
     35934,
     null,
     null
    ],
    [
     "2024-02",
     39329,
     40526,
     -0.03
    ],
    [
     "2024-03",
     35315,
     34873,
     0.0127
    ],
    [
     "2024-04",
     40040,
     39828,
     0.01
    ],
    [
     "2024-05",
     36064,
     35503,
     0.0158
    ],
    [
     "2024-06",
     40052,
     40672,
     -0.02
    ],
    [
     "2024-07",
     36113,
     35514,
     0.0169
    ],
    [
     "2024-08",
     40877,
     40728,
     0.0
    ],
    [
     "2024-09",
     34928,
     36245,
     -0.0363
    ],
    [
     "2024-10",
     40527,
     39391,
     0.03
    ],
    [
     "2024-11",
     35485,
     35935,
     -0.0125
    ],
    [
     "2024-12",
     40768,
     40019,
     0.02
    ],
    [
     "2025-01",
     35981,
     36149,
     -0.0046
    ],
    [
     "2025-02",
     38485,
     40579,
     -0.06
    ]
   ],
   "actual_row_count": 23,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2024-02",
      34873,
      35934,
      -0.0295
     ],
     "actual": [
      "2024-02",
      39329,
      40526,
      -0.03
     ]
    },
    {
     "row": 4,
     "expected": [
      "2024-04",
      35503,
      35315,
      0.0053
     ],
     "actual": [
      "2024-04",
      40040,
      39828,
      0.01
     ]
    },
    {
     "row": 6,
     "expected": [
      "2024-06",
      35514,
      36064,
      -0.0153
     ],
     "actual": [
      "2024-06",
      40052,
      40672,
      -0.02
     ]
    },
    {
     "row": 8,
     "expected": [
      "2024-08",
      36245,
      36113,
      0.0037
     ],
     "actual": [
      "2024-08",
      40877,
      40728,
      0.0
     ]
    },
    {
     "row": 10,
     "expected": [
      "2024-10",
      35935,
      34928,
      0.0288
     ],
     "actual": [
      "2024-10",
      40527,
      39391,
      0.03
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "feed-growth-002": {
  "id": "feed-growth-002",
  "dataset": "feed",
  "scenario": "growth",
  "chain": "feed-growth-chain-a",
  "chain_step": 2,
  "title": "各分类互动量年度同比",
  "business_prompt": "内容策略复盘：“把点赞、评论、转发合在一起当『互动量』，\n 按话题分类比较 2025 年和 2024 年的互动量与同比增长率，按分类名升序。”",
  "context_notes": [
   "互动事件 = event_name IN ('like','comment','share')",
   "分类通过 events.content_id → contents.topic_id → topics.category 关联",
   "同比 = (2025 - 2024) / 2024，保留 4 位小数"
  ],
  "tables": [
   "events",
   "contents",
   "topics"
  ],
  "expected_columns": [
   {
    "name": "category",
    "type": "string"
   },
   {
    "name": "cnt_2025",
    "type": "int"
   },
   {
    "name": "cnt_2024",
    "type": "int"
   },
   {
    "name": "yoy_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "两种思路：分类×年聚合后自连接对齐，或者一次聚合用两个条件 SUM 直接拉成两列。",
   "条件聚合写法更短：SUM(CASE WHEN YEAR(event_time)=2025 THEN 1 ELSE 0 END)。",
   "分母是 2024 年的量，用 NULLIF 保护。"
  ],
  "reference_sql": "SELECT t.category,\n       SUM(CASE WHEN YEAR(e.event_time) = 2025 THEN 1 ELSE 0 END) AS cnt_2025,\n       SUM(CASE WHEN YEAR(e.event_time) = 2024 THEN 1 ELSE 0 END) AS cnt_2024,\n       ROUND((SUM(CASE WHEN YEAR(e.event_time) = 2025 THEN 1 ELSE 0 END)\n            - SUM(CASE WHEN YEAR(e.event_time) = 2024 THEN 1 ELSE 0 END)) * 1.0\n           / NULLIF(SUM(CASE WHEN YEAR(e.event_time) = 2024 THEN 1 ELSE 0 END), 0),\n           4) AS yoy_rate\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name IN ('like', 'comment', 'share')\nGROUP BY t.category\nORDER BY t.category;",
  "alt_solutions": [
   "WITH inter AS (\n    SELECT t.category,\n           YEAR(e.event_time) AS y,\n           COUNT(*) AS cnt\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    JOIN topics   t ON t.topic_id  = c.topic_id\n    WHERE e.event_name IN ('like', 'comment', 'share')\n    GROUP BY 1, 2\n)\nSELECT cur.category,\n       cur.cnt AS cnt_2025,\n       prev.cnt AS cnt_2024,\n       ROUND((cur.cnt - prev.cnt) * 1.0 / NULLIF(prev.cnt, 0), 4) AS yoy_rate\nFROM inter cur\nLEFT JOIN inter prev\n       ON prev.category = cur.category\n      AND prev.y = cur.y - 1\nWHERE cur.y = 2025\nORDER BY cur.category;"
  ],
  "explanation": "1. 同比的两种实现：条件聚合“横着展开”，或自连接“错一年对齐”。\n2. 条件聚合一次扫描即可，但年份写死；自连接更通用，适合多年滚动。\n3. 注意自连接要用 LEFT JOIN，否则去年没数据的分类整行消失。",
  "pitfalls": [
   "条件聚合忘了 ELSE 0，SUM 遇到全 NULL 分组返回 NULL 而不是 0",
   "自连接用 INNER JOIN，新分类（2024 无数据）被吃掉",
   "把 like/comment/share 分开统计后相加，多写了两倍代码还容易漏"
  ],
  "capability_points": [
   "growth.yoy",
   "growth.self_join",
   "agg.conditional_count",
   "growth.safe_div"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 14.2,
   "columns": [
    "category",
    "cnt_2025",
    "cnt_2024",
    "yoy_rate"
   ],
   "rows": [
    [
     "健身",
     8871,
     8859,
     0.0014
    ],
    [
     "娱乐",
     28710,
     28369,
     0.012
    ],
    [
     "旅行",
     12547,
     12766,
     -0.0172
    ],
    [
     "游戏",
     16952,
     17382,
     -0.0247
    ],
    [
     "知识",
     21071,
     21255,
     -0.0087
    ],
    [
     "科技",
     12572,
     12631,
     -0.0047
    ],
    [
     "美食",
     18089,
     18160,
     -0.0039
    ],
    [
     "财经",
     12006,
     12155,
     -0.0123
    ]
   ],
   "row_count": 8,
   "translated_sql": "SELECT t.category,\n       SUM(CASE WHEN YEAR(e.event_time) = 2025 THEN 1 ELSE 0 END) AS cnt_2025,\n       SUM(CASE WHEN YEAR(e.event_time) = 2024 THEN 1 ELSE 0 END) AS cnt_2024,\n       ROUND((SUM(CASE WHEN YEAR(e.event_time) = 2025 THEN 1 ELSE 0 END)\n            - SUM(CASE WHEN YEAR(e.event_time) = 2024 THEN 1 ELSE 0 END)) * 1.0\n           / NULLIF(SUM(CASE WHEN YEAR(e.event_time) = 2024 THEN 1 ELSE 0 END), 0),\n           4) AS yoy_rate\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name IN ('like', 'comment', 'share')\nGROUP BY t.category\nORDER BY t.category;",
   "signature": {
    "tables": [
     "events",
     "contents",
     "topics"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "JOIN",
     "NULLIF",
     "ROUND(",
     "YEAR("
    ]
   },
   "actual_rows": [
    [
     "健身",
     8871,
     8859,
     0.0014
    ],
    [
     "娱乐",
     32252,
     31869,
     0.01
    ],
    [
     "旅行",
     12547,
     12766,
     -0.0172
    ],
    [
     "游戏",
     19043,
     19526,
     -0.03
    ],
    [
     "知识",
     21071,
     21255,
     -0.0087
    ],
    [
     "科技",
     14123,
     14189,
     -0.01
    ],
    [
     "美食",
     18089,
     18160,
     -0.0039
    ]
   ],
   "actual_row_count": 7,
   "diff": [
    {
     "row": 2,
     "expected": [
      "娱乐",
      28710,
      28369,
      0.012
     ],
     "actual": [
      "娱乐",
      32252,
      31869,
      0.01
     ]
    },
    {
     "row": 4,
     "expected": [
      "游戏",
      16952,
      17382,
      -0.0247
     ],
     "actual": [
      "游戏",
      19043,
      19526,
      -0.03
     ]
    },
    {
     "row": 6,
     "expected": [
      "科技",
      12572,
      12631,
      -0.0047
     ],
     "actual": [
      "科技",
      14123,
      14189,
      -0.01
     ]
    }
   ],
   "hardcode_markers": [
    "健身",
    "科技"
   ]
  }
 },
 "feed-pivot-001": {
  "id": "feed-pivot-001",
  "dataset": "feed",
  "scenario": "pivot",
  "chain": "feed-pivot-chain-a",
  "chain_step": 1,
  "title": "分类 × 内容类型 播放量交叉表",
  "business_prompt": "内容大盘要一张透视：“2025 年，行是话题分类，列是四种内容类型的播放次数，\n 最后加一列该分类的总播放次数，按分类名升序。”",
  "context_notes": [
   "播放 = event_name='play'",
   "四种内容类型固定：short_video / article / live / image",
   "列名：short_video_plays / article_plays / live_plays / image_plays / total_plays"
  ],
  "tables": [
   "events",
   "contents",
   "topics"
  ],
  "expected_columns": [
   {
    "name": "category",
    "type": "string"
   },
   {
    "name": "short_video_plays",
    "type": "int"
   },
   {
    "name": "article_plays",
    "type": "int"
   },
   {
    "name": "live_plays",
    "type": "int"
   },
   {
    "name": "image_plays",
    "type": "int"
   },
   {
    "name": "total_plays",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": [
    {
     "pattern": "\\bpivot\\b",
     "flags": "is",
     "reason": ""
    }
   ]
  },
  "hints": [
   "每一个“列”对应一个 SUM(CASE WHEN content_type='xxx' THEN 1 ELSE 0 END)。",
   "总数直接 COUNT(*)，不要把四列加起来（将来多一种类型就漏了）。",
   "记得先 JOIN 出 category 和 content_type 两个维度再分组。"
  ],
  "reference_sql": "SELECT t.category,\n       SUM(CASE WHEN c.content_type = 'short_video' THEN 1 ELSE 0 END) AS short_video_plays,\n       SUM(CASE WHEN c.content_type = 'article'     THEN 1 ELSE 0 END) AS article_plays,\n       SUM(CASE WHEN c.content_type = 'live'        THEN 1 ELSE 0 END) AS live_plays,\n       SUM(CASE WHEN c.content_type = 'image'       THEN 1 ELSE 0 END) AS image_plays,\n       COUNT(*) AS total_plays\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name = 'play'\n  AND e.event_time >= '2025-01-01'\n  AND e.event_time <  '2026-01-01'\nGROUP BY t.category\nORDER BY t.category;",
  "alt_solutions": [
   "WITH play AS (\n    SELECT t.category, c.content_type\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    JOIN topics   t ON t.topic_id  = c.topic_id\n    WHERE e.event_name = 'play'\n      AND e.event_time >= '2025-01-01' AND e.event_time < '2026-01-01'\n)\nSELECT category,\n       COUNT(CASE WHEN content_type = 'short_video' THEN 1 END) AS short_video_plays,\n       COUNT(CASE WHEN content_type = 'article'     THEN 1 END) AS article_plays,\n       COUNT(CASE WHEN content_type = 'live'        THEN 1 END) AS live_plays,\n       COUNT(CASE WHEN content_type = 'image'       THEN 1 END) AS image_plays,\n       COUNT(*) AS total_plays\nFROM play\nGROUP BY category\nORDER BY category;"
  ],
  "explanation": "1. 长转宽的通用配方：GROUP BY 行维度，列维度的每个取值写一个条件聚合。\n2. MySQL 没有 PIVOT，条件聚合就是唯一正解，好处是列名完全可控。\n3. 合计列用 COUNT(*) 而非四列相加，对枚举扩展更健壮。",
  "pitfalls": [
   "直接写 PIVOT，在 MySQL 环境会被拦截",
   "列维度取值写错大小写或拼写，对应列恒为 0 而不报错",
   "GROUP BY 里多带了 content_type，结果又退回长表"
  ],
  "capability_points": [
   "pivot.long2wide",
   "pivot.conditional_count",
   "pivot.total_column"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 13.6,
   "columns": [
    "category",
    "short_video_plays",
    "article_plays",
    "live_plays",
    "image_plays",
    "total_plays"
   ],
   "rows": [
    [
     "健身",
     4722,
     2061,
     1549,
     1802,
     10134
    ],
    [
     "娱乐",
     16531,
     8196,
     3374,
     5044,
     33145
    ],
    [
     "旅行",
     7447,
     3537,
     1917,
     1665,
     14566
    ],
    [
     "游戏",
     10067,
     4548,
     2354,
     2642,
     19611
    ],
    [
     "知识",
     10789,
     5844,
     3544,
     4047,
     24224
    ],
    [
     "科技",
     7535,
     2802,
     1794,
     2323,
     14454
    ],
    [
     "美食",
     9196,
     4055,
     4000,
     3524,
     20775
    ],
    [
     "财经",
     6513,
     3507,
     2046,
     1791,
     13857
    ]
   ],
   "row_count": 8,
   "translated_sql": "SELECT t.category,\n       SUM(CASE WHEN c.content_type = 'short_video' THEN 1 ELSE 0 END) AS short_video_plays,\n       SUM(CASE WHEN c.content_type = 'article'     THEN 1 ELSE 0 END) AS article_plays,\n       SUM(CASE WHEN c.content_type = 'live'        THEN 1 ELSE 0 END) AS live_plays,\n       SUM(CASE WHEN c.content_type = 'image'       THEN 1 ELSE 0 END) AS image_plays,\n       COUNT(*) AS total_plays\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name = 'play'\n  AND e.event_time >= '2025-01-01'\n  AND e.event_time <  '2026-01-01'\nGROUP BY t.category\nORDER BY t.category;",
   "signature": {
    "tables": [
     "events",
     "contents",
     "topics"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "COUNT(",
     "JOIN"
    ]
   },
   "actual_rows": [
    [
     "健身",
     4722,
     2061,
     1549,
     1802,
     10134
    ],
    [
     "娱乐",
     17759,
     8804,
     3624,
     5418,
     35607
    ],
    [
     "旅行",
     7447,
     3537,
     1917,
     1665,
     14566
    ],
    [
     "游戏",
     10814,
     4885,
     2528,
     2838,
     21068
    ],
    [
     "知识",
     10789,
     5844,
     3544,
     4047,
     24224
    ],
    [
     "科技",
     8094,
     3010,
     1927,
     2495,
     15527
    ],
    [
     "美食",
     9196,
     4055,
     4000,
     3524,
     20775
    ]
   ],
   "actual_row_count": 7,
   "diff": [
    {
     "row": 2,
     "expected": [
      "娱乐",
      16531,
      8196,
      3374,
      5044,
      33145
     ],
     "actual": [
      "娱乐",
      17759,
      8804,
      3624,
      5418,
      35607
     ]
    },
    {
     "row": 4,
     "expected": [
      "游戏",
      10067,
      4548,
      2354,
      2642,
      19611
     ],
     "actual": [
      "游戏",
      10814,
      4885,
      2528,
      2838,
      21068
     ]
    },
    {
     "row": 6,
     "expected": [
      "科技",
      7535,
      2802,
      1794,
      2323,
      14454
     ],
     "actual": [
      "科技",
      8094,
      3010,
      1927,
      2495,
      15527
     ]
    }
   ],
   "hardcode_markers": [
    "健身",
    "科技"
   ]
  }
 },
 "feed-pivot-002": {
  "id": "feed-pivot-002",
  "dataset": "feed",
  "scenario": "pivot",
  "chain": "feed-pivot-chain-a",
  "chain_step": 2,
  "title": "分类互动指标宽转长",
  "business_prompt": "指标平台要灌数：“2025 年按话题分类，把点赞数、评论数、转发数三个指标\n 拆成『分类 / 指标名 / 指标值』的长表，指标名用 like_cnt / comment_cnt / share_cnt。”",
  "context_notes": [
   "事件类型对应关系：like → like_cnt，comment → comment_cnt，share → share_cnt",
   "指标值是事件条数（不是去重人数）",
   "结果按分类名、指标名排序"
  ],
  "tables": [
   "events",
   "contents",
   "topics"
  ],
  "expected_columns": [
   {
    "name": "category",
    "type": "string"
   },
   {
    "name": "metric_name",
    "type": "string"
   },
   {
    "name": "metric_value",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [
    {
     "pattern": "union\\s+all",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "先聚合出一张宽表（分类 + 三列计数），再用三段 UNION ALL 把它拆开。",
   "常量列 'like_cnt' AS metric_name 承载原来的列名。",
   "三段的列数、顺序、类型必须严格一致。"
  ],
  "reference_sql": "WITH base AS (\n    SELECT t.category,\n           SUM(CASE WHEN e.event_name = 'like'    THEN 1 ELSE 0 END) AS like_cnt,\n           SUM(CASE WHEN e.event_name = 'comment' THEN 1 ELSE 0 END) AS comment_cnt,\n           SUM(CASE WHEN e.event_name = 'share'   THEN 1 ELSE 0 END) AS share_cnt\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    JOIN topics   t ON t.topic_id  = c.topic_id\n    WHERE e.event_name IN ('like', 'comment', 'share')\n      AND e.event_time >= '2025-01-01'\n      AND e.event_time <  '2026-01-01'\n    GROUP BY t.category\n)\nSELECT category, 'like_cnt' AS metric_name, like_cnt AS metric_value FROM base\nUNION ALL\nSELECT category, 'comment_cnt', comment_cnt FROM base\nUNION ALL\nSELECT category, 'share_cnt', share_cnt FROM base\nORDER BY category, metric_name;",
  "alt_solutions": [
   "SELECT t.category,\n       'like_cnt' AS metric_name,\n       COUNT(*) AS metric_value\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name = 'like'\n  AND e.event_time >= '2025-01-01' AND e.event_time < '2026-01-01'\nGROUP BY t.category\nUNION ALL\nSELECT t.category, 'comment_cnt', COUNT(*)\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name = 'comment'\n  AND e.event_time >= '2025-01-01' AND e.event_time < '2026-01-01'\nGROUP BY t.category\nUNION ALL\nSELECT t.category, 'share_cnt', COUNT(*)\nFROM events e\nJOIN contents c ON c.content_id = e.content_id\nJOIN topics   t ON t.topic_id  = c.topic_id\nWHERE e.event_name = 'share'\n  AND e.event_time >= '2025-01-01' AND e.event_time < '2026-01-01'\nGROUP BY t.category\nORDER BY category, metric_name;"
  ],
  "explanation": "1. 宽转长把“列名”变成数据，指标平台/BI 工具通常要求这种长表结构。\n2. 先聚合一次再拆（reference）只扫一遍事实表；分三段各自聚合（alt）要扫三遍。\n3. 两种写法结果一致，但在大表上性能差距明显，是值得建立的直觉。",
  "pitfalls": [
   "用 UNION 代替 UNION ALL，恰好相等的 (分类, 指标值) 行被去重",
   "分三段写时漏掉某一段的时间过滤，量级对不上",
   "常量列忘了起别名，列名变成 \"'like_cnt'\" 之类"
  ],
  "capability_points": [
   "pivot.wide2long",
   "pivot.union_all",
   "pivot.scan_cost"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 13.4,
   "columns": [
    "category",
    "metric_name",
    "metric_value"
   ],
   "rows": [
    [
     "健身",
     "comment_cnt",
     2699
    ],
    [
     "健身",
     "like_cnt",
     4833
    ],
    [
     "健身",
     "share_cnt",
     1339
    ],
    [
     "娱乐",
     "comment_cnt",
     8888
    ],
    [
     "娱乐",
     "like_cnt",
     15333
    ],
    [
     "娱乐",
     "share_cnt",
     4489
    ],
    [
     "旅行",
     "comment_cnt",
     3829
    ],
    [
     "旅行",
     "like_cnt",
     6728
    ],
    [
     "旅行",
     "share_cnt",
     1990
    ],
    [
     "游戏",
     "comment_cnt",
     5190
    ],
    [
     "游戏",
     "like_cnt",
     9189
    ],
    [
     "游戏",
     "share_cnt",
     2573
    ],
    [
     "知识",
     "comment_cnt",
     6514
    ],
    [
     "知识",
     "like_cnt",
     11257
    ],
    [
     "知识",
     "share_cnt",
     3300
    ]
   ],
   "row_count": 24,
   "translated_sql": "WITH base AS (\n    SELECT t.category,\n           SUM(CASE WHEN e.event_name = 'like'    THEN 1 ELSE 0 END) AS like_cnt,\n           SUM(CASE WHEN e.event_name = 'comment' THEN 1 ELSE 0 END) AS comment_cnt,\n           SUM(CASE WHEN e.event_name = 'share'   THEN 1 ELSE 0 END) AS share_cnt\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    JOIN topics   t ON t.topic_id  = c.topic_id\n    WHERE e.event_name IN ('like', 'comment', 'share')\n      AND e.event_time >= '2025-01-01'\n      AND e.event_time <  '2026-01-01'\n    GROUP BY t.category\n)\nSELECT category, 'like_cnt' AS metric_name, like_cnt AS metric_value FROM base\nUNION ALL\nSELECT category, 'comment_cnt', comment_cnt FROM base\nUNION ALL\nSELECT category, 'share_cnt', share_cnt FROM base\nORDER BY category, metric_name;",
   "signature": {
    "tables": [
     "events",
     "contents",
     "topics"
    ],
    "keywords": [
     "UNION ALL",
     "CASE WHEN",
     "SUM(",
     "JOIN",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "健身",
     "comment_cnt",
     2699
    ],
    [
     "健身",
     "like_cnt",
     5533
    ],
    [
     "健身",
     "share_cnt",
     1339
    ],
    [
     "娱乐",
     "comment_cnt",
     10175
    ],
    [
     "娱乐",
     "like_cnt",
     15333
    ],
    [
     "娱乐",
     "share_cnt",
     5139
    ],
    [
     "旅行",
     "comment_cnt",
     3829
    ],
    [
     "旅行",
     "like_cnt",
     7702
    ],
    [
     "旅行",
     "share_cnt",
     1990
    ],
    [
     "游戏",
     "comment_cnt",
     5942
    ],
    [
     "游戏",
     "like_cnt",
     9189
    ],
    [
     "游戏",
     "share_cnt",
     2945
    ],
    [
     "知识",
     "comment_cnt",
     6514
    ],
    [
     "知识",
     "like_cnt",
     12888
    ]
   ],
   "actual_row_count": 23,
   "diff": [
    {
     "row": 2,
     "expected": [
      "健身",
      "like_cnt",
      4833
     ],
     "actual": [
      "健身",
      "like_cnt",
      5533
     ]
    },
    {
     "row": 4,
     "expected": [
      "娱乐",
      "comment_cnt",
      8888
     ],
     "actual": [
      "娱乐",
      "comment_cnt",
      10175
     ]
    },
    {
     "row": 6,
     "expected": [
      "娱乐",
      "share_cnt",
      4489
     ],
     "actual": [
      "娱乐",
      "share_cnt",
      5139
     ]
    },
    {
     "row": 8,
     "expected": [
      "旅行",
      "like_cnt",
      6728
     ],
     "actual": [
      "旅行",
      "like_cnt",
      7702
     ]
    },
    {
     "row": 10,
     "expected": [
      "游戏",
      "comment_cnt",
      5190
     ],
     "actual": [
      "游戏",
      "comment_cnt",
      5942
     ]
    }
   ],
   "hardcode_markers": [
    "健身"
   ]
  }
 },
 "feed-retention-001": {
  "id": "feed-retention-001",
  "dataset": "feed",
  "scenario": "retention",
  "chain": "feed-retention-chain-a",
  "chain_step": 1,
  "title": "首次活跃分群的次日留存（日活快照口径）",
  "business_prompt": "用户增长看新客质量：“用日活快照表，把每个用户第一次出现在日活里的那天当作他的『首活日』，\n 按首活月份分群，统计分群人数、次日仍然活跃的人数和次日留存率。”",
  "context_notes": [
   "daily_active 是“某天某用户活跃”的快照，一天一用户一行",
   "首活日 = MIN(stat_date)，不要用 is_new 字段（该字段是埋点噪声，同一用户可能多次为真）",
   "次日活跃 = 存在 stat_date = 首活日 + 1 天的记录",
   "分群范围 2024-01-01 ~ 2025-12-30"
  ],
  "tables": [
   "daily_active"
  ],
  "expected_columns": [
   {
    "name": "cohort_month",
    "type": "string"
   },
   {
    "name": "cohort_users",
    "type": "int"
   },
   {
    "name": "d1_users",
    "type": "int"
   },
   {
    "name": "d1_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "第一步用 GROUP BY user_id + MIN(stat_date) 求出每人的首活日。",
   "第二步用 LEFT JOIN 回 daily_active，条件是日期正好等于首活日 + 1 天。",
   "LEFT JOIN 而不是 INNER JOIN，否则分母只剩留下来的人。"
  ],
  "reference_sql": "WITH first_act AS (\n    SELECT user_id, MIN(stat_date) AS fd\n    FROM daily_active\n    GROUP BY user_id\n)\nSELECT DATE_FORMAT(f.fd, '%Y-%m') AS cohort_month,\n       COUNT(DISTINCT f.user_id) AS cohort_users,\n       COUNT(DISTINCT d.user_id) AS d1_users,\n       ROUND(COUNT(DISTINCT d.user_id) * 1.0\n           / NULLIF(COUNT(DISTINCT f.user_id), 0), 4) AS d1_rate\nFROM first_act f\nLEFT JOIN daily_active d\n       ON d.user_id = f.user_id\n      AND d.stat_date = DATE_ADD(f.fd, INTERVAL 1 DAY)\nWHERE f.fd >= '2024-01-01'\n  AND f.fd <= '2025-12-30'\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "WITH first_act AS (\n    SELECT user_id, MIN(stat_date) AS fd\n    FROM daily_active GROUP BY user_id\n),\njoined AS (\n    SELECT f.user_id,\n           f.fd,\n           MAX(CASE WHEN DATEDIFF(d.stat_date, f.fd) = 1 THEN 1 ELSE 0 END) AS retained\n    FROM first_act f\n    LEFT JOIN daily_active d ON d.user_id = f.user_id\n    WHERE f.fd >= '2024-01-01' AND f.fd <= '2025-12-30'\n    GROUP BY f.user_id, f.fd\n)\nSELECT DATE_FORMAT(fd, '%Y-%m') AS cohort_month,\n       COUNT(*) AS cohort_users,\n       SUM(retained) AS d1_users,\n       ROUND(SUM(retained) * 1.0 / NULLIF(COUNT(*), 0), 4) AS d1_rate\nFROM joined\nGROUP BY 1\nORDER BY 1;"
  ],
  "explanation": "1. 留存三要素：锚点（首活日）、观察窗口（+1 天）、分母（分群总人数）。\n2. 锚点靠自聚合求出，别信数据里现成的 is_new 标记——脏数据是常态。\n3. LEFT JOIN 是分母不塌陷的保证，这一点在所有留存题里都成立。",
  "pitfalls": [
   "用 is_new 当锚点，同一用户被多次判定为新增，分群人数虚高",
   "INNER JOIN 导致分母只剩留存用户，留存率恒为 100%",
   "日期加减写成字符串拼接，无法正确对齐"
  ],
  "capability_points": [
   "retention.anchor",
   "retention.nday",
   "retention.denominator"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 36.8,
   "columns": [
    "cohort_month",
    "cohort_users",
    "d1_users",
    "d1_rate"
   ],
   "rows": [
    [
     "2024-01",
     35934,
     1395,
     0.0388
    ],
    [
     "2024-02",
     9835,
     445,
     0.0452
    ],
    [
     "2024-03",
     3023,
     123,
     0.0407
    ],
    [
     "2024-04",
     864,
     40,
     0.0463
    ],
    [
     "2024-05",
     228,
     7,
     0.0307
    ],
    [
     "2024-06",
     91,
     1,
     0.011
    ],
    [
     "2024-07",
     20,
     1,
     0.05
    ],
    [
     "2024-08",
     2,
     0,
     0.0
    ],
    [
     "2024-09",
     3,
     0,
     0.0
    ]
   ],
   "row_count": 9,
   "translated_sql": "WITH first_act AS (\n    SELECT user_id, MIN(stat_date) AS fd\n    FROM daily_active\n    GROUP BY user_id\n)\nSELECT strftime(f.fd, '%Y-%m') AS cohort_month,\n       COUNT(DISTINCT f.user_id) AS cohort_users,\n       COUNT(DISTINCT d.user_id) AS d1_users,\n       ROUND(COUNT(DISTINCT d.user_id) * 1.0\n           / NULLIF(COUNT(DISTINCT f.user_id), 0), 4) AS d1_rate\nFROM first_act f\nLEFT JOIN daily_active d\n       ON d.user_id = f.user_id\n      AND d.stat_date = (f.fd + INTERVAL 1 DAY)\nWHERE f.fd >= '2024-01-01'\n  AND f.fd <= '2025-12-30'\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "daily_active"
    ],
    "keywords": [
     "COUNT(",
     "COUNT(DISTINCT",
     "MIN(",
     "LEFT JOIN",
     "JOIN",
     "DATE_FORMAT",
     "DATE_ADD",
     "INTERVAL",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "2024-01",
     35934,
     1395,
     0.0388
    ],
    [
     "2024-02",
     11093,
     501,
     0.05
    ],
    [
     "2024-03",
     3023,
     123,
     0.0407
    ],
    [
     "2024-04",
     974,
     45,
     0.05
    ],
    [
     "2024-05",
     228,
     7,
     0.0307
    ],
    [
     "2024-06",
     102,
     1,
     0.01
    ],
    [
     "2024-07",
     20,
     1,
     0.05
    ],
    [
     "2024-08",
     2,
     0,
     0.0
    ]
   ],
   "actual_row_count": 8,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2024-02",
      9835,
      445,
      0.0452
     ],
     "actual": [
      "2024-02",
      11093,
      501,
      0.05
     ]
    },
    {
     "row": 4,
     "expected": [
      "2024-04",
      864,
      40,
      0.0463
     ],
     "actual": [
      "2024-04",
      974,
      45,
      0.05
     ]
    },
    {
     "row": 6,
     "expected": [
      "2024-06",
      91,
      1,
      0.011
     ],
     "actual": [
      "2024-06",
      102,
      1,
      0.01
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "feed-retention-002": {
  "id": "feed-retention-002",
  "dataset": "feed",
  "scenario": "retention",
  "chain": "feed-retention-chain-a",
  "chain_step": 2,
  "title": "月度粘性 DAU/MAU",
  "business_prompt": "产品周会固定看粘性：“2025 年每个月，给我平均日活（当月各天 DAU 的均值）、\n 月活 MAU（当月去重活跃人数），以及粘性 = 平均DAU / MAU。”",
  "context_notes": [
   "DAU = 某天的去重活跃用户数；MAU = 整月的去重活跃用户数（不是各天 DAU 之和）",
   "平均 DAU 保留 2 位小数，粘性保留 4 位小数",
   "MAU 必须单独去重统计，不能用 SUM(DAU)"
  ],
  "tables": [
   "daily_active"
  ],
  "expected_columns": [
   {
    "name": "ym",
    "type": "string"
   },
   {
    "name": "avg_dau",
    "type": "decimal"
   },
   {
    "name": "mau",
    "type": "int"
   },
   {
    "name": "stickiness",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "两个不同粒度的指标，最稳的做法是分别算成两张表再 JOIN。",
   "DAU 表按 stat_date 聚合，MAU 表按月聚合，两边都用 COUNT(DISTINCT user_id)。",
   "平均 DAU 是对 DAU 表按月求 AVG，不是 SUM。"
  ],
  "reference_sql": "WITH dau AS (\n    SELECT stat_date,\n           COUNT(DISTINCT user_id) AS dau\n    FROM daily_active\n    WHERE stat_date >= '2025-01-01' AND stat_date < '2026-01-01'\n    GROUP BY stat_date\n),\nmau AS (\n    SELECT DATE_FORMAT(stat_date, '%Y-%m') AS ym,\n           COUNT(DISTINCT user_id) AS mau\n    FROM daily_active\n    WHERE stat_date >= '2025-01-01' AND stat_date < '2026-01-01'\n    GROUP BY 1\n)\nSELECT m.ym,\n       ROUND(AVG(d.dau), 2) AS avg_dau,\n       m.mau,\n       ROUND(AVG(d.dau) / NULLIF(m.mau, 0), 4) AS stickiness\nFROM mau m\nJOIN dau d ON DATE_FORMAT(d.stat_date, '%Y-%m') = m.ym\nGROUP BY m.ym, m.mau\nORDER BY m.ym;",
  "alt_solutions": [
   "WITH dau AS (\n    SELECT DATE_FORMAT(stat_date, '%Y-%m') AS ym,\n           stat_date,\n           COUNT(DISTINCT user_id) AS dau\n    FROM daily_active\n    WHERE stat_date >= '2025-01-01' AND stat_date < '2026-01-01'\n    GROUP BY 1, 2\n),\ndau_m AS (\n    SELECT ym, AVG(dau) AS avg_dau FROM dau GROUP BY ym\n),\nmau AS (\n    SELECT DATE_FORMAT(stat_date, '%Y-%m') AS ym,\n           COUNT(DISTINCT user_id) AS mau\n    FROM daily_active\n    WHERE stat_date >= '2025-01-01' AND stat_date < '2026-01-01'\n    GROUP BY 1\n)\nSELECT a.ym,\n       ROUND(a.avg_dau, 2) AS avg_dau,\n       b.mau,\n       ROUND(a.avg_dau / NULLIF(b.mau, 0), 4) AS stickiness\nFROM dau_m a\nJOIN mau b ON b.ym = a.ym\nORDER BY a.ym;"
  ],
  "explanation": "1. DAU 与 MAU 是不同粒度的去重，天然不能互相加总推导。\n2. 跨粒度指标放一行，标准做法是各自聚合成表后按公共键 JOIN。\n3. 粘性 = 平均DAU/MAU，衡量“一个月活用户一个月来几天”，值越高越健康。",
  "pitfalls": [
   "用 SUM(DAU) 当 MAU，同一用户来 10 天被算 10 个人",
   "用 COUNT(DISTINCT user_id) 直接按月分组当作“平均 DAU”，混淆了两个粒度",
   "JOIN 条件写成日期相等而不是月份相等，结果为空"
  ],
  "capability_points": [
   "retention.stickiness",
   "agg.grain_mismatch",
   "agg.distinct_count"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 48.6,
   "columns": [
    "ym",
    "avg_dau",
    "mau",
    "stickiness"
   ],
   "rows": [
    [
     "2025-01",
     2015.74,
     35981,
     0.056
    ],
    [
     "2025-02",
     2009.32,
     34124,
     0.0589
    ],
    [
     "2025-03",
     2026.03,
     36149,
     0.056
    ],
    [
     "2025-04",
     2022.4,
     35496,
     0.057
    ],
    [
     "2025-05",
     2021.57,
     35393,
     0.0571
    ],
    [
     "2025-06",
     2021.07,
     35461,
     0.057
    ],
    [
     "2025-07",
     2028.94,
     36165,
     0.0561
    ],
    [
     "2025-08",
     2010.71,
     36161,
     0.0556
    ],
    [
     "2025-09",
     2014.1,
     35419,
     0.0569
    ],
    [
     "2025-10",
     2012.29,
     36156,
     0.0557
    ],
    [
     "2025-11",
     2029.7,
     35667,
     0.0569
    ],
    [
     "2025-12",
     2025.67,
     35512,
     0.057
    ]
   ],
   "row_count": 12,
   "translated_sql": "WITH dau AS (\n    SELECT stat_date,\n           COUNT(DISTINCT user_id) AS dau\n    FROM daily_active\n    WHERE stat_date >= '2025-01-01' AND stat_date < '2026-01-01'\n    GROUP BY stat_date\n),\nmau AS (\n    SELECT strftime(stat_date, '%Y-%m') AS ym,\n           COUNT(DISTINCT user_id) AS mau\n    FROM daily_active\n    WHERE stat_date >= '2025-01-01' AND stat_date < '2026-01-01'\n    GROUP BY 1\n)\nSELECT m.ym,\n       ROUND(AVG(d.dau), 2) AS avg_dau,\n       m.mau,\n       ROUND(AVG(d.dau) / NULLIF(m.mau, 0), 4) AS stickiness\nFROM mau m\nJOIN dau d ON strftime(d.stat_date, '%Y-%m') = m.ym\nGROUP BY m.ym, m.mau\nORDER BY m.ym;",
   "signature": {
    "tables": [
     "daily_active"
    ],
    "keywords": [
     "COUNT(",
     "COUNT(DISTINCT",
     "AVG(",
     "JOIN",
     "DATE_FORMAT",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "2025-01",
     2015.74,
     35981,
     0.056
    ],
    [
     "2025-02",
     2120.23,
     36007,
     0.06
    ],
    [
     "2025-03",
     2026.03,
     36149,
     0.056
    ],
    [
     "2025-04",
     2134.04,
     37455,
     0.06
    ],
    [
     "2025-05",
     2021.57,
     35393,
     0.0571
    ],
    [
     "2025-06",
     2132.63,
     37418,
     0.06
    ],
    [
     "2025-07",
     2028.94,
     36165,
     0.0561
    ],
    [
     "2025-08",
     2121.7,
     38157,
     0.06
    ],
    [
     "2025-09",
     2014.1,
     35419,
     0.0569
    ],
    [
     "2025-10",
     2123.37,
     38151,
     0.06
    ],
    [
     "2025-11",
     2029.7,
     35667,
     0.0569
    ]
   ],
   "actual_row_count": 11,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2025-02",
      2009.32,
      34124,
      0.0589
     ],
     "actual": [
      "2025-02",
      2120.23,
      36007,
      0.06
     ]
    },
    {
     "row": 4,
     "expected": [
      "2025-04",
      2022.4,
      35496,
      0.057
     ],
     "actual": [
      "2025-04",
      2134.04,
      37455,
      0.06
     ]
    },
    {
     "row": 6,
     "expected": [
      "2025-06",
      2021.07,
      35461,
      0.057
     ],
     "actual": [
      "2025-06",
      2132.63,
      37418,
      0.06
     ]
    },
    {
     "row": 8,
     "expected": [
      "2025-08",
      2010.71,
      36161,
      0.0556
     ],
     "actual": [
      "2025-08",
      2121.7,
      38157,
      0.06
     ]
    },
    {
     "row": 10,
     "expected": [
      "2025-10",
      2012.29,
      36156,
      0.0557
     ],
     "actual": [
      "2025-10",
      2123.37,
      38151,
      0.06
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "feed-window-001": {
  "id": "feed-window-001",
  "dataset": "feed",
  "scenario": "window",
  "chain": "feed-window-chain-a",
  "chain_step": 1,
  "title": "每个分类播放量 Top3 内容（并列全保留）",
  "business_prompt": "编辑部要做榜单：“2025 年每个话题分类里，播放次数最多的前 3 名内容。\n 如果有并列第 3 名，都要保留，不要随便砍掉。”",
  "context_notes": [
   "播放次数 = event_name='play' 的事件条数",
   "“并列都保留”意味着用 DENSE_RANK 而不是 ROW_NUMBER",
   "输出 rk 排名列，按分类、排名、content_id 排序"
  ],
  "tables": [
   "events",
   "contents",
   "topics"
  ],
  "expected_columns": [
   {
    "name": "category",
    "type": "string"
   },
   {
    "name": "content_id",
    "type": "int"
   },
   {
    "name": "play_cnt",
    "type": "int"
   },
   {
    "name": "rk",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [
    {
     "pattern": "dense_rank\\s*\\(\\s*\\)",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": [
    {
     "pattern": "\\blimit\\s+3\\b",
     "flags": "is",
     "reason": ""
    }
   ]
  },
  "hints": [
   "先聚合出「分类-内容-播放次数」，再在这张表上开窗排名。",
   "PARTITION BY category 表示“每个分类内部各排各的”。",
   "窗口函数不能写在 WHERE 里，必须先在子查询/CTE 里算出 rk 再过滤。"
  ],
  "reference_sql": "WITH plays AS (\n    SELECT t.category,\n           c.content_id,\n           COUNT(*) AS play_cnt\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    JOIN topics   t ON t.topic_id  = c.topic_id\n    WHERE e.event_name = 'play'\n      AND e.event_time >= '2025-01-01'\n      AND e.event_time <  '2026-01-01'\n    GROUP BY 1, 2\n),\nranked AS (\n    SELECT category, content_id, play_cnt,\n           DENSE_RANK() OVER (PARTITION BY category ORDER BY play_cnt DESC) AS rk\n    FROM plays\n)\nSELECT category, content_id, play_cnt, rk\nFROM ranked\nWHERE rk <= 3\nORDER BY category, rk, content_id;",
  "alt_solutions": [
   "SELECT category, content_id, play_cnt, rk\nFROM (\n    SELECT t.category,\n           c.content_id,\n           COUNT(*) AS play_cnt,\n           DENSE_RANK() OVER (PARTITION BY t.category ORDER BY COUNT(*) DESC) AS rk\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    JOIN topics   t ON t.topic_id  = c.topic_id\n    WHERE e.event_name = 'play'\n      AND e.event_time >= '2025-01-01' AND e.event_time < '2026-01-01'\n    GROUP BY t.category, c.content_id\n) r\nWHERE rk <= 3\nORDER BY category, rk, content_id;"
  ],
  "explanation": "1. 组内 TopN 的固定套路：聚合 → 开窗排名 → 外层过滤名次。\n2. RANK / DENSE_RANK / ROW_NUMBER 的差别就在并列怎么处理，题目说“都保留”就选 DENSE_RANK。\n3. 窗口函数可以直接写在聚合查询的 SELECT 里（alt 写法），此时它作用于聚合后的结果。",
  "pitfalls": [
   "用 ROW_NUMBER，并列第 3 被随机砍掉一个",
   "用 LIMIT 3，只拿到全局前 3 而不是每个分类前 3",
   "把 rk <= 3 写进同层 WHERE，MySQL 报“窗口函数不允许出现在 WHERE”"
  ],
  "capability_points": [
   "window.dense_rank",
   "window.partition",
   "window.topn",
   "window.filter_after_rank"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 11.9,
   "columns": [
    "category",
    "content_id",
    "play_cnt",
    "rk"
   ],
   "rows": [
    [
     "健身",
     1476,
     102,
     1
    ],
    [
     "健身",
     1148,
     100,
     2
    ],
    [
     "健身",
     1113,
     93,
     3
    ],
    [
     "娱乐",
     115,
     108,
     1
    ],
    [
     "娱乐",
     543,
     101,
     2
    ],
    [
     "娱乐",
     441,
     98,
     3
    ],
    [
     "旅行",
     455,
     98,
     1
    ],
    [
     "旅行",
     799,
     95,
     2
    ],
    [
     "旅行",
     1008,
     95,
     2
    ],
    [
     "旅行",
     1100,
     95,
     2
    ],
    [
     "旅行",
     1614,
     93,
     3
    ],
    [
     "游戏",
     465,
     101,
     1
    ],
    [
     "游戏",
     1310,
     101,
     1
    ],
    [
     "游戏",
     729,
     96,
     2
    ],
    [
     "游戏",
     43,
     95,
     3
    ]
   ],
   "row_count": 31,
   "translated_sql": "WITH plays AS (\n    SELECT t.category,\n           c.content_id,\n           COUNT(*) AS play_cnt\n    FROM events e\n    JOIN contents c ON c.content_id = e.content_id\n    JOIN topics   t ON t.topic_id  = c.topic_id\n    WHERE e.event_name = 'play'\n      AND e.event_time >= '2025-01-01'\n      AND e.event_time <  '2026-01-01'\n    GROUP BY 1, 2\n),\nranked AS (\n    SELECT category, content_id, play_cnt,\n           DENSE_RANK() OVER (PARTITION BY category ORDER BY play_cnt DESC) AS rk\n    FROM plays\n)\nSELECT category, content_id, play_cnt, rk\nFROM ranked\nWHERE rk <= 3\nORDER BY category, rk, content_id;",
   "signature": {
    "tables": [
     "events",
     "contents",
     "topics"
    ],
    "keywords": [
     "DENSE_RANK",
     "OVER",
     "PARTITION BY",
     "COUNT(",
     "JOIN",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "健身",
     1476,
     102,
     1
    ],
    [
     "健身",
     1310,
     114,
     2
    ],
    [
     "健身",
     1113,
     93,
     3
    ],
    [
     "娱乐",
     131,
     123,
     1
    ],
    [
     "娱乐",
     543,
     101,
     2
    ],
    [
     "娱乐",
     503,
     111,
     3
    ],
    [
     "旅行",
     455,
     98,
     1
    ],
    [
     "旅行",
     912,
     108,
     2
    ],
    [
     "旅行",
     1008,
     95,
     2
    ],
    [
     "旅行",
     1255,
     108,
     2
    ],
    [
     "旅行",
     1614,
     93,
     3
    ],
    [
     "游戏",
     530,
     115,
     1
    ],
    [
     "游戏",
     1310,
     101,
     1
    ],
    [
     "游戏",
     832,
     109,
     2
    ]
   ],
   "actual_row_count": 30,
   "diff": [
    {
     "row": 2,
     "expected": [
      "健身",
      1148,
      100,
      2
     ],
     "actual": [
      "健身",
      1310,
      114,
      2
     ]
    },
    {
     "row": 4,
     "expected": [
      "娱乐",
      115,
      108,
      1
     ],
     "actual": [
      "娱乐",
      131,
      123,
      1
     ]
    },
    {
     "row": 6,
     "expected": [
      "娱乐",
      441,
      98,
      3
     ],
     "actual": [
      "娱乐",
      503,
      111,
      3
     ]
    },
    {
     "row": 8,
     "expected": [
      "旅行",
      799,
      95,
      2
     ],
     "actual": [
      "旅行",
      912,
      108,
      2
     ]
    },
    {
     "row": 10,
     "expected": [
      "旅行",
      1100,
      95,
      2
     ],
     "actual": [
      "旅行",
      1255,
      108,
      2
     ]
    }
   ],
   "hardcode_markers": [
    "健身"
   ]
  }
 },
 "feed-window-002": {
  "id": "feed-window-002",
  "dataset": "feed",
  "scenario": "window",
  "chain": "feed-window-chain-a",
  "chain_step": 2,
  "title": "高产作者的发布节奏（相邻发布间隔）",
  "business_prompt": "创作者激励要找“稳定高产”的人：“对每位作者，按发布时间排序算出相邻两篇的间隔天数，\n 然后统计他的间隔次数、平均间隔和最长间隔。只看有 5 次以上间隔的作者，\n 按平均间隔从小到大给我前 20 个。”",
  "context_notes": [
   "只用 contents 表；间隔 = 本篇 publish_time 与上一篇 publish_time 的天数差",
   "第一篇没有上一篇，间隔为 NULL，应被排除",
   "平均间隔保留 2 位小数；平均间隔相同时按 author_id 升序，取前 20"
  ],
  "tables": [
   "contents"
  ],
  "expected_columns": [
   {
    "name": "author_id",
    "type": "int"
   },
   {
    "name": "gap_cnt",
    "type": "int"
   },
   {
    "name": "avg_gap_days",
    "type": "decimal"
   },
   {
    "name": "max_gap_days",
    "type": "int"
   }
  ],
  "order_sensitive": true,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\blag\\s*\\(",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "第一步：LAG(publish_time) OVER (PARTITION BY author_id ORDER BY publish_time)。",
   "第二步：DATEDIFF(本篇, 上一篇) 得到间隔天数，NULL 的行过滤掉。",
   "第三步：按作者聚合，HAVING COUNT(*) >= 5，最后 ORDER BY + LIMIT。"
  ],
  "reference_sql": "WITH pub AS (\n    SELECT author_id,\n           publish_time,\n           LAG(publish_time) OVER (PARTITION BY author_id ORDER BY publish_time) AS prev_pub\n    FROM contents\n)\nSELECT author_id,\n       COUNT(*) AS gap_cnt,\n       ROUND(AVG(DATEDIFF(publish_time, prev_pub)), 2) AS avg_gap_days,\n       MAX(DATEDIFF(publish_time, prev_pub)) AS max_gap_days\nFROM pub\nWHERE prev_pub IS NOT NULL\nGROUP BY author_id\nHAVING COUNT(*) >= 5\nORDER BY avg_gap_days ASC, author_id ASC\nLIMIT 20;",
  "alt_solutions": [
   "WITH pub AS (\n    SELECT author_id,\n           DATEDIFF(publish_time,\n                    LAG(publish_time) OVER (PARTITION BY author_id ORDER BY publish_time)\n           ) AS gap_days\n    FROM contents\n)\nSELECT author_id,\n       COUNT(gap_days) AS gap_cnt,\n       ROUND(AVG(gap_days), 2) AS avg_gap_days,\n       MAX(gap_days) AS max_gap_days\nFROM pub\nWHERE gap_days IS NOT NULL\nGROUP BY author_id\nHAVING COUNT(gap_days) >= 5\nORDER BY avg_gap_days, author_id\nLIMIT 20;"
  ],
  "explanation": "1. “相邻两条记录的差”是 LAG 的经典用途，等价于自连接但代价低得多。\n2. 窗口函数与聚合函数分属两层：先开窗算出每行的间隔，再聚合成作者级指标。\n3. 排序必须给出唯一的 tie-breaker（author_id），否则 LIMIT 20 的结果不确定。",
  "pitfalls": [
   "忘记 PARTITION BY author_id，间隔跨作者串味",
   "不过滤 prev_pub IS NULL，AVG 虽会忽略 NULL 但 COUNT(*) 会多算一次",
   "ORDER BY 只写 avg_gap_days，并列时前 20 名不稳定"
  ],
  "capability_points": [
   "window.lag",
   "window.partition",
   "agg.having",
   "window.tie_breaker"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 3.8,
   "columns": [
    "author_id",
    "gap_cnt",
    "avg_gap_days",
    "max_gap_days"
   ],
   "rows": [],
   "row_count": 0,
   "translated_sql": "WITH pub AS (\n    SELECT author_id,\n           publish_time,\n           LAG(publish_time) OVER (PARTITION BY author_id ORDER BY publish_time) AS prev_pub\n    FROM contents\n)\nSELECT author_id,\n       COUNT(*) AS gap_cnt,\n       ROUND(AVG(date_diff('day', prev_pub, publish_time)), 2) AS avg_gap_days,\n       MAX(date_diff('day', prev_pub, publish_time)) AS max_gap_days\nFROM pub\nWHERE prev_pub IS NOT NULL\nGROUP BY author_id\nHAVING COUNT(*) >= 5\nORDER BY avg_gap_days ASC, author_id ASC\nLIMIT 20;",
   "signature": {
    "tables": [
     "contents"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "PARTITION BY",
     "COUNT(",
     "AVG(",
     "MAX(",
     "HAVING",
     "DATEDIFF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [],
   "actual_row_count": 0,
   "diff": [],
   "hardcode_markers": []
  }
 },
 "saas-agg-001": {
  "id": "saas-agg-001",
  "dataset": "saas",
  "scenario": "agg",
  "chain": "saas-agg-chain-a",
  "chain_step": 1,
  "title": "行业 × 公司规模的账号盘子与在租 MRR",
  "business_prompt": "销售运营要看客户结构：“按行业和公司规模两个维度，统计账号数、\n 处于 active 状态的订阅数，以及这些 active 订阅的 MRR 合计。\n 没有任何订阅的账号也要出现在结果里。”",
  "context_notes": [
   "账号数是 accounts 的去重 account_id 数，与是否有订阅无关",
   "active 订阅 = subscriptions.status = 'active'",
   "MRR 合计保留 2 位小数；没有 active 订阅的组应为 0 而非 NULL"
  ],
  "tables": [
   "accounts",
   "subscriptions"
  ],
  "expected_columns": [
   {
    "name": "industry",
    "type": "string"
   },
   {
    "name": "company_size",
    "type": "string"
   },
   {
    "name": "account_cnt",
    "type": "int"
   },
   {
    "name": "active_subs",
    "type": "int"
   },
   {
    "name": "active_mrr",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [
    {
     "pattern": "left\\s+join",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "“账号也要出现”意味着以 accounts 为主表做 LEFT JOIN。",
   "过滤 active 不能写进 WHERE，否则 LEFT JOIN 退化；要写进 CASE WHEN。",
   "SUM(CASE WHEN ... THEN mrr ELSE 0 END) 保证无匹配时得到 0。"
  ],
  "reference_sql": "SELECT a.industry,\n       a.company_size,\n       COUNT(DISTINCT a.account_id) AS account_cnt,\n       COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.sub_id END) AS active_subs,\n       ROUND(SUM(CASE WHEN s.status = 'active' THEN s.mrr ELSE 0 END), 2) AS active_mrr\nFROM accounts a\nLEFT JOIN subscriptions s ON s.account_id = a.account_id\nGROUP BY a.industry, a.company_size\nORDER BY a.industry, a.company_size;",
  "alt_solutions": [
   "SELECT a.industry,\n       a.company_size,\n       COUNT(DISTINCT a.account_id) AS account_cnt,\n       COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.sub_id ELSE NULL END) AS active_subs,\n       ROUND(COALESCE(SUM(CASE WHEN s.status = 'active' THEN s.mrr END), 0), 2) AS active_mrr\nFROM accounts a\nLEFT JOIN subscriptions s ON s.account_id = a.account_id\nGROUP BY 1, 2\nORDER BY 1, 2;"
  ],
  "explanation": "1. “主表保全”是 LEFT JOIN 的目的，任何针对从表的过滤都必须搬进 ON 或 CASE。\n2. COUNT(DISTINCT CASE WHEN ... THEN x END) 是在同一次扫描里算多个口径的标准手段。\n3. SUM 对空集返回 NULL，用 ELSE 0 或 COALESCE 兜底成 0，报表才不会出现空格。",
  "pitfalls": [
   "把 s.status='active' 写进 WHERE，无订阅账号整行消失，account_cnt 失真",
   "COUNT(s.sub_id) 不去重不加条件，把 churned/trialing 都算成活跃",
   "SUM 返回 NULL 没兜底，前端展示成空白"
  ],
  "capability_points": [
   "agg.multi_dim",
   "agg.left_join_preserve",
   "agg.conditional_agg",
   "agg.null_handling"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 8.4,
   "columns": [
    "industry",
    "company_size",
    "account_cnt",
    "active_subs",
    "active_mrr"
   ],
   "rows": [
    [
     "Ecommerce",
     "1-10",
     226,
     110,
     875186.0
    ],
    [
     "Ecommerce",
     "1000+",
     45,
     25,
     231464.6
    ],
    [
     "Ecommerce",
     "11-50",
     208,
     108,
     771661.5
    ],
    [
     "Ecommerce",
     "201-1000",
     90,
     45,
     245334.8
    ],
    [
     "Ecommerce",
     "51-200",
     191,
     118,
     1302816.7
    ],
    [
     "Education",
     "1-10",
     223,
     132,
     1349041.3
    ],
    [
     "Education",
     "1000+",
     38,
     27,
     410521.2
    ],
    [
     "Education",
     "11-50",
     243,
     123,
     1028400.2
    ],
    [
     "Education",
     "201-1000",
     101,
     53,
     405439.2
    ],
    [
     "Education",
     "51-200",
     173,
     97,
     1054681.6
    ],
    [
     "Finance",
     "1-10",
     212,
     79,
     533082.7
    ],
    [
     "Finance",
     "1000+",
     30,
     14,
     219875.3
    ],
    [
     "Finance",
     "11-50",
     208,
     104,
     1243050.6
    ],
    [
     "Finance",
     "201-1000",
     68,
     34,
     23792.7
    ],
    [
     "Finance",
     "51-200",
     170,
     102,
     929126.0
    ]
   ],
   "row_count": 35,
   "translated_sql": "SELECT a.industry,\n       a.company_size,\n       COUNT(DISTINCT a.account_id) AS account_cnt,\n       COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.sub_id END) AS active_subs,\n       ROUND(SUM(CASE WHEN s.status = 'active' THEN s.mrr ELSE 0 END), 2) AS active_mrr\nFROM accounts a\nLEFT JOIN subscriptions s ON s.account_id = a.account_id\nGROUP BY a.industry, a.company_size\nORDER BY a.industry, a.company_size;",
   "signature": {
    "tables": [
     "accounts",
     "subscriptions"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "COUNT(",
     "COUNT(DISTINCT",
     "LEFT JOIN",
     "JOIN",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "Ecommerce",
     "1-10",
     226,
     110,
     875186.0
    ],
    [
     "Ecommerce",
     "1000+",
     48,
     26,
     248523.54
    ],
    [
     "Ecommerce",
     "11-50",
     208,
     108,
     771661.5
    ],
    [
     "Ecommerce",
     "201-1000",
     96,
     48,
     263415.97
    ],
    [
     "Ecommerce",
     "51-200",
     191,
     118,
     1302816.7
    ],
    [
     "Education",
     "1-10",
     239,
     141,
     1448465.64
    ],
    [
     "Education",
     "1000+",
     38,
     27,
     410521.2
    ],
    [
     "Education",
     "11-50",
     260,
     132,
     1104193.29
    ],
    [
     "Education",
     "201-1000",
     101,
     53,
     405439.2
    ],
    [
     "Education",
     "51-200",
     185,
     104,
     1132411.63
    ],
    [
     "Finance",
     "1-10",
     212,
     79,
     533082.7
    ],
    [
     "Finance",
     "1000+",
     32,
     15,
     236080.11
    ],
    [
     "Finance",
     "11-50",
     208,
     104,
     1243050.6
    ],
    [
     "Finance",
     "201-1000",
     73,
     36,
     25546.22
    ]
   ],
   "actual_row_count": 34,
   "diff": [
    {
     "row": 2,
     "expected": [
      "Ecommerce",
      "1000+",
      45,
      25,
      231464.6
     ],
     "actual": [
      "Ecommerce",
      "1000+",
      48,
      26,
      248523.54
     ]
    },
    {
     "row": 4,
     "expected": [
      "Ecommerce",
      "201-1000",
      90,
      45,
      245334.8
     ],
     "actual": [
      "Ecommerce",
      "201-1000",
      96,
      48,
      263415.97
     ]
    },
    {
     "row": 6,
     "expected": [
      "Education",
      "1-10",
      223,
      132,
      1349041.3
     ],
     "actual": [
      "Education",
      "1-10",
      239,
      141,
      1448465.64
     ]
    },
    {
     "row": 8,
     "expected": [
      "Education",
      "11-50",
      243,
      123,
      1028400.2
     ],
     "actual": [
      "Education",
      "11-50",
      260,
      132,
      1104193.29
     ]
    },
    {
     "row": 10,
     "expected": [
      "Education",
      "51-200",
      173,
      97,
      1054681.6
     ],
     "actual": [
      "Education",
      "51-200",
      185,
      104,
      1132411.63
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-agg-002": {
  "id": "saas-agg-002",
  "dataset": "saas",
  "scenario": "agg",
  "chain": "saas-agg-chain-a",
  "chain_step": 2,
  "title": "应收账款月度回收率与平均回款天数",
  "business_prompt": "财务要账期健康度：“按开票月份统计发票数、开票金额、已回款金额、回收率，\n 再加一个已回款发票的平均回款天数（回款日 - 开票日）。”",
  "context_notes": [
   "回收率 = 已回款金额 / 开票金额，保留 4 位小数",
   "平均回款天数只对 paid = TRUE 的发票计算，未回款的不参与平均",
   "金额保留 2 位小数，天数保留 2 位小数"
  ],
  "tables": [
   "invoices"
  ],
  "expected_columns": [
   {
    "name": "ym",
    "type": "string"
   },
   {
    "name": "invoice_cnt",
    "type": "int"
   },
   {
    "name": "billed_amount",
    "type": "decimal"
   },
   {
    "name": "paid_amount",
    "type": "decimal"
   },
   {
    "name": "collect_rate",
    "type": "decimal"
   },
   {
    "name": "avg_pay_days",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "已回款金额用 SUM(CASE WHEN paid THEN amount ELSE 0 END)。",
   "平均回款天数用 AVG(CASE WHEN paid THEN DATEDIFF(pay_date, bill_date) END)，不写 ELSE。",
   "AVG 会自动跳过 NULL，所以“不写 ELSE”正好实现“只对已回款求平均”。"
  ],
  "reference_sql": "SELECT DATE_FORMAT(bill_date, '%Y-%m') AS ym,\n       COUNT(*) AS invoice_cnt,\n       ROUND(SUM(amount), 2) AS billed_amount,\n       ROUND(SUM(CASE WHEN paid THEN amount ELSE 0 END), 2) AS paid_amount,\n       ROUND(SUM(CASE WHEN paid THEN amount ELSE 0 END)\n           / NULLIF(SUM(amount), 0), 4) AS collect_rate,\n       ROUND(AVG(CASE WHEN paid THEN DATEDIFF(pay_date, bill_date) END), 2) AS avg_pay_days\nFROM invoices\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "SELECT DATE_FORMAT(bill_date, '%Y-%m') AS ym,\n       COUNT(invoice_id) AS invoice_cnt,\n       ROUND(SUM(amount), 2) AS billed_amount,\n       ROUND(COALESCE(SUM(CASE WHEN paid THEN amount END), 0), 2) AS paid_amount,\n       ROUND(COALESCE(SUM(CASE WHEN paid THEN amount END), 0)\n           / NULLIF(SUM(amount), 0), 4) AS collect_rate,\n       ROUND(SUM(CASE WHEN paid THEN DATEDIFF(pay_date, bill_date) END) * 1.0\n           / NULLIF(SUM(CASE WHEN paid THEN 1 ELSE 0 END), 0), 2) AS avg_pay_days\nFROM invoices\nGROUP BY 1\nORDER BY 1;"
  ],
  "explanation": "1. “分母全量、分子部分”是比率类指标的通用结构，靠条件聚合区分。\n2. AVG(CASE WHEN 条件 THEN 值 END) 天然只对满足条件的行求平均——这是 NULL 语义的红利。\n3. 手写 SUM/COUNT 版平均值时，分母必须是“条件成立的行数”，不能是 COUNT(*)。",
  "pitfalls": [
   "平均回款天数写成 AVG(CASE WHEN paid THEN ... ELSE 0 END)，未回款按 0 天拉低均值",
   "DATEDIFF 参数顺序写反，得到负数天数",
   "回收率分母误用已回款笔数而不是开票金额"
  ],
  "capability_points": [
   "agg.conditional_agg",
   "agg.avg_null_semantics",
   "agg.safe_div",
   "agg.date_diff"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 3.8,
   "columns": [
    "ym",
    "invoice_cnt",
    "billed_amount",
    "paid_amount",
    "collect_rate",
    "avg_pay_days"
   ],
   "rows": [
    [
     "2024-01",
     1335,
     3353406.11,
     3027878.59,
     0.9029,
     5.0
    ],
    [
     "2024-02",
     1134,
     2920890.94,
     2657118.41,
     0.9097,
     5.03
    ],
    [
     "2024-03",
     1298,
     3379683.7,
     3090447.09,
     0.9144,
     4.97
    ],
    [
     "2024-04",
     1147,
     2824310.49,
     2522473.64,
     0.8931,
     5.0
    ],
    [
     "2024-05",
     1230,
     3082080.23,
     2788754.89,
     0.9048,
     5.09
    ],
    [
     "2024-06",
     1246,
     4133190.14,
     3813322.65,
     0.9226,
     5.06
    ],
    [
     "2024-07",
     1278,
     3222816.36,
     2909802.83,
     0.9029,
     4.96
    ],
    [
     "2024-08",
     1305,
     3367771.04,
     3060481.69,
     0.9088,
     5.03
    ],
    [
     "2024-09",
     1276,
     3220655.43,
     2822395.54,
     0.8763,
     4.94
    ],
    [
     "2024-10",
     1269,
     3229431.33,
     2865518.7,
     0.8873,
     4.82
    ],
    [
     "2024-11",
     1203,
     3019771.04,
     2736625.15,
     0.9062,
     5.01
    ],
    [
     "2024-12",
     1249,
     3089343.7,
     2703422.48,
     0.8751,
     5.0
    ],
    [
     "2025-01",
     1234,
     3120186.32,
     2822183.76,
     0.9045,
     4.98
    ],
    [
     "2025-02",
     1185,
     2905062.71,
     2639361.17,
     0.9085,
     4.96
    ],
    [
     "2025-03",
     1332,
     3310303.67,
     2961807.13,
     0.8947,
     4.99
    ]
   ],
   "row_count": 24,
   "translated_sql": "SELECT strftime(bill_date, '%Y-%m') AS ym,\n       COUNT(*) AS invoice_cnt,\n       ROUND(SUM(amount), 2) AS billed_amount,\n       ROUND(SUM(CASE WHEN paid THEN amount ELSE 0 END), 2) AS paid_amount,\n       ROUND(SUM(CASE WHEN paid THEN amount ELSE 0 END)\n           / NULLIF(SUM(amount), 0), 4) AS collect_rate,\n       ROUND(AVG(CASE WHEN paid THEN date_diff('day', bill_date, pay_date) END), 2) AS avg_pay_days\nFROM invoices\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "invoices"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "COUNT(",
     "AVG(",
     "DATEDIFF",
     "DATE_FORMAT",
     "NULLIF",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "2024-01",
     1335,
     3353406.11,
     3027878.59,
     0.9029,
     5.0
    ],
    [
     "2024-02",
     1208,
     3113669.74,
     2832488.23,
     0.97,
     5.36
    ],
    [
     "2024-03",
     1298,
     3379683.7,
     3090447.09,
     0.9144,
     4.97
    ],
    [
     "2024-04",
     1222,
     3010714.98,
     2688956.9,
     0.95,
     5.33
    ],
    [
     "2024-05",
     1230,
     3082080.23,
     2788754.89,
     0.9048,
     5.09
    ],
    [
     "2024-06",
     1328,
     4405980.69,
     4065001.94,
     0.98,
     5.39
    ],
    [
     "2024-07",
     1278,
     3222816.36,
     2909802.83,
     0.9029,
     4.96
    ],
    [
     "2024-08",
     1391,
     3590043.93,
     3262473.48,
     0.97,
     5.36
    ],
    [
     "2024-09",
     1276,
     3220655.43,
     2822395.54,
     0.8763,
     4.94
    ],
    [
     "2024-10",
     1352,
     3442573.8,
     3054642.93,
     0.95,
     5.14
    ],
    [
     "2024-11",
     1203,
     3019771.04,
     2736625.15,
     0.9062,
     5.01
    ],
    [
     "2024-12",
     1331,
     3293240.38,
     2881848.36,
     0.93,
     5.33
    ],
    [
     "2025-01",
     1234,
     3120186.32,
     2822183.76,
     0.9045,
     4.98
    ],
    [
     "2025-02",
     1263,
     3096796.85,
     2813559.01,
     0.97,
     5.29
    ]
   ],
   "actual_row_count": 23,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2024-02",
      1134,
      2920890.94,
      2657118.41,
      0.9097,
      5.03
     ],
     "actual": [
      "2024-02",
      1208,
      3113669.74,
      2832488.23,
      0.97,
      5.36
     ]
    },
    {
     "row": 4,
     "expected": [
      "2024-04",
      1147,
      2824310.49,
      2522473.64,
      0.8931,
      5.0
     ],
     "actual": [
      "2024-04",
      1222,
      3010714.98,
      2688956.9,
      0.95,
      5.33
     ]
    },
    {
     "row": 6,
     "expected": [
      "2024-06",
      1246,
      4133190.14,
      3813322.65,
      0.9226,
      5.06
     ],
     "actual": [
      "2024-06",
      1328,
      4405980.69,
      4065001.94,
      0.98,
      5.39
     ]
    },
    {
     "row": 8,
     "expected": [
      "2024-08",
      1305,
      3367771.04,
      3060481.69,
      0.9088,
      5.03
     ],
     "actual": [
      "2024-08",
      1391,
      3590043.93,
      3262473.48,
      0.97,
      5.36
     ]
    },
    {
     "row": 10,
     "expected": [
      "2024-10",
      1269,
      3229431.33,
      2865518.7,
      0.8873,
      4.82
     ],
     "actual": [
      "2024-10",
      1352,
      3442573.8,
      3054642.93,
      0.95,
      5.14
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-funnel-001": {
  "id": "saas-funnel-001",
  "dataset": "saas",
  "scenario": "funnel",
  "chain": "saas-funnel-chain-a",
  "chain_step": 1,
  "title": "获客漏斗 注册→试用→转化→回款",
  "business_prompt": "增长要端到端漏斗：“统计四步账号数——注册、开始试用、试用转化、\n 转化后产生过已回款发票。每一步都必须是走通了前面所有步的账号。”",
  "context_notes": [
   "注册 = accounts 全量；试用 = trial_conversion 有记录；转化 = converted 为真",
   "回款 = invoices 中存在 paid = TRUE 的发票",
   "第 4 步的口径是“已转化 且 有回款”，不是“有回款”"
  ],
  "tables": [
   "accounts",
   "trial_conversion",
   "invoices"
  ],
  "expected_columns": [
   {
    "name": "step_no",
    "type": "int"
   },
   {
    "name": "step_name",
    "type": "string"
   },
   {
    "name": "account_cnt",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "union\\s+all",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "先给每个账号打三个标记位（是否试用 / 是否转化 / 是否有回款）。",
   "打标时全部用 LEFT JOIN，否则账号会在第一步就被过滤掉。",
   "后面每一步的条件都要包含前面所有步，漏斗才单调递减。"
  ],
  "reference_sql": "WITH paid_acc AS (\n    SELECT DISTINCT account_id\n    FROM invoices\n    WHERE paid\n),\nbase AS (\n    SELECT a.account_id,\n           CASE WHEN tc.account_id IS NOT NULL THEN 1 ELSE 0 END AS s2,\n           CASE WHEN tc.converted THEN 1 ELSE 0 END AS s3,\n           CASE WHEN p.account_id IS NOT NULL THEN 1 ELSE 0 END AS s4\n    FROM accounts a\n    LEFT JOIN trial_conversion tc ON tc.account_id = a.account_id\n    LEFT JOIN paid_acc p          ON p.account_id  = a.account_id\n)\nSELECT 1 AS step_no, 'signup' AS step_name, COUNT(*) AS account_cnt FROM base\nUNION ALL\nSELECT 2, 'trial_start', SUM(s2) FROM base\nUNION ALL\nSELECT 3, 'trial_convert', SUM(CASE WHEN s2 = 1 AND s3 = 1 THEN 1 ELSE 0 END) FROM base\nUNION ALL\nSELECT 4, 'paid_invoice', SUM(CASE WHEN s2 = 1 AND s3 = 1 AND s4 = 1 THEN 1 ELSE 0 END) FROM base\nORDER BY step_no;",
  "alt_solutions": [
   "WITH base AS (\n    SELECT a.account_id,\n           CASE WHEN tc.account_id IS NOT NULL THEN 1 ELSE 0 END AS s2,\n           CASE WHEN tc.converted THEN 1 ELSE 0 END AS s3,\n           CASE WHEN EXISTS (\n               SELECT 1 FROM invoices i\n               WHERE i.account_id = a.account_id AND i.paid\n           ) THEN 1 ELSE 0 END AS s4\n    FROM accounts a\n    LEFT JOIN trial_conversion tc ON tc.account_id = a.account_id\n)\nSELECT 1 AS step_no, 'signup' AS step_name, COUNT(account_id) AS account_cnt FROM base\nUNION ALL\nSELECT 2, 'trial_start',   SUM(s2) FROM base\nUNION ALL\nSELECT 3, 'trial_convert', SUM(s2 * s3) FROM base\nUNION ALL\nSELECT 4, 'paid_invoice',  SUM(s2 * s3 * s4) FROM base\nORDER BY step_no;"
  ],
  "explanation": "1. B 端漏斗的主体是账号，先“打标”再“逐层收窄”是最清晰的写法。\n2. 标记位相乘（alt 写法）等价于条件层层 AND，代码更短。\n3. EXISTS 子查询与 DISTINCT + LEFT JOIN 等价，前者在大表上通常更快。",
  "pitfalls": [
   "第 4 步只判断“有回款”，没继承前三步，出现漏斗回升",
   "用 INNER JOIN trial_conversion，第 1 步的注册数直接变成试用数",
   "CASE WHEN tc.converted 忘了处理 NULL（无试用记录时为 NULL），靠 ELSE 0 兜住"
  ],
  "capability_points": [
   "funnel.ordered",
   "funnel.flag_then_narrow",
   "funnel.monotonic",
   "agg.left_join_preserve"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 4.0,
   "columns": [
    "step_no",
    "step_name",
    "account_cnt"
   ],
   "rows": [
    [
     1,
     "signup",
     5000
    ],
    [
     2,
     "trial_start",
     5000
    ],
    [
     3,
     "trial_convert",
     2042
    ],
    [
     4,
     "paid_invoice",
     2033
    ]
   ],
   "row_count": 4,
   "translated_sql": "WITH paid_acc AS (\n    SELECT DISTINCT account_id\n    FROM invoices\n    WHERE paid\n),\nbase AS (\n    SELECT a.account_id,\n           CASE WHEN tc.account_id IS NOT NULL THEN 1 ELSE 0 END AS s2,\n           CASE WHEN tc.converted THEN 1 ELSE 0 END AS s3,\n           CASE WHEN p.account_id IS NOT NULL THEN 1 ELSE 0 END AS s4\n    FROM accounts a\n    LEFT JOIN trial_conversion tc ON tc.account_id = a.account_id\n    LEFT JOIN paid_acc p          ON p.account_id  = a.account_id\n)\nSELECT 1 AS step_no, 'signup' AS step_name, COUNT(*) AS account_cnt FROM base\nUNION ALL\nSELECT 2, 'trial_start', SUM(s2) FROM base\nUNION ALL\nSELECT 3, 'trial_convert', SUM(CASE WHEN s2 = 1 AND s3 = 1 THEN 1 ELSE 0 END) FROM base\nUNION ALL\nSELECT 4, 'paid_invoice', SUM(CASE WHEN s2 = 1 AND s3 = 1 AND s4 = 1 THEN 1 ELSE 0 END) FROM base\nORDER BY step_no;",
   "signature": {
    "tables": [
     "accounts",
     "trial_conversion",
     "invoices"
    ],
    "keywords": [
     "UNION ALL",
     "CASE WHEN",
     "SUM(",
     "COUNT(",
     "LEFT JOIN",
     "JOIN",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "signup",
     5000
    ],
    [
     2,
     "trial_start",
     5667
    ],
    [
     3,
     "trial_convert",
     2042
    ],
    [
     4,
     "paid_invoice",
     2304
    ]
   ],
   "actual_row_count": 3,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      "trial_start",
      5000
     ],
     "actual": [
      2,
      "trial_start",
      5667
     ]
    },
    {
     "row": 4,
     "expected": [
      4,
      "paid_invoice",
      2033
     ],
     "actual": [
      4,
      "paid_invoice",
      2304
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-funnel-002": {
  "id": "saas-funnel-002",
  "dataset": "saas",
  "scenario": "funnel",
  "chain": "saas-funnel-chain-a",
  "chain_step": 2,
  "title": "功能使用有序漏斗 dashboard→report→export",
  "business_prompt": "产品要看深度使用路径：“2025 年，账号必须先用过 dashboard、再用过 report、\n 最后用过 export，时间严格往后走才算走通。给我三步的账号数\n 以及每一步相对上一步的转化率。”",
  "context_notes": [
   "主体是账号；每步时间取该账号该功能的最早使用时间 MIN(use_time)",
   "严格递增：t2 > t1，t3 > t2",
   "第 1 步的 conv_rate 为 NULL"
  ],
  "tables": [
   "feature_usage"
  ],
  "expected_columns": [
   {
    "name": "step_no",
    "type": "int"
   },
   {
    "name": "step_name",
    "type": "string"
   },
   {
    "name": "account_cnt",
    "type": "int"
   },
   {
    "name": "conv_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\bover\\s*\\(",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "第一步压平：GROUP BY account_id，三个条件 MIN(use_time)。",
   "第二步用 UNION ALL 造出三行 (step_no, step_name, account_cnt)。",
   "第三步在这张三行小表上 LAG(account_cnt) OVER (ORDER BY step_no) 算转化率。"
  ],
  "reference_sql": "WITH acc AS (\n    SELECT account_id,\n           MIN(CASE WHEN feature_code = 'dashboard' THEN use_time END) AS t1,\n           MIN(CASE WHEN feature_code = 'report'    THEN use_time END) AS t2,\n           MIN(CASE WHEN feature_code = 'export'    THEN use_time END) AS t3\n    FROM feature_usage\n    WHERE use_time >= '2025-01-01'\n      AND use_time <  '2026-01-01'\n    GROUP BY account_id\n),\nsteps AS (\n    SELECT 1 AS step_no, 'dashboard' AS step_name, COUNT(*) AS account_cnt\n    FROM acc WHERE t1 IS NOT NULL\n    UNION ALL\n    SELECT 2, 'report', COUNT(*)\n    FROM acc WHERE t1 IS NOT NULL AND t2 > t1\n    UNION ALL\n    SELECT 3, 'export', COUNT(*)\n    FROM acc WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2\n)\nSELECT step_no,\n       step_name,\n       account_cnt,\n       ROUND(account_cnt * 1.0\n           / NULLIF(LAG(account_cnt) OVER (ORDER BY step_no), 0), 4) AS conv_rate\nFROM steps\nORDER BY step_no;",
  "alt_solutions": [
   "WITH acc AS (\n    SELECT account_id,\n           MIN(CASE WHEN feature_code = 'dashboard' THEN use_time END) AS t1,\n           MIN(CASE WHEN feature_code = 'report'    THEN use_time END) AS t2,\n           MIN(CASE WHEN feature_code = 'export'    THEN use_time END) AS t3\n    FROM feature_usage\n    WHERE use_time >= '2025-01-01' AND use_time < '2026-01-01'\n    GROUP BY account_id\n),\nflag AS (\n    SELECT CASE WHEN t1 IS NOT NULL THEN 1 ELSE 0 END AS s1,\n           CASE WHEN t1 IS NOT NULL AND t2 > t1 THEN 1 ELSE 0 END AS s2,\n           CASE WHEN t1 IS NOT NULL AND t2 > t1 AND t3 > t2 THEN 1 ELSE 0 END AS s3\n    FROM acc\n),\nsteps AS (\n    SELECT 1 AS step_no, 'dashboard' AS step_name, SUM(s1) AS account_cnt FROM flag\n    UNION ALL SELECT 2, 'report', SUM(s2) FROM flag\n    UNION ALL SELECT 3, 'export', SUM(s3) FROM flag\n),\nw AS (\n    SELECT step_no, step_name, account_cnt,\n           LAG(account_cnt) OVER (ORDER BY step_no) AS prev_cnt\n    FROM steps\n)\nSELECT step_no, step_name, account_cnt,\n       ROUND(account_cnt * 1.0 / NULLIF(prev_cnt, 0), 4) AS conv_rate\nFROM w\nORDER BY step_no;"
  ],
  "explanation": "1. 有序漏斗 + 转化率 = 压平 → 逐层收窄 → 小表上开窗，三段式非常稳定。\n2. 在只有 3 行的小表上用窗口函数，代价可以忽略，可读性远好于自连接。\n3. 时间比较用严格大于，等于视为“同时发生”，不构成先后关系。",
  "pitfalls": [
   "用 >= 比较时间，同一秒内批量写入的日志被误判为有先后",
   "三步各自独立统计（不继承前置条件），转化率可能大于 1",
   "忘记时间范围过滤，2024 年的使用记录混进 2025 年的漏斗"
  ],
  "capability_points": [
   "funnel.ordered",
   "funnel.flatten",
   "funnel.conv_rate",
   "window.lag"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 8.6,
   "columns": [
    "step_no",
    "step_name",
    "account_cnt",
    "conv_rate"
   ],
   "rows": [
    [
     1,
     "dashboard",
     4996,
     null
    ],
    [
     2,
     "report",
     2532,
     0.5068
    ],
    [
     3,
     "export",
     862,
     0.3404
    ]
   ],
   "row_count": 3,
   "translated_sql": "WITH acc AS (\n    SELECT account_id,\n           MIN(CASE WHEN feature_code = 'dashboard' THEN use_time END) AS t1,\n           MIN(CASE WHEN feature_code = 'report'    THEN use_time END) AS t2,\n           MIN(CASE WHEN feature_code = 'export'    THEN use_time END) AS t3\n    FROM feature_usage\n    WHERE use_time >= '2025-01-01'\n      AND use_time <  '2026-01-01'\n    GROUP BY account_id\n),\nsteps AS (\n    SELECT 1 AS step_no, 'dashboard' AS step_name, COUNT(*) AS account_cnt\n    FROM acc WHERE t1 IS NOT NULL\n    UNION ALL\n    SELECT 2, 'report', COUNT(*)\n    FROM acc WHERE t1 IS NOT NULL AND t2 > t1\n    UNION ALL\n    SELECT 3, 'export', COUNT(*)\n    FROM acc WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2\n)\nSELECT step_no,\n       step_name,\n       account_cnt,\n       ROUND(account_cnt * 1.0\n           / NULLIF(LAG(account_cnt) OVER (ORDER BY step_no), 0), 4) AS conv_rate\nFROM steps\nORDER BY step_no;",
   "signature": {
    "tables": [
     "feature_usage"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "UNION ALL",
     "CASE WHEN",
     "COUNT(",
     "MIN(",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "dashboard",
     4996,
     null
    ],
    [
     2,
     "report",
     2894,
     0.58
    ],
    [
     3,
     "export",
     862,
     0.3404
    ]
   ],
   "actual_row_count": 2,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      "report",
      2532,
      0.5068
     ],
     "actual": [
      2,
      "report",
      2894,
      0.58
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-growth-001": {
  "id": "saas-growth-001",
  "dataset": "saas",
  "scenario": "growth",
  "chain": "saas-growth-chain-a",
  "chain_step": 1,
  "title": "新签 MRR 月度环比",
  "business_prompt": "收入例会：“按订阅开始月统计新签 MRR（该月新开订阅的 mrr 合计），\n 给出上月值和环比增长率，按月份升序。”",
  "context_notes": [
   "新签 MRR = 该月 start_date 落在其中的所有订阅的 mrr 之和（不区分状态）",
   "金额保留 2 位小数，环比保留 4 位小数",
   "首月无上月，prev_mrr 与 mom_rate 为 NULL"
  ],
  "tables": [
   "subscriptions"
  ],
  "expected_columns": [
   {
    "name": "ym",
    "type": "string"
   },
   {
    "name": "new_mrr",
    "type": "decimal"
   },
   {
    "name": "prev_mrr",
    "type": "decimal"
   },
   {
    "name": "mom_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "先聚合月表，再 LAG，这个套路对所有环比题都适用。",
   "注意 ROUND 的位置：先 ROUND 成 2 位再 LAG，和先 LAG 再 ROUND，结果可能差一分钱。",
   "本题要求 new_mrr 与 prev_mrr 都是 2 位小数，环比基于 2 位小数的值计算。"
  ],
  "reference_sql": "WITH monthly AS (\n    SELECT DATE_FORMAT(start_date, '%Y-%m') AS ym,\n           ROUND(SUM(mrr), 2) AS new_mrr\n    FROM subscriptions\n    GROUP BY 1\n)\nSELECT ym,\n       new_mrr,\n       LAG(new_mrr) OVER (ORDER BY ym) AS prev_mrr,\n       ROUND((new_mrr - LAG(new_mrr) OVER (ORDER BY ym))\n           / NULLIF(LAG(new_mrr) OVER (ORDER BY ym), 0), 4) AS mom_rate\nFROM monthly\nORDER BY ym;",
  "alt_solutions": [
   "WITH monthly AS (\n    SELECT DATE_FORMAT(start_date, '%Y-%m') AS ym,\n           ROUND(SUM(mrr), 2) AS new_mrr\n    FROM subscriptions\n    GROUP BY 1\n),\nw AS (\n    SELECT ym, new_mrr,\n           LAG(new_mrr) OVER (ORDER BY ym) AS prev_mrr\n    FROM monthly\n)\nSELECT ym, new_mrr, prev_mrr,\n       ROUND((new_mrr - prev_mrr) / NULLIF(prev_mrr, 0), 4) AS mom_rate\nFROM w\nORDER BY ym;"
  ],
  "explanation": "1. 环比三件套：月表 → LAG 取基期 → 安全除法。换数据集也不变。\n2. 舍入时机会影响最终小数位，团队内要统一约定（本题在聚合层就 ROUND）。\n3. 把 LAG 结果落成中间列，可读性和可维护性都更好。",
  "pitfalls": [
   "在 SELECT 里写三遍 LAG，改口径时漏改其中一处",
   "忘记 NULLIF，某月新签为 0 时除零报错",
   "ROUND 时机不统一，与财务口径对不上分位"
  ],
  "capability_points": [
   "growth.mom",
   "window.lag",
   "growth.safe_div",
   "growth.rounding"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 2.5,
   "columns": [
    "ym",
    "new_mrr",
    "prev_mrr",
    "mom_rate"
   ],
   "rows": [
    [
     "2024-01",
     1144916.1,
     null,
     null
    ],
    [
     "2024-02",
     1663217.6,
     1144916.1,
     0.4527
    ],
    [
     "2024-03",
     2358854.5,
     1663217.6,
     0.4182
    ],
    [
     "2024-04",
     1999029.9,
     2358854.5,
     -0.1525
    ],
    [
     "2024-05",
     1773198.1,
     1999029.9,
     -0.113
    ],
    [
     "2024-06",
     1334162.1,
     1773198.1,
     -0.2476
    ],
    [
     "2024-07",
     2758113.5,
     1334162.1,
     1.0673
    ],
    [
     "2024-08",
     2231205.3,
     2758113.5,
     -0.191
    ],
    [
     "2024-09",
     1408051.5,
     2231205.3,
     -0.3689
    ],
    [
     "2024-10",
     1505034.5,
     1408051.5,
     0.0689
    ],
    [
     "2024-11",
     2216801.7,
     1505034.5,
     0.4729
    ],
    [
     "2024-12",
     2159385.3,
     2216801.7,
     -0.0259
    ],
    [
     "2025-01",
     1785152.1,
     2159385.3,
     -0.1733
    ],
    [
     "2025-02",
     2126062.3,
     1785152.1,
     0.191
    ],
    [
     "2025-03",
     1919509.0,
     2126062.3,
     -0.0972
    ]
   ],
   "row_count": 24,
   "translated_sql": "WITH monthly AS (\n    SELECT strftime(start_date, '%Y-%m') AS ym,\n           ROUND(SUM(mrr), 2) AS new_mrr\n    FROM subscriptions\n    GROUP BY 1\n)\nSELECT ym,\n       new_mrr,\n       LAG(new_mrr) OVER (ORDER BY ym) AS prev_mrr,\n       ROUND((new_mrr - LAG(new_mrr) OVER (ORDER BY ym))\n           / NULLIF(LAG(new_mrr) OVER (ORDER BY ym), 0), 4) AS mom_rate\nFROM monthly\nORDER BY ym;",
   "signature": {
    "tables": [
     "subscriptions"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "SUM(",
     "DATE_FORMAT",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "2024-01",
     1144916.1,
     null,
     null
    ],
    [
     "2024-02",
     1895402.78,
     1304746.39,
     0.52
    ],
    [
     "2024-03",
     2358854.5,
     1663217.6,
     0.4182
    ],
    [
     "2024-04",
     2278094.47,
     2688150.59,
     -0.17
    ],
    [
     "2024-05",
     1773198.1,
     1999029.9,
     -0.113
    ],
    [
     "2024-06",
     1520411.13,
     2020736.55,
     -0.28
    ],
    [
     "2024-07",
     2758113.5,
     1334162.1,
     1.0673
    ],
    [
     "2024-08",
     2542681.56,
     3143146.14,
     -0.22
    ],
    [
     "2024-09",
     1408051.5,
     2231205.3,
     -0.3689
    ],
    [
     "2024-10",
     1715137.32,
     1604615.49,
     0.08
    ],
    [
     "2024-11",
     2216801.7,
     1505034.5,
     0.4729
    ],
    [
     "2024-12",
     2460835.49,
     2526267.22,
     -0.03
    ],
    [
     "2025-01",
     1785152.1,
     2159385.3,
     -0.1733
    ],
    [
     "2025-02",
     2422860.6,
     2034359.33,
     0.22
    ]
   ],
   "actual_row_count": 23,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2024-02",
      1663217.6,
      1144916.1,
      0.4527
     ],
     "actual": [
      "2024-02",
      1895402.78,
      1304746.39,
      0.52
     ]
    },
    {
     "row": 4,
     "expected": [
      "2024-04",
      1999029.9,
      2358854.5,
      -0.1525
     ],
     "actual": [
      "2024-04",
      2278094.47,
      2688150.59,
      -0.17
     ]
    },
    {
     "row": 6,
     "expected": [
      "2024-06",
      1334162.1,
      1773198.1,
      -0.2476
     ],
     "actual": [
      "2024-06",
      1520411.13,
      2020736.55,
      -0.28
     ]
    },
    {
     "row": 8,
     "expected": [
      "2024-08",
      2231205.3,
      2758113.5,
      -0.191
     ],
     "actual": [
      "2024-08",
      2542681.56,
      3143146.14,
      -0.22
     ]
    },
    {
     "row": 10,
     "expected": [
      "2024-10",
      1505034.5,
      1408051.5,
      0.0689
     ],
     "actual": [
      "2024-10",
      1715137.32,
      1604615.49,
      0.08
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-growth-002": {
  "id": "saas-growth-002",
  "dataset": "saas",
  "scenario": "growth",
  "chain": "saas-growth-chain-a",
  "chain_step": 2,
  "title": "周粒度开票金额环比（借助日期维表）",
  "business_prompt": "财务要更细的节奏：“2025 年按『周』统计开票金额和开票笔数，\n 再给出上一周金额和周环比。周的定义直接用日期维表里的 w 字段，别自己算。”",
  "context_notes": [
   "dim_date.w 是年周序号（形如 202501），已经处理好跨年问题",
   "开票日 invoices.bill_date 关联 dim_date.date_key",
   "金额保留 2 位小数，环比保留 4 位小数；首周环比为 NULL"
  ],
  "tables": [
   "invoices",
   "dim_date"
  ],
  "expected_columns": [
   {
    "name": "week_key",
    "type": "int"
   },
   {
    "name": "invoice_cnt",
    "type": "int"
   },
   {
    "name": "billed_amount",
    "type": "decimal"
   },
   {
    "name": "prev_billed",
    "type": "decimal"
   },
   {
    "name": "wow_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 200,
  "constraints": {
   "must_match": [
    {
     "pattern": "dim_date",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "JOIN dim_date ON date_key = bill_date，直接取 d.w 当分组键。",
   "环比还是 LAG，只不过排序键从月变成了周序号。",
   "周序号是整数，字典序即时间序，可以放心 ORDER BY。"
  ],
  "reference_sql": "WITH weekly AS (\n    SELECT d.w AS week_key,\n           COUNT(*) AS invoice_cnt,\n           ROUND(SUM(i.amount), 2) AS billed_amount\n    FROM invoices i\n    JOIN dim_date d ON d.date_key = i.bill_date\n    WHERE i.bill_date >= '2025-01-01'\n      AND i.bill_date <  '2026-01-01'\n    GROUP BY d.w\n)\nSELECT week_key,\n       invoice_cnt,\n       billed_amount,\n       LAG(billed_amount) OVER (ORDER BY week_key) AS prev_billed,\n       ROUND((billed_amount - LAG(billed_amount) OVER (ORDER BY week_key))\n           / NULLIF(LAG(billed_amount) OVER (ORDER BY week_key), 0), 4) AS wow_rate\nFROM weekly\nORDER BY week_key;",
  "alt_solutions": [
   "WITH weekly AS (\n    SELECT d.w AS week_key,\n           COUNT(i.invoice_id) AS invoice_cnt,\n           ROUND(SUM(i.amount), 2) AS billed_amount\n    FROM dim_date d\n    JOIN invoices i ON i.bill_date = d.date_key\n    WHERE d.date_key >= '2025-01-01' AND d.date_key < '2026-01-01'\n    GROUP BY d.w\n),\nw AS (\n    SELECT week_key, invoice_cnt, billed_amount,\n           LAG(billed_amount) OVER (ORDER BY week_key) AS prev_billed\n    FROM weekly\n)\nSELECT week_key, invoice_cnt, billed_amount, prev_billed,\n       ROUND((billed_amount - prev_billed) / NULLIF(prev_billed, 0), 4) AS wow_rate\nFROM w\nORDER BY week_key;"
  ],
  "explanation": "1. 周粒度最容易踩坑（周一/周日起算、跨年周归属），交给日期维表统一定义最稳。\n2. 环比的实现与月环比完全同构，只是排序键换成周序号。\n3. 事实表与日期维表 JOIN 是 BI 建模的标准动作，值得形成肌肉记忆。",
  "pitfalls": [
   "用 WEEK()/YEARWEEK() 自己算周，不同 mode 参数结果不一致",
   "跨年周被拆成两半，12 月最后一周和 1 月第一周对不上",
   "用 LEFT JOIN dim_date 但把 invoices 放主表，日期轴补全的意义就没了"
  ],
  "capability_points": [
   "growth.wow",
   "growth.date_spine",
   "window.lag",
   "growth.safe_div"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 2.2,
   "columns": [
    "week_key",
    "invoice_cnt",
    "billed_amount",
    "prev_billed",
    "wow_rate"
   ],
   "rows": [
    [
     202501,
     169,
     404984.07,
     null,
     null
    ],
    [
     202502,
     319,
     825907.89,
     404984.07,
     1.0394
    ],
    [
     202503,
     264,
     683516.67,
     825907.89,
     -0.1724
    ],
    [
     202504,
     280,
     732944.98,
     683516.67,
     0.0723
    ],
    [
     202505,
     288,
     692455.2,
     732944.98,
     -0.0552
    ],
    [
     202506,
     309,
     729083.28,
     692455.2,
     0.0529
    ],
    [
     202507,
     305,
     751396.44,
     729083.28,
     0.0306
    ],
    [
     202508,
     279,
     691432.94,
     751396.44,
     -0.0798
    ],
    [
     202509,
     310,
     773161.72,
     691432.94,
     0.1182
    ],
    [
     202510,
     320,
     763579.68,
     773161.72,
     -0.0124
    ],
    [
     202511,
     293,
     727076.48,
     763579.68,
     -0.0478
    ],
    [
     202512,
     294,
     751206.06,
     727076.48,
     0.0332
    ],
    [
     202513,
     278,
     683385.34,
     751206.06,
     -0.0903
    ],
    [
     202514,
     305,
     813207.96,
     683385.34,
     0.19
    ],
    [
     202515,
     270,
     693787.53,
     813207.96,
     -0.1469
    ]
   ],
   "row_count": 53,
   "translated_sql": "WITH weekly AS (\n    SELECT d.w AS week_key,\n           COUNT(*) AS invoice_cnt,\n           ROUND(SUM(i.amount), 2) AS billed_amount\n    FROM invoices i\n    JOIN dim_date d ON d.date_key = i.bill_date\n    WHERE i.bill_date >= '2025-01-01'\n      AND i.bill_date <  '2026-01-01'\n    GROUP BY d.w\n)\nSELECT week_key,\n       invoice_cnt,\n       billed_amount,\n       LAG(billed_amount) OVER (ORDER BY week_key) AS prev_billed,\n       ROUND((billed_amount - LAG(billed_amount) OVER (ORDER BY week_key))\n           / NULLIF(LAG(billed_amount) OVER (ORDER BY week_key), 0), 4) AS wow_rate\nFROM weekly\nORDER BY week_key;",
   "signature": {
    "tables": [
     "invoices",
     "dim_date"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "SUM(",
     "COUNT(",
     "JOIN",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     202501,
     169,
     404984.07,
     null,
     null
    ],
    [
     223238,
     351,
     910480.86,
     446454.44,
     1.15
    ],
    [
     202503,
     264,
     683516.67,
     825907.89,
     -0.1724
    ],
    [
     223240,
     308,
     807998.55,
     753508.78,
     0.08
    ],
    [
     202505,
     288,
     692455.2,
     732944.98,
     -0.0552
    ],
    [
     223242,
     340,
     803741.41,
     763362.61,
     0.06
    ],
    [
     202507,
     305,
     751396.44,
     729083.28,
     0.0306
    ],
    [
     223244,
     307,
     762235.67,
     828339.44,
     -0.09
    ],
    [
     202509,
     310,
     773161.72,
     691432.94,
     0.1182
    ],
    [
     223247,
     352,
     841770.24,
     852333.48,
     -0.01
    ],
    [
     202511,
     293,
     727076.48,
     763579.68,
     -0.0478
    ],
    [
     223249,
     324,
     828129.56,
     801529.11,
     0.04
    ],
    [
     202513,
     278,
     683385.34,
     751206.06,
     -0.0903
    ],
    [
     223251,
     336,
     896480.46,
     753364.0,
     0.21
    ]
   ],
   "actual_row_count": 52,
   "diff": [
    {
     "row": 2,
     "expected": [
      202502,
      319,
      825907.89,
      404984.07,
      1.0394
     ],
     "actual": [
      223238,
      351,
      910480.86,
      446454.44,
      1.15
     ]
    },
    {
     "row": 4,
     "expected": [
      202504,
      280,
      732944.98,
      683516.67,
      0.0723
     ],
     "actual": [
      223240,
      308,
      807998.55,
      753508.78,
      0.08
     ]
    },
    {
     "row": 6,
     "expected": [
      202506,
      309,
      729083.28,
      692455.2,
      0.0529
     ],
     "actual": [
      223242,
      340,
      803741.41,
      763362.61,
      0.06
     ]
    },
    {
     "row": 8,
     "expected": [
      202508,
      279,
      691432.94,
      751396.44,
      -0.0798
     ],
     "actual": [
      223244,
      307,
      762235.67,
      828339.44,
      -0.09
     ]
    },
    {
     "row": 10,
     "expected": [
      202510,
      320,
      763579.68,
      773161.72,
      -0.0124
     ],
     "actual": [
      223247,
      352,
      841770.24,
      852333.48,
      -0.01
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-pivot-001": {
  "id": "saas-pivot-001",
  "dataset": "saas",
  "scenario": "pivot",
  "chain": "saas-pivot-chain-a",
  "chain_step": 1,
  "title": "行业 × 套餐 活跃账号数交叉表",
  "business_prompt": "产品定价要看分布：“行是行业，列是 free / starter / pro / enterprise 四档套餐，\n 格子里是该行业里持有该档 active 订阅的去重账号数，最后一列是该行业的活跃账号总数。”",
  "context_notes": [
   "只看 status='active' 的订阅",
   "一个账号可能同时持有多档订阅，所以每列都要 COUNT(DISTINCT account_id)",
   "total_accounts 是该行业持有任意 active 订阅的去重账号数，通常小于四列之和"
  ],
  "tables": [
   "accounts",
   "subscriptions"
  ],
  "expected_columns": [
   {
    "name": "industry",
    "type": "string"
   },
   {
    "name": "free_accounts",
    "type": "int"
   },
   {
    "name": "starter_accounts",
    "type": "int"
   },
   {
    "name": "pro_accounts",
    "type": "int"
   },
   {
    "name": "enterprise_accounts",
    "type": "int"
   },
   {
    "name": "total_accounts",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": [
    {
     "pattern": "\\bpivot\\b",
     "flags": "is",
     "reason": ""
    }
   ]
  },
  "hints": [
   "每一列写成 COUNT(DISTINCT CASE WHEN plan='xxx' THEN account_id END)。",
   "总列不能用四列相加：同一个账号可能出现在多档里，加起来会重复。",
   "用 INNER JOIN 即可，因为只统计有 active 订阅的账号。"
  ],
  "reference_sql": "SELECT a.industry,\n       COUNT(DISTINCT CASE WHEN s.plan = 'free'       THEN a.account_id END) AS free_accounts,\n       COUNT(DISTINCT CASE WHEN s.plan = 'starter'    THEN a.account_id END) AS starter_accounts,\n       COUNT(DISTINCT CASE WHEN s.plan = 'pro'        THEN a.account_id END) AS pro_accounts,\n       COUNT(DISTINCT CASE WHEN s.plan = 'enterprise' THEN a.account_id END) AS enterprise_accounts,\n       COUNT(DISTINCT a.account_id) AS total_accounts\nFROM accounts a\nJOIN subscriptions s ON s.account_id = a.account_id\nWHERE s.status = 'active'\nGROUP BY a.industry\nORDER BY a.industry;",
  "alt_solutions": [
   "WITH act AS (\n    SELECT a.industry, a.account_id, s.plan\n    FROM subscriptions s\n    JOIN accounts a ON a.account_id = s.account_id\n    WHERE s.status = 'active'\n)\nSELECT industry,\n       COUNT(DISTINCT CASE WHEN plan = 'free'       THEN account_id END) AS free_accounts,\n       COUNT(DISTINCT CASE WHEN plan = 'starter'    THEN account_id END) AS starter_accounts,\n       COUNT(DISTINCT CASE WHEN plan = 'pro'        THEN account_id END) AS pro_accounts,\n       COUNT(DISTINCT CASE WHEN plan = 'enterprise' THEN account_id END) AS enterprise_accounts,\n       COUNT(DISTINCT account_id) AS total_accounts\nFROM act\nGROUP BY industry\nORDER BY industry;"
  ],
  "explanation": "1. 交叉表的每个格子就是一个条件聚合，列名由业务枚举值决定。\n2. 涉及去重时，合计列必须独立去重，不能把各列相加——这是最常见的口径事故。\n3. COUNT(DISTINCT CASE WHEN ... THEN id END) 是“分维度去重计数”的通用写法。",
  "pitfalls": [
   "total_accounts = free + starter + pro + enterprise，多档账号被重复计数",
   "用 COUNT(CASE WHEN ...) 忘记 DISTINCT，统计的是订阅数不是账号数",
   "WHERE 里漏掉 status='active'，历史订阅混入"
  ],
  "capability_points": [
   "pivot.crosstab",
   "pivot.distinct_count",
   "pivot.total_column"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 5.8,
   "columns": [
    "industry",
    "free_accounts",
    "starter_accounts",
    "pro_accounts",
    "enterprise_accounts",
    "total_accounts"
   ],
   "rows": [
    [
     "Ecommerce",
     86,
     119,
     123,
     54,
     306
    ],
    [
     "Education",
     89,
     119,
     134,
     68,
     328
    ],
    [
     "Finance",
     61,
     93,
     113,
     43,
     262
    ],
    [
     "Healthcare",
     73,
     89,
     128,
     60,
     291
    ],
    [
     "Manufacturing",
     60,
     108,
     119,
     49,
     270
    ],
    [
     "Media",
     71,
     92,
     122,
     59,
     293
    ],
    [
     "SaaS",
     72,
     125,
     138,
     51,
     313
    ]
   ],
   "row_count": 7,
   "translated_sql": "SELECT a.industry,\n       COUNT(DISTINCT CASE WHEN s.plan = 'free'       THEN a.account_id END) AS free_accounts,\n       COUNT(DISTINCT CASE WHEN s.plan = 'starter'    THEN a.account_id END) AS starter_accounts,\n       COUNT(DISTINCT CASE WHEN s.plan = 'pro'        THEN a.account_id END) AS pro_accounts,\n       COUNT(DISTINCT CASE WHEN s.plan = 'enterprise' THEN a.account_id END) AS enterprise_accounts,\n       COUNT(DISTINCT a.account_id) AS total_accounts\nFROM accounts a\nJOIN subscriptions s ON s.account_id = a.account_id\nWHERE s.status = 'active'\nGROUP BY a.industry\nORDER BY a.industry;",
   "signature": {
    "tables": [
     "accounts",
     "subscriptions"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT(",
     "COUNT(DISTINCT",
     "JOIN"
    ]
   },
   "actual_rows": [
    [
     "Ecommerce",
     86,
     119,
     123,
     54,
     306
    ],
    [
     "Education",
     99,
     133,
     150,
     76,
     368
    ],
    [
     "Finance",
     61,
     93,
     113,
     43,
     262
    ],
    [
     "Healthcare",
     81,
     99,
     143,
     67,
     326
    ],
    [
     "Manufacturing",
     60,
     108,
     119,
     49,
     270
    ],
    [
     "Media",
     79,
     103,
     136,
     66,
     328
    ]
   ],
   "actual_row_count": 6,
   "diff": [
    {
     "row": 2,
     "expected": [
      "Education",
      89,
      119,
      134,
      68,
      328
     ],
     "actual": [
      "Education",
      99,
      133,
      150,
      76,
      368
     ]
    },
    {
     "row": 4,
     "expected": [
      "Healthcare",
      73,
      89,
      128,
      60,
      291
     ],
     "actual": [
      "Healthcare",
      81,
      99,
      143,
      67,
      326
     ]
    },
    {
     "row": 6,
     "expected": [
      "Media",
      71,
      92,
      122,
      59,
      293
     ],
     "actual": [
      "Media",
      79,
      103,
      136,
      66,
      328
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-pivot-002": {
  "id": "saas-pivot-002",
  "dataset": "saas",
  "scenario": "pivot",
  "chain": "saas-pivot-chain-a",
  "chain_step": 2,
  "title": "行业 × 半年度 的开票金额与回收率双指标透视",
  "business_prompt": "财务看半年报：“行是行业，列要上半年和下半年各两个指标：开票金额、回收率。\n 数据取 2025 年，按行业名升序。”",
  "context_notes": [
   "上半年 = bill_date 在 1~6 月，下半年 = 7~12 月",
   "回收率 = 该半年内已回款金额 / 该半年内开票金额，保留 4 位小数",
   "金额保留 2 位小数；列名 h1_billed / h1_collect_rate / h2_billed / h2_collect_rate"
  ],
  "tables": [
   "accounts",
   "invoices"
  ],
  "expected_columns": [
   {
    "name": "industry",
    "type": "string"
   },
   {
    "name": "h1_billed",
    "type": "decimal"
   },
   {
    "name": "h1_collect_rate",
    "type": "decimal"
   },
   {
    "name": "h2_billed",
    "type": "decimal"
   },
   {
    "name": "h2_collect_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "比率型的透视格子 = 两个条件聚合相除，分子分母都要带上同一个半年条件。",
   "分子还要额外叠加 paid 条件，相当于两层条件嵌套。",
   "用 MONTH(bill_date) <= 6 判断上半年最直观。"
  ],
  "reference_sql": "SELECT a.industry,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) <= 6 THEN i.amount ELSE 0 END), 2) AS h1_billed,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) <= 6 AND i.paid THEN i.amount ELSE 0 END)\n           / NULLIF(SUM(CASE WHEN MONTH(i.bill_date) <= 6 THEN i.amount ELSE 0 END), 0),\n           4) AS h1_collect_rate,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) >= 7 THEN i.amount ELSE 0 END), 2) AS h2_billed,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) >= 7 AND i.paid THEN i.amount ELSE 0 END)\n           / NULLIF(SUM(CASE WHEN MONTH(i.bill_date) >= 7 THEN i.amount ELSE 0 END), 0),\n           4) AS h2_collect_rate\nFROM invoices i\nJOIN accounts a ON a.account_id = i.account_id\nWHERE i.bill_date >= '2025-01-01'\n  AND i.bill_date <  '2026-01-01'\nGROUP BY a.industry\nORDER BY a.industry;",
  "alt_solutions": [
   "WITH base AS (\n    SELECT a.industry,\n           CASE WHEN MONTH(i.bill_date) <= 6 THEN 'h1' ELSE 'h2' END AS half,\n           i.amount,\n           i.paid\n    FROM invoices i\n    JOIN accounts a ON a.account_id = i.account_id\n    WHERE i.bill_date >= '2025-01-01' AND i.bill_date < '2026-01-01'\n)\nSELECT industry,\n       ROUND(SUM(CASE WHEN half = 'h1' THEN amount ELSE 0 END), 2) AS h1_billed,\n       ROUND(SUM(CASE WHEN half = 'h1' AND paid THEN amount ELSE 0 END)\n           / NULLIF(SUM(CASE WHEN half = 'h1' THEN amount ELSE 0 END), 0), 4) AS h1_collect_rate,\n       ROUND(SUM(CASE WHEN half = 'h2' THEN amount ELSE 0 END), 2) AS h2_billed,\n       ROUND(SUM(CASE WHEN half = 'h2' AND paid THEN amount ELSE 0 END)\n           / NULLIF(SUM(CASE WHEN half = 'h2' THEN amount ELSE 0 END), 0), 4) AS h2_collect_rate\nFROM base\nGROUP BY industry\nORDER BY industry;"
  ],
  "explanation": "1. 多指标透视 = 每个「列维度取值 × 指标」组合各占一列，列数会乘起来。\n2. 比率型格子必须让分子分母共享同一个列维度条件，否则口径串了都不报错。\n3. 把列维度先算成一个标签列（alt 写法），后面写条件聚合更不容易写错。",
  "pitfalls": [
   "分子带了半年条件、分母没带，回收率变成“半年回款 / 全年开票”",
   "用 SUM(paid) 当分子，统计的是笔数不是金额",
   "半年划分写成 MONTH <= 6 与 MONTH > 6 不成对，边界月重复或遗漏"
  ],
  "capability_points": [
   "pivot.multi_metric",
   "pivot.ratio_cell",
   "pivot.conditional_agg",
   "agg.safe_div"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 4.1,
   "columns": [
    "industry",
    "h1_billed",
    "h1_collect_rate",
    "h2_billed",
    "h2_collect_rate"
   ],
   "rows": [
    [
     "Ecommerce",
     2814748.69,
     0.9051,
     2910829.4,
     0.8836
    ],
    [
     "Education",
     2943540.77,
     0.9015,
     2858310.54,
     0.8904
    ],
    [
     "Finance",
     2521558.45,
     0.9005,
     2783489.44,
     0.9
    ],
    [
     "Healthcare",
     2550052.29,
     0.9005,
     2787404.97,
     0.8816
    ],
    [
     "Manufacturing",
     2577272.31,
     0.9072,
     2631033.68,
     0.912
    ],
    [
     "Media",
     2509028.46,
     0.8928,
     2663197.43,
     0.9005
    ],
    [
     "SaaS",
     2565582.57,
     0.8877,
     2497811.94,
     0.8683
    ]
   ],
   "row_count": 7,
   "translated_sql": "SELECT a.industry,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) <= 6 THEN i.amount ELSE 0 END), 2) AS h1_billed,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) <= 6 AND i.paid THEN i.amount ELSE 0 END)\n           / NULLIF(SUM(CASE WHEN MONTH(i.bill_date) <= 6 THEN i.amount ELSE 0 END), 0),\n           4) AS h1_collect_rate,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) >= 7 THEN i.amount ELSE 0 END), 2) AS h2_billed,\n       ROUND(SUM(CASE WHEN MONTH(i.bill_date) >= 7 AND i.paid THEN i.amount ELSE 0 END)\n           / NULLIF(SUM(CASE WHEN MONTH(i.bill_date) >= 7 THEN i.amount ELSE 0 END), 0),\n           4) AS h2_collect_rate\nFROM invoices i\nJOIN accounts a ON a.account_id = i.account_id\nWHERE i.bill_date >= '2025-01-01'\n  AND i.bill_date <  '2026-01-01'\nGROUP BY a.industry\nORDER BY a.industry;",
   "signature": {
    "tables": [
     "accounts",
     "invoices"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "JOIN",
     "NULLIF",
     "ROUND(",
     "MONTH("
    ]
   },
   "actual_rows": [
    [
     "Ecommerce",
     2814748.69,
     0.9051,
     2910829.4,
     0.8836
    ],
    [
     "Education",
     3343273.61,
     1.02,
     3246469.11,
     1.01
    ],
    [
     "Finance",
     2521558.45,
     0.9005,
     2783489.44,
     0.9
    ],
    [
     "Healthcare",
     2896349.39,
     1.02,
     3165934.56,
     1.0
    ],
    [
     "Manufacturing",
     2577272.31,
     0.9072,
     2631033.68,
     0.912
    ],
    [
     "Media",
     2849754.52,
     1.01,
     3024859.64,
     1.02
    ]
   ],
   "actual_row_count": 6,
   "diff": [
    {
     "row": 2,
     "expected": [
      "Education",
      2943540.77,
      0.9015,
      2858310.54,
      0.8904
     ],
     "actual": [
      "Education",
      3343273.61,
      1.02,
      3246469.11,
      1.01
     ]
    },
    {
     "row": 4,
     "expected": [
      "Healthcare",
      2550052.29,
      0.9005,
      2787404.97,
      0.8816
     ],
     "actual": [
      "Healthcare",
      2896349.39,
      1.02,
      3165934.56,
      1.0
     ]
    },
    {
     "row": 6,
     "expected": [
      "Media",
      2509028.46,
      0.8928,
      2663197.43,
      0.9005
     ],
     "actual": [
      "Media",
      2849754.52,
      1.01,
      3024859.64,
      1.02
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-retention-001": {
  "id": "saas-retention-001",
  "dataset": "saas",
  "scenario": "retention",
  "chain": "saas-retention-chain-a",
  "chain_step": 1,
  "title": "新签账号的 30 日功能激活留存",
  "business_prompt": "客户成功要看新客上手情况：“按账号注册月分群，统计分群账号数，\n 以及注册后 1~30 天内产生过任意功能使用记录的账号数和占比。”",
  "context_notes": [
   "注册日 = accounts.signup_date；活跃 = feature_usage 有记录",
   "窗口 [注册日+1天, 注册日+30天]，不含注册当天",
   "分群范围 2024-01-01 ~ 2025-12-01，保证 +30 天仍在数据内"
  ],
  "tables": [
   "accounts",
   "feature_usage"
  ],
  "expected_columns": [
   {
    "name": "cohort_month",
    "type": "string"
   },
   {
    "name": "cohort_accounts",
    "type": "int"
   },
   {
    "name": "d30_accounts",
    "type": "int"
   },
   {
    "name": "d30_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "用 LEFT JOIN feature_usage，条件里不要写日期范围（否则分母塌陷）。",
   "天数差 DATEDIFF(CAST(use_time AS DATE), a.signup_date) BETWEEN 1 AND 30。",
   "分子是 COUNT(DISTINCT CASE WHEN ... THEN account_id END)。"
  ],
  "reference_sql": "SELECT DATE_FORMAT(a.signup_date, '%Y-%m') AS cohort_month,\n       COUNT(DISTINCT a.account_id) AS cohort_accounts,\n       COUNT(DISTINCT CASE\n           WHEN DATEDIFF(CAST(f.use_time AS DATE), a.signup_date) BETWEEN 1 AND 30\n           THEN a.account_id END) AS d30_accounts,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN DATEDIFF(CAST(f.use_time AS DATE), a.signup_date) BETWEEN 1 AND 30\n           THEN a.account_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT a.account_id), 0), 4) AS d30_rate\nFROM accounts a\nLEFT JOIN feature_usage f ON f.account_id = a.account_id\nWHERE a.signup_date >= '2024-01-01'\n  AND a.signup_date <= '2025-12-01'\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "WITH act AS (\n    SELECT DISTINCT account_id, CAST(use_time AS DATE) AS ud\n    FROM feature_usage\n),\nflag AS (\n    SELECT a.account_id,\n           DATE_FORMAT(a.signup_date, '%Y-%m') AS cohort_month,\n           MAX(CASE WHEN DATEDIFF(t.ud, a.signup_date) >= 1\n                     AND DATEDIFF(t.ud, a.signup_date) <= 30\n                    THEN 1 ELSE 0 END) AS retained\n    FROM accounts a\n    LEFT JOIN act t ON t.account_id = a.account_id\n    WHERE a.signup_date >= '2024-01-01' AND a.signup_date <= '2025-12-01'\n    GROUP BY a.account_id, 2\n)\nSELECT cohort_month,\n       COUNT(*) AS cohort_accounts,\n       SUM(retained) AS d30_accounts,\n       ROUND(SUM(retained) * 1.0 / NULLIF(COUNT(*), 0), 4) AS d30_rate\nFROM flag\nGROUP BY cohort_month\nORDER BY cohort_month;"
  ],
  "explanation": "1. B 端留存的锚点通常是签约日，观察对象是“账号”而非“用户”。\n2. 先按账号打标（retained 0/1）再按分群汇总（alt 写法），比一层写完更易调试。\n3. LEFT JOIN + CASE 的组合保证分母是全部新签账号。",
  "pitfalls": [
   "把 DATEDIFF 条件写进 ON 或 WHERE，无活跃账号被排除，留存率虚高",
   "用 COUNT(DISTINCT f.account_id) 当分子，等于“任何时候活跃过”，窗口失效",
   "分群上界没卡，最后一个月的 30 日窗口天然不完整"
  ],
  "capability_points": [
   "retention.anchor",
   "retention.nday",
   "retention.denominator",
   "retention.boundary"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 21.2,
   "columns": [
    "cohort_month",
    "cohort_accounts",
    "d30_accounts",
    "d30_rate"
   ],
   "rows": [
    [
     "2024-01",
     197,
     193,
     0.9797
    ],
    [
     "2024-02",
     188,
     186,
     0.9894
    ],
    [
     "2024-03",
     239,
     234,
     0.9791
    ],
    [
     "2024-04",
     215,
     213,
     0.9907
    ],
    [
     "2024-05",
     227,
     227,
     1.0
    ],
    [
     "2024-06",
     195,
     191,
     0.9795
    ],
    [
     "2024-07",
     211,
     208,
     0.9858
    ],
    [
     "2024-08",
     224,
     217,
     0.9688
    ],
    [
     "2024-09",
     197,
     192,
     0.9746
    ],
    [
     "2024-10",
     205,
     198,
     0.9659
    ],
    [
     "2024-11",
     226,
     220,
     0.9735
    ],
    [
     "2024-12",
     210,
     208,
     0.9905
    ],
    [
     "2025-01",
     233,
     229,
     0.9828
    ],
    [
     "2025-02",
     178,
     174,
     0.9775
    ],
    [
     "2025-03",
     202,
     199,
     0.9851
    ]
   ],
   "row_count": 24,
   "translated_sql": "SELECT strftime(a.signup_date, '%Y-%m') AS cohort_month,\n       COUNT(DISTINCT a.account_id) AS cohort_accounts,\n       COUNT(DISTINCT CASE\n           WHEN date_diff('day', a.signup_date, CAST(f.use_time AS DATE)) BETWEEN 1 AND 30\n           THEN a.account_id END) AS d30_accounts,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN date_diff('day', a.signup_date, CAST(f.use_time AS DATE)) BETWEEN 1 AND 30\n           THEN a.account_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT a.account_id), 0), 4) AS d30_rate\nFROM accounts a\nLEFT JOIN feature_usage f ON f.account_id = a.account_id\nWHERE a.signup_date >= '2024-01-01'\n  AND a.signup_date <= '2025-12-01'\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "accounts",
     "feature_usage"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT(",
     "COUNT(DISTINCT",
     "LEFT JOIN",
     "JOIN",
     "DATEDIFF",
     "DATE_FORMAT",
     "NULLIF",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "2024-01",
     197,
     193,
     0.9797
    ],
    [
     "2024-02",
     203,
     200,
     1.07
    ],
    [
     "2024-03",
     239,
     234,
     0.9791
    ],
    [
     "2024-04",
     232,
     229,
     1.07
    ],
    [
     "2024-05",
     227,
     227,
     1.0
    ],
    [
     "2024-06",
     210,
     206,
     1.06
    ],
    [
     "2024-07",
     211,
     208,
     0.9858
    ],
    [
     "2024-08",
     241,
     234,
     1.05
    ],
    [
     "2024-09",
     197,
     192,
     0.9746
    ],
    [
     "2024-10",
     221,
     213,
     1.04
    ],
    [
     "2024-11",
     226,
     220,
     0.9735
    ],
    [
     "2024-12",
     226,
     224,
     1.07
    ],
    [
     "2025-01",
     233,
     229,
     0.9828
    ],
    [
     "2025-02",
     192,
     187,
     1.06
    ]
   ],
   "actual_row_count": 23,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2024-02",
      188,
      186,
      0.9894
     ],
     "actual": [
      "2024-02",
      203,
      200,
      1.07
     ]
    },
    {
     "row": 4,
     "expected": [
      "2024-04",
      215,
      213,
      0.9907
     ],
     "actual": [
      "2024-04",
      232,
      229,
      1.07
     ]
    },
    {
     "row": 6,
     "expected": [
      "2024-06",
      195,
      191,
      0.9795
     ],
     "actual": [
      "2024-06",
      210,
      206,
      1.06
     ]
    },
    {
     "row": 8,
     "expected": [
      "2024-08",
      224,
      217,
      0.9688
     ],
     "actual": [
      "2024-08",
      241,
      234,
      1.05
     ]
    },
    {
     "row": 10,
     "expected": [
      "2024-10",
      205,
      198,
      0.9659
     ],
     "actual": [
      "2024-10",
      221,
      213,
      1.04
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-retention-002": {
  "id": "saas-retention-002",
  "dataset": "saas",
  "scenario": "retention",
  "chain": "saas-retention-chain-a",
  "chain_step": 2,
  "title": "订阅分群的 90 日流失率与存活率",
  "business_prompt": "收入团队要看早期流失：“按订阅开始月分群，统计订阅数、\n 开始后 90 天内就结束的订阅数、90 日流失率和存活率。”",
  "context_notes": [
   "订阅结束 = end_date 非空；生效中的订阅 end_date 为 NULL",
   "90 日流失 = end_date 非空 且 DATEDIFF(end_date, start_date) <= 90",
   "存活率 = 1 - 流失率；分群范围 2024-01-01 ~ 2025-10-01（保证 90 天窗口完整）"
  ],
  "tables": [
   "subscriptions"
  ],
  "expected_columns": [
   {
    "name": "start_month",
    "type": "string"
   },
   {
    "name": "sub_cnt",
    "type": "int"
   },
   {
    "name": "churn_90d",
    "type": "int"
   },
   {
    "name": "churn_90d_rate",
    "type": "decimal"
   },
   {
    "name": "survive_90d_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "只用一张表就能做完，重点是把“90 天内结束”翻译成 CASE 条件。",
   "end_date 为 NULL 表示还在生效，不算流失。",
   "存活率直接用 1 - 流失率，注意保持同样的小数位。"
  ],
  "reference_sql": "SELECT DATE_FORMAT(start_date, '%Y-%m') AS start_month,\n       COUNT(*) AS sub_cnt,\n       SUM(CASE WHEN end_date IS NOT NULL\n                 AND DATEDIFF(end_date, start_date) <= 90\n                THEN 1 ELSE 0 END) AS churn_90d,\n       ROUND(SUM(CASE WHEN end_date IS NOT NULL\n                       AND DATEDIFF(end_date, start_date) <= 90\n                      THEN 1 ELSE 0 END) * 1.0\n           / NULLIF(COUNT(*), 0), 4) AS churn_90d_rate,\n       ROUND(1 - SUM(CASE WHEN end_date IS NOT NULL\n                           AND DATEDIFF(end_date, start_date) <= 90\n                          THEN 1 ELSE 0 END) * 1.0\n           / NULLIF(COUNT(*), 0), 4) AS survive_90d_rate\nFROM subscriptions\nWHERE start_date >= '2024-01-01'\n  AND start_date <= '2025-10-01'\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "WITH tagged AS (\n    SELECT DATE_FORMAT(start_date, '%Y-%m') AS start_month,\n           CASE WHEN end_date IS NOT NULL\n                 AND DATEDIFF(end_date, start_date) <= 90\n                THEN 1 ELSE 0 END AS is_churn\n    FROM subscriptions\n    WHERE start_date BETWEEN '2024-01-01' AND '2025-10-01'\n)\nSELECT start_month,\n       COUNT(*) AS sub_cnt,\n       SUM(is_churn) AS churn_90d,\n       ROUND(SUM(is_churn) * 1.0 / NULLIF(COUNT(*), 0), 4) AS churn_90d_rate,\n       ROUND((COUNT(*) - SUM(is_churn)) * 1.0 / NULLIF(COUNT(*), 0), 4) AS survive_90d_rate\nFROM tagged\nGROUP BY start_month\nORDER BY start_month;"
  ],
  "explanation": "1. 流失是留存的镜像：同一份分群数据，换个方向就是 churn。\n2. NULL 语义要想清楚：end_date IS NULL 表示“还没结束”，绝不能当成 0 天。\n3. 存活率既可以 1 - 流失率，也可以直接 (总数 - 流失数)/总数，二者等价。",
  "pitfalls": [
   "忘记 end_date IS NOT NULL，DATEDIFF 遇 NULL 返回 NULL，CASE 落到 ELSE 反而“正确”，但语义靠运气",
   "分群上界没卡，最近几个月的 90 天窗口不完整，流失率被系统性低估",
   "存活率单独重算一遍聚合，与流失率产生舍入不一致"
  ],
  "capability_points": [
   "retention.churn",
   "retention.cohort",
   "agg.null_handling",
   "retention.boundary"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 2.9,
   "columns": [
    "start_month",
    "sub_cnt",
    "churn_90d",
    "churn_90d_rate",
    "survive_90d_rate"
   ],
   "rows": [
    [
     "2024-01",
     247,
     7,
     0.0283,
     0.9717
    ],
    [
     "2024-02",
     239,
     5,
     0.0209,
     0.9791
    ],
    [
     "2024-03",
     256,
     8,
     0.0313,
     0.9688
    ],
    [
     "2024-04",
     233,
     6,
     0.0258,
     0.9742
    ],
    [
     "2024-05",
     278,
     9,
     0.0324,
     0.9676
    ],
    [
     "2024-06",
     237,
     9,
     0.038,
     0.962
    ],
    [
     "2024-07",
     254,
     11,
     0.0433,
     0.9567
    ],
    [
     "2024-08",
     247,
     6,
     0.0243,
     0.9757
    ],
    [
     "2024-09",
     266,
     8,
     0.0301,
     0.9699
    ],
    [
     "2024-10",
     235,
     8,
     0.034,
     0.966
    ],
    [
     "2024-11",
     262,
     6,
     0.0229,
     0.9771
    ],
    [
     "2024-12",
     266,
     9,
     0.0338,
     0.9662
    ],
    [
     "2025-01",
     262,
     7,
     0.0267,
     0.9733
    ],
    [
     "2025-02",
     243,
     7,
     0.0288,
     0.9712
    ],
    [
     "2025-03",
     250,
     5,
     0.02,
     0.98
    ]
   ],
   "row_count": 22,
   "translated_sql": "SELECT strftime(start_date, '%Y-%m') AS start_month,\n       COUNT(*) AS sub_cnt,\n       SUM(CASE WHEN end_date IS NOT NULL\n                 AND date_diff('day', start_date, end_date) <= 90\n                THEN 1 ELSE 0 END) AS churn_90d,\n       ROUND(SUM(CASE WHEN end_date IS NOT NULL\n                       AND date_diff('day', start_date, end_date) <= 90\n                      THEN 1 ELSE 0 END) * 1.0\n           / NULLIF(COUNT(*), 0), 4) AS churn_90d_rate,\n       ROUND(1 - SUM(CASE WHEN end_date IS NOT NULL\n                           AND date_diff('day', start_date, end_date) <= 90\n                          THEN 1 ELSE 0 END) * 1.0\n           / NULLIF(COUNT(*), 0), 4) AS survive_90d_rate\nFROM subscriptions\nWHERE start_date >= '2024-01-01'\n  AND start_date <= '2025-10-01'\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "subscriptions"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "COUNT(",
     "DATEDIFF",
     "DATE_FORMAT",
     "NULLIF",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "2024-01",
     247,
     7,
     0.0283,
     0.9717
    ],
    [
     "2024-02",
     259,
     5,
     0.02,
     1.06
    ],
    [
     "2024-03",
     256,
     8,
     0.0313,
     0.9688
    ],
    [
     "2024-04",
     252,
     6,
     0.03,
     1.06
    ],
    [
     "2024-05",
     278,
     9,
     0.0324,
     0.9676
    ],
    [
     "2024-06",
     257,
     9,
     0.04,
     1.04
    ],
    [
     "2024-07",
     254,
     11,
     0.0433,
     0.9567
    ],
    [
     "2024-08",
     268,
     6,
     0.03,
     1.06
    ],
    [
     "2024-09",
     266,
     8,
     0.0301,
     0.9699
    ],
    [
     "2024-10",
     255,
     8,
     0.04,
     1.05
    ],
    [
     "2024-11",
     262,
     6,
     0.0229,
     0.9771
    ],
    [
     "2024-12",
     288,
     9,
     0.04,
     1.05
    ],
    [
     "2025-01",
     262,
     7,
     0.0267,
     0.9733
    ],
    [
     "2025-02",
     263,
     7,
     0.03,
     1.05
    ]
   ],
   "actual_row_count": 21,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2024-02",
      239,
      5,
      0.0209,
      0.9791
     ],
     "actual": [
      "2024-02",
      259,
      5,
      0.02,
      1.06
     ]
    },
    {
     "row": 4,
     "expected": [
      "2024-04",
      233,
      6,
      0.0258,
      0.9742
     ],
     "actual": [
      "2024-04",
      252,
      6,
      0.03,
      1.06
     ]
    },
    {
     "row": 6,
     "expected": [
      "2024-06",
      237,
      9,
      0.038,
      0.962
     ],
     "actual": [
      "2024-06",
      257,
      9,
      0.04,
      1.04
     ]
    },
    {
     "row": 8,
     "expected": [
      "2024-08",
      247,
      6,
      0.0243,
      0.9757
     ],
     "actual": [
      "2024-08",
      268,
      6,
      0.03,
      1.06
     ]
    },
    {
     "row": 10,
     "expected": [
      "2024-10",
      235,
      8,
      0.034,
      0.966
     ],
     "actual": [
      "2024-10",
      255,
      8,
      0.04,
      1.05
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-window-001": {
  "id": "saas-window-001",
  "dataset": "saas",
  "scenario": "window",
  "chain": "saas-window-chain-a",
  "chain_step": 1,
  "title": "每个行业的 MRR Top3 大客户",
  "business_prompt": "客户成功团队要重点名单：“每个行业里，按 active 订阅的 MRR 合计排名，\n 给我前 3 大账号，带上名次。金额相同的话按 account_id 小的在前，只要 3 个。”",
  "context_notes": [
   "只统计 status='active' 的订阅",
   "账号 MRR = 该账号所有 active 订阅的 mrr 之和，保留 2 位小数",
   "“只要 3 个 + 并列按 account_id 决胜”意味着用 ROW_NUMBER 而非 DENSE_RANK"
  ],
  "tables": [
   "accounts",
   "subscriptions"
  ],
  "expected_columns": [
   {
    "name": "industry",
    "type": "string"
   },
   {
    "name": "account_id",
    "type": "int"
   },
   {
    "name": "mrr",
    "type": "decimal"
   },
   {
    "name": "rn",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 200,
  "constraints": {
   "must_match": [
    {
     "pattern": "row_number\\s*\\(\\s*\\)",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": [
    {
     "pattern": "\\blimit\\s+3\\b",
     "flags": "is",
     "reason": ""
    }
   ]
  },
  "hints": [
   "先按 (industry, account_id) 聚合出 MRR，再开窗排名。",
   "ROW_NUMBER 需要完整的排序键：ORDER BY mrr DESC, account_id ASC。",
   "名次过滤必须放在外层（子查询/CTE 之外）。"
  ],
  "reference_sql": "WITH acc_mrr AS (\n    SELECT a.industry,\n           a.account_id,\n           SUM(s.mrr) AS mrr\n    FROM accounts a\n    JOIN subscriptions s ON s.account_id = a.account_id\n    WHERE s.status = 'active'\n    GROUP BY a.industry, a.account_id\n),\nranked AS (\n    SELECT industry, account_id, mrr,\n           ROW_NUMBER() OVER (PARTITION BY industry ORDER BY mrr DESC, account_id ASC) AS rn\n    FROM acc_mrr\n)\nSELECT industry,\n       account_id,\n       ROUND(mrr, 2) AS mrr,\n       rn\nFROM ranked\nWHERE rn <= 3\nORDER BY industry, rn;",
  "alt_solutions": [
   "SELECT industry, account_id, ROUND(mrr, 2) AS mrr, rn\nFROM (\n    SELECT a.industry,\n           a.account_id,\n           SUM(s.mrr) AS mrr,\n           ROW_NUMBER() OVER (PARTITION BY a.industry\n                              ORDER BY SUM(s.mrr) DESC, a.account_id) AS rn\n    FROM accounts a\n    JOIN subscriptions s ON s.account_id = a.account_id\n    WHERE s.status = 'active'\n    GROUP BY a.industry, a.account_id\n) t\nWHERE rn <= 3\nORDER BY industry, rn;"
  ],
  "explanation": "1. ROW_NUMBER 保证每组严格 N 条，代价是并列时必须自己给定决胜规则。\n2. 窗口函数可以直接写在带 GROUP BY 的 SELECT 里，此时它作用于聚合后的行（alt 写法）。\n3. 分组 TopN 与全局 TopN 完全不同，LIMIT 解决不了前者。",
  "pitfalls": [
   "只写 ORDER BY mrr DESC，并列时谁进前 3 随执行计划变化",
   "用 DENSE_RANK 导致某些行业返回超过 3 行",
   "忘记 WHERE s.status='active'，把 churned 的历史 MRR 也算进来"
  ],
  "capability_points": [
   "window.row_number",
   "window.partition",
   "window.topn",
   "window.tie_breaker"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 3.8,
   "columns": [
    "industry",
    "account_id",
    "mrr",
    "rn"
   ],
   "rows": [
    [
     "Ecommerce",
     918,
     176511.7,
     1
    ],
    [
     "Ecommerce",
     1495,
     150872.0,
     2
    ],
    [
     "Ecommerce",
     2236,
     150324.8,
     3
    ],
    [
     "Education",
     3082,
     167215.4,
     1
    ],
    [
     "Education",
     150,
     111443.3,
     2
    ],
    [
     "Education",
     4802,
     99350.3,
     3
    ],
    [
     "Finance",
     810,
     193703.1,
     1
    ],
    [
     "Finance",
     4647,
     99449.3,
     2
    ],
    [
     "Finance",
     4355,
     98350.8,
     3
    ],
    [
     "Healthcare",
     4687,
     96751.6,
     1
    ],
    [
     "Healthcare",
     899,
     94152.9,
     2
    ],
    [
     "Healthcare",
     3712,
     92753.6,
     3
    ],
    [
     "Manufacturing",
     3540,
     176911.5,
     1
    ],
    [
     "Manufacturing",
     1363,
     98950.5,
     2
    ],
    [
     "Manufacturing",
     2436,
     93250.8,
     3
    ]
   ],
   "row_count": 21,
   "translated_sql": "WITH acc_mrr AS (\n    SELECT a.industry,\n           a.account_id,\n           SUM(s.mrr) AS mrr\n    FROM accounts a\n    JOIN subscriptions s ON s.account_id = a.account_id\n    WHERE s.status = 'active'\n    GROUP BY a.industry, a.account_id\n),\nranked AS (\n    SELECT industry, account_id, mrr,\n           ROW_NUMBER() OVER (PARTITION BY industry ORDER BY mrr DESC, account_id ASC) AS rn\n    FROM acc_mrr\n)\nSELECT industry,\n       account_id,\n       ROUND(mrr, 2) AS mrr,\n       rn\nFROM ranked\nWHERE rn <= 3\nORDER BY industry, rn;",
   "signature": {
    "tables": [
     "accounts",
     "subscriptions"
    ],
    "keywords": [
     "ROW_NUMBER",
     "OVER",
     "PARTITION BY",
     "SUM(",
     "JOIN",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "Ecommerce",
     918,
     176511.7,
     1
    ],
    [
     "Ecommerce",
     1633,
     164888.01,
     2
    ],
    [
     "Ecommerce",
     2236,
     150324.8,
     3
    ],
    [
     "Education",
     3368,
     182749.71,
     1
    ],
    [
     "Education",
     150,
     111443.3,
     2
    ],
    [
     "Education",
     5248,
     108579.94,
     3
    ],
    [
     "Finance",
     810,
     193703.1,
     1
    ],
    [
     "Finance",
     5078,
     108688.14,
     2
    ],
    [
     "Finance",
     4355,
     98350.8,
     3
    ],
    [
     "Healthcare",
     5122,
     105739.82,
     1
    ],
    [
     "Healthcare",
     899,
     94152.9,
     2
    ],
    [
     "Healthcare",
     4056,
     101370.41,
     3
    ],
    [
     "Manufacturing",
     3540,
     176911.5,
     1
    ],
    [
     "Manufacturing",
     1489,
     108143.0,
     2
    ]
   ],
   "actual_row_count": 20,
   "diff": [
    {
     "row": 2,
     "expected": [
      "Ecommerce",
      1495,
      150872.0,
      2
     ],
     "actual": [
      "Ecommerce",
      1633,
      164888.01,
      2
     ]
    },
    {
     "row": 4,
     "expected": [
      "Education",
      3082,
      167215.4,
      1
     ],
     "actual": [
      "Education",
      3368,
      182749.71,
      1
     ]
    },
    {
     "row": 6,
     "expected": [
      "Education",
      4802,
      99350.3,
      3
     ],
     "actual": [
      "Education",
      5248,
      108579.94,
      3
     ]
    },
    {
     "row": 8,
     "expected": [
      "Finance",
      4647,
      99449.3,
      2
     ],
     "actual": [
      "Finance",
      5078,
      108688.14,
      2
     ]
    },
    {
     "row": 10,
     "expected": [
      "Healthcare",
      4687,
      96751.6,
      1
     ],
     "actual": [
      "Healthcare",
      5122,
      105739.82,
      1
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "saas-window-002": {
  "id": "saas-window-002",
  "dataset": "saas",
  "scenario": "window",
  "chain": "saas-window-chain-a",
  "chain_step": 2,
  "title": "套餐迁移矩阵（上一档 → 这一档）",
  "business_prompt": "产品要看套餐流动：“对每个账号，把它的订阅按开始日期排序，\n 找出所有『上一份订阅的套餐』和『这一份订阅的套餐』不一样的情况，\n 统计各种迁移路径各出现了多少次，次数多的在前。”",
  "context_notes": [
   "排序键 start_date；同一天多份订阅时用 sub_id 决胜，保证顺序确定",
   "账号的第一份订阅没有“上一档”，应排除",
   "只保留 prev_plan <> plan 的迁移记录（同档续订不算迁移）"
  ],
  "tables": [
   "subscriptions"
  ],
  "expected_columns": [
   {
    "name": "prev_plan",
    "type": "string"
   },
   {
    "name": "plan",
    "type": "string"
   },
   {
    "name": "change_cnt",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 200,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\blag\\s*\\(",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "LAG(plan) OVER (PARTITION BY account_id ORDER BY start_date, sub_id) 就是上一档。",
   "第一份订阅的 prev_plan 为 NULL，要过滤掉。",
   "迁移矩阵 = GROUP BY (prev_plan, plan) 之后计数。"
  ],
  "reference_sql": "WITH seq AS (\n    SELECT account_id,\n           sub_id,\n           plan,\n           LAG(plan) OVER (PARTITION BY account_id ORDER BY start_date, sub_id) AS prev_plan\n    FROM subscriptions\n)\nSELECT prev_plan,\n       plan,\n       COUNT(*) AS change_cnt\nFROM seq\nWHERE prev_plan IS NOT NULL\n  AND prev_plan <> plan\nGROUP BY prev_plan, plan\nORDER BY change_cnt DESC, prev_plan, plan;",
  "alt_solutions": [
   "SELECT prev_plan, plan, COUNT(*) AS change_cnt\nFROM (\n    SELECT plan,\n           LAG(plan) OVER (PARTITION BY account_id ORDER BY start_date ASC, sub_id ASC) AS prev_plan\n    FROM subscriptions\n) t\nWHERE prev_plan IS NOT NULL\n  AND prev_plan != plan\nGROUP BY 1, 2\nORDER BY change_cnt DESC, prev_plan, plan;"
  ],
  "explanation": "1. “状态迁移矩阵”是 LAG 的高频应用：把纵向的时间序列变成横向的前后配对。\n2. 排序键必须唯一，否则同一天的多份订阅谁在前不确定，迁移结果会抖动。\n3. 过滤 prev_plan IS NOT NULL 相当于丢掉每个账号的首份订阅，这是正确的。",
  "pitfalls": [
   "漏写 PARTITION BY account_id，上一份订阅取到了别的账号的",
   "用 <> 比较时 prev_plan 为 NULL，NULL <> 'pro' 结果是 NULL 而不是 TRUE，必须先判非空",
   "ORDER BY 只写 start_date，同日多单顺序不稳定"
  ],
  "capability_points": [
   "window.lag",
   "window.partition",
   "window.transition_matrix",
   "window.tie_breaker"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 4.3,
   "columns": [
    "prev_plan",
    "plan",
    "change_cnt"
   ],
   "rows": [
    [
     "pro",
     "starter",
     274
    ],
    [
     "starter",
     "pro",
     266
    ],
    [
     "pro",
     "free",
     191
    ],
    [
     "free",
     "pro",
     182
    ],
    [
     "starter",
     "free",
     151
    ],
    [
     "pro",
     "enterprise",
     145
    ],
    [
     "enterprise",
     "pro",
     140
    ],
    [
     "free",
     "starter",
     132
    ],
    [
     "enterprise",
     "starter",
     106
    ],
    [
     "starter",
     "enterprise",
     105
    ],
    [
     "free",
     "enterprise",
     75
    ],
    [
     "enterprise",
     "free",
     70
    ]
   ],
   "row_count": 12,
   "translated_sql": "WITH seq AS (\n    SELECT account_id,\n           sub_id,\n           plan,\n           LAG(plan) OVER (PARTITION BY account_id ORDER BY start_date, sub_id) AS prev_plan\n    FROM subscriptions\n)\nSELECT prev_plan,\n       plan,\n       COUNT(*) AS change_cnt\nFROM seq\nWHERE prev_plan IS NOT NULL\n  AND prev_plan <> plan\nGROUP BY prev_plan, plan\nORDER BY change_cnt DESC, prev_plan, plan;",
   "signature": {
    "tables": [
     "subscriptions"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "PARTITION BY",
     "COUNT(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "pro",
     "starter",
     274
    ],
    [
     "starter",
     "pro",
     296
    ],
    [
     "pro",
     "free",
     191
    ],
    [
     "free",
     "pro",
     203
    ],
    [
     "starter",
     "free",
     151
    ],
    [
     "pro",
     "enterprise",
     161
    ],
    [
     "enterprise",
     "pro",
     140
    ],
    [
     "free",
     "starter",
     147
    ],
    [
     "enterprise",
     "starter",
     106
    ],
    [
     "starter",
     "enterprise",
     117
    ],
    [
     "free",
     "enterprise",
     75
    ]
   ],
   "actual_row_count": 11,
   "diff": [
    {
     "row": 2,
     "expected": [
      "starter",
      "pro",
      266
     ],
     "actual": [
      "starter",
      "pro",
      296
     ]
    },
    {
     "row": 4,
     "expected": [
      "free",
      "pro",
      182
     ],
     "actual": [
      "free",
      "pro",
      203
     ]
    },
    {
     "row": 6,
     "expected": [
      "pro",
      "enterprise",
      145
     ],
     "actual": [
      "pro",
      "enterprise",
      161
     ]
    },
    {
     "row": 8,
     "expected": [
      "free",
      "starter",
      132
     ],
     "actual": [
      "free",
      "starter",
      147
     ]
    },
    {
     "row": 10,
     "expected": [
      "starter",
      "enterprise",
      105
     ],
     "actual": [
      "starter",
      "enterprise",
      117
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-agg-001": {
  "id": "shop-agg-001",
  "dataset": "shop",
  "scenario": "agg",
  "chain": "shop-agg-chain-a",
  "chain_step": 1,
  "title": "2025 年各一级品类实付 GMV 与订单数",
  "business_prompt": "品类运营在群里 @ 你：\n“年度复盘要用，帮我拉一下 2025 年每个一级品类的实付 GMV，还有这个品类下了多少笔订单，\n 按 GMV 从高到低排。我要拿去跟去年横向对比。”",
  "context_notes": [
   "实付金额 = 订单明细 order_items.item_amount 之和（落到明细粒度，避免多商品订单重复计入）",
   "已取消（cancelled）和已退款（refunded）的订单不计入销售额",
   "一笔订单可能含多个明细，订单数要用 COUNT(DISTINCT order_id)"
  ],
  "tables": [
   "orders",
   "order_items",
   "dim_product"
  ],
  "expected_columns": [
   {
    "name": "cat_l1",
    "type": "string"
   },
   {
    "name": "gmv",
    "type": "decimal"
   },
   {
    "name": "order_cnt",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "实付金额应该落在 order_items 明细上求和，而不是直接用 orders.pay_amount 然后 GROUP BY 品类——那样会漏掉明细粒度。",
   "排除哪些订单状态？cancelled 和 refunded 不能算销售额。",
   "订单数必须用 COUNT(DISTINCT o.order_id)，否则一个订单多明细会被算成多笔。"
  ],
  "reference_sql": "SELECT p.cat_l1,\n       SUM(oi.item_amount) AS gmv,\n       COUNT(DISTINCT o.order_id) AS order_cnt\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.order_time >= '2025-01-01'\n  AND o.order_time <  '2026-01-01'\n  AND o.status NOT IN ('cancelled', 'refunded')\nGROUP BY p.cat_l1\nORDER BY gmv DESC;",
  "alt_solutions": [
   "SELECT p.cat_l1,\n       SUM(oi.item_amount) AS gmv,\n       COUNT(DISTINCT o.order_id) AS order_cnt\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.status NOT IN ('cancelled', 'refunded')\n  AND o.order_time BETWEEN '2025-01-01' AND '2025-12-31 23:59:59'\nGROUP BY p.cat_l1\nORDER BY gmv DESC;"
  ],
  "explanation": "1. 口径：实付金额必须聚合到 order_items 明细，再按品类分组。\n2. 去重：一笔订单可能多个明细，订单数用 COUNT(DISTINCT order_id)。\n3. 过滤：cancelled / refunded 不计入销售额，这是业务口径的硬要求。",
  "pitfalls": [
   "直接 SUM(orders.pay_amount) 然后 GROUP BY 品类，会丢失明细粒度且和参考解对不上",
   "忘记排除 cancelled / refunded，GMV 虚高",
   "订单数用了 COUNT(*) 而非 COUNT(DISTINCT order_id)，被明细行数放大"
  ],
  "capability_points": [
   "agg.multi_group",
   "agg.distinct_count"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 11.0,
   "columns": [
    "cat_l1",
    "gmv",
    "order_cnt"
   ],
   "rows": [
    [
     "电脑",
     811922814.86,
     34831
    ],
    [
     "手机",
     567032872.67,
     35439
    ],
    [
     "家电",
     497745632.73,
     34863
    ],
    [
     "美妆",
     66656823.58,
     35318
    ],
    [
     "服饰",
     49048450.4,
     35098
    ],
    [
     "食品",
     11074343.2,
     35162
    ]
   ],
   "row_count": 6,
   "translated_sql": "SELECT p.cat_l1,\n       SUM(oi.item_amount) AS gmv,\n       COUNT(DISTINCT o.order_id) AS order_cnt\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.order_time >= '2025-01-01'\n  AND o.order_time <  '2026-01-01'\n  AND o.status NOT IN ('cancelled', 'refunded')\nGROUP BY p.cat_l1\nORDER BY gmv DESC;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "dim_product"
    ],
    "keywords": [
     "SUM(",
     "COUNT(",
     "COUNT(DISTINCT",
     "JOIN",
     "NOT IN"
    ]
   },
   "actual_rows": [
    [
     "电脑",
     811922814.86,
     34831
    ],
    [
     "手机",
     619029787.09,
     38688
    ],
    [
     "家电",
     497745632.73,
     34863
    ],
    [
     "美妆",
     72769254.3,
     38556
    ],
    [
     "服饰",
     49048450.4,
     35098
    ]
   ],
   "actual_row_count": 5,
   "diff": [
    {
     "row": 2,
     "expected": [
      "手机",
      567032872.67,
      35439
     ],
     "actual": [
      "手机",
      619029787.09,
      38688
     ]
    },
    {
     "row": 4,
     "expected": [
      "美妆",
      66656823.58,
      35318
     ],
     "actual": [
      "美妆",
      72769254.3,
      38556
     ]
    }
   ],
   "hardcode_markers": [
    "电脑",
    "手机",
    "家电",
    "美妆",
    "服饰",
    "食品"
   ]
  }
 },
 "shop-agg-002": {
  "id": "shop-agg-002",
  "dataset": "shop",
  "scenario": "agg",
  "chain": "shop-agg-chain-a",
  "chain_step": 2,
  "title": "2025 年各渠道实付 GMV 占比",
  "business_prompt": "渠道运营要看结构：“拉一下 2025 年各渠道的实付 GMV，以及每个渠道占总 GMV 的比例（百分比）。\n 我要看钱主要从哪个渠道来。”",
  "context_notes": [
   "实付 = order_items.item_amount 之和；排除 cancelled/refunded",
   "占比 = 渠道 GMV / 全部渠道 GMV 之和（用窗口函数或子查询算总盘）",
   "渠道名来自 dim_channel"
  ],
  "tables": [
   "orders",
   "order_items",
   "dim_channel"
  ],
  "expected_columns": [
   {
    "name": "channel_name",
    "type": "string"
   },
   {
    "name": "gmv",
    "type": "decimal"
   },
   {
    "name": "gmv_ratio",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "先按渠道聚合出 GMV（子查询/CTE）。",
   "总盘怎么算？可以用 SUM(gmv) OVER () 窗口函数，不分组地求全体和。",
   "占比 = 渠道 GMV / 全体 GMV，用 NULLIF 防除零。"
  ],
  "reference_sql": "WITH gmv_by_ch AS (\n    SELECT c.channel_name, SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_channel c ON c.channel_id = o.channel_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY c.channel_name\n)\nSELECT channel_name, gmv,\n       ROUND(gmv / SUM(gmv) OVER (), 4) AS gmv_ratio\nFROM gmv_by_ch\nORDER BY gmv DESC;",
  "alt_solutions": [
   "SELECT t.channel_name, t.gmv, ROUND(t.gmv / s.total, 4) AS gmv_ratio\nFROM (\n    SELECT c.channel_name, SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_channel c ON c.channel_id = o.channel_id\n    WHERE o.status NOT IN ('cancelled', 'refunded') AND o.pay_time IS NOT NULL\n    GROUP BY c.channel_name\n) t\nCROSS JOIN (\n    SELECT SUM(oi.item_amount) AS total\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded') AND o.pay_time IS NOT NULL\n) s\nORDER BY t.gmv DESC;"
  ],
  "explanation": "1. 聚合：先按渠道算出 GMV。\n2. 总盘：SUM(gmv) OVER () 不加 PARTITION，得到全体之和。\n3. 占比：渠道 / 全体，NULLIF 防除零。",
  "pitfalls": [
   "用 COUNT(*)/COUNT(*) 当占比（那是个数比例不是金额比例）",
   "总盘用子查询但忘了 JOIN 条件导致笛卡尔积",
   "忘记排除 cancelled/refunded"
  ],
  "capability_points": [
   "agg.ratio",
   "agg.multi_group"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 13.4,
   "columns": [
    "channel_name",
    "gmv",
    "gmv_ratio"
   ],
   "rows": [
    [
     "App Store",
     580301350.04,
     0.1679
    ],
    [
     "线下门店",
     580173346.24,
     0.1679
    ],
    [
     "微信小程序",
     575241303.56,
     0.1665
    ],
    [
     "天猫旗舰店",
     574766247.43,
     0.1663
    ],
    [
     "抖音小店",
     573017005.08,
     0.1658
    ],
    [
     "官网",
     572174853.57,
     0.1656
    ]
   ],
   "row_count": 6,
   "translated_sql": "WITH gmv_by_ch AS (\n    SELECT c.channel_name, SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_channel c ON c.channel_id = o.channel_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY c.channel_name\n)\nSELECT channel_name, gmv,\n       ROUND(gmv / SUM(gmv) OVER (), 4) AS gmv_ratio\nFROM gmv_by_ch\nORDER BY gmv DESC;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "dim_channel"
    ],
    "keywords": [
     "OVER",
     "SUM(",
     "JOIN",
     "NOT IN",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "App Store",
     580301350.04,
     0.1679
    ],
    [
     "线下门店",
     635521883.47,
     0.18
    ],
    [
     "微信小程序",
     575241303.56,
     0.1665
    ],
    [
     "天猫旗舰店",
     629598947.43,
     0.18
    ],
    [
     "抖音小店",
     573017005.08,
     0.1658
    ]
   ],
   "actual_row_count": 5,
   "diff": [
    {
     "row": 2,
     "expected": [
      "线下门店",
      580173346.24,
      0.1679
     ],
     "actual": [
      "线下门店",
      635521883.47,
      0.18
     ]
    },
    {
     "row": 4,
     "expected": [
      "天猫旗舰店",
      574766247.43,
      0.1663
     ],
     "actual": [
      "天猫旗舰店",
      629598947.43,
      0.18
     ]
    }
   ],
   "hardcode_markers": [
    "App Store",
    "线下门店",
    "微信小程序",
    "天猫旗舰店",
    "抖音小店",
    "官网"
   ]
  }
 },
 "shop-agg-003": {
  "id": "shop-agg-003",
  "dataset": "shop",
  "scenario": "agg",
  "chain": "shop-agg-chain-a",
  "chain_step": 3,
  "title": "2025 年各品类新品 vs 老品实付对比",
  "business_prompt": "品类运营要拆结构：“2025 年每个一级品类，新品（is_new）和老品的实付 GMV 分别是多少？\n 我要看新品拉动力。”",
  "context_notes": [
   "实付 = order_items.item_amount 之和；排除 cancelled/refunded",
   "新品/老品来自 dim_product.is_new（布尔）",
   "用条件聚合 SUM(CASE WHEN ... THEN item_amount ELSE 0 END) 在同一行拆出两列"
  ],
  "tables": [
   "orders",
   "order_items",
   "dim_product"
  ],
  "expected_columns": [
   {
    "name": "cat_l1",
    "type": "string"
   },
   {
    "name": "new_gmv",
    "type": "decimal"
   },
   {
    "name": "old_gmv",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "一行一个品类，用两个 SUM(CASE WHEN p.is_new THEN ... ELSE 0 END) 拆出新/老品列。",
   "实付落到 order_items 求和。",
   "排除 cancelled/refunded。"
  ],
  "reference_sql": "SELECT p.cat_l1,\n       SUM(CASE WHEN p.is_new THEN oi.item_amount ELSE 0 END) AS new_gmv,\n       SUM(CASE WHEN NOT p.is_new THEN oi.item_amount ELSE 0 END) AS old_gmv\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.status NOT IN ('cancelled', 'refunded')\n  AND o.pay_time IS NOT NULL\n  AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\nGROUP BY p.cat_l1\nORDER BY p.cat_l1;",
  "alt_solutions": [
   "SELECT p.cat_l1,\n       SUM(CASE WHEN p.is_new THEN oi.item_amount ELSE 0 END) AS new_gmv,\n       SUM(CASE WHEN NOT p.is_new THEN oi.item_amount ELSE 0 END) AS old_gmv\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.status NOT IN ('cancelled', 'refunded')\n  AND o.pay_time IS NOT NULL\n  AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\nGROUP BY p.cat_l1\nORDER BY p.cat_l1;"
  ],
  "explanation": "1. 条件聚合：同一行用两个 CASE 把新品/老品金额分别求和。\n2. 口径：实付落在 order_items，排除 cancelled/refunded。",
  "pitfalls": [
   "用 is_new=1 / =0 与布尔比较混用（MySQL 里布尔即 0/1，但显式更稳）",
   "忘记排除退款单",
   "把 old_gmv 写成 ELSE NULL 导致 SUM 忽略（应 ELSE 0）"
  ],
  "capability_points": [
   "agg.conditional",
   "agg.multi_group"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 7.2,
   "columns": [
    "cat_l1",
    "new_gmv",
    "old_gmv"
   ],
   "rows": [
    [
     "家电",
     0.0,
     430732344.32
    ],
    [
     "手机",
     0.0,
     491162226.42
    ],
    [
     "服饰",
     0.0,
     42344842.46
    ],
    [
     "电脑",
     0.0,
     700518775.29
    ],
    [
     "美妆",
     0.0,
     57569847.22
    ],
    [
     "食品",
     0.0,
     9538034.61
    ]
   ],
   "row_count": 6,
   "translated_sql": "SELECT p.cat_l1,\n       SUM(CASE WHEN p.is_new THEN oi.item_amount ELSE 0 END) AS new_gmv,\n       SUM(CASE WHEN NOT p.is_new THEN oi.item_amount ELSE 0 END) AS old_gmv\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.status NOT IN ('cancelled', 'refunded')\n  AND o.pay_time IS NOT NULL\n  AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\nGROUP BY p.cat_l1\nORDER BY p.cat_l1;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "dim_product"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "JOIN",
     "NOT IN"
    ]
   },
   "actual_rows": [
    [
     "家电",
     0.0,
     430732344.32
    ],
    [
     "手机",
     0.0,
     536742081.03
    ],
    [
     "服饰",
     0.0,
     42344842.46
    ],
    [
     "电脑",
     0.0,
     765526917.64
    ],
    [
     "美妆",
     0.0,
     57569847.22
    ]
   ],
   "actual_row_count": 5,
   "diff": [
    {
     "row": 2,
     "expected": [
      "手机",
      0.0,
      491162226.42
     ],
     "actual": [
      "手机",
      0.0,
      536742081.03
     ]
    },
    {
     "row": 4,
     "expected": [
      "电脑",
      0.0,
      700518775.29
     ],
     "actual": [
      "电脑",
      0.0,
      765526917.64
     ]
    }
   ],
   "hardcode_markers": [
    "家电",
    "手机",
    "服饰",
    "电脑",
    "美妆",
    "食品"
   ]
  }
 },
 "shop-agg-004": {
  "id": "shop-agg-004",
  "dataset": "shop",
  "scenario": "agg",
  "chain": "shop-agg-chain-a",
  "chain_step": 4,
  "title": "品类 GMV 小计与总计（WITH ROLLUP）",
  "business_prompt": "“GMV 看板要加合计行：按一级品类统计 2025 年实付 GMV，并在最后加一行‘ALL’表示全部品类合计。\n 一行里要能区分这是小计/合计还是普通品类行。”",
  "context_notes": [
   "MySQL 没有 GROUPING SETS，用 WITH ROLLUP + GROUPING() 区分真 NULL 与汇总行",
   "GROUPING(cat_l1)=1 表示这一行是合计行",
   "实付 = order_items.item_amount 之和；排除 cancelled/refunded"
  ],
  "tables": [
   "orders",
   "order_items",
   "dim_product"
  ],
  "expected_columns": [
   {
    "name": "cat_label",
    "type": "string"
   },
   {
    "name": "order_cnt",
    "type": "int"
   },
   {
    "name": "gmv",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "用 GROUP BY ROLLUP(cat_l1) 产生小计/合计行。",
   "GROUPING(cat_l1)=1 的代表合计行，用 CASE 把它显示成 'ALL'。",
   "排序时合计行放最后：ORDER BY GROUPING(cat_l1), cat_l1。"
  ],
  "reference_sql": "SELECT CASE WHEN GROUPING(p.cat_l1) = 1 THEN 'ALL' ELSE p.cat_l1 END AS cat_label,\n       COUNT(DISTINCT o.order_id) AS order_cnt,\n       SUM(oi.item_amount) AS gmv\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.status NOT IN ('cancelled', 'refunded')\n  AND o.pay_time IS NOT NULL\n  AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\nGROUP BY ROLLUP(p.cat_l1)\nORDER BY GROUPING(p.cat_l1), p.cat_l1;",
  "alt_solutions": [
   "SELECT cat_label, SUM(order_cnt) AS order_cnt, SUM(gmv) AS gmv\nFROM (\n    SELECT p.cat_l1 AS cat_label,\n           COUNT(DISTINCT o.order_id) AS order_cnt,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_product p ON p.product_id = oi.product_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n      AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\n    GROUP BY p.cat_l1\n    UNION ALL\n    SELECT 'ALL',\n           COUNT(DISTINCT o.order_id),\n           SUM(oi.item_amount)\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n      AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\n) t\nGROUP BY cat_label\nORDER BY cat_label;"
  ],
  "explanation": "1. ROLLUP：GROUP BY ROLLUP(cat_l1) 自动追加合计行。\n2. 区分：GROUPING()=1 是汇总行，用 CASE 显示 'ALL'。\n3. 老写法：用 UNION ALL 手工拼合计（alt 展示），但 ROLLUP 更简洁。",
  "pitfalls": [
   "用字符串 'ALL' 当普通品类名导致和真品类混淆（要靠 GROUPING 区分）",
   "忘记排除 cancelled/refunded，合计虚高",
   "在 MySQL 里误用 GROUPING SETS（本训练器模拟 MySQL，不支持）"
  ],
  "capability_points": [
   "agg.rollup",
   "agg.grouping_sets"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 14.0,
   "columns": [
    "cat_label",
    "order_cnt",
    "gmv"
   ],
   "rows": [
    [
     "家电",
     30114,
     430732344.32
    ],
    [
     "手机",
     30612,
     491162226.42
    ],
    [
     "服饰",
     30359,
     42344842.46
    ],
    [
     "电脑",
     30019,
     700518775.29
    ],
    [
     "美妆",
     30481,
     57569847.22
    ],
    [
     "食品",
     30323,
     9538034.61
    ],
    [
     "ALL",
     75132,
     1731866070.32
    ]
   ],
   "row_count": 7,
   "translated_sql": "SELECT CASE WHEN GROUPING(p.cat_l1) = 1 THEN 'ALL' ELSE p.cat_l1 END AS cat_label,\n       COUNT(DISTINCT o.order_id) AS order_cnt,\n       SUM(oi.item_amount) AS gmv\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nWHERE o.status NOT IN ('cancelled', 'refunded')\n  AND o.pay_time IS NOT NULL\n  AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\nGROUP BY ROLLUP(p.cat_l1)\nORDER BY GROUPING(p.cat_l1), p.cat_l1;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "dim_product"
    ],
    "keywords": [
     "GROUPING",
     "CASE WHEN",
     "SUM(",
     "COUNT(",
     "COUNT(DISTINCT",
     "JOIN",
     "NOT IN"
    ]
   },
   "actual_rows": [
    [
     "家电",
     30114,
     430732344.32
    ],
    [
     "手机",
     32852,
     527115301.39
    ],
    [
     "服饰",
     30359,
     42344842.46
    ],
    [
     "电脑",
     32216,
     751796749.64
    ],
    [
     "美妆",
     30481,
     57569847.22
    ],
    [
     "食品",
     32542,
     10236218.74
    ]
   ],
   "actual_row_count": 6,
   "diff": [
    {
     "row": 2,
     "expected": [
      "手机",
      30612,
      491162226.42
     ],
     "actual": [
      "手机",
      32852,
      527115301.39
     ]
    },
    {
     "row": 4,
     "expected": [
      "电脑",
      30019,
      700518775.29
     ],
     "actual": [
      "电脑",
      32216,
      751796749.64
     ]
    },
    {
     "row": 6,
     "expected": [
      "食品",
      30323,
      9538034.61
     ],
     "actual": [
      "食品",
      32542,
      10236218.74
     ]
    }
   ],
   "hardcode_markers": [
    "家电",
    "手机",
    "服饰",
    "电脑",
    "美妆",
    "食品"
   ]
  }
 },
 "shop-funnel-001": {
  "id": "shop-funnel-001",
  "dataset": "shop",
  "scenario": "funnel",
  "chain": "shop-funnel-chain-a",
  "chain_step": 1,
  "title": "浏览-加购-提交-支付 无序漏斗人数",
  "business_prompt": "增长同学要基础漏斗：“统计 2025 年发生过『浏览商品 / 加购 / 提交订单 / 支付成功』\n 这四类事件的去重用户数，按人数从多到少排。先不要求先后次序。”",
  "context_notes": [
   "四类事件名：view_product / add_cart / submit_order / pay_success",
   "无序漏斗：只统计“这个人是否发生过该事件”，不要求事件按时间先后",
   "人数 = COUNT(DISTINCT user_id)；同一用户同一事件多次只算一次"
  ],
  "tables": [
   "events"
  ],
  "expected_columns": [
   {
    "name": "event_name",
    "type": "string"
   },
   {
    "name": "user_cnt",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "用 WHERE event_name IN (...) 圈定四步，GROUP BY event_name。",
   "每步人数是 COUNT(DISTINCT user_id)，不是 COUNT(*)。",
   "“无序”意味着不需要检查事件先后顺序，先做各步规模的基线。"
  ],
  "reference_sql": "SELECT event_name,\n       COUNT(DISTINCT user_id) AS user_cnt\nFROM events\nWHERE event_name IN ('view_product', 'add_cart', 'submit_order', 'pay_success')\n  AND event_time >= '2025-01-01'\n  AND event_time <  '2026-01-01'\nGROUP BY event_name\nORDER BY user_cnt DESC;",
  "alt_solutions": [
   "SELECT e.event_name, COUNT(DISTINCT e.user_id) AS user_cnt\nFROM events e\nWHERE e.event_time BETWEEN '2025-01-01' AND '2025-12-31 23:59:59'\n  AND e.event_name IN ('view_product','add_cart','submit_order','pay_success')\nGROUP BY e.event_name\nORDER BY user_cnt DESC;"
  ],
  "explanation": "1. 无序漏斗：每步独立统计发生过该事件的去重用户，不约束先后顺序。\n2. 去重：COUNT(DISTINCT user_id) 是漏斗人数口径，避免重复事件放大。\n3. 范围：用 event_time 圈定 2025 年，与环比/留存口径一致。",
  "pitfalls": [
   "用 COUNT(*) 而非 COUNT(DISTINCT user_id)，被重复埋点放大",
   "把四步硬写成一列（CASE WHEN），会丢掉“每步一行”的漏斗结构",
   "忘记限定 2025 年，混入其他年份数据"
  ],
  "capability_points": [
   "funnel.unordered",
   "funnel.step_vs_total"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 10.7,
   "columns": [
    "event_name",
    "user_cnt"
   ],
   "rows": [
    [
     "view_product",
     29933
    ],
    [
     "add_cart",
     29487
    ],
    [
     "submit_order",
     27281
    ],
    [
     "pay_success",
     23853
    ]
   ],
   "row_count": 4,
   "translated_sql": "SELECT event_name,\n       COUNT(DISTINCT user_id) AS user_cnt\nFROM events\nWHERE event_name IN ('view_product', 'add_cart', 'submit_order', 'pay_success')\n  AND event_time >= '2025-01-01'\n  AND event_time <  '2026-01-01'\nGROUP BY event_name\nORDER BY user_cnt DESC;",
   "signature": {
    "tables": [
     "events"
    ],
    "keywords": [
     "COUNT(",
     "COUNT(DISTINCT"
    ]
   },
   "actual_rows": [
    [
     "view_product",
     29933
    ],
    [
     "add_cart",
     31639
    ],
    [
     "submit_order",
     27281
    ],
    [
     "pay_success",
     25594
    ]
   ],
   "actual_row_count": 3,
   "diff": [
    {
     "row": 2,
     "expected": [
      "add_cart",
      29487
     ],
     "actual": [
      "add_cart",
      31639
     ]
    },
    {
     "row": 4,
     "expected": [
      "pay_success",
      23853
     ],
     "actual": [
      "pay_success",
      25594
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-funnel-002": {
  "id": "shop-funnel-002",
  "dataset": "shop",
  "scenario": "funnel",
  "chain": "shop-funnel-chain-a",
  "chain_step": 2,
  "title": "会话内有序漏斗（时间必须严格递增）",
  "business_prompt": "产品经理说无序漏斗不准：“同一个会话（session_id）里，必须先浏览商品、再加购、\n 再提交订单、最后支付成功，时间严格往后走才算走通这一步。给我 2025 年四步的会话数。”",
  "context_notes": [
   "每步时间取该会话内该事件的最早时间 MIN(event_time)",
   "严格递增：t2 > t1、t3 > t2、t4 > t3，等于不算通过",
   "输出 step_no 1~4 与 step_name，step_name 用 view_product / add_cart / submit_order / pay_success",
   "统计对象是会话数（COUNT 会话），不是用户数"
  ],
  "tables": [
   "events"
  ],
  "expected_columns": [
   {
    "name": "step_no",
    "type": "int"
   },
   {
    "name": "step_name",
    "type": "string"
   },
   {
    "name": "session_cnt",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "union\\s+all",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "先把事件表“压平”成一行一个 session、四列时间戳（条件 MIN）。",
   "压平之后，每一步就是在前一步条件上再加一个时间比较。",
   "第 4 步的条件包含前三步的全部条件，是层层嵌套的关系。"
  ],
  "reference_sql": "WITH sess AS (\n    SELECT session_id,\n           MIN(CASE WHEN event_name = 'view_product' THEN event_time END) AS t1,\n           MIN(CASE WHEN event_name = 'add_cart'     THEN event_time END) AS t2,\n           MIN(CASE WHEN event_name = 'submit_order' THEN event_time END) AS t3,\n           MIN(CASE WHEN event_name = 'pay_success'  THEN event_time END) AS t4\n    FROM events\n    WHERE event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    GROUP BY session_id\n)\nSELECT 1 AS step_no, 'view_product' AS step_name, COUNT(*) AS session_cnt\nFROM sess WHERE t1 IS NOT NULL\nUNION ALL\nSELECT 2, 'add_cart', COUNT(*)\nFROM sess WHERE t1 IS NOT NULL AND t2 > t1\nUNION ALL\nSELECT 3, 'submit_order', COUNT(*)\nFROM sess WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2\nUNION ALL\nSELECT 4, 'pay_success', COUNT(*)\nFROM sess WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2 AND t4 > t3\nORDER BY step_no;",
  "alt_solutions": [
   "WITH sess AS (\n    SELECT session_id,\n           MIN(CASE WHEN event_name = 'view_product' THEN event_time END) AS t1,\n           MIN(CASE WHEN event_name = 'add_cart'     THEN event_time END) AS t2,\n           MIN(CASE WHEN event_name = 'submit_order' THEN event_time END) AS t3,\n           MIN(CASE WHEN event_name = 'pay_success'  THEN event_time END) AS t4\n    FROM events\n    WHERE event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    GROUP BY session_id\n),\nflag AS (\n    SELECT CASE WHEN t1 IS NOT NULL THEN 1 ELSE 0 END AS s1,\n           CASE WHEN t1 IS NOT NULL AND t2 > t1 THEN 1 ELSE 0 END AS s2,\n           CASE WHEN t1 IS NOT NULL AND t2 > t1 AND t3 > t2 THEN 1 ELSE 0 END AS s3,\n           CASE WHEN t1 IS NOT NULL AND t2 > t1 AND t3 > t2 AND t4 > t3 THEN 1 ELSE 0 END AS s4\n    FROM sess\n)\nSELECT 1 AS step_no, 'view_product' AS step_name, SUM(s1) AS session_cnt FROM flag\nUNION ALL SELECT 2, 'add_cart',     SUM(s2) FROM flag\nUNION ALL SELECT 3, 'submit_order', SUM(s3) FROM flag\nUNION ALL SELECT 4, 'pay_success',  SUM(s4) FROM flag\nORDER BY step_no;"
  ],
  "explanation": "1. 有序漏斗的标准套路：先按主体（session/user）把事件压平成多列时间戳。\n2. 压平之后“顺序约束”就退化成时间戳之间的大小比较，非常直观。\n3. 每一步必须继承前面所有步的条件，否则会出现“下一步人数比上一步多”的怪象。",
  "pitfalls": [
   "第 3 步只写 t3 > t2 而不带 t2 > t1，导致漏斗出现回升",
   "用 > = 而不是 >，同一时间戳的两个事件被判定为“有先后”",
   "用 MAX 而不是 MIN 取步骤时间，语义变成“最后一次”，顺序判断失真"
  ],
  "capability_points": [
   "funnel.ordered",
   "funnel.flatten",
   "funnel.monotonic"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 20.0,
   "columns": [
    "step_no",
    "step_name",
    "session_cnt"
   ],
   "rows": [
    [
     1,
     "view_product",
     179037
    ],
    [
     2,
     "add_cart",
     1
    ],
    [
     3,
     "submit_order",
     0
    ],
    [
     4,
     "pay_success",
     0
    ]
   ],
   "row_count": 4,
   "translated_sql": "WITH sess AS (\n    SELECT session_id,\n           MIN(CASE WHEN event_name = 'view_product' THEN event_time END) AS t1,\n           MIN(CASE WHEN event_name = 'add_cart'     THEN event_time END) AS t2,\n           MIN(CASE WHEN event_name = 'submit_order' THEN event_time END) AS t3,\n           MIN(CASE WHEN event_name = 'pay_success'  THEN event_time END) AS t4\n    FROM events\n    WHERE event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    GROUP BY session_id\n)\nSELECT 1 AS step_no, 'view_product' AS step_name, COUNT(*) AS session_cnt\nFROM sess WHERE t1 IS NOT NULL\nUNION ALL\nSELECT 2, 'add_cart', COUNT(*)\nFROM sess WHERE t1 IS NOT NULL AND t2 > t1\nUNION ALL\nSELECT 3, 'submit_order', COUNT(*)\nFROM sess WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2\nUNION ALL\nSELECT 4, 'pay_success', COUNT(*)\nFROM sess WHERE t1 IS NOT NULL AND t2 > t1 AND t3 > t2 AND t4 > t3\nORDER BY step_no;",
   "signature": {
    "tables": [
     "events"
    ],
    "keywords": [
     "UNION ALL",
     "CASE WHEN",
     "COUNT(",
     "MIN(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "view_product",
     179037
    ],
    [
     2,
     "add_cart",
     1
    ],
    [
     3,
     "submit_order",
     0
    ],
    [
     4,
     "pay_success",
     0
    ]
   ],
   "actual_row_count": 3,
   "diff": [],
   "hardcode_markers": []
  }
 },
 "shop-funnel-003": {
  "id": "shop-funnel-003",
  "dataset": "shop",
  "scenario": "funnel",
  "chain": "shop-funnel-chain-a",
  "chain_step": 3,
  "title": "漏斗单步转化率与整体转化率",
  "business_prompt": "在无序漏斗人数的基础上，再给两列：“相邻步骤的转化率（本步 ÷ 上一步），\n 以及整体转化率（本步 ÷ 第一步）。第一步的单步转化率留空。”",
  "context_notes": [
   "步骤顺序固定为 1 view_product → 2 add_cart → 3 submit_order → 4 pay_success",
   "人数口径同 funnel-001：2025 年内该事件的去重用户数",
   "第 1 步的 step_conv_rate 为 NULL；整体转化率第 1 步为 1.0"
  ],
  "tables": [
   "events"
  ],
  "expected_columns": [
   {
    "name": "step_no",
    "type": "int"
   },
   {
    "name": "step_name",
    "type": "string"
   },
   {
    "name": "user_cnt",
    "type": "int"
   },
   {
    "name": "step_conv_rate",
    "type": "decimal"
   },
   {
    "name": "total_conv_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\bover\\s*\\(",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "先构造一张 (step_no, step_name, user_cnt) 的四行小表。",
   "单步转化率用 LAG(user_cnt) OVER (ORDER BY step_no) 拿上一步。",
   "整体转化率用 FIRST_VALUE(user_cnt) OVER (ORDER BY step_no) 拿第一步。"
  ],
  "reference_sql": "WITH base AS (\n    SELECT CASE event_name\n               WHEN 'view_product' THEN 1\n               WHEN 'add_cart'     THEN 2\n               WHEN 'submit_order' THEN 3\n               ELSE 4\n           END AS step_no,\n           event_name AS step_name,\n           COUNT(DISTINCT user_id) AS user_cnt\n    FROM events\n    WHERE event_time >= '2025-01-01' AND event_time < '2026-01-01'\n      AND event_name IN ('view_product', 'add_cart', 'submit_order', 'pay_success')\n    GROUP BY 1, 2\n)\nSELECT step_no,\n       step_name,\n       user_cnt,\n       ROUND(user_cnt * 1.0\n           / NULLIF(LAG(user_cnt) OVER (ORDER BY step_no), 0), 4) AS step_conv_rate,\n       ROUND(user_cnt * 1.0\n           / NULLIF(FIRST_VALUE(user_cnt) OVER (ORDER BY step_no), 0), 4) AS total_conv_rate\nFROM base\nORDER BY step_no;",
  "alt_solutions": [
   "WITH base AS (\n    SELECT 1 AS step_no, 'view_product' AS step_name, COUNT(DISTINCT user_id) AS user_cnt\n    FROM events WHERE event_name = 'view_product'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    UNION ALL\n    SELECT 2, 'add_cart', COUNT(DISTINCT user_id)\n    FROM events WHERE event_name = 'add_cart'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    UNION ALL\n    SELECT 3, 'submit_order', COUNT(DISTINCT user_id)\n    FROM events WHERE event_name = 'submit_order'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n    UNION ALL\n    SELECT 4, 'pay_success', COUNT(DISTINCT user_id)\n    FROM events WHERE event_name = 'pay_success'\n      AND event_time >= '2025-01-01' AND event_time < '2026-01-01'\n),\nw AS (\n    SELECT step_no, step_name, user_cnt,\n           LAG(user_cnt) OVER (ORDER BY step_no) AS prev_cnt,\n           MAX(CASE WHEN step_no = 1 THEN user_cnt END) OVER () AS first_cnt\n    FROM base\n)\nSELECT step_no, step_name, user_cnt,\n       ROUND(user_cnt * 1.0 / NULLIF(prev_cnt, 0), 4) AS step_conv_rate,\n       ROUND(user_cnt * 1.0 / NULLIF(first_cnt, 0), 4) AS total_conv_rate\nFROM w\nORDER BY step_no;"
  ],
  "explanation": "1. 漏斗的两种转化率：单步（环比式）看瓶颈在哪一环，整体（累计式）看最终效率。\n2. LAG 取上一行、FIRST_VALUE 取首行，是窗口函数在小结果集上的典型用法。\n3. CASE 把事件名映射成 step_no，是让漏斗“有序”的最简单方式。",
  "pitfalls": [
   "用 event_name 字母序排序，漏斗顺序变成 add_cart 在最前",
   "FIRST_VALUE 忘记 ORDER BY，取到的“首行”不确定",
   "直接除法不加 NULLIF，上一步为 0 时报除零错"
  ],
  "capability_points": [
   "funnel.conv_rate",
   "funnel.step_vs_total",
   "window.lag",
   "window.first_value"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 14.3,
   "columns": [
    "step_no",
    "step_name",
    "user_cnt",
    "step_conv_rate",
    "total_conv_rate"
   ],
   "rows": [
    [
     1,
     "view_product",
     29933,
     null,
     1.0
    ],
    [
     2,
     "add_cart",
     29487,
     0.9851,
     0.9851
    ],
    [
     3,
     "submit_order",
     27281,
     0.9252,
     0.9114
    ],
    [
     4,
     "pay_success",
     23853,
     0.8743,
     0.7969
    ]
   ],
   "row_count": 4,
   "translated_sql": "WITH base AS (\n    SELECT CASE event_name\n               WHEN 'view_product' THEN 1\n               WHEN 'add_cart'     THEN 2\n               WHEN 'submit_order' THEN 3\n               ELSE 4\n           END AS step_no,\n           event_name AS step_name,\n           COUNT(DISTINCT user_id) AS user_cnt\n    FROM events\n    WHERE event_time >= '2025-01-01' AND event_time < '2026-01-01'\n      AND event_name IN ('view_product', 'add_cart', 'submit_order', 'pay_success')\n    GROUP BY 1, 2\n)\nSELECT step_no,\n       step_name,\n       user_cnt,\n       ROUND(user_cnt * 1.0\n           / NULLIF(LAG(user_cnt) OVER (ORDER BY step_no), 0), 4) AS step_conv_rate,\n       ROUND(user_cnt * 1.0\n           / NULLIF(FIRST_VALUE(user_cnt) OVER (ORDER BY step_no), 0), 4) AS total_conv_rate\nFROM base\nORDER BY step_no;",
   "signature": {
    "tables": [
     "events"
    ],
    "keywords": [
     "LAG",
     "FIRST_VALUE",
     "OVER",
     "COUNT(",
     "COUNT(DISTINCT",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "view_product",
     29933,
     null,
     1.0
    ],
    [
     2,
     "add_cart",
     30875,
     1.03,
     1.03
    ],
    [
     3,
     "submit_order",
     27281,
     0.9252,
     0.9114
    ],
    [
     4,
     "pay_success",
     24976,
     0.92,
     0.83
    ]
   ],
   "actual_row_count": 3,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      "add_cart",
      29487,
      0.9851,
      0.9851
     ],
     "actual": [
      2,
      "add_cart",
      30875,
      1.03,
      1.03
     ]
    },
    {
     "row": 4,
     "expected": [
      4,
      "pay_success",
      23853,
      0.8743,
      0.7969
     ],
     "actual": [
      4,
      "pay_success",
      24976,
      0.92,
      0.83
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-funnel-004": {
  "id": "shop-funnel-004",
  "dataset": "shop",
  "scenario": "funnel",
  "chain": "shop-funnel-chain-a",
  "chain_step": 4,
  "title": "分渠道漏斗对比（含未知渠道）",
  "business_prompt": "渠道复盘：“2025 年按事件上报的渠道分组，比较『浏览商品 → 支付成功』的整体转化率。\n 埋点里有一部分事件没带渠道，这部分单独归到『未知』，不能直接丢掉。”",
  "context_notes": [
   "渠道取 events.channel_id 关联 dim_channel.channel_name；channel_id 为 NULL 时输出 '未知'",
   "view_users / pay_users 都是去重用户数",
   "conv_rate = pay_users / view_users，分母为 0 时返回 NULL"
  ],
  "tables": [
   "events",
   "dim_channel"
  ],
  "expected_columns": [
   {
    "name": "channel_name",
    "type": "string"
   },
   {
    "name": "view_users",
    "type": "int"
   },
   {
    "name": "pay_users",
    "type": "int"
   },
   {
    "name": "conv_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": [
    {
     "pattern": "channel_id\\s+is\\s+not\\s+null",
     "flags": "is",
     "reason": ""
    }
   ]
  },
  "hints": [
   "关联维表必须用 LEFT JOIN，否则 channel_id 为 NULL 的事件会被 INNER JOIN 丢掉。",
   "用 COALESCE(c.channel_name, '未知') 兜底空值，并且要 GROUP BY 这个表达式。",
   "两个人数都用 COUNT(DISTINCT CASE WHEN ... THEN user_id END) 一次算完。"
  ],
  "reference_sql": "SELECT COALESCE(c.channel_name, '未知') AS channel_name,\n       COUNT(DISTINCT CASE WHEN e.event_name = 'view_product'\n                           THEN e.user_id END) AS view_users,\n       COUNT(DISTINCT CASE WHEN e.event_name = 'pay_success'\n                           THEN e.user_id END) AS pay_users,\n       ROUND(COUNT(DISTINCT CASE WHEN e.event_name = 'pay_success'\n                                 THEN e.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT CASE WHEN e.event_name = 'view_product'\n                                        THEN e.user_id END), 0), 4) AS conv_rate\nFROM events e\nLEFT JOIN dim_channel c ON c.channel_id = e.channel_id\nWHERE e.event_time >= '2025-01-01'\n  AND e.event_time <  '2026-01-01'\n  AND e.event_name IN ('view_product', 'pay_success')\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "WITH ev AS (\n    SELECT COALESCE(c.channel_name, '未知') AS channel_name,\n           e.event_name,\n           e.user_id\n    FROM events e\n    LEFT JOIN dim_channel c ON c.channel_id = e.channel_id\n    WHERE e.event_name IN ('view_product', 'pay_success')\n      AND e.event_time >= '2025-01-01' AND e.event_time < '2026-01-01'\n)\nSELECT channel_name,\n       COUNT(DISTINCT CASE WHEN event_name = 'view_product' THEN user_id END) AS view_users,\n       COUNT(DISTINCT CASE WHEN event_name = 'pay_success'  THEN user_id END) AS pay_users,\n       ROUND(COUNT(DISTINCT CASE WHEN event_name = 'pay_success' THEN user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT CASE WHEN event_name = 'view_product' THEN user_id END), 0),\n           4) AS conv_rate\nFROM ev\nGROUP BY channel_name\nORDER BY channel_name;"
  ],
  "explanation": "1. 维度补空：埋点缺失渠道是常态，COALESCE 兜底比过滤更能反映真实盘子。\n2. LEFT JOIN + COALESCE 是“保留残缺维度”的标准组合。\n3. 分组键写表达式时，GROUP BY 也要跟着写表达式（或用序号 GROUP BY 1）。",
  "pitfalls": [
   "用 INNER JOIN dim_channel，未知渠道的用户凭空消失，各渠道之和 ≠ 总量",
   "GROUP BY c.channel_name（原始列）而不是 COALESCE 后的表达式，NULL 单独成组且显示为空",
   "一个用户在多个渠道都有事件时被重复计数——这是渠道口径的固有特性，需要在结论里说明"
  ],
  "capability_points": [
   "funnel.by_dimension",
   "funnel.conv_rate",
   "agg.null_handling"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 14.2,
   "columns": [
    "channel_name",
    "view_users",
    "pay_users",
    "conv_rate"
   ],
   "rows": [
    [
     "App Store",
     17706,
     6446,
     0.3641
    ],
    [
     "天猫旗舰店",
     17679,
     6426,
     0.3635
    ],
    [
     "官网",
     17754,
     6302,
     0.355
    ],
    [
     "微信小程序",
     17813,
     6385,
     0.3584
    ],
    [
     "抖音小店",
     17715,
     6318,
     0.3566
    ],
    [
     "未知",
     13368,
     4375,
     0.3273
    ],
    [
     "线下门店",
     17918,
     6329,
     0.3532
    ]
   ],
   "row_count": 7,
   "translated_sql": "SELECT COALESCE(c.channel_name, '未知') AS channel_name,\n       COUNT(DISTINCT CASE WHEN e.event_name = 'view_product'\n                           THEN e.user_id END) AS view_users,\n       COUNT(DISTINCT CASE WHEN e.event_name = 'pay_success'\n                           THEN e.user_id END) AS pay_users,\n       ROUND(COUNT(DISTINCT CASE WHEN e.event_name = 'pay_success'\n                                 THEN e.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT CASE WHEN e.event_name = 'view_product'\n                                        THEN e.user_id END), 0), 4) AS conv_rate\nFROM events e\nLEFT JOIN dim_channel c ON c.channel_id = e.channel_id\nWHERE e.event_time >= '2025-01-01'\n  AND e.event_time <  '2026-01-01'\n  AND e.event_name IN ('view_product', 'pay_success')\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "events",
     "dim_channel"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT(",
     "COUNT(DISTINCT",
     "LEFT JOIN",
     "JOIN",
     "COALESCE",
     "NULLIF",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "App Store",
     17706,
     6446,
     0.3641
    ],
    [
     "天猫旗舰店",
     20002,
     7270,
     0.41
    ],
    [
     "官网",
     17754,
     6302,
     0.355
    ],
    [
     "微信小程序",
     20153,
     7223,
     0.41
    ],
    [
     "抖音小店",
     17715,
     6318,
     0.3566
    ],
    [
     "未知",
     15124,
     4949,
     0.37
    ]
   ],
   "actual_row_count": 6,
   "diff": [
    {
     "row": 2,
     "expected": [
      "天猫旗舰店",
      17679,
      6426,
      0.3635
     ],
     "actual": [
      "天猫旗舰店",
      20002,
      7270,
      0.41
     ]
    },
    {
     "row": 4,
     "expected": [
      "微信小程序",
      17813,
      6385,
      0.3584
     ],
     "actual": [
      "微信小程序",
      20153,
      7223,
      0.41
     ]
    },
    {
     "row": 6,
     "expected": [
      "未知",
      13368,
      4375,
      0.3273
     ],
     "actual": [
      "未知",
      15124,
      4949,
      0.37
     ]
    }
   ],
   "hardcode_markers": [
    "App Store",
    "天猫旗舰店",
    "官网",
    "微信小程序",
    "抖音小店",
    "线下门店"
   ]
  }
 },
 "shop-growth-001": {
  "id": "shop-growth-001",
  "dataset": "shop",
  "scenario": "growth",
  "chain": "shop-growth-chain-a",
  "chain_step": 1,
  "title": "月度 GMV 环比增长率",
  "business_prompt": "老板要看趋势：“拉一下每个自然月的实付 GMV，再算环比（跟上个月比）的增长率，\n 从 2024 年 1 月开始，按月份升序。”",
  "context_notes": [
   "GMV = 已完成/已支付订单的 order_items.item_amount 之和（排除 cancelled/refunded）",
   "环比 = (本月 - 上月) / 上月；上月为 NULL 或 0 时增长率应为 NULL（不能报除零错）",
   "月份用 DATE_FORMAT(order_time, '%Y-%m') 取整；数据含 2024-2025 两个完整年"
  ],
  "tables": [
   "orders",
   "order_items"
  ],
  "expected_columns": [
   {
    "name": "ym",
    "type": "string"
   },
   {
    "name": "gmv",
    "type": "decimal"
   },
   {
    "name": "prev_gmv",
    "type": "decimal"
   },
   {
    "name": "mom_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "先按月聚合出 GMV（子查询/CTE），再用 LAG 取上一行的 GMV。",
   "LAG 默认取“排序后的上一行”，所以必须 ORDER BY ym 后再 LAG。",
   "增长率用 (gmv - prev)/NULLIF(prev,0)，上月为空或 0 时返回 NULL。"
  ],
  "reference_sql": "WITH monthly AS (\n    SELECT DATE_FORMAT(o.order_time, '%Y-%m') AS ym,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1\n)\nSELECT ym,\n       gmv,\n       LAG(gmv) OVER (ORDER BY ym) AS prev_gmv,\n       ROUND(\n           (gmv - LAG(gmv) OVER (ORDER BY ym))\n           / NULLIF(LAG(gmv) OVER (ORDER BY ym), 0),\n       4) AS mom_rate\nFROM monthly\nORDER BY ym;",
  "alt_solutions": [
   "SELECT m1.ym,\n       m1.gmv,\n       m2.gmv AS prev_gmv,\n       ROUND((m1.gmv - m2.gmv) / NULLIF(m2.gmv, 0), 4) AS mom_rate\nFROM (\n    SELECT DATE_FORMAT(o.order_time, '%Y-%m') AS ym,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1\n) m1\nLEFT JOIN (\n    SELECT DATE_FORMAT(o.order_time, '%Y-%m') AS ym,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1\n) m2 ON m2.ym = DATE_FORMAT(\n       DATE_SUB(CAST(CONCAT(m1.ym, '-01') AS DATE), INTERVAL 1 MONTH),\n       '%Y-%m')\nORDER BY m1.ym;"
  ],
  "explanation": "1. 聚合：按月（'%Y-%m'）聚合 GMV 到一张月表。\n2. 取上期：LAG 按 ym 升序取上一行；首月 prev_gmv 为 NULL。\n3. 安全除法：NULLIF(prev,0) 让基期为 0 或缺失时增长率返回 NULL，而非报错。",
  "pitfalls": [
   "直接用 (gmv - LAG)/LAG 不做 NULLIF，上月为 0 时除零报错",
   "忘记排除 cancelled/refunded，GMV 与口径不符",
   "用自连接对上月时把月份字符串当日期加减，需先 STR_TO_DATE 再 INTERVAL"
  ],
  "capability_points": [
   "growth.mom",
   "growth.date_spine",
   "growth.safe_div",
   "growth.boundary"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 14.8,
   "columns": [
    "ym",
    "gmv",
    "prev_gmv",
    "mom_rate"
   ],
   "rows": [
    [
     "2024-01",
     147819891.81,
     null,
     null
    ],
    [
     "2024-02",
     131520820.79,
     147819891.81,
     -0.1103
    ],
    [
     "2024-03",
     145826452.96,
     131520820.79,
     0.1088
    ],
    [
     "2024-04",
     141138071.78,
     145826452.96,
     -0.0322
    ],
    [
     "2024-05",
     146544912.17,
     141138071.78,
     0.0383
    ],
    [
     "2024-06",
     143478705.72,
     146544912.17,
     -0.0209
    ],
    [
     "2024-07",
     139797292.44,
     143478705.72,
     -0.0257
    ],
    [
     "2024-08",
     147874305.91,
     139797292.44,
     0.0578
    ],
    [
     "2024-09",
     144410613.65,
     147874305.91,
     -0.0234
    ],
    [
     "2024-10",
     143289261.53,
     144410613.65,
     -0.0078
    ],
    [
     "2024-11",
     143692001.25,
     143289261.53,
     0.0028
    ],
    [
     "2024-12",
     148415705.59,
     143692001.25,
     0.0329
    ],
    [
     "2025-01",
     150996656.63,
     148415705.59,
     0.0174
    ],
    [
     "2025-02",
     133315691.86,
     150996656.63,
     -0.1171
    ],
    [
     "2025-03",
     148812742.72,
     133315691.86,
     0.1162
    ]
   ],
   "row_count": 24,
   "translated_sql": "WITH monthly AS (\n    SELECT strftime(o.order_time, '%Y-%m') AS ym,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1\n)\nSELECT ym,\n       gmv,\n       LAG(gmv) OVER (ORDER BY ym) AS prev_gmv,\n       ROUND(\n           (gmv - LAG(gmv) OVER (ORDER BY ym))\n           / NULLIF(LAG(gmv) OVER (ORDER BY ym), 0),\n       4) AS mom_rate\nFROM monthly\nORDER BY ym;",
   "signature": {
    "tables": [
     "orders",
     "order_items"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "SUM(",
     "JOIN",
     "DATE_FORMAT",
     "NOT IN",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "2024-01",
     147819891.81,
     null,
     null
    ],
    [
     "2024-02",
     146856148.49,
     165055691.2,
     -0.12
    ],
    [
     "2024-03",
     145826452.96,
     131520820.79,
     0.1088
    ],
    [
     "2024-04",
     157594770.95,
     162829817.38,
     -0.04
    ],
    [
     "2024-05",
     146544912.17,
     141138071.78,
     0.0383
    ],
    [
     "2024-06",
     160208322.81,
     163632048.93,
     -0.02
    ],
    [
     "2024-07",
     139797292.44,
     143478705.72,
     -0.0257
    ],
    [
     "2024-08",
     165116449.98,
     156097656.74,
     0.06
    ],
    [
     "2024-09",
     144410613.65,
     147874305.91,
     -0.0234
    ],
    [
     "2024-10",
     159996789.42,
     161248891.2,
     -0.01
    ],
    [
     "2024-11",
     143692001.25,
     143289261.53,
     0.0028
    ],
    [
     "2024-12",
     165720976.86,
     160446488.6,
     0.04
    ],
    [
     "2025-01",
     150996656.63,
     148415705.59,
     0.0174
    ],
    [
     "2025-02",
     148860301.53,
     168602866.79,
     -0.13
    ]
   ],
   "actual_row_count": 23,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2024-02",
      131520820.79,
      147819891.81,
      -0.1103
     ],
     "actual": [
      "2024-02",
      146856148.49,
      165055691.2,
      -0.12
     ]
    },
    {
     "row": 4,
     "expected": [
      "2024-04",
      141138071.78,
      145826452.96,
      -0.0322
     ],
     "actual": [
      "2024-04",
      157594770.95,
      162829817.38,
      -0.04
     ]
    },
    {
     "row": 6,
     "expected": [
      "2024-06",
      143478705.72,
      146544912.17,
      -0.0209
     ],
     "actual": [
      "2024-06",
      160208322.81,
      163632048.93,
      -0.02
     ]
    },
    {
     "row": 8,
     "expected": [
      "2024-08",
      147874305.91,
      139797292.44,
      0.0578
     ],
     "actual": [
      "2024-08",
      165116449.98,
      156097656.74,
      0.06
     ]
    },
    {
     "row": 10,
     "expected": [
      "2024-10",
      143289261.53,
      144410613.65,
      -0.0078
     ],
     "actual": [
      "2024-10",
      159996789.42,
      161248891.2,
      -0.01
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-growth-002": {
  "id": "shop-growth-002",
  "dataset": "shop",
  "scenario": "growth",
  "chain": "shop-growth-chain-a",
  "chain_step": 2,
  "title": "2025 年逐月 GMV 同比（对齐去年同月）",
  "business_prompt": "年终复盘：“把 2025 年 1~12 月的实付 GMV，跟 2024 年同月做对比，\n 给我月份、今年、去年、同比增长率四列，按月份升序。”",
  "context_notes": [
   "GMV = order_items.item_amount 之和；排除 cancelled/refunded，且 pay_time 非空",
   "同比 = (今年同月 - 去年同月) / 去年同月；基期为 0 或缺失时返回 NULL",
   "mon 输出 1~12 的整数（不是 '2025-01' 字符串）"
  ],
  "tables": [
   "orders",
   "order_items"
  ],
  "expected_columns": [
   {
    "name": "mon",
    "type": "int"
   },
   {
    "name": "gmv_2025",
    "type": "decimal"
   },
   {
    "name": "gmv_2024",
    "type": "decimal"
   },
   {
    "name": "yoy_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "先聚合出一张 (年, 月, GMV) 的月表，同比就是这张表跟它自己错一年 JOIN。",
   "自连接条件是 prev.m = cur.m AND prev.y = cur.y - 1，别写成 y - 1 在等号左边。",
   "也可以用 LAG(gmv, 12) OVER (ORDER BY y, m)，前提是月份连续无缺。"
  ],
  "reference_sql": "WITH monthly AS (\n    SELECT YEAR(o.order_time) AS y,\n           MONTH(o.order_time) AS m,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n)\nSELECT cur.m AS mon,\n       cur.gmv AS gmv_2025,\n       prev.gmv AS gmv_2024,\n       ROUND((cur.gmv - prev.gmv) / NULLIF(prev.gmv, 0), 4) AS yoy_rate\nFROM monthly cur\nLEFT JOIN monthly prev\n       ON prev.m = cur.m\n      AND prev.y = cur.y - 1\nWHERE cur.y = 2025\nORDER BY cur.m;",
  "alt_solutions": [
   "WITH monthly AS (\n    SELECT YEAR(o.order_time) AS y,\n           MONTH(o.order_time) AS m,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n),\nlagged AS (\n    SELECT y, m, gmv,\n           LAG(gmv, 12) OVER (ORDER BY y, m) AS ly_gmv\n    FROM monthly\n)\nSELECT m AS mon,\n       gmv AS gmv_2025,\n       ly_gmv AS gmv_2024,\n       ROUND((gmv - ly_gmv) / NULLIF(ly_gmv, 0), 4) AS yoy_rate\nFROM lagged\nWHERE y = 2025\nORDER BY m;"
  ],
  "explanation": "1. 同比的本质是“错一年对齐”，两种主流写法：自连接对齐，或 LAG(n=周期长度)。\n2. 自连接更稳：即使某年缺月也不会错位；LAG(12) 依赖月份连续。\n3. 安全除法：NULLIF(基期, 0) 保证基期为 0 时返回 NULL 而不是报错。",
  "pitfalls": [
   "用 LAG(gmv, 12) 但月份有缺失，错位对到了错误的月",
   "自连接用 INNER JOIN，去年没数据的月份整行消失",
   "忘记 WHERE cur.y = 2025，把 2024 年也输出了"
  ],
  "capability_points": [
   "growth.yoy",
   "growth.self_join",
   "growth.safe_div",
   "growth.window_offset"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 9.6,
   "columns": [
    "mon",
    "gmv_2025",
    "gmv_2024",
    "yoy_rate"
   ],
   "rows": [
    [
     1,
     150996656.63,
     147819891.81,
     0.0215
    ],
    [
     2,
     133315691.86,
     131520820.79,
     0.0136
    ],
    [
     3,
     148812742.72,
     145826452.96,
     0.0205
    ],
    [
     4,
     139383443.94,
     141138071.78,
     -0.0124
    ],
    [
     5,
     145376417.49,
     146544912.17,
     -0.008
    ],
    [
     6,
     140057501.15,
     143478705.72,
     -0.0238
    ],
    [
     7,
     149830768.45,
     139797292.44,
     0.0718
    ],
    [
     8,
     147906219.68,
     147874305.91,
     0.0002
    ],
    [
     9,
     143980895.9,
     144410613.65,
     -0.003
    ],
    [
     10,
     145349653.75,
     143289261.53,
     0.0144
    ],
    [
     11,
     135593874.84,
     143692001.25,
     -0.0564
    ],
    [
     12,
     151262203.91,
     148415705.59,
     0.0192
    ]
   ],
   "row_count": 12,
   "translated_sql": "WITH monthly AS (\n    SELECT YEAR(o.order_time) AS y,\n           MONTH(o.order_time) AS m,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n)\nSELECT cur.m AS mon,\n       cur.gmv AS gmv_2025,\n       prev.gmv AS gmv_2024,\n       ROUND((cur.gmv - prev.gmv) / NULLIF(prev.gmv, 0), 4) AS yoy_rate\nFROM monthly cur\nLEFT JOIN monthly prev\n       ON prev.m = cur.m\n      AND prev.y = cur.y - 1\nWHERE cur.y = 2025\nORDER BY cur.m;",
   "signature": {
    "tables": [
     "orders",
     "order_items"
    ],
    "keywords": [
     "SUM(",
     "LEFT JOIN",
     "JOIN",
     "NOT IN",
     "NULLIF",
     "ROUND(",
     "YEAR(",
     "MONTH(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     150996656.63,
     147819891.81,
     0.0215
    ],
    [
     2,
     140821365.31,
     138925443.0,
     0.01
    ],
    [
     3,
     148812742.72,
     145826452.96,
     0.0205
    ],
    [
     4,
     147230731.83,
     149084145.22,
     -0.01
    ],
    [
     5,
     145376417.49,
     146544912.17,
     -0.008
    ],
    [
     6,
     147942738.46,
     151556556.85,
     -0.03
    ],
    [
     7,
     149830768.45,
     139797292.44,
     0.0718
    ],
    [
     8,
     156233339.85,
     156199629.33,
     0.0
    ],
    [
     9,
     143980895.9,
     144410613.65,
     -0.003
    ],
    [
     10,
     153532839.26,
     151356446.95,
     0.02
    ],
    [
     11,
     135593874.84,
     143692001.25,
     -0.0564
    ]
   ],
   "actual_row_count": 11,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      133315691.86,
      131520820.79,
      0.0136
     ],
     "actual": [
      2,
      140821365.31,
      138925443.0,
      0.01
     ]
    },
    {
     "row": 4,
     "expected": [
      4,
      139383443.94,
      141138071.78,
      -0.0124
     ],
     "actual": [
      4,
      147230731.83,
      149084145.22,
      -0.01
     ]
    },
    {
     "row": 6,
     "expected": [
      6,
      140057501.15,
      143478705.72,
      -0.0238
     ],
     "actual": [
      6,
      147942738.46,
      151556556.85,
      -0.03
     ]
    },
    {
     "row": 8,
     "expected": [
      8,
      147906219.68,
      147874305.91,
      0.0002
     ],
     "actual": [
      8,
      156233339.85,
      156199629.33,
      0.0
     ]
    },
    {
     "row": 10,
     "expected": [
      10,
      145349653.75,
      143289261.53,
      0.0144
     ],
     "actual": [
      10,
      153532839.26,
      151356446.95,
      0.02
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-growth-003": {
  "id": "shop-growth-003",
  "dataset": "shop",
  "scenario": "growth",
  "chain": "shop-growth-chain-a",
  "chain_step": 3,
  "title": "YTD 累计 GMV 与累计同比",
  "business_prompt": "CFO 只看累计口径：“2025 年逐月给我『年初至今累计 GMV』，\n 以及 2024 年同期的累计 GMV 和累计同比增长率。”",
  "context_notes": [
   "YTD = 从当年 1 月累计到本月（含本月）",
   "GMV 口径同前：order_items.item_amount，排除 cancelled/refunded，pay_time 非空",
   "累计用窗口函数 SUM(...) OVER (PARTITION BY 年 ORDER BY 月)，不要自己写 12 段 UNION"
  ],
  "tables": [
   "orders",
   "order_items"
  ],
  "expected_columns": [
   {
    "name": "mon",
    "type": "int"
   },
   {
    "name": "ytd_2025",
    "type": "decimal"
   },
   {
    "name": "ytd_2024",
    "type": "decimal"
   },
   {
    "name": "ytd_yoy_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\bover\\s*\\(",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "第一步还是月表 (y, m, gmv)。",
   "第二步在月表上加一列 SUM(gmv) OVER (PARTITION BY y ORDER BY m) 得到 YTD。",
   "第三步把 YTD 月表跟自己错一年 JOIN，算累计同比。"
  ],
  "reference_sql": "WITH monthly AS (\n    SELECT YEAR(o.order_time) AS y,\n           MONTH(o.order_time) AS m,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n),\nytd AS (\n    SELECT y, m,\n           SUM(gmv) OVER (PARTITION BY y ORDER BY m\n                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS ytd_gmv\n    FROM monthly\n)\nSELECT cur.m AS mon,\n       cur.ytd_gmv AS ytd_2025,\n       prev.ytd_gmv AS ytd_2024,\n       ROUND((cur.ytd_gmv - prev.ytd_gmv) / NULLIF(prev.ytd_gmv, 0), 4) AS ytd_yoy_rate\nFROM ytd cur\nLEFT JOIN ytd prev\n       ON prev.m = cur.m\n      AND prev.y = cur.y - 1\nWHERE cur.y = 2025\nORDER BY cur.m;",
  "alt_solutions": [
   "WITH monthly AS (\n    SELECT YEAR(o.order_time) AS y,\n           MONTH(o.order_time) AS m,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.pay_time IS NOT NULL\n      AND o.status NOT IN ('cancelled', 'refunded')\n    GROUP BY 1, 2\n),\nytd AS (\n    SELECT y, m,\n           SUM(gmv) OVER (PARTITION BY y ORDER BY m) AS ytd_gmv\n    FROM monthly\n)\nSELECT a.m AS mon,\n       MAX(CASE WHEN a.y = 2025 THEN a.ytd_gmv END) AS ytd_2025,\n       MAX(CASE WHEN a.y = 2024 THEN a.ytd_gmv END) AS ytd_2024,\n       ROUND((MAX(CASE WHEN a.y = 2025 THEN a.ytd_gmv END)\n            - MAX(CASE WHEN a.y = 2024 THEN a.ytd_gmv END))\n           / NULLIF(MAX(CASE WHEN a.y = 2024 THEN a.ytd_gmv END), 0), 4) AS ytd_yoy_rate\nFROM ytd a\nWHERE a.y IN (2024, 2025)\nGROUP BY a.m\nORDER BY a.m;"
  ],
  "explanation": "1. 累计 = 有序窗口的“从头到当前行”求和，默认窗口框架就是 UNBOUNDED PRECEDING ~ CURRENT ROW。\n2. PARTITION BY y 保证跨年时累计重新归零，否则 2025 年的 YTD 会把 2024 年也累进去。\n3. 累计同比与单月同比同构，都是“错一年对齐”，区别只在被对齐的度量。",
  "pitfalls": [
   "忘记 PARTITION BY y，累计跨年不归零",
   "ORDER BY 写成 ORDER BY gmv，累计顺序变成按金额而非按月",
   "用 SUM(gmv) OVER () 无排序，得到的是全年总和而非累计"
  ],
  "capability_points": [
   "growth.ytd",
   "growth.yoy",
   "growth.window_frame",
   "growth.safe_div"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 9.6,
   "columns": [
    "mon",
    "ytd_2025",
    "ytd_2024",
    "ytd_yoy_rate"
   ],
   "rows": [
    [
     1,
     150996656.63,
     147819891.81,
     0.0215
    ],
    [
     2,
     284312348.49,
     279340712.6,
     0.0178
    ],
    [
     3,
     433125091.21,
     425167165.56,
     0.0187
    ],
    [
     4,
     572508535.15,
     566305237.34,
     0.011
    ],
    [
     5,
     717884952.64,
     712850149.51,
     0.0071
    ],
    [
     6,
     857942453.79,
     856328855.23,
     0.0019
    ],
    [
     7,
     1007773222.24,
     996126147.67,
     0.0117
    ],
    [
     8,
     1155679441.92,
     1144000453.58,
     0.0102
    ],
    [
     9,
     1299660337.82,
     1288411067.23,
     0.0087
    ],
    [
     10,
     1445009991.57,
     1431700328.76,
     0.0093
    ],
    [
     11,
     1580603866.41,
     1575392330.01,
     0.0033
    ],
    [
     12,
     1731866070.32,
     1723808035.6,
     0.0047
    ]
   ],
   "row_count": 12,
   "translated_sql": "WITH monthly AS (\n    SELECT YEAR(o.order_time) AS y,\n           MONTH(o.order_time) AS m,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    WHERE o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n),\nytd AS (\n    SELECT y, m,\n           SUM(gmv) OVER (PARTITION BY y ORDER BY m\n                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS ytd_gmv\n    FROM monthly\n)\nSELECT cur.m AS mon,\n       cur.ytd_gmv AS ytd_2025,\n       prev.ytd_gmv AS ytd_2024,\n       ROUND((cur.ytd_gmv - prev.ytd_gmv) / NULLIF(prev.ytd_gmv, 0), 4) AS ytd_yoy_rate\nFROM ytd cur\nLEFT JOIN ytd prev\n       ON prev.m = cur.m\n      AND prev.y = cur.y - 1\nWHERE cur.y = 2025\nORDER BY cur.m;",
   "signature": {
    "tables": [
     "orders",
     "order_items"
    ],
    "keywords": [
     "OVER",
     "PARTITION BY",
     "SUM(",
     "LEFT JOIN",
     "JOIN",
     "NOT IN",
     "NULLIF",
     "ROUND(",
     "YEAR(",
     "MONTH(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     150996656.63,
     147819891.81,
     0.0215
    ],
    [
     2,
     302167163.98,
     296883309.35,
     0.02
    ],
    [
     3,
     433125091.21,
     425167165.56,
     0.0187
    ],
    [
     4,
     608462071.16,
     601869206.24,
     0.01
    ],
    [
     5,
     717884952.64,
     712850149.51,
     0.0071
    ],
    [
     6,
     911821239.89,
     910106307.34,
     0.0
    ],
    [
     7,
     1007773222.24,
     996126147.67,
     0.0117
    ],
    [
     8,
     1228256110.87,
     1215843682.06,
     0.01
    ],
    [
     9,
     1299660337.82,
     1288411067.23,
     0.0087
    ],
    [
     10,
     1535756619.04,
     1521611109.41,
     0.01
    ],
    [
     11,
     1580603866.41,
     1575392330.01,
     0.0033
    ]
   ],
   "actual_row_count": 11,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      284312348.49,
      279340712.6,
      0.0178
     ],
     "actual": [
      2,
      302167163.98,
      296883309.35,
      0.02
     ]
    },
    {
     "row": 4,
     "expected": [
      4,
      572508535.15,
      566305237.34,
      0.011
     ],
     "actual": [
      4,
      608462071.16,
      601869206.24,
      0.01
     ]
    },
    {
     "row": 6,
     "expected": [
      6,
      857942453.79,
      856328855.23,
      0.0019
     ],
     "actual": [
      6,
      911821239.89,
      910106307.34,
      0.0
     ]
    },
    {
     "row": 8,
     "expected": [
      8,
      1155679441.92,
      1144000453.58,
      0.0102
     ],
     "actual": [
      8,
      1228256110.87,
      1215843682.06,
      0.01
     ]
    },
    {
     "row": 10,
     "expected": [
      10,
      1445009991.57,
      1431700328.76,
      0.0093
     ],
     "actual": [
      10,
      1535756619.04,
      1521611109.41,
      0.01
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-growth-004": {
  "id": "shop-growth-004",
  "dataset": "shop",
  "scenario": "growth",
  "chain": "shop-growth-chain-a",
  "chain_step": 4,
  "title": "分渠道月度 GMV 环比（组内错行）",
  "business_prompt": "渠道运营要分渠道看：“2025 年每个渠道、每个月的实付 GMV 和环比增长率。\n 注意每个渠道各自跟自己的上个月比，别串到别的渠道去了。”",
  "context_notes": [
   "渠道取 orders.channel_id 关联 dim_channel.channel_name",
   "环比 = (本月 - 本渠道上月) / 本渠道上月；1 月因为没有上月，环比为 NULL",
   "GMV 口径同前：order_items.item_amount，排除 cancelled/refunded，pay_time 非空"
  ],
  "tables": [
   "orders",
   "order_items",
   "dim_channel"
  ],
  "expected_columns": [
   {
    "name": "channel_name",
    "type": "string"
   },
   {
    "name": "mon",
    "type": "int"
   },
   {
    "name": "gmv",
    "type": "decimal"
   },
   {
    "name": "prev_gmv",
    "type": "decimal"
   },
   {
    "name": "mom_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 1000,
  "constraints": {
   "must_match": [
    {
     "pattern": "partition\\s+by",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "LAG 默认在整个结果集里错行，必须用 PARTITION BY channel_name 把每个渠道隔开。",
   "PARTITION BY 决定“在谁内部错行”，ORDER BY 决定“按什么顺序错行”。",
   "1 月的 prev_gmv 天然为 NULL，环比也应为 NULL，不要 COALESCE 成 0。"
  ],
  "reference_sql": "WITH monthly AS (\n    SELECT c.channel_name,\n           MONTH(o.order_time) AS mon,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_channel c ON c.channel_id = o.channel_id\n    WHERE o.order_time >= '2025-01-01'\n      AND o.order_time <  '2026-01-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n)\nSELECT channel_name,\n       mon,\n       gmv,\n       LAG(gmv) OVER (PARTITION BY channel_name ORDER BY mon) AS prev_gmv,\n       ROUND((gmv - LAG(gmv) OVER (PARTITION BY channel_name ORDER BY mon))\n           / NULLIF(LAG(gmv) OVER (PARTITION BY channel_name ORDER BY mon), 0), 4) AS mom_rate\nFROM monthly\nORDER BY channel_name, mon;",
  "alt_solutions": [
   "WITH monthly AS (\n    SELECT c.channel_name,\n           MONTH(o.order_time) AS mon,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_channel c ON c.channel_id = o.channel_id\n    WHERE o.order_time >= '2025-01-01'\n      AND o.order_time <  '2026-01-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n),\nwithprev AS (\n    SELECT channel_name, mon, gmv,\n           LAG(gmv) OVER (PARTITION BY channel_name ORDER BY mon) AS prev_gmv\n    FROM monthly\n)\nSELECT channel_name, mon, gmv, prev_gmv,\n       ROUND((gmv - prev_gmv) / NULLIF(prev_gmv, 0), 4) AS mom_rate\nFROM withprev\nORDER BY channel_name, mon;"
  ],
  "explanation": "1. PARTITION BY 是窗口函数的“分组墙”，没有它 LAG 会跨渠道取到别人的上月。\n2. 重复三次 LAG 表达式可读性差，推荐先在 CTE 里落一列 prev_gmv 再算比率。\n3. 每个渠道的首月 prev_gmv 为 NULL，是正确结果而不是缺陷。",
  "pitfalls": [
   "漏写 PARTITION BY，渠道 A 的 1 月拿到渠道 B 的 12 月做基期",
   "ORDER BY 只写在最外层 SELECT，窗口内部没有排序 → LAG 结果不确定",
   "把 NULL 环比 COALESCE 成 0，掩盖“无基期”这一事实"
  ],
  "capability_points": [
   "growth.mom",
   "window.partition",
   "growth.safe_div"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 11.7,
   "columns": [
    "channel_name",
    "mon",
    "gmv",
    "prev_gmv",
    "mom_rate"
   ],
   "rows": [
    [
     "App Store",
     1,
     26739928.12,
     null,
     null
    ],
    [
     "App Store",
     2,
     23775174.16,
     26739928.12,
     -0.1109
    ],
    [
     "App Store",
     3,
     26482086.23,
     23775174.16,
     0.1139
    ],
    [
     "App Store",
     4,
     24083100.52,
     26482086.23,
     -0.0906
    ],
    [
     "App Store",
     5,
     24220357.88,
     24083100.52,
     0.0057
    ],
    [
     "App Store",
     6,
     22260798.0,
     24220357.88,
     -0.0809
    ],
    [
     "App Store",
     7,
     23889268.54,
     22260798.0,
     0.0732
    ],
    [
     "App Store",
     8,
     25307749.92,
     23889268.54,
     0.0594
    ],
    [
     "App Store",
     9,
     25008584.37,
     25307749.92,
     -0.0118
    ],
    [
     "App Store",
     10,
     24974168.42,
     25008584.37,
     -0.0014
    ],
    [
     "App Store",
     11,
     21681339.75,
     24974168.42,
     -0.1318
    ],
    [
     "App Store",
     12,
     25361880.9,
     21681339.75,
     0.1698
    ],
    [
     "天猫旗舰店",
     1,
     25108093.14,
     null,
     null
    ],
    [
     "天猫旗舰店",
     2,
     21021262.13,
     25108093.14,
     -0.1628
    ],
    [
     "天猫旗舰店",
     3,
     24765506.62,
     21021262.13,
     0.1781
    ]
   ],
   "row_count": 72,
   "translated_sql": "WITH monthly AS (\n    SELECT c.channel_name,\n           MONTH(o.order_time) AS mon,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_channel c ON c.channel_id = o.channel_id\n    WHERE o.order_time >= '2025-01-01'\n      AND o.order_time <  '2026-01-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n)\nSELECT channel_name,\n       mon,\n       gmv,\n       LAG(gmv) OVER (PARTITION BY channel_name ORDER BY mon) AS prev_gmv,\n       ROUND((gmv - LAG(gmv) OVER (PARTITION BY channel_name ORDER BY mon))\n           / NULLIF(LAG(gmv) OVER (PARTITION BY channel_name ORDER BY mon), 0), 4) AS mom_rate\nFROM monthly\nORDER BY channel_name, mon;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "dim_channel"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "PARTITION BY",
     "SUM(",
     "JOIN",
     "NOT IN",
     "NULLIF",
     "ROUND(",
     "MONTH(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "App Store",
     1,
     26739928.12,
     null,
     null
    ],
    [
     "App Store",
     2,
     26780356.17,
     30119855.03,
     -0.12
    ],
    [
     "App Store",
     3,
     26482086.23,
     23775174.16,
     0.1139
    ],
    [
     "App Store",
     4,
     27127204.43,
     29829421.93,
     -0.1
    ],
    [
     "App Store",
     5,
     24220357.88,
     24083100.52,
     0.0057
    ],
    [
     "App Store",
     6,
     25074562.87,
     27281811.12,
     -0.09
    ],
    [
     "App Store",
     7,
     23889268.54,
     22260798.0,
     0.0732
    ],
    [
     "App Store",
     9,
     28506649.51,
     26908872.08,
     0.07
    ],
    [
     "App Store",
     9,
     25008584.37,
     25307749.92,
     -0.0118
    ],
    [
     "App Store",
     11,
     28130903.31,
     28169669.43,
     -0.0
    ],
    [
     "App Store",
     11,
     21681339.75,
     24974168.42,
     -0.1318
    ],
    [
     "App Store",
     13,
     28567622.65,
     24421861.09,
     0.19
    ],
    [
     "天猫旗舰店",
     1,
     25108093.14,
     null,
     null
    ],
    [
     "天猫旗舰店",
     2,
     23678349.66,
     28281756.11,
     -0.18
    ]
   ],
   "actual_row_count": 71,
   "diff": [
    {
     "row": 2,
     "expected": [
      "App Store",
      2,
      23775174.16,
      26739928.12,
      -0.1109
     ],
     "actual": [
      "App Store",
      2,
      26780356.17,
      30119855.03,
      -0.12
     ]
    },
    {
     "row": 4,
     "expected": [
      "App Store",
      4,
      24083100.52,
      26482086.23,
      -0.0906
     ],
     "actual": [
      "App Store",
      4,
      27127204.43,
      29829421.93,
      -0.1
     ]
    },
    {
     "row": 6,
     "expected": [
      "App Store",
      6,
      22260798.0,
      24220357.88,
      -0.0809
     ],
     "actual": [
      "App Store",
      6,
      25074562.87,
      27281811.12,
      -0.09
     ]
    },
    {
     "row": 8,
     "expected": [
      "App Store",
      8,
      25307749.92,
      23889268.54,
      0.0594
     ],
     "actual": [
      "App Store",
      9,
      28506649.51,
      26908872.08,
      0.07
     ]
    },
    {
     "row": 10,
     "expected": [
      "App Store",
      10,
      24974168.42,
      25008584.37,
      -0.0014
     ],
     "actual": [
      "App Store",
      11,
      28130903.31,
      28169669.43,
      -0.0
     ]
    }
   ],
   "hardcode_markers": [
    "App Store",
    "天猫旗舰店"
   ]
  }
 },
 "shop-pivot-001": {
  "id": "shop-pivot-001",
  "dataset": "shop",
  "scenario": "pivot",
  "chain": "shop-pivot-chain-a",
  "chain_step": 1,
  "title": "各品类季度实付 GMV 透视（长转宽）",
  "business_prompt": "财务要一张透视表：“把 2025 年各一级品类的实付 GMV，按季度拆成 Q1~Q4 四列，\n 每行一个品类，按品类名升序。我要直接贴进 Excel。”",
  "context_notes": [
   "实付 = order_items.item_amount 之和；排除 cancelled/refunded",
   "MySQL 没有 PIVOT，用条件聚合 SUM(CASE WHEN ... THEN item_amount ELSE 0 END) 手写列",
   "季度来自 dim_date.q（通过订单日期关联 dim_date；用 CAST(order_time AS DATE) 关联 date_key）"
  ],
  "tables": [
   "orders",
   "order_items",
   "dim_product",
   "dim_date"
  ],
  "expected_columns": [
   {
    "name": "cat_l1",
    "type": "string"
   },
   {
    "name": "q1_gmv",
    "type": "decimal"
   },
   {
    "name": "q2_gmv",
    "type": "decimal"
   },
   {
    "name": "q3_gmv",
    "type": "decimal"
   },
   {
    "name": "q4_gmv",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "一行一个品类，SELECT 里写 4 个 SUM(CASE WHEN q=1 THEN item_amount ELSE 0 END) 这样的列。",
   "季度来自 dim_date 表：把 order_time 转成日期后 JOIN dim_date.date_key 取 q。",
   "ELSE 0 不能省，否则 NULL 参与 SUM 没问题但语义不清晰；SUM 会自动忽略 NULL。"
  ],
  "reference_sql": "SELECT p.cat_l1,\n       SUM(CASE WHEN d.q = 1 THEN oi.item_amount ELSE 0 END) AS q1_gmv,\n       SUM(CASE WHEN d.q = 2 THEN oi.item_amount ELSE 0 END) AS q2_gmv,\n       SUM(CASE WHEN d.q = 3 THEN oi.item_amount ELSE 0 END) AS q3_gmv,\n       SUM(CASE WHEN d.q = 4 THEN oi.item_amount ELSE 0 END) AS q4_gmv\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nJOIN dim_date d ON d.date_key = CAST(o.order_time AS DATE)\nWHERE o.order_time >= '2025-01-01'\n  AND o.order_time <  '2026-01-01'\n  AND o.status NOT IN ('cancelled', 'refunded')\nGROUP BY p.cat_l1\nORDER BY p.cat_l1;",
  "alt_solutions": [
   "SELECT p.cat_l1,\n       SUM(CASE WHEN d.q = 1 THEN oi.item_amount ELSE 0 END) AS q1_gmv,\n       SUM(CASE WHEN d.q = 2 THEN oi.item_amount ELSE 0 END) AS q2_gmv,\n       SUM(CASE WHEN d.q = 3 THEN oi.item_amount ELSE 0 END) AS q3_gmv,\n       SUM(CASE WHEN d.q = 4 THEN oi.item_amount ELSE 0 END) AS q4_gmv\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nJOIN dim_date d ON d.date_key = CAST(o.order_time AS DATE)\nWHERE o.status NOT IN ('cancelled', 'refunded')\n  AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\nGROUP BY p.cat_l1\nORDER BY p.cat_l1;"
  ],
  "explanation": "1. 长转宽：用 4 个条件聚合列把“季度”这个维度从行折叠成列。\n2. 季度来源：订单时间 JOIN dim_date 取 q 字段（MySQL 无 generate_series，靠物理日期维表）。\n3. 口径：实付落到 order_items 求和，并排除 cancelled/refunded。",
  "pitfalls": [
   "用 PIVOT/UNPIVOT（PG/DuckDB 语法），本训练器模拟 MySQL，写了会被拦截",
   "用 MONTH(order_time) 自己算季度，绕过了 dim_date，失去“日期维表补全”的训练点",
   "忘记排除 cancelled/refunded，四列金额虚高"
  ],
  "capability_points": [
   "pivot.long2wide",
   "pivot.multi_metric",
   "growth.date_spine"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 22.1,
   "columns": [
    "cat_l1",
    "q1_gmv",
    "q2_gmv",
    "q3_gmv",
    "q4_gmv"
   ],
   "rows": [
    [
     "家电",
     123706331.42,
     122699037.91,
     128062738.53,
     123277524.87
    ],
    [
     "手机",
     143773445.68,
     139781495.77,
     143247101.03,
     140230830.19
    ],
    [
     "服饰",
     11967996.71,
     12231120.94,
     12457585.2,
     12391747.55
    ],
    [
     "电脑",
     201395070.75,
     197335532.88,
     205523408.54,
     207668802.69
    ],
    [
     "美妆",
     16448020.53,
     16811865.96,
     16863874.71,
     16533062.38
    ],
    [
     "食品",
     2757796.42,
     2772859.63,
     2793573.61,
     2750113.54
    ]
   ],
   "row_count": 6,
   "translated_sql": "SELECT p.cat_l1,\n       SUM(CASE WHEN d.q = 1 THEN oi.item_amount ELSE 0 END) AS q1_gmv,\n       SUM(CASE WHEN d.q = 2 THEN oi.item_amount ELSE 0 END) AS q2_gmv,\n       SUM(CASE WHEN d.q = 3 THEN oi.item_amount ELSE 0 END) AS q3_gmv,\n       SUM(CASE WHEN d.q = 4 THEN oi.item_amount ELSE 0 END) AS q4_gmv\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nJOIN dim_product p ON p.product_id = oi.product_id\nJOIN dim_date d ON d.date_key = CAST(o.order_time AS DATE)\nWHERE o.order_time >= '2025-01-01'\n  AND o.order_time <  '2026-01-01'\n  AND o.status NOT IN ('cancelled', 'refunded')\nGROUP BY p.cat_l1\nORDER BY p.cat_l1;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "dim_product",
     "dim_date"
    ],
    "keywords": [
     "CASE WHEN",
     "SUM(",
     "JOIN",
     "NOT IN"
    ]
   },
   "actual_rows": [
    [
     "家电",
     123706331.42,
     122699037.91,
     128062738.53,
     123277524.87
    ],
    [
     "手机",
     164462444.51,
     159896053.01,
     163860358.87,
     160410046.65
    ],
    [
     "服饰",
     11967996.71,
     12231120.94,
     12457585.2,
     12391747.55
    ],
    [
     "电脑",
     230375821.43,
     225732116.06,
     235098227.03,
     237552343.4
    ],
    [
     "美妆",
     16448020.53,
     16811865.96,
     16863874.71,
     16533062.38
    ]
   ],
   "actual_row_count": 5,
   "diff": [
    {
     "row": 2,
     "expected": [
      "手机",
      143773445.68,
      139781495.77,
      143247101.03,
      140230830.19
     ],
     "actual": [
      "手机",
      164462444.51,
      159896053.01,
      163860358.87,
      160410046.65
     ]
    },
    {
     "row": 4,
     "expected": [
      "电脑",
      201395070.75,
      197335532.88,
      205523408.54,
      207668802.69
     ],
     "actual": [
      "电脑",
      230375821.43,
      225732116.06,
      235098227.03,
      237552343.4
     ]
    }
   ],
   "hardcode_markers": [
    "家电",
    "手机",
    "服饰",
    "电脑",
    "美妆",
    "食品"
   ]
  }
 },
 "shop-pivot-002": {
  "id": "shop-pivot-002",
  "dataset": "shop",
  "scenario": "pivot",
  "chain": "shop-pivot-chain-a",
  "chain_step": 2,
  "title": "三个金额指标宽转长（UNPIVOT 手写版）",
  "business_prompt": "数据平台要把宽表灌进指标系统：“2025 年按月，把 total_amount、discount_amount、\n pay_amount 三个指标拆成『月份 / 指标名 / 指标值』三列的长表。”",
  "context_notes": [
   "只统计 status NOT IN ('cancelled','refunded') 且 pay_time 非空的订单",
   "metric_name 必须精确输出 'total_amount' / 'discount_amount' / 'pay_amount'",
   "MySQL 没有 UNPIVOT，标准做法是三段 UNION ALL"
  ],
  "tables": [
   "orders"
  ],
  "expected_columns": [
   {
    "name": "ym",
    "type": "string"
   },
   {
    "name": "metric_name",
    "type": "string"
   },
   {
    "name": "metric_value",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 1000,
  "constraints": {
   "must_match": [
    {
     "pattern": "union\\s+all",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": [
    {
     "pattern": "\\bunpivot\\b",
     "flags": "is",
     "reason": ""
    }
   ]
  },
  "hints": [
   "一个指标写一段 SELECT，常量列 'total_amount' AS metric_name 就是“列名变成值”。",
   "三段的列数、列顺序、列类型必须完全一致，才能 UNION ALL。",
   "用 UNION ALL 不要用 UNION：后者会去重，把金额恰好相同的行吃掉。"
  ],
  "reference_sql": "SELECT DATE_FORMAT(order_time, '%Y-%m') AS ym,\n       'total_amount' AS metric_name,\n       SUM(total_amount) AS metric_value\nFROM orders\nWHERE order_time >= '2025-01-01' AND order_time < '2026-01-01'\n  AND status NOT IN ('cancelled', 'refunded')\n  AND pay_time IS NOT NULL\nGROUP BY 1\nUNION ALL\nSELECT DATE_FORMAT(order_time, '%Y-%m') AS ym,\n       'discount_amount' AS metric_name,\n       SUM(discount_amount) AS metric_value\nFROM orders\nWHERE order_time >= '2025-01-01' AND order_time < '2026-01-01'\n  AND status NOT IN ('cancelled', 'refunded')\n  AND pay_time IS NOT NULL\nGROUP BY 1\nUNION ALL\nSELECT DATE_FORMAT(order_time, '%Y-%m') AS ym,\n       'pay_amount' AS metric_name,\n       SUM(pay_amount) AS metric_value\nFROM orders\nWHERE order_time >= '2025-01-01' AND order_time < '2026-01-01'\n  AND status NOT IN ('cancelled', 'refunded')\n  AND pay_time IS NOT NULL\nGROUP BY 1\nORDER BY ym, metric_name;",
  "alt_solutions": [
   "WITH base AS (\n    SELECT DATE_FORMAT(order_time, '%Y-%m') AS ym,\n           SUM(total_amount)    AS t,\n           SUM(discount_amount) AS d,\n           SUM(pay_amount)      AS p\n    FROM orders\n    WHERE order_time >= '2025-01-01' AND order_time < '2026-01-01'\n      AND status NOT IN ('cancelled', 'refunded')\n      AND pay_time IS NOT NULL\n    GROUP BY 1\n)\nSELECT ym, 'total_amount' AS metric_name, t AS metric_value FROM base\nUNION ALL\nSELECT ym, 'discount_amount', d FROM base\nUNION ALL\nSELECT ym, 'pay_amount', p FROM base\nORDER BY ym, metric_name;"
  ],
  "explanation": "1. 宽转长的本质：把“列名”下沉成一列的值，把“列值”下沉成另一列的值。\n2. 常量列 'xxx' AS metric_name 就是承载原列名的地方。\n3. 先聚合一次再 UNION ALL（alt 写法）只扫一遍表，比三段各扫一遍高效。",
  "pitfalls": [
   "用 UNION 而非 UNION ALL，金额相同的行被静默去重",
   "三段的 SELECT 列顺序不一致，结果串列但不报错",
   "直接写 UNPIVOT，在 MySQL 环境会被拦截"
  ],
  "capability_points": [
   "pivot.wide2long",
   "pivot.union_all",
   "pivot.constant_column"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 7.6,
   "columns": [
    "ym",
    "metric_name",
    "metric_value"
   ],
   "rows": [
    [
     "2025-01",
     "discount_amount",
     7525301.78
    ],
    [
     "2025-01",
     "pay_amount",
     143471354.85
    ],
    [
     "2025-01",
     "total_amount",
     150996656.63
    ],
    [
     "2025-02",
     "discount_amount",
     6716705.29
    ],
    [
     "2025-02",
     "pay_amount",
     126598986.57
    ],
    [
     "2025-02",
     "total_amount",
     133315691.86
    ],
    [
     "2025-03",
     "discount_amount",
     7447776.05
    ],
    [
     "2025-03",
     "pay_amount",
     141347245.42
    ],
    [
     "2025-03",
     "total_amount",
     148795021.47
    ],
    [
     "2025-04",
     "discount_amount",
     6977583.27
    ],
    [
     "2025-04",
     "pay_amount",
     132405860.67
    ],
    [
     "2025-04",
     "total_amount",
     139383443.94
    ],
    [
     "2025-05",
     "discount_amount",
     7255585.69
    ],
    [
     "2025-05",
     "pay_amount",
     138120831.8
    ],
    [
     "2025-05",
     "total_amount",
     145376417.49
    ]
   ],
   "row_count": 36,
   "translated_sql": "SELECT strftime(order_time, '%Y-%m') AS ym,\n       'total_amount' AS metric_name,\n       SUM(total_amount) AS metric_value\nFROM orders\nWHERE order_time >= '2025-01-01' AND order_time < '2026-01-01'\n  AND status NOT IN ('cancelled', 'refunded')\n  AND pay_time IS NOT NULL\nGROUP BY 1\nUNION ALL\nSELECT strftime(order_time, '%Y-%m') AS ym,\n       'discount_amount' AS metric_name,\n       SUM(discount_amount) AS metric_value\nFROM orders\nWHERE order_time >= '2025-01-01' AND order_time < '2026-01-01'\n  AND status NOT IN ('cancelled', 'refunded')\n  AND pay_time IS NOT NULL\nGROUP BY 1\nUNION ALL\nSELECT strftime(order_time, '%Y-%m') AS ym,\n       'pay_amount' AS metric_name,\n       SUM(pay_amount) AS metric_value\nFROM orders\nWHERE order_time >= '2025-01-01' AND order_time < '2026-01-01'\n  AND status NOT IN ('cancelled', 'refunded')\n  AND pay_time IS NOT NULL\nGROUP BY 1\nORDER BY ym, metric_name;",
   "signature": {
    "tables": [
     "orders"
    ],
    "keywords": [
     "UNION ALL",
     "SUM(",
     "DATE_FORMAT",
     "NOT IN"
    ]
   },
   "actual_rows": [
    [
     "2025-01",
     "discount_amount",
     7525301.78
    ],
    [
     "2025-01",
     "pay_amount",
     150314938.48
    ],
    [
     "2025-01",
     "total_amount",
     150996656.63
    ],
    [
     "2025-02",
     "discount_amount",
     7037092.13
    ],
    [
     "2025-02",
     "pay_amount",
     126598986.57
    ],
    [
     "2025-02",
     "total_amount",
     139674850.36
    ],
    [
     "2025-03",
     "discount_amount",
     7447776.05
    ],
    [
     "2025-03",
     "pay_amount",
     148089509.03
    ],
    [
     "2025-03",
     "total_amount",
     148795021.47
    ],
    [
     "2025-04",
     "discount_amount",
     7310413.99
    ],
    [
     "2025-04",
     "pay_amount",
     132405860.67
    ],
    [
     "2025-04",
     "total_amount",
     146032034.22
    ],
    [
     "2025-05",
     "discount_amount",
     7255585.69
    ],
    [
     "2025-05",
     "pay_amount",
     144709195.48
    ]
   ],
   "actual_row_count": 35,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2025-01",
      "pay_amount",
      143471354.85
     ],
     "actual": [
      "2025-01",
      "pay_amount",
      150314938.48
     ]
    },
    {
     "row": 4,
     "expected": [
      "2025-02",
      "discount_amount",
      6716705.29
     ],
     "actual": [
      "2025-02",
      "discount_amount",
      7037092.13
     ]
    },
    {
     "row": 6,
     "expected": [
      "2025-02",
      "total_amount",
      133315691.86
     ],
     "actual": [
      "2025-02",
      "total_amount",
      139674850.36
     ]
    },
    {
     "row": 8,
     "expected": [
      "2025-03",
      "pay_amount",
      141347245.42
     ],
     "actual": [
      "2025-03",
      "pay_amount",
      148089509.03
     ]
    },
    {
     "row": 10,
     "expected": [
      "2025-04",
      "discount_amount",
      6977583.27
     ],
     "actual": [
      "2025-04",
      "discount_amount",
      7310413.99
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-pivot-003": {
  "id": "shop-pivot-003",
  "dataset": "shop",
  "scenario": "pivot",
  "chain": "shop-pivot-chain-a",
  "chain_step": 3,
  "title": "年龄段 × 性别 用户数交叉表（含行合计）",
  "business_prompt": "用研要一张交叉表：“行是年龄段，列是性别 M / F / U，格子里是用户数，\n 最后再加一列这一行的合计，按年龄段升序。”",
  "context_notes": [
   "只统计 users 表全量用户",
   "列名固定为 male_cnt / female_cnt / unknown_cnt / total_cnt",
   "性别取值只有 M / F / U，不存在 NULL"
  ],
  "tables": [
   "users"
  ],
  "expected_columns": [
   {
    "name": "age_band",
    "type": "string"
   },
   {
    "name": "male_cnt",
    "type": "int"
   },
   {
    "name": "female_cnt",
    "type": "int"
   },
   {
    "name": "unknown_cnt",
    "type": "int"
   },
   {
    "name": "total_cnt",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "交叉表 = GROUP BY 行维度 + 每个列维度取值一个条件聚合。",
   "计数用 COUNT(CASE WHEN gender='M' THEN 1 END)，注意 COUNT 会忽略 NULL 所以不用写 ELSE。",
   "行合计直接 COUNT(*)，不需要把三列加起来。"
  ],
  "reference_sql": "SELECT age_band,\n       COUNT(CASE WHEN gender = 'M' THEN 1 END) AS male_cnt,\n       COUNT(CASE WHEN gender = 'F' THEN 1 END) AS female_cnt,\n       COUNT(CASE WHEN gender = 'U' THEN 1 END) AS unknown_cnt,\n       COUNT(*) AS total_cnt\nFROM users\nGROUP BY age_band\nORDER BY age_band;",
  "alt_solutions": [
   "SELECT age_band,\n       SUM(CASE WHEN gender = 'M' THEN 1 ELSE 0 END) AS male_cnt,\n       SUM(CASE WHEN gender = 'F' THEN 1 ELSE 0 END) AS female_cnt,\n       SUM(CASE WHEN gender = 'U' THEN 1 ELSE 0 END) AS unknown_cnt,\n       COUNT(user_id) AS total_cnt\nFROM users\nGROUP BY age_band\nORDER BY age_band;"
  ],
  "explanation": "1. COUNT(CASE WHEN 条件 THEN 1 END) 与 SUM(CASE WHEN 条件 THEN 1 ELSE 0 END) 等价。\n2. COUNT 忽略 NULL 是条件计数的关键机制：不满足条件时返回 NULL 即被跳过。\n3. 行合计用 COUNT(*) 更稳：如果将来新增性别取值，三列相加会漏掉。",
  "pitfalls": [
   "写 COUNT(CASE WHEN gender='M' THEN 1 ELSE 0 END)，ELSE 0 让 COUNT 把所有行都算上，三列都等于总数",
   "用 total_cnt = male + female + unknown，未来新增枚举值会漏计",
   "忘记 GROUP BY age_band，只得到一行全局汇总"
  ],
  "capability_points": [
   "pivot.crosstab",
   "pivot.conditional_count",
   "agg.count_semantics"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 2.5,
   "columns": [
    "age_band",
    "male_cnt",
    "female_cnt",
    "unknown_cnt",
    "total_cnt"
   ],
   "rows": [
    [
     "18-25",
     3421,
     3315,
     767,
     7503
    ],
    [
     "26-35",
     4656,
     4688,
     1026,
     10370
    ],
    [
     "36-45",
     3001,
     2948,
     663,
     6612
    ],
    [
     "46-55",
     1636,
     1672,
     360,
     3668
    ],
    [
     "55+",
     834,
     844,
     169,
     1847
    ]
   ],
   "row_count": 5,
   "translated_sql": "SELECT age_band,\n       COUNT(CASE WHEN gender = 'M' THEN 1 END) AS male_cnt,\n       COUNT(CASE WHEN gender = 'F' THEN 1 END) AS female_cnt,\n       COUNT(CASE WHEN gender = 'U' THEN 1 END) AS unknown_cnt,\n       COUNT(*) AS total_cnt\nFROM users\nGROUP BY age_band\nORDER BY age_band;",
   "signature": {
    "tables": [
     "users"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT("
    ]
   },
   "actual_rows": [
    [
     "18-25",
     3421,
     3315,
     767,
     7503
    ],
    [
     "26-35",
     5337,
     5373,
     1176,
     11887
    ],
    [
     "36-45",
     3001,
     2948,
     663,
     6612
    ],
    [
     "46-55",
     1875,
     1916,
     412,
     4204
    ]
   ],
   "actual_row_count": 4,
   "diff": [
    {
     "row": 2,
     "expected": [
      "26-35",
      4656,
      4688,
      1026,
      10370
     ],
     "actual": [
      "26-35",
      5337,
      5373,
      1176,
      11887
     ]
    },
    {
     "row": 4,
     "expected": [
      "46-55",
      1636,
      1672,
      360,
      3668
     ],
     "actual": [
      "46-55",
      1875,
      1916,
      412,
      4204
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-pivot-004": {
  "id": "shop-pivot-004",
  "dataset": "shop",
  "scenario": "pivot",
  "chain": "shop-pivot-chain-a",
  "chain_step": 4,
  "title": "每个品类的 Top3 城市折叠成一行（字符串聚合）",
  "business_prompt": "周报要一句话概括：“2025 年每个一级品类，按 GMV 取前 3 名城市，\n 把城市名用逗号拼成一列，形如『上海,北京,深圳』，按品类名升序。”",
  "context_notes": [
   "城市来自 users.city_id → dim_city.city_name；users.city_id 可能为 NULL，这类订单直接剔除",
   "GMV = order_items.item_amount；排除 cancelled/refunded，pay_time 非空",
   "拼接顺序必须按 GMV 从高到低；GMV 相同时按 city_name 升序保证结果确定"
  ],
  "tables": [
   "orders",
   "order_items",
   "users",
   "dim_city"
  ],
  "expected_columns": [
   {
    "name": "cat_l1",
    "type": "string"
   },
   {
    "name": "top3_cities",
    "type": "string"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [
    {
     "pattern": "group_concat\\s*\\(",
     "flags": "is",
     "reason": ""
    }
   ],
   "must_not_match": []
  },
  "hints": [
   "分三步：先算「品类 × 城市」的 GMV，再用 ROW_NUMBER 排名，最后 GROUP_CONCAT 拼接。",
   "GROUP_CONCAT 支持内部排序：GROUP_CONCAT(city_name ORDER BY rn SEPARATOR ',')。",
   "排名要加第二排序键（city_name），否则并列时结果不稳定。"
  ],
  "reference_sql": "WITH cat_city AS (\n    SELECT p.cat_l1,\n           ci.city_name,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o      ON o.order_id = oi.order_id\n    JOIN dim_product p ON p.product_id = oi.product_id\n    JOIN users u       ON u.user_id = o.user_id\n    JOIN dim_city ci   ON ci.city_id = u.city_id\n    WHERE o.order_time >= '2025-01-01'\n      AND o.order_time <  '2026-01-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n),\nranked AS (\n    SELECT cat_l1, city_name, gmv,\n           ROW_NUMBER() OVER (PARTITION BY cat_l1 ORDER BY gmv DESC, city_name ASC) AS rn\n    FROM cat_city\n)\nSELECT cat_l1,\n       GROUP_CONCAT(city_name ORDER BY rn SEPARATOR ',') AS top3_cities\nFROM ranked\nWHERE rn <= 3\nGROUP BY cat_l1\nORDER BY cat_l1;",
  "alt_solutions": [
   "SELECT cat_l1,\n       GROUP_CONCAT(city_name ORDER BY rn SEPARATOR ',') AS top3_cities\nFROM (\n    SELECT t.cat_l1, t.city_name,\n           ROW_NUMBER() OVER (PARTITION BY t.cat_l1 ORDER BY t.gmv DESC, t.city_name) AS rn\n    FROM (\n        SELECT p.cat_l1, ci.city_name, SUM(oi.item_amount) AS gmv\n        FROM orders o\n        JOIN order_items oi ON oi.order_id = o.order_id\n        JOIN dim_product p  ON p.product_id = oi.product_id\n        JOIN users u        ON u.user_id = o.user_id\n        JOIN dim_city ci    ON ci.city_id = u.city_id\n        WHERE o.status NOT IN ('cancelled', 'refunded')\n          AND o.pay_time IS NOT NULL\n          AND o.order_time >= '2025-01-01' AND o.order_time < '2026-01-01'\n        GROUP BY 1, 2\n    ) t\n) r\nWHERE rn <= 3\nGROUP BY cat_l1\nORDER BY cat_l1;"
  ],
  "explanation": "1. 这是“行转列”的另一种形态：不是变成多列，而是折叠进一个字符串单元格。\n2. GROUP_CONCAT 的 ORDER BY 只作用于拼接顺序，与外层 ORDER BY 无关。\n3. 必须先 ROW_NUMBER 再过滤 rn<=3，窗口函数不能直接写在 WHERE 里。",
  "pitfalls": [
   "把 ROW_NUMBER() <= 3 写进 WHERE，MySQL 会报错（窗口函数不能出现在 WHERE）",
   "GROUP_CONCAT 不加 ORDER BY，拼接顺序随执行计划变化",
   "JOIN users 时忽略 city_id 为 NULL 的情况（INNER JOIN 会自动剔除，要清楚这一点）"
  ],
  "capability_points": [
   "pivot.string_agg",
   "window.row_number",
   "window.filter_after_rank"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 25.3,
   "columns": [
    "cat_l1",
    "top3_cities"
   ],
   "rows": [
    [
     "家电",
     "烟台,太原,杭州"
    ],
    [
     "手机",
     "杭州,沈阳,海口"
    ],
    [
     "服饰",
     "贵阳,杭州,长沙"
    ],
    [
     "电脑",
     "沈阳,武汉,青岛"
    ],
    [
     "美妆",
     "贵阳,大连,西安"
    ],
    [
     "食品",
     "大连,沈阳,杭州"
    ]
   ],
   "row_count": 6,
   "translated_sql": "WITH cat_city AS (\n    SELECT p.cat_l1,\n           ci.city_name,\n           SUM(oi.item_amount) AS gmv\n    FROM order_items oi\n    JOIN orders o      ON o.order_id = oi.order_id\n    JOIN dim_product p ON p.product_id = oi.product_id\n    JOIN users u       ON u.user_id = o.user_id\n    JOIN dim_city ci   ON ci.city_id = u.city_id\n    WHERE o.order_time >= '2025-01-01'\n      AND o.order_time <  '2026-01-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n      AND o.pay_time IS NOT NULL\n    GROUP BY 1, 2\n),\nranked AS (\n    SELECT cat_l1, city_name, gmv,\n           ROW_NUMBER() OVER (PARTITION BY cat_l1 ORDER BY gmv DESC, city_name ASC) AS rn\n    FROM cat_city\n)\nSELECT cat_l1,\n       string_agg(city_name, ',' ORDER BY rn) AS top3_cities\nFROM ranked\nWHERE rn <= 3\nGROUP BY cat_l1\nORDER BY cat_l1;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "users",
     "dim_city"
    ],
    "keywords": [
     "ROW_NUMBER",
     "OVER",
     "PARTITION BY",
     "GROUP_CONCAT",
     "SUM(",
     "JOIN",
     "NOT IN",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "家电",
     "烟台,太原,杭州"
    ],
    [
     "手机",
     "杭州,沈阳,海口"
    ],
    [
     "服饰",
     "贵阳,杭州,长沙"
    ],
    [
     "电脑",
     "沈阳,武汉,青岛"
    ],
    [
     "美妆",
     "贵阳,大连,西安"
    ]
   ],
   "actual_row_count": 5,
   "diff": [],
   "hardcode_markers": [
    "家电",
    "烟台,太原,杭州",
    "手机",
    "杭州,沈阳,海口",
    "服饰",
    "贵阳,杭州,长沙",
    "电脑",
    "沈阳,武汉,青岛",
    "美妆",
    "贵阳,大连,西安",
    "食品",
    "大连,沈阳,杭州"
   ]
  }
 },
 "shop-retention-001": {
  "id": "shop-retention-001",
  "dataset": "shop",
  "scenario": "retention",
  "chain": "shop-retention-chain-a",
  "chain_step": 1,
  "title": "按注册日分群的次日留存率",
  "business_prompt": "增长同学要看拉新质量：\n“按用户注册日期（到天）分群，统计每天注册的人数，\n 以及其中在注册后第 1 天（次日）就完成首次支付的人数和留存率。”",
  "context_notes": [
   "首次支付 = 该用户 MIN(pay_time) 且 status='completed'",
   "“次日”口径：pay_time 落在 [注册日+1天, 注册日+2天) 区间",
   "分母用当天注册人数（含从未支付的），因此要 LEFT JOIN 首次支付",
   "为避免跨年边界把 +1/+2 天推出数据范围，注册日限定在 2025-01-01 ~ 2025-12-30"
  ],
  "tables": [
   "users",
   "orders"
  ],
  "expected_columns": [
   {
    "name": "register_date",
    "type": "date"
   },
   {
    "name": "reg_users",
    "type": "int"
   },
   {
    "name": "d1_retained",
    "type": "int"
   },
   {
    "name": "d1_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 1000,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "先按用户聚合出“首次支付时间”MIN(pay_time)（status='completed'）。",
   "次日区间用 DATE_ADD(register_date, INTERVAL 1 DAY) 与 INTERVAL 2 DAY 框定。",
   "分母用注册人数（COUNT DISTINCT user_id），所以 users 要 LEFT JOIN 首次支付，不能 INNER JOIN。"
  ],
  "reference_sql": "WITH first_pay AS (\n    SELECT user_id, MIN(pay_time) AS fp_time\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n    GROUP BY user_id\n)\nSELECT u.register_date,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE\n           WHEN fp.fp_time >= DATE_ADD(u.register_date, INTERVAL 1 DAY)\n            AND fp.fp_time <  DATE_ADD(u.register_date, INTERVAL 2 DAY)\n           THEN u.user_id END) AS d1_retained,\n       ROUND(\n           COUNT(DISTINCT CASE\n               WHEN fp.fp_time >= DATE_ADD(u.register_date, INTERVAL 1 DAY)\n                AND fp.fp_time <  DATE_ADD(u.register_date, INTERVAL 2 DAY)\n               THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0),\n       4) AS d1_rate\nFROM users u\nLEFT JOIN first_pay fp ON fp.user_id = u.user_id\nWHERE u.register_date >= '2025-01-01'\n  AND u.register_date <= '2025-12-30'\nGROUP BY u.register_date\nORDER BY u.register_date;",
  "alt_solutions": [
   "WITH first_pay AS (\n    SELECT user_id, MIN(pay_time) AS fp_time\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n    GROUP BY user_id\n)\nSELECT u.register_date,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE\n           WHEN fp.fp_time BETWEEN u.register_date + INTERVAL 1 DAY\n                                AND u.register_date + INTERVAL 1 DAY + INTERVAL 23 HOUR\n           THEN u.user_id END) AS d1_retained,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN fp.fp_time >= u.register_date + INTERVAL 1 DAY\n            AND fp.fp_time <  u.register_date + INTERVAL 2 DAY\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d1_rate\nFROM users u\nLEFT JOIN first_pay fp ON fp.user_id = u.user_id\nWHERE u.register_date >= '2025-01-01' AND u.register_date <= '2025-12-30'\nGROUP BY u.register_date\nORDER BY u.register_date;"
  ],
  "explanation": "1. 锚点：每个用户的首次支付时间用 MIN(pay_time) 聚合。\n2. 口径：次日 = [注册日+1, 注册日+2)，用半开区间避免边界重复/遗漏。\n3. 分母：LEFT JOIN 保住未支付用户，COUNT(DISTINCT user_id) 作分母，NULLIF 防除零。",
  "pitfalls": [
   "用 INNER JOIN first_pay，分母变成“有支付的人”，留存率恒为 1 或失真",
   "次日区间写错（如用 <= 注册日+1 天，把当天也算进去）",
   "注册日没有限定上界，+1/+2 天推到 2026 之后无数据，分母分母错配"
  ],
  "capability_points": [
   "retention.anchor",
   "retention.cohort",
   "retention.nday",
   "retention.denominator"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 15.4,
   "columns": [
    "register_date",
    "reg_users",
    "d1_retained",
    "d1_rate"
   ],
   "rows": [
    [
     "2025-01-01",
     48,
     0,
     0.0
    ],
    [
     "2025-01-02",
     40,
     0,
     0.0
    ],
    [
     "2025-01-03",
     34,
     1,
     0.0294
    ],
    [
     "2025-01-04",
     36,
     1,
     0.0278
    ],
    [
     "2025-01-05",
     56,
     0,
     0.0
    ],
    [
     "2025-01-06",
     57,
     0,
     0.0
    ],
    [
     "2025-01-07",
     45,
     0,
     0.0
    ],
    [
     "2025-01-08",
     49,
     0,
     0.0
    ],
    [
     "2025-01-09",
     45,
     0,
     0.0
    ],
    [
     "2025-01-10",
     40,
     0,
     0.0
    ],
    [
     "2025-01-11",
     32,
     0,
     0.0
    ],
    [
     "2025-01-12",
     45,
     0,
     0.0
    ],
    [
     "2025-01-13",
     38,
     0,
     0.0
    ],
    [
     "2025-01-14",
     45,
     0,
     0.0
    ],
    [
     "2025-01-15",
     49,
     0,
     0.0
    ]
   ],
   "row_count": 362,
   "translated_sql": "WITH first_pay AS (\n    SELECT user_id, MIN(pay_time) AS fp_time\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n    GROUP BY user_id\n)\nSELECT u.register_date,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE\n           WHEN fp.fp_time >= (u.register_date + INTERVAL 1 DAY)\n            AND fp.fp_time <  (u.register_date + INTERVAL 2 DAY)\n           THEN u.user_id END) AS d1_retained,\n       ROUND(\n           COUNT(DISTINCT CASE\n               WHEN fp.fp_time >= (u.register_date + INTERVAL 1 DAY)\n                AND fp.fp_time <  (u.register_date + INTERVAL 2 DAY)\n               THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0),\n       4) AS d1_rate\nFROM users u\nLEFT JOIN first_pay fp ON fp.user_id = u.user_id\nWHERE u.register_date >= '2025-01-01'\n  AND u.register_date <= '2025-12-30'\nGROUP BY u.register_date\nORDER BY u.register_date;",
   "signature": {
    "tables": [
     "users",
     "orders"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT(",
     "COUNT(DISTINCT",
     "MIN(",
     "LEFT JOIN",
     "JOIN",
     "DATE_ADD",
     "INTERVAL",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "2025-01-01",
     48,
     0,
     0.0
    ],
    [
     "2025-01-02",
     42,
     0,
     0.0
    ],
    [
     "2025-01-03",
     34,
     1,
     0.0294
    ],
    [
     "2025-01-04",
     38,
     1,
     0.03
    ],
    [
     "2025-01-05",
     56,
     0,
     0.0
    ],
    [
     "2025-01-06",
     61,
     0,
     0.0
    ],
    [
     "2025-01-07",
     45,
     0,
     0.0
    ],
    [
     "2025-01-08",
     52,
     0,
     0.0
    ],
    [
     "2025-01-09",
     45,
     0,
     0.0
    ],
    [
     "2025-01-10",
     42,
     0,
     0.0
    ],
    [
     "2025-01-11",
     32,
     0,
     0.0
    ],
    [
     "2025-01-12",
     48,
     0,
     0.0
    ],
    [
     "2025-01-13",
     38,
     0,
     0.0
    ],
    [
     "2025-01-14",
     48,
     0,
     0.0
    ]
   ],
   "actual_row_count": 361,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2025-01-02",
      40,
      0,
      0.0
     ],
     "actual": [
      "2025-01-02",
      42,
      0,
      0.0
     ]
    },
    {
     "row": 4,
     "expected": [
      "2025-01-04",
      36,
      1,
      0.0278
     ],
     "actual": [
      "2025-01-04",
      38,
      1,
      0.03
     ]
    },
    {
     "row": 6,
     "expected": [
      "2025-01-06",
      57,
      0,
      0.0
     ],
     "actual": [
      "2025-01-06",
      61,
      0,
      0.0
     ]
    },
    {
     "row": 8,
     "expected": [
      "2025-01-08",
      49,
      0,
      0.0
     ],
     "actual": [
      "2025-01-08",
      52,
      0,
      0.0
     ]
    },
    {
     "row": 10,
     "expected": [
      "2025-01-10",
      40,
      0,
      0.0
     ],
     "actual": [
      "2025-01-10",
      42,
      0,
      0.0
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-retention-002": {
  "id": "shop-retention-002",
  "dataset": "shop",
  "scenario": "retention",
  "chain": "shop-retention-chain-a",
  "chain_step": 2,
  "title": "按注册月分群的 7 日留存率",
  "business_prompt": "增长同学要看“次周”留存：“按用户注册月份分群，统计每月注册人数，\n 以及注册后 7 日内（含第 7 日）完成首次支付的人数与留存率。”",
  "context_notes": [
   "首次支付 = MIN(pay_time) 且 status='completed'",
   "7 日口径：pay_time 落在 [注册日+1天, 注册日+7天]（闭区间）",
   "分母用当月注册人数；注册日上界取 2025-12-23，避免 +7 天推出数据范围"
  ],
  "tables": [
   "users",
   "orders"
  ],
  "expected_columns": [
   {
    "name": "reg_month",
    "type": "string"
   },
   {
    "name": "reg_users",
    "type": "int"
   },
   {
    "name": "d7_retained",
    "type": "int"
   },
   {
    "name": "d7_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 1000,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "先按用户聚合出首次支付时间 MIN(pay_time)。",
   "7 日窗口用 BETWEEN 注册日+1天 AND 注册日+7天。",
   "分母用注册人数（LEFT JOIN 保住未支付用户）。"
  ],
  "reference_sql": "WITH first_pay AS (\n    SELECT user_id, MIN(pay_time) AS fp\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n    GROUP BY user_id\n)\nSELECT DATE_FORMAT(u.register_date, '%Y-%m') AS reg_month,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE\n           WHEN fp.fp BETWEEN u.register_date + INTERVAL 1 DAY\n                          AND u.register_date + INTERVAL 7 DAY\n           THEN u.user_id END) AS d7_retained,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN fp.fp BETWEEN u.register_date + INTERVAL 1 DAY\n                          AND u.register_date + INTERVAL 7 DAY\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d7_rate\nFROM users u\nLEFT JOIN first_pay fp ON fp.user_id = u.user_id\nWHERE u.register_date >= '2025-01-01' AND u.register_date <= '2025-12-23'\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "WITH first_pay AS (\n    SELECT user_id, MIN(pay_time) AS fp\n    FROM orders WHERE status='completed' AND pay_time IS NOT NULL GROUP BY user_id\n)\nSELECT DATE_FORMAT(u.register_date, '%Y-%m') AS reg_month,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE WHEN fp.fp >= u.register_date + INTERVAL 1 DAY\n                           AND fp.fp <= u.register_date + INTERVAL 7 DAY\n                           THEN u.user_id END) AS d7_retained,\n       ROUND(COUNT(DISTINCT CASE WHEN fp.fp >= u.register_date + INTERVAL 1 DAY\n                               AND fp.fp <= u.register_date + INTERVAL 7 DAY\n                               THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d7_rate\nFROM users u LEFT JOIN first_pay fp ON fp.user_id = u.user_id\nWHERE u.register_date >= '2025-01-01' AND u.register_date <= '2025-12-23'\nGROUP BY 1 ORDER BY 1;"
  ],
  "explanation": "1. 锚点：首次支付 MIN(pay_time)。\n2. 7 日窗口：BETWEEN 注册日+1 与 +7（含边界）。\n3. 分母：LEFT JOIN 保住未支付用户，COUNT(DISTINCT user_id)。",
  "pitfalls": [
   "用 INNER JOIN first_pay，分母变成有支付的人，留存率失真",
   "7 日窗口写错（漏掉第 7 日或把注册当日算进去）",
   "注册日上界没限制，+7 天推出 2026 无数据"
  ],
  "capability_points": [
   "retention.anchor",
   "retention.nday",
   "retention.denominator"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 12.5,
   "columns": [
    "reg_month",
    "reg_users",
    "d7_retained",
    "d7_rate"
   ],
   "rows": [
    [
     "2025-01",
     1298,
     12,
     0.0092
    ],
    [
     "2025-02",
     1131,
     7,
     0.0062
    ],
    [
     "2025-03",
     1254,
     6,
     0.0048
    ],
    [
     "2025-04",
     1270,
     5,
     0.0039
    ],
    [
     "2025-05",
     1323,
     2,
     0.0015
    ],
    [
     "2025-06",
     1235,
     4,
     0.0032
    ],
    [
     "2025-07",
     1304,
     6,
     0.0046
    ],
    [
     "2025-08",
     1232,
     4,
     0.0032
    ],
    [
     "2025-09",
     1190,
     2,
     0.0017
    ],
    [
     "2025-10",
     1243,
     0,
     0.0
    ],
    [
     "2025-11",
     1212,
     4,
     0.0033
    ],
    [
     "2025-12",
     953,
     1,
     0.001
    ]
   ],
   "row_count": 12,
   "translated_sql": "WITH first_pay AS (\n    SELECT user_id, MIN(pay_time) AS fp\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n    GROUP BY user_id\n)\nSELECT strftime(u.register_date, '%Y-%m') AS reg_month,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE\n           WHEN fp.fp BETWEEN u.register_date + INTERVAL 1 DAY\n                          AND u.register_date + INTERVAL 7 DAY\n           THEN u.user_id END) AS d7_retained,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN fp.fp BETWEEN u.register_date + INTERVAL 1 DAY\n                          AND u.register_date + INTERVAL 7 DAY\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d7_rate\nFROM users u\nLEFT JOIN first_pay fp ON fp.user_id = u.user_id\nWHERE u.register_date >= '2025-01-01' AND u.register_date <= '2025-12-23'\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "users",
     "orders"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT(",
     "COUNT(DISTINCT",
     "MIN(",
     "LEFT JOIN",
     "JOIN",
     "DATE_FORMAT",
     "INTERVAL",
     "NULLIF",
     "ROUND(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "2025-01",
     1298,
     12,
     0.0092
    ],
    [
     "2025-02",
     1295,
     8,
     0.01
    ],
    [
     "2025-03",
     1254,
     6,
     0.0048
    ],
    [
     "2025-04",
     1454,
     5,
     0.0
    ],
    [
     "2025-05",
     1323,
     2,
     0.0015
    ],
    [
     "2025-06",
     1414,
     4,
     0.0
    ],
    [
     "2025-07",
     1304,
     6,
     0.0046
    ],
    [
     "2025-08",
     1410,
     4,
     0.0
    ],
    [
     "2025-09",
     1190,
     2,
     0.0017
    ],
    [
     "2025-10",
     1423,
     0,
     0.0
    ],
    [
     "2025-11",
     1212,
     4,
     0.0033
    ]
   ],
   "actual_row_count": 11,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2025-02",
      1131,
      7,
      0.0062
     ],
     "actual": [
      "2025-02",
      1295,
      8,
      0.01
     ]
    },
    {
     "row": 4,
     "expected": [
      "2025-04",
      1270,
      5,
      0.0039
     ],
     "actual": [
      "2025-04",
      1454,
      5,
      0.0
     ]
    },
    {
     "row": 6,
     "expected": [
      "2025-06",
      1235,
      4,
      0.0032
     ],
     "actual": [
      "2025-06",
      1414,
      4,
      0.0
     ]
    },
    {
     "row": 8,
     "expected": [
      "2025-08",
      1232,
      4,
      0.0032
     ],
     "actual": [
      "2025-08",
      1410,
      4,
      0.0
     ]
    },
    {
     "row": 10,
     "expected": [
      "2025-10",
      1243,
      0,
      0.0
     ],
     "actual": [
      "2025-10",
      1423,
      0,
      0.0
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-retention-003": {
  "id": "shop-retention-003",
  "dataset": "shop",
  "scenario": "retention",
  "chain": "shop-retention-chain-a",
  "chain_step": 3,
  "title": "D1 / D7 / D30 留存曲线一次算完",
  "business_prompt": "增长负责人要一张留存曲线表：“还是按注册月分群，一行一个月，\n 同时给我 D1、D7、D30 三个留存率，方便看衰减斜率。”",
  "context_notes": [
   "留存口径改为“行为留存”：注册后第 N 天区间内发生过任意一笔 status='completed' 的支付",
   "D1 = 第 1 天当天；D7 = 第 1~7 天；D30 = 第 1~30 天（都不含注册当天）",
   "天数差用 DATEDIFF(支付日期, 注册日期)；支付日期取 CAST(pay_time AS DATE)",
   "注册日上界取 2025-12-01，避免 +30 天推出数据范围"
  ],
  "tables": [
   "users",
   "orders"
  ],
  "expected_columns": [
   {
    "name": "reg_month",
    "type": "string"
   },
   {
    "name": "reg_users",
    "type": "int"
   },
   {
    "name": "d1_rate",
    "type": "decimal"
   },
   {
    "name": "d7_rate",
    "type": "decimal"
   },
   {
    "name": "d30_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "一次 LEFT JOIN orders，然后靠三组 COUNT(DISTINCT CASE WHEN ...) 同时算三个窗口。",
   "天数差写 DATEDIFF(CAST(o.pay_time AS DATE), u.register_date)，注意参数顺序是“后 - 前”。",
   "三个分母都是同一个 COUNT(DISTINCT u.user_id)，用 NULLIF 防除零。"
  ],
  "reference_sql": "SELECT DATE_FORMAT(u.register_date, '%Y-%m') AS reg_month,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN DATEDIFF(CAST(o.pay_time AS DATE), u.register_date) = 1\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d1_rate,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN DATEDIFF(CAST(o.pay_time AS DATE), u.register_date) BETWEEN 1 AND 7\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d7_rate,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN DATEDIFF(CAST(o.pay_time AS DATE), u.register_date) BETWEEN 1 AND 30\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d30_rate\nFROM users u\nLEFT JOIN orders o\n       ON o.user_id = u.user_id\n      AND o.status = 'completed'\n      AND o.pay_time IS NOT NULL\nWHERE u.register_date >= '2025-01-01'\n  AND u.register_date <= '2025-12-01'\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "WITH pay AS (\n    SELECT user_id, CAST(pay_time AS DATE) AS pd\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n),\nbase AS (\n    SELECT u.user_id,\n           DATE_FORMAT(u.register_date, '%Y-%m') AS reg_month,\n           DATEDIFF(p.pd, u.register_date) AS dn\n    FROM users u\n    LEFT JOIN pay p ON p.user_id = u.user_id\n    WHERE u.register_date >= '2025-01-01'\n      AND u.register_date <= '2025-12-01'\n)\nSELECT reg_month,\n       COUNT(DISTINCT user_id) AS reg_users,\n       ROUND(COUNT(DISTINCT CASE WHEN dn = 1 THEN user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT user_id), 0), 4) AS d1_rate,\n       ROUND(COUNT(DISTINCT CASE WHEN dn >= 1 AND dn <= 7 THEN user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT user_id), 0), 4) AS d7_rate,\n       ROUND(COUNT(DISTINCT CASE WHEN dn >= 1 AND dn <= 30 THEN user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT user_id), 0), 4) AS d30_rate\nFROM base\nGROUP BY reg_month\nORDER BY reg_month;"
  ],
  "explanation": "1. 一次扫描出多窗口：三个 CASE WHEN 共用同一张 JOIN 结果，避免三次子查询。\n2. 行为留存 vs 首购留存：本题只要“区间内有支付”，所以直接 JOIN 明细而不是先 MIN。\n3. 分母恒定：三条曲线共用注册人数分母，才能比较衰减速度。",
  "pitfalls": [
   "JOIN 条件写进 WHERE，LEFT JOIN 退化成 INNER JOIN，分母被截断",
   "D7 写成 BETWEEN 0 AND 7，把注册当天的支付也算进留存",
   "注册日上界没卡，最后一个月的 D30 天然缺数据，曲线看着“暴跌”"
  ],
  "capability_points": [
   "retention.nday",
   "retention.denominator",
   "retention.curve",
   "retention.boundary"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 13.5,
   "columns": [
    "reg_month",
    "reg_users",
    "d1_rate",
    "d7_rate",
    "d30_rate"
   ],
   "rows": [
    [
     "2025-01",
     1298,
     0.0069,
     0.0362,
     0.1471
    ],
    [
     "2025-02",
     1131,
     0.0035,
     0.0301,
     0.1202
    ],
    [
     "2025-03",
     1254,
     0.0048,
     0.0311,
     0.1172
    ],
    [
     "2025-04",
     1270,
     0.0039,
     0.0291,
     0.1228
    ],
    [
     "2025-05",
     1323,
     0.0023,
     0.0302,
     0.1224
    ],
    [
     "2025-06",
     1235,
     0.0065,
     0.0291,
     0.1223
    ],
    [
     "2025-07",
     1304,
     0.0061,
     0.0353,
     0.1334
    ],
    [
     "2025-08",
     1232,
     0.0024,
     0.0308,
     0.1323
    ],
    [
     "2025-09",
     1190,
     0.0017,
     0.0286,
     0.1378
    ],
    [
     "2025-10",
     1243,
     0.0032,
     0.0298,
     0.1279
    ],
    [
     "2025-11",
     1212,
     0.0041,
     0.0404,
     0.1262
    ],
    [
     "2025-12",
     35,
     0.0,
     0.0571,
     0.1714
    ]
   ],
   "row_count": 12,
   "translated_sql": "SELECT strftime(u.register_date, '%Y-%m') AS reg_month,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN date_diff('day', u.register_date, CAST(o.pay_time AS DATE)) = 1\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d1_rate,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN date_diff('day', u.register_date, CAST(o.pay_time AS DATE)) BETWEEN 1 AND 7\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d7_rate,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN date_diff('day', u.register_date, CAST(o.pay_time AS DATE)) BETWEEN 1 AND 30\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d30_rate\nFROM users u\nLEFT JOIN orders o\n       ON o.user_id = u.user_id\n      AND o.status = 'completed'\n      AND o.pay_time IS NOT NULL\nWHERE u.register_date >= '2025-01-01'\n  AND u.register_date <= '2025-12-01'\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "users",
     "orders"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT(",
     "COUNT(DISTINCT",
     "LEFT JOIN",
     "JOIN",
     "DATEDIFF",
     "DATE_FORMAT",
     "NULLIF",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "2025-01",
     1298,
     0.0069,
     0.0362,
     0.1471
    ],
    [
     "2025-02",
     1301,
     0.0,
     0.03,
     0.14
    ],
    [
     "2025-03",
     1254,
     0.0048,
     0.0311,
     0.1172
    ],
    [
     "2025-04",
     1461,
     0.0,
     0.03,
     0.14
    ],
    [
     "2025-05",
     1323,
     0.0023,
     0.0302,
     0.1224
    ],
    [
     "2025-06",
     1421,
     0.01,
     0.03,
     0.14
    ],
    [
     "2025-07",
     1304,
     0.0061,
     0.0353,
     0.1334
    ],
    [
     "2025-08",
     1418,
     0.0,
     0.04,
     0.15
    ],
    [
     "2025-09",
     1190,
     0.0017,
     0.0286,
     0.1378
    ],
    [
     "2025-10",
     1430,
     0.0,
     0.03,
     0.15
    ],
    [
     "2025-11",
     1212,
     0.0041,
     0.0404,
     0.1262
    ]
   ],
   "actual_row_count": 11,
   "diff": [
    {
     "row": 2,
     "expected": [
      "2025-02",
      1131,
      0.0035,
      0.0301,
      0.1202
     ],
     "actual": [
      "2025-02",
      1301,
      0.0,
      0.03,
      0.14
     ]
    },
    {
     "row": 4,
     "expected": [
      "2025-04",
      1270,
      0.0039,
      0.0291,
      0.1228
     ],
     "actual": [
      "2025-04",
      1461,
      0.0,
      0.03,
      0.14
     ]
    },
    {
     "row": 6,
     "expected": [
      "2025-06",
      1235,
      0.0065,
      0.0291,
      0.1223
     ],
     "actual": [
      "2025-06",
      1421,
      0.01,
      0.03,
      0.14
     ]
    },
    {
     "row": 8,
     "expected": [
      "2025-08",
      1232,
      0.0024,
      0.0308,
      0.1323
     ],
     "actual": [
      "2025-08",
      1418,
      0.0,
      0.04,
      0.15
     ]
    },
    {
     "row": 10,
     "expected": [
      "2025-10",
      1243,
      0.0032,
      0.0298,
      0.1279
     ],
     "actual": [
      "2025-10",
      1430,
      0.0,
      0.03,
      0.15
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-retention-004": {
  "id": "shop-retention-004",
  "dataset": "shop",
  "scenario": "retention",
  "chain": "shop-retention-chain-a",
  "chain_step": 4,
  "title": "分注册渠道的次日留存对比（含未登记渠道）",
  "business_prompt": "渠道投放要复盘质量：“按用户的注册渠道分组，看 2025 年注册用户的次日留存率。\n 注意有一批用户注册时没登记渠道，这批人要单独作为『未登记』一组，不能丢。”",
  "context_notes": [
   "注册渠道来自 users.register_channel_id → dim_channel.channel_name，可能为 NULL",
   "次日留存：注册后第 1 天有 status='completed' 的支付（DATEDIFF = 1）",
   "注册日上界 2025-12-30，保证第 1 天仍在数据范围内"
  ],
  "tables": [
   "users",
   "orders",
   "dim_channel"
  ],
  "expected_columns": [
   {
    "name": "channel_name",
    "type": "string"
   },
   {
    "name": "reg_users",
    "type": "int"
   },
   {
    "name": "d1_users",
    "type": "int"
   },
   {
    "name": "d1_rate",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 100,
  "constraints": {
   "must_match": [],
   "must_not_match": [
    {
     "pattern": "register_channel_id\\s+is\\s+not\\s+null",
     "flags": "is",
     "reason": ""
    }
   ]
  },
  "hints": [
   "两次 LEFT JOIN：一次接渠道维表（保住 NULL 渠道），一次接订单（保住无支付用户）。",
   "COALESCE(c.channel_name, '未登记') 兜底，并且 GROUP BY 这个表达式。",
   "分母是该渠道的注册人数，不是有支付的人数。"
  ],
  "reference_sql": "SELECT COALESCE(c.channel_name, '未登记') AS channel_name,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE\n           WHEN DATEDIFF(CAST(o.pay_time AS DATE), u.register_date) = 1\n           THEN u.user_id END) AS d1_users,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN DATEDIFF(CAST(o.pay_time AS DATE), u.register_date) = 1\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d1_rate\nFROM users u\nLEFT JOIN dim_channel c ON c.channel_id = u.register_channel_id\nLEFT JOIN orders o\n       ON o.user_id = u.user_id\n      AND o.status = 'completed'\n      AND o.pay_time IS NOT NULL\nWHERE u.register_date >= '2025-01-01'\n  AND u.register_date <= '2025-12-30'\nGROUP BY 1\nORDER BY 1;",
  "alt_solutions": [
   "WITH pay AS (\n    SELECT user_id, CAST(pay_time AS DATE) AS pd\n    FROM orders WHERE status = 'completed' AND pay_time IS NOT NULL\n)\nSELECT COALESCE(c.channel_name, '未登记') AS channel_name,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE WHEN DATEDIFF(p.pd, u.register_date) = 1\n                           THEN u.user_id END) AS d1_users,\n       ROUND(COUNT(DISTINCT CASE WHEN DATEDIFF(p.pd, u.register_date) = 1\n                                 THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d1_rate\nFROM users u\nLEFT JOIN dim_channel c ON c.channel_id = u.register_channel_id\nLEFT JOIN pay p ON p.user_id = u.user_id\nWHERE u.register_date BETWEEN '2025-01-01' AND '2025-12-30'\nGROUP BY 1\nORDER BY 1;"
  ],
  "explanation": "1. 分群留存的核心是“分母跟着分群走”，每个渠道用自己的注册人数当分母。\n2. 维度缺失（NULL 渠道）不能一删了之，否则各渠道之和对不上总量。\n3. 两个 LEFT JOIN 各司其职：一个保维度完整，一个保分母完整。",
  "pitfalls": [
   "INNER JOIN dim_channel，未登记渠道的一整群人消失",
   "把 orders 的过滤条件写进 WHERE，LEFT JOIN 退化成 INNER JOIN",
   "GROUP BY c.channel_name 而不是 COALESCE 表达式，NULL 组显示为空白"
  ],
  "capability_points": [
   "retention.cohort_dimension",
   "retention.denominator",
   "agg.null_handling"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 11.7,
   "columns": [
    "channel_name",
    "reg_users",
    "d1_users",
    "d1_rate"
   ],
   "rows": [
    [
     "App Store",
     2412,
     14,
     0.0058
    ],
    [
     "天猫旗舰店",
     2395,
     8,
     0.0033
    ],
    [
     "官网",
     2468,
     10,
     0.0041
    ],
    [
     "微信小程序",
     2426,
     13,
     0.0054
    ],
    [
     "抖音小店",
     2415,
     8,
     0.0033
    ],
    [
     "未登记",
     474,
     1,
     0.0021
    ],
    [
     "线下门店",
     2374,
     10,
     0.0042
    ]
   ],
   "row_count": 7,
   "translated_sql": "SELECT COALESCE(c.channel_name, '未登记') AS channel_name,\n       COUNT(DISTINCT u.user_id) AS reg_users,\n       COUNT(DISTINCT CASE\n           WHEN date_diff('day', u.register_date, CAST(o.pay_time AS DATE)) = 1\n           THEN u.user_id END) AS d1_users,\n       ROUND(COUNT(DISTINCT CASE\n           WHEN date_diff('day', u.register_date, CAST(o.pay_time AS DATE)) = 1\n           THEN u.user_id END) * 1.0\n           / NULLIF(COUNT(DISTINCT u.user_id), 0), 4) AS d1_rate\nFROM users u\nLEFT JOIN dim_channel c ON c.channel_id = u.register_channel_id\nLEFT JOIN orders o\n       ON o.user_id = u.user_id\n      AND o.status = 'completed'\n      AND o.pay_time IS NOT NULL\nWHERE u.register_date >= '2025-01-01'\n  AND u.register_date <= '2025-12-30'\nGROUP BY 1\nORDER BY 1;",
   "signature": {
    "tables": [
     "users",
     "orders",
     "dim_channel"
    ],
    "keywords": [
     "CASE WHEN",
     "COUNT(",
     "COUNT(DISTINCT",
     "LEFT JOIN",
     "JOIN",
     "DATEDIFF",
     "COALESCE",
     "NULLIF",
     "ROUND("
    ]
   },
   "actual_rows": [
    [
     "App Store",
     2412,
     14,
     0.0058
    ],
    [
     "天猫旗舰店",
     2517,
     8,
     0.0
    ],
    [
     "官网",
     2468,
     10,
     0.0041
    ],
    [
     "微信小程序",
     2550,
     13,
     0.01
    ],
    [
     "抖音小店",
     2415,
     8,
     0.0033
    ],
    [
     "未登记",
     498,
     1,
     0.0
    ]
   ],
   "actual_row_count": 6,
   "diff": [
    {
     "row": 2,
     "expected": [
      "天猫旗舰店",
      2395,
      8,
      0.0033
     ],
     "actual": [
      "天猫旗舰店",
      2517,
      8,
      0.0
     ]
    },
    {
     "row": 4,
     "expected": [
      "微信小程序",
      2426,
      13,
      0.0054
     ],
     "actual": [
      "微信小程序",
      2550,
      13,
      0.01
     ]
    },
    {
     "row": 6,
     "expected": [
      "未登记",
      474,
      1,
      0.0021
     ],
     "actual": [
      "未登记",
      498,
      1,
      0.0
     ]
    }
   ],
   "hardcode_markers": [
    "App Store",
    "天猫旗舰店",
    "官网",
    "微信小程序",
    "抖音小店",
    "线下门店"
   ]
  }
 },
 "shop-window-001": {
  "id": "shop-window-001",
  "dataset": "shop",
  "scenario": "window",
  "chain": "shop-window-chain-a",
  "chain_step": 1,
  "title": "每个用户最近一笔已完成订单",
  "business_prompt": "客诉团队要回访，需要每个用户“最近一次成功支付”的那笔订单：\n“给我每个 user_id 最近一笔已完成（completed）订单的 order_id、实付金额和支付时间，\n 按 user_id 升序。”",
  "context_notes": [
   "只看 status='completed' 且 pay_time 非空的订单",
   "“最近一笔”按 pay_time 最大，同一用户可能有多笔，只取一笔",
   "MySQL 8.0 没有 QUALIFY，名次算出来后必须套一层 CTE / 子查询再过滤"
  ],
  "tables": [
   "orders"
  ],
  "expected_columns": [
   {
    "name": "user_id",
    "type": "int"
   },
   {
    "name": "order_id",
    "type": "int"
   },
   {
    "name": "pay_amount",
    "type": "decimal"
   },
   {
    "name": "pay_time",
    "type": "timestamp"
   }
  ],
  "order_sensitive": false,
  "row_limit": 1000,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "用 ROW_NUMBER() 按 user_id 分区、pay_time 降序排出名次。",
   "过滤“名次=1”不能写在 WHERE 里（窗口函数不在 WHERE 生效），要套 CTE。",
   "结果按 user_id 排序即可，pay_time 并列时取哪笔都行（可加次要排序键稳定）。"
  ],
  "reference_sql": "WITH ranked AS (\n    SELECT o.user_id,\n           o.order_id,\n           o.pay_amount,\n           o.pay_time,\n           ROW_NUMBER() OVER (\n               PARTITION BY o.user_id\n               ORDER BY o.pay_time DESC, o.order_id DESC\n           ) AS rn\n    FROM orders o\n    WHERE o.status = 'completed'\n      AND o.pay_time IS NOT NULL\n)\nSELECT user_id, order_id, pay_amount, pay_time\nFROM ranked\nWHERE rn = 1\nORDER BY user_id;",
  "alt_solutions": [
   "SELECT t.user_id, t.order_id, t.pay_amount, t.pay_time\nFROM (\n    SELECT o.user_id, o.order_id, o.pay_amount, o.pay_time,\n           ROW_NUMBER() OVER (\n               PARTITION BY o.user_id\n               ORDER BY o.pay_time DESC, o.order_id DESC\n           ) AS rn\n    FROM orders o\n    WHERE o.status = 'completed' AND o.pay_time IS NOT NULL\n) t\nWHERE t.rn = 1\nORDER BY t.user_id;"
  ],
  "explanation": "1. 排名：ROW_NUMBER() 分区 + 降序，给每个用户的最近订单标 rn=1。\n2. 过滤：窗口结果不能进 WHERE，用 CTE 或派生表包一层再 WHERE rn=1。\n3. 稳定：pay_time 相同加 order_id 次要键，保证每次结果一致。",
  "pitfalls": [
   "试图在 WHERE 里直接写 ROW_NUMBER()=1",
   "用 MAX(pay_time) 相关子查询也能做，但本题训练窗口去重的写法",
   "没过滤 pay_time IS NOT NULL，未支付订单混入"
  ],
  "capability_points": [
   "window.dedup",
   "window.rank_family"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 11.2,
   "columns": [
    "user_id",
    "order_id",
    "pay_amount",
    "pay_time"
   ],
   "rows": [
    [
     1,
     161276,
     20291.25,
     "2025-12-20 04:05:44"
    ],
    [
     2,
     90149,
     15847.7,
     "2025-07-15 11:42:47"
    ],
    [
     3,
     130411,
     25032.43,
     "2025-02-17 05:31:35"
    ],
    [
     5,
     131173,
     3837.07,
     "2025-04-29 03:24:01"
    ],
    [
     6,
     111639,
     13387.75,
     "2025-12-07 11:06:38"
    ],
    [
     7,
     46910,
     15430.46,
     "2025-06-18 01:28:01"
    ],
    [
     8,
     58302,
     57.86,
     "2025-06-19 21:47:35"
    ],
    [
     9,
     185071,
     632.81,
     "2025-11-10 00:06:52"
    ],
    [
     10,
     76627,
     14419.12,
     "2025-08-27 09:52:54"
    ],
    [
     11,
     153963,
     169.12,
     "2025-12-26 06:57:42"
    ],
    [
     12,
     119354,
     4568.99,
     "2025-10-15 15:42:30"
    ],
    [
     13,
     90963,
     31206.09,
     "2025-03-28 22:54:29"
    ],
    [
     14,
     45097,
     13194.77,
     "2025-11-29 04:47:59"
    ],
    [
     15,
     178077,
     70538.1,
     "2025-03-16 03:26:12"
    ],
    [
     16,
     183556,
     19086.87,
     "2025-04-29 20:15:02"
    ]
   ],
   "row_count": 28943,
   "translated_sql": "WITH ranked AS (\n    SELECT o.user_id,\n           o.order_id,\n           o.pay_amount,\n           o.pay_time,\n           ROW_NUMBER() OVER (\n               PARTITION BY o.user_id\n               ORDER BY o.pay_time DESC, o.order_id DESC\n           ) AS rn\n    FROM orders o\n    WHERE o.status = 'completed'\n      AND o.pay_time IS NOT NULL\n)\nSELECT user_id, order_id, pay_amount, pay_time\nFROM ranked\nWHERE rn = 1\nORDER BY user_id;",
   "signature": {
    "tables": [
     "orders"
    ],
    "keywords": [
     "ROW_NUMBER",
     "OVER",
     "PARTITION BY",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     161276,
     20291.25,
     "2025-12-20 04:05:44"
    ],
    [
     2,
     99452,
     17483.18,
     "2025-07-15 11:42:47"
    ],
    [
     3,
     130411,
     25032.43,
     "2025-02-17 05:31:35"
    ],
    [
     5,
     144710,
     4233.06,
     "2025-04-29 03:24:01"
    ],
    [
     6,
     111639,
     13387.75,
     "2025-12-07 11:06:38"
    ],
    [
     7,
     51751,
     17022.88,
     "2025-06-18 01:28:01"
    ],
    [
     8,
     58302,
     57.86,
     "2025-06-19 21:47:35"
    ],
    [
     9,
     204170,
     698.12,
     "2025-11-10 00:06:52"
    ],
    [
     10,
     76627,
     14419.12,
     "2025-08-27 09:52:54"
    ],
    [
     12,
     169851,
     186.57,
     "2025-12-26 06:57:42"
    ],
    [
     12,
     119354,
     4568.99,
     "2025-10-15 15:42:30"
    ],
    [
     14,
     100350,
     34426.56,
     "2025-03-28 22:54:29"
    ],
    [
     14,
     45097,
     13194.77,
     "2025-11-29 04:47:59"
    ],
    [
     16,
     196454,
     77817.63,
     "2025-03-16 03:26:12"
    ]
   ],
   "actual_row_count": 28942,
   "diff": [
    {
     "row": 2,
     "expected": [
      2,
      90149,
      15847.7,
      "2025-07-15 11:42:47"
     ],
     "actual": [
      2,
      99452,
      17483.18,
      "2025-07-15 11:42:47"
     ]
    },
    {
     "row": 4,
     "expected": [
      5,
      131173,
      3837.07,
      "2025-04-29 03:24:01"
     ],
     "actual": [
      5,
      144710,
      4233.06,
      "2025-04-29 03:24:01"
     ]
    },
    {
     "row": 6,
     "expected": [
      7,
      46910,
      15430.46,
      "2025-06-18 01:28:01"
     ],
     "actual": [
      7,
      51751,
      17022.88,
      "2025-06-18 01:28:01"
     ]
    },
    {
     "row": 8,
     "expected": [
      9,
      185071,
      632.81,
      "2025-11-10 00:06:52"
     ],
     "actual": [
      9,
      204170,
      698.12,
      "2025-11-10 00:06:52"
     ]
    },
    {
     "row": 10,
     "expected": [
      11,
      153963,
      169.12,
      "2025-12-26 06:57:42"
     ],
     "actual": [
      12,
      169851,
      186.57,
      "2025-12-26 06:57:42"
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-window-002": {
  "id": "shop-window-002",
  "dataset": "shop",
  "scenario": "window",
  "chain": "shop-window-chain-a",
  "chain_step": 2,
  "title": "2025 Q2 各品类销售额 Top3 商品",
  "business_prompt": "运营同学在群里 @ 你：\n“大促复盘要用，帮我拉一下 2025 年 Q2 每个一级品类里实付金额排前三的商品，\n 要商品名、品类名、实付金额和名次。金额一样的算并列，并列之后名次别跳号。”",
  "context_notes": [
   "实付金额指订单明细的 item_amount 之和",
   "已取消和已退款的订单不计入销售额",
   "分组 TopN：必须用窗口函数 + 外套 CTE 过滤（MySQL 无 QUALIFY）"
  ],
  "tables": [
   "orders",
   "order_items",
   "dim_product"
  ],
  "expected_columns": [
   {
    "name": "cat_l1",
    "type": "string"
   },
   {
    "name": "product_name",
    "type": "string"
   },
   {
    "name": "pay_amount",
    "type": "decimal"
   },
   {
    "name": "rn",
    "type": "int"
   }
  ],
  "order_sensitive": false,
  "row_limit": 500,
  "constraints": {
   "must_match": [
    {
     "pattern": "\\bdense_rank\\s*\\(\\s*\\)\\s*over\\b",
     "flags": "i",
     "reason": "本题要求“并列且不跳号”，精确对应 DENSE_RANK；用 RANK 会在并列后跳号。"
    }
   ],
   "must_not_match": [
    {
     "pattern": "\\blimit\\s+3\\b",
     "flags": "i",
     "reason": "LIMIT 3 只能取全局前三，无法实现“每个品类各取前三”的分组 TopN。"
    }
   ]
  },
  "hints": [
   "先确认“实付金额”口径：要排除哪些订单状态？",
   "名次并列且不跳号 —— ROW_NUMBER、RANK、DENSE_RANK 三者选哪个？",
   "MySQL 8.0 没有 QUALIFY，窗口函数算出的名次必须先放进 CTE 或子查询，才能在外层过滤。"
  ],
  "reference_sql": "WITH item_amt AS (\n    SELECT p.cat_l1, p.product_name, SUM(oi.item_amount) AS pay_amount\n    FROM order_items oi\n    JOIN orders o    ON o.order_id = oi.order_id\n    JOIN dim_product p ON p.product_id = oi.product_id\n    WHERE o.order_time >= '2025-04-01'\n      AND o.order_time <  '2025-07-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n    GROUP BY p.cat_l1, p.product_name\n),\nranked AS (\n    SELECT cat_l1, product_name, pay_amount,\n           DENSE_RANK() OVER (PARTITION BY cat_l1 ORDER BY pay_amount DESC) AS rn\n    FROM item_amt\n)\nSELECT cat_l1, product_name, pay_amount, rn\nFROM ranked\nWHERE rn <= 3;",
  "alt_solutions": [
   "SELECT * FROM (\n    SELECT p.cat_l1, p.product_name,\n           SUM(oi.item_amount) AS pay_amount,\n           DENSE_RANK() OVER (PARTITION BY p.cat_l1 ORDER BY SUM(oi.item_amount) DESC) AS rn\n    FROM order_items oi\n    JOIN orders o ON o.order_id = oi.order_id\n    JOIN dim_product p ON p.product_id = oi.product_id\n    WHERE o.order_time >= '2025-04-01' AND o.order_time < '2025-07-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n    GROUP BY p.cat_l1, p.product_name\n) t WHERE t.rn <= 3;"
  ],
  "explanation": "1. 口径：实付金额落到 order_items 粒度求和。\n2. 排名：并列且不跳号精确对应 DENSE_RANK。\n3. 过滤：MySQL 无 QUALIFY，必须分层（CTE 或子查询）再 WHERE rn<=3。",
  "pitfalls": [
   "直接对 orders.pay_amount 求和，多商品订单重复计入每个商品",
   "忘记排除 cancelled / refunded",
   "用 RANK 导致并列后名次跳号，Top3 实际只返回 2 个不同名次",
   "试图在 WHERE 里直接写 DENSE_RANK() <= 3"
  ],
  "capability_points": [
   "window.rank_family",
   "window.topn",
   "agg.multi_group"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 9.5,
   "columns": [
    "cat_l1",
    "product_name",
    "pay_amount",
    "rn"
   ],
   "rows": [
    [
     "食品",
     "MasterKong 生鲜 690",
     22350.77,
     1
    ],
    [
     "食品",
     "MasterKong 生鲜 1350",
     21883.87,
     2
    ],
    [
     "食品",
     "MasterKong 生鲜 1890",
     21339.99,
     3
    ],
    [
     "服饰",
     "LiNing 男装 1150",
     85746.73,
     1
    ],
    [
     "服饰",
     "LiNing 男装 460",
     84031.56,
     2
    ],
    [
     "服饰",
     "LiNing 男装 1090",
     82808.85,
     3
    ],
    [
     "家电",
     "Sony 电视 969",
     922970.31,
     1
    ],
    [
     "家电",
     "Haier 电视 1521",
     863679.45,
     2
    ],
    [
     "家电",
     "Midea 洗衣机 1527",
     807692.64,
     3
    ],
    [
     "美妆",
     "L'Oreal 彩妆 491",
     140402.02,
     1
    ],
    [
     "美妆",
     "Armani 彩妆 185",
     118080.68,
     2
    ],
    [
     "美妆",
     "Winona 彩妆 899",
     117289.59,
     3
    ],
    [
     "手机",
     "Huawei 旗舰机 841",
     946849.04,
     1
    ],
    [
     "手机",
     "vivo 旗舰机 319",
     926691.95,
     2
    ],
    [
     "手机",
     "Xiaomi 旗舰机 427",
     879320.18,
     3
    ]
   ],
   "row_count": 18,
   "translated_sql": "WITH item_amt AS (\n    SELECT p.cat_l1, p.product_name, SUM(oi.item_amount) AS pay_amount\n    FROM order_items oi\n    JOIN orders o    ON o.order_id = oi.order_id\n    JOIN dim_product p ON p.product_id = oi.product_id\n    WHERE o.order_time >= '2025-04-01'\n      AND o.order_time <  '2025-07-01'\n      AND o.status NOT IN ('cancelled', 'refunded')\n    GROUP BY p.cat_l1, p.product_name\n),\nranked AS (\n    SELECT cat_l1, product_name, pay_amount,\n           DENSE_RANK() OVER (PARTITION BY cat_l1 ORDER BY pay_amount DESC) AS rn\n    FROM item_amt\n)\nSELECT cat_l1, product_name, pay_amount, rn\nFROM ranked\nWHERE rn <= 3;",
   "signature": {
    "tables": [
     "orders",
     "order_items",
     "dim_product"
    ],
    "keywords": [
     "DENSE_RANK",
     "OVER",
     "PARTITION BY",
     "SUM(",
     "JOIN",
     "NOT IN",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     "食品",
     "MasterKong 生鲜 690",
     22350.77,
     1
    ],
    [
     "食品",
     "MasterKong 生鲜 1350",
     24194.81,
     2
    ],
    [
     "食品",
     "MasterKong 生鲜 1890",
     21339.99,
     3
    ],
    [
     "服饰",
     "LiNing 男装 1150",
     94801.58,
     1
    ],
    [
     "服饰",
     "LiNing 男装 460",
     84031.56,
     2
    ],
    [
     "服饰",
     "LiNing 男装 1090",
     91553.46,
     3
    ],
    [
     "家电",
     "Sony 电视 969",
     922970.31,
     1
    ],
    [
     "家电",
     "Haier 电视 1521",
     954884.0,
     2
    ],
    [
     "家电",
     "Midea 洗衣机 1527",
     807692.64,
     3
    ],
    [
     "美妆",
     "L'Oreal 彩妆 491",
     155228.47,
     1
    ],
    [
     "美妆",
     "Armani 彩妆 185",
     118080.68,
     2
    ],
    [
     "美妆",
     "Winona 彩妆 899",
     129675.37,
     3
    ],
    [
     "手机",
     "Huawei 旗舰机 841",
     946849.04,
     1
    ],
    [
     "手机",
     "vivo 旗舰机 319",
     1024550.62,
     2
    ]
   ],
   "actual_row_count": 17,
   "diff": [
    {
     "row": 2,
     "expected": [
      "食品",
      "MasterKong 生鲜 1350",
      21883.87,
      2
     ],
     "actual": [
      "食品",
      "MasterKong 生鲜 1350",
      24194.81,
      2
     ]
    },
    {
     "row": 4,
     "expected": [
      "服饰",
      "LiNing 男装 1150",
      85746.73,
      1
     ],
     "actual": [
      "服饰",
      "LiNing 男装 1150",
      94801.58,
      1
     ]
    },
    {
     "row": 6,
     "expected": [
      "服饰",
      "LiNing 男装 1090",
      82808.85,
      3
     ],
     "actual": [
      "服饰",
      "LiNing 男装 1090",
      91553.46,
      3
     ]
    },
    {
     "row": 8,
     "expected": [
      "家电",
      "Haier 电视 1521",
      863679.45,
      2
     ],
     "actual": [
      "家电",
      "Haier 电视 1521",
      954884.0,
      2
     ]
    },
    {
     "row": 10,
     "expected": [
      "美妆",
      "L'Oreal 彩妆 491",
      140402.02,
      1
     ],
     "actual": [
      "美妆",
      "L'Oreal 彩妆 491",
      155228.47,
      1
     ]
    }
   ],
   "hardcode_markers": [
    "食品",
    "服饰",
    "LiNing 男装 1150",
    "LiNing 男装 460",
    "LiNing 男装 1090",
    "家电",
    "Sony 电视 969",
    "Haier 电视 1521",
    "Midea 洗衣机 1527",
    "美妆",
    "L'Oreal 彩妆 491",
    "Armani 彩妆 185",
    "Winona 彩妆 899",
    "手机",
    "Huawei 旗舰机 841",
    "vivo 旗舰机 319",
    "Xiaomi 旗舰机 427"
   ]
  }
 },
 "shop-window-003": {
  "id": "shop-window-003",
  "dataset": "shop",
  "scenario": "window",
  "chain": "shop-window-chain-a",
  "chain_step": 3,
  "title": "每个用户的累计消费金额",
  "business_prompt": "风控要画用户消费曲线：“给我每个用户每一笔已完成订单的实付金额，以及到该笔为止的累计消费金额，\n 按 user_id、支付时间排序。”",
  "context_notes": [
   "只看 status='completed' 且 pay_time 非空的订单",
   "累计 = 同一个用户、按支付时间升序、从第一行到当前行的 SUM",
   "用窗口 SUM() OVER (PARTITION BY user_id ORDER BY pay_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)"
  ],
  "tables": [
   "orders"
  ],
  "expected_columns": [
   {
    "name": "user_id",
    "type": "int"
   },
   {
    "name": "pay_time",
    "type": "timestamp"
   },
   {
    "name": "pay_amount",
    "type": "decimal"
   },
   {
    "name": "cum_pay",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 2000,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "累计窗口：PARTITION BY user_id ORDER BY pay_time，帧用 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW。",
   "只统计已完成且已支付的订单。",
   "结果按 user_id, pay_time 排序即可。"
  ],
  "reference_sql": "WITH paid AS (\n    SELECT user_id, pay_time, pay_amount, order_id\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n)\nSELECT user_id, pay_time, pay_amount,\n       SUM(pay_amount) OVER (\n           PARTITION BY user_id\n           ORDER BY pay_time, order_id\n           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_pay\nFROM paid\nORDER BY user_id, pay_time;",
  "alt_solutions": [
   "SELECT user_id, pay_time, pay_amount,\n       SUM(pay_amount) OVER (\n           PARTITION BY user_id\n           ORDER BY pay_time, order_id\n           ROWS UNBOUNDED PRECEDING) AS cum_pay\nFROM orders\nWHERE status = 'completed' AND pay_time IS NOT NULL\nORDER BY user_id, pay_time;"
  ],
  "explanation": "1. 累计帧：ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW 从首行累加到当前。\n2. 分区：按 user_id 各自累计。\n3. 稳定：ORDER BY 加 order_id 次要键，重复 pay_time 时结果稳定。",
  "pitfalls": [
   "忘记加帧定义，默认帧在有并列时可能用 RANGE 导致多行被一起累计",
   "把未支付订单（pay_amount=0）混入累计",
   "用自连接相关子查询也能做，但窗口写法更直观"
  ],
  "capability_points": [
   "window.cumulative",
   "window.frame_trap"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 36.7,
   "columns": [
    "user_id",
    "pay_time",
    "pay_amount",
    "cum_pay"
   ],
   "rows": [
    [
     1,
     "2024-03-03 07:00:37",
     27265.56,
     27265.56
    ],
    [
     1,
     "2024-07-22 07:14:19",
     20006.73,
     47272.29
    ],
    [
     1,
     "2024-08-21 16:38:39",
     15855.36,
     63127.65
    ],
    [
     1,
     "2024-08-28 11:08:01",
     30424.79,
     93552.44
    ],
    [
     1,
     "2025-03-03 05:45:05",
     105.92,
     93658.36
    ],
    [
     1,
     "2025-03-17 01:28:03",
     14286.21,
     107944.57
    ],
    [
     1,
     "2025-07-04 02:39:26",
     16231.61,
     124176.18
    ],
    [
     1,
     "2025-12-20 04:05:44",
     20291.25,
     144467.43
    ],
    [
     2,
     "2024-07-28 08:34:13",
     1407.09,
     1407.09
    ],
    [
     2,
     "2024-09-05 22:03:45",
     19591.31,
     20998.4
    ],
    [
     2,
     "2025-01-17 17:10:55",
     13920.97,
     34919.37
    ],
    [
     2,
     "2025-07-15 11:42:47",
     15847.7,
     50767.07
    ],
    [
     3,
     "2024-05-07 11:40:24",
     4618.9,
     4618.9
    ],
    [
     3,
     "2024-09-27 08:21:33",
     66697.68,
     71316.58
    ],
    [
     3,
     "2025-02-17 05:31:35",
     25032.43,
     96349.01
    ]
   ],
   "row_count": 100234,
   "translated_sql": "WITH paid AS (\n    SELECT user_id, pay_time, pay_amount, order_id\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n)\nSELECT user_id, pay_time, pay_amount,\n       SUM(pay_amount) OVER (\n           PARTITION BY user_id\n           ORDER BY pay_time, order_id\n           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_pay\nFROM paid\nORDER BY user_id, pay_time;",
   "signature": {
    "tables": [
     "orders"
    ],
    "keywords": [
     "OVER",
     "PARTITION BY",
     "SUM(",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "2024-03-03 07:00:37",
     27265.56,
     27265.56
    ],
    [
     1,
     "2024-07-22 07:14:19",
     22311.51,
     52718.06
    ],
    [
     1,
     "2024-08-21 16:38:39",
     15855.36,
     63127.65
    ],
    [
     1,
     "2024-08-28 11:08:01",
     33929.73,
     104329.68
    ],
    [
     1,
     "2025-03-03 05:45:05",
     105.92,
     93658.36
    ],
    [
     1,
     "2025-03-17 01:28:03",
     15931.98,
     120379.78
    ],
    [
     1,
     "2025-07-04 02:39:26",
     16231.61,
     124176.18
    ],
    [
     1,
     "2025-12-20 04:05:44",
     22628.8,
     161110.08
    ],
    [
     2,
     "2024-07-28 08:34:13",
     1407.09,
     1407.09
    ],
    [
     2,
     "2024-09-05 22:03:45",
     21848.23,
     23417.42
    ],
    [
     2,
     "2025-01-17 17:10:55",
     13920.97,
     34919.37
    ],
    [
     2,
     "2025-07-15 11:42:47",
     17673.36,
     56615.44
    ],
    [
     3,
     "2024-05-07 11:40:24",
     4618.9,
     4618.9
    ],
    [
     3,
     "2024-09-27 08:21:33",
     74381.25,
     79532.25
    ]
   ],
   "actual_row_count": 100233,
   "diff": [
    {
     "row": 2,
     "expected": [
      1,
      "2024-07-22 07:14:19",
      20006.73,
      47272.29
     ],
     "actual": [
      1,
      "2024-07-22 07:14:19",
      22311.51,
      52718.06
     ]
    },
    {
     "row": 4,
     "expected": [
      1,
      "2024-08-28 11:08:01",
      30424.79,
      93552.44
     ],
     "actual": [
      1,
      "2024-08-28 11:08:01",
      33929.73,
      104329.68
     ]
    },
    {
     "row": 6,
     "expected": [
      1,
      "2025-03-17 01:28:03",
      14286.21,
      107944.57
     ],
     "actual": [
      1,
      "2025-03-17 01:28:03",
      15931.98,
      120379.78
     ]
    },
    {
     "row": 8,
     "expected": [
      1,
      "2025-12-20 04:05:44",
      20291.25,
      144467.43
     ],
     "actual": [
      1,
      "2025-12-20 04:05:44",
      22628.8,
      161110.08
     ]
    },
    {
     "row": 10,
     "expected": [
      2,
      "2024-09-05 22:03:45",
      19591.31,
      20998.4
     ],
     "actual": [
      2,
      "2024-09-05 22:03:45",
      21848.23,
      23417.42
     ]
    }
   ],
   "hardcode_markers": []
  }
 },
 "shop-window-004": {
  "id": "shop-window-004",
  "dataset": "shop",
  "scenario": "window",
  "chain": "shop-window-chain-a",
  "chain_step": 4,
  "title": "每个用户相邻两笔订单金额差",
  "business_prompt": "用户运营想看消费节奏：“给我每个用户每一笔已完成订单的实付金额，以及和上一次订单的金额差\n （当前 - 上一次）。第一笔订单没有‘上一次’，差应为 NULL。”",
  "context_notes": [
   "只看 status='completed' 且 pay_time 非空的订单",
   "上一次 = LAG(pay_amount) 按 user_id 分区、pay_time 排序",
   "首笔的 LAG 为 NULL，差值也应为 NULL"
  ],
  "tables": [
   "orders"
  ],
  "expected_columns": [
   {
    "name": "user_id",
    "type": "int"
   },
   {
    "name": "pay_time",
    "type": "timestamp"
   },
   {
    "name": "pay_amount",
    "type": "decimal"
   },
   {
    "name": "prev_amount",
    "type": "decimal"
   },
   {
    "name": "diff",
    "type": "decimal"
   }
  ],
  "order_sensitive": false,
  "row_limit": 2000,
  "constraints": {
   "must_match": [],
   "must_not_match": []
  },
  "hints": [
   "用 LAG(pay_amount) OVER (PARTITION BY user_id ORDER BY pay_time) 取上一笔金额。",
   "差值 = pay_amount - LAG(pay_amount)；首笔 LAG 为 NULL，结果 NULL。",
   "ORDER BY 加 order_id 次要键保证稳定。"
  ],
  "reference_sql": "WITH paid AS (\n    SELECT user_id, pay_time, pay_amount, order_id\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n)\nSELECT user_id, pay_time, pay_amount,\n       LAG(pay_amount) OVER (PARTITION BY user_id ORDER BY pay_time, order_id) AS prev_amount,\n       pay_amount - LAG(pay_amount) OVER (PARTITION BY user_id ORDER BY pay_time, order_id) AS diff\nFROM paid\nORDER BY user_id, pay_time;",
  "alt_solutions": [
   "SELECT user_id, pay_time, pay_amount,\n       LAG(pay_amount) OVER w AS prev_amount,\n       pay_amount - LAG(pay_amount) OVER w AS diff\nFROM orders\nWHERE status = 'completed' AND pay_time IS NOT NULL\nWINDOW w AS (PARTITION BY user_id ORDER BY pay_time, order_id)\nORDER BY user_id, pay_time;"
  ],
  "explanation": "1. LAG：取同用户上一行的 pay_amount。\n2. 差值：当前 - LAG，首笔 LAG 为 NULL 自动传播为 NULL。\n3. 命名窗口 WINDOW 子句可复用同一个窗口定义（alt 示例）。",
  "pitfalls": [
   "用 (pay_amount - prev) 但 prev 来自自连接，逻辑复杂易错",
   "忘记 PARTITION BY user_id，跨用户取上一笔",
   "未加次要排序键导致相同 pay_time 顺序不稳定"
  ],
  "capability_points": [
   "window.lag_lead",
   "window.rank_family"
  ],
  "demo": {
   "executed": true,
   "elapsed_ms": 11.2,
   "columns": [
    "user_id",
    "pay_time",
    "pay_amount",
    "prev_amount",
    "diff"
   ],
   "rows": [
    [
     1,
     "2024-03-03 07:00:37",
     27265.56,
     null,
     null
    ],
    [
     1,
     "2024-07-22 07:14:19",
     20006.73,
     27265.56,
     -7258.83
    ],
    [
     1,
     "2024-08-21 16:38:39",
     15855.36,
     20006.73,
     -4151.37
    ],
    [
     1,
     "2024-08-28 11:08:01",
     30424.79,
     15855.36,
     14569.43
    ],
    [
     1,
     "2025-03-03 05:45:05",
     105.92,
     30424.79,
     -30318.87
    ],
    [
     1,
     "2025-03-17 01:28:03",
     14286.21,
     105.92,
     14180.29
    ],
    [
     1,
     "2025-07-04 02:39:26",
     16231.61,
     14286.21,
     1945.4
    ],
    [
     1,
     "2025-12-20 04:05:44",
     20291.25,
     16231.61,
     4059.64
    ],
    [
     2,
     "2024-07-28 08:34:13",
     1407.09,
     null,
     null
    ],
    [
     2,
     "2024-09-05 22:03:45",
     19591.31,
     1407.09,
     18184.22
    ],
    [
     2,
     "2025-01-17 17:10:55",
     13920.97,
     19591.31,
     -5670.34
    ],
    [
     2,
     "2025-07-15 11:42:47",
     15847.7,
     13920.97,
     1926.73
    ],
    [
     3,
     "2024-05-07 11:40:24",
     4618.9,
     null,
     null
    ],
    [
     3,
     "2024-09-27 08:21:33",
     66697.68,
     4618.9,
     62078.78
    ],
    [
     3,
     "2025-02-17 05:31:35",
     25032.43,
     66697.68,
     -41665.25
    ]
   ],
   "row_count": 100234,
   "translated_sql": "WITH paid AS (\n    SELECT user_id, pay_time, pay_amount, order_id\n    FROM orders\n    WHERE status = 'completed' AND pay_time IS NOT NULL\n)\nSELECT user_id, pay_time, pay_amount,\n       LAG(pay_amount) OVER (PARTITION BY user_id ORDER BY pay_time, order_id) AS prev_amount,\n       pay_amount - LAG(pay_amount) OVER (PARTITION BY user_id ORDER BY pay_time, order_id) AS diff\nFROM paid\nORDER BY user_id, pay_time;",
   "signature": {
    "tables": [
     "orders"
    ],
    "keywords": [
     "LAG",
     "OVER",
     "PARTITION BY",
     "WITH"
    ]
   },
   "actual_rows": [
    [
     1,
     "2024-03-03 07:00:37",
     27265.56,
     null,
     null
    ],
    [
     1,
     "2024-07-22 07:14:19",
     20807.0,
     28356.18,
     -7549.18
    ],
    [
     1,
     "2024-08-21 16:38:39",
     15855.36,
     20006.73,
     -4151.37
    ],
    [
     1,
     "2024-08-28 11:08:01",
     31641.78,
     16489.57,
     15152.21
    ],
    [
     1,
     "2025-03-03 05:45:05",
     105.92,
     30424.79,
     -30318.87
    ],
    [
     1,
     "2025-03-17 01:28:03",
     14857.66,
     110.16,
     14747.5
    ],
    [
     1,
     "2025-07-04 02:39:26",
     16231.61,
     14286.21,
     1945.4
    ],
    [
     1,
     "2025-12-20 04:05:44",
     21102.9,
     16880.87,
     4222.03
    ],
    [
     2,
     "2024-07-28 08:34:13",
     1407.09,
     null,
     null
    ],
    [
     2,
     "2024-09-05 22:03:45",
     20374.96,
     1463.37,
     18911.59
    ],
    [
     2,
     "2025-01-17 17:10:55",
     13920.97,
     19591.31,
     -5670.34
    ],
    [
     2,
     "2025-07-15 11:42:47",
     16481.61,
     14477.81,
     2003.8
    ],
    [
     3,
     "2024-05-07 11:40:24",
     4618.9,
     null,
     null
    ],
    [
     3,
     "2024-09-27 08:21:33",
     69365.59,
     4803.66,
     64561.93
    ]
   ],
   "actual_row_count": 100233,
   "diff": [
    {
     "row": 2,
     "expected": [
      1,
      "2024-07-22 07:14:19",
      20006.73,
      27265.56,
      -7258.83
     ],
     "actual": [
      1,
      "2024-07-22 07:14:19",
      20807.0,
      28356.18,
      -7549.18
     ]
    },
    {
     "row": 4,
     "expected": [
      1,
      "2024-08-28 11:08:01",
      30424.79,
      15855.36,
      14569.43
     ],
     "actual": [
      1,
      "2024-08-28 11:08:01",
      31641.78,
      16489.57,
      15152.21
     ]
    },
    {
     "row": 6,
     "expected": [
      1,
      "2025-03-17 01:28:03",
      14286.21,
      105.92,
      14180.29
     ],
     "actual": [
      1,
      "2025-03-17 01:28:03",
      14857.66,
      110.16,
      14747.5
     ]
    },
    {
     "row": 8,
     "expected": [
      1,
      "2025-12-20 04:05:44",
      20291.25,
      16231.61,
      4059.64
     ],
     "actual": [
      1,
      "2025-12-20 04:05:44",
      21102.9,
      16880.87,
      4222.03
     ]
    },
    {
     "row": 10,
     "expected": [
      2,
      "2024-09-05 22:03:45",
      19591.31,
      1407.09,
      18184.22
     ],
     "actual": [
      2,
      "2024-09-05 22:03:45",
      20374.96,
      1463.37,
      18911.59
     ]
    }
   ],
   "hardcode_markers": []
  }
 }
};
