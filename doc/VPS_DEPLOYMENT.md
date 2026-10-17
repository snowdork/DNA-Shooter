# VPS deployment runbook

Mutagon is a static site. Build locally, then serve the contents of `dist/` with Nginx. No database, application secrets, PM2, or Node service is needed on the VPS. Vite preview is only for local checks, as described in the [Vite deployment documentation](https://vite.dev/guide/static-deploy.html).

## Prepare the server

Use a supported Linux distribution with security updates enabled, SSH key access, and a non-root deployment user. A small VPS is sufficient to start; traffic and bandwidth determine capacity because gameplay runs in the browser. Keep SSH access open when configuring a firewall, and allow inbound TCP 80 and 443. Do not expose Vite's ports 5173, 4173, or 4174.

Point your domain's A record at the VPS. Add an AAAA record only if IPv6 is configured and reachable. Install Nginx using the distribution's package manager. On Debian/Ubuntu:

```sh
sudo apt update
sudo apt install nginx
sudo systemctl enable --now nginx
sudo install -d -m 755 -o "$USER" -g "$(id -gn)" /var/www/dna-shooter/releases
```

Run the directory command as your intended deployment user. Nginx needs read/traverse access, not write ownership, of release files. Keep private keys, source checkouts, and backups outside the web root.

## Build and upload

On your development machine, from the repository root:

```sh
npm ci
npx playwright install chromium
npm run verify
```

On a Linux build machine missing browser libraries, use `npx playwright install --with-deps chromium`. This may require system package installation privileges. An existing browser can be selected with `CHROMIUM_PATH=/absolute/path/to/chromium npm run verify`.

Only deploy after verification succeeds. Use a unique release ID and record the Git revision, Node version, and lockfile with the release. Substitute your SSH destination below. These commands upload files but do not switch the live site:

```sh
release_id=20261016-01
vps_target=deploy@your-vps
ssh "$vps_target" "mkdir /var/www/dna-shooter/releases/$release_id"
rsync -av dist/ "$vps_target:/var/www/dna-shooter/releases/$release_id/"
```

The trailing slash on `dist/` uploads its contents. Do not upload `node_modules/` or serve the repository itself. Reusing a release ID should fail; use a new ID for each build.

## Switch the release

SSH into the VPS. Set the same release ID. Run each step successfully before proceeding:

```sh
release_id=20261016-01
cd /var/www/dna-shooter
test -f "releases/$release_id/index.html"
test -d "releases/$release_id/assets"
```

For an update, carry forward the previous assets before switching. This preserves chunks referenced by pages already open in players' browsers:

```sh
if [ -L current ]; then
  cp -an current/assets/. "releases/$release_id/assets/"
fi
chmod -R a+rX "releases/$release_id"
ln -s "releases/$release_id" "current-$release_id"
mv -Tf "current-$release_id" current
```

These commands assume GNU/Linux tools and that `current` is absent or a symlink. Inspect `ls -ld current` before your first update; migrate an existing real directory separately. The rename switches the complete release atomically. Keep previous releases for rollback. A file-only switch requires no Nginx reload.

## Configure Nginx and HTTPS

Copy [deploy/nginx.conf](../deploy/nginx.conf) to a new virtual host configuration, replace `dna.example.com` with your domain, and retain `/var/www/dna-shooter/current` as the root. On Debian/Ubuntu, place it in `/etc/nginx/sites-available/dna-shooter` and enable it with a symlink in `/etc/nginx/sites-enabled/`. Avoid conflicting server names in existing hosts.

The main Nginx `http` configuration must include its `mime.types` file so JavaScript and CSS receive correct content types. Check `nginx -V` for the gzip static module; if unavailable, follow the compression fallback in the [admin guide](ADMIN_GUIDE.md). See the [official gzip static documentation](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html).

```sh
sudo nginx -t
```

Only after that succeeds:

```sh
sudo systemctl reload nginx
```

The supplied configuration is an HTTP starting point. Before public launch, issue a TLS certificate for your domain using your hosting provider or an ACME client, configure HTTPS, and redirect HTTP to HTTPS. Use your certificate provider's instructions for the actual OS and Nginx installation. Verify automatic renewal and test it. If adding IPv6 DNS, add matching IPv6 listen directives for HTTP and HTTPS.

## Accept the deployment

Run these checks against your actual domain and a real hashed JavaScript filename copied from `dist/assets/`:

```sh
curl -I https://your-domain.example/
curl -I -H 'Accept-Encoding: gzip' https://your-domain.example/assets/ACTUAL_HASHED_FILE.js
curl -I https://your-domain.example/assets/missing.js
curl -I http://your-domain.example/
```

Expect HTML 200 with `Cache-Control: no-cache`; the real asset 200 with a JavaScript content type and one-year immutable caching; gzip encoding when its `.gz` file is available; missing assets 404; and HTTP redirected to HTTPS. Check the certificate hostname and renewal. Open the public URL in a browser, check the console/network panel, play one quadra-chrome, pause, export, restart, and reload the export. Confirm controls and sound work. Repeat the browser check after an update with an older tab still open.

## Roll back and maintain

Inspect `readlink current` and choose the known-good release. Before switching back, copy the current assets into the rollback release so newer open pages can still fetch their chunks:

```sh
cd /var/www/dna-shooter
rollback_id=REPLACE_WITH_PREVIOUS_RELEASE
test -f "releases/$rollback_id/index.html"
cp -an current/assets/. "releases/$rollback_id/assets/"
ln -s "releases/$rollback_id" "rollback-$rollback_id"
mv -Tf "rollback-$rollback_id" current
```

Recheck the public site. Retain release archives, build revision information, and Nginx/TLS configuration. Monitor HTTP errors, disk usage, uptime, and certificate expiry. Old assets accumulate deliberately; archive and prune them according to a defined retention window, accepting that very old open tabs may then need a refresh. Player progress lives only in browser memory or exported files; there is no server-side progress backup.

## Readiness boundary

Local verification checks application behavior and the generated build. Nginx syntax, file permissions, DNS, firewall rules, HTTPS, and compression must also be checked on the actual VPS before launch. This runbook does not provision or deploy a server by itself.
