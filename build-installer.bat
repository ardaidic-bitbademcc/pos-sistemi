@echo off
setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     SPARK POS DESKTOP - WINDOWS INSTALLER BUILDER        ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Renkli output için
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Node.js kontrolü
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[HATA]%NC% Node.js bulunamadi!
    echo.
    echo Lutfen https://nodejs.org adresinden Node.js yukleyin.
    echo Minimum gereksinim: Node.js 18+
    echo.
    pause
    exit /b 1
)

echo %GREEN%[OK]%NC% Node.js bulundu
node --version
echo.

REM npm kontrolü
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[HATA]%NC% npm bulunamadi!
    pause
    exit /b 1
)

echo %GREEN%[OK]%NC% npm bulundu
npm --version
echo.

REM Git kontrolü (opsiyonel)
where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%NC% Git bulundu
    git --version
    echo.
) else (
    echo %YELLOW%[UYARI]%NC% Git bulunamadi (opsiyonel)
    echo.
)

echo ═══════════════════════════════════════════════════════════
echo   ADIM 1/5: Bagimliliklari Kontrol Et
echo ═══════════════════════════════════════════════════════════
echo.

if not exist node_modules (
    echo %YELLOW%[BILGI]%NC% node_modules klasoru bulunamadi
    echo Bagimliliklari yukleniyor...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo %RED%[HATA]%NC% Bagimliliklari yuklerken hata olustu!
        pause
        exit /b 1
    )
    echo.
    echo %GREEN%[OK]%NC% Bagimliliklari yuklendi
) else (
    echo %GREEN%[OK]%NC% node_modules mevcut
    echo Bagimliliklari guncelleniyor...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo %RED%[HATA]%NC% Bagimliliklari guncellerken hata olustu!
        pause
        exit /b 1
    )
)

echo.
echo ═══════════════════════════════════════════════════════════
echo   ADIM 2/5: Onceki Build Dosyalarini Temizle
echo ═══════════════════════════════════════════════════════════
echo.

if exist dist (
    echo %YELLOW%[TEMIZLIK]%NC% dist klasoru siliniyor...
    rmdir /s /q dist
)

if exist dist-electron (
    echo %YELLOW%[TEMIZLIK]%NC% dist-electron klasoru siliniyor...
    rmdir /s /q dist-electron
)

echo %GREEN%[OK]%NC% Temizlik tamamlandi
echo.

echo ═══════════════════════════════════════════════════════════
echo   ADIM 3/5: React Uygulamasini Build Et
echo ═══════════════════════════════════════════════════════════
echo.

echo %BLUE%[BUILD]%NC% Vite build baslatiliyor...
echo.

call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo %RED%[HATA]%NC% React build sirasinda hata olustu!
    echo.
    echo Olasilik hatalar:
    echo   - TypeScript derleme hatasi
    echo   - ESLint hatalari
    echo   - Import hatalari
    echo.
    echo Hatalari duzeltin ve tekrar deneyin.
    pause
    exit /b 1
)

echo.
echo %GREEN%[OK]%NC% React build tamamlandi
echo.

echo ═══════════════════════════════════════════════════════════
echo   ADIM 4/5: Electron Paketleme
echo ═══════════════════════════════════════════════════════════
echo.

echo %BLUE%[BUILD]%NC% Windows installer olusturuluyor...
echo.
echo Bu islem 5-10 dakika surebilir...
echo Lutfen bekleyin...
echo.

call npm run electron:build:win

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo %RED%[HATA]%NC% Electron build sirasinda hata olustu!
    echo.
    echo Olasilk hatalar:
    echo   - Icon dosyalari eksik (public/icon.ico)
    echo   - electron-builder yapilandirma hatasi
    echo   - Yetersiz disk alani
    echo.
    echo Detayli log icin yukardaki hata mesajlarini kontrol edin.
    pause
    exit /b 1
)

echo.
echo %GREEN%[OK]%NC% Electron build tamamlandi
echo.

echo ═══════════════════════════════════════════════════════════
echo   ADIM 5/5: Build Dosyalarini Kontrol Et
echo ═══════════════════════════════════════════════════════════
echo.

set "BUILD_SUCCESS=0"

if exist "dist-electron\win-unpacked\Spark POS Desktop.exe" (
    echo %GREEN%[BULUNDU]%NC% Tasinabilir versiyon
    echo    ^> dist-electron\win-unpacked\Spark POS Desktop.exe
    set "BUILD_SUCCESS=1"
) else (
    echo %RED%[EKSIK]%NC% Tasinabilir versiyon bulunamadi
)

echo.

if exist "dist-electron\Spark POS Desktop Setup *.exe" (
    for %%F in ("dist-electron\Spark POS Desktop Setup *.exe") do (
        echo %GREEN%[BULUNDU]%NC% Windows Installer
        echo    ^> %%~nxF
        set "BUILD_SUCCESS=1"
    )
) else (
    echo %RED%[EKSIK]%NC% Windows Installer bulunamadi
)

echo.

if !BUILD_SUCCESS! EQU 0 (
    echo %RED%[HATA]%NC% Build dosyalari olusturulamadi!
    echo dist-electron klasorunu kontrol edin.
    pause
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                BUILD BASARIYLA TAMAMLANDI!                ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo %GREEN%Tebrikler!%NC% Windows installer basariyla olusturuldu.
echo.
echo ───────────────────────────────────────────────────────────
echo  DOSYA KONUMLARI:
echo ───────────────────────────────────────────────────────────
echo.
echo  1. TASINABILIR VERSIYON (Kurulum gerektirmez)
echo     %BLUE%dist-electron\win-unpacked\%NC%
echo     - Tum klasoru kopyalayip USB ile tasiyin
echo     - Dogrudan Spark POS Desktop.exe calistirin
echo.
echo  2. WINDOWS INSTALLER (Profesyonel kurulum)
echo     %BLUE%dist-electron\Spark POS Desktop Setup 1.0.0.exe%NC%
echo     - Bu dosyayi diger bilgisayarlara dagiitin
echo     - Cift tiklayarak kurun
echo     - Baslat menusunden acin
echo.
echo ───────────────────────────────────────────────────────────
echo  SONRAKI ADIMLAR:
echo ───────────────────────────────────────────────────────────
echo.
echo  [1] Dosya gezgininde dist-electron klasorunu ac
echo  [2] Setup.exe dosyasini test et
echo  [3] Farkli bir bilgisayarda kur
echo  [4] USB ile diger terminallere dagit
echo.
echo ───────────────────────────────────────────────────────────
echo  DAGITIM SECENEKLERI:
echo ───────────────────────────────────────────────────────────
echo.
echo  USB ile:        win-unpacked klasorunu kopyala
echo  Email ile:      Setup.exe dosyasini gonder
echo  Network ile:    Paylasilan bir klasore koy
echo  Cloud ile:      Google Drive, Dropbox, OneDrive
echo.

REM Dosya gezginini aç
if exist dist-electron (
    echo %BLUE%[ACILIYOR]%NC% Dosya gezgini baslatiliyor...
    start explorer dist-electron
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
