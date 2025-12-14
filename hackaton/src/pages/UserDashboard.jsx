import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getMe,
  getTeamJoinRequests,
  respondToTeamJoinRequest
} from '../api';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Mail,
  Rocket,
  Users,
  UserRound,
  Award,
  Share2,
  Crown
} from 'lucide-react';

const pageGradient = 'bg-gradient-to-br from-[#f8fbff] via-[#eef3ff] to-[#fff6ff]';
const glassCard = 'relative overflow-hidden rounded-[32px] border border-white/60 bg-white/75 shadow-[0_40px_90px_-40px_rgba(79,70,229,0.35)] backdrop-blur-xl';
const badgeGlow = 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-600 text-xs font-semibold';

const normalizeHackathons = (profileData) => {
  if (!profileData) return [];

  const hackathonMap = new Map();

  const ensureEntry = (hackathon, seed = {}) => {
    if (!hackathon || typeof hackathon.id === 'undefined') return null;

    const existing = hackathonMap.get(hackathon.id);
    if (existing) {
      Object.assign(existing, seed);
      return existing;
    }

    const baseEntry = {
      ...hackathon,
      registrationId: null,
      registrationStatus: null,
      registeredAt: null,
      teamId: null,
      teamName: null,
      teamRole: null,
      teamMembers: [],
      teamMemberCount: 0,
      teamLeader: hackathon.host || null,
      teamCapacity: hackathon.teamSize ?? null,
      ...seed
    };

    hackathonMap.set(hackathon.id, baseEntry);
    return baseEntry;
  };

  if (Array.isArray(profileData.registrations)) {
    profileData.registrations.forEach((registration) => {
      if (!registration?.hackathon) return;
      const entry = ensureEntry(registration.hackathon);
      if (!entry) return;
      entry.registrationId = registration.id;
      entry.registrationStatus = registration.status;
      entry.registeredAt = registration.createdAt;
    });
  } else if (Array.isArray(profileData.hackathons)) {
    profileData.hackathons.forEach((hackathon) => {
      ensureEntry(hackathon);
    });
  }

  const hydrateFromTeam = (team, roleFallback) => {
    if (!team?.hackathon) return;
    const entry = ensureEntry(team.hackathon);
    if (!entry) return;

    entry.teamId = team.id;
    entry.teamName = team.name;
    entry.teamRole = roleFallback || entry.teamRole;
    entry.teamMembers = Array.isArray(team.members) ? team.members : [];
    entry.teamMemberCount = entry.teamMembers.length;
    const inferredLeader = team.leader
      || entry.teamLeader
      || (Array.isArray(team.members)
        ? team.members.find((member) => member.userId === team.leaderId)?.user
        : null);
    entry.teamLeader = inferredLeader || entry.teamLeader;
    entry.teamCapacity = team.hackathon.teamSize ?? entry.teamCapacity ?? null;
  };

  if (Array.isArray(profileData.teamMemberships)) {
    profileData.teamMemberships.forEach((membership) => {
      const team = membership?.team;
      if (!team) return;
      const role = membership.role || (team.leaderId === profileData.id ? 'Leader' : 'Member');
      hydrateFromTeam(team, role);
    });
  }

  if (Array.isArray(profileData.ledTeams)) {
    profileData.ledTeams.forEach((team) => {
      hydrateFromTeam(team, 'Leader');
    });
  }

  if (hackathonMap.size === 0) {
    return [];
  }

  return Array.from(hackathonMap.values()).sort((a, b) => {
    const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return startA - startB;
  });
};

const formatDate = (value, fallback = 'N/A') => {
  if (!value) return fallback;
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Failed to format date:', error);
    return fallback;
  }
};

const formatDateRange = (start, end) => {
  if (!start && !end) return 'Schedule TBA';
  if (!start) return `Ends ${formatDate(end)}`;
  if (!end) return `${formatDate(start)} onward`;
  return `${formatDate(start)} – ${formatDate(end)}`;
};

const formatRelativeTime = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return 'Just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [responding, setResponding] = useState({ id: null, action: null });
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  const teamHackathons = useMemo(
    () => hackathons.filter((hackathon) => Boolean(hackathon.teamId)),
    [hackathons]
  );

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  const handleToastClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const loadJoinRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const data = await getTeamJoinRequests();
      setJoinRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load join requests:', error);
      const msg = error?.message || 'Failed to load join requests';
      if (msg.toLowerCase().includes('unauthorized')) {
        showToast('Please log in to view team requests', 'warning');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setRequestsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMe();
        setProfile(data);
        setHackathons(normalizeHackathons(data));
      } catch (error) {
        console.error('Failed to load profile:', error);
        showToast(error.message || 'Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showToast]);

  useEffect(() => {
    loadJoinRequests();
  }, [loadJoinRequests]);

  const userProfileInfo = profile?.profile || {};
  const avatarUrl =
    userProfileInfo.profilePicUrl ||
    profile?.profilePicUrl ||
    (profile?.name
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=128&background=random`
      : 'https://ui-avatars.com/api/?name=User&size=128&background=random');

  const locationText = userProfileInfo.location || profile?.location || 'Planet Earth';
  const dobText = formatDate(userProfileInfo.dob || profile?.dob, 'Not provided');
  const bioText = userProfileInfo.bio || profile?.bio || 'Share a short intro about yourself to help teammates connect with you.';
  const achievementsList = Array.isArray(userProfileInfo.achievements) && userProfileInfo.achievements.length
    ? userProfileInfo.achievements
    : Array.isArray(profile?.achievements) && profile.achievements.length
    ? profile.achievements
    : [];
  const socialLinks = userProfileInfo.socialLinks || profile?.socialLinks || {};

  const stats = useMemo(() => {
    const now = new Date();
    const completed = hackathons.filter((hackathon) => {
      if (hackathon.status === 'Completed') return true;
      if (hackathon.endDate) {
        try {
          return new Date(hackathon.endDate) < now;
        } catch (error) {
          return false;
        }
      }
      return false;
    }).length;

    const upcoming = hackathons.filter((hackathon) => {
      if (!hackathon.startDate) return false;
      try {
        return new Date(hackathon.startDate) > now;
      } catch (error) {
        return false;
      }
    }).length;

    return {
      total: hackathons.length,
      completed,
      upcoming,
      pendingRequests: joinRequests.length,
      activeTeams: teamHackathons.length
    };
  }, [hackathons, joinRequests.length, teamHackathons.length]);

  const handleRespond = async (requestId, action) => {
    setResponding({ id: requestId, action });
    try {
      const response = await respondToTeamJoinRequest(requestId, action);
      showToast(response.message || `Request ${action === 'accept' ? 'accepted' : 'declined'}`, 'success');
      setJoinRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error('Failed to respond to join request:', error);
      showToast(error.message || 'Unable to update request', 'error');
    } finally {
      setResponding({ id: null, action: null });
      loadJoinRequests();
    }
  };

  if (loading || !profile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageGradient}`}>
        <Skeleton width="w-32" height="h-32" rounded="rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      className={`min-h-screen ${pageGradient} pb-20`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-6xl mx-auto px-4 pt-16 space-y-12">
        <motion.section
          className={`${glassCard} overflow-hidden`}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/15 via-rose-300/10 to-sky-300/15" />
          <div className="relative z-10 p-8 lg:p-12 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-6">
              <div className="relative">
                <motion.img
                  src={avatarUrl}
                  alt={profile.name}
                  className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl object-cover"
                  whileHover={{ scale: 1.05 }}
                />
                <span className="absolute -bottom-3 -right-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 text-indigo-600 text-xs font-semibold shadow-md">
                  <UserRound className="w-3.5 h-3.5" />
                  User mode
                </span>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className={badgeGlow}>
                    <SparklesIcon />
                    Welcome back
                  </span>
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">{profile.name}</h1>
                  <p className="text-slate-600 max-w-2xl text-sm lg:text-base">
                    Update your story, explore new hackathons, and keep an eye on teammates eager to join your squads.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    {locationText}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    {profile.email}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm">
                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                    DOB: {dobText}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatBadge
                    icon={<Users className="w-4 h-4" />}
                    label="Hackathons"
                    value={stats.total}
                    accent="from-indigo-500 to-sky-500"
                  />
                  <StatBadge
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Completed"
                    value={stats.completed}
                    accent="from-emerald-500 to-teal-500"
                  />
                  <StatBadge
                    icon={<Clock className="w-4 h-4" />}
                    label="Upcoming"
                    value={stats.upcoming}
                    accent="from-violet-500 to-purple-500"
                  />
                  <StatBadge
                    icon={<Bell className="w-4 h-4" />}
                    label="Join requests"
                    value={stats.pendingRequests}
                    accent="from-amber-500 to-orange-500"
                  />
                  <StatBadge
                    icon={<Crown className="w-4 h-4" />}
                    label="Active teams"
                    value={stats.activeTeams}
                    accent="from-rose-500 to-pink-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 items-start lg:items-end">
              <Button
                variant="ghost"
                onClick={() => navigate('/hackathons')}
                className="!bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 !text-white !px-6 !py-3 !rounded-full !shadow-lg !hover:shadow-xl !hover:-translate-y-0.5 !border-0 !focus:ring-2 !focus:ring-offset-2 !focus:ring-indigo-400"
              >
                Explore new hackathon
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
              <Link
                to="/user/profile"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Edit profile details
                <Share2 className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <motion.section
            className={`${glassCard} p-0 overflow-hidden`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white/90 to-transparent" />
            <div className="relative z-10 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <span className={badgeGlow}>
                    <Award className="w-4 h-4" />
                    Profile essentials
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900">Showcase what you bring</h2>
                  <p className="text-sm text-slate-500 max-w-xl">Keep this section updated to help potential teammates learn about your strengths and achievements.</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <InfoCard title="Bio" description={bioText} />
                <InfoCard
                  title="Achievements"
                  description={
                    achievementsList.length ? (
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                        {achievementsList.map((achievement, index) => (
                          <li key={`achievement-${index}`}>{achievement}</li>
                        ))}
                      </ul>
                    ) : (
                      'Add highlights from your journey so far.'
                    )
                  }
                />
                <InfoCard
                  title="Social links"
                  description={
                    Object.keys(socialLinks).length ? (
                      <div className="flex flex-col gap-2">
                        {Object.entries(socialLinks).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-semibold uppercase">
                              {platform.slice(0, 2)}
                            </span>
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        ))}
                      </div>
                    ) : (
                      'Link your GitHub, LinkedIn, or portfolio to stand out.'
                    )
                  }
                />
                <InfoCard
                  title="Contact"
                  description={
                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-500" /> {profile.email}</p>
                      <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> {locationText}</p>
                    </div>
                  }
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            className={`${glassCard} flex flex-col overflow-hidden`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/15 via-purple-400/10 to-sky-400/20" />
            <div className="relative z-10">
              <div className="px-8 pt-8 pb-6 border-b border-white/50 backdrop-blur-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className={badgeGlow}>
                    <Bell className="w-4 h-4" />
                    Leader notifications
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900">Requests to join your teams</h2>
                  <p className="text-sm text-slate-500">Approve or decline teammates eager to collaborate with you.</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={loadJoinRequests}
                  className="!text-indigo-600 hover:!text-indigo-700"
                  disabled={requestsLoading}
                >
                  {requestsLoading ? 'Refreshing...' : 'Refresh' }
                </Button>
              </div>
              <div className="p-8 pt-6 space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar">
                {requestsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={`request-skeleton-${index}`} height="h-24" rounded="rounded-2xl" />
                    ))}
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="text-center text-slate-500 py-16 space-y-3">
                    <Bell className="w-10 h-10 mx-auto text-indigo-200" />
                    <p className="text-base font-semibold text-slate-600">No pending requests</p>
                    <p className="text-sm">You’ll see join notifications here whenever someone applies to your teams.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {joinRequests.map((request) => {
                      const isBusy = responding.id === request.id;
                      const isAccepting = isBusy && responding.action === 'accept';
                      const isDeclining = isBusy && responding.action === 'decline';

                      return (
                        <motion.div
                          key={request.id}
                          className="relative border border-white/60 rounded-3xl bg-white/85 backdrop-blur p-6 shadow-[0_25px_60px_-30px_rgba(79,70,229,0.3)]"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-indigo-600">{request.user?.name || 'Prospective teammate'}</p>
                                <p className="text-xs text-slate-500">{request.user?.email}</p>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatRelativeTime(request.createdAt)}
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="text-sm text-slate-600">
                                <p className="font-semibold text-slate-800">Team</p>
                                <p>{request.team?.name}</p>
                              </div>
                              <div className="text-sm text-slate-600">
                                <p className="font-semibold text-slate-800">Hackathon</p>
                                <p>{request.team?.hackathon?.title || 'Unknown hackathon'}</p>
                              </div>
                              <div className="text-sm text-slate-600">
                                <p className="font-semibold text-slate-800">Preferred role</p>
                                <p>{request.role || 'Open to contribute anywhere'}</p>
                              </div>
                              <div className="text-sm text-slate-600">
                                <p className="font-semibold text-slate-800">Request ID</p>
                                <p>#{request.id}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <Button
                                variant="primary"
                                size="sm"
                                className="!bg-emerald-500 !hover:bg-emerald-600 !focus:ring-emerald-400 !border-0"
                                onClick={() => handleRespond(request.id, 'accept')}
                                isLoading={isAccepting}
                                disabled={isBusy}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-slate-600 hover:!text-slate-800"
                                onClick={() => handleRespond(request.id, 'decline')}
                                isLoading={isDeclining}
                                disabled={isBusy}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {teamHackathons.length > 0 && (
          <motion.section
            className={`${glassCard} overflow-hidden`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/15 via-purple-400/10 to-sky-400/20" />
            <div className="relative z-10">
              <div className="px-8 pt-8 pb-6 border-b border-white/60 flex items-center justify-between">
                <div className="space-y-2">
                  <span className={badgeGlow}>
                    <Crown className="w-4 h-4" />
                    Your active teams
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900">Collaborations in motion</h2>
                  <p className="text-sm text-slate-500">Jump back into any team workspace or review who’s building with you.</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100/70">
                <AnimatePresence>
                  {teamHackathons.map((entry, index) => {
                    const status = entry.registrationStatus
                      || (entry.endDate && new Date(entry.endDate) < new Date() ? 'Completed' : 'Registered');
                    const capacityLabel = entry.teamCapacity
                      ? `${entry.teamMemberCount}/${entry.teamCapacity}`
                      : `${entry.teamMemberCount}`;

                    return (
                      <motion.div
                        key={entry.teamId || `team-${index}`}
                        className="relative p-8 flex flex-col gap-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-slate-900">{entry.teamName}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-500" />
                              {entry.title}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                              {formatDateRange(entry.startDate, entry.endDate)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <StatusPill status={status} />
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Role: <span className="text-slate-700 normal-case">{entry.teamRole || 'Member'}</span>
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                          <p><span className="font-semibold">Team size:</span> {capacityLabel}{entry.teamCapacity ? '' : '+'}</p>
                          {entry.teamLeader && (
                            <p><span className="font-semibold">Leader:</span> {entry.teamLeader.name}</p>
                          )}
                        </div>
                        {entry.teamMembers?.length ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Members</p>
                            <div className="flex flex-wrap gap-2">
                              {entry.teamMembers.map((member) => (
                                <span
                                  key={`team-${entry.teamId}-member-${member.id}`}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-white/60 text-xs font-semibold text-slate-600"
                                >
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 font-semibold text-[11px]">
                                    {member.user?.name?.[0] || '?'}
                                  </span>
                                  {member.user?.name || 'Anonymous'}
                                  {member.role && <span className="text-slate-400">· {member.role}</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-3">
                          {entry.teamId && (
                            <Link
                              to={`/teams/${entry.teamId}`}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              Team page
                            </Link>
                          )}
                          <Link
                            to={`/hackathons/${entry.id}/teams`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            Open team space
                          </Link>
                          <Link
                            to={`/hackathons/${entry.id}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-700"
                          >
                            Hackathon details
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section
          className={`${glassCard} overflow-hidden`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/85 to-transparent" />
          <div className="relative z-10">
            <div className="px-8 pt-8 pb-6 border-b border-white/60 flex items-center justify-between">
              <div className="space-y-2">
                <span className={badgeGlow}>
                  <Users className="w-4 h-4" />
                  Participated hackathons
                </span>
                <h2 className="text-2xl font-semibold text-slate-900">Your hackathon journey</h2>
                <p className="text-sm text-slate-500">Track progress, revisit highlights, and celebrate wins.</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100/70">
              {hackathons.length ? (
                <AnimatePresence>
                  {hackathons.map((hackathon, index) => {
                    const status = hackathon.status || (hackathon.endDate && new Date(hackathon.endDate) < new Date() ? 'Completed' : 'Registered');

                    return (
                      <motion.div
                        key={hackathon.id || `hackathon-${index}`}
                        className="relative p-8 flex flex-col lg:flex-row gap-6 lg:items-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <div className="w-full lg:w-48 h-32 rounded-2xl bg-indigo-500/10 border border-white/60 overflow-hidden flex items-center justify-center">
                          {hackathon.poster ? (
                            <img
                              src={hackathon.poster}
                              alt={hackathon.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-indigo-400">Poster coming soon</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-slate-900">{hackathon.title}</h3>
                              <p className="text-sm text-slate-500 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-indigo-500" />
                                {formatDateRange(hackathon.startDate, hackathon.endDate)}
                              </p>
                            </div>
                            <StatusPill status={status} />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                            {hackathon.domain && <p><span className="font-semibold">Domain:</span> {hackathon.domain}</p>}
                            {hackathon.mode && <p><span className="font-semibold">Mode:</span> {hackathon.mode}</p>}
                            {hackathon.participants && <p><span className="font-semibold">Participants:</span> {hackathon.participants}</p>}
                            {hackathon.prize && <p><span className="font-semibold">Prize pool:</span> ${hackathon.prize}</p>}
                            {hackathon.members && <p><span className="font-semibold">Team size:</span> {hackathon.members}</p>}
                            {hackathon.guide && <p><span className="font-semibold">Guide:</span> {hackathon.guide}</p>}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {status === 'Completed' && hackathon.certificate ? (
                              <a
                                href={hackathon.certificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                              >
                                Download certificate
                              </a>
                            ) : (
                              <Link
                                to={`/hackathon/${hackathon.id}`}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                              >
                                View details
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="p-10 text-center space-y-3 text-slate-500">
                  <Users className="w-10 h-10 mx-auto text-indigo-200" />
                  <p className="text-base font-semibold text-slate-600">No hackathons yet</p>
                  <p className="text-sm">Register for a hackathon to start building your highlight reel.</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>

      <Toast isOpen={toast.open} message={toast.message} type={toast.type} onClose={handleToastClose} />
    </motion.div>
  );
}

const StatBadge = ({ icon, label, value, accent }) => (
  <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const InfoCard = ({ title, description }) => (
  <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-sm space-y-2">
    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</h3>
    {typeof description === 'string' ? (
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    ) : (
      description
    )}
  </div>
);

const StatusPill = ({ status }) => {
  const statusStyles = {
    Completed: 'bg-emerald-100 text-emerald-600',
    Registered: 'bg-indigo-100 text-indigo-600',
    Upcoming: 'bg-purple-100 text-purple-600'
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : status === 'Upcoming' ? <Clock className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
};

const SparklesIcon = () => (
  <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.95 7.05L19 9L13.95 10.95L12 16L10.05 10.95L5 9L10.05 7.05L12 2Z" />
    <path d="M6 13L6.75 15.25L9 16L6.75 16.75L6 19L5.25 16.75L3 16L5.25 15.25L6 13Z" />
    <path d="M18 13L18.75 15.25L21 16L18.75 16.75L18 19L17.25 16.75L15 16L17.25 15.25L18 13Z" />
  </svg>
);
