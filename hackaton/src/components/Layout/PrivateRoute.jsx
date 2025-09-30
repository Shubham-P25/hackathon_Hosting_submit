
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { isTokenExpired } from '../../utils/jwt';
import { logout } from '../../store/slices/userSlice';

export default function PrivateRoute({ children, requireHost, requireAdmin }) {
  const { token, isHost, isAdmin } = useSelector(state => state.user);
  const dispatch = useDispatch();

  // Token expiry handling (example: if token is expired, clear and redirect)

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      dispatch(logout());
    }
  }, [token, dispatch]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (requireHost && !isHost) {
    return <Navigate to="/profile" />;
  }

  return children;
}
