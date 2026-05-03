# -*- coding: utf-8 -*-
"""Ethernet SSH: push pi/network-profile to Pi + optional nft reload."""
import os
import sys

import paramiko

HOST = os.environ.get("PI_HOST", "192.168.50.1")
USER = "pi"
PASSWORD = os.environ.get("PI_SSH_PASSWORD", "").strip()
APPLY_NFT = os.environ.get("PI_APPLY_NFT", "1") not in ("0", "false", "no")


def repo_root():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(here)


def main() -> int:
    if not PASSWORD:
        print("PI_SSH_PASSWORD ortam değişkenini ayarlayın.", file=sys.stderr)
        return 1
    root = repo_root()
    np = os.path.join(root, "pi", "network-profile")
    remote = "/home/pi/cycle-watch-ai/pi/network-profile"
    pw_esc = PASSWORD.replace("'", "'\"'\"'")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=25, allow_agent=False, look_for_keys=False)

    _, _, _ = c.exec_command(f"mkdir -p {remote}", timeout=15)
    sftp = c.open_sftp()
    for fname in sorted(os.listdir(np)):
        lp = os.path.join(np, fname)
        if os.path.isfile(lp):
            sftp.put(lp, f"{remote}/{fname}")
            print("uploaded", fname)
    sftp.close()

    prefix = "export PATH=/usr/local/bin:/usr/bin:/bin; "
    if APPLY_NFT:
        cmd = (
            prefix
            + f"echo '{pw_esc}' | sudo -S chmod +x {remote}/*.sh && "
            + f"echo '{pw_esc}' | sudo -S bash {remote}/nft-cyclewatch-firewall.sh"
        )
        _, out, err = c.exec_command(cmd, timeout=120)
        print(out.read().decode(errors="replace"))
        emsg = err.read().decode(errors="replace")
        if emsg.strip():
            print("stderr:", emsg[-2500:])
    else:
        _, _, _ = c.exec_command(f"{prefix}chmod +x {remote}/*.sh", timeout=15)
        print("PI_APPLY_NFT=0: sadece dosyalar kopyalandı (nft çalıştırılmadı).")

    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
