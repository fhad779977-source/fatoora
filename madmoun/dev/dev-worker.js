// «مضمون» — عامل تجريبي للتشغيل المحلي فقط (wrangler dev --local).
// لا يُنشر أبدًا. يحاكي دخول فاتورة بكوكي بسيطة لأن نظام الدخول الحقيقي غير موجود في المستودع.
import { handleMadmoun, madmounScheduled } from '../index.js';

function devMerchant(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)mm_dev_merchant=([^;]+)/);
  return m ? { id: decodeURIComponent(m[1]) } : null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/login') {
      const id = url.searchParams.get('m');
      if (!id) return new Response('dev login: /login?m=<merchant_id>', { status: 401 });
      return new Response(null, {
        status: 303,
        headers: { location: url.searchParams.get('next') || '/madmoun', 'set-cookie': `mm_dev_merchant=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax` },
      });
    }
    if (url.pathname === '/__dev/scheduled') {
      const rows = await madmounScheduled({ cron: 'dev' }, env, ctx);
      return Response.json({ logged: rows.length, rows });
    }
    const res = await handleMadmoun(request, env, ctx, { getMerchant: devMerchant });
    return res || new Response('fatoora (dev stub) — not a madmoun route', { status: 404 });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(madmounScheduled(event, env, ctx));
  },
};
