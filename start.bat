@echo off
title Cars Libya - تشغيل المنصة
echo ==============================================
echo       تشغيل سوق السيارات الليبي CARS.COM.LY
echo ==============================================
echo.
echo جاري فحص وتثبيت المكتبات (npm install)...
call npm install
echo.
echo جاري تشغيل خادم التطوير (npm run dev)...
echo سيتم فتح المتصفح على الرابط المحلي: http://localhost:3000
start http://localhost:3000
call npm run dev
pause
