# Pi erişim noktası (AP) modu — ne olur, ne yapmalısın?

## Tam yığın: Ethernet = yönetici, Wi‑Fi = analiz (önerilen)

- **Dokümantasyon:** `pi/PI-KURULUM-TR.md`
- **Kurulum (Pi’de bir kez):** `cd ~/cycle-watch-ai/pi && chmod +x install-cycle-watch-stack.sh && sudo ./install-cycle-watch-stack.sh`  
  Bu, **sürekli hotspot** (`cycle-watch-ap`), **analiz 5173** (`cycle-watch-analysis`) ve **yönetici 5274** (`cycle-watch-admin`, sadece Ethernet) servislerini açar.

---

## Bu kurulum ne yapar?

`enable-ap.sh` çalışınca Raspberry Pi **kendi WiFi ağını yayınlar** (SSID: varsayılan **`pi-wifi`**). Telefon veya bilgisayar **bu ağa bağlandığında** web arayüzüne Pi’nin **wlan0** IP’si ile (çoğunlukla **`http://…:5173`**) girersin; tam adres Ethernet’ten **yönetici panelinde** de gösterilir.

## Önemli: İnternet ve Tailscale kesilir (çoğu kurulumda)

Pi’de **tek kablosuz kart** varken (`wlan0`):

- **İstemci modu** (ev WiFi’sine bağlı) ile **erişim noktası modu** aynı anda kullanılamaz.
- `enable-ap.sh` çalıştığında Pi **ev ağından düşer** → bu ağ üzerinden **internet olmaz**.
- **Tailscale** (`100.92.x.x`) ve **aynı WiFi üzerinden SSH** genelde **kesilir** (Ethernet yoksa).

**Ethernet (RJ45) ile router’a bağlı değilsen**, uzaktan bağlantı kopar; bu beklenen davranıştır.

### Kurtarma seçenekleri

1. **Ethernet kablosu** tak: Pi router’a kablolu bağlansın → ev ağı IP’si ile SSH / panel mümkün olabilir.
2. **Klavye + monitör** ile Pi başında `disable-ap.sh` çalıştır.
3. **Telefon** ile Pi’nin yaydığı **`pi-wifi`** ağına bağlan → tarayıcıdan panele gir (aşağıdaki adresler).

---

## Betikleri Windows’tan Pi’ye kopyalamak

PowerShell’de proje klasöründe:

```powershell
cd <proje>\cycle-watch-ai\pi\ap-mode
.\copy-to-pi.ps1
```

(`192.168.50.1` ve `pi` kullanıcısı varsayılan; değiştirmek için: `.\copy-to-pi.ps1 -PiHost 192.168.1.10`)

Elle `scp` ile:

```powershell
ssh pi@192.168.50.1 "mkdir -p ~/cycle-watch-ai/pi/ap-mode"
scp .\enable-ap.sh .\disable-ap.sh pi@192.168.50.1:~/cycle-watch-ai/pi/ap-mode/
```

---

## İlk kez AP açarken sıra

1. **Mümkünse** paketleri ve betikleri **internet varken** indir (şu an proje klasöründe `pi/ap-mode/` hazır).
2. Pi’de terminal aç (SSH veya doğrudan).
3. Komutlar:
   ```bash
   cd ~/cycle-watch-ai/pi/ap-mode
   chmod +x enable-ap.sh disable-ap.sh
   sudo ./enable-ap.sh --yes
   ```
4. SSH/Tailscale koptuysa **normal**; telefonda WiFi listesinde **`pi-wifi`** (veya kendi verdiğin SSID) ara, **parolayı** gir (varsayılan: `123456789`; sahada kesin güçlendirin).
5. Telefonda tarayıcı:
   - Önce Pi’nin **AP IP’sini** öğren:
     ```bash
     # Pi’de (monitör/klavye ile veya Ethernet ile SSH)
     ip -4 addr show wlan0
     ```
   - **NetworkManager “hotspot”** çoğu kez **`10.42.0.1`** verir; bazen farklı olabilir — `ip addr` çıktısına bak.
   - Arayüz: **`http://10.42.0.1:5173`** veya çıkan IP: **`http://<GÖRDÜĞÜN_IP>:5173`**

6. Eski moda dönmek (ev WiFi + internet):
   ```bash
   cd ~/cycle-watch-ai/pi/ap-mode
   sudo ./disable-ap.sh
   ```
   Betik sana **ev ağı SSID ve parolasını** sorar; bağlantı yeniden kurulur.

---

## Güvenlik

- Varsayılan WiFi parolasını **`enable-ap.sh` içinde** veya ortam değişkeni ile değiştir:
  ```bash
  export AP_PASSWORD='GüçlüBirParola'
  sudo ./enable-ap.sh --yes
  ```
- Üretimde SSID’yi de özelleştir: `AP_SSID='Makine-1234'`.

---

## Özet tablo

| Durum | Tailscale / eski WiFi IP | Ne yaparsın |
|--------|----------------------------|-------------|
| STA (şu an) | `100.92.41.26` ile erişim | Normal kullanım |
| AP açık | Genelde **yok** | `pi-wifi` ağına bağlan → `http://<wlan0-IP>:5173` (özet ethernet yöneticide) |
| Geri STA | Tekrar `disable-ap.sh` | Ev WiFi bilgilerini gir |

---

## Sorun giderme

- **`disable-ap.sh` bağlantı bulamıyorsa:** Varsayılan profil adı `pi-wifi-ap` ile `enable-ap.sh` ile aynıdır; eski sürümlerde `CycleWatch-AP` kullanılıyordu — gerekirse `CON_NAME` ile eşleştirin.
- **NM hâlâ “802.1X” / hotspot zaman aşımı veriyorsa:** `hostapd` yolunu kullanın (Pi’de genelde en sorunsuzu): Ethernet takılıyken `chmod +x enable-ap-hostapd.sh disable-ap-hostapd.sh` sonra `sudo ./enable-ap-hostapd.sh --yes`. Panel: `http://192.168.4.1:5173` (varsayılan AP adresi). Kapatmak: `sudo ./disable-ap-hostapd.sh`. Betikler `hostapd` ve `dnsmasq` paketlerini kurar; `wlan0` geçici olarak NetworkManager dışına alınır.
- **`throttled=0x50000`:** Önceki boot’ta düşük voltaj / kısılma kaydı. Yeni adaptörle **tam kapat-aç** sonrası `vcgencmd get_throttled` tekrar bakın; mümkünse `throttled=0x0`.
- **“Hotspot network creation took too long” / `supplicant-timeout`:** Raspberry Pi OS’te ayrı **`wpa_supplicant` servisi** NetworkManager ile çakışır. Güncel `enable-ap.sh` Pi’de varsayılan olarak bu servisi durdurup NM’i yeniden başlatır. Elle denemek için: `sudo systemctl stop wpa_supplicant && sudo systemctl restart NetworkManager`, birkaç saniye bekleyip `sudo nmcli connection up pi-wifi-ap ifname wlan0`. AP’den çıkınca `disable-ap.sh` servisi tekrar başlatmayı dener.
- **802.1X / kimlik doğrulama hatası:** Güncel betik `802-1x` bölümünü siler, WPA-PSK sabitler ve diğer kayıtlı WiFi profillerinde `autoconnect` kapatır. Betiği Pi’ye kopyalayıp `sudo ./enable-ap.sh --yes` çalıştırın (`AP_NONINTERACTIVE=1` sudo ile güvenilir iletilmez; `--yes` kullanın).
- **Ağ görünmüyor:** `sudo nmcli con show --active` ve `sudo journalctl -u NetworkManager -b --no-pager | tail -50`
- **Sayfa açılmıyor:** `systemctl status cycle-watch-ai` — servis çalışıyor mu, `0.0.0.0:5173` dinleniyor mu: `ss -tlnp | grep 5173`
