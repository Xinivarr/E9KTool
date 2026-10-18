#!/bin/bash

echo "[*] E9K-Tool Baslatici: Sistem kontrolleri yapiliyor..."

# Termux veya standart Linux PATH yollarini taniyabilmesi icin export ekleyelim
export PATH=$PATH:/data/data/com.termux/files/usr/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# Paket yoneticisini otomatik tespit et (apt veya pkg)
PKG_MANAGER=""
if command -v apt &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v pkg &> /dev/null; then
    PKG_MANAGER="pkg"
fi

# 1. Node.js Kontrolu ve Kurulumu
if ! command -v node &> /dev/null; then
    echo "[!] Node.js bulunamadi! Otomatik olarak kuruluyor..."
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo apt update && sudo apt install -y nodejs npm
    elif [ "$PKG_MANAGER" = "pkg" ]; then
        pkg update -y && pkg install nodejs -y
    else
        echo "[!] Desteklenmeyen sistem. Lutfen manuel olarak Node.js kurun."
        exit 1
    fi
else
    echo "[+] Node.js zaten kurulu."
fi

# 2. Java Kontrolü (Termux ve Linux uyumlu)
JAVA_OK=false
if command -v java &> /dev/null; then
    JAVA_OK=true
fi

if [ "$JAVA_OK" = false ]; then
    echo "[!] Java bulunamadi! Otomatik olarak kuruluyor..."
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo apt update && sudo apt install -y openjdk-21-jdk
    elif [ "$PKG_MANAGER" = "pkg" ]; then
        pkg update -y && pkg install -y openjdk-17
    else
        echo "[!] Desteklenmeyen sistem. Lutfen manuel olarak Java kurun."
        exit 1
    fi
else
    echo "[+] Java zaten kurulu."
fi

# 3. Node Modulleri (Mineflayer vb.) Kontrolu ve Kurulumu
if [ ! -d "node_modules" ] || [ ! -d "node_modules/mineflayer" ]; then
    echo "[*] Eksik kutuphaneler (Mineflayer vb.) tespit edildi, npm install yapiliyor..."
    if [ -f "package.json" ]; then
        npm install
    else
        echo "[!] Uyari: package.json bulunamadi! Bos bir package.json olusturuluyor..."
        echo '{"name": "e9k-tool", "version": "1.0.0", "dependencies": {"mineflayer": "^4.20.0"}}' > package.json
        npm install
    fi
else
    echo "[+] Mineflayer ve diger moduller eksiksiz kurulu."
fi

echo "[*] Tum kontroller basariyla tamamlandi. Tool baslatiliyor..."
sleep 1
clear

# 4. E9K Tool'u Calistir (Termux tam yol destegi ile)
if [ -f "e9ktool.js" ]; then
    node e9ktool.js
else
    echo "[!] HATA: Bulundugunuz klasorde 'e9ktool.js' dosyasi bulunamadi!"
    exit 1
fi
