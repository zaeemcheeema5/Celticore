-- =====================================================================
-- CeltiCore - Delivery migration (FINAL: NEXT-DAY DELIVERY ONLY)
-- Republic of Ireland | DPD | EUR 6.00 fixed | free from EUR 70.00
-- =====================================================================
-- You normally do NOT need this file: backend/db.js applies the same changes
-- when the backend starts. Use it only to apply them by hand in phpMyAdmin
-- (SQL tab) BEFORE deploying.
--
-- SAFE TO RUN MORE THAN ONCE, in one go:
--   * every column / index is added only if it is missing (checked in
--     information_schema), so nothing stops with "Duplicate column";
--   * nothing is dropped, renamed or deleted;
--   * the Next-Day-only values are forced ONCE (guarded by the settings flag
--     migration_delivery_nextday_only_v1), so later admin edits are never
--     overwritten when you run this again.
-- Real errors (permissions, wrong database selected, ...) are NOT hidden:
-- phpMyAdmin stops and shows them. TAKE A BACKUP FIRST.
-- =====================================================================

-- 1) Order columns -----------------------------------------------------
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN address2 TEXT', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'address2');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN county VARCHAR(100)', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'county');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN delivery_method_name VARCHAR(100)', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_method_name');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN delivery_free INT DEFAULT 0', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_free');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN delivery_est_min_days INT', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_est_min_days');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN delivery_est_max_days INT', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_est_max_days');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN delivery_estimate_text VARCHAR(255)', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_estimate_text');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN courier_name VARCHAR(100)', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'courier_name');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN tracking_url TEXT', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'tracking_url');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN processing_at DATETIME', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'processing_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN dispatched_at DATETIME', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'dispatched_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN delivered_at DATETIME', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivered_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN label_file VARCHAR(100)', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'label_file');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN label_mime VARCHAR(50)', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'label_mime');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN label_uploaded_at DATETIME', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'label_uploaded_at');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 2) Indexes ------------------------------------------------------------
-- One order per Stripe payment. Added only when missing AND there are no old
-- duplicate payment ids (if there are, this line does nothing; orders still work).
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'uniq_orders_payment_intent') = 0
    AND (SELECT COUNT(*) FROM (SELECT stripe_payment_intent FROM orders WHERE stripe_payment_intent IS NOT NULL GROUP BY stripe_payment_intent HAVING COUNT(*) > 1) d) = 0,
    'ALTER TABLE orders ADD UNIQUE KEY uniq_orders_payment_intent (stripe_payment_intent)', 'SELECT 1'));
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD INDEX idx_orders_status (status)', 'SELECT 1')
          FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_status');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 3) Delivery methods table ---------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    fee DOUBLE NOT NULL DEFAULT 0,
    est_min_days INT NOT NULL DEFAULT 1,
    est_max_days INT NOT NULL DEFAULT 3,
    free_eligible INT NOT NULL DEFAULT 0,
    is_enabled INT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
SET @s = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE delivery_methods ADD COLUMN estimate_text VARCHAR(255)', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'delivery_methods' AND COLUMN_NAME = 'estimate_text');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 4) Rows (created only if missing; Standard stays, DISABLED) -------------
INSERT IGNORE INTO delivery_methods
    (code, name, description, fee, est_min_days, est_max_days, estimate_text, free_eligible, is_enabled, sort_order)
VALUES
    ('express',  'Next-Day Delivery', 'Next-day delivery by DPD', 6.00, 1, 1,
     'Next working day (99% of parcels) - estimate only, not guaranteed', 1, 1, 1),
    ('standard', 'Standard Delivery', 'Tracked delivery by DPD', 6.00, 1, 1,
     'Next working day (99% of parcels) - estimate only, not guaranteed', 1, 0, 2);

-- 5) Settings defaults (never overwrite existing values) ------------------
INSERT IGNORE INTO settings (`key`, value) VALUES ('delivery_notice', 'Weekend and public holiday delivery depends on courier availability.');

-- 6) ONE-TIME Next-Day-only values (skipped when the flag already exists) --
UPDATE delivery_methods
   SET name = 'Next-Day Delivery', description = 'Next-day delivery by DPD',
       fee = 6.00, est_min_days = 1, est_max_days = 1,
       estimate_text = 'Next working day (99% of parcels) - estimate only, not guaranteed',
       free_eligible = 1, is_enabled = 1, sort_order = 1
 WHERE code = 'express'
   AND NOT EXISTS (SELECT 1 FROM (SELECT `key` FROM settings WHERE `key` = 'migration_delivery_nextday_only_v1') f);

UPDATE delivery_methods SET is_enabled = 0, sort_order = 2
 WHERE code = 'standard'
   AND NOT EXISTS (SELECT 1 FROM (SELECT `key` FROM settings WHERE `key` = 'migration_delivery_nextday_only_v1') f);

INSERT INTO settings (`key`, value)
SELECT 'checkout_delivery_method', 'express' FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM settings f WHERE f.`key` = 'migration_delivery_nextday_only_v1')
ON DUPLICATE KEY UPDATE value = VALUES(value);
INSERT INTO settings (`key`, value)
SELECT 'free_delivery_enabled', '1' FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM settings f WHERE f.`key` = 'migration_delivery_nextday_only_v1')
ON DUPLICATE KEY UPDATE value = VALUES(value);
INSERT INTO settings (`key`, value)
SELECT 'free_delivery_threshold', '70' FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM settings f WHERE f.`key` = 'migration_delivery_nextday_only_v1')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Flag LAST, so a failed run is simply repeated:
INSERT IGNORE INTO settings (`key`, value) VALUES ('migration_delivery_nextday_only_v1', 'manual-sql');

-- VERIFY (optional):
--   SELECT code, name, fee, estimate_text, is_enabled FROM delivery_methods;
--   SELECT * FROM settings WHERE `key` IN ('free_delivery_enabled','free_delivery_threshold','checkout_delivery_method','delivery_notice','migration_delivery_nextday_only_v1');
