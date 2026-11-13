// «مضمون» — لوحة المشرف (صاحب المنصة). قراءة فقط: لا تعدّل أي تعهد أو مطالبة،
// حتى يبقى المشرف طرفًا محايدًا ويبقى السجل دليلًا نظيفًا.

import { page, html, esc, formatDate, CLAIM_STATUS, verifyBadge, snapshotView, durationText } from './ui.js';
import { PLEDGE_TYPES } from './templates.js';
import {
  adminSummary, adminListClaims, adminListMerchants, adminRecentAudit, auditForPledge,
  getPledgeById, listClaims, fullVerify, verifyMerchantChain,
} from './store.js';

const STALE_DAYS = 3;
const ACTIONS = {
  'pledge.create': 'إنشاء تعهد',
  'amendment.create': 'إضافة تعديل',
  'claim.create': 'مطالبة جديدة من عميل',
  'claim.respond': 'رد التاجر على مطالبة',
  'reminder.due': 'تذكير: تعهد يقترب من الانتهاء',
  'reminder.scan': 'فحص التذكيرات اليومي',
};
const ACTORS = { merchant: 'تاجر', customer: 'عميل', system: 'النظام' };

// يُظهر آخر 3 أرقام فقط من الجوال (أقل قدر من البيانات الشخصية).
export function maskPhone(phone) {
  if (!phone) return '—';
  const s = String(phone);
  return s.length <= 7 ? '•••' : s.slice(0, 5) + '•'.repeat(s.length - 8) + s.slice(-3);
}

function ageDays(iso, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86400000));
}

function ageCell(claim) {
  const d = ageDays(claim.created_at);
  const late = claim.status === 'open' && d >= STALE_DAYS;
  const label = d === 0 ? 'اليوم' : d === 1 ? 'يوم' : d === 2 ? 'يومان' : `${d} أيام`;
  return `<span class="mm-age${late ? ' late' : ''}">${esc(label)}${late ? ' — متأخرة' : ''}</span>`;
}

async function namesFor(env, adapter, ids) {
  const map = new Map();
  await Promise.all([...new Set(ids)].map(async (id) => {
    map.set(id, (await adapter.getMerchantName(env, id).catch(() => null)) || id);
  }));
  return map;
}

export async function adminRoutes(request, env, url, path, adapter) {
  if (request.method !== 'GET') return null;
  if (path === '/madmoun/admin' || path === '/madmoun/admin/') return overview(env, url, adapter);
  const m = path.match(/^\/madmoun\/admin\/p\/(\d+)$/);
  if (m) return pledgeDetail(env, Number(m[1]), adapter);
  return null;
}

async function overview(env, url, adapter) {
  const statusParam = url.searchParams.get('status') || 'open';
  const status = ['open', 'accepted', 'rejected', 'resolved', 'all'].includes(statusParam) ? statusParam : 'open';
  const merchantFilter = url.searchParams.get('merchant') || null;

  const [summary, claims, merchants, recent] = await Promise.all([
    adminSummary(env),
    adminListClaims(env, { status, merchantId: merchantFilter }),
    adminListMerchants(env),
    adminRecentAudit(env, 30),
  ]);
  const chains = await Promise.all(merchants.map((mm) => verifyMerchantChain(env, mm.merchant_id)));
  const names = await namesFor(env, adapter, [
    ...merchants.map((mm) => mm.merchant_id), ...claims.map((c) => c.merchant_id),
  ]);
  const brokenChains = chains.filter((c) => !c.ok).length;

  const qs = (extra) => {
    const p = new URLSearchParams();
    if (merchantFilter) p.set('merchant', merchantFilter);
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    const s = p.toString();
    return '/madmoun/admin' + (s ? '?' + s : '');
  };

  const stat = (value, label, alert = false) =>
    `<div class="mm-stat${alert && value ? ' alert' : ''}"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;

  const tabs = [['open', 'مفتوحة'], ['accepted', 'مقبولة'], ['resolved', 'تم حلّها'], ['rejected', 'مرفوضة'], ['all', 'الكل']]
    .map(([k, label]) => `<a href="${esc(qs({ status: k }))}" class="${k === status ? 'on' : ''}">${esc(label)}</a>`).join('');

  const claimRows = claims.map((c) => `<tr>
      <td>${esc(c.id)}</td>
      <td>${ageCell(c)}<div class="mm-muted">${esc(formatDate(c.created_at))}</div></td>
      <td><a href="${esc(qs({ status, merchant: c.merchant_id }))}">${esc(names.get(c.merchant_id))}</a></td>
      <td><a href="/madmoun/admin/p/${esc(c.pledge_id)}">${esc(c.product_name)}</a><div class="mm-muted">${esc(PLEDGE_TYPES[c.pledge_type] || '')}</div></td>
      <td>${esc(c.claim_text.slice(0, 120))}${c.claim_text.length > 120 ? '…' : ''}
          ${c.merchant_response ? `<div class="mm-muted">رد التاجر: ${esc(c.merchant_response.slice(0, 80))}</div>` : ''}</td>
      <td><span class="mm-badge ${c.status === 'open' ? 'pending' : 'neutral'}">${esc(CLAIM_STATUS[c.status] || c.status)}</span></td>
    </tr>`).join('');

  const merchantRows = merchants.map((mm, i) => `<tr>
      <td><a href="${esc(qs({ status: 'all', merchant: mm.merchant_id }))}">${esc(names.get(mm.merchant_id))}</a><div class="mm-muted" dir="ltr">${esc(mm.merchant_id)}</div></td>
      <td>${esc(mm.pledges_total)}</td>
      <td>${esc(formatDate(mm.last_pledge_at))}</td>
      <td>${Number(mm.claims_open) ? `<span class="mm-badge pending">${esc(mm.claims_open)} مفتوحة</span>` : '0 مفتوحة'} <span class="mm-muted">من ${esc(mm.claims_total)}</span></td>
      <td>${chains[i].ok ? '<span class="mm-badge ok">✓ سليمة</span>' : `<span class="mm-badge bad">✗ مكسورة عند التعهد ${esc(chains[i].brokenAtSeq)}</span>`}</td>
    </tr>`).join('');

  const recentRows = recent.map((a) => `<tr>
      <td class="mm-age">${esc(formatDate(a.at))}</td>
      <td>${esc(ACTORS[a.actor_type] || a.actor_type)}</td>
      <td>${esc(ACTIONS[a.action] || a.action)}</td>
      <td dir="ltr">${esc(a.entity_type ? a.entity_type + ' #' + a.entity_id : '')}</td>
    </tr>`).join('');

  const body = `
  <h1>لوحة المشرف</h1>
  <div class="mm-stats">
    ${stat(summary.merchants, 'تاجر لديه تعهدات')}
    ${stat(summary.pledges, 'تعهد موثّق')}
    ${stat(summary.openClaims, 'مطالبة مفتوحة', true)}
    ${stat(summary.staleClaims, `مفتوحة منذ ${STALE_DAYS} أيام أو أكثر`, true)}
    ${stat(summary.expiring, 'تعهد ينتهي خلال 7 أيام')}
    ${stat(brokenChains, 'سلسلة تاجر مكسورة', true)}
  </div>

  <div class="mm-card">
    <h2>شكاوى العملاء${merchantFilter ? ` — ${esc(names.get(merchantFilter) || merchantFilter)} <a class="mm-muted" href="/madmoun/admin?status=${esc(status)}">(إلغاء التصفية)</a>` : ''}</h2>
    <p class="mm-muted">المفتوحة أولًا، والأقدم في الأعلى. المطالبة المفتوحة ${STALE_DAYS} أيام أو أكثر تُعلَّم «متأخرة».</p>
    <nav class="mm-tabs" aria-label="حالة المطالبة">${tabs}</nav>
    ${claims.length ? `<div class="mm-scroll"><table><thead><tr><th>#</th><th>العمر</th><th>التاجر</th><th>التعهد</th><th>المطالبة</th><th>الحالة</th></tr></thead><tbody>${claimRows}</tbody></table></div>`
      : '<p class="mm-muted">لا توجد مطالبات بهذه الحالة.</p>'}
  </div>

  <div class="mm-card">
    <h2>التجار</h2>
    <p class="mm-muted">«سلامة السلسلة» تعيد حساب بصمات كل تعهدات التاجر الآن. أي تلاعب مباشر في القاعدة يظهر هنا.</p>
    ${merchants.length ? `<div class="mm-scroll"><table><thead><tr><th>التاجر</th><th>التعهدات</th><th>آخر تعهد</th><th>المطالبات</th><th>سلامة السلسلة</th></tr></thead><tbody>${merchantRows}</tbody></table></div>`
      : '<p class="mm-muted">لا يوجد تجار لديهم تعهدات بعد.</p>'}
  </div>

  <div class="mm-card">
    <h2>آخر النشاط</h2>
    ${recent.length ? `<div class="mm-scroll"><table><thead><tr><th>الوقت</th><th>من</th><th>العملية</th><th>العنصر</th></tr></thead><tbody>${recentRows}</tbody></table></div>`
      : '<p class="mm-muted">لا يوجد نشاط بعد.</p>'}
  </div>`;
  return html(page({ title: 'لوحة المشرف', body, admin: true }));
}

async function pledgeDetail(env, id, adapter) {
  const pledge = await getPledgeById(env, id);
  if (!pledge) return null;
  const [v, claims, trail, merchantName] = await Promise.all([
    fullVerify(env, pledge), listClaims(env, pledge.id), auditForPledge(env, pledge.id),
    adapter.getMerchantName(env, pledge.merchant_id).catch(() => null),
  ]);

  const claimsHtml = claims.length ? claims.map((c) => `
    <div class="mm-card">
      <p><span class="mm-badge ${c.status === 'open' ? 'pending' : 'neutral'}">${esc(CLAIM_STATUS[c.status] || c.status)}</span>
        ${ageCell(c)} <span class="mm-muted">— ${esc(formatDate(c.created_at))} — جوال العميل: <span dir="ltr">${esc(maskPhone(c.customer_phone))}</span></span></p>
      <div class="mm-pledge-text">${esc(c.claim_text)}</div>
      ${c.merchant_response ? `<p><strong>رد التاجر (${esc(formatDate(c.responded_at))}):</strong> ${esc(c.merchant_response)}</p>` : '<p class="mm-muted">لم يرد التاجر بعد.</p>'}
      <p class="mm-hash">${esc(c.content_hash)}</p>
    </div>`).join('') : '<p class="mm-muted">لا توجد مطالبات على هذا التعهد.</p>';

  const trailRows = trail.map((a) => `<tr>
      <td class="mm-age">${esc(String(a.at).replace('T', ' ').slice(0, 19))}</td>
      <td>${esc(ACTORS[a.actor_type] || a.actor_type)}</td>
      <td>${esc(ACTIONS[a.action] || a.action)}</td>
      <td dir="ltr" class="mm-hash">${esc(a.details || '')}</td>
    </tr>`).join('');

  const body = `
  <p><a href="/madmoun/admin">→ لوحة المشرف</a></p>
  <div class="mm-card">
    <p>${verifyBadge(v)}</p>
    <h1>${esc(pledge.product_name)}</h1>
    <dl>
      <dt>التاجر</dt><dd>${esc(merchantName || pledge.merchant_id)} <span class="mm-muted" dir="ltr">(${esc(pledge.merchant_id)})</span></dd>
      <dt>رقم التعهد في سلسلة التاجر</dt><dd>${esc(pledge.seq)}</dd>
      <dt>النوع</dt><dd>${esc(PLEDGE_TYPES[pledge.pledge_type] || pledge.pledge_type)}</dd>
      <dt>التاريخ</dt><dd>${esc(formatDate(pledge.created_at))}</dd>
      <dt>المدة</dt><dd>${durationText(pledge)}</dd>
      <dt>جوال العميل</dt><dd dir="ltr">${esc(maskPhone(pledge.customer_phone))}</dd>
    </dl>
    <h2 style="margin-top:14px">نص التعهد</h2>
    <div class="mm-pledge-text">${esc(pledge.pledge_text)}</div>
    <div class="mm-actions">
      <a class="mm-btn mm-ghost" href="/m/${esc(pledge.public_token)}">صفحة العميل</a>
      <a class="mm-btn mm-ghost" href="/m/${esc(pledge.public_token)}/print">شهادة التعهد (PDF)</a>
      <a class="mm-btn mm-ghost" href="/m/${esc(pledge.public_token)}/verify.json">بيانات التحقق</a>
    </div>
  </div>
  <div class="mm-card"><h2>الفاتورة المرتبطة</h2>${snapshotView(pledge.invoice_snapshot)}</div>
  <div class="mm-card">
    <h2>التعديلات (${v.amendments.length})</h2>
    ${v.amendments.length ? v.amendments.map((a) => `<p><strong>تعديل ${esc(a.amendment_no)}</strong> — ${esc(formatDate(a.created_at))}</p><div class="mm-pledge-text">${esc(a.amendment_text)}</div>`).join('') : '<p class="mm-muted">لا توجد تعديلات.</p>'}
  </div>
  <h2>المطالبات (${claims.length})</h2>
  ${claimsHtml}
  <div class="mm-card">
    <h2>سجل التدقيق لهذا التعهد</h2>
    ${trail.length ? `<div class="mm-scroll"><table><thead><tr><th>الوقت (UTC)</th><th>من</th><th>العملية</th><th>التفاصيل</th></tr></thead><tbody>${trailRows}</tbody></table></div>` : '<p class="mm-muted">لا يوجد.</p>'}
  </div>`;
  return html(page({ title: pledge.product_name, body, admin: true }));
}
