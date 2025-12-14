import { authHeader } from './auth';
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const updateHostFullProfile = async (profileData) => {
  const res = await fetch(`${API_BASE}/host/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(profileData),
  });
  return res.json();
};
