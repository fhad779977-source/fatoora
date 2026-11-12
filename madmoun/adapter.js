// «مضمون» — طبقة الربط مع فاتورة الموجودة.
//
// مهم: كود فاتورة الأصلي (worker.js وجداول التجار والفواتير ونظام الدخول) غير موجود
// في المستودع وقت بناء هذه النسخة، لذلك كل ما يخص فاتورة محصور في هذا الملف فقط.
// عند الدمج يكفي ضبط هذا الملف ليطابق الأسماء الحقيقية، بدون لمس باقي «مضمون».
//
// الافتراضات (تحتاج تأكيد — انظر MADMOUN_REPORT.md):
//   - جدول الفواتير اسمه invoices وفيه: id, merchant_id, invoice_number, total, created_at
//   - جدول التجار اسمه merchants وفيه: id, name
//
// يمكن تجاوز هذه الدوال عند الاستدعاء عبر options في handleMadmoun.

export const defaultAdapter = {
  // يعيد التاجر المسجّل دخوله أو null.
  // يجب أن يُمرَّر من worker.js دالة الدخول الحالية لفاتورة كما هي (getMerchant).
  // الافتراضي هنا يرفض الجميع عمدًا حتى لا يُفتح «مضمون» بلا دخول.
  async getMerchant(_request, _env) {
    return null;
  },

  // يعيد فاتورة تخص هذا التاجر فقط، أو null.
  async getInvoice(env, merchantId, invoiceId) {
    const row = await env.DB.prepare(
      'SELECT id, merchant_id, invoice_number, total, created_at FROM invoices WHERE id = ? AND merchant_id = ?'
    ).bind(invoiceId, merchantId).first();
    return row || null;
  },

  // آخر فواتير التاجر لعرضها كاختيارات في صفحة الإنشاء.
  async listRecentInvoices(env, merchantId, limit = 30) {
    const { results } = await env.DB.prepare(
      'SELECT id, invoice_number, total, created_at FROM invoices WHERE merchant_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(merchantId, limit).all();
    return results || [];
  },

  async getMerchantName(env, merchantId) {
    const row = await env.DB.prepare('SELECT name FROM merchants WHERE id = ?').bind(merchantId).first();
    return row ? row.name : null;
  },

  // رابط صفحة الدخول الحالية في فاتورة (لتحويل غير المسجّلين إليها).
  loginUrl: '/login',
};

// اللقطة المحفوظة من الفاتورة داخل التعهد (تدخل في البصمة).
// نأخذ أقل قدر ممكن: لا بيانات شخصية للعميل.
export function invoiceSnapshot(invoice) {
  return JSON.stringify({
    id: String(invoice.id),
    number: invoice.invoice_number == null ? null : String(invoice.invoice_number),
    total: invoice.total == null ? null : String(invoice.total),
    date: invoice.created_at == null ? null : String(invoice.created_at),
  });
}
