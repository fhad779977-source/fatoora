// «مضمون» — شهادة التعهد للطباعة أو الحفظ PDF (/m/<رمز>/print).
// لا تحتاج أي مكتبة: صفحة مهيّأة لورق A4، وزر يفتح نافذة الطباعة في المتصفح
// ومنها «حفظ بصيغة PDF». العربية تظهر سليمة لأن المتصفح نفسه هو من يرسمها.
// لا تعرض جوال العميل.

import { esc, formatDate, DISCLAIMER, snapshotView, durationText } from './ui.js';
import { PLEDGE_TYPES } from './templates.js';

const PRINT_CSS = `
@page{size:A4;margin:16mm 14mm}
*{box-sizing:border-box}
body{margin:0;background:#eef1f4;color:#111827;font-family:'Tajawal','Segoe UI',Tahoma,system-ui,sans-serif;line-height:1.75}
.sheet{max-width:210mm;margin:16px auto;background:#fff;padding:18mm 16mm;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.12)}
.toolbar{max-width:210mm;margin:16px auto 0;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center;padding:0 16px}
.toolbar button,.toolbar a{font:inherit;font-weight:700;border-radius:8px;padding:9px 16px;border:1px solid #0f766e;cursor:pointer;text-decoration:none}
.toolbar button{background:#0f766e;color:#fff} .toolbar a{background:#fff;color:#0f766e}
.toolbar p{margin:0;color:#4b5563;font-size:14px;flex-basis:100%}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:14px}
.brand{font-size:26px;font-weight:800;color:#0f766e}
.title{font-size:18px;font-weight:700;margin:0}
.no{font-size:13px;color:#4b5563;text-align:left}
.status{border-radius:8px;padding:8px 12px;font-weight:700;margin:0 0 14px}
.status.ok{background:#dcfce7;color:#15803d} .status.bad{background:#fee2e2;color:#b91c1c}
h2{font-size:15px;margin:16px 0 6px;color:#0f766e}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:0} dt{color:#4b5563} dd{margin:0}
.text{white-space:pre-wrap;border:1px solid #d1d5db;border-radius:6px;padding:10px 12px}
.hash{font-family:ui-monospace,Consolas,monospace;font-size:11px;direction:ltr;text-align:left;word-break:break-all;color:#374151}
.note{background:#fef3c7;color:#92400e;border-radius:6px;padding:8px 12px;font-weight:600;margin-top:16px}
.foot{margin-top:16px;font-size:12px;color:#4b5563;border-top:1px solid #e5e7eb;padding-top:8px}
@media print{
  body{background:#fff}
  .toolbar{display:none}
  .sheet{box-shadow:none;margin:0;padding:0;max-width:none;border-radius:0}
  h2,dl,.text{break-inside:avoid}
}
@media (max-width:600px){ .sheet{padding:20px 16px;margin:12px} dl{grid-template-columns:1fr} }
`;

export function printPage({ pledge, verification, merchantName, verifyUrl, pageUrl, printedAt = new Date().toISOString() }) {
  const v = verification;
  const amendments = v.amendments || [];
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>شهادة تعهد ${esc(pledge.seq)} — ${esc(pledge.product_name)} — مضمون</title>
<style>${PRINT_CSS}</style>
</head>
<body>
<div class="toolbar">
  <button type="button" onclick="window.print()">حفظ PDF / طباعة</button>
  <a href="${esc(pageUrl)}">رجوع للتعهد</a>
  <p>من نافذة الطباعة اختر «حفظ بصيغة PDF» (Save as PDF).</p>
</div>
<article class="sheet">
  <div class="head">
    <div>
      <div class="brand">مضمون</div>
      <p class="title">شهادة توثيق تعهّد تاجر</p>
    </div>
    <div class="no">رقم التعهد في سجل التاجر: ${esc(pledge.seq)}<br>تاريخ التوثيق: ${esc(formatDate(pledge.created_at))}</div>
  </div>

  <p class="status ${v.ok ? 'ok' : 'bad'}">${v.ok
    ? '✓ موثّق ولم يُعدّل — تم التحقق من البصمة والسلسلة وقت إصدار هذه الشهادة.'
    : '✗ فشل التحقق — هذا السجل قد يكون تعرّض للتلاعب. لا يُعتمد على هذه الشهادة.'}</p>

  <h2>التاجر</h2>
  <dl><dt>الاسم</dt><dd>${esc(merchantName || pledge.merchant_id)}</dd></dl>

  <h2>التعهد</h2>
  <dl>
    <dt>المنتج</dt><dd>${esc(pledge.product_name)}</dd>
    <dt>نوع التعهد</dt><dd>${esc(PLEDGE_TYPES[pledge.pledge_type] || pledge.pledge_type)}</dd>
    <dt>المدة</dt><dd>${durationText(pledge)}</dd>
  </dl>
  <h2>نص التعهد كما كتبه التاجر</h2>
  <div class="text">${esc(pledge.pledge_text)}</div>

  ${amendments.length ? `<h2>تعديلات أضافها التاجر لاحقًا (الأصل أعلاه لم يتغيّر)</h2>
  ${amendments.map((a) => `<p><strong>تعديل ${esc(a.amendment_no)}</strong> — ${esc(formatDate(a.created_at))}</p><div class="text">${esc(a.amendment_text)}</div>`).join('')}` : ''}

  <h2>الفاتورة المرتبطة</h2>
  ${snapshotView(pledge.invoice_snapshot)}

  <h2>البصمة الرقمية (SHA-256)</h2>
  <dl>
    <dt>بصمة هذا التعهد</dt><dd class="hash">${esc(pledge.content_hash)}</dd>
    <dt>بصمة التعهد السابق</dt><dd class="hash">${esc(pledge.prev_hash)}</dd>
  </dl>
  <h2>التحقق من هذه الشهادة</h2>
  <p>يمكن لأي جهة مطابقة البصمة أعلاه بفتح الرابط:</p>
  <p class="hash">${esc(verifyUrl)}</p>

  <p class="note">${esc(DISCLAIMER)}</p>
  <div class="foot">صدرت هذه الشهادة من مضمون في ${esc(formatDate(printedAt))} (${esc(printedAt.replace('T', ' ').slice(0, 16))} UTC). أي اختلاف بين هذه الورقة والسجل الإلكتروني يُرجَّح فيه السجل الإلكتروني المتحقَّق منه.</div>
</article>
</body>
</html>`;
}
