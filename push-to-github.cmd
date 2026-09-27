@echo off
chcp 65001 >nul
title رفع مشروع CARS.COM.LY إلى GitHub
cd /d "%~dp0"

echo.
echo ==========================================================
echo   رفع سوق السيارات الليبي - cars.com.ly
echo ==========================================================
echo.
echo   الطريقة الافضل: GitHub Desktop
echo     File - Add local repository - اختر هذا المجلد
echo     ثم اضغط Push origin
echo.
echo   وهذا الملف بديل يعمل مباشرة من سطر الاوامر.
echo   المجلد: %CD%
echo.

git remote -v

echo.
echo ----------------------------------------------------------
echo   [1/2] محاولة الرفع العادية...
echo ----------------------------------------------------------
echo.

git push -u origin main
if %ERRORLEVEL% EQU 0 goto success

echo.
echo ----------------------------------------------------------
echo   تم رفض الرفع.
echo   السبب الشائع: المستودع البعيد انشئ بملف README في تاريخ
echo   غير مرتبط بتاريخ مشروعك، لذلك يرفض Git الدمج.
echo.
echo   الحل: رفع قسري يستبدل ذلك الملف الفارغ بمشروعك الكامل
echo   (آمن هنا لان المستودع البعيد لا يحتوي مشروعا حقيقيا).
echo ----------------------------------------------------------
echo.
set /p answer="اكتب y ثم Enter للمتابعة بالرفع القسري: "
if /i not "%answer%"=="y" goto failed

echo.
echo ----------------------------------------------------------
echo   [2/2] رفع قسري...
echo ----------------------------------------------------------
git push --force -u origin main
if %ERRORLEVEL% EQU 0 goto success
goto failed

:success
echo.
echo ----------------------------------------------------------
echo   رفع الوسوم (Tags) إن وجدت...
echo ----------------------------------------------------------
git push origin --tags
echo.
echo ==========================================================
echo   تم الرفع بنجاح
echo ==========================================================
echo.
echo   الخطوة التالية:
echo     GitHub - Settings - Pages - Source: GitHub Actions
echo.
echo   ورابط الموقع بعد دقيقة تقريبا:
echo     https://gamingmonster2.github.io/car.ly/
echo.
echo   لانشاء نسخة موثقة (Tag) مثل v2.0:
echo     GitHub - Releases - Draft a new release - Tag: v2.0
echo.
pause
exit /b 0

:failed
echo.
echo ==========================================================
echo   فشل الرفع - راجع الرسالة أعلاه
echo ==========================================================
echo.
echo   1) تاكد انك سجلت الدخول في GitHub Desktop اولا.
echo   2) تاكد من رابط المستودع: git remote -v
echo   3) لتغيير الرابط: git remote set-url origin رابط-المستودع
echo.
pause
exit /b 1
