# Ethernet yönetici paneli

Ana Cycle Watch arayüzünden bağımsız, **aynı tasarım token’ları** ile küçük bir Vite + React yüzüdür.

## Önemli: Nerede dinler?

`admin-panel/vite.config.ts` varsayılan olarak:

- **Adres:** `192.168.50.1` (`ADMIN_BIND_ADDRESS`)
- **Port:** `5274` (`ADMIN_PORT`)

Sunucu **yalnızca bu adresi** kullanarak dinlediği için, Wi‑Fi arayüzünün IP’sinden (örn. `192.168.x.x`) bu porta doğrudan istek yapılamaz — OS seviyesinde o soketi açan süreç sadece Ethernet IP’sidir.

> Adresi değiştirirsen hem ortam değişkenini hem `eth0` yapılandırmasını uyumlu tut.

## Yerel çalıştırma

```bash
cd /path/to/cycle-watch-ai
npm install
npm run dev:admin
```

Ethernet tarafında `192.168.50.2` olan PC ile: **http://192.168.50.1:5274**

Farklı bind için:

```bash
ADMIN_BIND_ADDRESS=10.10.10.1 ADMIN_PORT=5274 npm run dev:admin
```

## Production önizleme / derleme

```bash
npm run build:admin
```

Çıktı: `admin-panel/dist/` — nginx/caddy ile sadece `eth0` IP’sinde servis etmek daha güvenli bir sonraki adımdır.

## systemd örneği

`pi/cycle-watch-admin.service.example` dosyasına bakın.
