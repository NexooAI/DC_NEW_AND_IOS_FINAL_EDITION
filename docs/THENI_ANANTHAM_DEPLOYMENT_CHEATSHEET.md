# 🚀 Theni Anantham Textiles – Full Deployment & Operations Cheatsheet

> **Customer**: Theni Anantham Textiles (தேனி ★ ஆனந்தம் - திண்டுக்கல்)  
> **Scheme**: தீபாவளி வருடாந்திர சீட்டு (Deepavali Annual Chit Scheme ₹500 & ₹1,000, 11+1 Bonus)  
> **Git Branch**: `theni_anandham_textiles` (Isolated across all 3 codebases)  
> **Target Production Server**: `157.173.220.166` (`srv937106`, Ubuntu)  
> **Backend Port**: `3007` | **Admin Port**: `8088`  
> **Current Temporary Domains**:  
> - Backend API: `https://api.prod.nexooai.in`  
> - Master Admin: `https://master.nexooai.in`  
> - Mobile App: Pointed to `https://api.prod.nexooai.in`  
> **Future Client Domain**: `thenianantham.com`  

---

## ⚡ 1. How to Push Code (Developer Machine)

### A. Backend API (`jewllery_api_core`)
```bash
cd /e/project/nexooAiProjects/jewllery_api_core
git checkout theni_anandham_textiles
git add .
git commit -m "feat(thenianantham): update backend"
git push origin theni_anandham_textiles
```

### B. Admin Frontend (`digi_gold_admin_frontend`)
```bash
cd /e/project/nexooAiProjects/digi_gold_admin_frontend
git checkout theni_anandham_textiles
git add .
git commit -m "feat(thenianantham): update admin"
git push origin theni_anandham_textiles
```

### C. Mobile App (`DC_NEW_AND_IOS_FINAL_EDITION`)
```bash
cd "c:\Users\nithy\Videos\DC_New(AND-IOS)\DC_NEW_AND_IOS_FINAL_EDITION"
git checkout theni_anandham_textiles
git add .
git commit -m "feat(thenianantham): update mobile app"
git push origin theni_anandham_textiles
```

> **Automated GitHub Actions**: Pushes to `theni_anandham_textiles` automatically build only Theni Anantham Docker images on GHCR:
> - Backend: `ghcr.io/nexooai/jewllery_api_core:thenianantham-latest`
> - Admin: `ghcr.io/nexooai/digi_gold_admin_thenianantham:latest`

---

## 🖥️ 2. How to Deploy on Server (`157.173.220.166`)

Log in via SSH:
```bash
ssh root@157.173.220.166
```

### 2.1 Initial One-Time Database Setup
```bash
docker exec -i mysql_container mysql -u root -p'NeXooA!_2025' -e "CREATE DATABASE IF NOT EXISTS thenianantham_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2.2 Routine Pull & Deploy Commands (Run after CI/CD Build completes)
```bash
# Update Backend:
cd /opt/thenianantham/backend && docker compose pull && docker compose up -d

# Update Admin:
cd /opt/thenianantham/admin && docker compose pull && docker compose up -d
```

### 2.3 Status & Health Verification
```bash
docker ps --filter "name=thenianantham"
curl -I http://127.0.0.1:3007
curl -I http://127.0.0.1:8088
```

---

## 🌐 3. Domain Migration (Temporary ➡️ Customer Domain)

When switching from `nexooai.in` to `thenianantham.com`:

1. **DNS**:
   - `api.prod.thenianantham.com` ➡️ `157.173.220.166`
   - `master.thenianantham.com` ➡️ `157.173.220.166`
2. **Server SSL**:
   ```bash
   certbot --nginx -d api.prod.thenianantham.com -d master.thenianantham.com
   systemctl reload nginx
   ```
3. **Mobile App**:
   - Change `baseUrl` in `src/constants/theme.config.js` to `https://api.prod.thenianantham.com`.
   - Build preview/production APK with `eas build -p android --profile preview`.

---

## 🚚 4. Server Migration (Moving to Dedicated VPS)

1. Dump DB on current server:
   ```bash
   docker exec mysql_container mysqldump -u root -p'NeXooA!_2025' thenianantham_db > /tmp/thenianantham_db.sql
   ```
2. Copy `/opt/thenianantham/` and `/tmp/thenianantham_db.sql` to the new server via `scp`.
3. Import DB on new server and run `docker compose pull && docker compose up -d`.
4. Setup Nginx & Certbot SSL on new server.
5. Update DNS to new server IP.
