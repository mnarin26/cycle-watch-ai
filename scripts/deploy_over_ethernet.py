# -*- coding: utf-8 -*-
"""
Pi’ye kabloyla tam senkron: admin panel + network-profile + nft + systemd
+ hotspot (pi-wifi) etkileşimsiz ortam ile.

Çalıştır: PC’den Ethernet bağlıyken
  python scripts/deploy_over_ethernet.py

Ortam: PI_HOST PI_SSH_PASSWORD PI_APPLY_NFT (1/0) PI_RUN_HOTSPOT (1/0)
"""
import os
import sys

import paramiko

HOST = os.environ.get("PI_HOST", "192.168.50.1")
USER = "pi"
PASSWORD = os.environ.get("PI_SSH_PASSWORD", "").strip()
APPLY_NFT = os.environ.get("PI_APPLY_NFT", "1") not in ("0", "false", "no")
RUN_HOTSPOT = os.environ.get("PI_RUN_HOTSPOT", "1") not in ("0", "false", "no")

REMOTE_SH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"


def repo_root():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(here)


def main() -> int:
    if not PASSWORD:
        print("PI_SSH_PASSWORD ortam değişkenini ayarlayın.", file=sys.stderr)
        return 1
    root = repo_root()
    remote = "/home/pi/cycle-watch-ai"
    np_remote = f"{remote}/pi/network-profile"
    pw_esc = PASSWORD.replace("'", "'\"'\"'")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=25, allow_agent=False, look_for_keys=False)

    prefix = f"export PATH={REMOTE_SH}; "

    _, _, _ = c.exec_command(
        f"mkdir -p {remote}/admin-panel/src {remote}/pi/network-profile {remote}/src/lib",
        timeout=15,
    )

    sftp = c.open_sftp()
    adm = os.path.join(root, "admin-panel")
    for leaf in ["vite.config.ts", "tsconfig.json", "index.html", "README.md"]:
        sftp.put(os.path.join(adm, leaf), f"{remote}/admin-panel/{leaf}")
    for fname in os.listdir(os.path.join(adm, "src")):
        lp = os.path.join(adm, "src", fname)
        if os.path.isfile(lp):
            sftp.put(lp, f"{remote}/admin-panel/src/{fname}")
            print("uploaded admin-panel/src/", fname)

    np_local = os.path.join(root, "pi", "network-profile")
    for fname in sorted(os.listdir(np_local)):
        lp = os.path.join(np_local, fname)
        if os.path.isfile(lp):
            sftp.put(lp, f"{np_remote}/{fname}")
            print("uploaded pi/network-profile/", fname)

    for rel in [
        "package.json",
        "src/styles.css",
        "pi/systemd/cycle-watch-admin.service",
        "src/lib/network-test-mode.ts",
    ]:
        lp = os.path.join(root, rel.replace("/", os.sep))
        sftp.put(lp, f"{remote}/{rel.replace(chr(92), '/')}")
        print("uploaded", rel)
    sftp.close()

    _, out, err = c.exec_command(
        prefix + f"chmod +x {np_remote}/*.sh 2>/dev/null || true; cd {remote} && npm install 2>&1",
        timeout=600000,
    )
    npm_log = out.read().decode(errors="replace")
    print(npm_log[-4000:])
    ere = err.read().decode(errors="replace")
    if ere.strip():
        print("npm stderr:", ere[-1500:])

    run_parts = [
        f"echo '{pw_esc}' | sudo -S -E cp {remote}/pi/systemd/cycle-watch-admin.service /etc/systemd/system/",
        f"echo '{pw_esc}' | sudo -S -E systemctl daemon-reload",
        f"echo '{pw_esc}' | sudo -S -E systemctl enable cycle-watch-admin",
        f"echo '{pw_esc}' | sudo -S -E systemctl restart cycle-watch-admin",
        f"echo '{pw_esc}' | sudo -S -E systemctl restart cycle-watch-ai",
    ]
    if APPLY_NFT:
        run_parts.append(f"echo '{pw_esc}' | sudo -S -E bash {np_remote}/nft-cyclewatch-firewall.sh")
    run_parts.extend(
        [
            "sleep 3",
            "ss -tlnp | grep -E '5173|5274' || true",
            "systemctl is-active cycle-watch-ai cycle-watch-admin || true",
        ]
    )
    systemd = "; ".join(run_parts)
    _, o2, e2 = c.exec_command(prefix + systemd, timeout=180)
    print(o2.read().decode(errors="replace"))
    emsg = e2.read().decode(errors="replace")
    if emsg.strip():
        print("systemd/nft stderr:", emsg[-2000:])

    if RUN_HOTSPOT:
        # NM bazen ilk denemede 802.1X/supplicant zaman aşımı veriyor — rfkill + kısa bekleme + ilk başarısızsa bir tekrar
        hotspot_attempt = (
            f"sleep 2; rfkill unblock wifi || true; sleep 2; "
            f"echo '{pw_esc}' | sudo -S -E env CW_SKIP_CONFIRM=1 CW_AP_SSID=pi-wifi CW_AP_PASSWORD=123456789 "
            f"bash {np_remote}/nm-ap-only-visible-ssid.sh || "
            f"(echo yeniden_deneme...; sleep 4; rfkill unblock wifi || true; sleep 2; "
            f"echo '{pw_esc}' | sudo -S -E env CW_SKIP_CONFIRM=1 CW_AP_SSID=pi-wifi CW_AP_PASSWORD=123456789 "
            f"bash {np_remote}/nm-ap-only-visible-ssid.sh)"
        )
        _, o3, e3 = c.exec_command(prefix + hotspot_attempt, timeout=180)
        ho = o3.read().decode(errors="replace")
        he = e3.read().decode(errors="replace")
        print("--- hotspot ---\n", ho[-8000:])
        if he.strip():
            print("hotspot stderr:", he[-3500:])
    else:
        print("PI_RUN_HOTSPOT=0 — hotspot komutu çalıştırılmadı.")

    c.close()
    print(f"\nAna UI (eth): http://{HOST}:5173  Admin: http://{HOST}:5274")
    print("Wi-Fi analiz adresi için admin panelde \"Kablosuz analiz adresi\" kutusuna bak.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
