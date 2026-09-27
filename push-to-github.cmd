@echo off
chcp 65001 >nul
title رفع مشروع CARS.COM.LY إلى GitHub
cd /d "%~dp0"

echo.
echo ==========================================================
echo   رفع مشروع سوق السيارات الليبي (cars.com.ly)
echo ==========================================================
echo.
echo   هذا ملف مساعد فقط.
echo   الطريقة الأسهل: افتح GitHub Desktop ثم:
echo     File -^> Add local repository -^> اختر هذا المجلد
echo     ثم اضغط Publish repository (أول مرة) أو Push origin.
echo.
echo   المجلد الحالي: %CD%
echo.
echo ----------------------------------------------------------
echo   إن أردت الرفع من سطر الأوامر مباشرة:
echo ----------------------------------------------------------
echo.

git remote -v

echo.
echo   جاري الرفع إلى الفرع main ... (إن طلب تسجيل دخول ستُفتح نافذة متصفح)
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
  echo ==========================================================
  echo   تم الرفع بنجاح
  echo ==========================================================
  echo.
  echo   الخطوة التالية - تفعيل الموقع:
  echo   Settings  -^>  Pages  -^>  Source: GitHub Actions
  echo.
  echo   ثم راقب النشر من تبويب Actions داخل المستودع.
) else (
  echo ==========================================================
  echo   فشل الرفع - راجع الرسالة أعلاه
  echo ==========================================================
  echo.
  echo   تحقق من:
  echo     1^) أن المستودع أُنشئ على GitHub.
  echo     2^) الأمر:  git remote -v   يجب أن يظهر رابط المستودع.
  echo     3^) لتغيير الرابط:  git remote set-url origin ^<رابط المستودع^>
)
echo.
pause
