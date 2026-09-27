/** بيانات إعلان سيارة واحدة كما تُخزَّن في مجموعة cars في Firestore */
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string;
  /** الصورة الأساسية (Base64 مضغوطة أو مسار محلي) */
  image: string;
  /** معرض الصور (حتى 4 صور من كاميرا الهاتف) */
  images?: string[];
  whatsapp: string;
  phone?: string;
  city: string;
  description: string;
  createdAt?: number;
  /** معرّف صاحب الإعلان: أساس الملكية والتعديل والحذف */
  ownerId?: string;
  ownerName?: string;
  views?: number;
}

export type PhoneStatus = 'none' | 'pending' | 'verified';

/** ملف المستخدم في مجموعة users — يجب أن يحتوي uid و displayName دائماً (شرط قواعد Firestore) */
export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  phone?: string;
  city?: string;
  createdAt: number;
  updatedAt?: number;
  /** إيموجي لتمييز الحساب (لا يحتاج أي تخزين) */
  avatarEmoji?: string;
  /** صورة شخصية صغيرة مضغوطة Base64 */
  avatarImage?: string;
  phoneVerified?: boolean;
  phoneStatus?: PhoneStatus;
  /** كود توثيق واتساب المُرسل لإدارة الموقع */
  waCode?: string;
}
