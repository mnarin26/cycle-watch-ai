#!/bin/bash
# hostapd AP'yi kaldırır; wlan0'ı yeniden NetworkManager'a verir.
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  exec sudo -E env "PATH=/usr/sbin:/sbin:/usr/bin:/bin:${PATH:-}" "$0" "$@"
fi

NM_DROPIN="/etc/NetworkManager/conf.d/99-cyw-unmanage-wlan0.conf"
HOSTAPD_CONF="/etc/hostapd/hostapd.conf"
HOSTAPD_CONF_BAK="/etc/hostapd/hostapd.conf.bak.cyw"
DNSMASQ_FRAG="/etc/dnsmasq.d/cycle-watch-ap.conf"

systemctl disable hostapd 2>/dev/null || true
systemctl stop hostapd 2>/dev/null || true
ip addr flush dev wlan0 2>/dev/null || true
ip link set wlan0 down 2>/dev/null || true

rm -f "$NM_DROPIN" "$DNSMASQ_FRAG"
rm -f /etc/hostapd/hostapd-cyw.conf

if [[ -f "$HOSTAPD_CONF_BAK" ]]; then
  cp -a "$HOSTAPD_CONF_BAK" "$HOSTAPD_CONF"
  rm -f "$HOSTAPD_CONF_BAK"
fi

if [[ -f /etc/default/hostapd.bak.cyw ]]; then
  cp -a /etc/default/hostapd.bak.cyw /etc/default/hostapd
  rm -f /etc/default/hostapd.bak.cyw
fi

systemctl reload NetworkManager
sleep 2
systemctl restart dnsmasq 2>/dev/null || true

systemctl unmask wpa_supplicant 2>/dev/null || true
systemctl start wpa_supplicant 2>/dev/null || true

if ! command -v nmcli >/dev/null 2>&1; then
  echo "nmcli yok; wlan0 elle yönetin."
  exit 0
fi

echo ""
echo "Ev WiFi'sine yeniden bağlan:"
read -r -p "SSID: " HOME_SSID
read -r -s -p "Parola: " HOME_PASS
echo ""

nmcli device wifi connect "$HOME_SSID" password "$HOME_PASS" ifname wlan0

echo ""
echo "Kontrol: nmcli dev status && ip -4 addr show wlan0"
