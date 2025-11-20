@echo off
echo ========================================
echo Spark POS Desktop - Hizli Baslatma
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

echo Node.js: 
node --version
echo.

REM Bağımlılıklar kontrol
if not exist node_modules (
    echo [UYARI] node_modules bulunamadi!
    echo Bagimliliklari yuklemek icin:
    echo    npm install
    echo.
    set /p INSTALL="Simdi yuklemek ister misiniz? (E/H): "
    if /i "%INSTALL%"=="E" (
        call npm install
    ) else (
        exit /b 1
    )
)

echo.
echo ========================================
echo Electron Uygulamasi Baslatiliyor...
echo ========================================
echo.
echo API Sunucu: http://localhost:3333
echo WebSocket: ws://localhost:3334
echo.
echo Kapatmak icin bu pencereyi kapatmayin!
echo Electron penceresini kapatip yeniden acabilirsiniz.
echo.
echo ----------------------------------------

call npm run electron
