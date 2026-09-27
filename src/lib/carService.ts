import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { Car } from '../types';

const CARS_COLLECTION = 'cars';

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
      const snapshot = await getDocs(collection(db, CARS_COLLECTION));
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
