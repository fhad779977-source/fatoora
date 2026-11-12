// «مضمون» — أماكن جاهزة للربط مع نفاذ والسجل التجاري.
// لا يوجد أي ربط حقيقي هنا. كل دالة تعيد «غير مربوط» بشكل صريح،
// والواجهة تعرض ذلك بوضوح حتى لا يُفهم أن التاجر موثّق رسميًا.

export const INTEGRATION_STATUS = {
  NOT_CONNECTED: 'not_connected',
  VERIFIED: 'verified',
  FAILED: 'failed',
};

// نفاذ (النفاذ الوطني الموحد): التحقق من هوية الشخص المفوّض عن التاجر.
// TODO(نفاذ): يتطلب اتفاقية مع مركز المعلومات الوطني + مفاتيح الربط.
export async function verifyNafath(_env, _merchantId) {
  return { status: INTEGRATION_STATUS.NOT_CONNECTED, provider: 'nafath', checkedAt: null };
}

// السجل التجاري (وزارة التجارة / واثق): التحقق من أن رقم السجل نشط ويخص التاجر.
// TODO(السجل التجاري): يتطلب الوصول لواجهة وزارة التجارة الرسمية.
export async function verifyCommercialRegistry(_env, _merchantId, _crNumber) {
  return { status: INTEGRATION_STATUS.NOT_CONNECTED, provider: 'commercial_registry', checkedAt: null };
}

export async function merchantVerificationSummary(env, merchantId) {
  const [nafath, cr] = await Promise.all([
    verifyNafath(env, merchantId),
    verifyCommercialRegistry(env, merchantId, null),
  ]);
  return { nafath, cr };
}
