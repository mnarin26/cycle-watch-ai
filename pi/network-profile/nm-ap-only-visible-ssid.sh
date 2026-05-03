#!/bin/bash
# Pi yalnızca kendi SSID'sini yayınlar (NetworkManager hotspot). Başka ağlara STA ile bağlanmaz denemesi.
# SSID varsayılan olarak görünür (gizli değil).

set -euo pipefail

SSID="${CW_AP_SSID:-pi-wifi}"
PASSWORD="${CW_AP_PASSWORD:-123456789}"
CON_NAME="${CW_AP_CON:-pi-wifi-ap}"

if ! command -v nmcli >/dev/null 2>&1; then
  echo "nmcli yok."
  exit 1
fi

echo "==========================================="
echo "Tüm aktif kablosuz *istemci* bağlantılarını kapatmayı öneriyoruz,"
echo "ardından yalnızca hotspot oluşturulacak."
echo "Ethernet (SSH) açık olsun."
if [ "${CW_SKIP_CONFIRM:-}" = "1" ]; then
  echo "CW_SKIP_CONFIRM=1 — etkileşimsiz devam."
else
  echo "Devam için Enter:"
  read -r _
fi

sudo nmcli device disconnect wlan0 2>/dev/null || true

# Otomatik bağlanmayı kapatan profiller - istemci ağları için
while IFS= read -r UUID; do
  [ -z "$UUID" ] && continue
  sudo nmcli connection modify "$UUID" connection.autoconnect no || true
done < <(nmcli -t -f UUID,TYPE connection show | awk -F: '$2~/^802-11-wireless/ {print $1}')

# Eski profil / AP
sudo nmcli connection delete "$CON_NAME" 2>/dev/null || true

# `nmcli device wifi hotspot` bazı Kart/NM kombinasyonlarında 802.1X supplicant zaman aşımına düşebilir;
# doğrudan `connection add … wifi.mode ap` tercih edilir.
sudo nmcli device set wlan0 managed yes || true

NM_ADD_OK=false
if sudo nmcli connection add type wifi ifname wlan0 con-name "$CON_NAME" \
  autoconnect yes ipv4.method shared ipv6.method ignore \
  wifi.ssid "$SSID" wifi.mode ap \
  wifi-sec.key-mgmt wpa-psk wifi-sec.psk "$PASSWORD" 2>/dev/null; then
  NM_ADD_OK=true
fi

if [ "$NM_ADD_OK" != "true" ]; then
  echo "Deneme: klasik wlan.* property isimleri..."
  sudo nmcli connection delete "$CON_NAME" 2>/dev/null || true
  if sudo nmcli connection add type wifi ifname wlan0 con-name "$CON_NAME" \
    autoconnect yes ipv4.method shared ipv6.method ignore \
    802-11-wireless.ssid "$SSID" 802-11-wireless.mode ap \
    802-11-wireless-security.key-mgmt wpa-psk 802-11-wireless-security.psk "$PASSWORD" 2>/dev/null; then
    NM_ADD_OK=true
  fi
fi

if [ "$NM_ADD_OK" != "true" ]; then
  echo "Son çare: nmcli hotspot kısayolu..."
  sudo nmcli connection delete "$CON_NAME" 2>/dev/null || true
  if sudo nmcli device wifi hotspot ifname wlan0 con-name "$CON_NAME" ssid "$SSID" password "$PASSWORD"; then
    NM_ADD_OK=true
  fi
fi

if [ "$NM_ADD_OK" != "true" ]; then
  echo "Hata: AP profili oluşturulamadı (wlan sürücüsü/NM çıktısı yukarıda)." >&2
  exit 1
fi

sudo nmcli connection up "$CON_NAME"

echo ""
echo "Hotspot aktif."
echo "SSID (görünür): $SSID"
ip -4 addr show wlan0
echo ""
echo "Firewall uygulanmadıysa yöneticiyi kabloyla kullanın."
