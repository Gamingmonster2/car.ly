import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

/**
 * إعدادات Firebase.
 * القيم الافتراضية هي نفس المشروع المستخدم سابقاً، ويمكن تجاوزها بملف ‎.env‎
 * (انسخ ‎.env.example‎ إلى ‎.env‎ وعدّل القيم) دون لمس الكود.
 *
 * ملاحظة أمنية: مفاتيح ويب Firebase ليست أسراراً، لكن يجب تقييدها في Google Cloud Console
 * (HTTP referrer + API restrictions) وحماية قاعدة البيانات بملف firestore.rules.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAZqYQwWRnQNkWwS6qPUBdkrexNhnURjgk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'hotel-project-485811.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'hotel-project-485811',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'hotel-project-485811.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '693691274781',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:693691274781:web:cc15f62ad313d881bad8f4',
};

/** اسم قاعدة بيانات Firestore المُسمّاة في هذا المشروع (وليست قاعدة (default)) */
const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ??
  'ai-studio-carslibya-f8cf7d50-bd16-44a3-8284-47deae4aef16';

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const db = initializeFirestore(
  app,
  { experimentalAutoDetectLongPolling: true },
  firestoreDatabaseId,
);
