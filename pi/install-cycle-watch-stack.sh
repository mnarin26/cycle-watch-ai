#!/bin/bash
# Pi'de bir kez (Ethernet ile): tam yığın — AP + analiz (5173) + yönetici (5274)
# Kullanım: sudo ./install-cycle-watch-stack.sh
set -euo pipefail

REPO="${REPO:-/home/pi/cycle-watch-ai}"
if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Bu betiği sudo ile çalıştırın."
  exit 1
fi

if [[ ! -d "$REPO/pi/systemd" ]]; then
  echo "Dizin yok: $REPO/pi/systemd — REPO yolunu kontrol edin."
  exit 1
fi

if ! su - pi -s /bin/bash -c 'command -v npm' >/dev/null 2>&1; then
  echo "Uyarı: 'pi' kullanıcısında npm bulunamadı. Node.js kurun (ör. nodesource veya apt)."
fi

chmod +x "$REPO/pi/ap-mode/enable-ap-hostapd.sh" "$REPO/pi/ap-mode/disable-ap-hostapd.sh" 2>/dev/null || true

install -m0644 "$REPO/pi/systemd/cycle-watch-ap.service" /etc/systemd/system/
install -m0644 "$REPO/pi/systemd/cycle-watch-analysis.service" /etc/systemd/system/
install -m0644 "$REPO/pi/systemd/cycle-watch-admin.service" /etc/systemd/system/

systemctl daemon-reload

systemctl enable cycle-watch-ap.service
systemctl enable cycle-watch-analysis.service
systemctl enable cycle-watch-admin.service

systemctl restart cycle-watch-ap.service
systemctl restart cycle-watch-analysis.service
systemctl restart cycle-watch-admin.service

echo ""
echo "Kurulum tamam."
echo "  Kablo (Ethernet):   http://192.168.50.1:5274  yönetici"
echo "  Hotspot (pi-wifi):   http://192.168.4.1:5173  analiz (varsayılan AP IP)"
echo ""
echo "Durum: systemctl status cycle-watch-ap cycle-watch-analysis cycle-watch-admin"
echo "Loglar: journalctl -u cycle-watch-analysis -f"
