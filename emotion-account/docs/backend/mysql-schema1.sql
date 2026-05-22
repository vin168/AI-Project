-- 情绪账本 MySQL 初始化脚本
-- 适用版本: MySQL 8.0+

USE appdb;

DROP TABLE IF EXISTS sync_logs;
DROP TABLE IF EXISTS user_devices;
DROP TABLE IF EXISTS monthly_budgets;
DROP TABLE IF EXISTS account_records;
DROP TABLE IF EXISTS emotions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  openid VARCHAR(64) NOT NULL COMMENT '微信小程序 openid',
  unionid VARCHAR(64) DEFAULT NULL COMMENT '微信开放平台 unionid',
  nickname VARCHAR(100) DEFAULT NULL COMMENT '微信昵称',
  avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像地址',
  gender TINYINT NOT NULL DEFAULT 0 COMMENT '0未知 1男 2女',
  country VARCHAR(64) DEFAULT NULL COMMENT '国家',
  province VARCHAR(64) DEFAULT NULL COMMENT '省份',
  city VARCHAR(64) DEFAULT NULL COMMENT '城市',
  auth_status TINYINT NOT NULL DEFAULT 0 COMMENT '0未授权 1已授权',
  last_login_at DATETIME DEFAULT NULL COMMENT '最后登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_openid (openid),
  KEY idx_unionid (unionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED DEFAULT NULL COMMENT '为空表示系统默认分类',
  category_type TINYINT NOT NULL COMMENT '1支出 2收入',
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  icon VARCHAR(100) DEFAULT NULL COMMENT 'emoji 或图片路径',
  is_system TINYINT NOT NULL DEFAULT 0 COMMENT '0自定义 1系统默认',
  sort_no INT NOT NULL DEFAULT 0 COMMENT '排序号',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_type (user_id, category_type),
  KEY idx_system_type (is_system, category_type),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

CREATE TABLE emotions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED DEFAULT NULL COMMENT '为空表示系统默认情绪',
  emotion_type TINYINT NOT NULL COMMENT '1支出 2收入',
  name VARCHAR(50) NOT NULL COMMENT '情绪名称',
  icon VARCHAR(100) DEFAULT NULL COMMENT 'emoji 或图片路径',
  color VARCHAR(20) DEFAULT NULL COMMENT '颜色值',
  description VARCHAR(255) DEFAULT NULL COMMENT '情绪描述',
  is_system TINYINT NOT NULL DEFAULT 0 COMMENT '0自定义 1系统默认',
  sort_no INT NOT NULL DEFAULT 0 COMMENT '排序号',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_type (user_id, emotion_type),
  KEY idx_system_type (is_system, emotion_type),
  CONSTRAINT fk_emotions_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='情绪表';

CREATE TABLE account_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  client_record_id VARCHAR(64) DEFAULT NULL COMMENT '客户端记录ID，用于幂等同步',
  record_type TINYINT NOT NULL COMMENT '1支出 2收入',
  amount DECIMAL(12,2) NOT NULL COMMENT '金额，始终存正数',
  category_id BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
  emotion_id BIGINT UNSIGNED DEFAULT NULL COMMENT '情绪ID',
  note VARCHAR(255) DEFAULT NULL COMMENT '备注',
  occurred_at DATETIME NOT NULL COMMENT '业务发生时间',
  source TINYINT NOT NULL DEFAULT 1 COMMENT '1小程序 2后台导入 3其它',
  sync_version BIGINT NOT NULL DEFAULT 1 COMMENT '同步版本号',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '0正常 1已删除',
  deleted_at DATETIME DEFAULT NULL COMMENT '删除时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_client_record (user_id, client_record_id),
  KEY idx_user_time (user_id, occurred_at),
  KEY idx_user_type_time (user_id, record_type, occurred_at),
  KEY idx_user_category_time (user_id, category_id, occurred_at),
  KEY idx_user_emotion_time (user_id, emotion_id, occurred_at),
  KEY idx_user_updated (user_id, updated_at),
  CONSTRAINT fk_records_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_records_category FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT fk_records_emotion FOREIGN KEY (emotion_id) REFERENCES emotions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='记账记录表';

CREATE TABLE monthly_budgets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  budget_year SMALLINT NOT NULL COMMENT '年份',
  budget_month TINYINT NOT NULL COMMENT '月份 1-12',
  budget_amount DECIMAL(12,2) NOT NULL COMMENT '预算金额',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_month (user_id, budget_year, budget_month),
  KEY idx_user_year (user_id, budget_year),
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='月预算表';

CREATE TABLE user_devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  device_code VARCHAR(100) NOT NULL COMMENT '设备标识',
  device_name VARCHAR(100) DEFAULT NULL COMMENT '设备名称',
  platform VARCHAR(30) DEFAULT NULL COMMENT 'ios/android/devtools',
  last_active_at DATETIME DEFAULT NULL COMMENT '最后活跃时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_device (user_id, device_code),
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设备表';

CREATE TABLE sync_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  sync_type TINYINT NOT NULL COMMENT '1全量备份 2增量同步 3数据恢复',
  client_time DATETIME DEFAULT NULL COMMENT '客户端发起时间',
  server_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '服务端处理时间',
  record_count INT NOT NULL DEFAULT 0 COMMENT '处理记录数',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1成功 2失败',
  error_message VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_time (user_id, server_time),
  CONSTRAINT fk_sync_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='同步日志表';

INSERT INTO categories (id, user_id, category_type, name, icon, is_system, sort_no, status)
VALUES
  (1, NULL, 1, '餐饮', '🍜', 1, 10, 1),
  (2, NULL, 1, '购物', '🛍️', 1, 20, 1),
  (3, NULL, 1, '交通', '🚗', 1, 30, 1),
  (4, NULL, 1, '娱乐', '🎮', 1, 40, 1),
  (5, NULL, 1, '日用', '🏠', 1, 50, 1),
  (6, NULL, 1, '学习', '📚', 1, 60, 1),
  (7, NULL, 1, '人情', '👥', 1, 70, 1),
  (8, NULL, 1, '医疗', '🏥', 1, 80, 1),
  (101, NULL, 2, '工资', '💼', 1, 10, 1),
  (102, NULL, 2, '兼职', '🛠️', 1, 20, 1),
  (103, NULL, 2, '投资收益', '📈', 1, 30, 1),
  (104, NULL, 2, '礼金', '🎁', 1, 40, 1);

INSERT INTO emotions (id, user_id, emotion_type, name, icon, color, description, is_system, sort_no, status)
VALUES
  (1, NULL, 1, '开心犒劳', '😄', '#FFD700', '奖励自己、为快乐买单', 1, 10, 1),
  (2, NULL, 1, '心疼肉痛', '😣', '#DDA0DD', '价格高但必需支出', 1, 20, 1),
  (3, NULL, 1, '冲动后悔', '😖', '#FF6B6B', '一时脑热、买完后悔', 1, 30, 1),
  (4, NULL, 1, '无奈必需', '😐', '#A9A9A9', '房租、水电、通勤等刚性支出', 1, 40, 1),
  (5, NULL, 1, '治愈安慰', '🥰', '#ADD8E6', '不开心时的舒缓性消费', 1, 50, 1),
  (6, NULL, 1, '值得投资', '🤩', '#98FB98', '学习、健康、自我提升类消费', 1, 60, 1),
  (101, NULL, 2, '踏实安心', '🙂', '#B7E4C7', '工资到账、心里更有底气', 1, 10, 1),
  (102, NULL, 2, '惊喜收获', '🎉', '#FFE08A', '奖金、红包、意外之喜', 1, 20, 1),
  (103, NULL, 2, '努力值得', '💪', '#9AD1F5', '兼职、副业、项目回报', 1, 30, 1),
  (104, NULL, 2, '成长回报', '🌱', '#A8E6A1', '投资、学习或长期积累开始见效', 1, 40, 1),
  (105, NULL, 2, '被爱包围', '💝', '#F8B4C6', '礼金、家人支持、人情往来带来的温暖', 1, 50, 1),
  (106, NULL, 2, '如释重负', '😌', '#C9C9E8', '报销到账、欠款收回、压力减轻', 1, 60, 1);

ALTER TABLE categories AUTO_INCREMENT = 1000;
ALTER TABLE emotions AUTO_INCREMENT = 1000;

SET FOREIGN_KEY_CHECKS = 1;