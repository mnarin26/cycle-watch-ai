import os
import sys
from pathlib import Path
from typing import Tuple

import paramiko

HOST = os.environ.get("PI_HOST", "192.168.50.1")
_HERE = Path(__file__).resolve().parent
_REPO_NFT = _HERE.parent / "network-profile" / "cyclewatch-fw.nft"


def main() -> int:
    pw = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PI_SSH_PASSWORD", "")).strip()
    if not pw:
        print("Kullanım: python _nft_reload_pi.py <parola>", file=sys.stderr)
        return 1
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="pi", password=pw, timeout=15, allow_agent=False)

    nft_path = "/home/pi/cycle-watch-ai/pi/network-profile/cyclewatch-fw.nft"

    if _REPO_NFT.is_file():
        sftp = c.open_sftp()
        sftp.put(str(_REPO_NFT), nft_path)
        sftp.close()
        print("Yerel NFT Pi'ye yazildi:", _REPO_NFT)
    nf = "/usr/sbin/nft"

    def sudo_one(remote_cmd: str) -> Tuple[int, bytes, bytes]:
        stdin, stdout, stderr = c.exec_command(remote_cmd, get_pty=True)
        stdin.write(pw + "\n")
        stdin.flush()
        stdin.channel.shutdown_write()
        out = stdout.read()
        err = stderr.read()
        return stdout.channel.recv_exit_status(), out, err

    x, _, e = sudo_one(
        "sudo -S sed -i 's/\\r$//' " + nft_path,
    )
    print("sed exit", x, e.decode("utf-8", "replace"))

    x, o, e = sudo_one(
        f"sudo -S {nf} delete table inet cyclewatch-fw",
    )
    print("nft delete exit (yoksa hata normal)", x)
    sys.stdout.buffer.write(o)
    sys.stdout.buffer.write(e)

    xload, o, e = sudo_one(f"sudo -S {nf} -f {nft_path}")
    print("nft -f exit", xload)
    sys.stdout.buffer.write(o)
    sys.stdout.buffer.write(e)

    x, o, e = sudo_one(f"sudo -S {nf} list table inet cyclewatch-fw")
    print("nft list exit", x)
    sys.stdout.buffer.write(o)
    sys.stdout.buffer.write(e)

    _, o2, _ = sudo_one("ss -tlnp 2>/dev/null | grep -E ':5173|:5274' || true")
    print("\n=== ss ===")
    sys.stdout.buffer.write(o2)

    c.close()
    return 0 if xload == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
