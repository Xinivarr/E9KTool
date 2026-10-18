const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let botProcess = null; 
let mode = "command"; 
let tempIP = "";

function getTimeStamp() {
    const now = new Date();
    const yy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `[${yy}-${mm}-${dd}/${hh}-${min}-${ss}]`;
}

function colorTs() {
    return `\x1b[1;36m${getTimeStamp()}\x1b[0m`;
}

function promptUser(preserveCursor = false) {
    const promptStr = `${colorTs()} \x1b[31mE9K-Tool > \x1b[37m`;
    rl.setPrompt(promptStr);
    rl.prompt(preserveCursor);
}

function showHeader() {
    console.clear();
    console.log("\x1b[31m");
    console.log(`
  ███████╗ █████╗ ██╗  ██╗    ████████╗ ██████╗  ██████╗ ██╗      
  ██╔════╝██╔══██╗██║ ██╔╝    ╚══██╔══╝██╔═══██╗██╔═══██╗██║      
  █████╗  ╚██████║█████╔╝        ██║   ██║   ██║██║   ██║██║      
  ██╔══╝   ╚═══██║██╔═██╗        ██║   ██║   ██║██║   ██║██║      
  ███████╗ █████╔╝██║  ██╗       ██║   ╚██████╔╝╚██████╔╝███████╗ 
  ╚══════╝ ╚════╝ ╚═╝  ╚═╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝`);
    console.log("\x1b[90m┌──────────────────────────────────────────────────────────┐\x1b[0m");
    console.log("\x1b[90m│\x1b[0m \x1b[31mSite:\x1b[0m    \x1b[37me9k.com.tr                                      \x1b[90m│\x1b[0m");
    console.log("\x1b[90m│\x1b[0m \x1b[31mDiscord:\x1b[0m \x1b[37mXinivar                                         \x1b[90m│\x1b[0m");
    console.log("\x1b[90m│\x1b[0m \x1b[31mYouTube:\x1b[0m \x1b[37mXinivar / E9K-comtr                             \x1b[90m│\x1b[0m");
    console.log("\x1b[90m│\x1b[0m \x1b[31mTikTok:\x1b[0m  \x1b[37mXinivar                                         \x1b[90m│\x1b[0m");
    console.log("\x1b[90m│\x1b[0m \x1b[31mBy:\x1b[0m      \x1b[33mXinivar                                         \x1b[90m│\x1b[0m");
    console.log("\x1b[90m└──────────────────────────────────────────────────────────┘\x1b[0m");
    console.log("\x1b[36m Type 'help' to view the command list. / Komut listesini görmek için 'help' yazın.\x1b[0m\n");
}

// --- Server.json Yönetimi ve Varsayılan Sunucular ---
function getServersPath() {
    return path.join(__dirname, 'E9K-fakeproxy', 'server.json');
}

function loadServers() {
    const filePath = getServersPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        const defaultServers = [
            { name: "Chicken NW", ip: "80.91.71.148", port: "25565" },
            { name: "Aesir MC", ip: "91.124.63.104", port: "25592" }
        ];
        fs.writeFileSync(filePath, JSON.stringify(defaultServers, null, 2), 'utf8');
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveServers(servers) {
    const filePath = getServersPath();
    fs.writeFileSync(filePath, JSON.stringify(servers, null, 2), 'utf8');
}
// ----------------------------------------------------

// Tüm servisleri kapatan fonksiyon (exit için kullanılır)
function stopAll() {
    console.log(`${colorTs()} \x1b[33m[!] Services are being closed... / Servisler kapatılıyor...\x1b[0m`);

    if (botProcess) {
        botProcess.kill();
        botProcess = null;
    }

    exec('pkill -f playit');
    exec('pkill -f Velocity.jar');
    exec('pkill -f Bot/bot.js'); 

    console.log(`${colorTs()} \x1b[32m[+] Playit, Velocity, and Bot were shut down. / Playit, Velocity ve Bot kapatıldı.\x1b[0m`);
}

// Yalnızca proxy servislerini kapatan fonksiyon (stopproxy için kullanılır)
function stopProxy() {
    console.log(`${colorTs()} \x1b[33m[!] Proxy services are being closed... / Proxy servisleri kapatılıyor...\x1b[0m`);

    exec('pkill -f playit');
    exec('pkill -f Velocity.jar');

    console.log(`${colorTs()} \x1b[32m[+] Playit and Velocity were shut down. / Playit ve Velocity kapatıldı.\x1b[0m`);
}

// Platform bağımsız Playit başlatma
function startPlayitTerminal() {
    console.log(`${colorTs()} \x1b[34m[SYSTEM / SİSTEM] Playit ayrı bir terminal penceresinde başlatılıyor...\x1b[0m`);

    if (process.platform === 'win32') {
        exec(`start cmd /k "playit"`, (err) => {
            if (err) {
                console.log(`${colorTs()} \x1b[31m[!] Yeni terminal açılamadı, arka planda başlatılıyor.\x1b[0m`);
                const playProc = spawn('playit', [], { cwd: __dirname, detached: true, stdio: 'ignore' });
                playProc.unref();
            }
        });
    } else {
        exec(`gnome-terminal --title="E9K - Playit" -- bash -c "playit; exec bash"`, (err) => {
            if (err) {
                exec(`xterm -hold -e "playit"`, (err2) => {
                    if (err2) {
                        console.log(`${colorTs()} \x1b[31m[!] Yeni terminal açılamadı, arka planda başlatılıyor.\x1b[0m`);
                        const playProc = spawn('playit', [], { cwd: __dirname, detached: true, stdio: 'ignore' });
                        playProc.unref();
                    }
                });
            }
        });
    }
}

// Platform bağımsız Velocity başlatma
function startVelocity(ip, port) {
    try {
        const tomlPath = path.join(__dirname, 'E9K-fakeproxy', 'velocity.toml');
        let content = fs.readFileSync(tomlPath, 'utf8');

        content = content.replace(
            /lobby\s*=\s*".*?"/,
            `lobby = "${ip}:${port}"`
        );

        content = content.replace(
            /e9k-op-exploit\s*=\s*".*?"/,
            `e9k-op-exploit = "${ip}:${port}"`
        );

        fs.writeFileSync(tomlPath, content);

        console.log(`${colorTs()} \x1b[32m[+] velocity.toml has been updated! / güncellendi! (Lobby & Exploit -> ${ip}:${port})\x1b[0m`);

        const velocityDir = path.join(__dirname, 'E9K-fakeproxy');
        const velocityCmd = `java -Xms512M -Xmx512M -jar Velocity.jar`;

        console.log(`${colorTs()} \x1b[34m[SYSTEM / SİSTEM] Velocity ayrı bir terminal penceresinde başlatılıyor...\x1b[0m`);

        if (process.platform === 'win32') {
            exec(`start cmd /k "cd /d \"${velocityDir}\" && ${velocityCmd}"`, (err) => {
                if (err) {
                    console.log(`${colorTs()} \x1b[31m[!] Yeni terminal açılamadı, arka planda başlatılıyor.\x1b[0m`);
                    const velProc = spawn('java', ['-Xms512M', '-Xmx512M', '-jar', 'Velocity.jar'], { cwd: velocityDir, detached: true, stdio: 'ignore' });
                    velProc.unref();
                }
            });
        } else {
            exec(`gnome-terminal --title="E9K - Velocity Proxy" --working-directory="${velocityDir}" -- bash -c "${velocityCmd}; exec bash"`, (err) => {
                if (err) {
                    exec(`xterm -hold -e "cd '${velocityDir}' && ${velocityCmd}"`, (err2) => {
                        if (err2) {
                            console.log(`${colorTs()} \x1b[31m[!] Yeni terminal açılamadı, arka planda başlatılıyor.\x1b[0m`);
                            const velProc = spawn('java', ['-Xms512M', '-Xmx512M', '-jar', 'Velocity.jar'], { cwd: velocityDir, detached: true, stdio: 'ignore' });
                            velProc.unref();
                        }
                    });
                }
            });
        }

    } catch (e) {
        console.log(`${colorTs()} \x1b[31m[!] Error / Hata: ` + e.message + `\x1b[0m`);
    }
}

rl.on('line', (input) => {
    const value = input.trim();

    if (mode === "ip") {
        if (!value) {
            console.log(`${colorTs()} \x1b[31m[ERROR / HATA] The IP cannot be empty. / IP adresi boş olamaz.\x1b[0m`);
            rl.setPrompt(`${colorTs()} Destination Server IP / Hedef Sunucu IP: `);
            rl.prompt();
            return;
        }

        tempIP = value;
        mode = "port";
        rl.setPrompt(`${colorTs()} Destination Server Port / Hedef Sunucu Portu (default 25565): `);
        rl.prompt();
        return;
    }

    if (mode === "port") {
        const port = value || "25565";

        console.log(`${colorTs()} \x1b[32m[+] Playit works in a separate terminal. / Playit ayrı bir terminalde çalışıyor.\x1b[0m`);
        startVelocity(tempIP, port);

        mode = "command";
        promptUser();
        return;
    }

    const parts = value.split(' ');
    const cmd = parts[0].toLowerCase();

    if (botProcess && !["exit", "stopproxy", "stopbot", "help", "proxylist", "proxyadd", "proxydelete"].includes(cmd)) {
        botProcess.stdin.write(value + '\n');
        promptUser();
        return;
    }

    if (cmd === "help") {
    console.log("\n\x1b[1;36m╔══════════════════════════════════════════════════════════════════════╗");
    console.log("║                     \x1b[1;37mCOMMAND MENU / KOMUT MENÜSÜ\x1b[0;1;36m                      ║");
    console.log("╠══════════════════════════════════════════════════════════════════════╣");
    
    console.log("║ \x1b[1;35m[PROXY SYSTEM / PROXY SİSTEMİ]\x1b[0;1;36m                                      ║");
    console.log("║ \x1b[32m  startproxy [no]\x1b[0m : Start proxy server / Proxy'i başlat (no: liste no)║");
    console.log("║ \x1b[32m  proxylist   \x1b[0m : List saved proxies / Kayıtlı sunucuları listele     ║");
    console.log("║ \x1b[32m  proxyadd    \x1b[0m : Add new proxy      / Sunucu ekle ([ip] [port] [isim])║");
    console.log("║ \x1b[31m  proxydelete \x1b[0m : Delete proxy       / Sunucu sil ([no])             ║");
    console.log("║ \x1b[31m  stopproxy   \x1b[0m : Stop proxy server  / Proxy'i kapat                 ║");
    console.log("╠══════════════════════════════════════════════════════════════════════╣");
    
    console.log("║ \x1b[1;35m[BOT SYSTEM / BOT SİSTEMİ]\x1b[0;1;36m                                            ║");
    console.log("║ \x1b[32m  startbot    \x1b[0m : Initialize bot system  / Bot sistemini başlat      ║");
    console.log("║ \x1b[32m  botattack   \x1b[0m : Launch bot attack      / Çoklu bot saldırısı başlat║");
    console.log("║ \x1b[32m  botadd      \x1b[0m : Add single bot         / Tekli bot ekle            ║");
    console.log("║ \x1b[32m  botafk      \x1b[0m : Add AFK bot            / AFK botu ekle             ║");
    console.log("║ \x1b[31m  botforce    \x1b[0m : Brute-force password   / Bot şifre kırma (Brute)   ║");
    console.log("║ \x1b[34m  say         \x1b[0m : Send chat message      / Sohbet mesajı gönder      ║");
    console.log("║ \x1b[34m  cmd         \x1b[0m : Send server command    / Sunucu komutu gönder      ║");
    console.log("║ \x1b[35m  spam        \x1b[0m : Start message spam     / Mesaj spamı başlat        ║");
    console.log("║ \x1b[35m  stopspam    \x1b[0m : Stop spam loop         / Spam döngüsünü durdur     ║");
    console.log("║ \x1b[33m  list        \x1b[0m : List active bots       / Aktif botları listele     ║");
    console.log("║ \x1b[33m  exitbot     \x1b[0m : Stop and clear bots    / Botları durdur ve temizle ║");
    console.log("║ \x1b[31m  stopbot     \x1b[0m : Shutdown bot system    / Bot sistemini kapat       ║");
    console.log("╠══════════════════════════════════════════════════════════════════════╣");
    
    console.log("║ \x1b[1;35m[GENERAL / GENEL]\x1b[0;1;36m                                                    ║");
    console.log("║ \x1b[33m  help        \x1b[0m : Show this menu         / Yardım menüsünü göster    ║");
    console.log("║ \x1b[33m  exit        \x1b[0m : Close the tool         / Uygulamadan çıkış         ║");
    console.log("╚══════════════════════════════════════════════════════════════════════╝\n");
    }
    else if (cmd === "proxylist") {
        const servers = loadServers();
        console.log("\n\x1b[1;36m┌──────────────────────────────────────────────────────────┐");
        console.log("│                  SAVED PROXIES / KAYITLI SUNUCULAR       │");
        console.log("├──────────────────────────────────────────────────────────┤");
        if (servers.length === 0) {
            console.log("│  Kayıtlı sunucu bulunamadı.                              │");
        } else {
            servers.forEach((s, idx) => {
                console.log(`│  [${idx + 1}] İsim: ${s.name} | IP: ${s.ip}:${s.port}`.padEnd(59) + "│");
            });
        }
        console.log("└──────────────────────────────────────────────────────────┘\x1b[0m\n");
    }
    else if (cmd === "proxyadd") {
        const ip = parts[1];
        if (!ip) {
            console.log(`${colorTs()} \x1b[31m[ERROR / HATA] Kullanım: proxyadd [ip] [port (opsiyonel)] [isim (opsiyonel)]\x1b[0m`);
        } else {
            let port = "25565";
            let nameIndex = 2;

            // Eğer parts[2] bir sayı ise port olarak kabul et
            if (parts[2] && /^\d+$/.test(parts[2])) {
                port = parts[2];
                nameIndex = 3;
            }

            const servers = loadServers();
            // Geri kalan tüm kelimeleri isim olarak birleştir
            const customName = parts.slice(nameIndex).join(' ');
            const name = customName ? customName : `Sunucu ${servers.length + 1}`;

            servers.push({ name, ip, port });
            saveServers(servers);
            console.log(`${colorTs()} \x1b[32m[+] Sunucu başarıyla eklendi! Sıra No: ${servers.length} | İsim: ${name} | Adres: ${ip}:${port}\x1b[0m`);
        }
    }
    else if (cmd === "proxydelete") {
        const index = parseInt(parts[1]) - 1;
        const servers = loadServers();
        if (isNaN(index) || index < 0 || index >= servers.length) {
            console.log(`${colorTs()} \x1b[31m[ERROR / HATA] Geçersiz sıra numarası! 'proxylist' ile kontrol edin.\x1b[0m`);
        } else {
            const removed = servers.splice(index, 1)[0];
            saveServers(servers);
            console.log(`${colorTs()} \x1b[31m[-] Sunucu silindi: ${removed.name} (${removed.ip}:${removed.port}). Diğer sunucular yeniden indekslendi.\x1b[0m`);
        }
    }
    else if (cmd === "startproxy") {
        const index = parts[1] ? parseInt(parts[1]) - 1 : null;

        startPlayitTerminal();

        if (index !== null) {
            const servers = loadServers();
            if (isNaN(index) || index < 0 || index >= servers.length) {
                console.log(`${colorTs()} \x1b[31m[!] Geçersiz sunucu numarası! Normal IP/Port giriş moduna geçiliyor.\x1b[0m`);
                mode = "ip";
                rl.setPrompt(`${colorTs()} Destination Server IP / Hedef Sunucu IP: `);
                rl.prompt();
            } else {
                const targetServer = servers[index];
                console.log(`${colorTs()} \x1b[32m[+] [${index + 1}] Numaralı sunucu seçildi: ${targetServer.name} (${targetServer.ip}:${targetServer.port})\x1b[0m`);
                startVelocity(targetServer.ip, targetServer.port);
                mode = "command";
                promptUser();
            }
        } else {
            mode = "ip";
            rl.setPrompt(`${colorTs()} Destination Server IP / Hedef Sunucu IP: `);
            rl.prompt();
        }
        return;
    }
    else if (cmd === "startbot") {
        if (botProcess) {
            console.log(`${colorTs()} \x1b[31m[!] Bot is already running. / Bot zaten çalışıyor.\x1b[0m`);
        } else {
            console.log(`${colorTs()} \x1b[32m[+] Starting bot.js inside tool... You can type commands directly. / bot.js tool içinde başlatılıyor... Komutları doğrudan yazabilirsiniz.\x1b[0m`);
            botProcess = spawn('node', [path.join('Bot', 'bot.js')]);

            botProcess.stdout.on('data', (data) => {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(data.toString());
                promptUser(true);
            });

            botProcess.stderr.on('data', (data) => {
                process.stdout.write(`\x1b[31m[BOT HATA / ERROR]: ${data}\x1b[0m`);
                promptUser(true);
            });

            botProcess.on('close', () => {
                botProcess = null;
            });
        }
    }
    else if (cmd === "stopbot") {
        if (botProcess) {
            botProcess.kill();
            botProcess = null;
            console.log(`${colorTs()} \x1b[31m[+] Bot system stopped. / Bot sistemi durduruldu.\x1b[0m`);
        } else {
            console.log(`${colorTs()} \x1b[33m[!] No bot is running. / Çalışan bir bot yok.\x1b[0m`);
        }
    }
    else if (cmd === "stopproxy") {
        stopProxy();
    }
    else if (cmd === "exit") {
        stopAll();
        process.exit();
    }
    else if (cmd !== "") {
        console.log(`${colorTs()} \x1b[31m[ERROR / HATA] Bilinmeyen komut, komutları görmek için 'help' yazın. / Unknown command, type 'help' to see commands.\x1b[0m`);
    }

    promptUser();
});

showHeader();
promptUser();
