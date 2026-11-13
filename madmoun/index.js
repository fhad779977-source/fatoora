// «مضمون» — نقطة الدخول. لا يعدّل أي شيء في فاتورة.
//
// الدمج في worker.js (إضافة فقط — انظر MADMOUN_REPORT.md):
//   import { handleMadmoun, madmounScheduled } from './madmoun/index.js';
//   // في بداية fetch:
//   const mm = await handleMadmoun(request, env, ctx, { getMerchant: <دالة الدخول الحالية> });
//   if (mm) return mm;
//   // في scheduled (إن وُجد) أو إضافته:
//   ctx.waitUntil(madmounScheduled(event, env, ctx));
//
// handleMadmoun تعيد null لأي مسار لا يخصها، فلا تؤثر على مسارات فاتورة.

import { defaultAdapter, invoiceSnapshot } from './adapter.js';
import { TEMPLATES, PLEDGE_TYPES, fillTemplate } from './templates.js';
import { merchantVerificationSummary, INTEGRATION_STATUS } from './integrations.js';
import { page, html, esc, formatDate, DISCLAIMER, CLAIM_STATUS, verifyBadge, snapshotView, durationText } from './ui.js';
import {
  createPledge, addAmendment, createClaim, respondToClaim, getPledgeByToken, getPledgeForMerchant,
  listClaims, listMerchantPledges, listMerchantClaims, countRecentClaims, fullVerify,
  collectExpiringPledges, audit, addDays, nowIso,
} from './store.js';
import { adminRoutes } from './admin.js';
import { printPage } from './print.js';

const LIMITS = { product: 200, text: 4000, amendment: 2000, claim: 2000, response: 2000, maxDays: 3650 };
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

export async function handleMadmoun(request, env, ctx, options = {}) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!(path === '/madmoun' || path.startsWith('/madmoun/') || path.startsWith('/m/'))) return null;

  const adapter = { ...defaultAdapter, ...options };
  try {
    if (path.startsWith('/m/')) return await customerRoutes(request, env, url, path, adapter);
    return await merchantRoutes(request, env, url, path, adapter);
  } catch (err) {
    console.error('madmoun error', err && err.stack ? err.stack : err);
    return html(page({ title: 'خطأ', body: '<div class="mm-card"><h1>حدث خطأ غير متوقع</h1><p class="mm-muted">حاول مرة أخرى لاحقًا.</p></div>' }), 500);
  }
}

export async function madmounScheduled(_event, env, _ctx) {
  const rows = await collectExpiringPledges(env, { withinDays: 7 });
  console.log(`madmoun reminders: ${rows.length} pledge(s) expiring within 7 days (logged only, nothing sent)`);
  return rows;
}

// ---------------------------------------------------------------- أدوات

function notFound() {
  return html(page({ title: 'غير موجود', body: '<div class="mm-card"><h1>الصفحة غير موجودة</h1></div>' }), 404);
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { location } });
}

// حماية النماذج من الطلبات القادمة من مواقع أخرى (CSRF).
function sameOrigin(request, url) {
  const origin = request.headers.get('origin');
  if (origin) return origin === url.origin;
  const referer = request.headers.get('referer');
  if (referer) {
    try { return new URL(referer).origin === url.origin; } catch { return false; }
  }
  return false;
}

function forbidden() {
  return html(page({ title: 'مرفوض', body: '<div class="mm-card"><h1>طلب مرفوض</h1></div>' }), 403);
}

function clean(value, max) {
  const s = String(value ?? '').replace(/\r\n/g, '\n').trim();
  return s.length > max ? null : s;
}

// يقبل 05xxxxxxxx أو +9665xxxxxxxx أو 9665xxxxxxxx (وبالأرقام العربية). فارغ = لا شيء.
export function normalizePhone(raw) {
  const s = String(raw ?? '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\s-]/g, '');
  if (!s) return { ok: true, value: null };
  let m = s.match(/^(?:\+?966|0)(5\d{8})$/);
  if (!m) return { ok: false };
  return { ok: true, value: '+966' + m[1] };
}

function merchantIdOf(m) {
  if (m == null) return null;
  if (typeof m === 'object') return m.id == null ? null : String(m.id);
  return String(m);
}

// ---------------------------------------------------------------- صفحات العميل

async function customerRoutes(request, env, url, path, adapter) {
  const parts = path.split('/').filter(Boolean); // ['m', token, ...]
  const token = parts[1];
  if (!token || !TOKEN_RE.test(token)) return notFound();
  const pledge = await getPledgeByToken(env, token);
  if (!pledge) return notFound();

  if (parts.length === 2 && request.method === 'GET') return customerPage(env, pledge, url);

  if (parts.length === 3 && parts[2] === 'verify.json' && request.method === 'GET') {
    const v = await fullVerify(env, pledge);
    return new Response(JSON.stringify({
      verified: v.ok,
      checks: { content_hash: v.hashOk, chain_previous: v.chainOk, chain_next: v.nextOk, amendments: v.amendmentsOk },
      pledge: {
        seq: pledge.seq, type: pledge.pledge_type, product_name: pledge.product_name, pledge_text: pledge.pledge_text,
        duration_days: pledge.duration_days, created_at: pledge.created_at, expires_at: pledge.expires_at,
        invoice: JSON.parse(pledge.invoice_snapshot), prev_hash: pledge.prev_hash, content_hash: pledge.content_hash,
        hash_version: pledge.hash_version,
      },
      amendments: v.amendments.map((a) => ({
        no: a.amendment_no, text: a.amendment_text, created_at: a.created_at, prev_hash: a.prev_hash, content_hash: a.content_hash,
      })),
      disclaimer: DISCLAIMER,
      checked_at: nowIso(),
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  }

  // شهادة التعهد للطباعة / الحفظ PDF.
  if (parts.length === 3 && parts[2] === 'print' && request.method === 'GET') {
    const v = await fullVerify(env, pledge);
    const merchantName = await adapter.getMerchantName(env, pledge.merchant_id).catch(() => null);
    return html(printPage({
      pledge, verification: v, merchantName,
      verifyUrl: `${url.origin}/m/${pledge.public_token}/verify.json`,
      pageUrl: `/m/${pledge.public_token}`,
    }));
  }

  if (parts.length === 3 && parts[2] === 'claim' && request.method === 'POST') {
    if (!sameOrigin(request, url)) return forbidden();
    const form = await request.formData();
    const text = clean(form.get('claim_text'), LIMITS.claim);
    const phone = normalizePhone(form.get('customer_phone'));
    if (!text) return customerPage(env, pledge, url, 'اكتب وصف المطالبة (حتى 2000 حرف).');
    if (!phone.ok) return customerPage(env, pledge, url, 'رقم الجوال غير صحيح. اتركه فارغًا أو اكتبه بصيغة 05xxxxxxxx.');
    const recent = await countRecentClaims(env, pledge.id, addDays(nowIso(), -1));
    if (recent >= 10) return customerPage(env, pledge, url, 'تم استقبال عدد كبير من المطالبات على هذا التعهد اليوم. حاول غدًا.');
    await createClaim(env, pledge, { claim_text: text, customer_phone: phone.value });
    return redirect(`/m/${token}?claimed=1`);
  }

  return notFound();
}

async function customerPage(env, pledge, url, error = null) {
  const v = await fullVerify(env, pledge);
  const claimed = url.searchParams.get('claimed') === '1';
  const amendHtml = v.amendments.length
    ? `<div class="mm-card"><h2>تعديلات أضافها التاجر لاحقًا</h2><p class="mm-muted">التعهد الأصلي أعلاه لم يتغيّر؛ التعديلات تُضاف فقط.</p>
       ${v.amendments.map((a) => `<p><strong>تعديل ${esc(a.amendment_no)}</strong> — ${esc(formatDate(a.created_at))}</p><div class="mm-pledge-text">${esc(a.amendment_text)}</div>`).join('')}</div>`
    : '';
  const body = `
  <div class="mm-disclaimer">${esc(DISCLAIMER)}</div>
  ${claimed ? '<div class="mm-success">تم تسجيل مطالبتك وإبلاغ التاجر بها داخل مضمون.</div>' : ''}
  <div class="mm-card">
    <p>${verifyBadge(v)}</p>
    <h1>${esc(pledge.product_name)}</h1>
    <dl>
      <dt>نوع التعهد</dt><dd>${esc(PLEDGE_TYPES[pledge.pledge_type] || pledge.pledge_type)}</dd>
      <dt>تاريخ التعهد</dt><dd>${esc(formatDate(pledge.created_at))}</dd>
      <dt>المدة</dt><dd>${durationText(pledge)}</dd>
    </dl>
    <h2 style="margin-top:14px">نص التعهد</h2>
    <div class="mm-pledge-text">${esc(pledge.pledge_text)}</div>
  </div>
  ${amendHtml}
  <div class="mm-card"><h2>الفاتورة المرتبطة</h2>${snapshotView(pledge.invoice_snapshot)}</div>
  <div class="mm-card">
    <h2>تقديم مطالبة</h2>
    <p class="mm-muted">إذا لم يلتزم التاجر بتعهده، سجّل مطالبتك هنا. تُحفظ بتاريخها وبصمتها.</p>
    ${error ? `<div class="mm-error">${esc(error)}</div>` : ''}
    <form method="post" action="/m/${esc(pledge.public_token)}/claim">
      <label for="claim_text">وصف المطالبة</label>
      <textarea id="claim_text" name="claim_text" maxlength="${LIMITS.claim}" required></textarea>
      <label for="customer_phone">رقم الجوال (اختياري)</label>
      <input id="customer_phone" name="customer_phone" inputmode="tel" placeholder="05xxxxxxxx" dir="ltr">
      <p class="mm-muted">رقمك اختياري، ويُستخدم فقط ليتواصل معك التاجر بخصوص هذه المطالبة.</p>
      <button class="mm-btn" type="submit">إرسال المطالبة</button>
    </form>
  </div>
  <div class="mm-card">
    <h2>البصمة الرقمية</h2>
    <p class="mm-muted">بصمة SHA-256 لمحتوى التعهد مربوطة ببصمة التعهد السابق للتاجر نفسه. أي تغيير في حرف واحد يكسرها.</p>
    <p class="mm-hash">${esc(pledge.content_hash)}</p>
    <p><a href="/m/${esc(pledge.public_token)}/verify.json">عرض بيانات التحقق (JSON)</a></p>
    <p><a class="mm-btn mm-ghost" href="/m/${esc(pledge.public_token)}/print">تحميل شهادة التعهد (PDF)</a></p>
  </div>
  <div class="mm-disclaimer">${esc(DISCLAIMER)}</div>`;
  return html(page({ title: pledge.product_name, body }), error ? 400 : 200);
}

// ---------------------------------------------------------------- صفحات التاجر

async function merchantRoutes(request, env, url, path, adapter) {
  // لوحة المشرف: قبل فحص التاجر، لأن المشرف قد لا يكون تاجرًا.
  if (path === '/madmoun/admin' || path.startsWith('/madmoun/admin/')) {
    if (!(await adapter.isAdmin(request, env))) {
      const user = await adapter.getMerchant(request, env);
      if (!user && request.method === 'GET') return redirect(`${adapter.loginUrl}?next=${encodeURIComponent(url.pathname + url.search)}`);
      return forbidden();
    }
    return (await adminRoutes(request, env, url, path, adapter)) || notFound();
  }

  const merchantId = merchantIdOf(await adapter.getMerchant(request, env));
  if (!merchantId) {
    if (request.method === 'GET') return redirect(`${adapter.loginUrl}?next=${encodeURIComponent(url.pathname + url.search)}`);
    return forbidden();
  }
  if (request.method === 'POST' && !sameOrigin(request, url)) return forbidden();

  if (path === '/madmoun' || path === '/madmoun/') {
    if (request.method !== 'GET') return notFound();
    return dashboard(env, merchantId, adapter);
  }
  if (path === '/madmoun/new' && request.method === 'GET') {
    return newPledgePage(env, merchantId, adapter, { invoice_id: url.searchParams.get('invoice') || '' });
  }
  if (path === '/madmoun/pledges' && request.method === 'POST') {
    return createPledgeAction(request, env, merchantId, adapter);
  }

  let m = path.match(/^\/madmoun\/p\/(\d+)$/);
  if (m && request.method === 'GET') return merchantPledgePage(env, merchantId, Number(m[1]), url);

  m = path.match(/^\/madmoun\/p\/(\d+)\/amend$/);
  if (m && request.method === 'POST') {
    const pledge = await getPledgeForMerchant(env, merchantId, Number(m[1]));
    if (!pledge) return notFound();
    const form = await request.formData();
    const text = clean(form.get('amendment_text'), LIMITS.amendment);
    if (!text) return merchantPledgePage(env, merchantId, pledge.id, url, 'اكتب نص التعديل (حتى 2000 حرف).');
    await addAmendment(env, pledge, text);
    return redirect(`/madmoun/p/${pledge.id}?ok=amend`);
  }

  m = path.match(/^\/madmoun\/claims\/(\d+)\/respond$/);
  if (m && request.method === 'POST') {
    const form = await request.formData();
    const status = String(form.get('status') || '');
    if (!['accepted', 'rejected', 'resolved'].includes(status)) return forbidden();
    const response = clean(form.get('merchant_response'), LIMITS.response);
    if (response === null) return forbidden();
    const claim = await respondToClaim(env, merchantId, Number(m[1]), status, response);
    if (!claim) return notFound();
    return redirect(`/madmoun/p/${claim.pledge_id}?ok=claim`);
  }

  return notFound();
}

async function dashboard(env, merchantId, adapter) {
  const [pledges, claims] = await Promise.all([listMerchantPledges(env, merchantId), listMerchantClaims(env, merchantId)]);
  const name = await adapter.getMerchantName(env, merchantId).catch(() => null);
  const pledgeRows = pledges.map((p) => `<tr>
      <td>${esc(p.seq)}</td>
      <td><a href="/madmoun/p/${esc(p.id)}">${esc(p.product_name)}</a></td>
      <td>${esc(PLEDGE_TYPES[p.pledge_type] || p.pledge_type)}</td>
      <td>${esc(formatDate(p.created_at))}</td>
      <td>${p.expires_at ? esc(formatDate(p.expires_at)) : '—'}</td>
      <td>${Number(p.claims_open) ? `<span class="mm-badge bad">${esc(p.claims_open)} مفتوحة</span>` : esc(p.claims_total)}</td>
    </tr>`).join('');
  const claimRows = claims.map((c) => `<tr>
      <td><a href="/madmoun/p/${esc(c.pledge_id)}">${esc(c.product_name)}</a></td>
      <td>${esc(c.claim_text.slice(0, 80))}${c.claim_text.length > 80 ? '…' : ''}</td>
      <td>${esc(formatDate(c.created_at))}</td>
      <td><span class="mm-badge ${c.status === 'open' ? 'bad' : 'neutral'}">${esc(CLAIM_STATUS[c.status] || c.status)}</span></td>
    </tr>`).join('');
  const body = `
  <div class="mm-card">
    <h1>تعهداتي${name ? ` — ${esc(name)}` : ''}</h1>
    <p><a class="mm-btn" href="/madmoun/new">+ تعهد جديد</a></p>
    ${pledges.length ? `<table><thead><tr><th>#</th><th>المنتج</th><th>النوع</th><th>التاريخ</th><th>ينتهي</th><th>المطالبات</th></tr></thead><tbody>${pledgeRows}</tbody></table>`
      : '<p class="mm-muted">لا توجد تعهدات بعد.</p>'}
  </div>
  <div class="mm-card">
    <h2>المطالبات على تعهداتي</h2>
    ${claims.length ? `<table><thead><tr><th>المنتج</th><th>المطالبة</th><th>التاريخ</th><th>الحالة</th></tr></thead><tbody>${claimRows}</tbody></table>`
      : '<p class="mm-muted">لا توجد مطالبات.</p>'}
  </div>`;
  return html(page({ title: 'تعهداتي', body, merchant: true }));
}

async function newPledgePage(env, merchantId, adapter, values = {}, error = null) {
  const invoices = await adapter.listRecentInvoices(env, merchantId).catch(() => []);
  const verification = await merchantVerificationSummary(env, merchantId);
  const tplJson = JSON.stringify(Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, t])))
    .replace(/</g, '\\u003c');
  const invoiceOptions = invoices.map((inv) =>
    `<option value="${esc(inv.id)}" ${String(inv.id) === String(values.invoice_id) ? 'selected' : ''}>${esc(inv.invoice_number ?? inv.id)} — ${esc(inv.total ?? '')} — ${esc(formatDate(inv.created_at))}</option>`
  ).join('');
  const typeOptions = Object.entries(PLEDGE_TYPES).map(([k, label]) =>
    `<option value="${k}" ${values.pledge_type === k ? 'selected' : ''}>${esc(label)}</option>`).join('');
  const notConnected = verification.nafath.status === INTEGRATION_STATUS.NOT_CONNECTED
    && verification.cr.status === INTEGRATION_STATUS.NOT_CONNECTED;

  const body = `
  <div class="mm-disclaimer">${esc(DISCLAIMER)}</div>
  <div class="mm-card">
    <h1>تعهد جديد</h1>
    ${error ? `<div class="mm-error">${esc(error)}</div>` : ''}
    ${notConnected ? '<p class="mm-muted">التحقق عبر نفاذ والسجل التجاري: غير مفعّل بعد.</p>' : ''}
    <form method="post" action="/madmoun/pledges" id="mm-form">
      <label>اختر قالبًا جاهزًا</label>
      <div class="mm-templates">
        ${Object.entries(TEMPLATES).map(([k, t]) => `<button type="button" class="mm-btn mm-ghost" data-tpl="${k}">${esc(t.label)}</button>`).join('')}
      </div>
      <input type="hidden" name="template_key" id="template_key" value="${esc(values.template_key || 'general')}">

      <label for="invoice_id">الفاتورة المرتبطة</label>
      ${invoices.length
        ? `<select id="invoice_id" name="invoice_id" required><option value="">— اختر الفاتورة —</option>${invoiceOptions}</select>`
        : `<input id="invoice_id" name="invoice_id" required value="${esc(values.invoice_id || '')}" placeholder="رقم الفاتورة في فاتورة">`}

      <label for="product_name">اسم المنتج</label>
      <input id="product_name" name="product_name" maxlength="${LIMITS.product}" required value="${esc(values.product_name || '')}">

      <label for="pledge_type">نوع التعهد</label>
      <select id="pledge_type" name="pledge_type" required>${typeOptions}</select>

      <label for="duration_days">المدة بالأيام (اتركها فارغة إن لم توجد مدة)</label>
      <input id="duration_days" name="duration_days" type="number" min="1" max="${LIMITS.maxDays}" value="${esc(values.duration_days ?? '')}" dir="ltr">

      <label for="pledge_text">نص التعهد</label>
      <textarea id="pledge_text" name="pledge_text" maxlength="${LIMITS.text}" required>${esc(values.pledge_text || '')}</textarea>
      <p class="mm-muted">بعد الحفظ لا يمكن تعديل هذا النص أبدًا. يمكنك فقط إضافة تعديلات لاحقة تظهر للعميل بتواريخها.</p>

      <label for="customer_phone">جوال العميل (اختياري)</label>
      <input id="customer_phone" name="customer_phone" inputmode="tel" placeholder="05xxxxxxxx" dir="ltr" value="${esc(values.customer_phone || '')}">

      <p style="margin-top:16px"><button class="mm-btn" type="submit">حفظ التعهد وتوثيقه</button></p>
    </form>
  </div>
  <script>
  (function(){
    var T = ${tplJson};
    var f = document.getElementById('mm-form');
    function fill(t, product, days){
      return t.replace(/\\{product\\}/g, product || '...').replace(/\\{days\\}/g, days || '...');
    }
    document.querySelectorAll('[data-tpl]').forEach(function(b){
      b.addEventListener('click', function(){
        var t = T[b.getAttribute('data-tpl')];
        f.template_key.value = b.getAttribute('data-tpl');
        f.pledge_type.value = t.pledge_type;
        f.duration_days.value = t.duration_days == null ? '' : t.duration_days;
        f.pledge_text.value = fill(t.text, f.product_name.value, f.duration_days.value);
        f.pledge_text.focus();
      });
    });
  })();
  </script>`;
  return html(page({ title: 'تعهد جديد', body, merchant: true }), error ? 400 : 200);
}

async function createPledgeAction(request, env, merchantId, adapter) {
  const form = await request.formData();
  const values = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const fail = (msg) => newPledgePage(env, merchantId, adapter, values, msg);

  const invoiceId = clean(values.invoice_id, 100);
  const productName = clean(values.product_name, LIMITS.product);
  const pledgeText = clean(values.pledge_text, LIMITS.text);
  const pledgeType = values.pledge_type;
  const templateKey = TEMPLATES[values.template_key] ? values.template_key : 'general';
  const phone = normalizePhone(values.customer_phone);
  let duration = null;
  if (values.duration_days && values.duration_days.trim() !== '') {
    duration = Number(values.duration_days);
    if (!Number.isInteger(duration) || duration < 1 || duration > LIMITS.maxDays) return fail('المدة يجب أن تكون عددًا صحيحًا من 1 إلى 3650 يومًا.');
  }
  if (!invoiceId) return fail('اختر الفاتورة المرتبطة.');
  if (!productName) return fail('اكتب اسم المنتج (حتى 200 حرف).');
  if (!pledgeText) return fail('اكتب نص التعهد (حتى 4000 حرف).');
  if (pledgeText.includes('...')) return fail('أكمل الفراغات (...) في نص التعهد قبل الحفظ.');
  if (!PLEDGE_TYPES[pledgeType]) return fail('اختر نوع التعهد.');
  if (!phone.ok) return fail('جوال العميل غير صحيح. اتركه فارغًا أو اكتبه بصيغة 05xxxxxxxx.');

  const invoice = await adapter.getInvoice(env, merchantId, invoiceId);
  if (!invoice) return fail('الفاتورة غير موجودة أو لا تخصك.');

  const pledge = await createPledge(env, {
    merchant_id: merchantId,
    invoice_id: String(invoice.id),
    pledge_type: pledgeType,
    template_key: templateKey,
    product_name: productName,
    pledge_text: pledgeText,
    duration_days: duration,
    invoice_snapshot: invoiceSnapshot(invoice),
    customer_phone: phone.value,
  });
  return redirect(`/madmoun/p/${pledge.id}?ok=created`);
}

async function merchantPledgePage(env, merchantId, id, url, error = null) {
  const pledge = await getPledgeForMerchant(env, merchantId, id);
  if (!pledge) return notFound();
  const [v, claims] = await Promise.all([fullVerify(env, pledge), listClaims(env, pledge.id)]);
  const ok = url.searchParams.get('ok');
  const msg = { created: 'تم حفظ التعهد وتوثيقه. أرسل رابط العميل له.', amend: 'تمت إضافة التعديل.', claim: 'تم حفظ ردّك على المطالبة.' }[ok];
  const customerLink = `${url.origin}/m/${pledge.public_token}`;

  const claimsHtml = claims.length ? claims.map((c) => `
    <div class="mm-card">
      <p><span class="mm-badge ${c.status === 'open' ? 'bad' : 'neutral'}">${esc(CLAIM_STATUS[c.status] || c.status)}</span>
         <span class="mm-muted">${esc(formatDate(c.created_at))}${c.customer_phone ? ' — جوال: <span dir="ltr">' + esc(c.customer_phone) + '</span>' : ''}</span></p>
      <div class="mm-pledge-text">${esc(c.claim_text)}</div>
      ${c.merchant_response ? `<p><strong>ردّك:</strong> ${esc(c.merchant_response)}</p>` : ''}
      <form method="post" action="/madmoun/claims/${esc(c.id)}/respond">
        <label>تحديث الحالة</label>
        <select name="status"><option value="accepted">مقبولة</option><option value="rejected">مرفوضة</option><option value="resolved">تم حلّها</option></select>
        <label>ردّك (يظهر في سجل التدقيق)</label>
        <textarea name="merchant_response" maxlength="${LIMITS.response}" style="min-height:70px"></textarea>
        <p><button class="mm-btn mm-ghost" type="submit">حفظ الرد</button></p>
      </form>
    </div>`).join('') : '<p class="mm-muted">لا توجد مطالبات على هذا التعهد.</p>';

  const body = `
  ${msg ? `<div class="mm-success">${esc(msg)}</div>` : ''}
  <div class="mm-card">
    <p>${verifyBadge(v)}</p>
    <h1>${esc(pledge.product_name)}</h1>
    <dl>
      <dt>رقم التعهد</dt><dd>${esc(pledge.seq)}</dd>
      <dt>النوع</dt><dd>${esc(PLEDGE_TYPES[pledge.pledge_type] || pledge.pledge_type)}</dd>
      <dt>التاريخ</dt><dd>${esc(formatDate(pledge.created_at))}</dd>
      <dt>المدة</dt><dd>${durationText(pledge)}</dd>
      <dt>جوال العميل</dt><dd>${pledge.customer_phone ? `<span dir="ltr">${esc(pledge.customer_phone)}</span>` : '—'}</dd>
    </dl>
    <h2 style="margin-top:14px">نص التعهد</h2>
    <div class="mm-pledge-text">${esc(pledge.pledge_text)}</div>
    <label for="mm-link">رابط العميل</label>
    <input id="mm-link" readonly value="${esc(customerLink)}" dir="ltr" onclick="this.select()">
    <div class="mm-actions"><a class="mm-btn" href="/m/${esc(pledge.public_token)}/print">تحميل التعهد PDF</a></div>
    <p class="mm-hash">${esc(pledge.content_hash)}</p>
  </div>
  <div class="mm-card"><h2>الفاتورة المرتبطة</h2>${snapshotView(pledge.invoice_snapshot)}</div>
  <div class="mm-card">
    <h2>التعديلات (${v.amendments.length})</h2>
    ${v.amendments.map((a) => `<p><strong>تعديل ${esc(a.amendment_no)}</strong> — ${esc(formatDate(a.created_at))}</p><div class="mm-pledge-text">${esc(a.amendment_text)}</div>`).join('')}
    ${error ? `<div class="mm-error">${esc(error)}</div>` : ''}
    <form method="post" action="/madmoun/p/${esc(pledge.id)}/amend">
      <label for="amendment_text">إضافة تعديل (لا يغيّر الأصل، ويظهر للعميل بتاريخه)</label>
      <textarea id="amendment_text" name="amendment_text" maxlength="${LIMITS.amendment}" style="min-height:80px"></textarea>
      <p><button class="mm-btn mm-ghost" type="submit">إضافة التعديل</button></p>
    </form>
  </div>
  <h2>المطالبات (${claims.length})</h2>
  ${claimsHtml}`;
  return html(page({ title: pledge.product_name, body, merchant: true }), error ? 400 : 200);
}

// يُصدَّر للاختبار وللاستخدام من worker.js عند الحاجة.
export { fillTemplate, audit };
