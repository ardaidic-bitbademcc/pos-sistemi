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
echo %BLUE%========================================%RESET%
echo %BLUE%  SPARK POS - OTOMATIK KURULUM ve BUILD%RESET%
echo %BLUE%========================================%RESET%
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

echo %GREEN%✅ Yönetici hakları doğrulandı%RESET%
echo.

:: ============================================
:: BÖLÜM 1: NODE.JS KONTROLÜ VE KURULUMU
:: ============================================

echo %BLUE%[1/5] Node.js kontrol ediliyor...%RESET%

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Node.js bulunamadı, otomatik kurulum başlıyor...%RESET%
    echo.
    
    :: Chocolatey kontrolü
    where choco >nul 2>&1
    if %errorlevel% neq 0 (
        echo %YELLOW%📦 Chocolatey package manager kuruluyor...%RESET%
        echo.
        
        :: PowerShell ile Chocolatey kurulumu
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
        
        if %errorlevel% neq 0 (
            echo %RED%❌ Chocolatey kurulamadı!%RESET%
            echo.
            echo %YELLOW%Manuel kurulum gerekli:%RESET%
            echo 1. https://nodejs.org/ adresinden Node.js LTS indirin
            echo 2. Kurulumu yapın ve bilgisayarı yeniden başlatın
            echo 3. Bu scripti tekrar çalıştırın
            echo.
            pause
            exit /b 1
        )
        
        :: PATH'i yenile
        call refreshenv >nul 2>&1
        
        echo %GREEN%✅ Chocolatey kuruldu%RESET%
        echo.
    )
    
    echo %YELLOW%📦 Node.js LTS kuruluyor (bu birkaç dakika sürebilir)...%RESET%
    echo.
    choco install nodejs-lts -y
    
    if %errorlevel% neq 0 (
        echo %RED%❌ Node.js otomatik kurulamadı!%RESET%
        echo.
        echo %YELLOW%Lütfen manuel kurulum yapın:%RESET%
        echo 1. https://nodejs.org/ adresine gidin
        echo 2. LTS versiyonunu indirip kurun
        echo 3. Bilgisayarı yeniden başlatın
        echo 4. Bu scripti tekrar çalıştırın
        echo.
        pause
        exit /b 1
    )
    
    :: PATH'i yenile
    call refreshenv >nul 2>&1
    
    echo %GREEN%✅ Node.js başarıyla kuruldu!%RESET%
    echo.
    echo %YELLOW%⚠️  Kurulumun etkili olması için bilgisayarı YENIDEN BAŞLATMANIZ önerilir.%RESET%
    echo.
    choice /C YN /M "Şimdi yeniden başlatmak ister misiniz? (Y/N)"
    if !errorlevel! equ 1 (
        echo %YELLOW%Bilgisayar 10 saniye içinde yeniden başlatılacak...%RESET%
        shutdown /r /t 10 /c "Node.js kurulumu tamamlandı. Sistem yeniden başlatılıyor..."
        exit /b 0
    )
) else (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
    echo %GREEN%✅ Node.js bulundu: !NODE_VERSION!%RESET%
    
    :: Versiyon kontrolü (v18.0.0 ve üzeri)
    for /f "tokens=1,2 delims=.v" %%a in ("!NODE_VERSION!") do (
        set MAJOR_VERSION=%%a
    )
    
    if !MAJOR_VERSION! LSS 18 (
        echo %YELLOW%⚠️  Node.js versiyonu eski (!NODE_VERSION!). En az v18 önerilir.%RESET%
        echo.
        echo %YELLOW%Güncellemek ister misiniz? (Chocolatey ile)%RESET%
        choice /C YN /M "Node.js'i güncellemek istiyor musunuz? (Y/N)"
        if !errorlevel! equ 1 (
            where choco >nul 2>&1
            if %errorlevel% equ 0 (
                choco upgrade nodejs-lts -y
                call refreshenv >nul 2>&1
            ) else (
                echo %YELLOW%Manuel güncelleme: https://nodejs.org/%RESET%
            )
        )
    )
)

echo.

:: ============================================
:: BÖLÜM 2: GIT KONTROLÜ VE KURULUMU
:: ============================================

echo %BLUE%[2/5] Git kontrol ediliyor...%RESET%

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Git bulunamadı, kurulum başlıyor...%RESET%
    echo.
    
    where choco >nul 2>&1
    if %errorlevel% equ 0 (
        choco install git -y
        call refreshenv >nul 2>&1
        echo %GREEN%✅ Git kuruldu%RESET%
    ) else (
        echo %YELLOW%⚠️  Git kurulumu atlandı (opsiyonel)%RESET%
        echo Manuel kurulum: https://git-scm.com/download/win
    )
) else (
    for /f "tokens=*" %%v in ('git --version') do echo %GREEN%✅ Git bulundu: %%v%RESET%
)

echo.

:: ============================================
:: BÖLÜM 3: PROJE BAĞIMLILIKLARINI KURMA
:: ============================================

echo %BLUE%[3/5] Proje bağımlılıkları kontrol ediliyor...%RESET%
echo.

if not exist "package.json" (
    echo %RED%❌ package.json bulunamadı!%RESET%
    echo %YELLOW%Lütfen proje klasöründe olduğunuzdan emin olun.%RESET%
    pause
    exit /b 1
)

:: node_modules yoksa veya package-lock.json değiştiyse yükle
set NEED_INSTALL=0

if not exist "node_modules" (
    set NEED_INSTALL=1
    echo %YELLOW%⚠️  node_modules bulunamadı%RESET%
) else (
    echo %GREEN%✅ node_modules mevcut%RESET%
    
    :: npm outdated kontrolü
    echo %BLUE%Güncel olmayan paketler kontrol ediliyor...%RESET%
    npm outdated >nul 2>&1
    if !errorlevel! neq 0 (
        echo %YELLOW%⚠️  Bazı paketler güncellenebilir%RESET%
        choice /C YN /M "Paketleri güncellemek ister misiniz? (Y/N)"
        if !errorlevel! equ 1 (
            set NEED_INSTALL=1
        )
    ) else (
        echo %GREEN%✅ Tüm paketler güncel%RESET%
    )
)

if !NEED_INSTALL! equ 1 (
    echo.
    echo %YELLOW%📦 npm paketleri kuruluyor/güncelleniyor...%RESET%
    echo %YELLOW%Bu işlem birkaç dakika sürebilir, lütfen bekleyin...%RESET%
    echo.
    
    npm install
    
    if !errorlevel! neq 0 (
        echo %RED%❌ Paket kurulumu başarısız!%RESET%
        echo.
        echo %YELLOW%Çözüm denemeleri:%RESET%
        echo 1. Cache temizleniyor...
        npm cache clean --force
        echo 2. node_modules siliniyor...
        if exist "node_modules" rd /s /q node_modules
        echo 3. Tekrar deneniyor...
        npm install
        
        if !errorlevel! neq 0 (
            echo %RED%❌ Hala başarısız! Manuel müdahale gerekiyor.%RESET%
            pause
            exit /b 1
        )
    )
    
    echo %GREEN%✅ Paketler başarıyla kuruldu!%RESET%
)

echo.

:: ============================================
:: BÖLÜM 4: REACT BUILD
:: ============================================

echo %BLUE%[4/5] React uygulaması build ediliyor...%RESET%
echo.

:: Eski build'i temizle
if exist "dist" (
    echo %YELLOW%Eski build temizleniyor...%RESET%
    rd /s /q dist 2>nul
)

echo %YELLOW%Vite build başlıyor (bu 1-2 dakika sürebilir)...%RESET%
echo.

call npm run build

if %errorlevel% neq 0 (
    echo %RED%❌ React build başarısız!%RESET%
    echo.
    echo %YELLOW%Hata detaylarını yukarıda görebilirsiniz.%RESET%
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo %RED%❌ Build tamamlandı ama dist/index.html bulunamadı!%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ React build başarılı!%RESET%
echo.

:: ============================================
:: BÖLÜM 5: ELECTRON BUILD
:: ============================================

echo %BLUE%[5/5] Electron installer oluşturuluyor...%RESET%
echo.

:: Eski electron build'i temizle
if exist "dist-electron" (
    echo %YELLOW%Eski electron build temizleniyor...%RESET%
    rd /s /q dist-electron 2>nul
)

echo %YELLOW%Electron packager çalışıyor (bu 3-5 dakika sürebilir)...%RESET%
echo %YELLOW%Lütfen sabırlı olun, arka planda büyük dosyalar indiriliyor ve paketleniyor...%RESET%
echo.

call npm run electron:build:win

if %errorlevel% neq 0 (
    echo %RED%❌ Electron build başarısız!%RESET%
    echo.
    echo %YELLOW%Olası nedenler:%RESET%
    echo - electron-builder제대로 kurulmamış olabilir
    echo - Disk alanı yetersiz olabilir
    echo - Antivirüs yazılımı engelliyor olabilir
    echo.
    pause
    exit /b 1
)

:: ============================================
:: SONUÇ KONTROLÜ
:: ============================================

echo.
echo %BLUE%========================================%RESET%
echo %BLUE%  KURULUM VE BUILD TAMAMLANDI!%RESET%
echo %BLUE%========================================%RESET%
echo.

set FOUND_EXE=0

if exist "dist-electron\*.exe" (
    echo %GREEN%✅ Installer dosyaları oluşturuldu:%RESET%
    echo.
    dir /b dist-electron\*.exe
    echo.
    set FOUND_EXE=1
)

if !FOUND_EXE! equ 0 (
    echo %RED%❌ .exe dosyaları bulunamadı!%RESET%
    echo %YELLOW%dist-electron klasörünü kontrol edin.%RESET%
    echo.
    pause
    exit /b 1
)

echo %GREEN%📁 Installer konumu:%RESET%
echo %CD%\dist-electron
echo.

echo %YELLOW%📋 Dosya boyutları:%RESET%
for %%F in (dist-electron\*.exe) do (
    set SIZE=%%~zF
    set /a SIZE_MB=!SIZE! / 1048576
    echo   %%~nxF - !SIZE_MB! MB
)

echo.
echo %GREEN%🎉 Başarıyla tamamlandı!%RESET%
echo.
echo %YELLOW%Artık .exe dosyalarını dağıtabilirsiniz:%RESET%
echo - NSIS Installer: Profesyonel kurulum deneyimi
echo - Portable: USB'den çalışır, kurulum gerektirmez
echo.

choice /C YN /M "Installer klasörünü açmak ister misiniz? (Y/N)"
if !errorlevel! equ 1 (
    explorer dist-electron
)

echo.
pause
