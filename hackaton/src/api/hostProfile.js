import { authHeader } from './auth';
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getHostProfile = async () => {
  const res = await fetch(`${API_BASE}/host/profile`, {
    headers: authHeader(),
  });
  return res.json();
};

export const updateHostProfile = async (profileData) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(profileData));
  // If you want to support profilePic upload, add: formData.append('profilePic', file)
  const res = await fetch(`${API_BASE}/host/profile`, {
    method: 'PUT',
    headers: {
      ...authHeader(),
      // Do NOT set Content-Type for FormData; browser will set it automatically
    },
    body: formData,
  });
  return res.json();
};
