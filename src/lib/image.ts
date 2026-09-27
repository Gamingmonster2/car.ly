/**
 * أدوات الصور: ضغط صور كاميرا الهاتف إلى حجم آمن قبل رفعها إلى Firestore.
 *
 * لماذا؟ مستند Firestore محدود بـ 1 ميغابايت، وقواعد الأمان ترفض حقل الصورة
 * إذا تجاوز 300 ألف حرف. صور كاميرا الهاتف الحديثة تزن 3–8 ميغابايت،
 * لذلك نضغطها في المتصفح قبل الإرسال.
 */

/** أقصى عدد صور لكل إعلان */
export const MAX_PHOTOS = 4;
/** الحجم المستهدف للصورة الواحدة بعد الضغط (بايت) */
export const TARGET_BYTES = 110 * 1024;

/** الحجم التقريبي بالبايت لنص Base64 */
export function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl.length;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

export function totalBytes(list: string[]): number {
  return list.reduce((sum, item) => sum + base64Bytes(item), 0);
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
 * يضغط صورة واحدة: تصغير تدريجي للعرض + خفض الجودة حتى تنزل تحت الحجم المستهدف.
 */
export async function compressImageFile(file: File, targetBytes = TARGET_BYTES): Promise<string> {
  const raw = await readAsDataURL(file);
  const img = await loadImage(raw);

  let maxWidth = 1280;
  let result = raw;

  for (let round = 0; round < 7; round++) {
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.82;
    let out = canvas.toDataURL('image/jpeg', quality);
    while (base64Bytes(out) > targetBytes && quality > 0.42) {
      quality -= 0.1;
      out = canvas.toDataURL('image/jpeg', quality);
    }
    result = out;
    if (base64Bytes(out) <= targetBytes) return out;
    maxWidth = Math.round(maxWidth * 0.75);
  }
  return result;
}

/** يضغط عدة صور (كاميرا أو معرض) ويعيد النتائج بالترتيب */
export async function compressImageFiles(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < files.length; i++) {
    out.push(await compressImageFile(files[i]));
    if (onProgress) onProgress(i + 1, files.length);
  }
  return out;
}

/** صورة رمزية صغيرة للملف الشخصي (حد 40 كيلوبايت) */
export async function compressAvatarFile(file: File): Promise<string> {
  return compressImageFile(file, 40 * 1024);
}
