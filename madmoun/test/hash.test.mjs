// اختبار البصمة: تغيير أي حرف في أي حقل من التعهد يكسر التحقق.
// التشغيل: node madmoun/test/hash.test.mjs
import assert from 'node:assert/strict';
import { GENESIS_HASH, hashPledge, verifyPledge, hashAmendment, verifyAmendments } from '../hash.js';

let checks = 0;
const base = {
  merchant_id: 'm-test-1', invoice_id: 'inv-1001', seq: 1, pledge_type: 'authenticity', template_key: 'honey',
  product_name: 'عسل سدر جبلي ١ كجم',
  pledge_text: 'أتعهّد بأن العسل «عسل سدر جبلي ١ كجم» طبيعي ١٠٠٪، غير مغشوش.',
  duration_days: 30,
  invoice_snapshot: JSON.stringify({ id: 'inv-1001', number: 'INV-1001', total: '450.00', date: '2026-11-10T09:00:00Z' }),
  customer_phone: '+966500000000',
  created_at: '2026-11-12T10:00:00.000Z', expires_at: '2026-12-12T10:00:00.000Z',
  public_token: 'AbCdEfGhIjKlMnOpQrStUv', prev_hash: GENESIS_HASH,
};
base.content_hash = await hashPledge(base);

const ok = await verifyPledge(base, null);
assert.equal(ok.ok, true, 'التعهد السليم يجب أن ينجح'); checks++;

// غيّر كل حرف في كل حقل نصي، واحدًا واحدًا.
const textFields = ['merchant_id', 'invoice_id', 'pledge_type', 'template_key', 'product_name', 'pledge_text',
  'invoice_snapshot', 'customer_phone', 'created_at', 'expires_at', 'public_token'];
for (const f of textFields) {
  const s = base[f];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i] === 'x' ? 'y' : 'x';
    const tampered = { ...base, [f]: s.slice(0, i) + ch + s.slice(i + 1) };
    const v = await verifyPledge(tampered, null);
    assert.equal(v.ok, false, `تغيير الحرف ${i} في ${f} لم يكسر التحقق`);
    checks++;
  }
}
// حذف حرف، وإضافة مسافة في آخر النص.
for (const f of ['pledge_text', 'product_name']) {
  assert.equal((await verifyPledge({ ...base, [f]: base[f].slice(0, -1) }, null)).ok, false); checks++;
  assert.equal((await verifyPledge({ ...base, [f]: base[f] + ' ' }, null)).ok, false); checks++;
}
// حقول رقمية وفارغة.
for (const t of [{ seq: 2 }, { duration_days: 31 }, { duration_days: null }, { customer_phone: null }, { expires_at: null }]) {
  assert.equal((await verifyPledge({ ...base, ...t }, null)).ok, false, JSON.stringify(t)); checks++;
}
// تغيير البصمة المخزّنة نفسها.
assert.equal((await verifyPledge({ ...base, content_hash: base.content_hash.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')) }, null)).ok, false); checks++;

// السلسلة: التعهد الثاني مربوط بالأول.
const second = { ...base, seq: 2, invoice_id: 'inv-1002', public_token: 'ZyXwVuTsRqPoNmLkJiHgFe', prev_hash: base.content_hash };
second.content_hash = await hashPledge(second);
assert.equal((await verifyPledge(second, base)).ok, true); checks++;
// لو أعاد المهاجم حساب بصمة الأول بعد تعديله، الثاني ينكسر.
const forgedFirst = { ...base, pledge_text: base.pledge_text + '!' };
forgedFirst.content_hash = await hashPledge(forgedFirst);
assert.equal((await verifyPledge(forgedFirst, null)).ok, true, 'الأول المزوّر متّسق مع نفسه');
assert.equal((await verifyPledge(second, forgedFirst)).ok, false, 'لكن السلسلة تكشفه'); checks++;
// السابق مفقود.
assert.equal((await verifyPledge(second, null)).ok, false); checks++;

// التعديلات.
const a1 = { pledge_id: 1, merchant_id: 'm-test-1', amendment_no: 1, amendment_text: 'تمديد الضمان ١٠ أيام', created_at: '2026-11-13T00:00:00.000Z', prev_hash: base.content_hash };
a1.content_hash = await hashAmendment(a1);
const a2 = { ...a1, amendment_no: 2, amendment_text: 'تعديل ثانٍ', prev_hash: a1.content_hash };
a2.content_hash = await hashAmendment(a2);
assert.equal((await verifyAmendments(base, [a1, a2])).ok, true); checks++;
assert.equal((await verifyAmendments(base, [{ ...a1, amendment_text: 'تمديد الضمان ٩٠ أيام' }, a2])).ok, false); checks++;
assert.equal((await verifyAmendments(base, [a2])).ok, false, 'حذف تعديل يُكتشف'); checks++;

console.log(`hash.test: PASS (${checks} checks)`);
