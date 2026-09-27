#!/bin/bash
echo "=============================================="
echo "      تشغيل سوق السيارات الليبي CARS.COM.LY"
echo "=============================================="
echo ""
echo "جاري تثبيت الحزم (npm install)..."
npm install
echo ""
echo "جاري تشغيل خادم التطوير (npm run dev)..."
which xdg-open > /dev/null && xdg-open http://localhost:3000 || which open > /dev/null && open http://localhost:3000
npm run dev
