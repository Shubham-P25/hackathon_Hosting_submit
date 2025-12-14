import { promises as fs } from 'fs';
import prisma from "../utils/prismaClient.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const uploadImages = async (req, res) => {
  try {
    const bannerFile = req.files.banner?.[0];
    const posterFile = req.files.poster?.[0];
    const galleryFile = req.files.gallery?.[0];
    const profilePicFile = req.files.profilePic?.[0];
    
    const uploadResults = {};

    // Upload banner to Cloudinary if provided
    if (bannerFile) {
      try {
        const bannerUrl = await uploadToCloudinary(bannerFile);
        uploadResults.banner = bannerUrl;
      } catch (error) {
        console.error('Banner upload failed:', error);
        throw new Error('Failed to upload banner image');
      }
    }

    // Upload poster to Cloudinary if provided
    if (posterFile) {
      try {
        const posterUrl = await uploadToCloudinary(posterFile);
        uploadResults.poster = posterUrl;
      } catch (error) {
        console.error('Poster upload failed:', error);
        throw new Error('Failed to upload poster image');
      }
    }

    // Upload gallery images to Cloudinary if provided
    const galleryFiles = req.files.gallery || [];
    
    if (galleryFiles.length > 0) {
      try {
        const galleryUrls = await Promise.all(
          galleryFiles.map(file => uploadToCloudinary(file))
        );
        uploadResults.gallery = galleryUrls;
      } catch (error) {
        console.error('Gallery upload failed:', error);
        throw new Error('Failed to upload gallery images');
      }
    }

    // Upload profile picture to Cloudinary if provided
    if (profilePicFile) {
      try {
        const profilePicUrl = await uploadToCloudinary(profilePicFile);
        uploadResults.profilePicUrl = profilePicUrl;
      } catch (error) {
        console.error('Profile picture upload failed:', error);
        throw new Error('Failed to upload profile picture');
      }
    }

    // Clean up temporary files
    const filesToDelete = [];
    if (bannerFile) filesToDelete.push(bannerFile.path);
    if (posterFile) filesToDelete.push(posterFile.path);
    galleryFiles.forEach(file => filesToDelete.push(file.path));
    if (profilePicFile) filesToDelete.push(profilePicFile.path);
    
    await Promise.all(filesToDelete.map(filePath => 
      fs.unlink(filePath).catch(err => console.error('File cleanup error:', err))
    ));

    res.status(200).json({
      message: "Images uploaded to Cloudinary successfully",
      success: true,
      data: uploadResults
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload images',
      success: false 
    });
  }
};

// Upload images and save Cloudinary URLs to hackathon in database
export const uploadAndSaveImages = async (req, res) => {
  try {
    const { hackathonId } = req.body;
    if (!hackathonId) {
      return res.status(400).json({ error: "hackathonId is required" });
    }
    
    const bannerFile = req.files.banner?.[0];
    const posterFile = req.files.poster?.[0];
    const galleryFile = req.files.gallery?.[0];
    
    if (!bannerFile && !posterFile && !galleryFile) {
      return res.status(400).json({ error: "At least one image file is required" });
    }

    const updateData = {};

    // Upload banner to Cloudinary and get URL
    if (bannerFile) {
      try {
        const bannerUrl = await uploadToCloudinary(bannerFile);
        updateData.banner = bannerUrl;
      } catch (error) {
        console.error('Banner upload failed:', error);
        throw new Error('Failed to upload banner image');
      }
    }

    // Upload poster to Cloudinary and get URL
    if (posterFile) {
      try {
        const posterUrl = await uploadToCloudinary(posterFile);
        updateData.poster = posterUrl;
      } catch (error) {
        console.error('Poster upload failed:', error);
        throw new Error('Failed to upload poster image');
      }
    }

    // Upload gallery images to Cloudinary and get URLs
    const galleryFiles = req.files.gallery || [];
    
    if (galleryFiles.length > 0) {
      try {
        const galleryUrls = await Promise.all(
          galleryFiles.map(file => uploadToCloudinary(file))
        );
        updateData.gallery = galleryUrls;
      } catch (error) {
        console.error('Gallery upload failed:', error);
        throw new Error('Failed to upload gallery images');
      }
    }
    
    // Save Cloudinary URLs to database
    const updatedHackathon = await prisma.hackathon.update({
      where: { id: parseInt(hackathonId) },
      data: updateData
    });
    
    // Clean up temporary files
    const filesToDelete = [];
    if (bannerFile) filesToDelete.push(bannerFile.path);
    if (posterFile) filesToDelete.push(posterFile.path);
    galleryFiles.forEach(file => filesToDelete.push(file.path));
    
    await Promise.all(filesToDelete.map(filePath => 
      fs.unlink(filePath).catch(err => console.error('File cleanup error:', err))
    ));
    
    res.json({ 
      message: "Images uploaded to Cloudinary and URLs saved to database", 
      success: true,
      hackathon: updatedHackathon,
      urls: {
        banner: updateData.banner || null,
        poster: updateData.poster || null,
        gallery: updateData.gallery || null
      }
    });
  } catch (error) {
    console.error("Error uploading and saving images:", error);
    res.status(500).json({ 
      error: error.message || "Failed to upload and save images",
      success: false 
    });
  }
};

