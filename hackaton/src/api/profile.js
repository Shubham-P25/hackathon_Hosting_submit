// Clean Profile API - Simple and straightforward
import { authHeader } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// =====================
// USER PROFILE API
// =====================

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE}/users/profile`, {
      headers: authHeader(),
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};

// Update user profile (without image)
export const updateUserProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE}/users/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};

// Upload profile picture with optional profile data
export const uploadUserProfilePicture = async (imageFile, profileData = {}) => {
  try {
    const formData = new FormData();
    formData.append('profilePic', imageFile);
    formData.append('data', JSON.stringify(profileData));
    
    const response = await fetch(`${API_BASE}/users/profile`, {
      method: "PUT",
      headers: authHeader(),
      body: formData
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};

// =====================
// HOST PROFILE API
// =====================

// Get host profile
export const getHostProfile = async () => {
  try {
    const response = await fetch(`${API_BASE}/host/profile`, {
      headers: authHeader(),
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};

// Update host profile (without image)
export const updateHostProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE}/host/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json", 
        ...authHeader(),
      },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};

// Upload host profile picture with optional profile data
export const uploadHostProfilePicture = async (imageFile, profileData = {}) => {
  try {
    const formData = new FormData();
    formData.append('profilePic', imageFile);
    formData.append('data', JSON.stringify(profileData));
    
    const response = await fetch(`${API_BASE}/host/profile`, {
      method: "PUT", 
      headers: authHeader(),
      body: formData
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};