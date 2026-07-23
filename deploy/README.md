# Veldr Production Deployment

This deployment layout uses one Node backend and two independent frontend sites.

## Domains

```text
notes.lifetip.top -> /var/www/veldr/dist
cms.lifetip.top   -> /var/www/veldr-cms/dist
backend API       -> 127.0.0.1:5000
```

## Backend

Create a production env file before the first backend deployment:

```powershell
Copy-Item .\deploy\env\backend.env.prod.example .\backend\.env.prod
```

Edit `backend\.env.prod` and set strong production values, especially:

```text
JWT_SECRET
DEFAULT_PASSWORD
CMS_VIEWER_PASSWORD
CMS_EDITOR_PASSWORD
```

Deploy backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-backend.ps1 -Deploy -UploadEnv -SshKey "C:\Users\indep\.ssh\id_ed25519"
```

After the first deployment, you can deploy code only and keep the remote `.env`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-backend.ps1 -Deploy -SshKey "C:\Users\indep\.ssh\id_ed25519"
```

Check service logs:

```bash
sudo systemctl status veldr-backend
sudo journalctl -u veldr-backend -f
```

## Frontends

Deploy both frontends:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-frontends.ps1 -Deploy -SshKey "C:\Users\indep\.ssh\id_ed25519"
```

## Nginx

Install the nginx config on the server:

```bash
sudo cp veldr-frontends.conf /etc/nginx/conf.d/veldr-frontends.conf
sudo nginx -t
sudo systemctl reload nginx
```

The nginx example is in:

```text
deploy/nginx/veldr-frontends.conf
```
