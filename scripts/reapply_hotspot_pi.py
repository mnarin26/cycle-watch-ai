# -*- coding: utf-8 -*-
"""Sadece nm-ap-only-visible-ssid.sh yükle + hotspot (kablo SSH)."""
import os
import sys

import paramiko

HOST = os.environ.get("PI_HOST", "192.168.50.1")
USER = "pi"
PASSWORD = os.environ.get("PI_SSH_PASSWORD", "").strip()
REMOTE_SH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"


def repo_root():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(here)


def main() -> int:
    if not PASSWORD:
        print("PI_SSH_PASSWORD ortam değişkenini ayarlayın.", file=sys.stderr)
        return 1
    root = repo_root()
    local = os.path.join(root, "pi", "network-profile", "nm-ap-only-visible-ssid.sh")
    remote = "/home/pi/cycle-watch-ai/pi/network-profile/nm-ap-only-visible-ssid.sh"
    pw_esc = PASSWORD.replace("'", "'\"'\"'")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=25, allow_agent=False, look_for_keys=False)
    sftp = c.open_sftp()
    sftp.put(local, remote)
    sftp.close()

    prefix = f"export PATH={REMOTE_SH}; "
    cmd = (
        f"chmod +x {remote}; sleep 1; rfkill unblock wifi || true; sleep 2; "
        f"echo '{pw_esc}' | sudo -S -E env CW_SKIP_CONFIRM=1 CW_AP_SSID=pi-wifi CW_AP_PASSWORD=123456789 "
        f"bash {remote}"
    )
    _, o, e = c.exec_command(prefix + cmd, timeout=180)
    print(o.read().decode(errors="replace")[-12000:])
    err = e.read().decode(errors="replace")
    if err.strip():
        print("stderr:", err[-4000:])
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
