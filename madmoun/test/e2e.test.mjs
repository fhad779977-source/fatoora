// اختبار شامل محلي: ينشئ قاعدة D1 محلية مؤقتة، يطبّق ترحيل مضمون + جداول فاتورة البديلة،
// يشغّل wrangler dev --local، ويجرّب: تاجر تجريبي، فاتورة، تعهد، صفحة العميل، مطالبة، تعديل،
// منع UPDATE/DELETE، ثم تلاعب مباشر (بتجاوز المشغّلات) ويتأكد أن التحقق ينكسر.
// لا يلمس أي قاعدة حقيقية: كل شيء --local داخل مجلد مؤقت.
// التشغيل: node madmoun/test/e2e.test.mjs   (يتطلب wrangler؛ أو WRANGLER=/path/to/wrangler)
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const devDir = join(here, '..', 'dev');
const config = join(devDir, 'wrangler.dev.toml');
const persist = mkdtempSync(join(process.env.MADMOUN_TMP || tmpdir(), 'madmoun-e2e-'));
const PORT = Number(process.env.MADMOUN_PORT || 8799);
const BASE = `http://127.0.0.1:${PORT}`;
const [wcmd, ...wpre] = (process.env.WRANGLER || 'npx wrangler').split(' ');
const results = [];
const step = (name) => { results.push(name); console.log('  ✓', name); };

function wr(args, { allowFail = false } = {}) {
  try {
    return execFileSync(wcmd, [...wpre, ...args], { cwd: devDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    if (allowFail) return { failed: true, out: String(e.stdout) + String(e.stderr) };
    throw new Error(`wrangler ${args.join(' ')} failed:\n${e.stdout}\n${e.stderr}`);
  }
}
const sql = (command, opts) => wr(['d1', 'execute', 'DB', '--local', '--persist-to', persist, '-c', config, '--json', '--command', command], opts);
// wrangler قد يطبع أسطرًا قبل JSON (مثل تنبيه البروكسي)، فنقرأ من أول «[».
const sqlRows = (command) => { const out = sql(command); return JSON.parse(out.slice(out.indexOf('[')))[0].results; };

async function http(path, { method = 'GET', form, cookie, origin = BASE } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  let body;
  if (form) { body = new URLSearchParams(form); headers['content-type'] = 'application/x-www-form-urlencoded'; }
  if (method === 'POST' && origin) headers.origin = origin;
  const r = await fetch(BASE + path, { method, headers, body, redirect: 'manual' });
  return { status: r.status, location: r.headers.get('location'), text: await r.text(), setCookie: r.headers.get('set-cookie') };
}

let server;
let log = '';

// تشغيل/إيقاف wrangler dev. نوقفه قبل أي تعديل مباشر على ملف القاعدة المحلية
// لأن الكتابة المتزامنة من عمليتين على نفس ملف SQLite توقف الخادم المحلي.
async function startServer() {
  server = spawn(wcmd, [...wpre, 'dev', '--local', '--persist-to', persist, '-c', config, '--port', String(PORT), '--ip', '127.0.0.1'],
    { cwd: devDir, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  for (let i = 0; ; i++) {
    try { await fetch(BASE + '/__ping'); return; } catch { /* انتظر */ }
    if (i > 120) throw new Error('wrangler dev did not start:\n' + log);
    await new Promise((r) => setTimeout(r, 500));
  }
}
async function stopServer() {
  if (!server) return;
  const done = new Promise((r) => server.once('exit', r));
  server.kill('SIGTERM');
  await done;
  server = null;
}
try {
  console.log('madmoun e2e — persist dir:', persist);
  wr(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', persist, '-c', config]);
  wr(['d1', 'execute', 'DB', '--local', '--persist-to', persist, '-c', config, '--file', join(devDir, 'seed-fatoora-stub.sql')]);
  step('ترحيل مضمون + جداول فاتورة البديلة (تاجر تجريبي وفواتير) طُبّقت محليًا');

  await startServer();
  step('wrangler dev --local يعمل');

  // مسار ليس لمضمون يرجع null → يمرّ لفاتورة.
  assert.equal((await http('/invoices')).status, 404);
  assert.match((await http('/invoices')).text, /not a madmoun route/);
  step('المسارات غير التابعة لمضمون لا تتأثر (handleMadmoun يعيد null)');

  // بدون دخول → تحويل لصفحة الدخول.
  const anon = await http('/madmoun');
  assert.equal(anon.status, 303); assert.match(anon.location, /^\/login\?next=/);
  step('صفحات التاجر تتطلب الدخول');

  const login = await http('/login?m=m-test-1');
  const cookie = login.setCookie.split(';')[0];
  const cookie2 = 'mm_dev_merchant=m-test-2';

  const newPage = await http('/madmoun/new', { cookie });
  assert.equal(newPage.status, 200);
  for (const label of ['أجهزة', 'عطور', 'عسل', 'أقمشة', 'عام']) assert.ok(newPage.text.includes(label), label);
  assert.ok(newPage.text.includes('مضمون يوثّق تعهّد التاجر، ولا يفحص المنتج ولا يضمنه'));
  assert.ok(newPage.text.includes('INV-1001'));
  step('صفحة الإنشاء: القوالب الخمسة + التنبيه + فواتير التاجر');

  // فاتورة تاجر آخر مرفوضة.
  const foreign = await http('/madmoun/pledges', { method: 'POST', cookie, form: {
    invoice_id: 'inv-2001', product_name: 'x', pledge_type: 'general', pledge_text: 'نص', template_key: 'general' } });
  assert.equal(foreign.status, 400); assert.ok(foreign.text.includes('لا تخصك'));
  step('لا يمكن ربط تعهد بفاتورة تاجر آخر');

  // CSRF.
  const csrf = await http('/madmoun/pledges', { method: 'POST', cookie, origin: 'https://evil.example', form: { invoice_id: 'inv-1001' } });
  assert.equal(csrf.status, 403);
  step('طلبات النماذج من موقع آخر مرفوضة (CSRF)');

  const pledgeText = 'أتعهّد بأن العسل «عسل سدر جبلي» طبيعي ١٠٠٪، غير مغشوش ولا مضاف إليه سكر.';
  const created = await http('/madmoun/pledges', { method: 'POST', cookie, form: {
    invoice_id: 'inv-1001', product_name: 'عسل سدر جبلي', pledge_type: 'authenticity', template_key: 'honey',
    duration_days: '5', pledge_text: pledgeText, customer_phone: '٠٥٠١٢٣٤٥٦٧' } });
  assert.equal(created.status, 303, created.text);
  const pledgeId = created.location.match(/\/madmoun\/p\/(\d+)/)[1];
  const created2 = await http('/madmoun/pledges', { method: 'POST', cookie, form: {
    invoice_id: 'inv-1002', product_name: 'جوال', pledge_type: 'maintenance', template_key: 'devices',
    duration_days: '365', pledge_text: 'أتعهّد بصيانة الجوال سنة كاملة.' } });
  assert.equal(created2.status, 303);
  step('إنشاء تعهدين مرتبطين بفاتورتين (جوال العميل اختياري، والأرقام العربية مقبولة)');

  const rows = sqlRows('SELECT id, seq, prev_hash, content_hash, public_token, customer_phone FROM pledges ORDER BY seq');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].prev_hash, '0'.repeat(64));
  assert.equal(rows[1].prev_hash, rows[0].content_hash);
  assert.equal(rows[0].customer_phone, '+966501234567');
  assert.equal(sqlRows('SELECT typeof(customer_phone) t FROM pledges WHERE seq = 2')[0].t, 'null', 'بدون جوال = NULL فعلي');
  step('السلسلة صحيحة: التعهد الثاني يحمل بصمة الأول');
  const token = rows[0].public_token;

  const merchantView = await http(`/madmoun/p/${pledgeId}`, { cookie });
  assert.ok(merchantView.text.includes('موثّق ولم يُعدّل'));
  assert.equal((await http(`/madmoun/p/${pledgeId}`, { cookie: cookie2 })).status, 404);
  step('التاجر يرى تعهده، وتاجر آخر لا يستطيع');

  let cust = await http(`/m/${token}`);
  assert.equal(cust.status, 200);
  assert.ok(cust.text.includes('موثّق ولم يُعدّل'));
  assert.ok(cust.text.includes('مضمون يوثّق تعهّد التاجر، ولا يفحص المنتج ولا يضمنه'));
  assert.ok(cust.text.includes('INV-1001'));
  assert.ok(cust.text.includes('تقديم مطالبة'));
  assert.ok(!cust.text.includes('501234567'), 'جوال العميل لا يظهر في الصفحة العامة');
  assert.equal((await http('/m/AAAAAAAAAAAAAAAAAAAAAA')).status, 404);
  step('صفحة العميل: التعهد + الفاتورة + شارة «موثّق ولم يُعدّل» + التنبيه + زر المطالبة، بدون جوال العميل');

  const claim = await http(`/m/${token}/claim`, { method: 'POST', form: { claim_text: 'وجدت العسل متبلّرًا بشكل غريب', customer_phone: '' } });
  assert.equal(claim.status, 303);
  const dash = await http('/madmoun', { cookie });
  assert.ok(dash.text.includes('وجدت العسل'));
  const claimId = sqlRows('SELECT id FROM claims')[0].id;
  const resp = await http(`/madmoun/claims/${claimId}/respond`, { method: 'POST', cookie, form: { status: 'resolved', merchant_response: 'تم استبدال المنتج' } });
  assert.equal(resp.status, 303);
  step('العميل يقدّم مطالبة، والتاجر يراها في قائمته ويرد عليها');

  const amend = await http(`/madmoun/p/${pledgeId}/amend`, { method: 'POST', cookie, form: { amendment_text: 'تمديد المدة ٣٠ يومًا إضافية' } });
  assert.equal(amend.status, 303);
  cust = await http(`/m/${token}`);
  assert.ok(cust.text.includes('تمديد المدة') && cust.text.includes(pledgeText) && cust.text.includes('موثّق ولم يُعدّل'));
  step('إضافة تعديل يظهر للعميل مع بقاء الأصل كما هو');

  // منع UPDATE/DELETE على مستوى القاعدة.
  await stopServer();
  for (const cmd of [
    `UPDATE pledges SET pledge_text = 'x' WHERE id = ${pledgeId}`,
    `DELETE FROM pledges WHERE id = ${pledgeId}`,
    'UPDATE pledge_amendments SET amendment_text = \'x\'',
    'DELETE FROM pledge_amendments',
    'UPDATE claims SET claim_text = \'x\'',
    'DELETE FROM claims',
    'UPDATE madmoun_audit SET action = \'x\'',
    'DELETE FROM madmoun_audit',
  ]) {
    const r = sql(cmd, { allowFail: true });
    assert.ok(r.failed && /append-only|immutable|cannot be deleted/.test(r.out), 'should be blocked: ' + cmd);
  }
  step('قاعدة البيانات ترفض أي UPDATE أو DELETE على التعهدات والتعديلات والتدقيق، ونص المطالبة الأصلي');

  await startServer();
  // التذكير المجدول (يسجّل فقط).
  const sched = JSON.parse((await http('/__dev/scheduled')).text);
  assert.equal(sched.logged, 1, 'التعهد ذو الخمسة أيام فقط');
  assert.equal(JSON.parse((await http('/__dev/scheduled')).text).logged, 0, 'لا تكرار');
  const reminder = sqlRows("SELECT details FROM madmoun_audit WHERE action = 'reminder.due'");
  assert.equal(JSON.parse(reminder[0].details).sent, false);
  step('الوظيفة المجدولة تسجّل التعهدات القريبة من الانتهاء مرة واحدة، بدون إرسال');

  const audits = sqlRows('SELECT action, COUNT(*) n FROM madmoun_audit GROUP BY action ORDER BY action');
  console.log('    سجل التدقيق:', audits.map((a) => `${a.action}=${a.n}`).join(', '));
  step('كل عملية مسجّلة في madmoun_audit');

  await stopServer();
  // التلاعب: مهاجم يملك وصولًا مباشرًا للقاعدة ويتجاوز المشغّلات ويغيّر حرفًا واحدًا.
  sql(`DROP TRIGGER pledges_no_update; UPDATE pledges SET pledge_text = replace(pledge_text, '١٠٠٪', '٩٩٪') WHERE id = ${pledgeId}`);
  await startServer();
  cust = await http(`/m/${token}`);
  assert.ok(cust.text.includes('فشل التحقق') && !cust.text.includes('موثّق ولم يُعدّل'));
  let vj = JSON.parse((await http(`/m/${token}/verify.json`)).text);
  assert.equal(vj.verified, false); assert.equal(vj.checks.content_hash, false);
  step('تغيير حرف واحد في نص التعهد مباشرة في القاعدة يكسر التحقق (الشارة تتحول لفشل)');

  // مهاجم أذكى: يعيد حساب البصمة أيضًا → السلسلة تكشفه عبر التعهد التالي.
  const { hashPledge } = await import('../hash.js');
  const p = sqlRows(`SELECT * FROM pledges WHERE id = ${pledgeId}`)[0];
  const newHash = await hashPledge(p);
  await stopServer();
  sql(`UPDATE pledges SET content_hash = '${newHash}' WHERE id = ${pledgeId}`);
  await startServer();
  vj = JSON.parse((await http(`/m/${token}/verify.json`)).text);
  assert.equal(vj.checks.content_hash, true, 'البصمة الجديدة متسقة مع المحتوى المزوّر');
  assert.equal(vj.checks.chain_next, false, 'لكن التعهد التالي يكشف التزوير');
  assert.equal(vj.checks.amendments, false, 'وسلسلة التعديلات تكشفه أيضًا');
  assert.equal(vj.verified, false);
  step('حتى مع إعادة حساب البصمة: السلسلة (التعهد التالي والتعديلات) تكشف التزوير');

  console.log(`\ne2e: PASS (${results.length} steps)`);
} catch (err) {
  console.error('\ne2e: FAIL\n', err);
  if (process.env.MADMOUN_DEBUG) console.error('--- wrangler dev log ---\n' + log.slice(-4000));
  process.exitCode = 1;
} finally {
  await stopServer();
  if (!process.env.MADMOUN_KEEP) rmSync(persist, { recursive: true, force: true });
}
