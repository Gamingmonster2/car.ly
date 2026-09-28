import React, { useEffect, useRef, useState } from 'react';
import { Camera, Images, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { carService, defaultExpiresAt, describeFirestoreError } from '../lib/carService';
import { MAX_PHOTOS, MAX_TOTAL_BYTES, base64Bytes, compressImageFiles, makeThumbnail, totalBytes } from '../lib/image';
import { displayLocal, isValidWhatsApp, normalizeWhatsApp } from '../lib/phone';
import type { Car } from '../types';

const CITIES = ['طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'زليتن', 'البيضاء', 'سبها', 'درنة', 'طبرق', 'غريان', 'الخمس', 'صبراتة'];

interface CarFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  onRequireAuth: () => void;
  editing?: Car | null;
}

const emptyForm = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  price: '',
  mileage: '',
  city: 'طرابلس',
  whatsapp: '',
  description: '',
};

export default function CarForm({ isOpen, onClose, onSaved, onRequireAuth, editing }: CarFormProps) {
  const { firebaseUser, profile } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<string[]>([]);
  /** مصغّرة خفيفة للصورة الأساسية تُعرض في قائمة الإعلانات */
  const [thumb, setThumb] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setProgress(null);
    if (editing) {
      setForm({
        make: editing.make,
        model: editing.model,
        year: editing.year,
        price: String(editing.price),
        mileage: editing.mileage,
        city: editing.city,
        whatsapp: displayLocal(editing.whatsapp),
        description: editing.description,
      });
      setPhotos(editing.images && editing.images.length > 0 ? editing.images : editing.image ? [editing.image] : []);
      setThumb(editing.thumb ?? '');
    } else {
      setForm({ ...emptyForm, whatsapp: profile?.phone ? displayLocal(profile.phone) : '', city: profile?.city ?? 'طرابلس' });
      setPhotos([]);
    }
  }, [isOpen, editing, profile]);

  if (!isOpen) return null;

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const room = MAX_PHOTOS - photos.length;
      if (room <= 0) throw new Error(`الحد الأقصى ${MAX_PHOTOS} صور لكل إعلان.`);
      const selected = files.slice(0, room);
      setProgress(`جاري ضغط الصور (0/${selected.length})...`);
      const compressed = await compressImageFiles(
        selected,
        (done, total) => setProgress(`جاري ضغط الصور (${done}/${total})...`),
        photos.length,
      );
      const next = [...photos, ...compressed];
      if (totalBytes(next) > MAX_TOTAL_BYTES) {
        throw new Error('مجموع الصور كبير جداً. احذف صورة أو صوّر بجودة أقل.');
      }
      // المصغّرة تُبنى من الصورة الأساسية مرة واحدة عند إضافة أول صورة
      if (photos.length === 0 && next.length > 0 && !thumb) {
        setProgress('جاري تجهيز صورة العرض...');
        setThumb(await makeThumbnail(next[0]));
      }
      setPhotos(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تجهيز الصور.');
    } finally {
      setProgress(null);
      setBusy(false);
    }
  };

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    void addFiles(files);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    if (!firebaseUser) {
      onRequireAuth();
      return;
    }
    if (!form.make.trim() || !form.model.trim()) return setError('اكتب نوع السيارة والموديل.');
    const year = Number(form.year);
    const price = Number(form.price);
    const whatsapp = normalizeWhatsApp(form.whatsapp);
    if (year < 1980 || year > 2030) return setError('سنة الصنع يجب أن تكون بين 1980 و 2030.');
    if (!price || price < 500) return setError('السعر غير صحيح (الحد الأدنى 500 د.ل).');
    if (price > 5000000) return setError('السعر أكبر من الحد المسموح.');
    if (!isValidWhatsApp(whatsapp)) return setError('رقم الواتساب غير صحيح. مثال: 0912345678');

    const payload: Omit<Car, 'id'> = {
      make: form.make.trim().slice(0, 50),
      model: form.model.trim().slice(0, 50),
      year,
      price,
      mileage: form.mileage.trim().slice(0, 50) || 'غير محدد',
      city: form.city,
      whatsapp,
      phone: displayLocal(whatsapp),
      description:
        form.description.trim().slice(0, 2000) || 'سيارة بحالة جيدة، للمعاينة والتواصل المباشر عبر الواتساب.',
      // لا نكرّر الصورة الأساسية: تُخزَّن مرة واحدة في images[0] + مصغّرة خفيفة
      images: photos,
      ...(thumb ? { thumb } : {}),
      ...(photos.length === 0 ? { image: `${import.meta.env.BASE_URL}car-placeholder.svg` } : {}),
      ownerId: firebaseUser.uid,
      ownerName: profile?.displayName ?? 'مستخدم',
    };

    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await carService.updateCar(editing.id, payload);
        onSaved('تم تحديث إعلانك بنجاح.');
      } else {
        const now = Date.now();
        await carService.addCar({
          ...payload,
          createdAt: now,
          expiresAt: defaultExpiresAt(now),
          status: 'pending',
        });
        onSaved('تم إرسال إعلانك للمراجعة، وسيظهر للزوار بعد الموافقة عليه — مدة النشر 30 يوماً.');
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(describeFirestoreError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl relative my-6">
        <button onClick={onClose} className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{editing ? 'تعديل الإعلان' : 'إضافة إعلان سيارة'}</h3>
            <p className="text-[11px] text-slate-500">
              {editing ? 'عدّل البيانات ثم احفظ' : 'صوّر سيارتك بكاميرا هاتفك وانشرها في دقيقة'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="النوع (الشركة) *" value={form.make} onChange={(v) => setForm({ ...form, make: v })} placeholder="تويوتا" />
            <TextField label="الموديل *" value={form.model} onChange={(v) => setForm({ ...form, model: v })} placeholder="كامري" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>سنة الصنع *</Label>
              <input
                type="number"
                min={1980}
                max={2030}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <Label>السعر (د.ل) *</Label>
              <input
                type="number"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="55000"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <Label>المدينة *</Label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-2 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="الممشى" value={form.mileage} onChange={(v) => setForm({ ...form, mileage: v })} placeholder="45,000 كم" />
            <TextField
              label="رقم الواتساب *"
              value={form.whatsapp}
              onChange={(v) => setForm({ ...form, whatsapp: v })}
              placeholder="0912345678"
            />
          </div>

          {/* صور السيارة من كاميرا الهاتف */}
          <div>
            <Label>صور السيارة (حتى {MAX_PHOTOS} صور)</Label>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              لأفضل نتيجة: صوّر السيارة <strong>أفقيّاً</strong> من الخارج (أمامي، خلفي، جانبي، الداخلية) في ضوء
              النهار. الصورة الأولى هي <strong>الصورة الرئيسية</strong> وتُحفظ بجودة أعلى لأنها تظهر في نتائج البحث.
            </p>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePick} className="hidden" />
            <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handlePick} className="hidden" />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={busy || photos.length >= MAX_PHOTOS}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/60 py-3 rounded-2xl flex items-center justify-center gap-2 text-blue-700 font-bold text-xs disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>تصوير بالكاميرا</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={busy || photos.length >= MAX_PHOTOS}
                className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 py-3 rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-bold text-xs disabled:opacity-50"
              >
                <Images className="w-4 h-4" />
                <span>من معرض الصور</span>
              </button>
            </div>

            {progress && (
              <p className="mt-2 text-[11px] font-bold text-blue-700 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progress}
              </p>
            )}

            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={photo} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" />
                    {index === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[9px] font-bold text-center py-0.5">
                        الصورة الرئيسية
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute top-1 left-1 bg-rose-600 text-white rounded-lg p-1"
                      aria-label="حذف الصورة"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute top-1 right-1 bg-slate-900/70 text-white text-[9px] px-1 rounded">
                      {Math.round(base64Bytes(photo) / 1024)}KB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>الوصف والمواصفات</Label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="المحرك، الهيكل، الحالة، الورق..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}

          {!firebaseUser && (
            <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              النشر يحتاج حساباً — سجّل الدخول أولاً ثم انشر إعلانك.
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className={`w-full text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 ${
              busy ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{editing ? 'حفظ التعديلات' : 'نشر الإعلان'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-700 mb-1">{children}</label>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
      />
    </div>
  );
}
