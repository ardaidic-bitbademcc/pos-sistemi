@echo off
chcp 65001 >nul
echo.
echo ================================
echo  GEREKSINIMLER KONTROL EDILIYOR
echo ================================
echo.

echo [1/3] Node.js kontrol ediliyor...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js BULUNAMADI!
    echo.
    echo 📥 Lütfen Node.js'i indirin:
    echo https://nodejs.org/
    echo.
    echo Önerilen: LTS versiyonu (v20.x veya üzeri)
    set MISSING=1
) else (
    node --version
    echo ✅ Node.js bulundu
)

echo.
echo [2/3] npm kontrol ediliyor...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm BULUNAMADI!
    set MISSING=1
) else (
    npm --version
    echo ✅ npm bulundu
)

echo.
echo [3/3] Git kontrol ediliyor...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Git BULUNAMADI (opsiyonel)
    echo.
    echo Git olmadan da build yapabilirsiniz.
) else (
    git --version
    echo ✅ Git bulundu
)

echo.
echo ================================

if defined MISSING (
    echo.
    echo ❌ EKSIK GEREKSINIMLER VAR!
    echo.
    echo Lütfen eksik programları yükleyip bilgisayarı yeniden başlatın.
    echo Sonra tekrar build-installer.bat çalıştırın.
    echo.
) else (
    echo.
    echo ✅ TÜM GEREKSINIMLER MEVCUT!
    echo.
    echo Artık build-installer.bat'ı çalıştırabilirsiniz.
    echo.
)

pause
