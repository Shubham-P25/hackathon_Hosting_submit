import { createSlice } from "@reduxjs/toolkit";
import { getToken } from "../api/auth";

const storedToken = getToken();
let storedUser = null;

try {
  const raw = localStorage.getItem("userInfo");
  storedUser = raw ? JSON.parse(raw) : null;
} catch (error) {
  console.error("Failed to parse stored user info", error);
  storedUser = null;
  localStorage.removeItem("userInfo");
}

const resolveRoles = (user) => ({
  isHost: Boolean(user && user.role === "HOST"),
  isAdmin: Boolean(user && user.role === "ADMIN"),
});

const initialState = {
  token: storedToken || null,
  userInfo: storedUser,
  ...resolveRoles(storedUser),
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    setCredentials: (state, action) => {
      const { token, user } = action.payload || {};
      state.token = token || null;
      state.userInfo = user || null;
      const roles = resolveRoles(user);
      state.isHost = roles.isHost;
      state.isAdmin = roles.isAdmin;
      state.loading = false;
      state.error = null;

      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }

      if (user) {
        localStorage.setItem("userInfo", JSON.stringify(user));
      } else {
        localStorage.removeItem("userInfo");
      }
    },
    setUserProfile: (state, action) => {
      const user = action.payload || null;
      state.userInfo = user;
      const roles = resolveRoles(user);
      state.isHost = roles.isHost;
      state.isAdmin = roles.isAdmin;
      state.loading = false;
      state.error = null;

      if (user) {
        localStorage.setItem("userInfo", JSON.stringify(user));
      } else {
        localStorage.removeItem("userInfo");
      }
    },
    logout: (state) => {
      state.token = null;
      state.userInfo = null;
      state.isHost = false;
      state.isAdmin = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
    },
  },
});

export const { setLoading, setError, setCredentials, setUserProfile, logout } = userSlice.actions;
export default userSlice.reducer;
