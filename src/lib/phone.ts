/**
 * أدوات أرقام الهاتف والواتساب (ليبيا +218 وأي رقم دولي).
 */

/** تطبيع أي إدخال إلى صيغة واتساب: 218XXXXXXXXX أو رقم دولي كما هو */
export function normalizeWhatsApp(raw: string): string {
  let d = (raw || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('218')) return d;
  // رقم ليبي محلي: 0912345678 → 218912345678
  if (d.startsWith('0')) return '218' + d.slice(1);
  // رقم ليبي بلا صفر: 912345678 (9 أرقام تبدأ بـ 9) → 218912345678
  if (d.length === 9 && d.startsWith('9')) return '218' + d;
  return d;
}

/** هل الرقم صالح للإرسال؟ (يقبل الليبي والدولي) */
export function isValidWhatsApp(raw: string): boolean {
  const d = normalizeWhatsApp(raw);
  if (/^2189\d{8}$/.test(d)) return true; // ليبي: 218 + 9 أرقام
  return /^\d{8,19}$/.test(d); // دولي
}

/** عرض محلي مقروء: 0912345678 */
export function displayLocal(raw: string): string {
  const d = normalizeWhatsApp(raw);
  if (/^2189\d{8}$/.test(d)) return '0' + d.slice(3);
  return d;
}

/** رقم مختصر للقراءة: 0912 345 678 */
export function prettyPhone(raw: string): string {
  const local = displayLocal(raw);
  const grouped =
    local.length === 10 ? local.slice(0, 4) + ' ' + local.slice(4, 7) + ' ' + local.slice(7) : local;
  // عزل اتجاهي (LRI…PDI): يضمن ظهور الرقم بترتيبه الصحيح داخل النص العربي
  // فلا يظهر معكوساً في الواجهة ولا في رسائل الواتساب
  return '\u2066' + grouped + '\u2069';
}

/** يعزل أي نص لاتيني/رقمي حتى يظهر بترتيبه الصحيح داخل واجهة عربية */
export function isolateLtr(text: string): string {
  return '\u2066' + text + '\u2069';
}

/** رابط محادثة واتساب مع نص جاهز */
export function waLink(raw: string, text?: string): string {
  const clean = normalizeWhatsApp(raw).replace(/\D/g, '');
  return 'https://wa.me/' + clean + (text ? '?text=' + encodeURIComponent(text) : '');
}
