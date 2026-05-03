#!/usr/bin/env python3
"""Tek seferlik Faz A: Pi'ye ADMIN_BIND_ADDRESS=0.0.0.0 ve nft wlan0 5274 yükler."""

import os
import subprocess
import sys
from pathlib import Path
from typing import Tuple

import paramiko

DEFAULT_PI_HOST = os.environ.get("PI_HOST", "192.168.50.1")
DEFAULT_PI_USER = os.environ.get("PI_USER", "pi")

REPO = Path(__file__).resolve().parents[1]
LOCAL_SVC = REPO / "systemd" / "cycle-watch-admin.service"
LOCAL_NFT = REPO / "network-profile" / "cyclewatch-fw.nft"


def run(ssh: paramiko.SSHClient, cmd: str) -> Tuple[int, str, str]:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    return stdout.channel.recv_exit_status(), out, err


def main(argv=None) -> int:
    argv = argv if argv is not None else sys.argv
    pi_pass = os.environ.get("PI_SSH_PASSWORD", "").strip()
    if len(argv) >= 2:
        pi_pass = argv[1]
    if not pi_pass:
        print(
            "Parola: PI_SSH_PASSWORD ortamı veya: python _apply_phase_a_pi.py <şifre>",
            file=sys.stderr,
        )
        return 1
    if not LOCAL_SVC.is_file() or not LOCAL_NFT.is_file():
        print("Eksik dosya:", LOCAL_SVC, LOCAL_NFT, file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        c.connect(
            DEFAULT_PI_HOST,
            username=DEFAULT_PI_USER,
            password=pi_pass,
            timeout=15,
            allow_agent=False,
        )
    except Exception as e:
        print("SSH bağlanamadı:", e, file=sys.stderr)
        return 1

    print("=== preflight ===")
    code, o, e = run(
        c,
        "ip -4 -br a; echo ---; systemctl is-active cycle-watch-admin cycle-watch-analysis 2>/dev/null || true;"
        " echo ---; ss -tlnp 2>/dev/null | grep -E '5173|5274' || true;"
        " echo ---; sudo -n true 2>/dev/null && echo sudo_nopass || echo sudo_needs_pw",
    )
    print(o, e, sep="")

    sftp = c.open_sftp()
    remote_svc = "/tmp/cycle-watch-admin.service.phase-a"
    sftp.put(str(LOCAL_SVC), remote_svc)
    sftp.close()

    sudo = f"echo {pi_pass} | sudo -S "
    cmds = [
        sudo + "cp -a /etc/systemd/system/cycle-watch-admin.service /etc/systemd/system/cycle-watch-admin.service.bak.phase-a 2>/dev/null || true",
        sudo + f"install -m 644 {remote_svc} /etc/systemd/system/cycle-watch-admin.service",
        sudo + "systemctl daemon-reload",
        sudo + "systemctl restart cycle-watch-admin",
    ]

    for cmd in cmds:
        code, o, e = run(c, cmd)
        print(">>", cmd[:60], "...")
        if o:
            print(o)
        if e:
            print(e, file=sys.stderr)
        if code != 0:
            print("Uyarı çıkış kodu:", code, file=sys.stderr)

    code, o, e = run(
        c,
        "ss -tlnp 2>/dev/null | grep -E '5173|5274' || true",
    )
    print("=== servis yeniden başlatıldı (ss) ===\n", o, e, sep="")

    c.close()
    nft_reload = Path(__file__).resolve().parent / "_nft_reload_pi.py"
    print("=== nft (yeniden SSH) ===")
    r = subprocess.run([sys.executable, str(nft_reload), pi_pass], check=False)
    print("Bitti.")
    return r.returncode if r.returncode != 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
