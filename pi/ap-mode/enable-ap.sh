#!/bin/bash
# Pi'yi WiFi erişim noktası yapar (NetworkManager). Tek radyoda STA kesilir → genelde internet/Tailscale düşer.
set -euo pipefail

export PATH="/usr/sbin:/sbin:/usr/bin:/bin:${PATH:-}"

AP_SSID="${AP_SSID:-pi-wifi}"
AP_PASSWORD="${AP_PASSWORD:-123456789}"
CON_NAME="${CON_NAME:-pi-wifi-ap}"
AP_COUNTRY="${AP_COUNTRY:-TR}"
AP_CHANNEL="${AP_CHANNEL:-6}"

# Raspberry Pi OS: ayrı çalışan wpa_supplicant servisi NM ile çakışır → "Hotspot network creation took too long".
# Kapatmak için: AP_STOP_SYSTEM_WPA=1 (Pi'de varsayılan 1). İstemezsen: AP_STOP_SYSTEM_WPA=0
is_raspberry_pi() {
  [[ -r /proc/device-tree/model ]] && grep -qi raspberry /proc/device-tree/model 2>/dev/null
}
if is_raspberry_pi; then
  : "${AP_STOP_SYSTEM_WPA:=1}"
else
  : "${AP_STOP_SYSTEM_WPA:=0}"
fi

fix_nm_wpa_conflict() {
  if [[ "${AP_STOP_SYSTEM_WPA:-0}" != "1" ]]; then
    return 0
  fi
  echo "Sistem wpa_supplicant servisi durduruluyor (NetworkManager ile çakışma önlemi)..."
  sudo systemctl stop wpa_supplicant 2>/dev/null || true
  sudo systemctl restart NetworkManager
  sleep 4
  nmcli networking wait 2>/dev/null || true
}

# sudo ortamında AP_NONINTERACTIVE sık sık düşer; --yes en güvenilir yöntem.
if [[ "${AP_NONINTERACTIVE:-}" != "1" && "${1:-}" != "--yes" ]]; then
  echo "=========================================="
  echo "  DİKKAT: Bu işlem çoğu kurulumda"
  echo "  ev WiFi istemcisini kapatır."
  echo "  Ethernet yoksa SSH/Tailscale KESİLİR."
  echo "  Devam için Enter, iptal için Ctrl+C"
  echo "  (otomasyon: sudo $0 --yes  veya  sudo env AP_NONINTERACTIVE=1 $0)"
  echo "=========================================="
  read -r _
fi

if ! command -v nmcli >/dev/null 2>&1; then
  echo "nmcli yok. Kurulum: sudo apt install network-manager"
  exit 1
fi

echo "Önceki kablosuz bağlantı adı yedekleniyor (şifre kaydedilmez)..."
nmcli -t -f NAME,TYPE connection show | grep -E ':802-11-wireless$' | cut -d: -f1 > /tmp/cyclewatch-wifi-con-names.txt || true

sudo rfkill unblock wifi 2>/dev/null || true
sudo iw reg set "$AP_COUNTRY" 2>/dev/null || true

sudo nmcli device disconnect wlan0 2>/dev/null || true
sudo nmcli connection delete "$CON_NAME" 2>/dev/null || true

echo "Hotspot oluşturuluyor: SSID=$AP_SSID"

create_ap_profile() {
  sudo nmcli connection add type wifi ifname wlan0 con-name "$CON_NAME" autoconnect no \
    ssid "$AP_SSID" \
    wifi.mode ap wifi.band bg \
    802-11-wireless.channel "$AP_CHANNEL" \
    ipv4.method shared ipv6.method ignore \
    wifi-sec.key-mgmt wpa-psk \
    wifi-sec.psk "$AP_PASSWORD"
}

if ! create_ap_profile; then
  echo "Not: 'connection add' bu sürümde reddedildi; nmcli hotspot alt komutu deneniyor..."
  sudo nmcli device wifi hotspot ifname wlan0 con-name "$CON_NAME" ssid "$AP_SSID" password "$AP_PASSWORD"
fi

# Başka kayıtlı WiFi profilleri (ör. telefon hotspot'una istemci) wlan0'ı çalıp 802.1X / şifre bekleyebilir.
while IFS= read -r other || [[ -n "${other:-}" ]]; do
  [[ -z "${other:-}" || "$other" == "$CON_NAME" ]] && continue
  sudo nmcli connection modify "$other" connection.autoconnect no 2>/dev/null || true
done < /tmp/cyclewatch-wifi-con-names.txt

# NM bazen profilde 802-1x veya kurumsal güvenlik satırı bırakır; AP için WPA-PSK + 802-1x kaldır.
strip_enterprise_wifi() {
  sudo nmcli connection modify "$CON_NAME" remove 802-1x 2>/dev/null || true
  sudo nmcli connection modify "$CON_NAME" \
    802-11-wireless.mode ap \
    802-11-wireless-security.key-mgmt wpa-psk \
    802-11-wireless-security.psk "$AP_PASSWORD" 2>/dev/null || true
  sudo nmcli connection modify "$CON_NAME" \
    wifi-sec.key-mgmt wpa-psk \
    wifi-sec.psk "$AP_PASSWORD" 2>/dev/null || true
}
strip_enterprise_wifi

# brcmfmac + NM: WPA-PSK-SHA256 bazen AP'de takılır; WPA2-CCMP tercih et.
if is_raspberry_pi; then
  sudo nmcli connection modify "$CON_NAME" 802-11-wireless-security.proto rsn 2>/dev/null || true
  sudo nmcli connection modify "$CON_NAME" 802-11-wireless-security.pairwise ccmp 2>/dev/null || true
  sudo nmcli connection modify "$CON_NAME" 802-11-wireless-security.group ccmp 2>/dev/null || true
fi

fix_nm_wpa_conflict

sudo nmcli device disconnect wlan0 2>/dev/null || true
if ! sudo nmcli connection up "$CON_NAME" ifname wlan0; then
  sudo nmcli connection up "$CON_NAME"
fi

sleep 2
if command -v iw >/dev/null 2>&1; then
  sudo iw dev wlan0 set power_save off 2>/dev/null || true
fi

echo ""
echo "--- wlan0 (AP modu olmalı) ---"
IWINFO=""
if command -v iw >/dev/null 2>&1; then
  IWINFO=$(iw dev wlan0 info 2>/dev/null || true)
  echo "$IWINFO"
fi
if echo "$IWINFO" | grep -q "type AP"; then
  echo "OK: wlan0 erişim noktası (AP) modunda."
else
  echo "Uyarı: wlan0 hâlâ AP gibi görünmüyor. 'sudo journalctl -u NetworkManager -b | tail -40' çıktısına bakın."
fi

echo ""
echo "--- wlan0 IPv4 (tarayıcıda bunu kullan) ---"
IP=$(ip -4 -o addr show wlan0 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -1)
if [ -n "${IP:-}" ]; then
  echo "Panel: http://${IP}:5173"
fi
ip -4 addr show wlan0

echo ""
echo "Telefon: WiFi '$AP_SSID' / parola: (enable-ap.sh içinde veya AP_PASSWORD ile verdiğin)"
echo "Geri dönmek için: sudo ~/cycle-watch-ai/pi/ap-mode/disable-ap.sh"
