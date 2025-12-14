import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { getMe } from '../api/auth';
import { getHackathons } from '../api';
import { Skeleton } from '../ui/Skeleton';
import { MapPin, Mail, CalendarDays, Rocket, Crown, Users, Sparkles } from 'lucide-react';

const pageGradient = 'bg-gradient-to-br from-[#f8fbff] via-[#eef3ff] to-[#fff6ff]';
const glassCard = 'relative overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.06)] backdrop-blur-sm';
const badgeGlow = 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/90 text-indigo-600 text-xs font-semibold';

// small CountUp component that animates from 0 to target on mount
function CountUp({ value = 0, duration = 0.9, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (!ref.current) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const current = Math.floor(progress * (end - start) + start);
      ref.current.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span ref={ref} className={className}>{Number(value).toLocaleString()}</span>;
}

export default function HostDashboard() {
  const [profile, setProfile] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMe();
      if (data?.error) {
        throw new Error(data?.message || data.error || 'Failed to load profile');
      }
      setProfile(data);
    } catch (err) {
      console.error('Failed to load host profile', err);
      setError(err.message || 'Failed to load host profile');
      setLoading(false);
    }
  }, []);

  const loadHostedHackathons = useCallback(
    async (hostId) => {
      try {
        if (!hostId) return;
        const data = await getHackathons();
        if (!Array.isArray(data)) {
          throw new Error(data?.message || data?.error || 'Failed to load hackathons');
        }
        setHackathons(data.filter((hackathon) => hackathon.hostId === hostId));
      } catch (err) {
        console.error('Failed to load host hackathons', err);
    setError((previous) => previous ?? (err.message || 'Failed to load your hackathons'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.id) {
      loadHostedHackathons(profile.id);
    }
  }, [profile?.id, loadHostedHackathons]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Skeleton height="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">We ran into an issue</h2>
        <p className="text-gray-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 rounded-md border border-red-500 text-red-600 hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <motion.div className={`min-h-screen ${pageGradient} pb-20`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-6xl mx-auto px-4 pt-16 space-y-12">
        <motion.section className={`${glassCard} overflow-hidden`} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/15 via-rose-300/10 to-sky-300/15" />
          <div className="relative z-10 p-8 lg:p-12 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-6">
              <div className="relative">
                <motion.img
                  src={profile.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=128&background=random`}
                  alt={profile.name}
                  className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl object-cover"
                  whileHover={{ scale: 1.05 }}
                />
                <span className="absolute -bottom-3 -right-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 text-indigo-600 text-xs font-semibold shadow-md">
                  Host mode
                </span>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className={badgeGlow}>
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Welcome back
                  </span>
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">{profile.name}</h1>
                  <p className="text-slate-600 max-w-2xl text-sm lg:text-base">Manage your hackathons, review registrations, and edit events you’re hosting.</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    {profile.location || 'N/A'}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    {profile.email}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm">
                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                    {profile.profession || 'Host'}
                  </span>
                </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          {
                            key: 'host-new',
                            icon: <Rocket className="w-4 h-4" />,
                            title: 'Quick action',
                            value: 'Host new',
                            bg: 'from-indigo-500 to-sky-500',
                            onClick: () => navigate('/host/hackathon/new'),
                          },
                          {
                            key: 'hosted',
                            icon: <Crown className="w-4 h-4" />,
                            title: 'Hosted',
                            value: <CountUp value={hackathons.length} className="text-lg font-semibold text-slate-900" />,
                            bg: 'from-emerald-500 to-teal-500',
                          },
                          {
                            key: 'teams',
                            icon: <Users className="w-4 h-4" />,
                            title: 'Active teams',
                            value: '—',
                            bg: 'from-violet-500 to-purple-500',
                          },
                        ].map((card) => (
                          <motion.button
                            key={card.key}
                            onClick={card.onClick}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.995 }}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                            className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm text-left hover:shadow-md focus:outline-none"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${card.bg} text-white shadow-lg`}>
                                {card.icon}
                              </span>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.title}</p>
                                <div className="text-lg font-semibold text-slate-900">{card.value}</div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 items-start lg:items-end">
              <Link to="/host/profile" className="bg-white text-red-600 px-4 py-2 rounded-md border border-red-600 hover:bg-red-50 transition-colors">Edit Profile</Link>
            </div>
          </div>
        </motion.section>
      </div>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <motion.button
            onClick={() => navigate('/host/hackathon/new')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white font-medium rounded-md hover:from-red-700 hover:to-rose-600 transition-colors shadow-2xl"
          >
            Host New Hackathon
            <motion.svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" initial={{ x: 0 }} whileHover={{ x: 4 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </motion.svg>
          </motion.button>
        </motion.div>

        {/* Hackathons List */}
        <AnimatePresence>
          <motion.div className="space-y-8" initial="hidden" animate="visible" exit="exit">
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
                {hackathons.length ? (
                  hackathons.map((hackathon) => {
                    const startDate = hackathon.startDate ? new Date(hackathon.startDate) : null;
                    const endDate = hackathon.endDate ? new Date(hackathon.endDate) : null;
                    const now = new Date();
                    let statusLabel = 'Upcoming';

                    if (startDate && endDate) {
                      if (now < startDate) statusLabel = 'Upcoming';
                      else if (now > endDate) statusLabel = 'Completed';
                      else statusLabel = 'Ongoing';
                    }

                    return (
                      <motion.div
                        key={hackathon.id}
                        className="p-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01, boxShadow: '0 10px 30px rgba(2,6,23,0.08)' }}
                        transition={{ duration: 0.35 }}
                      >
                        <div className="flex items-start space-x-6">
                          <div className="flex-shrink-0 w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-400 shadow-sm">
                            {hackathon.poster ? (
                              <img src={hackathon.poster} alt={hackathon.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <div className="text-sm text-gray-400">Poster</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900">{hackathon.title}</h3>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  statusLabel === 'Completed'
                                    ? 'bg-green-100 text-green-800'
                                    : statusLabel === 'Ongoing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                              <div>Domain: {hackathon.domain}</div>
                              <div>Mode: {hackathon.mode}</div>
                              <div>Location: {hackathon.location || 'N/A'}</div>
                              <div>Team Size: {hackathon.teamSize || 'Flexible'}</div>
                              <div className="col-span-2">
                                Dates: {startDate ? startDate.toLocaleDateString() : 'TBA'}
                                {endDate ? ` → ${endDate.toLocaleDateString()}` : ''}
                              </div>
                            </div>
                            <div className="mt-4 flex space-x-3">
                              <Link to={`/hackathons/${hackathon.id}`} className="text-red-600 hover:text-red-700 font-medium">
                                View Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => navigate(`/host/hackathons/${hackathon.id}/edit`)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
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
