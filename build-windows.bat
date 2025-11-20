@echo off
echo ========================================
echo Spark POS Desktop - Windows Build
echo ========================================
echo.

REM Node.js kontrolü
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Node.js bulunamadi!
    echo Lutfen https://nodejs.org adresinden Node.js yukleyin.
    pause
    exit /b 1
)

echo [OK] Node.js bulundu: 
node --version
echo.

REM Git kontrolü
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Git bulunamadi. Repository guncellemesi yapilamaz.
) else (
    echo [OK] Git bulundu:
    git --version
    echo.
)

echo ========================================
echo Adim 1: Bagimliliklari Yukle
echo ========================================
echo.

if exist node_modules (
    echo node_modules klasoru bulundu, guncelleniyor...
    call npm install
) else (
    echo node_modules klasoru bulunamadi, yukleniyor...
    call npm install
)

if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Bagimliliklari yuklerken hata olustu!
    pause
    exit /b 1
)

echo.
echo [OK] Bagimliliklari yuklendi
echo.

echo ========================================
echo Adim 2: Production Build Olustur
echo ========================================
echo.

echo React uygulamasi build ediliyor...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [HATA] React build hatasi!
    pause
    exit /b 1
)

echo [OK] React build tamamlandi
echo.

echo ========================================
echo Adim 3: Electron Paketleme
echo ========================================
echo.

echo Windows installer olusturuluyor...
call npm run electron:build:win

if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Electron build hatasi!
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD TAMAMLANDI!
echo ========================================
echo.
echo Dosyalar asagidaki konumda olusturuldu:
echo.
echo 1. Tasinabilir versiyon:
echo    dist-electron\win-unpacked\Spark POS Desktop.exe
echo.
echo 2. Installer:
echo    dist-electron\Spark POS Desktop Setup 0.0.0.exe
echo.
echo ========================================
echo Sonraki Adimlar:
echo ========================================
echo.
echo [TASINABILIR] USB bellege dist-electron\win-unpacked klasorunu kopyalayin
echo [INSTALLER] Setup.exe dosyasini diger bilgisayarlara dagiitin
echo.

REM dist-electron klasörünü aç
if exist dist-electron (
    echo Dosya gezgini aciliyor...
    explorer dist-electron
)

echo.
pause
