/**
 * أدوات الصور: ضغط صور كاميرا الهاتف قبل رفعها إلى Firestore.
 *
 * الحدود التي نحترمها:
 *  - مستند Firestore محدود بـ 1 ميغابايت.
 *  - قواعد الأمان ترفض حقل الصورة الأساسية إذا تجاوز 300 ألف حرف
 *    (300,000 حرف Base64 ≈ 225 كيلوبايت بالبايت).
 *  - صور كاميرا الهاتف الحديثة تزن 3–8 ميغابايت، لذلك نضغطها في المتصفح.
 *
 * الهدف: جودة تُشبه مواقع عرض السيارات (وضوح عند التكبير) مع البقاء داخل الحدود.
 */

/** أقصى عدد صور لكل إعلان */
export const MAX_PHOTOS = 4;
/** أقصى عرض بالبكسل (يكفي لشاشات الهاتف الحديثة بدقة 3x) */
export const MAX_WIDTH = 1600;
/** الحجم المستهدف للصورة الأساسية: أعلى جودة لأنها تظهر في البطاقة */
export const PRIMARY_TARGET_BYTES = 160 * 1024;
/** الحجم المستهدف لبقية صور المعرض */
export const SECONDARY_TARGET_BYTES = 120 * 1024;
/** أقصى مجموع لكل الصور في الإعلان الواحد (بايت) — يبقي المستند بعيداً عن حد 1MB */
export const MAX_TOTAL_BYTES = 560 * 1024;

/** الحجم التقريبي بالبايت لنص Base64 */
export function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl.length;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

export function totalBytes(list: string[]): number {
  return list.reduce((sum, item) => sum + base64Bytes(item), 0);
}

/** الحجم المستهدف حسب ترتيب الصورة في الإعلان */
export function targetForIndex(index: number): number {
  return index === 0 ? PRIMARY_TARGET_BYTES : SECONDARY_TARGET_BYTES;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('تعذّر قراءة الصورة'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('تعذّر فتح الصورة'));
    img.src = src;
  });
}

/**
 * ضغط ذكي: يبدأ بجودة عالية (0.9) ويخفضها تدريجياً، فإن لم يكفِ يصغّر الأبعاد.
 * هذا يعطي أفضل وضوح ممكن داخل الحجم المسموح بدل الضغط القاسي من المحاولة الأولى.
 */
export async function compressImageFile(
  file: File,
  targetBytes = PRIMARY_TARGET_BYTES,
): Promise<string> {
  const raw = await readAsDataURL(file);
  const img = await loadImage(raw);

  let maxWidth = MAX_WIDTH;
  let best = raw;

  for (let round = 0; round < 6; round++) {
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    // تحسين نعومة التصغير (يمنع الحواف المتكسرة في صور السيارات)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.9;
    let out = canvas.toDataURL('image/jpeg', quality);
    while (base64Bytes(out) > targetBytes && quality > 0.55) {
      quality -= 0.07;
      out = canvas.toDataURL('image/jpeg', quality);
    }
    best = out;
    if (base64Bytes(out) <= targetBytes) return out;
    maxWidth = Math.round(maxWidth * 0.8);
  }
  return best;
}

/**
 * يضغط عدة صور (كاميرا أو معرض) ويعيد النتائج بالترتيب.
 * `startIndex` يحدد أي صورة ستكون الأساسية (صفر = أساسية بجودة أعلى).
 */
export async function compressImageFiles(
  files: File[],
  onProgress?: (done: number, total: number) => void,
  startIndex = 0,
): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < files.length; i++) {
    out.push(await compressImageFile(files[i], targetForIndex(startIndex + i)));
    if (onProgress) onProgress(i + 1, files.length);
  }
  return out;
}

/** صورة رمزية صغيرة للملف الشخصي (حد 40 كيلوبايت) */
export async function compressAvatarFile(file: File): Promise<string> {
  return compressImageFile(file, 40 * 1024);
}

/** حجم الصورة المصغّرة المعروضة في قائمة الإعلانات */
export const THUMB_TARGET_BYTES = 18 * 1024;
/** أقصى عرض للصورة المصغّرة */
export const THUMB_WIDTH = 480;

/**
 * يصنع مصغّرة خفيفة من صورة Base64 موجودة.
 * الهدف: ألا يتحمّل الزائر صوراً كاملة (150KB+) لمجرد تصفح قائمة الإعلانات،
 * وهذا مهم جداً على شبكات الموبايل البطيئة.
 */
export async function makeThumbnail(source: string): Promise<string> {
  const img = await loadImage(source);
  const scale = Math.min(1, THUMB_WIDTH / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.75;
  let out = canvas.toDataURL('image/jpeg', quality);
  while (base64Bytes(out) > THUMB_TARGET_BYTES && quality > 0.35) {
    quality -= 0.1;
    out = canvas.toDataURL('image/jpeg', quality);
  }
  return out;
}
