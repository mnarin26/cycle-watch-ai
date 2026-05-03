#!/bin/bash
# NetworkManager yerine hostapd + dnsmasq (Pi / brcmfmac'ta NM hotspot çoğu zaman takılır).
# Ethernet açıkken çalıştırın. wlan0 geçici olarak NetworkManager dışına alınır.
# Root gerekir; pi kullanıcısından çalıştırılırsa sudo ile kendini yükseltir.
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  exec sudo -E env "PATH=/usr/sbin:/sbin:/usr/bin:/bin:${PATH:-}" "$0" "$@"
fi

export PATH="/usr/sbin:/sbin:/usr/bin:/bin:${PATH:-}"
export DEBIAN_FRONTEND=noninteractive

AP_SSID="${AP_SSID:-pi-wifi}"
AP_PASSWORD="${AP_PASSWORD:-123456789}"
AP_COUNTRY="${AP_COUNTRY:-TR}"
AP_CHANNEL="${AP_CHANNEL:-6}"
AP_ADDR="${AP_ADDR:-192.168.4.1/24}"
# Ağ 192.168.4.0/24 varsayılır
DHCP_START="${DHCP_START:-192.168.4.2}"
DHCP_END="${DHCP_END:-192.168.4.100}"

NM_DROPIN="/etc/NetworkManager/conf.d/99-cyw-unmanage-wlan0.conf"
# Debian systemd: ConditionFileNotEmpty=/etc/hostapd/hostapd.conf — özel isim kullanılamaz.
HOSTAPD_CONF="/etc/hostapd/hostapd.conf"
HOSTAPD_CONF_BAK="/etc/hostapd/hostapd.conf.bak.cyw"
DNSMASQ_FRAG="/etc/dnsmasq.d/cycle-watch-ap.conf"
HOSTAPD_DEFAULT_BAK="/etc/default/hostapd.bak.cyw"

if [[ "${AP_NONINTERACTIVE:-}" != "1" && "${1:-}" != "--yes" ]]; then
  echo "Ethernet yoksa SSH kesilebilir. Devam: Enter / iptal: Ctrl+C"
  echo "(Otomasyon: $0 --yes)"
  read -r _
fi

if ((${#AP_PASSWORD} < 8 || ${#AP_PASSWORD} > 63)); then
  echo "AP_PASSWORD 8–63 karakter olmalı (WPA-PSK)."
  exit 1
fi

for pkg in hostapd dnsmasq; do
  if ! dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q 'install ok installed'; then
    echo "Kuruluyor: $pkg"
    apt-get update -qq
    apt-get install -y "$pkg"
  fi
done

rfkill unblock wifi 2>/dev/null || true
iw reg set "$AP_COUNTRY" 2>/dev/null || true

echo "wlan0 NetworkManager'dan çıkarılıyor..."
tee "$NM_DROPIN" >/dev/null <<EOF
[keyfile]
unmanaged-devices=interface-name:wlan0
EOF
systemctl reload NetworkManager
sleep 2

systemctl stop wpa_supplicant 2>/dev/null || true
nmcli device disconnect wlan0 2>/dev/null || true
sleep 1

if [[ -f "$HOSTAPD_CONF" ]] && [[ ! -f "$HOSTAPD_CONF_BAK" ]]; then
  cp -a "$HOSTAPD_CONF" "$HOSTAPD_CONF_BAK"
fi
# Eski betik sürümünden kalan dosya
rm -f /etc/hostapd/hostapd-cyw.conf

tee "$HOSTAPD_CONF" >/dev/null <<EOF
interface=wlan0
driver=nl80211
ssid=${AP_SSID}
hw_mode=g
channel=${AP_CHANNEL}
country_code=${AP_COUNTRY}
ieee80211n=1
wmm_enabled=1
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${AP_PASSWORD}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=CCMP
rsn_pairwise=CCMP
EOF
chmod 600 "$HOSTAPD_CONF"

if [[ -f /etc/default/hostapd ]] && [[ ! -f "$HOSTAPD_DEFAULT_BAK" ]]; then
  cp -a /etc/default/hostapd "$HOSTAPD_DEFAULT_BAK"
fi
if [[ -f /etc/default/hostapd ]]; then
  sed -i "s|^#*DAEMON_CONF=.*|DAEMON_CONF=\"$HOSTAPD_CONF\"|" /etc/default/hostapd
  if ! grep -q "^DAEMON_CONF=" /etc/default/hostapd; then
    echo "DAEMON_CONF=\"$HOSTAPD_CONF\"" | tee -a /etc/default/hostapd >/dev/null
  fi
else
  printf '%s\n' "DAEMON_CONF=\"$HOSTAPD_CONF\"" | tee /etc/default/hostapd >/dev/null
fi

tee "$DNSMASQ_FRAG" >/dev/null <<EOF
# cycle-watch-ap: sadece DHCP (DNS kapalı)
port=0
interface=wlan0
bind-interfaces
dhcp-range=${DHCP_START},${DHCP_END},255.255.255.0,12h
dhcp-option=3,$(echo "$AP_ADDR" | cut -d/ -f1)
EOF

ip link set wlan0 up
ip addr flush dev wlan0 2>/dev/null || true
ip addr add "$AP_ADDR" dev wlan0

systemctl unmask hostapd 2>/dev/null || true
systemctl enable hostapd dnsmasq
systemctl restart hostapd
systemctl restart dnsmasq

sleep 2
if ! systemctl is-active --quiet hostapd; then
  echo "hostapd başlamadı. Son log:"
  journalctl -u hostapd -n 40 --no-pager
  exit 1
fi
echo ""
echo "--- durum ---"
systemctl is-active hostapd dnsmasq || true
iw dev wlan0 info 2>/dev/null || true
ip -4 addr show wlan0

GW="${AP_ADDR%%/*}"
echo ""
echo "Panel (örnek): http://${GW}:5173"
echo "Kapatmak: ~/cycle-watch-ai/pi/ap-mode/disable-ap-hostapd.sh (root veya sudo)"
