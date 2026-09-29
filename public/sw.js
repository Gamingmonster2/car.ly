/**
 * Service Worker — يجعل الموقع تطبيقاً يعمل بلا إنترنت ويفتح فوراً في الزيارات التالية.
 *
 * السياسة:
 *  - التنقل (فتح الصفحات): شبكة أولاً، وإن فشلت نعرض نسخة الصفحة المحفوظة.
 *  - الملفات الثابتة (JS/CSS/الصور/الأيقونات): من الكاش أولاً ثم الشبكة.
 *  - لا نتدخل أبداً في طلبات Firebase أو أي نطاق خارجي (لا كاش لبيانات الإعلانات).
 */
const CACHE_NAME = 'cars-ly-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.webmanifest',
  './car-placeholder.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // نتجاهل أي طلب خارج موقعنا (Firebase، واتساب، خطوط خارجية...)
  if (url.origin !== self.location.origin) return;

  // فتح الموقع: شبكة أولاً مع نسخة محفوظة عند انقطاع الإنترنت
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./'))),
    );
    return;
  }

  // بقية الملفات: كاش أولاً لتسريع الفتح على شبكات الموبايل
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match('./car-placeholder.svg'));
    }),
  );
});
