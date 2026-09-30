import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, Loader2, ShieldCheck, MessageCircle, Chrome } from 'lucide-react';
import { describeAuthError, useAuth } from '../lib/authContext';
import { displayLocal, isValidWhatsApp } from '../lib/phone';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Mode = 'login' | 'signup' | 'quick';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInQuickPhone,
    signUpWithPhonePassword,
    signInWithPhonePassword,
    signInWithGoogle,
    resetPassword,
    startPhoneVerification,
    confirmPhoneCode,
    requestWhatsAppVerification,
    phoneOtpEnabled,
    profile,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('طرابلس');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [waCode, setWaCode] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error && !(err as { code?: string }).code ? err.message : describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    run(async () => {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'quick') {
        if (name.trim().length < 2) throw new Error('اكتب اسمك (حرفان على الأقل).');
        if (!isValidWhatsApp(phone)) throw new Error('رقم الواتساب غير صحيح. مثال: 0912345678 أو 218912345678');
        if (password.length >= 6) {
          // كلمة مرور = حساب دائم يفتح من أي جهاز
          try {
            await signInWithPhonePassword(phone, password);
          } catch (err) {
            const code = String((err as { code?: string })?.code ?? '');
            if (code.includes('user-not-found')) {
              await signUpWithPhonePassword(name, phone, password, city);
              setInfo('تم إنشاء حسابك برقمك وكلمة المرور — يمكنك الدخول من أي جهاز بنفس البيانات.');
            } else {
              throw new Error('هذا الرقم مسجّل بكلمة مرور مختلفة. تأكد من كلمة المرور.');
            }
          }
        } else {
          try {
            await signInQuickPhone(name, phone, city);
            setInfo('تم إنشاء حسابك السريع. أضف كلمة مرور في المرة القادمة لحفظ الحساب على أي جهاز.');
          } catch (err) {
            const code = String((err as { code?: string })?.code ?? '');
            if (code.includes('operation-not-allowed')) {
              throw new Error(
                '«الدخول السريع» غير مفعّل في مشروع Firebase (مزوّد Anonymous). اكتب كلمة مرور من 6 أحرف وسننشئ لك حساباً دائماً بنفس الرقم — أو فعّل Anonymous من لوحة Firebase.',
              );
            }
            throw err;
          }
        }
      } else {
        if (name.trim().length < 2) throw new Error('اكتب اسمك (حرفان على الأقل).');
        if (!isValidWhatsApp(phone)) throw new Error('رقم الواتساب غير صحيح. مثال: 0912345678 أو 218912345678');
        await signUpWithEmail(email, password, name, phone, city);
        setInfo('تم إنشاء حسابك. يمكنك الآن توثيق رقم واتساب من صفحتك الشخصية.');
      }
      onSuccess?.();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-7 shadow-2xl relative my-6">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-slate-900 mb-1">
          {mode === 'login' ? 'تسجيل الدخول' : mode === 'quick' ? 'دخول سريع برقم الواتساب' : 'إنشاء حساب جديد'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {mode === 'quick'
            ? 'بدون بريد ولا كلمة مرور: اكتب اسمك ورقمك وابدأ النشر فوراً، ثم وثّق رقمك عبر واتساب.'
            : 'حسابك يمنحك صفحة شخصية تعرض إعلاناتك، وتمكّنك من تعديلها أو حذفها في أي وقت.'}
        </p>

        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4 text-[11px] font-bold">
          {([['login', 'دخول'], ['signup', 'حساب جديد'], ['quick', 'دخول سريع 📱']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => { setMode(value); setError(null); setInfo(null); }}
              className={`py-2 rounded-lg transition-colors ${mode === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => run(async () => { await signInWithGoogle(); onSuccess?.(); onClose(); })}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-sm mb-4"
        >
          <Chrome className="w-4 h-4" />
          <span>المتابعة بحساب جوجل</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
          <span className="flex-1 h-px bg-slate-200" />
          <span>أو بالبريد الإلكتروني</span>
          <span className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode !== 'login' && (
            <>
              <Field icon={<User className="w-4 h-4" />} label="الاسم الكامل">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="مثال: محمد علي"
                  className="w-full pr-9 pl-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </Field>
              <Field icon={<Phone className="w-4 h-4" />} label="رقم الواتساب (ليبي أو دولي)">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  inputMode="tel" dir="ltr"
                  placeholder="0912345678"
                  className="w-full pr-9 pl-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </Field>
              <Field icon={<MapPin className="w-4 h-4" />} label="المدينة">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {['طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'زليتن', 'البيضاء', 'سبها', 'درنة', 'طبرق', 'غريان'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              {mode === 'quick' && (
                <Field icon={<Lock className="w-4 h-4" />} label="كلمة المرور (اختيارية، لكنها تحفظ حسابك على أي جهاز)">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="w-full pr-9 pl-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </Field>
              )}
            </>
          )}

          {mode !== 'quick' && (<>
          <Field icon={<Mail className="w-4 h-4" />} label="البريد الإلكتروني">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full pr-9 pl-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </Field>

          <Field icon={<Lock className="w-4 h-4" />} label="كلمة المرور">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="6 أحرف على الأقل"
              className="w-full pr-9 pl-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </Field>

          </>)}
          {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
          {info && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className={`w-full text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 ${
              busy ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{mode === 'login' ? 'دخول' : mode === 'quick' ? 'ابدأ الآن' : 'إنشاء الحساب'}</span>
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 text-xs font-bold">
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="text-blue-600 hover:underline">
            {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب؟ سجّل الدخول'}
          </button>
          {mode === 'login' && (
            <button
              onClick={() => run(async () => {
                if (!email) throw new Error('اكتب بريدك أولاً.');
                await resetPassword(email);
                setInfo('أرسلنا رابط استعادة كلمة المرور إلى بريدك.');
              })}
              className="text-slate-500 hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          )}
        </div>

        {/* خيارات متقدمة (مطوية لتبسيط الدخول) */}
        <details className="mt-5 pt-4 border-t border-slate-200">
          <summary className="cursor-pointer text-[11px] font-bold text-slate-500 hover:text-slate-700">
            خيارات متقدمة: توثيق رقم الواتساب أو الدخول برمز SMS
          </summary>
        <div className="mt-3">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>توثيق رقم الواتساب</span>
          </h4>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            الرقم الموثّق يمنح إعلاناتك شارة ثقة ويمنع انتحال رقمك. التوثيق المجاني: ننشئ لك كوداً وترسله
            إلى واتساب الإدارة ليُفعَّل حسابك.
          </p>

          {profile ? (
            profile.phoneStatus === 'verified' ? (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                رقمك موثّق ✔ (<span dir="ltr" className="inline-block">{displayLocal(profile.phone ?? '')}</span>)
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel" dir="ltr"
                    placeholder="0912345678"
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <button
                    onClick={() => run(async () => {
                      if (!isValidWhatsApp(phone)) throw new Error('رقم الواتساب غير صحيح.');
                      const res = await requestWhatsAppVerification(phone);
                      setWaCode(res.code);
                      setWaLink(res.link);
                      setInfo('أرسل الكود إلى واتساب الإدارة بالضغط على الزر الأخضر.');
                    })}
                    disabled={busy}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl text-xs whitespace-nowrap"
                  >
                    احصل على كود
                  </button>
                </div>
                {waCode && waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال الكود {waCode} على واتساب الإدارة</span>
                  </a>
                )}
                {profile.phoneStatus === 'pending' && !waCode && (
                  <p className="text-[11px] text-amber-700">طلبك قيد المراجعة — سنفعّل رقمك بعد التأكد.</p>
                )}
              </div>
            )
          ) : (
            <p className="text-[11px] text-slate-500">سجّل الدخول أولاً لتوثيق رقمك.</p>
          )}

          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-600">أو برمز SMS مباشر:</p>
            {!phoneOtpEnabled && (
              <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 leading-relaxed">
                رمز SMS معطّل في هذا المشروع حالياً لأنه يحتاج ترقية Firebase إلى خطة Blaze (الرسائل مدفوعة).
                استخدم «توثيق واتساب» المجاني أعلاه، أو فعّل الخدمة ثم اضبط <code>VITE_ENABLE_PHONE_OTP=true</code>.
              </p>
            )}
            <div id="recaptcha-container" />
              {!otpSent ? (
                <button
                  onClick={() => run(async () => {
                    if (!isValidWhatsApp(phone)) throw new Error('رقم الهاتف غير صحيح.');
                    await startPhoneVerification(phone, 'recaptcha-container');
                    setOtpSent(true);
                    setInfo('أرسلنا رمزاً برسالة نصية. اكتبه أدناه.');
                  })}
                  disabled={busy || !phoneOtpEnabled}
                  className="w-full border border-slate-300 hover:bg-slate-50 font-bold py-2.5 rounded-xl text-xs disabled:opacity-50"
                >
                  إرسال رمز SMS
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    inputMode="numeric"
                    placeholder="123456"
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    onClick={() => run(async () => {
                      await confirmPhoneCode(otpCode);
                      setInfo('تم توثيق رقمك ✔');
                      setOtpSent(false);
                    })}
                    disabled={busy}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl text-xs"
                  >
                    تأكيد
                  </button>
                </div>
              )}
          </div>
        </div>
        </details>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
