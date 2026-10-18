@echo off
title E9K-Tool Baslatici
cls

echo Kontroller yapiliyor...

:: 1. Node.js Kontrolu
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Node.js sistemde bulunamadi!
    echo Lutfen bilgisayarınıza Node.js kurun.
    goto bitir
) else (
    echo Node.js kurulu.
)

:: 2. Modul Kontrolu
if not exist "node_modules\" (
    echo Eksik kutuphaneler tespit edildi, yukleniyor...
    if exist "package.json" (
        call npm install
    ) else (
        echo {"name": "e9k-tool", "version": "1.0.0", "dependencies": {"mineflayer": "^4.20.0"}} > package.json
        call npm install
    )
) else (
    echo Moduller kontrol edildi.
)

echo Tum islemler tamamlandi. Tool baslatiliyor...
timeout /t 1 /nobreak >nul
cls

:: 3. E9K Tool Calistir
if exist "e9ktool.js" (
    node e9ktool.js
) else (
    echo HATA: e9ktool.js dosyasi bulunamadi!
    goto bitir
)

goto son

:bitir
echo.
echo Islem durduruldu. Kapatmak icin bir tusa basin.
pause >nul

:son
