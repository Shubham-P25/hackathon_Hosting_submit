#!/bin/bash

# Hackathon App - Quick Deployment Script

echo "🚀 Starting deployment process..."

# Step 1: Build Frontend
echo "📦 Building frontend..."
cd hackaton
npm install
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Frontend build failed!"
  exit 1
fi

echo "✅ Frontend built successfully!"

# Step 2: Prepare Backend
echo "📦 Setting up backend..."
cd ../server
npm install

if [ $? -ne 0 ]; then
  echo "❌ Backend dependencies installation failed!"
  exit 1
fi

echo "✅ Backend setup complete!"

# Step 3: Database Migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "⚠️ Database migration had issues (might be expected if no pending migrations)"
fi

# Step 4: Generate Prisma Client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Prisma client generation failed!"
  exit 1
fi

echo "✅ Prisma client generated!"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✨ Build Complete! Ready for deployment."
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "1. Commit changes to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Vercel deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy Frontend on Vercel:"
echo "   - Go to vercel.com"
echo "   - Import your repository"
echo "   - Set Root Directory to 'hackaton'"
echo "   - Add VITE_API_URL environment variable"
echo "   - Deploy!"
echo ""
echo "3. Deploy Backend on Render/Railway:"
echo "   - Go to render.com (or railway.app)"
echo "   - Create Web Service"
echo "   - Root Directory: 'server'"
echo "   - Start Command: 'node src/index.js'"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md"
echo ""
