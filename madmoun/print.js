// «مضمون» — شهادة التعهد للطباعة أو الحفظ PDF (/m/<رمز>/print).
// لا تحتاج أي مكتبة: صفحة مهيّأة لورق A4، وزر يفتح نافذة الطباعة في المتصفح
// ومنها «حفظ بصيغة PDF». العربية تظهر سليمة لأن المتصفح نفسه هو من يرسمها.
// لا تعرض جوال العميل.

import { esc, formatDate, DISCLAIMER, snapshotView, durationText, seal, FONTS_LINK } from './ui.js';
import { PLEDGE_TYPES } from './templates.js';

const PRINT_CSS = `
:root{
  --emerald:#0F4D3F; --emerald-dark:#0A3529; --gold:#C8A04B; --ivory:#F5F0E4; --white:#FFFFFF;
  --char:#1C1F1E; --mint:#DCEBE4; --border:#E3DAC4; --brick:#B5452F;
  --brick-tint:color-mix(in srgb, var(--brick) 12%, var(--white));
  --muted:color-mix(in srgb, var(--char) 68%, var(--white));
  --font-head:'Noto Kufi Arabic','IBM Plex Sans Arabic',Tahoma,sans-serif;
  --font-body:'IBM Plex Sans Arabic','Segoe UI',Tahoma,system-ui,sans-serif;
  color-scheme:light;
}
@page{size:A4;margin:16mm 14mm}
*{box-sizing:border-box}
body{margin:0;background:var(--ivory);color:var(--char);font-family:var(--font-body);line-height:1.75}
.sheet{max-width:210mm;margin:16px auto;background:var(--white);border:1px solid var(--border);padding:18mm 16mm;border-radius:12px}
.toolbar{max-width:210mm;margin:16px auto 0;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center;padding:0 16px}
.toolbar button,.toolbar a{font-family:var(--font-head);font-weight:700;font-size:15px;border-radius:8px;padding:9px 16px;border:1px solid var(--emerald);cursor:pointer;text-decoration:none}
.toolbar button{background:var(--emerald);color:var(--ivory)} .toolbar button:hover{background:var(--emerald-dark)}
.toolbar a{background:transparent;color:var(--emerald)} .toolbar a:hover{background:var(--mint)}
.toolbar p{margin:0;color:var(--muted);font-size:14px;flex-basis:100%}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid var(--gold);padding-bottom:10px;margin-bottom:14px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--font-head);font-size:26px;font-weight:800;color:var(--emerald)}
.mm-seal{flex:none;display:block}
.title{font-family:var(--font-head);font-size:17px;font-weight:700;margin:4px 0 0;color:var(--char)}
.no{font-size:13px;color:var(--muted);text-align:left}
.status{border-radius:8px;padding:8px 12px;font-family:var(--font-head);font-weight:700;margin:0 0 14px}
.status.ok{background:var(--emerald);color:var(--ivory)} .status.bad{background:var(--brick-tint);color:var(--brick)}
h2{font-family:var(--font-head);font-weight:700;font-size:15px;margin:16px 0 6px;color:var(--emerald)}
h2::after{content:"";display:block;width:28px;height:2px;background:var(--gold);margin-top:3px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:0} dt{color:var(--muted)} dd{margin:0}
.text{white-space:pre-wrap;border:1px solid var(--border);background:var(--mint);border-radius:6px;padding:10px 12px}
.hash{font-family:ui-monospace,Consolas,monospace;font-size:11px;direction:ltr;text-align:left;word-break:break-all;color:var(--char)}
.note{background:var(--mint);color:var(--emerald);border-radius:6px;padding:8px 12px;font-weight:500;margin-top:16px}
.foot{margin-top:16px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:8px}
@media print{
  body{background:var(--white)}
  .toolbar{display:none}
  .sheet{border:0;margin:0;padding:0;max-width:none;border-radius:0}
  h2,dl,.text{break-inside:avoid}
  .status,.text,.note{-webkit-print-color-adjust:exact;print-color-adjust:exact}
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
${FONTS_LINK}
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
      <div class="brand">${seal({ size: 40 })}مضمون</div>
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
