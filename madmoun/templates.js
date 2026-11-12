// «مضمون» — قوالب التعهد الجاهزة. التاجر يعدّل النص قبل الحفظ كما يشاء.
// {product} يُستبدل باسم المنتج، و {days} بالمدة.

export const PLEDGE_TYPES = {
  maintenance: 'صيانة',
  authenticity: 'أصالة',
  specification: 'مواصفات',
  general: 'عام',
};

export const TEMPLATES = {
  devices: {
    label: 'أجهزة',
    pledge_type: 'maintenance',
    duration_days: 365,
    text: 'أتعهّد بصيانة الجهاز «{product}» صيانة مجانية ضد عيوب التصنيع لمدة {days} يومًا من تاريخ الفاتورة، ويشمل ذلك قطع الغيار والأجرة، ولا يشمل سوء الاستخدام أو الكسر أو دخول السوائل.',
  },
  perfumes: {
    label: 'عطور',
    pledge_type: 'authenticity',
    duration_days: null,
    text: 'أتعهّد بأن العطر «{product}» أصلي ١٠٠٪ وغير مقلّد ولا معاد تعبئته، وأنه مطابق لما يصدر عن الشركة المصنّعة، وأتحمّل إعادة كامل المبلغ إن ثبت خلاف ذلك.',
  },
  honey: {
    label: 'عسل',
    pledge_type: 'authenticity',
    duration_days: null,
    text: 'أتعهّد بأن العسل «{product}» طبيعي ١٠٠٪، غير مغشوش ولا مضاف إليه سكر أو شراب محلّى، وأتحمّل إعادة كامل المبلغ إن أثبت فحص معتمد خلاف ذلك.',
  },
  fabrics: {
    label: 'أقمشة',
    pledge_type: 'specification',
    duration_days: null,
    text: 'أتعهّد بأن القماش «{product}» من النوع والخامة المذكورة (مثال: قطن ١٠٠٪)، وأتحمّل إعادة المبلغ أو الاستبدال إن ثبت أن الخامة مخالفة.',
  },
  general: {
    label: 'عام',
    pledge_type: 'general',
    duration_days: null,
    text: 'أتعهّد بأن المنتج «{product}» ',
  },
};

export function fillTemplate(text, product, days) {
  return text
    .replaceAll('{product}', product || '...')
    .replaceAll('{days}', days == null || days === '' ? '...' : String(days));
}
