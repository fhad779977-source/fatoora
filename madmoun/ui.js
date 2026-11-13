// «مضمون» — قالب الصفحات (عربي، من اليمين لليسار) بالهوية الرسمية لمضمون.

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

// خطوط الهوية من Google Fonts: Noto Kufi Arabic للعناوين والأزرار، IBM Plex Sans Arabic للنصوص.
export const FONTS_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500&family=Noto+Kufi+Arabic:wght@700;800&display=swap">';

// الختم الرسمي كما هو. inverted = النسخة المعكوسة للخلفية الزمرّدية (ختم عاجي، صح زمرّدي، حلقة ذهبية).
export function seal({ inverted = false, size = 32, label = '' } = {}) {
  const body = inverted ? '#F5F0E4' : '#0F4D3F';
  const check = inverted ? '#0F4D3F' : '#C8A04B';
  const dots = [[184.0,100.0],[181.1,121.7],[172.7,142.0],[159.4,159.4],[142.0,172.7],[121.7,181.1],[100.0,184.0],[78.3,181.1],[58.0,172.7],[40.6,159.4],[27.3,142.0],[18.9,121.7],[16.0,100.0],[18.9,78.3],[27.3,58.0],[40.6,40.6],[58.0,27.3],[78.3,18.9],[100.0,16.0],[121.7,18.9],[142.0,27.3],[159.4,40.6],[172.7,58.0],[181.1,78.3]]
    .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13"/>`).join('');
  return `<svg class="mm-seal" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><g fill="${body}"><circle cx="100" cy="100" r="86"/>${dots}</g><circle cx="100" cy="100" r="70" fill="none" stroke="#C8A04B" stroke-width="3"/><path d="M66 102 L90 126 L136 76" fill="none" stroke="${check}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// الهوية الرسمية: ثيم فاتح فقط. لا ألوان خارج هذه المتغيّرات
// (--sand طلبتها الهوية لشارة «قيد المراجعة»، و --brick-tint مشتق من الطوبي للخلفيات الفاتحة).
const CSS = `
:root{
  --emerald:#0F4D3F; --emerald-dark:#0A3529; --gold:#C8A04B; --ivory:#F5F0E4; --white:#FFFFFF;
  --char:#1C1F1E; --mint:#DCEBE4; --border:#E3DAC4; --brick:#B5452F; --sand:#EDE3CC;
  --brick-tint:color-mix(in srgb, var(--brick) 12%, var(--white));
  --muted:color-mix(in srgb, var(--char) 68%, var(--white));
  --font-head:'Noto Kufi Arabic','IBM Plex Sans Arabic',Tahoma,sans-serif;
  --font-body:'IBM Plex Sans Arabic','Segoe UI',Tahoma,system-ui,sans-serif;
  --radius:12px; color-scheme:light;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ivory);color:var(--char);font-family:var(--font-body);font-weight:400;line-height:1.75}
a{color:var(--emerald)}
.mm-top{background:var(--emerald);color:var(--ivory);padding:12px 16px}
.mm-top .mm-wrap{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.mm-top a{color:var(--ivory);text-decoration:none}
.mm-top nav{font-family:var(--font-head);font-weight:700;font-size:14px}
.mm-brand{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-head);font-weight:800;font-size:20px}
.mm-seal{flex:none;display:block}
.mm-top.mm-top-bad{background:var(--brick)}
.mm-hero-wrap{flex-direction:column;justify-content:center;text-align:center;padding-block:10px 14px}
.mm-hero{display:flex;flex-direction:column;align-items:center;gap:2px}
.mm-hero-title{margin:0;font-family:var(--font-head);font-weight:800;font-size:24px;color:var(--ivory)}
.mm-hero-sub{margin:0;font-size:14px;color:var(--ivory);opacity:.85}
.mm-wrap{max-width:820px;margin:0 auto;padding:0 16px}
main.mm-wrap{padding-top:20px;padding-bottom:40px}
.mm-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:16px}
h1,h2{font-family:var(--font-head);font-weight:700;color:var(--emerald);text-wrap:balance}
h1{font-size:22px;margin:0 0 14px} h2{font-size:18px;margin:0 0 12px}
h1::after,h2::after{content:"";display:block;width:36px;height:3px;border-radius:2px;background:var(--gold);margin-top:6px}
label{display:block;font-weight:500;margin:12px 0 4px}
input,select,textarea{width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font:inherit;background:var(--white);color:var(--char)}
input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible,button:focus-visible{outline:2px solid var(--emerald);outline-offset:2px}
textarea{min-height:120px}
.mm-btn{display:inline-block;background:var(--emerald);color:var(--ivory);border:1px solid var(--emerald);border-radius:8px;padding:10px 18px;font-family:var(--font-head);font-weight:700;font-size:15px;line-height:1.6;cursor:pointer;text-decoration:none}
.mm-btn:hover{background:var(--emerald-dark);border-color:var(--emerald-dark)}
.mm-btn.mm-ghost{background:transparent;color:var(--emerald);border:1px solid var(--emerald)}
.mm-btn.mm-ghost:hover{background:var(--mint)}
.mm-muted{color:var(--muted);font-size:14px}
.mm-disclaimer{background:var(--mint);color:var(--emerald);border-radius:8px;padding:10px 12px;font-weight:500;margin-bottom:16px}
.mm-disclaimer.mm-foot{background:transparent;padding:4px 0;margin:8px 0 0;font-size:13px;font-weight:400;color:var(--muted);text-align:center}
.mm-badge{display:inline-block;white-space:nowrap;border-radius:999px;padding:3px 12px;font-family:var(--font-head);font-weight:700;font-size:13px}
.mm-badge.ok{background:var(--emerald);color:var(--ivory)}
.mm-badge.bad{background:var(--brick-tint);color:var(--brick)}
.mm-badge.pending{background:var(--sand);color:var(--char)}
.mm-badge.revoked{background:var(--brick);color:var(--white)}
.mm-badge.neutral{background:var(--mint);color:var(--emerald)}
.mm-pledge-text{white-space:pre-wrap;background:var(--mint);border-radius:8px;padding:12px;color:var(--char)}
.mm-hash{font-family:ui-monospace,Consolas,monospace;font-size:12px;direction:ltr;text-align:left;word-break:break-all;color:var(--muted)}
table{width:100%;border-collapse:collapse} th,td{padding:8px;border-bottom:1px solid var(--border);text-align:right;vertical-align:top}
th{font-family:var(--font-head);font-weight:700;font-size:14px;color:var(--emerald)}
.mm-templates{display:flex;flex-wrap:wrap;gap:8px}
.mm-templates button{flex:1 1 90px}
.mm-error{background:var(--brick-tint);color:var(--brick);padding:10px;border-radius:8px;margin-bottom:12px}
.mm-success{background:var(--mint);color:var(--emerald);padding:10px;border-radius:8px;margin-bottom:12px;font-weight:500}
dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:0} dt{color:var(--muted)} dd{margin:0}
@media (max-width:560px){ dl{grid-template-columns:1fr} th,td{font-size:14px} }
main.mm-wide{max-width:1100px}
.mm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}
.mm-stat{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px}
.mm-stat b{display:block;font-family:var(--font-head);font-weight:800;font-size:28px;color:var(--gold);font-variant-numeric:tabular-nums}
.mm-stat span{color:var(--muted);font-size:14px}
.mm-stat.alert{border-color:var(--brick);background:var(--brick-tint)} .mm-stat.alert b{color:var(--brick)}
.mm-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.mm-tabs a{padding:6px 12px;border-radius:999px;border:1px solid var(--border);text-decoration:none;color:var(--char);font-size:14px}
.mm-tabs a:hover{background:var(--mint)}
.mm-tabs a.on{background:var(--emerald);border-color:var(--emerald);color:var(--ivory);font-family:var(--font-head);font-weight:700}
.mm-scroll{overflow-x:auto}
.mm-age{font-variant-numeric:tabular-nums;white-space:nowrap}
.mm-age.late{color:var(--brick);font-weight:500}
.mm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
`;

export function page({ title, body, merchant = false, admin = false, hero = null }) {
  const nav = admin
    ? '<nav><a href="/madmoun/admin">لوحة المشرف</a></nav>'
    : merchant
      ? '<nav><a href="/madmoun">تعهداتي</a> · <a href="/madmoun/new">تعهد جديد</a></nav>'
      : '';
  const brand = `<a class="mm-brand" href="${admin ? '/madmoun/admin' : merchant ? '/madmoun' : '#'}">${seal({ inverted: true, size: hero ? 44 : 32 })}مضمون${admin ? ' · المشرف' : ''}</a>`;
  // hero: رأس صفحة العميل. { ok } من نتيجة التحقق من البصمة.
  const header = hero
    ? `<header class="mm-top${hero.ok ? '' : ' mm-top-bad'}"><div class="mm-wrap mm-hero-wrap">${brand}<div class="mm-hero">${hero.ok
      ? '<p class="mm-hero-title">تعهّد موثّق ✓</p><p class="mm-hero-sub">لم يُعدّل منذ توقيعه</p>'
      : '<p class="mm-hero-title">تم التلاعب بهذا التعهد</p>'}</div></div></header>`
    : `<header class="mm-top"><div class="mm-wrap">${brand}${nav}</div></header>`;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} — مضمون</title>
${FONTS_LINK}
<style>${CSS}</style>
</head>
<body>
${header}
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

