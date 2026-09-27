# CARS.COM.LY — سوق السيارات الليبي

[![Deploy to GitHub Pages](https://github.com/Gamingmonster2/car.ly/actions/workflows/deploy.yml/badge.svg)](https://github.com/Gamingmonster2/car.ly/actions/workflows/deploy.yml)

منصة لبيع وشراء السيارات في ليبيا (تواصل مباشر بدون وسيط) مبنية بـ **React 19 + TypeScript + Vite 6 + TailwindCSS 4 + Firebase Firestore**.

> **ملاحظة مهمة:** هذا المستودع نسخة نظيفة أُعيد بناؤها. المستودع القديم كان يحتوي مكوّنات فارغة
> مكتوبة بصيغة `export default function X() { ... }` (نقاط حرفية) وهذا هو سبب فشل البناء
> `ERROR: Unexpected "..."`، إضافة إلى ملف بيانات قديم `data.legacy.ts` وصفحة `preview.html`
> تشير إلى صور غير موجودة. كل ذلك أُزيل من هذه النسخة.

---

## 📤 رفع المشروع إلى GitHub

المستودع الهدف: **https://github.com/Gamingmonster2/car.ly** (فارغ وجاهز لاستقبال الملفات).
المجلد المحلي مُهيّأ كـ Git repository مع commit جاهز وربط `origin` بالمستودع، لذلك الطريقة الأسهل:

**باستخدام GitHub Desktop:**
1. افتح GitHub Desktop.
2. `File` ← `Add local repository` ← اختر مجلد المشروع هذا.
3. اضغط `Push origin` (وإن ظهر `Publish repository` أكمل الخطوات بنفس الاسم `car.ly`).
4. بعد انتهاء الرفع: `Settings` ← `Pages` ← `Source: GitHub Actions`.
5. راقب العملية من تبويب `Actions`، وبعد نجاحها يصبح الموقع على:
   `https://gamingmonster2.github.io/car.ly/`

**باستخدام سطر الأوامر:** اضغط مرتين على `push-to-github.cmd`.

> ملاحظة: ملف `CNAME` للنطاق `cars.com.ly` **غير موجود** عن قصد في هذه النسخة، حتى لا يتعارض
> النطاق الجديد مع الموقع الحالي أثناء التجربة. أضفه في الخطوة الأخيرة فقط بعد التأكد.

---

## 🚀 التشغيل المحلي

```bash
npm install      # تثبيت الحزم
npm run dev      # تشغيل خادم التطوير على http://localhost:3000
npm run build    # بناء نسخة الإنتاج في مجلد dist
npm run preview  # معاينة نسخة الإنتاج محلياً
npm run lint     # فحص أنواع TypeScript (tsc --noEmit)
```

على ويندوز يمكنك ببساطة الضغط مرتين على ملف `start.bat`.

---

## 🗂️ هيكل المشروع

```
├── index.html                 صفحة HTML الأساسية (RTL + رسالة مساعدة عند الفتح بدون خادم)
├── public/
│   ├── favicon.svg            أيقونة الموقع
│   ├── car-placeholder.svg    الصورة البديلة عند غياب صورة الإعلان
│   └── robots.txt
├── src/
│   ├── main.tsx               نقطة دخول React
│   ├── App.tsx                الواجهة الكاملة (هيدر + بحث + شبكة الإعلانات + نموذج النشر)
│   ├── data.ts                إعلانات توضيحية تُعرض فقط عند غياب بيانات حقيقية
│   ├── types.ts               نوع بيانات الإعلان
│   ├── index.css              استيراد TailwindCSS
│   └── lib/
│       ├── firebase.ts        تهيئة Firebase (تقبل القيم من ملف .env)
│       └── carService.ts      قراءة/إضافة الإعلانات في Firestore
├── firestore.rules            قواعد أمان Firestore (جاهزة للتطبيق)
├── firebase-blueprint.json    مخطط بيانات المشروع
├── firebase-applet-config.json إعدادات المشروع كما صُدّرت من Google AI Studio
├── .github/workflows/deploy.yml  نشر تلقائي على GitHub Pages
└── .env.example              قالب متغيرات البيئة
```

---

## 🔐 إعداد Firebase

1. أنشئ مشروع Firebase جديداً (الاسم المقترح `cars-libya-prod`) — **لا تستخدم** المشروع الحالي
   `hotel-project-485811` لأنه مشروع مُعاد استخدامه وقاعدة بياناته غير موجودة.
2. أنشئ قاعدة بيانات Firestore.
3. **قبل** إنشاء القاعدة أو بعدها فوراً، طبّق القواعد الموجودة في `firestore.rules`
   (قراءة عامة للإعلانات، والكتابة محصورة بمالك الإعلان عبر `ownerId`).
4. انسخ `.env.example` إلى `.env` وضع فيه مفاتيح مشروعك الجديد، أو عدّل القيم الافتراضية
   داخل `src/lib/firebase.ts` مباشرة.

> مفاتيح ويب Firebase ليست أسراراً بطبيعتها، لكن يجب تقييدها في Google Cloud Console
> (HTTP referrer + API restrictions)، وعدم تشغيل قاعدة بيانات بقواعد مفتوحة.

---

## 🌐 النشر على GitHub Pages

المستودع مُجهَّز بمسار عمل تلقائي: عند كل رفع (push) إلى فرع `main` يتم تثبيت الحزم،
ثم فحص الأنواع، ثم البناء، ثم نشر مجلد `dist` على GitHub Pages.

لتفعيله: `Settings → Pages → Source: GitHub Actions`.

**النطاق المخصص `cars.com.ly`:** لا تضع ملف `CNAME` في هذا المستودع قبل التأكد من جاهزية النسخة،
لأن ربط نطاق جديد بمستودع ثانٍ أثناء عمل الموقع الحالي قد يقطع الخدمة. الطريقة الصحيحة:
اختبار النسخة على رابط `*.github.io` أولاً، ثم نقل النطاق بعد التأكد.

---

## ✅ ما تم إصلاحه في هذه النسخة

| # | المشكلة | الحالة |
|---|---------|--------|
| 1 | `CodeExplorer.tsx` يحتوي `{ ... }` حرفياً ويُفشل البناء | حُذف |
| 2 | مكوّنات فارغة (`Header`, `CarCard`, `CarForm`, `AuthModal`, `CarDetailPage`) بعد إعادة هيكلة غير مكتملة | أُعيدت الواجهة الموحّدة العاملة في `App.tsx` |
| 3 | `App.tsx` كان مقطوعاً ويعرض مكوّن `CodeExplorer` فقط | أُعيد كامل الواجهة (هيدر، بحث، شبكة، نموذج نشر، واتساب) |
| 4 | ملفات مفقودة `src/lib/slugHelper.ts` و`src/lib/parseAdText.ts` تُستورد ولا وجود لها | لا استيرادات معلّقة |
| 5 | بيانات قديمة `data.legacy.ts` بصور Unsplash وهمية | حُذف |
| 6 | `preview.html` القديمة تشير إلى `public/images/cars/*.jpg` غير الموجودة (صور مكسورة) | حُذف |
| 7 | إعلانان وهميان مدمجان دائماً داخل الكود ويظهران للأبد | أُزيلا، والبيانات التوضيحية تُعرض فقط عند غياب بيانات حقيقية ومع تنبيه واضح |
| 8 | رسالة نجاح كاذبة عند فشل الحفظ في قاعدة البيانات | صارت رسالة صريحة: «حُفظ على جهازك فقط ولم يُنشر للزوار» |
| 9 | طلب `orderBy` على حقل ناقص يُخفي إعلانات | الترتيب يتم على العميل |
| 10 | لا `favicon` ولا صورة بديلة للصور المعطوبة | أُضيفا في `public/` |
| 11 | حزمة واحدة كبيرة بلا تقسيم | تقسيم `firebase` و`react` إلى ملفات منفصلة |
| 12 | مسار العمل ينشر بلا فحص أنواع وبدون `npm ci` | حُدِّث `deploy.yml` |

---

## 🔭 الخطوات التالية المقترحة

1. إنشاء مشروع Firebase مخصص + تطبيق `firestore.rules` (الأساس الذي بدونه لا نشر حقيقي).
2. رفع الصور إلى **Firebase Storage** بدل تخزين Base64 داخل مستند Firestore (حد 1MB).
3. تسجيل دخول + حقل `ownerId` + لوحة «إعلاناتي» + لوحة إدارة.
4. صفحة مستقلة لكل إعلان `/car/:slug` + وسوم Schema.org + `sitemap.xml` + `og:image`.
5. فلاتر حقيقية (سعر، سنة، ماركة، ممشى) وترتيب وترقيم صفحات.
6. بعد استقرار الأساس: دمج Gemini للبحث بالعربية الطبيعية وتوليد وصف الإعلان.

---

© سوق سيارات ليبيا — cars.com.ly
