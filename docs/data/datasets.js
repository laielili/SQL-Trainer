/* 自动生成，请勿手改。来源：docs/tools/build_static_data.py */
window.SQLT = window.SQLT || {};
window.SQLT.DATASETS = {
 "datasets": [
  {
   "key": "shop",
   "name": "电商交易",
   "tagline": "订单 + 埋点，题量最大，六场景全覆盖",
   "db_file": "shop_a.duckdb",
   "tables": [
    {
     "name": "dim_date",
     "comment": "日期维表（连续 2024-01-01 ~ 2025-12-31，含闰年）",
     "columns": [
      {
       "name": "date_key",
       "type": "DATE",
       "comment": "日期",
       "pk": true,
       "enum": []
      },
      {
       "name": "y",
       "type": "INTEGER",
       "comment": "年",
       "pk": false,
       "enum": []
      },
      {
       "name": "q",
       "type": "INTEGER",
       "comment": "季度 1-4",
       "pk": false,
       "enum": []
      },
      {
       "name": "m",
       "type": "INTEGER",
       "comment": "月 1-12",
       "pk": false,
       "enum": []
      },
      {
       "name": "w",
       "type": "INTEGER",
       "comment": "年周序号 y*100+week",
       "pk": false,
       "enum": []
      },
      {
       "name": "dow",
       "type": "INTEGER",
       "comment": "周几 1=Mon..7=Sun",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_weekend",
       "type": "BOOLEAN",
       "comment": "是否周末",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_holiday",
       "type": "BOOLEAN",
       "comment": "是否节假日",
       "pk": false,
       "enum": []
      },
      {
       "name": "last_year_same_date",
       "type": "DATE",
       "comment": "去年同期日期",
       "pk": false,
       "enum": []
      },
      {
       "name": "prev_month_date",
       "type": "DATE",
       "comment": "上月同日",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "dim_channel",
     "comment": "渠道维表",
     "columns": [
      {
       "name": "channel_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "channel_name",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "channel_type",
       "type": "VARCHAR",
       "comment": "app / web / offline / mini_program",
       "pk": false,
       "enum": [
        "app",
        "web",
        "offline",
        "mini_program"
       ]
      }
     ]
    },
    {
     "name": "dim_city",
     "comment": "城市维表",
     "columns": [
      {
       "name": "city_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "city_name",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "province",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "region",
       "type": "VARCHAR",
       "comment": "north / east / south / west / central",
       "pk": false,
       "enum": [
        "north",
        "east",
        "south",
        "west",
        "central"
       ]
      },
      {
       "name": "city_tier",
       "type": "INTEGER",
       "comment": "1 / 2 / 3 / 4",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "dim_product",
     "comment": "商品维表",
     "columns": [
      {
       "name": "product_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "product_name",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "cat_l1",
       "type": "VARCHAR",
       "comment": "一级品类：手机 / 电脑 / 家电 / 服饰 / 美妆 / 食品",
       "pk": false,
       "enum": []
      },
      {
       "name": "cat_l2",
       "type": "VARCHAR",
       "comment": "二级品类",
       "pk": false,
       "enum": []
      },
      {
       "name": "brand",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "list_price",
       "type": "DOUBLE",
       "comment": "标价",
       "pk": false,
       "enum": []
      },
      {
       "name": "launch_date",
       "type": "DATE",
       "comment": "上市日期",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_new",
       "type": "BOOLEAN",
       "comment": "是否新品（上市 < 180 天）",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "users",
     "comment": "用户表",
     "columns": [
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "register_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "register_channel_id",
       "type": "INTEGER",
       "comment": "可为 NULL（埋坑：未登记渠道）",
       "pk": false,
       "enum": []
      },
      {
       "name": "city_id",
       "type": "INTEGER",
       "comment": "可为 NULL（埋坑：未填城市）",
       "pk": false,
       "enum": []
      },
      {
       "name": "gender",
       "type": "VARCHAR",
       "comment": "M / F / U（U=未知）",
       "pk": false,
       "enum": [
        "M",
        "F",
        "U"
       ]
      },
      {
       "name": "age_band",
       "type": "VARCHAR",
       "comment": "18-25 / 26-35 / 36-45 / 46-55 / 55+",
       "pk": false,
       "enum": [
        "18-25",
        "26-35",
        "36-45",
        "46-55",
        "55+"
       ]
      }
     ]
    },
    {
     "name": "orders",
     "comment": "订单主表",
     "columns": [
      {
       "name": "order_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "order_time",
       "type": "TIMESTAMP",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "pay_time",
       "type": "TIMESTAMP",
       "comment": "NULL = 未支付（埋坑）",
       "pk": false,
       "enum": []
      },
      {
       "name": "status",
       "type": "VARCHAR",
       "comment": "created/paid/shipped/completed/cancelled/refunded",
       "pk": false,
       "enum": [
        "created",
        "paid",
        "shipped",
        "completed",
        "cancelled",
        "refunded"
       ]
      },
      {
       "name": "channel_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "total_amount",
       "type": "DOUBLE",
       "comment": "含折扣前",
       "pk": false,
       "enum": []
      },
      {
       "name": "discount_amount",
       "type": "DOUBLE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "pay_amount",
       "type": "DOUBLE",
       "comment": "实付 = total - discount（未支付时为 0）",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "order_items",
     "comment": "订单明细",
     "columns": [
      {
       "name": "order_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "item_seq",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "product_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "qty",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "unit_price",
       "type": "DOUBLE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "item_amount",
       "type": "DOUBLE",
       "comment": "= qty * unit_price",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "refunds",
     "comment": "退款表",
     "columns": [
      {
       "name": "refund_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "order_id",
       "type": "INTEGER",
       "comment": "对应 status='refunded' 的订单",
       "pk": false,
       "enum": []
      },
      {
       "name": "refund_time",
       "type": "TIMESTAMP",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "refund_amount",
       "type": "DOUBLE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "reason",
       "type": "VARCHAR",
       "comment": "质量问题 / 七天无理由 / 发错货 / 其他",
       "pk": false,
       "enum": [
        "质量问题",
        "七天无理由",
        "发错货",
        "其他"
       ]
      }
     ]
    },
    {
     "name": "events",
     "comment": "埋点事件表",
     "columns": [
      {
       "name": "event_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "session_id",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "event_time",
       "type": "TIMESTAMP",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "event_name",
       "type": "VARCHAR",
       "comment": "view_home/view_product/add_cart/submit_order/pay_success",
       "pk": false,
       "enum": [
        "view_home",
        "view_product",
        "add_cart",
        "submit_order",
        "pay_success"
       ]
      },
      {
       "name": "page",
       "type": "VARCHAR",
       "comment": "部分事件无 page（NULL）",
       "pk": false,
       "enum": []
      },
      {
       "name": "product_id",
       "type": "INTEGER",
       "comment": "仅 view_product/add_cart/submit_order/pay_success 有值",
       "pk": false,
       "enum": []
      },
      {
       "name": "channel_id",
       "type": "INTEGER",
       "comment": "部分事件无渠道（NULL）",
       "pk": false,
       "enum": []
      }
     ]
    }
   ],
   "row_counts": {
    "dim_date": 731,
    "dim_channel": 6,
    "dim_city": 45,
    "dim_product": 2000,
    "users": 30000,
    "orders": 200000,
    "order_items": 600720,
    "refunds": 9968,
    "events": 1211965
   }
  },
  {
   "key": "feed",
   "name": "内容社区",
   "tagline": "曝光 / 点击 / 播放埋点，主打留存与漏斗",
   "db_file": "feed_a.duckdb",
   "tables": [
    {
     "name": "dim_date",
     "comment": "日期维表（连续 2024-01-01 ~ 2025-12-31，含闰年）",
     "columns": [
      {
       "name": "date_key",
       "type": "DATE",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "y",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "q",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "m",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "w",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "dow",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_weekend",
       "type": "BOOLEAN",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_holiday",
       "type": "BOOLEAN",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "last_year_same_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "prev_month_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "users",
     "comment": "用户表",
     "columns": [
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "register_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "register_channel",
       "type": "VARCHAR",
       "comment": "app / web / mini_program / ad / organic",
       "pk": false,
       "enum": [
        "app",
        "web",
        "mini_program",
        "ad",
        "organic"
       ]
      },
      {
       "name": "city_tier",
       "type": "INTEGER",
       "comment": "1 / 2 / 3 / 4",
       "pk": false,
       "enum": [
        "1",
        "2",
        "3",
        "4"
       ]
      },
      {
       "name": "is_creator",
       "type": "BOOLEAN",
       "comment": "是否创作者",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "topics",
     "comment": "话题表",
     "columns": [
      {
       "name": "topic_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "topic_name",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "category",
       "type": "VARCHAR",
       "comment": "娱乐 / 知识 / 游戏 / 美食 / 旅行 / 财经",
       "pk": false,
       "enum": [
        "娱乐",
        "知识",
        "游戏",
        "美食",
        "旅行",
        "财经"
       ]
      }
     ]
    },
    {
     "name": "contents",
     "comment": "内容表",
     "columns": [
      {
       "name": "content_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "author_id",
       "type": "INTEGER",
       "comment": "引用 users.user_id",
       "pk": false,
       "enum": []
      },
      {
       "name": "publish_time",
       "type": "TIMESTAMP",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "topic_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "content_type",
       "type": "VARCHAR",
       "comment": "short_video / article / live / image",
       "pk": false,
       "enum": [
        "short_video",
        "article",
        "live",
        "image"
       ]
      },
      {
       "name": "duration_sec",
       "type": "INTEGER",
       "comment": "时长（秒），live/short_video 较大",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "events",
     "comment": "埋点事件表",
     "columns": [
      {
       "name": "event_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "session_id",
       "type": "VARCHAR",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "event_time",
       "type": "TIMESTAMP",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "event_name",
       "type": "VARCHAR",
       "comment": "impression/click/play/finish/like/comment/share/follow",
       "pk": false,
       "enum": [
        "impression",
        "click",
        "play",
        "finish",
        "like",
        "comment",
        "share",
        "follow"
       ]
      },
      {
       "name": "content_id",
       "type": "INTEGER",
       "comment": "click/play/finish/like/comment/share 有值；follow/impression 为 NULL",
       "pk": false,
       "enum": []
      },
      {
       "name": "stay_sec",
       "type": "INTEGER",
       "comment": "play/finish 的停留秒数；其余为 NULL",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "daily_active",
     "comment": "日活快照",
     "columns": [
      {
       "name": "stat_date",
       "type": "DATE",
       "comment": "统计日期",
       "pk": false,
       "enum": []
      },
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "active_minutes",
       "type": "INTEGER",
       "comment": "当日活跃分钟数",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_new",
       "type": "BOOLEAN",
       "comment": "是否当日新增活跃",
       "pk": false,
       "enum": []
      }
     ]
    }
   ],
   "row_counts": {
    "dim_date": 731,
    "users": 50000,
    "topics": 30,
    "contents": 2000,
    "events": 2019962,
    "daily_active": 1499961
   }
  },
  {
   "key": "saas",
   "name": "SaaS 订阅",
   "tagline": "订阅制指标，主打同环比与续费留存",
   "db_file": "saas_a.duckdb",
   "tables": [
    {
     "name": "dim_date",
     "comment": "日期维表（连续 2024-01-01 ~ 2025-12-31，含闰年）",
     "columns": [
      {
       "name": "date_key",
       "type": "DATE",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "y",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "q",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "m",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "w",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "dow",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_weekend",
       "type": "BOOLEAN",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "is_holiday",
       "type": "BOOLEAN",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "last_year_same_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "prev_month_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "accounts",
     "comment": "企业账号",
     "columns": [
      {
       "name": "account_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "signup_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "industry",
       "type": "VARCHAR",
       "comment": "SaaS/Ecommerce/Finance/Education/Healthcare/Manufacturing/Media",
       "pk": false,
       "enum": [
        "SaaS",
        "Ecommerce",
        "Finance",
        "Education",
        "Healthcare",
        "Manufacturing",
        "Media"
       ]
      },
      {
       "name": "company_size",
       "type": "VARCHAR",
       "comment": "1-10 / 11-50 / 51-200 / 201-1000 / 1000+",
       "pk": false,
       "enum": [
        "1-10",
        "11-50",
        "51-200",
        "201-1000",
        "1000+"
       ]
      },
      {
       "name": "source_channel",
       "type": "VARCHAR",
       "comment": "ads / referral / organic / event",
       "pk": false,
       "enum": [
        "ads",
        "referral",
        "organic",
        "event"
       ]
      }
     ]
    },
    {
     "name": "users",
     "comment": "用户表",
     "columns": [
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "account_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "join_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "role",
       "type": "VARCHAR",
       "comment": "owner / admin / member",
       "pk": false,
       "enum": [
        "owner",
        "admin",
        "member"
       ]
      }
     ]
    },
    {
     "name": "subscriptions",
     "comment": "订阅表",
     "columns": [
      {
       "name": "sub_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "account_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "plan",
       "type": "VARCHAR",
       "comment": "free / starter / pro / enterprise",
       "pk": false,
       "enum": [
        "free",
        "starter",
        "pro",
        "enterprise"
       ]
      },
      {
       "name": "seats",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "start_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "end_date",
       "type": "DATE",
       "comment": "NULL = 仍生效；churned 时有值",
       "pk": false,
       "enum": []
      },
      {
       "name": "mrr",
       "type": "DOUBLE",
       "comment": "月度经常性收入",
       "pk": false,
       "enum": []
      },
      {
       "name": "status",
       "type": "VARCHAR",
       "comment": "trialing/active/past_due/churned/upgraded/downgraded",
       "pk": false,
       "enum": [
        "trialing",
        "active",
        "past_due",
        "churned",
        "upgraded",
        "downgraded"
       ]
      },
      {
       "name": "is_trial",
       "type": "BOOLEAN",
       "comment": "",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "invoices",
     "comment": "账单表",
     "columns": [
      {
       "name": "invoice_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "account_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "bill_date",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "amount",
       "type": "DOUBLE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "paid",
       "type": "BOOLEAN",
       "comment": "",
       "pk": false,
       "enum": [
        "0",
        "1"
       ]
      },
      {
       "name": "pay_date",
       "type": "DATE",
       "comment": "未支付为 NULL",
       "pk": false,
       "enum": []
      }
     ]
    },
    {
     "name": "feature_usage",
     "comment": "功能使用日志",
     "columns": [
      {
       "name": "log_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "account_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "user_id",
       "type": "INTEGER",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "use_time",
       "type": "TIMESTAMP",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "feature_code",
       "type": "VARCHAR",
       "comment": "dashboard/report/export/api/invite/billing/search",
       "pk": false,
       "enum": [
        "dashboard",
        "report",
        "export",
        "api",
        "invite",
        "billing",
        "search"
       ]
      }
     ]
    },
    {
     "name": "trial_conversion",
     "comment": "试用转化",
     "columns": [
      {
       "name": "account_id",
       "type": "INTEGER",
       "comment": "",
       "pk": true,
       "enum": []
      },
      {
       "name": "trial_start",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "trial_end",
       "type": "DATE",
       "comment": "",
       "pk": false,
       "enum": []
      },
      {
       "name": "converted",
       "type": "BOOLEAN",
       "comment": "",
       "pk": false,
       "enum": [
        "0",
        "1"
       ]
      },
      {
       "name": "convert_date",
       "type": "DATE",
       "comment": "未转化则为 NULL",
       "pk": false,
       "enum": []
      }
     ]
    }
   ],
   "row_counts": {
    "dim_date": 731,
    "accounts": 5000,
    "users": 20000,
    "subscriptions": 6000,
    "invoices": 30000,
    "feature_usage": 504976,
    "trial_conversion": 5000
   }
  }
 ],
 "scenarios": [
  {
   "key": "agg",
   "name": "多维聚合统计"
  },
  {
   "key": "window",
   "name": "窗口函数排序"
  },
  {
   "key": "retention",
   "name": "留存率分析"
  },
  {
   "key": "growth",
   "name": "同环比计算"
  },
  {
   "key": "pivot",
   "name": "行列转换"
  },
  {
   "key": "funnel",
   "name": "漏斗转化分析"
  }
 ],
 "capability_points": {
  "agg": [
   {
    "id": "agg.multi_group",
    "name": "多列分组与分组粒度控制"
   },
   {
    "id": "agg.rollup",
    "name": "小计与合计行"
   },
   {
    "id": "agg.grouping_sets",
    "name": "任意维度组合汇总"
   },
   {
    "id": "agg.conditional",
    "name": "条件聚合"
   },
   {
    "id": "agg.distinct_count",
    "name": "去重计数与多粒度对齐"
   },
   {
    "id": "agg.ratio",
    "name": "组内占比与总计占比"
   },
   {
    "id": "agg.having",
    "name": "聚合后过滤"
   }
  ],
  "window": [
   {
    "id": "window.rank_family",
    "name": "三种排名函数的选择"
   },
   {
    "id": "window.topn",
    "name": "组内 TopN"
   },
   {
    "id": "window.dedup",
    "name": "取每组最新一条"
   },
   {
    "id": "window.lag_lead",
    "name": "取相邻记录"
   },
   {
    "id": "window.cumulative",
    "name": "累计值"
   },
   {
    "id": "window.moving_avg",
    "name": "移动平均"
   },
   {
    "id": "window.frame_trap",
    "name": "窗口帧默认值陷阱"
   }
  ],
  "retention": [
   {
    "id": "retention.anchor",
    "name": "首次行为锚点"
   },
   {
    "id": "retention.cohort",
    "name": "Cohort 划分"
   },
   {
    "id": "retention.nday",
    "name": "次日 / 7 日 / 30 日留存"
   },
   {
    "id": "retention.matrix",
    "name": "留存矩阵"
   },
   {
    "id": "retention.denominator",
    "name": "分母口径"
   },
   {
    "id": "retention.churn_return",
    "name": "流失与回流"
   },
   {
    "id": "retention.date_fill",
    "name": "日期空档补全"
   }
  ],
  "growth": [
   {
    "id": "growth.date_spine",
    "name": "日期维表补全空档"
   },
   {
    "id": "growth.mom",
    "name": "环比"
   },
   {
    "id": "growth.yoy",
    "name": "同比"
   },
   {
    "id": "growth.ytd",
    "name": "累计同比"
   },
   {
    "id": "growth.grain_align",
    "name": "时间粒度对齐"
   },
   {
    "id": "growth.safe_div",
    "name": "除零与空值"
   },
   {
    "id": "growth.boundary",
    "name": "跨年跨月边界"
   }
  ],
  "pivot": [
   {
    "id": "pivot.long2wide",
    "name": "长转宽"
   },
   {
    "id": "pivot.wide2long",
    "name": "宽转长"
   },
   {
    "id": "pivot.multi_metric",
    "name": "多指标同时透视"
   },
   {
    "id": "pivot.dynamic_col",
    "name": "动态列问题"
   },
   {
    "id": "pivot.string_agg",
    "name": "字符串聚合"
   },
   {
    "id": "pivot.split_rows",
    "name": "单列拆多行"
   }
  ],
  "funnel": [
   {
    "id": "funnel.unordered",
    "name": "无序漏斗"
   },
   {
    "id": "funnel.ordered",
    "name": "有序漏斗"
   },
   {
    "id": "funnel.time_window",
    "name": "时间窗约束"
   },
   {
    "id": "funnel.session",
    "name": "会话内漏斗"
   },
   {
    "id": "funnel.step_vs_total",
    "name": "单步 vs 整体转化率"
   },
   {
    "id": "funnel.by_channel",
    "name": "分渠道漏斗对比"
   },
   {
    "id": "funnel.drop_off",
    "name": "流失定位"
   }
  ]
 },
 "meta": {
  "generated_at": "2026-09-07 14:28",
  "question_count": 48,
  "dataset_count": 3,
  "engine": "DuckDB（只读）· 表面纯 MySQL",
  "sample_rows": 15
 }
};
