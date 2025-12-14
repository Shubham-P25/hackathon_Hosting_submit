#!/usr/bin/env node

// Test script to verify Cloudinary configuration
import dotenv from 'dotenv';
import { uploadToCloudinary } from './src/utils/cloudinary.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function testCloudinaryConfig() {
  console.log('🧪 Testing Cloudinary configuration...\n');
  
  // Check environment variables
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('Please add these to your .env file:');
    missingVars.forEach(varName => {
      console.log(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    return false;
  }
  
  console.log('✅ All Cloudinary environment variables are set');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY.substring(0, 6) + '...');
  console.log('API Secret:', '***hidden***\n');
  
  return true;
}

async function testDatabaseConnection() {
  console.log('🗄️ Testing database connection...\n');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test hackathon table
    const hackathonCount = await prisma.hackathon.count();
    console.log(`📊 Found ${hackathonCount} hackathons in database\n`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting system tests...\n');
  
  const cloudinaryOk = await testCloudinaryConfig();
  const databaseOk = await testDatabaseConnection();
  
  if (cloudinaryOk && databaseOk) {
    console.log('🎉 All systems ready! You can now upload images.');
    console.log('\nNext steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Start your frontend: cd ../hackaton && npm run dev');
    console.log('3. Test image upload in the Add Hackathon form');
  } else {
    console.log('⚠️ Some systems need attention before testing image upload.');
  }
}

main().catch(console.error);