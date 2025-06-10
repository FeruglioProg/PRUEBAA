@echo off
echo 🚀 Instalando Property Finder Argentina...
echo.

echo 📦 Borrando instalacion anterior...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .next rmdir /s /q .next

echo.
echo 📥 Instalando dependencias...
npm install

echo.
echo ✅ Instalacion completada!
echo.
echo 🎯 Para ejecutar:
echo npm run dev
echo.
pause
