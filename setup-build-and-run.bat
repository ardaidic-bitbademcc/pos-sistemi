@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Renkler
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo.
echo %BLUE%==============================================%RESET%
echo %BLUE%  SPARK POS - OTOMATIK KURULUM, BUILD ve RUN%RESET%
echo %BLUE%==============================================%RESET%
echo.

:: Yönetici hakları kontrolü
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Bu script YÖNETICI HAKKI gerektirir!%RESET%
    echo.
    echo %YELLOW%Lütfen şu adımları izleyin:%RESET%
    echo 1. Bu dosyaya SAĞ TIKLAYIN
    echo 2. "Yönetici olarak çalıştır" seçin
    echo.
    pause
    exit /b 1
)

:: setup-and-build.bat'ı çağır
echo %BLUE%[1/2] Build işlemi başlatılıyor...%RESET%
echo.

call setup-and-build.bat

if %errorlevel% neq 0 (
    echo %RED%❌ Build işlemi başarısız!%RESET%
    pause
    exit /b 1
)

:: Portable .exe'yi bul ve çalıştır
echo.
echo %BLUE%[2/2] POS sistemi başlatılıyor...%RESET%
echo.

set "PORTABLE_EXE="
for %%F in (dist-electron\*Portable.exe) do (
    set "PORTABLE_EXE=%%F"
)

if not defined PORTABLE_EXE (
    echo %YELLOW%⚠️  Portable .exe bulunamadı.%RESET%
    echo %YELLOW%NSIS installer'ı kurup manuel başlatabilirsiniz.%RESET%
    echo.
    
    set "NSIS_EXE="
    for %%F in (dist-electron\*.exe) do (
        set "NSIS_EXE=%%F"
    )
    
    if defined NSIS_EXE (
        echo %BLUE%NSIS Installer bulundu:%RESET%
        echo !NSIS_EXE!
        echo.
        choice /C YN /M "Installer'ı çalıştırıp kurmak ister misiniz? (Y/N)"
        if !errorlevel! equ 1 (
            start "" "!NSIS_EXE!"
            echo.
            echo %GREEN%✅ Installer başlatıldı.%RESET%
            echo %YELLOW%Kurulum tamamlandıktan sonra Start Menu'den açabilirsiniz.%RESET%
        )
    )
) else (
    echo %GREEN%✅ Portable sürüm bulundu:%RESET%
    echo !PORTABLE_EXE!
    echo.
    
    choice /C YN /M "POS sistemini şimdi başlatmak ister misiniz? (Y/N)"
    if !errorlevel! equ 1 (
        echo %YELLOW%POS sistemi açılıyor...%RESET%
        start "" "!PORTABLE_EXE!"
        echo.
        echo %GREEN%✅ POS sistemi başlatıldı!%RESET%
        timeout /t 3 >nul
        exit /b 0
    )
)

echo.
echo %GREEN%🎉 İşlem tamamlandı!%RESET%
echo.
pause
