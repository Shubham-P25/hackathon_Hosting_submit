import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import prisma from "../utils/prismaClient.js";
import { promises as fs } from 'fs';

const router = express.Router();

// PATCH host full profile (user + hostProfile in one call)
router.patch("/host/full-profile", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, ...hostProfileFields } = req.body;

    // Update user table if name/email present
    let updatedUser = null;
    if (name || email) {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (email) userUpdate.email = email;
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userUpdate
      });
    }

    // Store achievements as a plain string, removing brackets if present
    let { achievements, socialLinks } = hostProfileFields;
    if (Array.isArray(achievements)) {
      // Remove any elements that are just brackets
      achievements = achievements.filter(a => a !== '[' && a !== ']').join(', ');
    } else if (typeof achievements === 'string') {
      // Remove brackets if present in string
      achievements = achievements.replace(/\[|\]/g, '').trim();
    } else {
      achievements = '';
    }

    // Store socialLinks as JSON string with only github, linkedin, twitter
    let socialLinksObj = { github: '', linkedin: '', twitter: '' };
    if (typeof socialLinks === 'object' && socialLinks !== null) {
      socialLinksObj.github = socialLinks.github || '';
      socialLinksObj.linkedin = socialLinks.linkedin || '';
      socialLinksObj.twitter = socialLinks.twitter || '';
    } else if (typeof socialLinks === 'string') {
      try {
        const parsed = JSON.parse(socialLinks);
        socialLinksObj.github = parsed.github || '';
        socialLinksObj.linkedin = parsed.linkedin || '';
        socialLinksObj.twitter = parsed.twitter || '';
      } catch {
        // ignore, keep defaults
      }
    }
    socialLinks = JSON.stringify(socialLinksObj);

    // Only allow valid HostProfile fields
    const allowedFields = [
      'profession', 'education', 'bio', 'collegeOrCompany', 'clgNameorCmpName',
      'domain', 'location', 'profilePicUrl'
    ];
    const hostProfileData = { achievements, socialLinks };
    allowedFields.forEach(key => {
      if (hostProfileFields[key] !== undefined) hostProfileData[key] = hostProfileFields[key];
    });

    // Upsert hostProfile
    const updatedHostProfile = await prisma.hostProfile.upsert({
      where: { userId },
      update: hostProfileData,
      create: { userId, ...hostProfileData }
    });

    res.json({ user: updatedUser, hostProfile: updatedHostProfile });
  } catch (error) {
    console.error('Host full profile PATCH error:', error);
    res.status(500).json({ error: error.message });
  }
});
// PATCH user name/email (User table)
router.patch("/users", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('User PATCH error:', error);
    res.status(500).json({ error: error.message });
  }
});


// PATCH user profile (JSON payload, no file upload)
router.patch("/users/profile", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = { ...req.body };

    // Validate dateOfBirth: only include if valid ISO string
    if ('dateOfBirth' in profileData) {
      const date = new Date(profileData.dateOfBirth);
      if (!profileData.dateOfBirth || isNaN(date.getTime())) {
        delete profileData.dateOfBirth;
      } else {
        profileData.dateOfBirth = date.toISOString(); // Prisma expects full ISO string
      }
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Profile PATCH error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
              include: {
                host: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!userWithProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userData } = userWithProfile;
    res.json(userData);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      error: true,
      message: error.message || 'Failed to fetch profile'
    });
  }
});



// Update user profile with image
router.put("/users/profile", protect, upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.user.id;
    let profileData = JSON.parse(req.body.data);

    // Handle profile picture upload to Cloudinary
    if (req.file) {
      try {
        const { uploadToCloudinary } = await import('../utils/cloudinary.js');
        const profilePicUrl = await uploadToCloudinary(req.file);
        profileData.profilePicUrl = profilePicUrl;
        console.log('User profile picture uploaded to Cloudinary:', profilePicUrl);
        
        // Clean up temporary file
        await fs.unlink(req.file.path).catch(err => console.error('File cleanup error:', err));
      } catch (error) {
        console.error('Profile picture upload failed:', error);
        return res.status(500).json({ error: 'Failed to upload profile picture' });
      }
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get host profile
router.get("/host/profile", protect, async (req, res) => {
  try {
    if (req.user.role !== 'HOST') {
      return res.status(403).json({ message: 'Access denied: Host only' });
    }

    const hostData = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        hostProfile: true,
        hostedHackathons: {
          include: {
            registrations: true
          }
        }
      }
    });

    if (!hostData) {
      return res.status(404).json({ message: 'Host not found' });
    }

    // Create host profile if it doesn't exist
    if (!hostData.hostProfile) {
      await prisma.hostProfile.create({
        data: {
          userId: hostData.id,
        }
      });
    }

    const { password, ...profileData } = hostData;
    // Clean up achievements for frontend
    if (profileData.hostProfile) {
      // Clean up achievements
      let ach = profileData.hostProfile.achievements;
      if (Array.isArray(ach)) {
        ach = ach.filter(a => a !== '[' && a !== ']').join(', ');
      } else if (typeof ach === 'string') {
        try {
          const parsed = JSON.parse(ach);
          if (Array.isArray(parsed)) {
            ach = parsed.filter(a => a !== '[' && a !== ']').join(', ');
          } else {
            ach = ach.replace(/\[|\]/g, '').trim();
          }
        } catch {
          ach = ach.replace(/\[|\]/g, '').trim();
        }
      } else {
        ach = '';
      }
      profileData.hostProfile.achievements = ach;
      // Clean up socialLinks: only return github, linkedin, twitter
      let sl = profileData.hostProfile.socialLinks;
      let cleanLinks = { github: '', linkedin: '', twitter: '' };
      if (typeof sl === 'string') {
        try {
          const parsed = JSON.parse(sl);
          cleanLinks.github = parsed.github || '';
          cleanLinks.linkedin = parsed.linkedin || '';
          cleanLinks.twitter = parsed.twitter || '';
        } catch {}
      } else if (typeof sl === 'object' && sl !== null) {
        cleanLinks.github = sl.github || '';
        cleanLinks.linkedin = sl.linkedin || '';
        cleanLinks.twitter = sl.twitter || '';
      }
      profileData.hostProfile.socialLinks = cleanLinks;
    }
    res.json(profileData);
  } catch (error) {
    console.error('Get host profile error:', error);
    res.status(500).json({ 
      error: true,
      message: error.message || 'Failed to fetch host profile'
    });
  }
});

// Update host profile with image
router.put("/host/profile", protect, upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.user.id;
    let profileData = JSON.parse(req.body.data);

    // Clean up socialLinks: only keep github, linkedin, twitter
    let socialLinksObj = { github: '', linkedin: '', twitter: '' };
    if (typeof profileData.socialLinks === 'object' && profileData.socialLinks !== null) {
      socialLinksObj.github = profileData.socialLinks.github || '';
      socialLinksObj.linkedin = profileData.socialLinks.linkedin || '';
      socialLinksObj.twitter = profileData.socialLinks.twitter || '';
    } else if (typeof profileData.socialLinks === 'string') {
      try {
        const parsed = JSON.parse(profileData.socialLinks);
        socialLinksObj.github = parsed.github || '';
        socialLinksObj.linkedin = parsed.linkedin || '';
        socialLinksObj.twitter = parsed.twitter || '';
      } catch {}
    }
    profileData.socialLinks = JSON.stringify(socialLinksObj);

    // Clean up achievements: store as plain string, remove brackets
    if (Array.isArray(profileData.achievements)) {
      profileData.achievements = profileData.achievements.filter(a => a !== '[' && a !== ']').join(', ');
    } else if (typeof profileData.achievements === 'string') {
      profileData.achievements = profileData.achievements.replace(/\[|\]/g, '').trim();
    } else {
      profileData.achievements = '';
    }

    // Handle profile picture upload to Cloudinary
    if (req.file) {
      try {
        const { uploadToCloudinary } = await import('../utils/cloudinary.js');
        const profilePicUrl = await uploadToCloudinary(req.file);
        profileData.profilePicUrl = profilePicUrl;
        console.log('Host profile picture uploaded to Cloudinary:', profilePicUrl);
        
        // Clean up temporary file
        await fs.unlink(req.file.path).catch(err => console.error('File cleanup error:', err));
      } catch (error) {
        console.error('Host profile picture upload failed:', error);
        return res.status(500).json({ error: 'Failed to upload profile picture' });
      }
    }

    const updatedProfile = await prisma.hostProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Host profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
