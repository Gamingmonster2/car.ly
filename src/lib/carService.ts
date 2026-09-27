import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Car } from '../types';

const CARS_COLLECTION = 'cars';

/** أقصى مدة انتظار لقاعدة البيانات قبل التحويل إلى وضع العرض التجريبي */
const LOAD_TIMEOUT_MS = 12000;

export interface LoadCarsResult {
  cars: Car[];
  /** true إذا نجح الاتصال بقاعدة البيانات، و false إذا فشل (قاعدة غير متاحة أو بلا إنترنت) */
  online: boolean;
}

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

/** يحوّل أي خطأ من Firebase إلى رسالة عربية واضحة للمستخدم */
export function describeFirestoreError(error: unknown): string {
  const code = String((error as { code?: string })?.code ?? '');
  if (code.includes('permission-denied')) {
    return 'ليس لديك صلاحية لهذا الإجراء. تأكد أنك مسجّل الدخول وأن الإعلان لك.';
  }
  if (code.includes('unavailable') || code.includes('network') || code.includes('offline')) {
    return 'تعذّر الاتصال بقاعدة البيانات. تحقّق من الإنترنت وحاول مرة أخرى.';
  }
  if (code.includes('deadline-exceeded')) {
    return 'انتهت مهلة الاتصال بقاعدة البيانات. حاول مرة أخرى.';
  }
  if (code.includes('not-found')) {
    return 'هذا الإعلان لم يعد موجوداً.';
  }
  if (code.includes('invalid-argument')) {
    return 'بيانات الإعلان غير صحيحة أو الصور أكبر من الحد المسموح.';
  }
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

function sortByDate(cars: Car[]): Car[] {
  return cars.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
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
      return { cars: sortByDate(cars), online: true };
    } catch (error) {
      console.error('تعذر قراءة الإعلانات من Firestore:', error);
      return { cars: [], online: false };
    }
  },

  /** إعلانات مستخدم واحد فقط (صفحة «إعلاناتي») */
  async getCarsByOwner(ownerId: string): Promise<LoadCarsResult> {
    try {
      const q = query(collection(db, CARS_COLLECTION), where('ownerId', '==', ownerId));
      const snapshot = await withTimeout(getDocs(q), LOAD_TIMEOUT_MS);
      const cars = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Omit<Car, 'id'>),
        id: docSnap.id,
      }));
      return { cars: sortByDate(cars), online: true };
    } catch (error) {
      console.error('تعذر قراءة إعلانات المستخدم:', error);
      return { cars: [], online: false };
    }
  },

  /** إضافة إعلان جديد. ترمي استثناءً عند الفشل ليعرض التطبيق الحقيقة للمستخدم. */
  async addCar(car: Omit<Car, 'id'>): Promise<string> {
    const docRef = await withTimeout(addDoc(collection(db, CARS_COLLECTION), car), LOAD_TIMEOUT_MS);
    return docRef.id;
  },

  /** تعديل إعلان (يسمح به Firestore لصاحب الإعلان فقط) */
  async updateCar(id: string, patch: Partial<Omit<Car, 'id'>>): Promise<void> {
    await withTimeout(setDoc(doc(db, CARS_COLLECTION, id), patch, { merge: true }), LOAD_TIMEOUT_MS);
  },

  /** حذف إعلان (يسمح به Firestore لصاحب الإعلان فقط) */
  async deleteCar(id: string): Promise<void> {
    await withTimeout(deleteDoc(doc(db, CARS_COLLECTION, id)), LOAD_TIMEOUT_MS);
  },
};
