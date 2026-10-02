-- ============================================================
-- BEAM Merchant CMS — MySQL Schema + Seed Data
-- Compatible: MySQL 8.0+ | PlanetScale | TiDB Serverless
--
-- NOTE dành cho PlanetScale:
--   PlanetScale không hỗ trợ FOREIGN KEY thực thi.
--   Xóa toàn bộ khối CONSTRAINT / FOREIGN KEY trước khi chạy.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- DROP (để chạy lại từ đầu an toàn)
-- ============================================================
DROP TABLE IF EXISTS `chart_data`;
DROP TABLE IF EXISTS `dashboard_stats`;
DROP TABLE IF EXISTS `dashboard_recent_transactions`;
DROP TABLE IF EXISTS `refunds`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `withdrawals`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `logins`;
DROP TABLE IF EXISTS `user_assigned_sub_merchants`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `permission_group_permissions`;
DROP TABLE IF EXISTS `permission_groups`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `permission_categories`;
DROP TABLE IF EXISTS `sub_merchants`;

-- ============================================================
-- CREATE TABLES
-- ============================================================

CREATE TABLE `permission_categories` (
  `id`   VARCHAR(20)  NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `permissions` (
  `id`          VARCHAR(50)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `category_id` VARCHAR(20)  NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_perm_cat_idx` (`category_id`),
  CONSTRAINT `fk_perm_cat` FOREIGN KEY (`category_id`)
    REFERENCES `permission_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `permission_groups` (
  `id`         VARCHAR(50)               NOT NULL,
  `name`       VARCHAR(100)              NOT NULL,
  `status`     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` VARCHAR(100)              NULL,
  `updated_by` VARCHAR(100)              NULL,
  `created_at` DATETIME(3)               NOT NULL,
  `updated_at` DATETIME(3)               NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `permission_group_permissions` (
  `group_id`      VARCHAR(50) NOT NULL,
  `permission_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`group_id`, `permission_id`),
  KEY `fk_pgp_perm_idx` (`permission_id`),
  CONSTRAINT `fk_pgp_group` FOREIGN KEY (`group_id`)
    REFERENCES `permission_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pgp_perm`  FOREIGN KEY (`permission_id`)
    REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `sub_merchants` (
  `id`                   VARCHAR(20)                        NOT NULL,
  `name`                 VARCHAR(200)                       NOT NULL,
  `business_type`        VARCHAR(100)                       NOT NULL,
  `contact`              VARCHAR(200)                       NOT NULL,
  `status`               ENUM('active','locked','inactive') NOT NULL DEFAULT 'active',
  `tax_code`             VARCHAR(20)                        NULL,
  `representative`       VARCHAR(150)                       NULL,
  `address`              TEXT                               NULL,
  `merchant_id`          VARCHAR(50)                        NULL,
  `access_key`           VARCHAR(100)                       NULL,
  `secret_key`           VARCHAR(200)                       NULL,
  `webhook_url`          VARCHAR(500)                       NULL,
  `bank_name`            VARCHAR(100)                       NULL,
  `bank_branch`          VARCHAR(200)                       NULL,
  `account_number`       VARCHAR(50)                        NULL,
  `account_name`         VARCHAR(150)                       NULL,
  `notify_enabled`       TINYINT(1)                         NOT NULL DEFAULT 0,
  `notify_tx_success`    TINYINT(1)                         NOT NULL DEFAULT 0,
  `notify_tx_failed`     TINYINT(1)                         NOT NULL DEFAULT 0,
  `notify_dispute`       TINYINT(1)                         NOT NULL DEFAULT 0,
  `notify_freeze`        TINYINT(1)                         NOT NULL DEFAULT 0,
  `notify_policy_change` TINYINT(1)                         NOT NULL DEFAULT 0,
  `notify_emails`        TEXT                               NULL,
  `e_invoice_enabled`    TINYINT(1)                         NOT NULL DEFAULT 0,
  `e_invoice_emails`     TEXT                               NULL,
  `lock_reason`          TEXT                               NULL,
  `locked_at`            DATETIME(3)                        NULL,
  `created_at`           DATETIME(3)                        NOT NULL,
  `updated_at`           DATETIME(3)                        NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `users` (
  `id`                          VARCHAR(50)             NOT NULL,
  `name`                        VARCHAR(150)            NOT NULL,
  `email`                       VARCHAR(200)            NOT NULL,
  `phone`                       VARCHAR(20)             NULL,
  `permission_group_id`         VARCHAR(50)             NULL,
  `permission_group_name`       VARCHAR(100)            NULL,
  `sub_merchant_scope`          ENUM('all','specific')  NOT NULL DEFAULT 'all',
  `assigned_sub_merchant_count` INT                     NULL,
  `status`                      ENUM('active','locked') NOT NULL DEFAULT 'active',
  `lock_reason`                 TEXT                    NULL,
  `locked_at`                   DATETIME(3)             NULL,
  `created_at`                  DATETIME(3)             NOT NULL,
  `updated_at`                  DATETIME(3)             NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`),
  KEY `fk_user_group_idx` (`permission_group_id`),
  CONSTRAINT `fk_user_group` FOREIGN KEY (`permission_group_id`)
    REFERENCES `permission_groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `user_assigned_sub_merchants` (
  `user_id`         VARCHAR(50) NOT NULL,
  `sub_merchant_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`user_id`, `sub_merchant_id`),
  KEY `fk_uasm_sub_idx` (`sub_merchant_id`),
  CONSTRAINT `fk_uasm_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uasm_sub`  FOREIGN KEY (`sub_merchant_id`)
    REFERENCES `sub_merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `logins` (
  `id`       VARCHAR(50)  NOT NULL,
  `user_id`  VARCHAR(50)  NOT NULL,
  `username` VARCHAR(200) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_login_username` (`username`),
  KEY `fk_login_user_idx` (`user_id`),
  CONSTRAINT `fk_login_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `transactions` (
  `id`                VARCHAR(20)  NOT NULL,
  `code`              VARCHAR(50)  NOT NULL,
  `card_type`         VARCHAR(20)  NOT NULL,
  `card_number`       VARCHAR(30)  NOT NULL,
  `card_holder_name`  VARCHAR(150) NOT NULL,
  `amount`            BIGINT       NOT NULL,
  `currency`          VARCHAR(10)  NOT NULL DEFAULT 'VND',
  `fee`               INT          NOT NULL DEFAULT 0,
  `net_amount`        BIGINT       NOT NULL,
  `sub_merchant_id`   VARCHAR(20)  NOT NULL,
  `sub_merchant_name` VARCHAR(200) NOT NULL,
  `customer_id`       VARCHAR(50)  NOT NULL,
  `customer_name`     VARCHAR(150) NOT NULL,
  `customer_phone`    VARCHAR(20)  NOT NULL,
  `created_at`        DATETIME(3)  NOT NULL,
  `status`            ENUM('success','pending','failed','refunded') NOT NULL,
  `description`       TEXT         NULL,
  `reference_code`    VARCHAR(100) NOT NULL,
  `payment_method`    VARCHAR(30)  NOT NULL,
  `bank_code`         VARCHAR(20)  NOT NULL,
  `response_code`     VARCHAR(10)  NOT NULL,
  `response_message`  VARCHAR(200) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_txn_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

-- ── Bảng liên kết nghiệp vụ: ────────────────────────────────────────────────
-- transactions  → refunds      (1 transaction → nhiều refund)
-- transactions  → complaints   (1 transaction → nhiều khiếu nại)
-- transactions  → orders       (1 order → 1 transaction khi thanh toán)
-- sub_merchants → withdrawals  (1 sub_merchant → nhiều yêu cầu rút tiền)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE `orders` (
  `id`                VARCHAR(50)  NOT NULL,
  `code`              VARCHAR(50)  NOT NULL,
  `source`            ENUM('api','payment_link') NOT NULL,
  `sub_merchant_id`   VARCHAR(20)  NOT NULL,
  `sub_merchant_name` VARCHAR(200) NOT NULL,
  `created_by`        VARCHAR(100) NULL,
  `amount`            BIGINT       NOT NULL,
  `transaction_id`    VARCHAR(20)  NULL,
  `transaction_code`  VARCHAR(50)  NULL,
  `payment_url`       VARCHAR(500) NULL,
  `status`            ENUM('paid','pending','cancelled','expired') NOT NULL DEFAULT 'pending',
  `created_at`        DATETIME(3)  NOT NULL,
  `updated_at`        DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_code` (`code`),
  KEY `fk_order_txn_idx` (`transaction_id`),
  CONSTRAINT `fk_order_txn` FOREIGN KEY (`transaction_id`)
    REFERENCES `transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `refunds` (
  `id`                VARCHAR(50)  NOT NULL,
  `code`              VARCHAR(50)  NOT NULL,
  `transaction_id`    VARCHAR(20)  NOT NULL,
  `transaction_code`  VARCHAR(50)  NOT NULL,
  `invoice_code`      VARCHAR(50)  NULL,
  `sub_merchant_id`   VARCHAR(20)  NOT NULL,
  `sub_merchant_name` VARCHAR(200) NOT NULL,
  `request_amount`    BIGINT       NOT NULL,
  `actual_amount`     BIGINT       NOT NULL DEFAULT 0,
  `fee_mb`            INT          NOT NULL DEFAULT 0,
  `fee_nm`            INT          NOT NULL DEFAULT 0,
  `recipient_name`    VARCHAR(150) NOT NULL,
  `recipient_card`    VARCHAR(30)  NULL,
  `created_by`        VARCHAR(100) NULL,
  `reason`            VARCHAR(200) NULL,
  `status`            ENUM('pending','approved','rejected','success') NOT NULL DEFAULT 'pending',
  `created_at`        DATETIME(3)  NOT NULL,
  `updated_at`        DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refund_code` (`code`),
  KEY `fk_refund_txn_idx` (`transaction_id`),
  CONSTRAINT `fk_refund_txn` FOREIGN KEY (`transaction_id`)
    REFERENCES `transactions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `complaints` (
  `id`              VARCHAR(50)  NOT NULL,
  `ticket_code`     VARCHAR(50)  NOT NULL,
  `transaction_id`  VARCHAR(20)  NULL,
  `transaction_code` VARCHAR(50) NULL,
  `source`          ENUM('customer','gateway','merchant') NOT NULL,
  `content`         TEXT         NOT NULL,
  `status`          ENUM('pending','processing','resolved','rejected') NOT NULL DEFAULT 'pending',
  `deadline`        DATETIME(3)  NULL,
  `note`            VARCHAR(200) NULL,
  `last_updated_at` DATETIME(3)  NULL,
  `created_at`      DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_complaint_ticket` (`ticket_code`),
  KEY `fk_complaint_txn_idx` (`transaction_id`),
  CONSTRAINT `fk_complaint_txn` FOREIGN KEY (`transaction_id`)
    REFERENCES `transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `withdrawals` (
  `id`                  VARCHAR(50)  NOT NULL,
  `code`                VARCHAR(50)  NOT NULL,
  `sub_merchant_id`     VARCHAR(20)  NOT NULL,
  `sub_merchant_name`   VARCHAR(200) NOT NULL,
  `sub_merchant_short`  VARCHAR(50)  NULL,
  `amount`              BIGINT       NOT NULL,
  `fee`                 INT          NOT NULL DEFAULT 0,
  `bank_name`           VARCHAR(100) NOT NULL,
  `bank_account`        VARCHAR(50)  NOT NULL,
  `account_name`        VARCHAR(150) NOT NULL,
  `status`              ENUM('pending','processing','success','failed') NOT NULL DEFAULT 'pending',
  `requested_at`        DATETIME(3)  NOT NULL,
  `created_at`          DATETIME(3)  NOT NULL,
  `updated_at`          DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_withdrawal_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `dashboard_recent_transactions` (
  `id`            VARCHAR(20)  NOT NULL,
  `code`          VARCHAR(50)  NOT NULL,
  `customer_name` VARCHAR(200) NOT NULL,
  `amount`        BIGINT       NOT NULL,
  `created_at`    DATETIME(3)  NOT NULL,
  `status`        ENUM('success','pending','failed','refunded') NOT NULL,
  `card_type`     VARCHAR(20)  NOT NULL,
  `card_number`   VARCHAR(30)  NOT NULL,
  `bank_code`     VARCHAR(50)  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `dashboard_stats` (
  `id`                 INT AUTO_INCREMENT NOT NULL,
  `total_balance`      BIGINT             NOT NULL,
  `daily_revenue`      BIGINT             NOT NULL,
  `daily_transactions` INT                NOT NULL,
  `conversion_rate`    DECIMAL(5,2)       NOT NULL,
  `recorded_at`        DATETIME(3)        NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------

CREATE TABLE `chart_data` (
  `id`                 INT AUTO_INCREMENT NOT NULL,
  `period_type`        ENUM('daily','weekly','monthly','yearly') NOT NULL,
  `label`              VARCHAR(10)  NOT NULL,
  `revenue`            BIGINT       NOT NULL,
  `transactions`       INT          NOT NULL,
  `total_revenue`      BIGINT       NOT NULL,
  `total_transactions` INT          NOT NULL,
  `growth_rate`        DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- ── 1. permission_categories ─────────────────────────────────
INSERT INTO `permission_categories` (`id`, `name`) VALUES
  ('CAT-TXN', 'Quản lý Giao dịch'),
  ('CAT-FIN', 'Quản lý Tài chính'),
  ('CAT-SUB', 'Quản lý Sub-merchant');

-- ── 2. permissions ───────────────────────────────────────────
INSERT INTO `permissions` (`id`, `name`, `category_id`) VALUES
  ('txn_view_list',            'Xem danh sách',            'CAT-TXN'),
  ('txn_search_detail',        'Tra cứu chi tiết',         'CAT-TXN'),
  ('txn_export_report',        'Xuất báo cáo',             'CAT-TXN'),
  ('txn_refund',               'Hoàn tiền (Refund)',        'CAT-TXN'),
  ('finance_view_balance',     'Xem số dư ví',             'CAT-FIN'),
  ('finance_create_withdrawal','Tạo yêu cầu rút tiền',     'CAT-FIN'),
  ('finance_manage_bank',      'Quản lý TK ngân hàng',     'CAT-FIN'),
  ('sub_merchant_view_list',   'Xem danh sách',            'CAT-SUB'),
  ('sub_merchant_lock_unlock', 'Khóa/Mở khóa',             'CAT-SUB'),
  ('sub_merchant_update',      'Cập nhật thông tin',       'CAT-SUB');

-- ── 3. permission_groups ─────────────────────────────────────
INSERT INTO `permission_groups`
  (`id`, `name`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`)
VALUES
  ('1777180056380', 'tester',             'active',   NULL,       'admin',    '2026-01-02 14:15:00.000', '2026-04-26 12:42:24.498'),
  ('1777180697039', 'Đối soát viên',      'active',   'Admin_01', 'admin',    '2026-04-26 05:18:17.039', '2026-04-27 13:39:19.750'),
  ('1777180735806', 'Admin',              'active',   'Admin_01', 'admin',    '2026-04-26 05:18:55.806', '2026-04-26 05:19:01.077'),
  ('1777300356296', 'Kế toán',            'active',   'Admin_01', 'admin',    '2026-04-27 14:32:36.297', '2026-04-28 00:55:07.873'),
  ('1777300369252', 'Vận Hành',           'inactive', 'Admin_01', 'Admin_01', '2026-04-27 14:32:49.252', '2026-04-27 14:32:49.252'),
  ('1777300386148', 'Super admin',        'inactive', 'Admin_01', 'Admin_01', '2026-04-27 14:33:06.148', '2026-04-27 14:33:06.148'),
  ('1777300411844', 'Super admin',        'inactive', 'Admin_01', 'Admin_01', '2026-04-27 14:33:31.844', '2026-04-27 14:33:31.844'),
  ('1777300429794', 'Quản trị bảo trì',  'inactive', 'Admin_01', 'Admin_01', '2026-04-27 14:33:49.794', '2026-04-27 14:33:49.794'),
  ('1777300442263', 'dev',                'inactive', 'Admin_01', 'Admin_01', '2026-04-27 14:34:02.263', '2026-04-27 14:34:02.263'),
  ('1777300462700', 'tester 2',           'inactive', 'Admin_01', 'Admin_01', '2026-04-27 14:34:22.700', '2026-04-27 14:34:22.700'),
  ('1777300475835', 'Nhân viên kỹ thuật','inactive', 'Admin_01', 'Admin_01', '2026-04-27 14:34:35.835', '2026-04-27 14:34:35.835');

-- ── 4. permission_group_permissions ──────────────────────────
INSERT INTO `permission_group_permissions` (`group_id`, `permission_id`) VALUES
  -- tester: all 10 permissions
  ('1777180056380','txn_view_list'), ('1777180056380','txn_search_detail'),
  ('1777180056380','txn_export_report'), ('1777180056380','txn_refund'),
  ('1777180056380','finance_view_balance'), ('1777180056380','finance_create_withdrawal'),
  ('1777180056380','finance_manage_bank'), ('1777180056380','sub_merchant_view_list'),
  ('1777180056380','sub_merchant_lock_unlock'), ('1777180056380','sub_merchant_update'),
  -- Đối soát viên: txn + finance (7)
  ('1777180697039','txn_view_list'), ('1777180697039','txn_search_detail'),
  ('1777180697039','txn_export_report'), ('1777180697039','txn_refund'),
  ('1777180697039','finance_view_balance'), ('1777180697039','finance_create_withdrawal'),
  ('1777180697039','finance_manage_bank'),
  -- Admin: all 10
  ('1777180735806','txn_view_list'), ('1777180735806','txn_search_detail'),
  ('1777180735806','txn_export_report'), ('1777180735806','txn_refund'),
  ('1777180735806','finance_view_balance'), ('1777180735806','finance_create_withdrawal'),
  ('1777180735806','finance_manage_bank'), ('1777180735806','sub_merchant_view_list'),
  ('1777180735806','sub_merchant_lock_unlock'), ('1777180735806','sub_merchant_update'),
  -- Kế toán: txn only (4)
  ('1777300356296','txn_view_list'), ('1777300356296','txn_search_detail'),
  ('1777300356296','txn_export_report'), ('1777300356296','txn_refund'),
  -- Vận Hành: sub + finance (6)
  ('1777300369252','sub_merchant_view_list'), ('1777300369252','sub_merchant_lock_unlock'),
  ('1777300369252','sub_merchant_update'), ('1777300369252','finance_view_balance'),
  ('1777300369252','finance_create_withdrawal'), ('1777300369252','finance_manage_bank'),
  -- Super admin (1): all 10
  ('1777300386148','txn_view_list'), ('1777300386148','txn_search_detail'),
  ('1777300386148','txn_export_report'), ('1777300386148','txn_refund'),
  ('1777300386148','finance_view_balance'), ('1777300386148','finance_create_withdrawal'),
  ('1777300386148','finance_manage_bank'), ('1777300386148','sub_merchant_view_list'),
  ('1777300386148','sub_merchant_lock_unlock'), ('1777300386148','sub_merchant_update'),
  -- Super admin (2): all 10
  ('1777300411844','finance_view_balance'), ('1777300411844','finance_create_withdrawal'),
  ('1777300411844','finance_manage_bank'), ('1777300411844','txn_view_list'),
  ('1777300411844','txn_search_detail'), ('1777300411844','txn_export_report'),
  ('1777300411844','txn_refund'), ('1777300411844','sub_merchant_view_list'),
  ('1777300411844','sub_merchant_lock_unlock'), ('1777300411844','sub_merchant_update'),
  -- Quản trị bảo trì: all 10
  ('1777300429794','txn_view_list'), ('1777300429794','txn_search_detail'),
  ('1777300429794','txn_export_report'), ('1777300429794','txn_refund'),
  ('1777300429794','finance_view_balance'), ('1777300429794','finance_create_withdrawal'),
  ('1777300429794','finance_manage_bank'), ('1777300429794','sub_merchant_view_list'),
  ('1777300429794','sub_merchant_lock_unlock'), ('1777300429794','sub_merchant_update'),
  -- dev: 1
  ('1777300442263','txn_view_list'),
  -- tester 2: all 10
  ('1777300462700','txn_view_list'), ('1777300462700','txn_search_detail'),
  ('1777300462700','txn_export_report'), ('1777300462700','txn_refund'),
  ('1777300462700','finance_view_balance'), ('1777300462700','finance_create_withdrawal'),
  ('1777300462700','finance_manage_bank'), ('1777300462700','sub_merchant_view_list'),
  ('1777300462700','sub_merchant_lock_unlock'), ('1777300462700','sub_merchant_update'),
  -- Nhân viên kỹ thuật: all 10
  ('1777300475835','txn_view_list'), ('1777300475835','txn_search_detail'),
  ('1777300475835','txn_export_report'), ('1777300475835','txn_refund'),
  ('1777300475835','finance_view_balance'), ('1777300475835','finance_create_withdrawal'),
  ('1777300475835','finance_manage_bank'), ('1777300475835','sub_merchant_view_list'),
  ('1777300475835','sub_merchant_lock_unlock'), ('1777300475835','sub_merchant_update');

-- ── 5. sub_merchants ─────────────────────────────────────────
INSERT INTO `sub_merchants`
  (`id`,`name`,`business_type`,`contact`,`status`,`tax_code`,`representative`,`address`,
   `merchant_id`,`access_key`,`secret_key`,`webhook_url`,
   `bank_name`,`bank_branch`,`account_number`,`account_name`,
   `notify_enabled`,`notify_tx_success`,`notify_tx_failed`,`notify_dispute`,`notify_freeze`,`notify_policy_change`,
   `notify_emails`,`e_invoice_enabled`,`e_invoice_emails`,
   `lock_reason`,`locked_at`,`created_at`,`updated_at`)
VALUES
(
  'SUB-00123','Cửa hàng Thời trang ABC','Business Retail','0909 123 456','active',
  '0312345678','Nguyễn Văn A','123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  'MCH-ABCD1234','AK1234567890ABCDEF123456','SK1234567890ABCDEF1234567890ABCDEF1234567890ABCD',
  'https://fashionabc.vn/webhook/payment',
  'Vietcombank','Chi nhánh TP. Hồ Chí Minh','1234567890','NGUYEN VAN A',
  1,1,0,1,1,0,'admin@fashionabc.vn',1,'ketoan@fashionabc.vn',
  NULL,NULL,'2026-01-05 08:00:00.000','2026-04-27 14:23:51.940'
),
(
  'SUB-00125','Siêu thị Mini Mart','F&B Service','owner@minimart.vn,manager@minimart.vn','active',
  '0398765432','Lê Văn C','78 Đường Đinh Tiên Hoàng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
  'MCH-IJKL9012','AK9012345678IJKLMN901234','SK9012345678IJKLMN9012345678IJKLMN9012345678IJKL',
  'https://minimart.vn/api/payment-callback',
  'BIDV','Chi nhánh Quận 1','1122334455','LE VAN C',
  1,1,1,1,1,1,'owner@minimart.vn,manager@minimart.vn',1,'ketoan@minimart.vn',
  NULL,NULL,'2026-01-02 14:15:00.000','2026-04-27 14:17:28.524'
),
(
  'SUB-00126','Nhà thuốc Bình An','Healthcare','0977 111 222','active',
  '0287654321','Phạm Thị D','22 Đường Trần Hưng Đạo, Phường Cầu Ông Lãnh, Quận 1, TP. Hồ Chí Minh',
  'MCH-MNOP3456','AK3456789012MNOPQR345678','SK3456789012MNOPQR3456789012MNOPQR3456789012MNOP',
  'https://nhathuocbinhan.vn/callback',
  'MB Bank','Chi nhánh Quận 5','5566778899','PHAM THI D',
  1,1,1,0,1,0,'binhan.pharmacy@gmail.com',0,'',
  NULL,NULL,'2026-01-01 10:00:00.000','2026-04-27 14:13:36.895'
),
(
  'SUB-00127','Tiệm Bánh Mì Sài Gòn','F&B Service','0966 333 444','active',
  NULL,'Hoàng Văn E','5 Đường Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
  'MCH-QRST7890','AK7890123456QRSTUVW789012','SK7890123456QRSTUVW7890123456QRSTUVW7890123456QR',
  NULL,
  'Agribank',NULL,'4433221100','HOANG VAN E',
  1,1,0,0,0,0,'banhmisaigon@gmail.com',0,'',
  NULL,NULL,'2025-12-28 07:30:00.000','2026-04-27 14:14:48.920'
),
(
  'SUB-00128','Điện máy Xanh Mini','Electronics','0955 888 999','active',
  '0376543210','Vũ Thị F','99 Đường Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
  'MCH-UVWX1234','AK1234567890UVWXYZ123456','SK1234567890UVWXYZ1234567890UVWXYZ1234567890UVWX',
  'https://dien-may-xanh-mini.vn/webhook',
  'VietinBank','Chi nhánh Quận 3','6677889900','VU THI F',
  0,0,0,0,0,0,NULL,1,'ketoan@dien-may-xanh-mini.vn',
  NULL,NULL,'2025-12-25 16:45:00.000',NULL
),
(
  'SUB-00129','Highlands Coffee - Vincom','F&B Service','0243 999 888','active',
  '0102030405','Nguyễn Văn G','Tầng 1 Vincom Center, Bà Triệu, Hai Bà Trưng, Hà Nội',
  'MCH-HL001','AKHL00123456789','SKHL00123456789012345678901234567890',
  'https://highlands.vn/webhook',
  'Techcombank','Chi nhánh Hà Nội','19033445566011','CONG TY CA PHE HIGHLANDS',
  1,1,1,1,0,0,'finance@highlands.vn',1,'invoice@highlands.vn',
  NULL,NULL,'2026-02-10 09:00:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00130','WinMart+ Thảo Điền','Business Retail','0283 111 222','active',
  '0304050607','Lê Thị H','15 Thảo Điền, Quận 2, TP. Hồ Chí Minh',
  'MCH-WM002','AKWM00234567890','SKWM0023456789012345678901234567890',
  NULL,
  'VietinBank','Chi nhánh TP.HCM','110022334455','WINMART PLUS THAO DIEN',
  1,1,0,1,1,1,'store.thaodien@winmart.vn',1,'account@winmart.vn',
  NULL,NULL,'2026-02-15 07:30:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00131','Phúc Long Coffee & Tea','F&B Service','0283 555 666','active',
  '0307080910','Trần Văn I','42 Ngô Đức Kế, Quận 1, TP. Hồ Chí Minh',
  'MCH-PL003','AKPL00345678901','SKPL003456789012345678901234567890',
  'https://phuclong.com.vn/api/callback',
  'ACB','Chi nhánh Sài Gòn','2233445566','PHUC LONG TEA CORP',
  1,1,1,0,0,1,'ops@phuclong.com.vn',1,'billing@phuclong.com.vn',
  NULL,NULL,'2026-02-20 10:15:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00132','Cửa hàng Guardian','Healthcare','1900 444 555','active',
  '0309101112','Phạm Văn J','201 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
  'MCH-GD004','AKGD00456789012','SKGD00456789012345678901234567890',
  'https://guardian.com.vn/webhook',
  'HSBC','Chi nhánh TP.HCM','3344556677','GUARDIAN VIETNAM',
  1,1,0,1,1,0,'admin@guardian.com.vn',1,'tax@guardian.com.vn',
  NULL,NULL,'2026-03-01 08:45:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00133','Circle K Lê Thánh Tôn','Business Retail','0283 777 888','active',
  '0311121314','Vũ Văn K','15 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh',
  'MCH-CK005','AKCK00567890123','SKCK0056789012345678901234567890',
  NULL,
  'VIB','Chi nhánh Gia Định','4455667788','CIRCLE K VIETNAM',
  1,1,1,0,1,1,'store.ltt@circlek.com.vn',0,NULL,
  NULL,NULL,'2026-03-05 00:00:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00134','Pizza Hut - CMT8','F&B Service','1900 1822','active',
  '0313141516','Đặng Văn L','397 Cách Mạng Tháng 8, Quận 10, TP. Hồ Chí Minh',
  'MCH-PH006','AKPH00678901234','SKPH00678901234567890123456789012345',
  'https://pizzahut.vn/payment-status',
  'VPBank','Chi nhánh TP.HCM','556677889900','PIZZA HUT VIETNAM',
  1,1,1,1,0,0,'delivery@pizzahut.vn',1,'invoice@pizzahut.vn',
  NULL,NULL,'2026-03-10 11:00:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00135','Medicare - Aeon Mall','Healthcare','0283 999 111','active',
  '0315161718','Hoàng Thị M','Gian hàng F21, Aeon Mall Tân Phú, TP. Hồ Chí Minh',
  'MCH-MC007','AKMC00789012345','SKMC0078901234567890123456789012345',
  NULL,
  'Standard Chartered','Chi nhánh Quận 1','6677889911','MEDICARE VIETNAM',
  1,1,0,1,0,0,'aeon.tanphu@medicare.vn',1,'billing@medicare.vn',
  NULL,NULL,'2026-03-15 10:30:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00136','CellphoneS Nguyễn Thái Học','Electronics','1800 2097','active',
  '0317181920','Bùi Văn N','134 Nguyễn Thái Học, Quận 1, TP. Hồ Chí Minh',
  'MCH-CP008','AKCP00890123456','SKCP008901234567890123456789012345',
  'https://cellphones.com.vn/payment/webhook',
  'Vietcombank','Chi nhánh Tân Định','7788990011','CELLPHONES RETAIL',
  1,1,1,1,1,1,'online@cellphones.com.vn',1,'ketoan@cellphones.com.vn',
  NULL,NULL,'2026-03-20 08:00:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00137','Hoàng Hà Mobile','Electronics','1900 2091','active',
  '0319202122','Trịnh Văn O','55 Trần Quang Khải, Quận 1, TP. Hồ Chí Minh',
  'MCH-HH009','AKHH00901234567','SKHH00901234567890123456789012345678',
  'https://hoanghamobile.com/callback',
  'MB Bank','Chi nhánh Hà Nội','8899001122','HOANG HA MOBILE',
  0,0,0,0,0,0,NULL,1,'tax@hoanghamobile.com',
  NULL,NULL,'2026-03-25 09:00:00.000','2026-04-27 14:30:00.000'
),
(
  'SUB-00138','Thế Giới Di Động','Electronics','1800 1060','active',
  '0321222324','Nguyễn Đức T','128 Trần Quang Khải, Quận 1, TP. Hồ Chí Minh',
  'MCH-TGDD010','AKTG01012345678','SKTG01012345678901234567890123456789',
  'https://thegioididong.com/api/payment',
  'VietinBank','Chi nhánh Quận 1','990011223344','THE GIOI DI DONG CORP',
  1,1,1,1,1,1,'cskh@thegioididong.com',1,'invoice@thegioididong.com',
  NULL,NULL,'2026-04-01 07:00:00.000','2026-04-27 14:30:00.000'
);

-- ── 6. users ─────────────────────────────────────────────────
INSERT INTO `users`
  (`id`,`name`,`email`,`phone`,`permission_group_id`,`permission_group_name`,
   `sub_merchant_scope`,`assigned_sub_merchant_count`,
   `status`,`lock_reason`,`locked_at`,`created_at`,`updated_at`)
VALUES
(
  'USR-001','Trần Quang Huy','huy.tq@merchant.com','0912345678',
  '1777300429794', NULL,
  'all', NULL,
  'active', NULL, NULL,
  '2025-12-10 00:00:00.000','2026-04-27 14:50:18.296'
),
(
  '1777297122085','Nông Thị Thúy Nga','nga@gmail.com','0966778899',
  '1777180697039','Đối soát viên',
  'specific', 3,
  'locked','Vi phạm chính sách','2026-04-27 14:35:58.319',
  '2026-04-27 13:38:42.085','2026-04-27 14:35:58.709'
);

-- ── 7. user_assigned_sub_merchants ───────────────────────────
INSERT INTO `user_assigned_sub_merchants` (`user_id`, `sub_merchant_id`) VALUES
  ('USR-001','SUB-00123'), ('USR-001','SUB-00125'), ('USR-001','SUB-00126'),
  ('USR-001','SUB-00127'), ('USR-001','SUB-00128'), ('USR-001','SUB-00129'),
  ('USR-001','SUB-00130'), ('USR-001','SUB-00131'), ('USR-001','SUB-00132'),
  ('USR-001','SUB-00133'), ('USR-001','SUB-00134'), ('USR-001','SUB-00135'),
  ('USR-001','SUB-00136'), ('USR-001','SUB-00137'), ('USR-001','SUB-00138'),
  ('1777297122085','SUB-00123'), ('1777297122085','SUB-00125'),
  ('1777297122085','SUB-00126'), ('1777297122085','SUB-00129'),
  ('1777297122085','SUB-00131');

-- ── 8. logins ────────────────────────────────────────────────
-- password gốc của 'a' là bcrypt hash (không thay đổi)
INSERT INTO `logins` (`id`,`user_id`,`username`,`password`) VALUES
  ('1',            'USR-001',       'a',
   '$2b$10$oyZ8nmnYVEq2K9heyhjKa.JhDik2pc7miofg.AuBkJGOqcvenZOde'),
  ('1777297123305','1777297122085', 'nga@gmail.com',
   '$2b$10$uFU/4IVBJuBuI9C3PmJ58.TF36pGG2dz1Qw3mkajJitDUENKHMpSK');

-- ── 9a. orders ───────────────────────────────────────────────
INSERT INTO `orders`
  (`id`,`code`,`source`,`sub_merchant_id`,`sub_merchant_name`,`created_by`,
   `amount`,`transaction_id`,`transaction_code`,`payment_url`,`status`,`created_at`,`updated_at`)
VALUES
('ORD001','ORD-2026-001','api','SM001','Cà Phê Khang - Chi nhánh 1','Hệ thống',
 1500000,'TX001','TXN2025040001',NULL,'paid','2026-01-13 10:30:00.000','2026-01-13 10:31:00.000'),
('ORD002','PLK-2026-099','payment_link','SM002','Fashion Store ABC - Online','nguyen_van_a',
 450000,NULL,NULL,'https://pay.beamgateway.vn/checkout/plk-2026-099','pending','2026-01-13 09:15:00.000',NULL),
('ORD003','ORD-2026-045','api','SM003','Tech Solutions VN - HCM','Hệ thống',
 3500000,'TX003','TXN2025040003',NULL,'pending','2026-01-12 14:00:00.000',NULL),
('ORD004','PLK-2026-072','payment_link','SM001','Cà Phê Khang - Chi nhánh 2','le_thi_b',
 75000,'TX006','TXN2025040006','https://pay.beamgateway.vn/checkout/plk-2026-072','paid','2026-01-12 07:00:00.000','2026-01-12 07:01:00.000'),
('ORD005','ORD-2026-031','api','SM004','Siêu Thị Mini Minh Phát','Hệ thống',
 1650000,'TX010','TXN2025040010',NULL,'paid','2026-01-11 11:00:00.000','2026-01-11 11:02:00.000'),
('ORD006','PLK-2026-108','payment_link','SM005','Lotus Beauty Spa - Q1','tran_van_c',
 850000,'TX005','TXN2025040005','https://pay.beamgateway.vn/checkout/plk-2026-108','paid','2026-01-10 11:30:00.000','2026-01-10 11:32:00.000'),
('ORD007','ORD-2026-019','api','SM002','Fashion Store ABC - Quận 3','Hệ thống',
 2100000,'TX007','TXN2025040007',NULL,'paid','2026-01-09 09:30:00.000','2026-01-09 09:31:00.000'),
('ORD008','PLK-2026-055','payment_link','SM003','Tech Solutions VN - HN','pham_thi_d',
 420000,NULL,NULL,'https://pay.beamgateway.vn/checkout/plk-2026-055','expired','2026-01-08 08:00:00.000','2026-01-08 09:00:00.000'),
('ORD009','ORD-2026-062','api','SM004','Siêu Thị Mini Minh Phát - CN2','Hệ thống',
 250000,NULL,NULL,NULL,'cancelled','2026-01-07 10:45:00.000','2026-01-07 10:50:00.000'),
('ORD010','PLK-2026-033','payment_link','SM005','Lotus Beauty Spa - Q3','nguyen_van_a',
 680000,NULL,NULL,'https://pay.beamgateway.vn/checkout/plk-2026-033','pending','2026-01-06 14:00:00.000',NULL);

-- ── 9. transactions ──────────────────────────────────────────
INSERT INTO `transactions`
  (`id`,`code`,`card_type`,`card_number`,`card_holder_name`,
   `amount`,`currency`,`fee`,`net_amount`,
   `sub_merchant_id`,`sub_merchant_name`,`customer_id`,`customer_name`,`customer_phone`,
   `created_at`,`status`,`description`,`reference_code`,
   `payment_method`,`bank_code`,`response_code`,`response_message`)
VALUES
('TX001','TXN2025040001','visa','4532 **** **** 1234','NGUYEN VAN AN',
 500000,'VND',5000,495000,'SM001','Cà Phê Khang - Chi nhánh 1','CUST001','Nguyễn Văn An','0901234567',
 '2025-04-01 08:30:00.000','success','Thanh toán đơn hàng #DH2025040001','VCB20250401001',
 'credit_card','VCB','00','Giao dịch thành công'),
('TX002','TXN2025040002','mastercard','5425 **** **** 5678','LE THI HOA',
 1200000,'VND',12000,1188000,'SM002','Fashion Store ABC - Online','CUST002','Lê Thị Hoa','0912345678',
 '2025-04-01 09:15:00.000','success','Mua hàng thời trang #DH2025040002','TCB20250401002',
 'debit_card','TCB','00','Giao dịch thành công'),
('TX003','TXN2025040003','napas','9704 **** **** 9012','TRAN MINH TUAN',
 3500000,'VND',35000,3465000,'SM003','Tech Solutions VN - HCM','CUST003','Trần Minh Tuấn','0987654321',
 '2025-04-01 10:00:00.000','pending','Thanh toán dịch vụ phần mềm','MB20250401003',
 'debit_card','MB','01','Đang xử lý'),
('TX004','TXN2025040004','visa','4111 **** **** 3456','VO MINH PHAT',
 250000,'VND',2500,247500,'SM004','Siêu Thị Mini Minh Phát','CUST004','Võ Minh Phát','0934567890',
 '2025-04-01 10:45:00.000','failed','Mua hàng tạp hóa','BIDV20250401004',
 'credit_card','BIDV','51','Không đủ số dư'),
('TX005','TXN2025040005','amex','3714 ****** *7890','NGUYEN THI MAI',
 850000,'VND',8500,841500,'SM005','Lotus Beauty Spa - Q1','CUST005','Nguyễn Thị Mai','0956789012',
 '2025-04-01 11:30:00.000','refunded','Dịch vụ spa & massage','ACB20250401005',
 'credit_card','ACB','00','Hoàn tiền thành công'),
('TX006','TXN2025040006','napas','9704 **** **** 1357','PHAM VAN DUC',
 75000,'VND',750,74250,'SM001','Cà Phê Khang - Chi nhánh 2','CUST006','Phạm Văn Đức','0967890123',
 '2025-04-02 07:00:00.000','success','Thanh toán đồ uống','VCB20250402006',
 'qr','VCB','00','Giao dịch thành công'),
('TX007','TXN2025040007','visa','4539 **** **** 2468','HOANG VAN BINH',
 2100000,'VND',21000,2079000,'SM002','Fashion Store ABC - Quận 3','CUST007','Hoàng Văn Bình','0978901234',
 '2025-04-02 09:30:00.000','success','Mua quần áo & phụ kiện','TPB20250402007',
 'credit_card','TPB','00','Giao dịch thành công'),
('TX008','TXN2025040008','mastercard','5105 **** **** 1357','NGUYEN THI THU',
 680000,'VND',6800,673200,'SM005','Lotus Beauty Spa - Q3','CUST008','Nguyễn Thị Thu','0989012345',
 '2025-04-02 14:00:00.000','pending','Dịch vụ làm tóc cao cấp','VIB20250402008',
 'debit_card','VIB','01','Đang xử lý'),
('TX009','TXN2025040009','napas','9704 **** **** 9753','DO THANH LONG',
 420000,'VND',4200,415800,'SM003','Tech Solutions VN - HN','CUST009','Đỗ Thanh Long','0912378456',
 '2025-04-03 08:15:00.000','failed','Gia hạn gói dịch vụ','AGRI20250403009',
 'debit_card','AGRI','05','Thẻ không hợp lệ'),
('TX010','TXN2025040010','visa','4916 **** **** 6248','BUI THI LINH',
 1650000,'VND',16500,1633500,'SM004','Siêu Thị Mini Minh Phát - CN2','CUST010','Bùi Thị Linh','0923456789',
 '2025-04-03 11:00:00.000','success','Mua sắm hàng tiêu dùng','VCB20250403010',
 'credit_card','VCB','00','Giao dịch thành công');

-- ── 10a. refunds ─────────────────────────────────────────────
INSERT INTO `refunds`
  (`id`,`code`,`transaction_id`,`transaction_code`,`invoice_code`,
   `sub_merchant_id`,`sub_merchant_name`,`request_amount`,`actual_amount`,`fee_mb`,`fee_nm`,
   `recipient_name`,`recipient_card`,`created_by`,`reason`,`status`,`created_at`,`updated_at`)
VALUES
('RF001','REF260111001','TX001','TXN2025040001','INV-2025-001',
 'SM001','Cà Phê Khang - Chi nhánh 1',500000,500000,0,0,
 'NGUYEN VAN AN','4532 **** **** 1234','Admin_CH01','Khách hàng yêu cầu hoàn','pending',
 '2026-01-11 14:30:00.000','2026-01-11 14:30:00.000'),
('RF002','REF260110055','TX002','TXN2025040002','INV-2025-089',
 'SM002','Fashion Store ABC - Online',200000,200000,2200,0,
 'LE THI HOA','5425 **** **** 5678','Hệ thống Vi MoMo','Khách hàng đổi ý','success',
 '2026-01-10 09:15:00.000','2026-01-10 09:30:00.000'),
('RF003','REF260109032','TX007','TXN2025040007','INV-2025-102',
 'SM002','Fashion Store ABC - Quận 3',2100000,2100000,0,0,
 'HOANG VAN BINH','4539 **** **** 2468','Admin_CH02','Sản phẩm bị lỗi','approved',
 '2026-01-09 10:00:00.000','2026-01-09 10:30:00.000'),
('RF004','REF260108077','TX006','TXN2025040006',NULL,
 'SM001','Cà Phê Khang - Chi nhánh 2',75000,0,0,0,
 'PHAM VAN DUC','9704 **** **** 1357','Hệ thống','Giao dịch trùng lặp','rejected',
 '2026-01-08 08:00:00.000','2026-01-08 09:00:00.000'),
('RF005','REF260107019','TX010','TXN2025040010','INV-2025-210',
 'SM004','Siêu Thị Mini Minh Phát - CN2',1650000,1650000,3300,0,
 'BUI THI LINH','4916 **** **** 6248','Admin_CH04','Sản phẩm không đúng mô tả','success',
 '2026-01-07 12:00:00.000','2026-01-07 14:00:00.000');

-- ── 10b. complaints ───────────────────────────────────────────
INSERT INTO `complaints`
  (`id`,`ticket_code`,`transaction_id`,`transaction_code`,`source`,`content`,
   `status`,`deadline`,`note`,`last_updated_at`,`created_at`)
VALUES
('CP001','FLX-10295','TX001','TXN2025040001','customer','Chưa nhận hàng sau khi thanh toán',
 'pending','2026-04-15 23:59:00.000',NULL,'2026-04-12 09:15:00.000','2026-04-12 09:15:00.000'),
('CP002','FLX-10280','TX002','TXN2025040002','gateway','Tra soát giao dịch nghi ngờ gian lận',
 'processing','2026-04-13 23:59:00.000','Chờ Merchant bổ sung','2026-04-12 08:30:00.000','2026-04-11 14:20:00.000'),
('CP003','FLX-10275','TX007','TXN2025040007','merchant','Khiếu nại đối soát tiền nhầm',
 'processing','2026-04-15 23:59:00.000','Chờ Cổng phản hồi','2026-03-11 16:00:00.000','2026-03-10 08:00:00.000'),
('CP004','FLX-10250','TX005','TXN2025040005','customer','Lỗi hoàn tiền không nhận được',
 'resolved',NULL,NULL,'2026-03-09 11:00:00.000','2026-03-08 10:00:00.000'),
('CP005','FLX-10245','TX004','TXN2025040004','gateway','Chargeback - Bác bỏ giao dịch',
 'rejected',NULL,NULL,'2026-03-08 09:00:00.000','2026-03-07 16:30:00.000');

-- ── 10c. withdrawals ──────────────────────────────────────────
INSERT INTO `withdrawals`
  (`id`,`code`,`sub_merchant_id`,`sub_merchant_name`,`sub_merchant_short`,
   `amount`,`fee`,`bank_name`,`bank_account`,`account_name`,
   `status`,`requested_at`,`created_at`,`updated_at`)
VALUES
('WD001','WDR26039901','SUB-00123','Cửa hàng Thời trang ABC','SMC-001',
 15000000,3300,'VIETCOMBANK','8071****8888','TRAN THI B',
 'pending','2026-03-31 10:30:15.000','2026-03-31 10:30:15.000',NULL),
('WD002','WDR26039885','SUB-00125','Siêu thị Mini Mart','SMC-002',
 125450000,5500,'TECHCOMBANK','1903****1234','TRAN THI A',
 'processing','2026-03-31 01:00:05.000','2026-03-31 01:00:05.000','2026-03-31 02:00:00.000'),
('WD003','WDR26039542','SUB-00123','Cửa hàng Thời trang ABC','SMC-001',
 5000000,3300,'MB BANK','8551****6789','NGUYEN VAN A',
 'success','2026-03-30 15:20:44.000','2026-03-30 15:20:44.000','2026-03-30 16:00:00.000'),
('WD004','WDR26039210','SUB-00126','Nhà thuốc Bình An','SMC-003',
 2300000,3300,'BIDV','1241****4455','LE VAN C',
 'failed','2026-03-29 01:00:10.000','2026-03-29 01:00:10.000','2026-03-29 02:00:00.000'),
('WD005','WDR26038971','SUB-00127','Tiệm Bánh Mì Sài Gòn','SMC-004',
 8750000,3300,'AGRIBANK','3302****9988','HOANG VAN E',
 'success','2026-03-28 09:15:00.000','2026-03-28 09:15:00.000','2026-03-28 10:00:00.000');

-- ── 10. dashboard_recent_transactions ────────────────────────
INSERT INTO `dashboard_recent_transactions`
  (`id`,`code`,`customer_name`,`amount`,`created_at`,`status`,`card_type`,`card_number`,`bank_code`)
VALUES
  ('1','TXN12345678','nguyen***@gmail.com',  500000, '2026-01-02 10:25:00.000','success', 'VISA',       '4111 22** **** 1111','Vietcombank'),
  ('2','TXN12345679','tran***@gmail.com',   1200000, '2026-01-02 10:20:00.000','pending', 'MASTERCARD', '0968 *** 123',       'Techcombank'),
  ('3','TXN12345680','le****@yahoo.com',     350000, '2026-01-02 10:15:00.000','success', 'NAPAS',      '9704 16** **** 8888','MB'),
  ('4','TXN12345681','pham**@gmail.com',    2500000, '2026-01-02 10:10:00.000','failed',  'VISA',       '**** **** **** 4444','ACB'),
  ('5','TXN12345682','vo***@gmail.com',      750000, '2026-01-02 10:05:00.000','success', 'MASTERCARD', '**** **** **** 2222','VPBank');

-- ── 11. dashboard_stats ───────────────────────────────────────
INSERT INTO `dashboard_stats`
  (`total_balance`,`daily_revenue`,`daily_transactions`,`conversion_rate`,`recorded_at`)
VALUES
  (1250000000, 45800000, 1204, 94.20, '2026-01-02 10:30:00.000');

-- ── 12. chart_data ────────────────────────────────────────────
-- monthly
INSERT INTO `chart_data` (`period_type`,`label`,`revenue`,`transactions`,`total_revenue`,`total_transactions`,`growth_rate`) VALUES
  ('monthly','T1',  45000000, 120, 796000000,2048,12.50),
  ('monthly','T2',  52000000, 135, 796000000,2048,12.50),
  ('monthly','T3',  48000000, 128, 796000000,2048,12.50),
  ('monthly','T4',  61000000, 158, 796000000,2048,12.50),
  ('monthly','T5',  55000000, 142, 796000000,2048,12.50),
  ('monthly','T6',  67000000, 171, 796000000,2048,12.50),
  ('monthly','T7',  72000000, 185, 796000000,2048,12.50),
  ('monthly','T8',  68000000, 174, 796000000,2048,12.50),
  ('monthly','T9',  75000000, 192, 796000000,2048,12.50),
  ('monthly','T10', 83000000, 210, 796000000,2048,12.50),
  ('monthly','T11', 79000000, 201, 796000000,2048,12.50),
  ('monthly','T12', 91000000, 232, 796000000,2048,12.50);

-- weekly
INSERT INTO `chart_data` (`period_type`,`label`,`revenue`,`transactions`,`total_revenue`,`total_transactions`,`growth_rate`) VALUES
  ('weekly','T1', 18200000, 48, 186900000,481,7.30),
  ('weekly','T2', 21500000, 55, 186900000,481,7.30),
  ('weekly','T3', 19800000, 51, 186900000,481,7.30),
  ('weekly','T4', 24300000, 63, 186900000,481,7.30),
  ('weekly','T5', 22700000, 58, 186900000,481,7.30),
  ('weekly','T6', 26100000, 67, 186900000,481,7.30),
  ('weekly','T7', 28400000, 73, 186900000,481,7.30),
  ('weekly','T8', 25900000, 66, 186900000,481,7.30);

-- daily
INSERT INTO `chart_data` (`period_type`,`label`,`revenue`,`transactions`,`total_revenue`,`total_transactions`,`growth_rate`) VALUES
  ('daily','T2', 4200000, 12, 38200000,102,5.80),
  ('daily','T3', 5100000, 14, 38200000,102,5.80),
  ('daily','T4', 3800000, 10, 38200000,102,5.80),
  ('daily','T5', 6300000, 17, 38200000,102,5.80),
  ('daily','T6', 7200000, 19, 38200000,102,5.80),
  ('daily','T7', 8500000, 22, 38200000,102,5.80),
  ('daily','CN', 3100000,  8, 38200000,102,5.80);

-- yearly
INSERT INTO `chart_data` (`period_type`,`label`,`revenue`,`transactions`,`total_revenue`,`total_transactions`,`growth_rate`) VALUES
  ('yearly','2021', 520000000,1320,2706000000,6928,12.10),
  ('yearly','2022', 680000000,1740,2706000000,6928,12.10),
  ('yearly','2023', 710000000,1820,2706000000,6928,12.10),
  ('yearly','2024', 796000000,2048,2706000000,6928,12.10);

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- Xác nhận dữ liệu
-- ============================================================
-- SELECT 'permission_categories', COUNT(*) FROM permission_categories
-- UNION ALL SELECT 'permissions',             COUNT(*) FROM permissions
-- UNION ALL SELECT 'permission_groups',       COUNT(*) FROM permission_groups
-- UNION ALL SELECT 'sub_merchants',           COUNT(*) FROM sub_merchants
-- UNION ALL SELECT 'users',                   COUNT(*) FROM users
-- UNION ALL SELECT 'logins',                  COUNT(*) FROM logins
-- UNION ALL SELECT 'transactions',            COUNT(*) FROM transactions
-- UNION ALL SELECT 'chart_data',              COUNT(*) FROM chart_data;
