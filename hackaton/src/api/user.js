import { authHeader } from './auth';
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const updateUser = async (userData) => {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(userData),
  });
  return res.json();
};
