/** بيانات إعلان سيارة واحدة كما تُخزَّن في مجموعة cars في Firestore */
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string;
  image: string;
  whatsapp: string;
  city: string;
  description: string;
  /** رقم الهاتف المحلي (اختياري) */
  phone?: string;
  /** طابع زمني بالمللي ثانية، يُستخدم للترتيب */
  createdAt?: number;
  /** معرّف صاحب الإعلان (يُستعمل عند تفعيل تسجيل الدخول) */
  ownerId?: string;
  ownerName?: string;
  views?: number;
}
