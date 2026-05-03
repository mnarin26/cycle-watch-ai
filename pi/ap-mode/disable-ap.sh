#!/bin/bash
# AP hotspot'u kapatır; ev WiFi'sine yeniden bağlanmanı ister.
set -euo pipefail

CON_NAME="${CON_NAME:-pi-wifi-ap}"

if ! command -v nmcli >/dev/null 2>&1; then
  echo "nmcli bulunamadı."
  exit 1
fi

if nmcli -t -f NAME connection show | grep -qx "$CON_NAME"; then
  echo "Bağlantı kapatılıyor: $CON_NAME"
  sudo nmcli connection down "$CON_NAME" 2>/dev/null || true
  sudo nmcli connection delete "$CON_NAME" 2>/dev/null || true
else
  echo "Uyarı: $CON_NAME bulunamadı (zaten kapalı olabilir)."
fi

echo ""
echo "Ev WiFi'sine yeniden bağlan:"
read -r -p "SSID: " HOME_SSID
read -r -s -p "Parola: " HOME_PASS
echo ""

sudo nmcli device wifi connect "$HOME_SSID" password "$HOME_PASS" ifname wlan0

# AP betiği wpa_supplicant servisini durdurmuş olabilir; istemci modu için tekrar aç.
sudo systemctl start wpa_supplicant 2>/dev/null || true

echo ""
echo "Bağlantı denendi. Kontrol: nmcli dev status && ip -4 addr show wlan0"
