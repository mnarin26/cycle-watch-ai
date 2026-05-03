# Ağ politikası — Wi-Fi yalnızca analiz | Ethernet tam yönetim

Bu profil tasarıma göre:

| Arayüz | Davranış |
|--------|----------|
| **`wlan0`** | **Sadece kendi SSID’nizi yayınlar** (`hostapd`/NetworkManager hotspot). **Başka bir Wi‑Fi şebekesine STA olarak bağlanmaz.** SSID **görünür** (gizli değildir). Bu ağa bağlanabilen kullanıcılar **yalnızca analiz arayüzünü** (varsayılan **TCP 5173**) kullanabilir. SSH ve **yönetici panel portu** (5274) kablosuz taraftan **engellenir** (firewall). |
| **Kablo (eth0 veya Pi’de sık görülen `enx…` adı)** | **wlan0 dışındaki yüzler** nft kuralında kabul görür (SSH 22, 5173, 5274, …); predictive ethernet adı `eth0` değilse de kablolu SSH tanınır. |

**Tailscale** kullanıyorsanız `tailscale0` arayüzü için izin firewall dosyasında açıktır; Tailscale kullanmayacaksanız kuraldan çıkarabilirsiniz.

## Kurulum sırası (özet)

1. Ethernet ile Pi’ye girin (**SSH/yönetim**).
2. `nm-ap-only-visible-ssid.sh` ile **yalnızca hotspot** aktif kalacak şekilde Wi‑Fi istemcisini devre dışı bırakın / hotspot oluşturun.
3. `cycle-watch` systemd servislerinizi çalıştırın (5173 analiz, 5274 admin).
4. `nft-cyclewatch-firewall.sh` ile **nft kuralları** yüklenir (**root** gerekli). Betik önce `cyclewatch-fw` tablosunu siler, sonra yeniden oluşturur; ilk yüklemede “tablo yok” yüzünden patlayan `flush chain` sırası kaldırıldı.

Çalışma sonrası:

- Wi‑Fi: `http://<Pi-AP-gateway-IP>:5173` — çoğu NM hotspot’ta **`10.42.0.1`** (`ip -4 addr show wlan0`).
- Kablo (eth): `http://<eth0-IP>:5173`, `http://<eth0-IP>:5274`, `ssh`.

## Ortam değişkenleri (hotspot)

`nm-ap-only-visible-ssid.sh` içinden veya dışardan:

```bash
# Varsayılan zaten pi-wifi / 123456789 (kurumsal güçlü şifre için özelleştirin).
export CW_AP_SSID="pi-wifi"
export CW_AP_PASSWORD="123456789"
```

## Güvenlik notları

- **HTTP** olduğu güvenilir ağ için kabul edilebilir; dış sahada **HTTPS**.
- Güçlü **WPA2/WPA3** parolası kullanın (`CW_AP_PASSWORD`).
- Firewall betiği yüklemeden önce **Ethernet ile erişiminiz olduğundan** emin olun; yanlış kural ile kilitlenmeyin.
