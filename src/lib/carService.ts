import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { Car } from '../types';

const CARS_COLLECTION = 'cars';

/** أقصى مدة انتظار لقاعدة البيانات قبل التحويل إلى وضع العرض التجريبي */
const LOAD_TIMEOUT_MS = 12000;

/**
 * يضيف مهلة زمنية لأي وعد: إذا لم تُجب قاعدة البيانات خلال المدة المحددة
 * نعتبرها غير متاحة بدل أن تبقى الصفحة معلّقة إلى ما لا نهاية
 * (مهم جداً على شبكات الموبايل البطيئة في ليبيا).
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('انتهت مهلة الاتصال بقاعدة البيانات')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

export interface LoadCarsResult {
  cars: Car[];
  /** true إذا نجح الاتصال بقاعدة البيانات، و false إذا فشل (قاعدة غير متاحة أو بلا إنترنت) */
  online: boolean;
}

export const carService = {
  /**
   * قراءة كل الإعلانات. لا ترمي استثناءً أبداً، بل تعيد online=false
   * حتى تعرف الواجهة أنها في وضع العرض التجريبي بدل أن تنهار الصفحة.
   */
  async getAllCars(): Promise<LoadCarsResult> {
    try {
      // بلا orderBy في الاستعلام: الترتيب يتم على العميل، لأن Firestore
      // يستبعد أي مستند لا يحتوي الحقل المستخدم في orderBy.
      const snapshot = await withTimeout(getDocs(collection(db, CARS_COLLECTION)), LOAD_TIMEOUT_MS);
      const cars = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Omit<Car, 'id'>),
        id: docSnap.id,
      }));
      cars.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      return { cars, online: true };
    } catch (error) {
      console.error('تعذر قراءة الإعلانات من Firestore:', error);
      return { cars: [], online: false };
    }
  },

  /** إضافة إعلان جديد. ترمي استثناءً عند الفشل ليعرض التطبيق الحقيقة للمستخدم. */
  async addCar(car: Omit<Car, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, CARS_COLLECTION), car);
    return docRef.id;
  },
};
