# مِداد | MIDAD

> «المستند الذي يتفاعل معك»

منصة مستندات ذكية تفاعلية: بدل ملف PDF ثابت، يصبح المستند صفحة حيّة تعمل على الجوال والكمبيوتر، فيها فيديو ونماذج وتوقيع وخرائط، وتُشارك برابط واحد، ويمكن تصديرها إلى PDF عند الحاجة.

## التشغيل

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

## الصفحات

| المسار | الوصف |
| --- | --- |
| `/` | الصفحة التعريفية |
| `/dashboard` | لوحة المستندات: إنشاء، استيراد، قوالب، بحث وفرز، وإجراءات لكل مستند |
| `/editor/[id]` | المحرر: عناصر قابلة للسحب، لوحة خصائص، حفظ تلقائي، تراجع وإعادة، سجل نسخ |
| `/view/[id]` | معاينة المالك التفاعلية (قراءة، نماذج، توقيع، طباعة، PDF، مشاركة) |
| `/s/[slug]` | رابط المشاركة (محلي، أو مضمّن في الرابط عبر `#d=`) مع احترام الصلاحيات |

## البنية

```
src/
  app/                    المسارات (App Router)
  components/
    ui/                   مكوّنات shadcn/ui (مكتوبة يدويًا فوق Radix)
    blocks/               عرض العناصر الخمسة عشر (تحرير / قراءة / تصدير)
    document/             سطح المستند (السمة، الاتجاه، Container Queries) والمصغّرات
    editor/               المحرر، لوحة العناصر، لوحة الخصائص، سجل النسخ
    viewer/               صفحة القراءة والتعليقات
    dashboard/ landing/ shared/
  lib/
    types.ts              نموذج البيانات (MidadDocument, Block, Permissions…)
    storage/              واجهة DocumentRepository + تنفيذ IndexedDB
    stores/               Zustand: المستندات، المحرر (تاريخ التراجع)، الإعدادات
    templates/            القوالب السبعة ورسومها (SVG)
    pdf/export-pdf.tsx    التصدير إلى PDF (html-to-image + jsPDF)
    i18n/                 قاموس العربية والإنجليزية
```

### الانتقال لاحقًا إلى قاعدة بيانات
كل الوصول للبيانات يمر عبر `DocumentRepository` (`src/lib/storage/repository.ts`). يكفي كتابة تنفيذ جديد (API / Postgres / Cloudflare D1) وإرجاعه من `getRepository()` دون تعديل الواجهات.

### التصدير إلى PDF
يُرسم المستند خارج الشاشة بنفس مكوّن المعاينة (وضع `export`)، ثم يُلتقط بالمتصفح نفسه (فيبقى تشكيل العربية واتجاهها سليمًا)، ويُقسَّم إلى صفحات عند الفواصل بين العناصر مع إبقاء العناوين مع ما بعدها. الأحجام: A4، عرض تقديمي 16:9، مستند طويل بصفحة واحدة.

## النشر على Cloudflare Workers

يُبنى التطبيق بمحوّل OpenNext (`@opennextjs/cloudflare`) والإعدادات في `wrangler.jsonc` و `open-next.config.ts`.

```bash
npm run preview   # بناء وتشغيل محلي داخل بيئة Workers
npm run deploy    # بناء ونشر (يتطلب CLOUDFLARE_API_TOKEN و CLOUDFLARE_ACCOUNT_ID)
```
