import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Loader2,
  MessageCircle,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { carService, describeFirestoreError } from '../lib/carService';
import { compressAvatarFile } from '../lib/image';
import { displayLocal, isValidWhatsApp, prettyPhone } from '../lib/phone';
import type { Car } from '../types';

const EMOJIS = ['🚗', '🏎️', '🚙', '🛻', '🚐', '🏁', '⭐', '🔥', '💎', '🦅', '🐎', '🛠️'];

interface MyPageProps {
  onBack: () => void;
  onEdit: (car: Car) => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export default function MyPage({ onBack, onEdit, onToast }: MyPageProps) {
  const { profile, firebaseUser, updateProfileFields, requestWhatsAppVerification, refreshProfile, logout } = useAuth();
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [waCode, setWaCode] = useState<string | null>(null);
  const [draft, setDraft] = useState({ displayName: '', phone: '', city: '' });
  const avatarRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!firebaseUser) {
      setMyCars([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await carService.getCarsByOwner(firebaseUser.uid);
    setMyCars(result.cars);
    setOnline(result.online);
    setLoading(false);
  }, [firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (profile) {
      setDraft({
        displayName: profile.displayName ?? '',
        phone: profile.phone ? displayLocal(profile.phone) : '',
        city: profile.city ?? 'طرابلس',
      });
    }
  }, [profile]);

  const saveProfile = async () => {
    if (draft.displayName.trim().length < 2) return onToast('اكتب اسماً صحيحاً.', 'error');
    if (draft.phone && !isValidWhatsApp(draft.phone)) return onToast('رقم الواتساب غير صحيح.', 'error');
    setSaving(true);
    try {
      await updateProfileFields({
        displayName: draft.displayName.trim(),
        phone: draft.phone ? displayLocal(draft.phone) : undefined,
        city: draft.city,
      });
      onToast('تم حفظ بيانات حسابك.');
    } catch (err) {
      onToast(describeFirestoreError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSaving(true);
    try {
      const compressed = await compressAvatarFile(file);
      await updateProfileFields({ avatarImage: compressed });
      onToast('تم تحديث صورة حسابك.');
    } catch {
      onToast('تعذّر تجهيز الصورة.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (car: Car) => {
    if (!window.confirm(`حذف إعلان «${car.make} ${car.model}» نهائياً؟`)) return;
    setDeletingId(car.id);
    try {
      await carService.deleteCar(car.id);
      setMyCars((prev) => prev.filter((item) => item.id !== car.id));
      onToast('تم حذف الإعلان.');
    } catch (err) {
      onToast(describeFirestoreError(err), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const startWa = async () => {
    try {
      if (!isValidWhatsApp(draft.phone)) return onToast('اكتب رقم واتساب صحيح أولاً.', 'error');
      const result = await requestWhatsAppVerification(draft.phone);
      setWaCode(result.code);
      setWaLink(result.link);
      onToast('أرسل الكود إلى واتساب الإدارة لتوثيق رقمك.', 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : describeFirestoreError(err), 'error');
    }
  };

  if (!profile || !firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <UserCircle2 className="w-14 h-14 text-slate-400 mx-auto" />
        <p className="font-bold text-slate-700">هذه صفحتك الشخصية — تحتاج تسجيل الدخول أولاً.</p>
        <button onClick={onBack} className="text-blue-600 font-bold text-sm hover:underline">العودة للرئيسية</button>
      </div>
    );
  }

  const verified = profile.phoneStatus === 'verified';
  const initials = profile.displayName.trim().charAt(0) || 'م';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
        <ArrowRight className="w-4 h-4" />
        <span>العودة للإعلانات</span>
      </button>

      {/* بطاقة الحساب */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-black overflow-hidden">
              {profile.avatarImage ? (
                <img src={profile.avatarImage} alt="صورتي" className="w-full h-full object-cover" />
              ) : (
                <span>{profile.avatarEmoji || initials}</span>
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -left-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow"
              aria-label="تغيير الصورة"
            >
              <Camera className="w-4 h-4 text-slate-600" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
          </div>

          <div className="flex-1 min-w-[220px] space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{profile.displayName}</h2>
              {verified && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" /> رقم موثّق
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{profile.email ?? '—'}</p>
            <p className="text-xs text-slate-500">رقم الواتساب: {profile.phone ? prettyPhone(profile.phone) : 'غير مضاف'}</p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => updateProfileFields({ avatarEmoji: emoji, avatarImage: undefined })}
                  className={`w-9 h-9 rounded-xl border text-lg ${
                    profile.avatarEmoji === emoji && !profile.avatarImage
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  title="اختر إيموجي لتمييز حسابك"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <Input label="الاسم" value={draft.displayName} onChange={(v) => setDraft({ ...draft, displayName: v })} />
          <Input label="رقم الواتساب" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="0912345678" />
          <Input label="المدينة" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ البيانات</span>
          </button>

          {!verified && (
            <button onClick={startWa} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>توثيق الرقم عبر واتساب</span>
            </button>
          )}

          <button onClick={() => refreshProfile()} className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-sm text-slate-700">
            <RefreshCw className="w-4 h-4" />
            <span>تحديث الحالة</span>
          </button>

          <button onClick={logout} className="flex items-center gap-2 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold px-4 py-2.5 rounded-xl text-sm">
            خروج
          </button>
        </div>

        {waCode && waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال كود التوثيق {waCode} على واتساب الإدارة</span>
          </a>
        )}

        {profile.phoneStatus === 'pending' && (
          <p className="mt-3 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            رقمك بانتظار تأكيد الإدارة. بعد التأكيد اضغط «تحديث الحالة» لتظهر شارة «رقم موثّق».
          </p>
        )}
      </section>

      {/* إعلاناتي */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">
            إعلاناتي <span className="text-sm font-normal text-slate-500">({myCars.length})</span>
          </h3>
          <button onClick={() => void load()} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> تحديث
          </button>
        </div>

        {!online && (
          <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            تعذّر الاتصال بقاعدة البيانات الآن. أعد المحاولة بعد قليل.
          </p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل إعلاناتك...
          </p>
        ) : myCars.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300">
            <p className="text-slate-600 font-bold text-sm">لا توجد إعلانات بعد.</p>
            <p className="text-xs text-slate-500 mt-1">اضغط «أضف سيارتك» وانشر أول إعلان من كاميرا هاتفك.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myCars.map((car) => (
              <div key={car.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 flex-wrap">
                <img
                  src={car.thumb || car.images?.[0] || car.image || `${import.meta.env.BASE_URL}car-placeholder.svg`}
                  alt={`${car.make} ${car.model}`}
                  className="w-20 h-16 rounded-xl object-cover bg-slate-100"
                  loading="lazy"
                />
                <div className="flex-1 min-w-[160px]">
                  <p className="font-black text-slate-900 text-sm">
                    {car.make} {car.model} <span className="text-slate-400 font-normal">({car.year})</span>
                  </p>
                  <p className="text-blue-600 font-bold text-sm">{car.price.toLocaleString()} د.ل</p>
                  <p className="text-[11px] text-slate-500">
                    {car.city} • {car.mileage}
                    {car.images && car.images.length > 1 ? ` • ${car.images.length} صور` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(car)}
                    className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 font-bold px-3 py-2 rounded-xl text-xs text-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5" /> تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(car)}
                    disabled={deletingId === car.id}
                    className="flex items-center gap-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold px-3 py-2 rounded-xl text-xs disabled:opacity-50"
                  >
                    {deletingId === car.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Input({
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
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
      />
    </div>
  );
}
