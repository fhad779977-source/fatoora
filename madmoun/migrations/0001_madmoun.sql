-- ============================================================
-- «مضمون» — الترحيل الأول
-- جداول جديدة فقط. لا يغيّر ولا يحذف أي جدول موجود في فاتورة.
-- merchant_id و invoice_id يشيران إلى التاجر والفاتورة الموجودَين في فاتورة.
-- لم نضع FOREIGN KEY لأن بنية جداول فاتورة غير موجودة في المستودع
-- (انظر MADMOUN_REPORT.md — الأسئلة المعلّقة).
-- ============================================================

-- التعهد: إضافة فقط. ممنوع UPDATE و DELETE (انظر المشغّلات أسفل).
CREATE TABLE IF NOT EXISTS pledges (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id      TEXT    NOT NULL,             -- التاجر في فاتورة
  invoice_id       TEXT    NOT NULL,             -- الفاتورة في فاتورة
  seq              INTEGER NOT NULL,             -- ترتيب التعهد في سلسلة التاجر (1، 2، 3...)
  pledge_type      TEXT    NOT NULL CHECK (pledge_type IN ('maintenance','authenticity','specification','general')),
  template_key     TEXT    NOT NULL DEFAULT 'general',
  product_name     TEXT    NOT NULL,
  pledge_text      TEXT    NOT NULL,
  duration_days    INTEGER,                      -- NULL = بلا مدة
  invoice_snapshot TEXT    NOT NULL,             -- لقطة JSON من الفاتورة وقت الإنشاء (داخلة في البصمة)
  customer_phone   TEXT,                         -- اختياري (أقل قدر من البيانات الشخصية)
  created_at       TEXT    NOT NULL,             -- ISO-8601 UTC
  expires_at       TEXT,                         -- محسوب من المدة، NULL إن لم توجد مدة
  public_token     TEXT    NOT NULL UNIQUE,      -- رمز الرابط /m/<token>
  prev_hash        TEXT    NOT NULL,             -- بصمة التعهد السابق للتاجر نفسه (أو 64 صفرًا للأول)
  content_hash     TEXT    NOT NULL UNIQUE,      -- SHA-256(المحتوى + prev_hash)
  hash_version     INTEGER NOT NULL DEFAULT 1,
  UNIQUE (merchant_id, seq)                      -- يمنع تفرّع السلسلة عند الإنشاء المتزامن
);
CREATE INDEX IF NOT EXISTS idx_pledges_merchant ON pledges (merchant_id, seq);
CREATE INDEX IF NOT EXISTS idx_pledges_invoice  ON pledges (invoice_id);
CREATE INDEX IF NOT EXISTS idx_pledges_expires  ON pledges (expires_at);

CREATE TRIGGER IF NOT EXISTS pledges_no_update
BEFORE UPDATE ON pledges
BEGIN
  SELECT RAISE(ABORT, 'madmoun: pledges are append-only (UPDATE forbidden)');
END;

CREATE TRIGGER IF NOT EXISTS pledges_no_delete
BEFORE DELETE ON pledges
BEGIN
  SELECT RAISE(ABORT, 'madmoun: pledges are append-only (DELETE forbidden)');
END;

-- التعديلات: إضافة فقط، والأصل لا يتغيّر أبدًا.
CREATE TABLE IF NOT EXISTS pledge_amendments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pledge_id     INTEGER NOT NULL REFERENCES pledges(id),
  merchant_id   TEXT    NOT NULL,
  amendment_no  INTEGER NOT NULL,                -- 1، 2، 3... لكل تعهد
  amendment_text TEXT   NOT NULL,
  created_at    TEXT    NOT NULL,
  prev_hash     TEXT    NOT NULL,                -- بصمة التعديل السابق أو بصمة التعهد الأصلي
  content_hash  TEXT    NOT NULL UNIQUE,
  hash_version  INTEGER NOT NULL DEFAULT 1,
  UNIQUE (pledge_id, amendment_no)
);
CREATE INDEX IF NOT EXISTS idx_amend_pledge ON pledge_amendments (pledge_id, amendment_no);

CREATE TRIGGER IF NOT EXISTS amendments_no_update
BEFORE UPDATE ON pledge_amendments
BEGIN
  SELECT RAISE(ABORT, 'madmoun: amendments are append-only (UPDATE forbidden)');
END;

CREATE TRIGGER IF NOT EXISTS amendments_no_delete
BEFORE DELETE ON pledge_amendments
BEGIN
  SELECT RAISE(ABORT, 'madmoun: amendments are append-only (DELETE forbidden)');
END;

-- مطالبات العملاء. نص المطالبة الأصلي لا يتغيّر؛ يُسمح فقط بتحديث الحالة ورد التاجر.
CREATE TABLE IF NOT EXISTS claims (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  pledge_id         INTEGER NOT NULL REFERENCES pledges(id),
  merchant_id       TEXT    NOT NULL,
  claim_text        TEXT    NOT NULL,
  customer_phone    TEXT,                        -- اختياري
  created_at        TEXT    NOT NULL,
  content_hash      TEXT    NOT NULL,            -- SHA-256 لنص المطالبة + بصمة التعهد
  status            TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','rejected','resolved')),
  merchant_response TEXT,
  responded_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_claims_pledge   ON claims (pledge_id);
CREATE INDEX IF NOT EXISTS idx_claims_merchant ON claims (merchant_id, status);

CREATE TRIGGER IF NOT EXISTS claims_protect_original
BEFORE UPDATE OF pledge_id, merchant_id, claim_text, customer_phone, created_at, content_hash ON claims
BEGIN
  SELECT RAISE(ABORT, 'madmoun: original claim fields are immutable');
END;

CREATE TRIGGER IF NOT EXISTS claims_no_delete
BEFORE DELETE ON claims
BEGIN
  SELECT RAISE(ABORT, 'madmoun: claims cannot be deleted');
END;

-- سجل التدقيق: كل عملية. إضافة فقط.
CREATE TABLE IF NOT EXISTS madmoun_audit (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  at          TEXT NOT NULL,
  actor_type  TEXT NOT NULL CHECK (actor_type IN ('merchant','customer','system')),
  actor_id    TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  details     TEXT                               -- JSON مختصر، بدون بيانات شخصية
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON madmoun_audit (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON madmoun_audit (action, entity_id);

CREATE TRIGGER IF NOT EXISTS audit_no_update
BEFORE UPDATE ON madmoun_audit
BEGIN
  SELECT RAISE(ABORT, 'madmoun: audit log is append-only');
END;

CREATE TRIGGER IF NOT EXISTS audit_no_delete
BEFORE DELETE ON madmoun_audit
BEGIN
  SELECT RAISE(ABORT, 'madmoun: audit log is append-only');
END;
