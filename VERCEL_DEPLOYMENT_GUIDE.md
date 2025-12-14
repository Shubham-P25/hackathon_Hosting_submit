# Full-Stack Hackathon Application - Vercel Deployment Guide

## Deployment Strategy

This is a **monorepo** with:
- **Frontend**: React + Vite (in `hackaton/` folder) → Deploys to Vercel CDN
- **Backend**: Node.js + Express + Prisma (in `server/` folder) → Deploys as Vercel Functions or standalone

### Recommended Setup: Split Deployment

For the best performance and flexibility, deploy frontend and backend separately:

#### Option A: Frontend on Vercel + Backend on Render/Railway (RECOMMENDED)

**Frontend (Vercel):**
1. Push `hackaton/` folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import the repository
4. Set Root Directory to `hackaton`
5. Deploy

**Backend (Render or Railway):**
1. Push `server/` folder to a separate GitHub repository (or branch)
2. Deploy to [render.com](https://render.com) or [railway.app](https://railway.app)
3. Set environment variables (see below)
4. Note the backend URL (e.g., `https://your-backend.onrender.com`)

**Update Frontend .env:**
```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

#### Option B: Full-Stack on Vercel (with limitations)

If you want both on Vercel, use Vercel Functions for backend.

**Setup:**

1. **Create `api/` folder at root:**
```
project/
├── hackaton/          (frontend)
├── server/            (backend)
├── api/               (new - Vercel Functions)
│   ├── auth.js
│   ├── hackathon.js
│   ├── teams.js
│   └── ...
└── vercel.json
```

2. **Convert Express routes to Vercel Functions** (serverless format)

3. **Vercel.json configuration:**
```json
{
  "buildCommand": "cd hackaton && npm install && npm run build",
  "outputDirectory": "hackaton/dist",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

---

## Environment Variables

### For Vercel Deployment

Set these in your Vercel Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your-secure-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
NODE_ENV=production
```

### For Frontend (.env.production in hackaton/)

```
VITE_API_URL=https://your-api-url
```

---

## Deployment Steps (Option A - Recommended)

### Step 1: Prepare Frontend

```bash
cd hackaton
npm install
npm run build
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `hackaton`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = your backend URL
6. Click "Deploy"

### Step 4: Deploy Backend on Render

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `hackathon-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma migrate deploy && npx prisma generate`
   - **Start Command**: `node src/index.js`
5. Add Environment Variables (from Step: Environment Variables section)
6. Click "Create Web Service"

---

## Database Setup

### For Postgres on Render:

1. In Render dashboard, create a **PostgreSQL** instance
2. Copy the connection string
3. Set `DATABASE_URL` in your environment variables
4. Run migrations:
```bash
npx prisma migrate deploy
```

### For Postgres Hosted (AWS RDS, Heroku, etc.):

1. Create a PostgreSQL database
2. Ensure it's publicly accessible (or use VPN)
3. Update `DATABASE_URL` in environment variables
4. Run migrations on deployment

---

## Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] API calls work (check browser Network tab)
- [ ] Authentication flow works
- [ ] File uploads work (Cloudinary)
- [ ] Database queries work
- [ ] CORS is configured correctly
- [ ] Environment variables are set

---

## Troubleshooting

### "CORS Error"
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check `server/src/index.js` CORS configuration

### "Database Connection Failed"
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running and accessible
- Ensure firewall allows connections

### "Prisma Client Error"
- Run `npx prisma generate` after deploying
- Ensure `postinstall` script in `server/package.json` runs `prisma generate`

### "Build Fails"
- Check build logs in Vercel/Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility (18+)

---

## Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Quick Deploy Script

```bash
#!/bin/bash

# Frontend
cd hackaton
npm install
npm run build
cd ..

# Backend (if deploying locally for testing)
cd server
npm install
npx prisma migrate deploy
npm start
```

---

**Ready to deploy? Start with Option A above!**
