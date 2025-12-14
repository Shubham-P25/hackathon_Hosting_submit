// src/api/hackathon.js
import { authHeader } from './auth';
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Hackathon endpoints
export const getHackathons = async () => {
  const res = await fetch(`${API_BASE}/hackathons`, {
    headers: authHeader(),
  });
  return res.json();
};

export const getHackathonById = async (id) => {
  const res = await fetch(`${API_BASE}/hackathons/${id}`, {
    headers: authHeader(),
  });
  return res.json();
};

export const updateHackathon = async (id, hackathonData) => {
  try {
    const response = await fetch(`${API_BASE}/hackathons/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(hackathonData),
    });
    return await response.json();
  } catch (error) {
    console.error('Update hackathon error:', error);
    return { error: error.message };
  }
};

export const createHackathon = async (hackathonData) => {
  try {
    const response = await fetch(`${API_BASE}/hackathons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(hackathonData),
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const deleteHackathon = async (hackathonId) => {
  try {
    const response = await fetch(`${API_BASE}/hackathons/${hackathonId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const registerHackathon = async (id, token) => {
  try {
    const res = await fetch(`${API_BASE}/hackathons/${id}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

// Upload images to Cloudinary and get URLs back
export const uploadHackathonImages = async (formData) => {
  try {
    const response = await fetch(`${API_BASE}/hackathons/upload`, {
      method: "POST",
      headers: {
        ...authHeader(),
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    return { error: error.message, success: false };
  }
};

// Upload images and save to specific hackathon in database
export const uploadAndSaveHackathonImages = async (hackathonId, formData) => {
  try {
    // Add hackathonId to formData
    formData.append('hackathonId', hackathonId);
    
    const response = await fetch(`${API_BASE}/hackathons/upload-and-save`, {
      method: "POST", 
      headers: {
        ...authHeader(),
        // Don't set Content-Type for FormData
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Upload and save error:', error);
    return { error: error.message, success: false };
  }
};

// Create hackathon with image URLs
export const createHackathonWithImages = async (hackathonData, imageUrls = {}) => {
  try {
    const dataWithImages = {
      ...hackathonData,
      posterUrl: imageUrls.poster || null,
      bannerUrl: imageUrls.banner || null,
      galleryUrl: imageUrls.gallery || []
    };
    
    const response = await fetch(`${API_BASE}/hackathons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(dataWithImages),
    });
    return await response.json();
  } catch (error) {
    console.error('Create hackathon error:', error);
    return { error: error.message };
  }
};

// Upload profile picture to Cloudinary
export const uploadProfilePicture = async (imageFile, userType = 'user') => {
  try {
    const formData = new FormData();
    formData.append('profilePic', imageFile);
    formData.append('data', JSON.stringify({})); // Empty data object for profile route compatibility
    
    const endpoint = userType === 'host' ? '/host/profile' : '/users/profile';
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: {
        ...authHeader(),
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return { error: error.message, success: false };
  }
};

