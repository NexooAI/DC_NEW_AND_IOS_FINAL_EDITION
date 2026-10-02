# Theni Anantham Textiles (Dindigul) – Master Architecture, Server Audit & Deployment Runbook

**Customer**: Theni Anantham Textiles (தேனி ★ ஆனந்தம் - திண்டுக்கல்)  
**Vertical**: Premier Textiles & Garments Retailer  
**Core Scheme**: **தீபாவளி வருடாந்திர சீட்டு (Deepavali Annual Chit Scheme)**  
- Denominations: ₹500 & ₹1,000  
- Tenure: 11 Months Customer Payment + 12th Month Company Incentive Bonus  
- Rules: Strictly Textile/Garments Redemption at Dindigul Showroom (0% Cash Refund)  
**Active Git Branch**: `theni_anandham_textiles` (across all 3 platforms)  
**Target Server**: Akila Server (`157.173.220.166` / `srv937106`, Ubuntu)  
**Temporary Testing Domain**: `nexooai.in`  
- Backend API: `https://api.prod.nexooai.in`  
- Master Admin Web: `https://master.nexooai.in`  
- Mobile App: Configured to `https://api.prod.nexooai.in`  
**Future Production Domain**: `thenianantham.com` (`api.prod.thenianantham.com` & `master.thenianantham.com`)  

---

## 1. Server Audit Summary (`157.173.220.166`)

On October 3, 2026, the target production server was audited with the following verified state:

### 1.1 Hardware & OS Specs
* **Public IP**: `157.173.220.166`
* **Hostname**: `srv937106`
* **Operating System**: Linux (Ubuntu x86_64)
* **RAM**: 3.8 GiB total | 1.8 GiB used | **1.7 GiB Available**
* **Disk**: 49 GiB total | 29 GiB used | **20 GiB Available (40% Free)**
* **Web Engine**: Nginx with Certbot SSL

### 1.2 Existing Running Containers (Untouched & Safe)
* `akila_jewel_backend_container` (Port `8082` -> `3001`)
* `estimate-api-container` (Port `3005` -> `3000`)
* `crm-frontend` (Port `127.0.0.1:8086` -> `80`)
* `crm-mysql` (Port `127.0.0.1:3308` -> `3306`)
* `mysql_container` (Port `0.0.0.0:3306` -> `3306`) – **Production Shared MySQL Engine**
* `rabbitmq` (Port `0.0.0.0:5672` -> `5672`) – **Production Shared Event Broker**
* `grafana` (Port `3000`)
* `loki` (Port `3100`)

### 1.3 Verified Port Allocation for Theni Anantham
* **Backend API**: Port **`3007`** (Verified Free)
* **Master Admin Web**: Port **`8088`** (Verified Free)
* **MySQL Engine**: `127.0.0.1:3306` (`mysql_container`)
* **MySQL Root Password**: `NeXooA!_2025` (Verified from container env)
* **RabbitMQ Engine**: `127.0.0.1:5672` (`rabbitmq`)

---

## 2. Changes Implemented Across the 3 Repositories

### 2.1 Backend API (`jewllery_api_core` on `theni_anandham_textiles`)
1. **Isolated Environment File (`.env.thenianantham`)**:
   - `PORT=3007`
   - `COMPANY_NAME="Theni Anantham"`
   - `TENANT_PREFIX=TAT` (Generates accounts `TAT00001`, `TAT00002`...)
   - `DB_DATABASE=thenianantham_db`
   - `DB_PASSWORD=NeXooA!_2025`
   - `RABBITMQ_URL=amqp://admin:admin123@127.0.0.1:5672`
   - `SWAGGER_URL=https://api.prod.nexooai.in`
   - `CORS_ALLOWED_ORIGINS` includes `api.prod.nexooai.in`, `master.nexooai.in`, and `thenianantham.com`.
2. **Tenant CLI Switcher (`scripts/switch-tenant.js`)**:
   - Added `thenianantham` with aliases `theni` and `anantham`.
   - Command: `node scripts/switch-tenant.js thenianantham`.
3. **CORS Allowlist (`config/corsOrigins.js`)**:
   - Added `https://api.prod.nexooai.in`, `https://master.nexooai.in`, and regex `.*thenianantham\.com.*`.
4. **Branding Vector Assets**:
   - Theni Anantham official swan logo added to `assets/logos/thenianantham-logo.png` and `uploads/thenianantham-logo.png`.
5. **Docker Compose (`deployment/master_backends/docker-compose.yml`)**:
   - Configured `thenianantham-api` service on Port `3007`.
6. **Isolated GitHub Actions CI/CD (`.github/workflows/docker-tenant-build.yml`)**:
   - Push branches include `theni_anandham_textiles`.
   - On this branch, `matrix: tenant:` is strictly **`[thenianantham]`**, ensuring only Theni Anantham image is built and other tenants are never touched.
7. **Regression Testing**:
   - 34/34 Test Suites Passed | 161/161 Tests Passed.

### 2.2 Master Admin Frontend (`digi_gold_admin_frontend` on `theni_anandham_textiles`)
1. **Tenant Configuration (`src/assets/tenant-configs/thenianantham.json`)**:
   - Brand Colors: Crimson Red (`#C0081C`), Dark Maroon (`#8B0000`), Swan Gold (`#FFCC00`).
   - `showSilverRate: false`, `showGoldRate: false`.
   - `enabledFeatures`: Strictly Chit, User, Payment, Report, Notification, and Policy features.
2. **Gold & Jewellery Feature Suppression**:
   - Updated `nav-content.component.ts` and `navigation-new.component.ts` to cleanly filter out `gold-silver` and `rate-update` from the sidebar.
   - Updated `dashboard.component.ts` and `dashboard-v2.component.html` to hide the 22K/18K/14K gold rate ticker when `showGoldRate` is disabled.
3. **Tenant Switcher & Scripts (`scripts/set-tenant.js` & `package.json`)**:
   - Added `thenianantham` to `ALLOWED_TENANTS`.
   - Added `"build:thenianantham"` and `"start:thenianantham"` scripts.
   - Verified locally with `node scripts/set-tenant.js thenianantham`.
4. **Isolated GitHub Actions CI/CD (`.github/workflows/docker-build.yml`)**:
   - Fixed duplicate `ConfigService` import in `dashboard.component.ts`.
   - Push branches include `theni_anandham_textiles`.
   - Matrix strictly set to `matrix: tenant: [thenianantham]`, building only `ghcr.io/nexooai/digi_gold_admin_thenianantham:latest`.

### 2.3 Mobile App (`DC_NEW_AND_IOS_FINAL_EDITION` on `theni_anandham_textiles`)
1. **EAS & App Config**:
   - Slug: `theniananthamdinidigul` | Project ID: `4dc9d969-4bf5-43e8-b3da-1d31c3e95755` | Owner: `nexooainew`
   - Package: `com.nexooai.thenianantham`
   - Base URL: `https://api.prod.nexooai.in` in `src/constants/theme.config.js`.
2. **Dedicated Textile Home (`TextileHomePage.tsx`)**:
   - Deepavali Chit Vault Card (₹ amount, 11+1 month bonus badge, 1st-5th due cycle).
   - Pinch-and-zoom modal viewer for Deepavali Chit scheme rules voucher.
   - Zero gold tickers, zero 22K/24K rates, zero gram accumulation.
3. **Branding Assets**:
   - Replaced all icons/logos with Theni Anantham official swan logo.
4. **Verification**:
   - `npx tsc --noEmit --skipLibCheck`: 0 errors.
   - `npx expo-doctor`: 21/21 passed.

---

## 3. Zero Source Code Deployment Runbook

### 3.1 Developer Machine: How to Push Updates
Whenever changes are made to frontend or backend, simply commit and push on branch `theni_anandham_textiles`:

```bash
# In jewllery_api_core:
git checkout theni_anandham_textiles
git add .
git commit -m "your message"
git push origin theni_anandham_textiles

# In digi_gold_admin_frontend:
git checkout theni_anandham_textiles
git add .
git commit -m "your message"
git push origin theni_anandham_textiles
```
> **What Happens**: GitHub Actions automatically triggers, runs tests, and builds only `thenianantham` Docker images, publishing them to GitHub Container Registry (GHCR):
> - Backend: `ghcr.io/nexooai/jewllery_api_core:thenianantham-latest`
> - Admin: `ghcr.io/nexooai/digi_gold_admin_thenianantham:latest`

---

### 3.2 Production Server (`157.173.220.166`): How to Deploy / Pull

Connect to server via SSH:
```bash
ssh root@157.173.220.166
```

#### Step A: One-Time Database & Directory Setup
```bash
# 1. Create Database
docker exec -i mysql_container mysql -u root -p'NeXooA!_2025' -e "CREATE DATABASE IF NOT EXISTS thenianantham_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Create Host Directories (No Source Code!)
mkdir -p /opt/thenianantham/backend/envs
mkdir -p /opt/thenianantham/backend/uploads
mkdir -p /opt/thenianantham/backend/logs
mkdir -p /opt/thenianantham/admin
```

#### Step B: Routine Deployment / Update Command
Whenever a new build completes on GitHub Actions, run this on the server:

```bash
# Update Backend API (Port 3007):
cd /opt/thenianantham/backend && docker compose pull && docker compose up -d

# Update Admin Frontend (Port 8088):
cd /opt/thenianantham/admin && docker compose pull && docker compose up -d
```

---

## 4. Temporary to Permanent Domain Migration Guide

Currently running on:
- API: `https://api.prod.nexooai.in` ➡️ `127.0.0.1:3007`
- Admin: `https://master.nexooai.in` ➡️ `127.0.0.1:8088`

When the client provides their official domain (`thenianantham.com`):

### How to switch with ZERO code rewrite:
1. **DNS Records (Point to `157.173.220.166`)**:
   - `api.prod.thenianantham.com` ➡️ A Record ➡️ `157.173.220.166`
   - `master.thenianantham.com` ➡️ A Record ➡️ `157.173.220.166`
2. **Nginx on Server**:
   Update `server_name` in `/etc/nginx/sites-available/thenianantham.conf` to include `api.prod.thenianantham.com` and `master.thenianantham.com`.
   Run:
   ```bash
   certbot --nginx -d api.prod.thenianantham.com -d master.thenianantham.com
   systemctl reload nginx
   ```
3. **Mobile App**:
   Change `baseUrl` in `src/constants/theme.config.js` to `https://api.prod.thenianantham.com` and trigger EAS build.
4. **Result**:
   Zero downtime, zero logic changes!
