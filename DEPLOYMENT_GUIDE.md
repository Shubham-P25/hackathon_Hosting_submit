# 🚀 Vercel & Cloud Deployment Guide

This guide walks you through deploying your hackathon application to Vercel (frontend) and Render/Railway (backend).

---

## 📋 Prerequisites

- GitHub account (for storing your code)
- Vercel account (free at vercel.com)
- Render or Railway account (free tier available)
- PostgreSQL database (use Render's free tier or Railway)
- Cloudinary account (for image uploads)

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

```bash
# 1. Frontend builds without errors
cd hackaton
npm install
npm run build
# If successful, delete dist/ folder created by build

# 2. Backend can start
cd ../server
npm install
npm start
# Press Ctrl+C to stop
```

---

## 🎯 Deployment Strategy

```
Your App:
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)          │
│    Deployed on Vercel (CDN/Static)      │
│         https://yourapp.vercel.app      │
└────────────────┬────────────────────────┘
                 │
                 │ API Calls
                 │
                 ▼
┌─────────────────────────────────────────┐
│    Backend (Node + Express + Prisma)     │
│   Deployed on Render/Railway (Server)   │
│      https://yourapp.onrender.com       │
└─────────────────────────────────────────┘
                 │
                 ▼
        PostgreSQL Database
           (Render/Railway)
```

---

## 🌍 Step-by-Step Deployment

### STEP 1: Prepare Your Code for GitHub

```bash
# 1. Initialize git (if not already done)
cd d:\SubmitIT
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"

# 2. Create a repository on GitHub
# - Go to github.com/new
# - Create repository: "hackathon-app"
# - Copy the commands from GitHub

# 3. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/hackathon-app.git
git branch -M main
git push -u origin main
```

### STEP 2: Deploy Frontend on Vercel

#### Option A: Via Vercel CLI (Fastest)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Go to frontend directory
cd hackaton

# 3. Deploy
vercel

# 4. Follow prompts:
# - Link to existing project? No (first time)
# - Project name? hackathon-app
# - Which directory? hackaton
# - Project found? Yes
# - Override settings? No
```

#### Option B: Via Vercel Dashboard (Recommended for beginners)

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Add New"** → **"Project"**
3. **Import GitHub Repository**:
   - Search for `hackathon-app`
   - Click "Import"
4. **Configure Project**:
   - Root Directory: `hackaton`
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `dist`
5. **Environment Variables** (Add these):
   ```
   VITE_API_URL = https://your-backend-url.onrender.com
   ```
6. Click **"Deploy"** and wait ✅

**Your frontend is live at: `https://hackathon-app.vercel.app`**

---

### STEP 3: Setup PostgreSQL Database

#### Option A: Use Render's Free PostgreSQL

1. Go to **[render.com](https://render.com)**
2. Click **"New"** → **"PostgreSQL"**
3. Configure:
   - Name: `hackathon-db`
   - Database: `hackathon`
   - User: `postgres`
   - Region: Select closest to you
4. Click **"Create Database"**
5. Wait for creation (2-3 minutes)
6. **Copy the connection string** from "Connections" section
7. This will be your `DATABASE_URL`

#### Option B: Use Railway

1. Go to **[railway.app](https://railway.app)**
2. Click **"New Project"**
3. Select **"PostgreSQL"**
4. Wait for provisioning
5. Click on the PostgreSQL service
6. Go to **"Variables"** tab
7. Copy the `DATABASE_URL`

---

### STEP 4: Deploy Backend on Render

1. Go to **[render.com](https://render.com)**
2. Click **"New"** → **"Web Service"**
3. **Connect GitHub Repository**:
   - Authorize Render to access GitHub
   - Select `hackathon-app` repository
4. **Configure Service**:
   - Name: `hackathon-api`
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `node src/index.js`
5. **Add Environment Variables**:
   ```
   DATABASE_URL = postgresql://user:password@...  (from Step 3)
   JWT_SECRET = your-secret-key-here-min-32-chars
   CLOUDINARY_CLOUD_NAME = your-cloudinary-cloud-name
   CLOUDINARY_API_KEY = your-cloudinary-api-key
   CLOUDINARY_API_SECRET = your-cloudinary-api-secret
   ALLOWED_ORIGINS = https://hackathon-app.vercel.app,https://yourdomain.com
   NODE_ENV = production
   ```
6. Click **"Create Web Service"** and wait for deployment ✅

**Your backend is live at: `https://hackathon-api.onrender.com`**

---

### STEP 5: Update Frontend with Backend URL

1. In Vercel Dashboard, go to your project
2. **Settings** → **Environment Variables**
3. Update `VITE_API_URL`:
   ```
   VITE_API_URL = https://hackathon-api.onrender.com
   ```
4. Go to **"Deployments"** → **"Redeploy"** (to use new env vars)
5. Wait for redeployment ✅

---

## 🧪 Testing Your Deployment

After deployment, test these:

```bash
# 1. Frontend loads
curl https://hackathon-app.vercel.app

# 2. Backend API responds
curl https://hackathon-api.onrender.com/api/hackathons

# 3. Database connection works
# - Try logging in on the deployed app
# - Check if data is saved/retrieved
```

---

## 🔐 Important: Environment Variables

**NEVER commit these to GitHub!** Set them in:
- **Vercel**: Project → Settings → Environment Variables
- **Render**: Service → Environment

Required variables:

```
# Database
DATABASE_URL = postgresql://user:pass@host/dbname

# Auth
JWT_SECRET = your-very-secure-secret-key-minimum-32-characters

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME = your-cloud-name
CLOUDINARY_API_KEY = your-api-key
CLOUDINARY_API_SECRET = your-api-secret

# CORS
ALLOWED_ORIGINS = https://yourfrontend.vercel.app,https://yourdomain.com

# General
NODE_ENV = production
```

---

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch"
- **Cause**: Backend URL not set or incorrect
- **Fix**: Check `VITE_API_URL` in Vercel environment variables
- **Fix**: Ensure backend is running and online

### "Database connection refused"
- **Cause**: DATABASE_URL is incorrect or not set
- **Fix**: Verify DATABASE_URL is set in Render environment
- **Fix**: Check PostgreSQL instance is running
- **Fix**: Ensure IP whitelist allows all IPs (or Render's IP)

### "Prisma Client not found"
- **Cause**: Prisma wasn't generated during build
- **Fix**: Ensure `postinstall: prisma generate` is in server/package.json
- **Fix**: Run: `npx prisma generate` manually

### "CORS Error"
- **Cause**: Frontend URL not in ALLOWED_ORIGINS
- **Fix**: Add your frontend URL to ALLOWED_ORIGINS in backend env vars
- **Fix**: Example: `https://hackathon-app.vercel.app,http://localhost:5173`

### Build fails on Render
- **Cause**: Node version mismatch or missing dependencies
- **Fix**: Check build logs: Render → Service → "Logs"
- **Fix**: Try deploying with Node 20: Set `NODE_VERSION=20` in env

---

## 📊 Monitoring & Logs

### View Frontend Logs (Vercel)
1. Go to Vercel Dashboard
2. Select your project
3. **"Deployments"** tab
4. Click on latest deployment
5. View build & runtime logs

### View Backend Logs (Render)
1. Go to Render Dashboard
2. Select `hackathon-api` service
3. **"Logs"** tab
4. View real-time logs

---

## 🔄 Continuous Deployment

Both Vercel and Render auto-deploy when you push to GitHub:

```bash
# Just push your changes!
git add .
git commit -m "Fix: Bug in authentication"
git push origin main

# Your app will automatically redeploy
```

---

## 💾 Database Backups

### Automatic Backups (Render PostgreSQL)
- Render automatically backs up daily
- Go to your PostgreSQL instance → "Backups" tab

### Manual Database Dump
```bash
# Download your production database
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

---

## 🎓 Next Steps

1. ✅ Deploy frontend & backend
2. ✅ Test all features
3. ✅ Configure custom domain (optional):
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domains
4. ✅ Set up monitoring/alerts
5. ✅ Plan scaling (upgrade Render plan if needed)

---

## 📚 Useful Resources

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

## 🆘 Still Need Help?

1. Check the troubleshooting section above
2. Review deployment logs in Vercel/Render dashboards
3. Check `.env` file is not committed (in `.gitignore`)
4. Verify DATABASE_URL, JWT_SECRET, and other env vars are set correctly

---

**Good luck! Your app is about to go live! 🎉**
