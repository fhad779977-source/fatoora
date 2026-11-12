// «مضمون» — عمليات قاعدة البيانات. كل الكتابة هنا INSERT فقط
// (عدا حالة المطالبة ورد التاجر عليها، والمشغّلات تحمي نص المطالبة الأصلي).

import {
  GENESIS_HASH, HASH_VERSION, hashPledge, hashAmendment, hashClaim,
  verifyPledge, verifyAmendments, randomToken,
} from './hash.js';

export const nowIso = () => new Date().toISOString();

export async function audit(env, { actorType, actorId = null, action, entityType = null, entityId = null, details = null }) {
  await env.DB.prepare(
    'INSERT INTO madmoun_audit (at, actor_type, actor_id, action, entity_type, entity_id, details) VALUES (?,?,?,?,?,?,?)'
  ).bind(nowIso(), actorType, actorId == null ? null : String(actorId), action, entityType,
    entityId == null ? null : String(entityId), details == null ? null : JSON.stringify(details)).run();
}

export function addDays(iso, days) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString();
}

// إنشاء تعهد جديد في آخر سلسلة التاجر.
export async function createPledge(env, input) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const last = await env.DB.prepare(
      'SELECT seq, content_hash FROM pledges WHERE merchant_id = ? ORDER BY seq DESC LIMIT 1'
    ).bind(String(input.merchant_id)).first();

    const createdAt = nowIso();
    const pledge = {
      merchant_id: String(input.merchant_id),
      invoice_id: String(input.invoice_id),
      seq: last ? Number(last.seq) + 1 : 1,
      pledge_type: input.pledge_type,
      template_key: input.template_key || 'general',
      product_name: input.product_name,
      pledge_text: input.pledge_text,
      duration_days: input.duration_days == null ? null : Number(input.duration_days),
      invoice_snapshot: input.invoice_snapshot,
      customer_phone: input.customer_phone || null,
      created_at: createdAt,
      expires_at: input.duration_days == null ? null : addDays(createdAt, input.duration_days),
      public_token: randomToken(),
      prev_hash: last ? last.content_hash : GENESIS_HASH,
    };
    pledge.content_hash = await hashPledge(pledge);

    try {
      const res = await env.DB.prepare(
        `INSERT INTO pledges (merchant_id, invoice_id, seq, pledge_type, template_key, product_name, pledge_text,
          duration_days, invoice_snapshot, customer_phone, created_at, expires_at, public_token, prev_hash, content_hash, hash_version)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(pledge.merchant_id, pledge.invoice_id, pledge.seq, pledge.pledge_type, pledge.template_key,
        pledge.product_name, pledge.pledge_text, pledge.duration_days, pledge.invoice_snapshot, pledge.customer_phone,
        pledge.created_at, pledge.expires_at, pledge.public_token, pledge.prev_hash, pledge.content_hash, HASH_VERSION).run();
      pledge.id = res.meta.last_row_id;
      await audit(env, {
        actorType: 'merchant', actorId: pledge.merchant_id, action: 'pledge.create',
        entityType: 'pledge', entityId: pledge.id,
        details: { seq: pledge.seq, invoice_id: pledge.invoice_id, hash: pledge.content_hash },
      });
      return pledge;
    } catch (err) {
      // تعارض seq بسبب إنشاء متزامن: أعد المحاولة على آخر السلسلة الجديد.
      if (!/UNIQUE/i.test(String(err && err.message))) throw err;
    }
  }
  throw new Error('madmoun: could not append pledge to chain (concurrent writes)');
}

export async function addAmendment(env, pledge, text) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const last = await env.DB.prepare(
      'SELECT amendment_no, content_hash FROM pledge_amendments WHERE pledge_id = ? ORDER BY amendment_no DESC LIMIT 1'
    ).bind(pledge.id).first();
    const a = {
      pledge_id: pledge.id,
      merchant_id: String(pledge.merchant_id),
      amendment_no: last ? Number(last.amendment_no) + 1 : 1,
      amendment_text: text,
      created_at: nowIso(),
      prev_hash: last ? last.content_hash : pledge.content_hash,
    };
    a.content_hash = await hashAmendment(a);
    try {
      const res = await env.DB.prepare(
        `INSERT INTO pledge_amendments (pledge_id, merchant_id, amendment_no, amendment_text, created_at, prev_hash, content_hash, hash_version)
         VALUES (?,?,?,?,?,?,?,?)`
      ).bind(a.pledge_id, a.merchant_id, a.amendment_no, a.amendment_text, a.created_at, a.prev_hash, a.content_hash, HASH_VERSION).run();
      a.id = res.meta.last_row_id;
      await audit(env, {
        actorType: 'merchant', actorId: a.merchant_id, action: 'amendment.create',
        entityType: 'pledge', entityId: pledge.id, details: { amendment_no: a.amendment_no, hash: a.content_hash },
      });
      return a;
    } catch (err) {
      if (!/UNIQUE/i.test(String(err && err.message))) throw err;
    }
  }
  throw new Error('madmoun: could not append amendment');
}

export async function createClaim(env, pledge, { claim_text, customer_phone }) {
  const c = {
    pledge_id: pledge.id,
    claim_text,
    customer_phone: customer_phone || null,
    created_at: nowIso(),
  };
  c.content_hash = await hashClaim(c, pledge.content_hash);
  const res = await env.DB.prepare(
    `INSERT INTO claims (pledge_id, merchant_id, claim_text, customer_phone, created_at, content_hash, status)
     VALUES (?,?,?,?,?,?, 'open')`
  ).bind(c.pledge_id, String(pledge.merchant_id), c.claim_text, c.customer_phone, c.created_at, c.content_hash).run();
  c.id = res.meta.last_row_id;
  await audit(env, {
    actorType: 'customer', action: 'claim.create', entityType: 'claim', entityId: c.id,
    details: { pledge_id: pledge.id, hash: c.content_hash },
  });
  return c;
}

export async function respondToClaim(env, merchantId, claimId, status, response) {
  const claim = await env.DB.prepare('SELECT * FROM claims WHERE id = ? AND merchant_id = ?')
    .bind(claimId, String(merchantId)).first();
  if (!claim) return null;
  await env.DB.prepare('UPDATE claims SET status = ?, merchant_response = ?, responded_at = ? WHERE id = ?')
    .bind(status, response || null, nowIso(), claim.id).run();
  // نص الرد كاملًا يُحفظ في سجل التدقيق أيضًا حتى يبقى أثر كل رد سابق.
  await audit(env, {
    actorType: 'merchant', actorId: merchantId, action: 'claim.respond', entityType: 'claim', entityId: claim.id,
    details: { from: claim.status, to: status, response: response || null },
  });
  return claim;
}

export const getPledgeByToken = (env, token) =>
  env.DB.prepare('SELECT * FROM pledges WHERE public_token = ?').bind(token).first();

export const getPledgeForMerchant = (env, merchantId, id) =>
  env.DB.prepare('SELECT * FROM pledges WHERE id = ? AND merchant_id = ?').bind(id, String(merchantId)).first();

export async function listAmendments(env, pledgeId) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM pledge_amendments WHERE pledge_id = ? ORDER BY amendment_no'
  ).bind(pledgeId).all();
  return results || [];
}

export async function listClaims(env, pledgeId) {
  const { results } = await env.DB.prepare('SELECT * FROM claims WHERE pledge_id = ? ORDER BY id DESC').bind(pledgeId).all();
  return results || [];
}

export async function listMerchantPledges(env, merchantId) {
  const { results } = await env.DB.prepare(
    `SELECT p.*,
       (SELECT COUNT(*) FROM claims c WHERE c.pledge_id = p.id) AS claims_total,
       (SELECT COUNT(*) FROM claims c WHERE c.pledge_id = p.id AND c.status = 'open') AS claims_open,
       (SELECT COUNT(*) FROM pledge_amendments a WHERE a.pledge_id = p.id) AS amendments_total
     FROM pledges p WHERE p.merchant_id = ? ORDER BY p.seq DESC LIMIT 200`
  ).bind(String(merchantId)).all();
  return results || [];
}

export async function listMerchantClaims(env, merchantId) {
  const { results } = await env.DB.prepare(
    `SELECT c.*, p.product_name, p.seq FROM claims c JOIN pledges p ON p.id = c.pledge_id
     WHERE c.merchant_id = ? ORDER BY (c.status = 'open') DESC, c.id DESC LIMIT 200`
  ).bind(String(merchantId)).all();
  return results || [];
}

export async function countRecentClaims(env, pledgeId, sinceIso) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM claims WHERE pledge_id = ? AND created_at >= ?')
    .bind(pledgeId, sinceIso).first();
  return row ? Number(row.n) : 0;
}

// التحقق الكامل لتعهد: بصمته، وربطه بالسابق، وربط التالي به، وسلسلة تعديلاته.
export async function fullVerify(env, pledge) {
  const [prev, next, amendments] = await Promise.all([
    pledge.seq > 1
      ? env.DB.prepare('SELECT * FROM pledges WHERE merchant_id = ? AND seq = ?').bind(pledge.merchant_id, pledge.seq - 1).first()
      : null,
    env.DB.prepare('SELECT seq, prev_hash FROM pledges WHERE merchant_id = ? AND seq = ?').bind(pledge.merchant_id, pledge.seq + 1).first(),
    listAmendments(env, pledge.id),
  ]);
  const self = await verifyPledge(pledge, prev);
  const nextOk = next ? next.prev_hash === pledge.content_hash : true;
  const amend = await verifyAmendments(pledge, amendments);
  return {
    ok: self.ok && nextOk && amend.ok,
    hashOk: self.hashOk,
    chainOk: self.chainOk,
    nextOk,
    amendmentsOk: amend.ok,
    amendments,
  };
}

// التحقق من سلسلة تاجر كاملة (للتصدير أو الفحص الدوري).
export async function verifyMerchantChain(env, merchantId) {
  const { results } = await env.DB.prepare('SELECT * FROM pledges WHERE merchant_id = ? ORDER BY seq').bind(String(merchantId)).all();
  let prev = null;
  for (const p of results || []) {
    const v = await verifyPledge(p, prev);
    if (!v.ok) return { ok: false, brokenAtSeq: p.seq, count: results.length };
    prev = p;
  }
  return { ok: true, count: (results || []).length };
}

// التذكير قبل انتهاء المدة: يجمع ويسجّل فقط، بدون إرسال أي رسالة.
export async function collectExpiringPledges(env, { withinDays = 7, now = new Date() } = {}) {
  const from = now.toISOString();
  const to = addDays(from, withinDays);
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.merchant_id, p.seq, p.expires_at, (p.customer_phone IS NOT NULL) AS has_phone FROM pledges p
     WHERE p.expires_at IS NOT NULL AND p.expires_at > ? AND p.expires_at <= ?
       AND NOT EXISTS (SELECT 1 FROM madmoun_audit a WHERE a.action = 'reminder.due' AND a.entity_type = 'pledge' AND a.entity_id = CAST(p.id AS TEXT))
     ORDER BY p.expires_at LIMIT 500`
  ).bind(from, to).all();
  const rows = results || [];
  for (const p of rows) {
    await audit(env, {
      actorType: 'system', action: 'reminder.due', entityType: 'pledge', entityId: p.id,
      details: { merchant_id: p.merchant_id, expires_at: p.expires_at, has_phone: !!p.has_phone, sent: false },
    });
  }
  await audit(env, { actorType: 'system', action: 'reminder.scan', details: { window_days: withinDays, found: rows.length } });
  return rows;
}
