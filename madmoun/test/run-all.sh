#!/usr/bin/env bash
# تشغيل كل اختبارات «مضمون» محليًا (لا يلمس أي قاعدة حقيقية).
# WRANGLER اختياري: مسار wrangler إن لم يكن متاحًا عبر npx.
set -euo pipefail
cd "$(dirname "$0")"
node hash.test.mjs
node e2e.test.mjs
