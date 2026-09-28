/**
 * صياغة عربية للوقت المنقضي منذ نشر الإعلان.
 * تُستخدم في تدفق الإعلانات (إعلان تحت إعلان) كما في صفحات فيسبوك.
 */
export function timeAgo(timestamp?: number, now: number = Date.now()): string {
  if (!timestamp) return '';
  const minutes = Math.floor((now - timestamp) / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes === 1) return 'منذ دقيقة';
  if (minutes === 2) return 'منذ دقيقتين';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'منذ ساعة';
  if (hours === 2) return 'منذ ساعتين';
  if (hours < 24) return `منذ ${hours} ساعات`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'منذ يوم';
  if (days === 2) return 'منذ يومين';
  if (days < 11) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${days} يوماً`;

  const months = Math.floor(days / 30);
  if (months === 1) return 'منذ شهر';
  if (months === 2) return 'منذ شهرين';
  if (months < 11) return `منذ ${months} أشهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
}

/** الوقت المتبقي حتى انتهاء صلاحية الإعلان بصياغة عربية */
export function expiresIn(expiresAt?: number, now: number = Date.now()): string {
  if (!expiresAt) return '';
  const days = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));
  if (days < 0) return 'انتهت الصلاحية';
  if (days === 0) return 'ينتهي اليوم';
  if (days === 1) return 'يتبقى يوم';
  if (days === 2) return 'يتبقى يومان';
  if (days < 11) return `يتبقى ${days} أيام`;
  return `يتبقى ${days} يوماً`;
}
