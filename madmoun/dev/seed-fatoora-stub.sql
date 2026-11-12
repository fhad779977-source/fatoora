-- جداول بديلة تحاكي فاتورة محليًا فقط (للاختبار). لا تُشغَّل على القاعدة الحقيقية أبدًا.
-- أسماء الأعمدة افتراضية؛ انظر madmoun/adapter.js.
CREATE TABLE IF NOT EXISTS merchants (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, merchant_id TEXT NOT NULL, invoice_number TEXT, total TEXT, created_at TEXT
);
INSERT OR IGNORE INTO merchants (id, name) VALUES ('m-test-1', 'متجر الاختبار'), ('m-test-2', 'متجر آخر');
INSERT OR IGNORE INTO invoices (id, merchant_id, invoice_number, total, created_at) VALUES
  ('inv-1001', 'm-test-1', 'INV-1001', '450.00', '2026-11-10T09:00:00Z'),
  ('inv-1002', 'm-test-1', 'INV-1002', '1200.00', '2026-11-11T12:30:00Z'),
  ('inv-2001', 'm-test-2', 'INV-2001', '99.00', '2026-11-11T08:00:00Z');
