import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import prisma from "../utils/prismaClient.js";
import { promises as fs } from 'fs';

const router = express.Router();

// =====================
// USER PROFILE ROUTES
// =====================

// Get user profile
router.get("/users/profile", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        registrations: {
          include: {
            hackathon: {
              select: { id: true, title: true, startDate: true, endDate: true }
            }
          }
        }
      }
    });

    if (!userWithProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userData } = userWithProfile;
    res.json(userData);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile (without image)
router.patch("/users/profile", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = { ...req.body };

    // Handle dateOfBirth if provided
    if (profileData.dateOfBirth) {
      const date = new Date(profileData.dateOfBirth);
      if (isNaN(date.getTime())) {
        delete profileData.dateOfBirth;
      } else {
        profileData.dateOfBirth = date.toISOString();
      }
    }

    // Handle skills and achievements as JSON if they're arrays
    if (Array.isArray(profileData.skills)) {
      profileData.skills = profileData.skills;
    }
    if (Array.isArray(profileData.achievements)) {
      profileData.achievements = profileData.achievements;
    }
    if (typeof profileData.socialLinks === 'object') {
      profileData.socialLinks = profileData.socialLinks;
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update user profile with image
router.put("/users/profile", protect, upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.user.id;
    let profileData = JSON.parse(req.body.data || '{}');

    // Upload profile picture to Cloudinary if provided
    if (req.file) {
      try {
        const profilePicUrl = await uploadToCloudinary(req.file);
        profileData.profilePicUrl = profilePicUrl;
        
        // Clean up temporary file
        await fs.unlink(req.file.path).catch(() => {});
      } catch (error) {
        console.error('Profile picture upload failed:', error);
        return res.status(500).json({ error: 'Failed to upload profile picture' });
      }
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// =====================
// HOST PROFILE ROUTES
// =====================

// Get host profile
router.get("/host/profile", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hostProfile: true,
        hostedHackathons: {
          select: { id: true, title: true, startDate: true, endDate: true, createdAt: true }
        }
      }
    });

    if (!userWithProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userData } = userWithProfile;
    res.json(userData);
  } catch (error) {
    console.error('Get host profile error:', error);
    res.status(500).json({ error: "Failed to fetch host profile" });
  }
});

// Update host profile (without image)
router.patch("/host/profile", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = { ...req.body };

    // Handle socialLinks as JSON
    if (typeof profileData.socialLinks === 'object') {
      profileData.socialLinks = JSON.stringify(profileData.socialLinks);
    }

    const updatedProfile = await prisma.hostProfile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update host profile error:', error);
    res.status(500).json({ error: "Failed to update host profile" });
  }
});

// Update host profile with image
router.put("/host/profile", protect, upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.user.id;
    let profileData = JSON.parse(req.body.data || '{}');

    // Upload profile picture to Cloudinary if provided
    if (req.file) {
      try {
        const profilePicUrl = await uploadToCloudinary(req.file);
        profileData.profilePicUrl = profilePicUrl;
        
        // Clean up temporary file
        await fs.unlink(req.file.path).catch(() => {});
      } catch (error) {
        console.error('Host profile picture upload failed:', error);
        return res.status(500).json({ error: 'Failed to upload profile picture' });
      }
    }

    // Handle socialLinks
    if (typeof profileData.socialLinks === 'object') {
      profileData.socialLinks = JSON.stringify(profileData.socialLinks);
    }

    const updatedProfile = await prisma.hostProfile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Host profile update error:', error);
    res.status(500).json({ error: "Failed to update host profile" });
  }
});

export default router;