// «مضمون» — قالب الصفحات (عربي، من اليمين لليسار).
// الألوان والخط في متغيّرات CSS أعلى الملف حتى تُطابَق مع ستايل فاتورة الحالي
// بتعديل هذه القيم فقط (ملف التصميم الأصلي لفاتورة غير موجود في المستودع).

import { PLEDGE_TYPES } from './templates.js';

export const DISCLAIMER = 'مضمون يوثّق تعهّد التاجر، ولا يفحص المنتج ولا يضمنه.';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { dateStyle: 'long', timeZone: 'Asia/Riyadh' }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

const CSS = `
:root{
  --mm-primary:#0f766e; --mm-primary-dark:#115e59; --mm-bg:#f6f7f9; --mm-card:#ffffff;
  --mm-text:#1f2937; --mm-muted:#6b7280; --mm-border:#e5e7eb;
  --mm-ok:#15803d; --mm-ok-bg:#dcfce7; --mm-bad:#b91c1c; --mm-bad-bg:#fee2e2;
  --mm-warn-bg:#fef3c7; --mm-warn:#92400e; --mm-radius:12px;
  --mm-font:'Tajawal','Segoe UI',Tahoma,system-ui,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:var(--mm-bg);color:var(--mm-text);font-family:var(--mm-font);line-height:1.7}
.mm-top{background:var(--mm-primary);color:#fff;padding:14px 16px}
.mm-top .mm-wrap{display:flex;justify-content:space-between;align-items:center;gap:12px}
.mm-top a{color:#fff;text-decoration:none}
.mm-brand{font-weight:700;font-size:20px}
.mm-wrap{max-width:820px;margin:0 auto;padding:0 16px}
main.mm-wrap{padding-top:20px;padding-bottom:40px}
.mm-card{background:var(--mm-card);border:1px solid var(--mm-border);border-radius:var(--mm-radius);padding:18px;margin-bottom:16px}
h1{font-size:22px;margin:0 0 12px} h2{font-size:18px;margin:0 0 10px}
label{display:block;font-weight:600;margin:12px 0 4px}
input,select,textarea{width:100%;padding:10px;border:1px solid var(--mm-border);border-radius:8px;font:inherit;background:#fff}
textarea{min-height:120px}
.mm-btn{display:inline-block;background:var(--mm-primary);color:#fff;border:0;border-radius:8px;padding:10px 18px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
.mm-btn:hover{background:var(--mm-primary-dark)}
.mm-btn.mm-ghost{background:transparent;color:var(--mm-primary);border:1px solid var(--mm-primary)}
.mm-muted{color:var(--mm-muted);font-size:14px}
.mm-disclaimer{background:var(--mm-warn-bg);color:var(--mm-warn);border-radius:8px;padding:10px 12px;font-weight:600;margin-bottom:16px}
.mm-badge{display:inline-block;border-radius:999px;padding:4px 12px;font-weight:700;font-size:14px}
.mm-badge.ok{background:var(--mm-ok-bg);color:var(--mm-ok)}
.mm-badge.bad{background:var(--mm-bad-bg);color:var(--mm-bad)}
.mm-badge.neutral{background:var(--mm-border);color:var(--mm-text)}
.mm-pledge-text{white-space:pre-wrap;background:var(--mm-bg);border-radius:8px;padding:12px}
.mm-hash{font-family:ui-monospace,Consolas,monospace;font-size:12px;direction:ltr;text-align:left;word-break:break-all;color:var(--mm-muted)}
table{width:100%;border-collapse:collapse} th,td{padding:8px;border-bottom:1px solid var(--mm-border);text-align:right;vertical-align:top}
.mm-templates{display:flex;flex-wrap:wrap;gap:8px}
.mm-templates button{flex:1 1 90px}
.mm-error{background:var(--mm-bad-bg);color:var(--mm-bad);padding:10px;border-radius:8px;margin-bottom:12px}
.mm-success{background:var(--mm-ok-bg);color:var(--mm-ok);padding:10px;border-radius:8px;margin-bottom:12px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:0} dt{color:var(--mm-muted)} dd{margin:0}
@media (max-width:560px){ dl{grid-template-columns:1fr} th,td{font-size:14px} }
main.mm-wide{max-width:1100px}
.mm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}
.mm-stat{background:var(--mm-card);border:1px solid var(--mm-border);border-radius:var(--mm-radius);padding:12px 14px}
.mm-stat b{display:block;font-size:26px;font-variant-numeric:tabular-nums}
.mm-stat span{color:var(--mm-muted);font-size:14px}
.mm-stat.alert{border-color:var(--mm-bad);background:var(--mm-bad-bg)} .mm-stat.alert b{color:var(--mm-bad)}
.mm-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.mm-tabs a{padding:6px 12px;border-radius:999px;border:1px solid var(--mm-border);text-decoration:none;color:var(--mm-text);font-size:14px}
.mm-tabs a.on{background:var(--mm-primary);border-color:var(--mm-primary);color:#fff;font-weight:700}
.mm-scroll{overflow-x:auto}
.mm-age{font-variant-numeric:tabular-nums;white-space:nowrap}
.mm-age.late{color:var(--mm-bad);font-weight:700}
.mm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
`;

export function page({ title, body, merchant = false, admin = false }) {
  const nav = admin
    ? '<nav><a href="/madmoun/admin">لوحة المشرف</a></nav>'
    : merchant
      ? '<nav><a href="/madmoun">تعهداتي</a> · <a href="/madmoun/new">تعهد جديد</a></nav>'
      : '';
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} — مضمون</title>
<style>${CSS}</style>
</head>
<body>
<header class="mm-top"><div class="mm-wrap"><a class="mm-brand" href="${admin ? '/madmoun/admin' : merchant ? '/madmoun' : '#'}">مضمون${admin ? ' · المشرف' : ''}</a>${nav}</div></header>
<main class="mm-wrap${admin ? ' mm-wide' : ''}">${body}</main>
</body>
</html>`;
}

export function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin', // لا يُسرّب رمز الرابط لمواقع أخرى، ويبقي Origin صحيحًا للنماذج
      'x-frame-options': 'DENY',
      ...extraHeaders,
    },
  });
}

// ---------------------------------------------------------------- أجزاء مشتركة بين الصفحات

export const CLAIM_STATUS = { open: 'مفتوحة', accepted: 'مقبولة', rejected: 'مرفوضة', resolved: 'تم حلّها' };

export function verifyBadge(v) {
  return v.ok
    ? '<span class="mm-badge ok">✓ موثّق ولم يُعدّل</span>'
    : '<span class="mm-badge bad">✗ فشل التحقق — قد يكون السجل تعرّض للتلاعب</span>';
}

export function snapshotView(snapshotJson) {
  let s = {};
  try { s = JSON.parse(snapshotJson); } catch { /* يبقى فارغًا */ }
  return `<dl>
    <dt>رقم الفاتورة</dt><dd>${esc(s.number ?? s.id ?? '—')}</dd>
    <dt>الإجمالي</dt><dd>${esc(s.total ?? '—')}</dd>
    <dt>تاريخ الفاتورة</dt><dd>${esc(s.date ? formatDate(s.date) : '—')}</dd>
  </dl>`;
}

export function durationText(p) {
  if (p.duration_days == null) return 'بدون مدة محددة';
  return `${esc(p.duration_days)} يومًا — تنتهي في ${esc(formatDate(p.expires_at))}`;
}

