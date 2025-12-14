
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import { isTokenExpired } from '../../utils/jwt';
import { logout, setUserProfile } from '../../slices/userSlice';
import { getMe } from '../../api/auth';
import LoadingPage from '../ui/LoadingPage';

export default function PrivateRoute({ children, requireHost, requireAdmin }) {
  const { token, userInfo, isHost, isAdmin } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const hasRequestedProfile = useRef(false);

  // Token expiry handling
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      dispatch(logout());
    }
  }, [token, dispatch]);

  useEffect(() => {
    const hydrateUser = async () => {
      if (!token || userInfo || checkingProfile || hasRequestedProfile.current) return;
      try {
        setCheckingProfile(true);
        hasRequestedProfile.current = true;
        const profile = await getMe();
        if (profile && !profile.error) {
          dispatch(setUserProfile(profile));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        dispatch(logout());
      } finally {
        setCheckingProfile(false);
      }
    };

    hydrateUser();
  }, [token, userInfo, dispatch, checkingProfile]);

  useEffect(() => {
    if (!token) {
      hasRequestedProfile.current = false;
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  // While we're checking and hydrating profile, show a full-screen loader
  if (checkingProfile) {
    return <LoadingPage message="Checking account..." />;
  }

  if ((requireHost || requireAdmin) && !userInfo) {
    // No profile available after hydration: block access (redirect to login)
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (requireHost && !isHost) {
    return <Navigate to="/login" />;
  }

  return children;
}
