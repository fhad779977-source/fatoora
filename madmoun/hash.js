// «مضمون» — البصمات وسلسلة منع التلاعب.
// تعمل في Cloudflare Workers وفي Node 18+ (كلاهما فيه crypto.subtle).

export const GENESIS_HASH = '0'.repeat(64);
export const HASH_VERSION = 1;

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// المحتوى القانوني للتعهد: ترتيب ثابت للحقول حتى تتطابق البصمة دائمًا.
// أي حرف يتغيّر في أي حقل هنا يغيّر البصمة.
export function pledgeCanonical(p) {
  return JSON.stringify([
    'madmoun.pledge',
    HASH_VERSION,
    String(p.merchant_id),
    String(p.invoice_id),
    Number(p.seq),
    p.pledge_type,
    p.template_key,
    p.product_name,
    p.pledge_text,
    p.duration_days == null ? null : Number(p.duration_days),
    p.invoice_snapshot,
    p.customer_phone == null ? null : p.customer_phone,
    p.created_at,
    p.expires_at == null ? null : p.expires_at,
    p.public_token,
    p.prev_hash,
  ]);
}

export function amendmentCanonical(a) {
  return JSON.stringify([
    'madmoun.amendment',
    HASH_VERSION,
    Number(a.pledge_id),
    String(a.merchant_id),
    Number(a.amendment_no),
    a.amendment_text,
    a.created_at,
    a.prev_hash,
  ]);
}

export function claimCanonical(c, pledgeHash) {
  return JSON.stringify([
    'madmoun.claim',
    HASH_VERSION,
    Number(c.pledge_id),
    c.claim_text,
    c.customer_phone == null ? null : c.customer_phone,
    c.created_at,
    pledgeHash,
  ]);
}

export const hashPledge = (p) => sha256Hex(pledgeCanonical(p));
export const hashAmendment = (a) => sha256Hex(amendmentCanonical(a));
export const hashClaim = (c, pledgeHash) => sha256Hex(claimCanonical(c, pledgeHash));

// التحقق من تعهد واحد: البصمة المخزّنة = البصمة المحسوبة الآن،
// و prev_hash = بصمة التعهد السابق (إن مُرِّر).
export async function verifyPledge(pledge, previousPledge) {
  const computed = await hashPledge(pledge);
  const hashOk = computed === pledge.content_hash;
  let chainOk;
  if (Number(pledge.seq) === 1) chainOk = pledge.prev_hash === GENESIS_HASH;
  else if (previousPledge) chainOk = previousPledge.content_hash === pledge.prev_hash
    && Number(previousPledge.seq) === Number(pledge.seq) - 1;
  else chainOk = false; // السابق مفقود = السلسلة مكسورة
  return { ok: hashOk && chainOk, hashOk, chainOk, computed };
}

// التحقق من سلسلة التعديلات لتعهد واحد.
export async function verifyAmendments(pledge, amendments) {
  let prev = pledge.content_hash;
  const sorted = [...amendments].sort((x, y) => x.amendment_no - y.amendment_no);
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (Number(a.amendment_no) !== i + 1) return { ok: false, brokenAt: a.amendment_no, reason: 'gap' };
    if (a.prev_hash !== prev) return { ok: false, brokenAt: a.amendment_no, reason: 'chain' };
    if ((await hashAmendment(a)) !== a.content_hash) return { ok: false, brokenAt: a.amendment_no, reason: 'hash' };
    prev = a.content_hash;
  }
  return { ok: true };
}

// رمز رابط عشوائي (128 بت، base64url).
export function randomToken(bytes = 16) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
