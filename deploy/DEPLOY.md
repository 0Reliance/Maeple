# MAEPLE Deployment Guide

This guide covers deploying MAEPLE to various environments.

## Quick Start Options

| Method             | Best For                  | Complexity      |
| ------------------ | ------------------------- | --------------- |
| **Static Hosting** | Vercel/Netlify/Cloudflare | ⭐ Easiest      |
| **Docker**         | Self-hosted, Portainer    | ⭐⭐ Easy       |
| **LXC Container**  | Proxmox, low resources    | ⭐⭐ Easy       |
| **Manual nginx**   | Full control              | ⭐⭐⭐ Moderate |

---

## 1. Static Hosting (Recommended)

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm run build
# Drag dist/ folder to Netlify dashboard
```

### Cloudflare Pages

1. Connect GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`

---

## 2. Docker Deployment

### Build and Run

```bash
cd deploy
docker compose up -d
```

MAEPLE will be available at `http://localhost:8080`

### Manual Docker Build

```bash
docker build -f deploy/Dockerfile -t maeple:latest .
docker run -d -p 8080:80 --name maeple maeple:latest
```

### With Traefik (SSL)

Uncomment the Traefik section in `docker-compose.yml` for automatic SSL.

---

## 3. Proxmox LXC Deployment

### Create LXC Container

In Proxmox:

1. **Create CT** → Choose template:

   - **Alpine 3.19** (smallest, ~50MB)
   - **Debian 12** (more compatible)

2. **Resources**:

   - CPU: 1 core
   - RAM: 256 MB (512 MB for building)
   - Disk: 2 GB

3. **Network**: DHCP or static IP

### Deploy MAEPLE

**Option A: Build on container**

```bash
# Inside the LXC container:
wget -O- https://raw.githubusercontent.com/genpozi/pozimind/main/deploy/lxc-deploy.sh | bash -s -- --build
```

**Option B: Deploy pre-built**

```bash
# On your dev machine:
npm run build
scp -r dist/* root@<LXC_IP>:/var/www/maeple/

# Inside the LXC container:
wget -O- https://raw.githubusercontent.com/genpozi/pozimind/main/deploy/lxc-deploy.sh | bash -s -- --prebuilt
```

---

## 4. Environment Variables

For production, set these in your deployment platform:

```env
# Required for AI features
VITE_GEMINI_API_KEY=your_gemini_key

# Required for Cloud Sync
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Oura Ring integration
VITE_OURA_CLIENT_ID=your_oura_client_id
VITE_OURA_CLIENT_SECRET=your_oura_client_secret
```

**Note**: Environment variables must be set at **build time** for Vite apps.

---

## 5. Supabase Database Setup

Before using Cloud Sync, run the schema on your Supabase instance:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Paste contents of `supabase/schema.sql`
3. Click **Run**

This creates:

- 7 tables with Row Level Security
- Auto-profile creation trigger
- Updated_at triggers

---

## 6. SSL/HTTPS

MAEPLE requires HTTPS for:

- Camera access (Bio-Mirror)
- Microphone access (Voice input)
- Service Worker (PWA)

### Options:

- **Cloudflare Tunnel**: Free, easy setup
- **Let's Encrypt + Caddy**: Auto-renewing certs
- **Traefik**: Docker-native SSL

### Caddy Example

```
maeple.example.com {
    root * /var/www/maeple
    file_server
    try_files {path} /index.html
}
```

---

## 7. Health Checks

All deployments include a health endpoint:

```bash
curl http://your-server/health
# Returns: OK
```

Use this for:

- Load balancer health checks
- Container orchestration
- Uptime monitoring

---

## 8. Updating MAEPLE

### Docker

```bash
cd deploy
docker compose pull
docker compose up -d --build
```

### LXC/Manual

```bash
cd /path/to/pozimind
git pull
npm ci
npm run build
cp -r dist/* /var/www/maeple/
systemctl restart nginx  # or: rc-service nginx restart
```

---

## Troubleshooting

### Build fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 on page refresh

Ensure nginx/server has SPA fallback:

```nginx
try_files $uri $uri/ /index.html;
```

### Camera not working

- Ensure HTTPS is enabled
- Check browser permissions
- Some browsers block camera in iframes

### Cloud Sync not connecting

- Verify Supabase URL is accessible
- Check anon key is correct
- Run schema.sql if tables don't exist
