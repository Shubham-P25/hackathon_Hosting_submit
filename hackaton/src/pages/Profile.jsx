import { useEffect, useState } from "react";
import { getMe, deleteHackathon, getHackathons as fetchHackathons } from "../api";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import UserProfileView from "../components/Profile/UserProfileView";
import HostProfileView from "../components/Profile/HostProfileView";
import { Skeleton } from '../ui/Skeleton';
import { Toast } from '../ui/Toast';

function Profile() {
  const user = useSelector((state) => state.user);
  const [hostedHackathons, setHostedHackathons] = useState([]);
  const [error, setError] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Helper functions
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const formatDateTime = (date) => new Date(date).toLocaleString();

  // ✅ Auto-clear success/error messages
  useEffect(() => {
    if (deleteMsg) {
      const timer = setTimeout(() => setDeleteMsg("") , 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteMsg]);

  // ✅ Fetch user & hackathons
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view your profile.");
      setLoading(false);
      return;
    }
    getMe(token)
      .then((res) => {
        if (
          res.error ||
          res.message === "Not authorized, token failed" ||
          res.message === "Not authorized, no token provided" ||
          res.message === "User not found"
        ) {
          setError("You must be logged in to view your profile.");
        } else {
          // If user is HOST, fetch their hackathons
          if (res.role === "HOST") {
            fetchHackathons().then((data) => {
              setHostedHackathons(
                Array.isArray(data) ? data.filter((h) => h.hostId === res.id) : []
              );
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      })
      .catch(() => {
        setError("You must be logged in to view your profile.");
        setLoading(false);
      });
  }, []);

  // ✅ Handle Hackathon Delete
  const handleDelete = async (hackathonId) => {
    try {
      const data = await deleteHackathon(hackathonId);
      console.log('Delete result:', data);
      
      if (data.error) {
        setDeleteMsg(data.error);
        return;
      }
      
      setDeleteMsg("Hackathon deleted successfully");
      setHostedHackathons(hostedHackathons.filter((h) => h.id !== hackathonId));
    } catch (error) {
      console.error('Handle delete error:', error);
      setDeleteMsg(error.message || "Failed to delete hackathon");
    }
  };

  const handleToastClose = () => setToast({ ...toast, open: false });

  // ✅ Error & loading states
  if (loading) return <div className="max-w-4xl mx-auto py-10"><Skeleton height="h-64" /></div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Toast isOpen={toast.open} message={toast.message} type={toast.type} onClose={handleToastClose} />
      {user.role === "USER" ? (
        <UserProfileView user={user} />
      ) : (
        <HostProfileView user={user} hackathons={hostedHackathons} />
      )}
    </div>
  );
}

export default Profile;

