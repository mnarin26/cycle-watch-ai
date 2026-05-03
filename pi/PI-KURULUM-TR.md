# Raspberry Pi — tam yığın (Ethernet yönetici + sürekli hotspot + analiz)

## Ne olur?

| Nasıl bağlanıyorsun? | Adres |
|----------------------|--------|
| **Ethernet (kablo)** | Yönetici panel: `http://192.168.50.1:5274` (veya `eth0` IP’si farklıysa o) |
| **pi-wifi hotspot**    | Analiz arayüz: `http://192.168.4.1:5173` (varsayılan; `AP_ADDR` değiştirildiyse `ip -4 addr show wlan0`) |

- **Hotspot** açık kalır (hostapd + dnsmasq) — `pi-wifi` / varsayılan parola betikte (`enable-ap-hostapd.sh`).
- **Analiz** Vite `npm run dev` ile **5173**, tüm arayüzler (`vite.config.ts` `host: true`).
- **Yönetici** yalnızca **Ethernet IP** üzerinde **5274** (`admin-panel/vite.config.ts`).

Tek seferlik kurulum (repo `/home/pi/cycle-watch-ai` varsayılır):

```bash
cd /home/pi/cycle-watch-ai/pi
chmod +x install-cycle-watch-stack.sh
sudo ./install-cycle-watch-stack.sh
```

Önkoşullar: `npm`, `node`, depo içinde `npm install` tamamlanmış olmalı.

Servisler: `cycle-watch-ap`, `cycle-watch-analysis`, `cycle-watch-admin`.

Hotspot’u geçici kapatmak: `sudo /home/pi/cycle-watch-ai/pi/ap-mode/disable-ap-hostapd.sh` (sistemd’deki AP birimini de devre dışı bırak: `sudo systemctl disable --now cycle-watch-ap`).

**Güvenlik duvarı:** WiFi istemcilerinde DHCP için **UDP 67** açık olmalı. Projede `pi/network-profile/cyclewatch-fw.nft` buna uygundur; yüklü değilse yükle veya `nft` kurallarını kontrol et.

**Şifreleri** ortam değişkeni veya `enable-ap-hostapd.sh` içinden özelleştir; repoya sızmamasına dikkat et.
