#!/bin/bash
# Wi-Fi (wlan0): DHCP/DNS + 5173 + 5274; diğer portlar düşer.
# Ethernet (eth0, enx…): wlan0 dışı tüm yüzler kabul — Pi predictive isimlerinde kablo SSH çalışır.
# Yükleme PATH sorunlarında: sudo /usr/sbin/nft -f "$(dirname "$0")/cyclewatch-fw.nft"

set -euo pipefail

RULES="$(dirname "$0")/cyclewatch-fw.nft"
export PATH="/usr/sbin:/sbin:/usr/bin:/bin:$PATH"

if [ "$(id -u)" -ne 0 ]; then
  echo "Çalıştır: sudo $0"
  exit 1
fi

if ! command -v nft >/dev/null 2>&1; then
  apt-get update && apt-get install -y nftables
fi

nft delete table inet cyclewatch-fw 2>/dev/null || true
nft -f "$RULES"

echo "Kurallar yüklendi. Kontrol:"
nft list table inet cyclewatch-fw
