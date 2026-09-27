import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile as updateAuthProfile,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ADMIN_WHATSAPP, PHONE_OTP_ENABLED, auth, db } from './firebase';
import { normalizeWhatsApp, waLink } from './phone';
import type { UserProfile } from '../types';

const USERS_COLLECTION = 'users';
const LOCAL_PROFILE_KEY = 'cars_libya_profile_v2';

export { PHONE_OTP_ENABLED, ADMIN_WHATSAPP };

/** رسائل عربية واضحة لأخطاء تسجيل الدخول */
export function describeAuthError(error: unknown): string {
  const code = String((error as { code?: string })?.code ?? '');
  if (code.includes('email-already-in-use')) return 'هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول.';
  if (code.includes('invalid-email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (code.includes('weak-password')) return 'كلمة المرور ضعيفة: استخدم 6 أحرف على الأقل.';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'البريد أو كلمة المرور غير صحيحة.';
  if (code.includes('user-not-found')) return 'لا يوجد حساب بهذا البريد. أنشئ حساباً جديداً.';
  if (code.includes('too-many-requests')) return 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.';
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'تم إلغاء نافذة الدخول بجوجل.';
  if (code.includes('popup-blocked')) return 'المتصفح منع نافذة الدخول بجوجل. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.';
  if (code.includes('network-request-failed')) return 'تعذّر الاتصال. تحقّق من الإنترنت.';
  if (code.includes('operation-not-allowed')) return 'طريقة الدخول هذه غير مفعّلة في مشروع Firebase (فعّلها من Authentication ← Sign-in method).';
  if (code.includes('unauthorized-domain')) {
    return 'هذا النطاق غير مصرّح به في مشروع Firebase. أضف نطاق موقعك في Authentication ← Settings ← Authorized domains.';
  }
  if (code.includes('billing-not-enabled')) return 'إرسال رمز SMS يحتاج ترقية مشروع Firebase إلى خطة Blaze. استخدم توثيق واتساب اليدوي حالياً.';
  if (code.includes('invalid-phone-number')) return 'رقم الهاتف غير صحيح. اكتبه بالصيغة الدولية مثل 218912345678.';
  if (code.includes('invalid-verification-code')) return 'رمز التحقق غير صحيح.';
  if (code.includes('code-expired')) return 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.';
  if (code.includes('invalid-app-credential') || code.includes('captcha-check-failed')) {
    return 'فشل التحقق الأمني (reCAPTCHA). أعد تحميل الصفحة وتأكد أن النطاق مضاف في النطاقات المصرّح بها.';
  }
  return code
    ? `حدث خطأ غير متوقع في تسجيل الدخول (${code}). حاول مرة أخرى.`
    : 'حدث خطأ غير متوقع في تسجيل الدخول. حاول مرة أخرى.';
}

/** يحذف القيم undefined لأن Firestore يرفضها */
function prune<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** هل رمز SMS مفعّل؟ (يحتاج خطة Blaze في Firebase) */
  phoneOtpEnabled: boolean;
  /** تسجيل حساب بالبريد: الاسم ورقم الواتساب مطلوبان لإنشاء الصفحة الشخصية */
  signUpWithEmail: (email: string, password: string, name: string, phone: string, city?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /**
   * دخول سريع بالهاتف: ينشئ حساب Firebase مجهول الهوية (Anonymous Auth) فيحصل المستخدم
   * على uid حقيقي يقبل به Firestore، ثم يوثّق رقمه عبر واتساب. لا يحتاج كلمة مرور.
   */
  signInQuickPhone: (name: string, phone: string, city?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** إرسال رمز SMS (يحتاج تفعيل الخطة المدفوعة) */
  startPhoneVerification: (phone: string, containerId: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  /** توثيق يدوي مجاني: يولّد كوداً ويرسل المستخدم إلى واتساب الإدارة */
  requestWhatsAppVerification: (phone: string) => Promise<{ code: string; link: string }>;
  /** إعادة قراءة الملف الشخصي (لمعرفة هل أكّدت الإدارة الرقم) */
  refreshProfile: () => Promise<void>;
  updateProfileFields: (patch: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  /** أحدث نسخة من الملف الشخصي، لتفادي الكتابة فوق بيانات المستخدم عند تسجيل الدخول السريع */
  const profileRef = useRef<UserProfile | null>(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const persistLocal = useCallback((next: UserProfile | null) => {
    try {
      if (next) localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
      else localStorage.removeItem(LOCAL_PROFILE_KEY);
    } catch {
      /* تجاهل */
    }
  }, []);

  const saveProfile = useCallback(
    async (next: Partial<UserProfile> & { uid: string }) => {
      const merged: UserProfile = {
        ...(profile ?? { uid: next.uid, displayName: 'مستخدم', createdAt: Date.now() }),
        ...next,
        uid: next.uid,
        displayName: (next.displayName ?? profile?.displayName ?? 'مستخدم').trim().slice(0, 100) || 'مستخدم',
        updatedAt: Date.now(),
      };
      setProfile(merged);
      persistLocal(merged);
      try {
        await setDoc(doc(db, USERS_COLLECTION, merged.uid), prune({ ...merged }), { merge: true });
      } catch (error) {
        console.error('تعذّر حفظ الملف الشخصي في Firestore:', error);
      }
      return merged;
    },
    [profile, persistLocal],
  );

  const loadProfile = useCallback(
    async (user: User) => {
      try {
        const snap = await getDoc(doc(db, USERS_COLLECTION, user.uid));
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          const merged: UserProfile = { ...data, uid: user.uid };
          setProfile(merged);
          persistLocal(merged);
          return;
        }
      } catch (error) {
        console.error('تعذّر قراءة الملف الشخصي:', error);
      }
      // إن كان لدينا ملف محلي لنفس المستخدم (مثل الدخول السريع) نعتمد بياناته ولا نستبدلها
      const local = profileRef.current;
      if (local && local.uid === user.uid) {
        setProfile(local);
        persistLocal(local);
        try {
          await setDoc(doc(db, USERS_COLLECTION, user.uid), prune({ ...local }), { merge: true });
        } catch (error) {
          console.error('تعذّر مزامنة الملف الشخصي:', error);
        }
        return;
      }
      // إن لم يوجد الملف (أو تعذّرت القراءة) ننشئ واحداً محلياً على الأقل
      const fallback: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
        email: user.email ?? undefined,
        phone: user.phoneNumber ? normalizeWhatsApp(user.phoneNumber) : undefined,
        city: 'طرابلس',
        avatarEmoji: '🚗',
        phoneStatus: 'none',
        createdAt: Date.now(),
      };
      setProfile(fallback);
      persistLocal(fallback);
      try {
        await setDoc(doc(db, USERS_COLLECTION, user.uid), prune({ ...fallback }), { merge: true });
      } catch (error) {
        console.error('تعذّر إنشاء الملف الشخصي:', error);
      }
    },
    [persistLocal],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user);
      } else {
        setProfile(null);
        persistLocal(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadProfile, persistLocal]);

  const signUpWithEmail = async (email: string, password: string, name: string, phone: string, city?: string) => {
    const cleanName = name.trim();
    const normalizedPhone = normalizeWhatsApp(phone);
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    try {
      await updateAuthProfile(credential.user, { displayName: cleanName });
    } catch {
      /* غير حرج */
    }
    await saveProfile({
      uid: credential.user.uid,
      displayName: cleanName,
      email: email.trim(),
      phone: normalizedPhone,
      city: city || 'طرابلس',
      avatarEmoji: '🚗',
      phoneStatus: 'none',
      phoneVerified: false,
      createdAt: Date.now(),
    });
    try {
      await sendEmailVerification(credential.user);
    } catch {
      /* قد يكون إرسال البريد غير مفعّل — نتجاهل */
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const signInQuickPhone = async (name: string, phone: string, city?: string) => {
    const cleanName = name.trim();
    const normalizedPhone = normalizeWhatsApp(phone);
    const credential = await signInAnonymously(auth);
    try {
      await updateAuthProfile(credential.user, { displayName: cleanName });
    } catch {
      /* غير حرج */
    }
    await saveProfile({
      uid: credential.user.uid,
      displayName: cleanName,
      phone: normalizedPhone,
      city: city || 'طرابلس',
      avatarEmoji: '🚗',
      phoneStatus: 'pending',
      phoneVerified: false,
      createdAt: Date.now(),
    });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const startPhoneVerification = async (phone: string, containerId: string) => {
    if (!PHONE_OTP_ENABLED) {
      throw new Error(
        'إرسال رمز SMS غير مفعّل حالياً في هذا المشروع (يحتاج ترقية Firebase إلى خطة Blaze). استخدم «توثيق واتساب» المجاني.',
      );
    }
    const normalized = normalizeWhatsApp(phone);
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    }
    const result = await signInWithPhoneNumber(auth, '+' + normalized, verifierRef.current);
    confirmationRef.current = result;
  };

  const confirmPhoneCode = async (code: string) => {
    if (!confirmationRef.current) throw new Error('اطلب رمز التحقق أولاً.');
    const credential = await confirmationRef.current.confirm(code.trim());
    const normalized = normalizeWhatsApp(credential.user.phoneNumber ?? '');
    await saveProfile({
      uid: credential.user.uid,
      phone: normalized,
      phoneVerified: true,
      phoneStatus: 'verified',
    });
  };

  const requestWhatsAppVerification = async (phone: string) => {
    const normalized = normalizeWhatsApp(phone);
    const code = randomCode();
    const uid = firebaseUser?.uid ?? profile?.uid;
    if (!uid) throw new Error('سجّل الدخول أولاً ثم وثّق رقمك.');
    await saveProfile({ uid, phone: normalized, waCode: code, phoneStatus: 'pending', phoneVerified: false });
    const link = waLink(
      ADMIN_WHATSAPP,
      `طلب توثيق حساب في موقع cars.com.ly\nالاسم: ${profile?.displayName ?? ''}\nرقم الهاتف: ${normalized}\nكود التوثيق: ${code}`,
    );
    return { code, link };
  };

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await loadProfile(firebaseUser);
  }, [firebaseUser, loadProfile]);

  const updateProfileFields = async (patch: Partial<UserProfile>) => {
    const uid = firebaseUser?.uid ?? profile?.uid;
    if (!uid) throw new Error('يجب تسجيل الدخول أولاً.');
    await saveProfile({ ...patch, uid });
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      /* تجاهل */
    }
    try {
      verifierRef.current?.clear();
    } catch {
      /* تجاهل */
    }
    verifierRef.current = null;
    confirmationRef.current = null;
    setProfile(null);
    persistLocal(null);
  };

  const value: AuthContextValue = {
    firebaseUser,
    profile,
    loading,
    phoneOtpEnabled: PHONE_OTP_ENABLED,
    signUpWithEmail,
    signInWithEmail,
    signInQuickPhone,
    signInWithGoogle,
    resetPassword,
    startPhoneVerification,
    confirmPhoneCode,
    requestWhatsAppVerification,
    refreshProfile,
    updateProfileFields,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
