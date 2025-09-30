
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe } from '../api/auth';
import { getHackathons } from '../api';
import { Skeleton } from '../ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function HostDashboard() {
  const [profile, setProfile] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMe().then(data => {
      setProfile(data);
    });
  }, []);

  useEffect(() => {
    if (profile?.id) {
      getHackathons().then(data => {
        setHackathons(data.filter(h => h.hostId === profile.id));
        setLoading(false);
      });
    }
  }, [profile?.id]);

  if (!profile || loading) return <div className="max-w-7xl mx-auto py-8 px-4"><Skeleton height="h-64" /></div>;

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Profile Header */}
      <motion.div
        className="bg-gradient-to-r from-red-50 to-pink-100 border-b min-h-[260px] flex items-end"
        style={{marginTop: -64, paddingTop: 80}}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-0">
          <div className="flex items-start space-x-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <motion.img
                src={profile.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=128&background=random`}
                alt={profile.name}
                className="w-32 h-32 rounded-full bg-white shadow-md object-cover border-4 border-white"
                whileHover={{ scale: 1.05 }}
              />
            </div>
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:space-x-6 mt-2 text-gray-600 text-sm">
                    <span><span className="font-semibold">Location:</span> {profile.location || 'N/A'}</span>
                    <span><span className="font-semibold">Profession:</span> {profile.profession || 'N/A'}</span>
                  </div>
                </div>
                <Link
                  to="/host/profile"
                  className="bg-white text-red-600 px-4 py-2 rounded-md border border-red-600 hover:bg-red-50 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <motion.div className="bg-white p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.03 }}>
                  <h3 className="font-medium text-gray-900 mb-1">Bio</h3>
                  <p className="text-gray-700 min-h-[40px]">{profile.bio || <span className="text-gray-400">No bio added</span>}</p>
                </motion.div>
                <motion.div className="bg-white p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.03 }}>
                  <h3 className="font-medium text-gray-900 mb-1">Achievements</h3>
                  <ul className="list-disc pl-5 text-gray-700">
                    {profile.achievements?.length ? profile.achievements.map((ach, i) => (
                      <li key={i}>{ach}</li>
                    )) : <li className="text-gray-400">No achievements yet</li>}
                  </ul>
                </motion.div>
                <motion.div className="bg-white p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.03 }}>
                  <h3 className="font-medium text-gray-900 mb-1">Social Links</h3>
                  <div className="mt-2 flex flex-col space-y-2">
                    {profile.socialLinks ? Object.entries(profile.socialLinks).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </a>
                    )) : <span className="text-gray-400">No links</span>}
                  </div>
                </motion.div>
                <motion.div className="bg-white p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.03 }}>
                  <h3 className="font-medium text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-700 min-h-[40px]">{profile.email}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => navigate('/host/hackathon/new')}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors shadow-lg"
          >
            Host New Hackathon
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </motion.div>

        {/* Hackathons List */}
        <AnimatePresence>
        <motion.div
          className="space-y-8"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="bg-white rounded-lg shadow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">My Hackathons</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {hackathons.length ? hackathons.map((hackathon) => (
                <div key={hackathon.id} className="p-6">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0 w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      {hackathon.poster ? (
                        <img src={hackathon.poster} alt={hackathon.title} className="w-full h-full object-cover rounded-lg" />
                      ) : 'Poster'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{hackathon.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          hackathon.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {hackathon.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>Domain: {hackathon.domain}</div>
                        <div>Mode: {hackathon.mode}</div>
                        <div>Location: {hackathon.location}</div>
                        <div>Prize Pool: ${hackathon.prize}</div>
                        <div>Team Size: {hackathon.members}</div>
                        <div className="col-span-2">Date: {hackathon.date}</div>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <Link
                          to={`/hackathons/${hackathon.id}`}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-gray-400">You haven't hosted any hackathons yet.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
