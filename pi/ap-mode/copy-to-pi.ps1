# Pi'ye enable-ap.sh ve disable-ap.sh kopyalar. OpenSSH (scp/ssh) gerekir.
# Kullanım: .\copy-to-pi.ps1
# İlk bağlantıda host key sorulursa "yes" deyin; şifre istenirse pi kullanıcı parolasını girin.

param(
    [string] $PiHost = "192.168.50.1",
    [string] $PiUser = "pi",
    [string] $RemoteDir = "~/cycle-watch-ai/pi/ap-mode"
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$files = @(
    (Join-Path $here "enable-ap.sh")
    (Join-Path $here "disable-ap.sh")
    (Join-Path $here "enable-ap-hostapd.sh")
    (Join-Path $here "disable-ap-hostapd.sh")
)
foreach ($f in $files) {
    if (-not (Test-Path $f)) { throw "Dosya yok: $f" }
}

# Windows CRLF -> LF (aksi halde Pi'de: sudo: unable to execute ... No such file or directory)
$tempDir = Join-Path $env:TEMP ("copy-to-pi-" + [Guid]::NewGuid().ToString("n").Substring(0, 8))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$upload = @()
try {
    foreach ($f in $files) {
        $name = Split-Path $f -Leaf
        $out = Join-Path $tempDir $name
        $text = [System.IO.File]::ReadAllText($f)
        $text = $text -replace "`r`n", "`n" -replace "`r", "`n"
        [System.IO.File]::WriteAllText($out, $text, $utf8NoBom)
        $upload += $out
    }

    $target = "${PiUser}@${PiHost}:${RemoteDir}/"
    Write-Host "Uzak klasor olusturuluyor: $RemoteDir"
    ssh "${PiUser}@${PiHost}" "mkdir -p $RemoteDir"
    Write-Host "Kopyalaniyor (LF) -> $target"
    scp $upload $target
    Write-Host "Tamam. Pi'de: chmod +x $RemoteDir/*.sh"
}
finally {
    Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
