@echo off
chcp 65001 >nul
title نشر نسخة جاهزة داخل مجلد docs (مسار بديل لا يحتاج GitHub Actions)
cd /d "%~dp0"

echo.
echo ==========================================================
echo   بناء الموقع ونسخه إلى مجلد docs
echo ==========================================================
echo.
echo   استخدم هذا الملف فقط إذا لم يعمل النشر التلقائي
echo   (GitHub Actions) وظهرت صفحة بيضاء أو خطأ main.tsx.
echo.
echo   الفكرة: نضع النسخة المبنية داخل المجلد docs ثم تختار
echo   في GitHub:  Settings - Pages - Source: Deploy from a branch
echo               Branch: main   Folder: /docs
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [خطأ] لم يتم العثور على npm. ثبّت Node.js اولا من nodejs.org
  pause
  exit /b 1
)

echo ----------------------------------------------------------
echo   [1/3] تثبيت الحزم إن لزم...
echo ----------------------------------------------------------
if not exist node_modules (
  call npm install
)

echo.
echo ----------------------------------------------------------
echo   [2/3] بناء نسخة الإنتاج...
echo ----------------------------------------------------------
call npm run build
if errorlevel 1 (
  echo [خطأ] فشل البناء. راجع الرسالة اعلاه.
  pause
  exit /b 1
)

echo.
echo ----------------------------------------------------------
echo   [3/3] نسخ النسخة المبنية إلى مجلد docs ...
echo ----------------------------------------------------------
if exist docs rmdir /s /q docs
mkdir docs
xcopy /e /i /y /q dist\* docs\ >nul
if errorlevel 1 (
  echo [خطأ] تعذّر النسخ إلى مجلد docs.
  pause
  exit /b 1
)
echo اضافة ملف .nojekyll لمنع معالجة الملفات على GitHub Pages
type nul > docs\.nojekyll
echo تم النسخ بنجاح.

echo.
echo ==========================================================
echo   انتهى - الخطوة التالية:
echo ==========================================================
echo.
echo   1) افتح GitHub Desktop ثم اضغط Commit to main ثم Push origin
echo   2) في GitHub: Settings - Pages
echo        Source:        Deploy from a branch
echo        Branch:        main
echo        Folder:        /docs
echo      ثم Save
echo.
echo   بعد دقيقة تقريبا سيعمل الموقع بشكل صحيح.
echo.
pause
