import { createSlice } from '@reduxjs/toolkit';

const storedToken = localStorage.getItem('token');
let storedUser = null;

try {
  const raw = localStorage.getItem('userInfo');
  storedUser = raw ? JSON.parse(raw) : null;
} catch (error) {
  console.error('Failed to parse stored user info', error);
  storedUser = null;
  localStorage.removeItem('userInfo');
}

const createRoleFlags = (user) => ({
  isHost: Boolean(user && user.role === 'HOST'),
  isAdmin: Boolean(user && user.role === 'ADMIN'),
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    token: storedToken,
    userInfo: storedUser,
    ...createRoleFlags(storedUser),
    loading: false,
    error: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.userInfo = user;
      const roleFlags = createRoleFlags(user);
      state.isHost = roleFlags.isHost;
      state.isAdmin = roleFlags.isAdmin;
      state.loading = false;
      state.error = null;
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
    },
    setUserProfile: (state, action) => {
      const user = action.payload;
      state.userInfo = user;
      const roleFlags = createRoleFlags(user);
      state.isHost = roleFlags.isHost;
      state.isAdmin = roleFlags.isAdmin;
      state.loading = false;
      state.error = null;
      if (user) {
        localStorage.setItem('userInfo', JSON.stringify(user));
      } else {
        localStorage.removeItem('userInfo');
      }
    },
    logout: (state) => {
      state.token = null;
      state.userInfo = null;
      state.isHost = false;
      state.isAdmin = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    },
  },
});

export const { setLoading, setError, setCredentials, setUserProfile, logout } = userSlice.actions;
export default userSlice.reducer;



