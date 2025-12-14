import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getHackathonById,
  getTeamsForHackathon,
  createTeamForHackathon,
  requestJoinTeam,
  getMe,
  leaveTeam,
  deleteTeam
} from '../api';
import { Input } from '../ui/Form';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';
import {
  Users,
  Sparkles,
  Crown,
  Target,
  UserCheck,
  PenSquare,
  ArrowRight,
  Loader2
} from 'lucide-react';

const pageGradient = 'bg-gradient-to-br from-[#f8fbff] via-[#eef3ff] to-[#fff6ff]';
const glassCard = 'relative overflow-hidden rounded-[32px] border border-white/60 bg-white/75 shadow-[0_40px_90px_-40px_rgba(79,70,229,0.35)] backdrop-blur-xl';
const badgeGlow = 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-600 text-xs font-semibold';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay }
  })
};

const formatDate = (value) => {
  if (!value) return 'TBA';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Failed to format date:', error);
    return 'TBA';
  }
};

export default function TeamDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinLoading, setJoinLoading] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', bio: '', roles: '' });
  const [joinRoles, setJoinRoles] = useState({});
  const [pendingRequests, setPendingRequests] = useState({});
  const [activePanel, setActivePanel] = useState('create');
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const userTeam = useMemo(() => {
    if (!user) return null;
    return (
      teams.find((team) => {
        const isLeader = team.leaderId === user.id;
        const isMember = team.members?.some((member) => member.userId === user.id);
        return isLeader || isMember;
      }) || null
    );
  }, [teams, user]);

  const disableTeamActions = useMemo(() => Boolean(userTeam), [userTeam]);
  const hasPendingRequest = useMemo(
    () => Object.keys(pendingRequests).length > 0,
    [pendingRequests]
  );
  const disableAllActions = useMemo(
    () => disableTeamActions || hasPendingRequest,
    [disableTeamActions, hasPendingRequest]
  );
  const teamCapacity = useMemo(() => {
    const parsedSize = Number(hackathon?.teamSize);
    return Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : null;
  }, [hackathon?.teamSize]);

  const showToast = (message, type = 'info') => {
    setToast({ open: true, message, type });
  };

  const handleToastClose = () => setToast((prev) => ({ ...prev, open: false }));

  const loadData = async (showLoader = true) => {
    if (!id) return;
    if (showLoader) setLoading(true);
    try {
      const [hackathonData, teamsData, userData] = await Promise.all([
        getHackathonById(id),
        getTeamsForHackathon(id),
        isAuthenticated ? getMe() : Promise.resolve(null)
      ]);

      const normalizedTeams = Array.isArray(teamsData)
        ? teamsData.map((team) => ({
            ...team,
            joinRequests: team.joinRequests || []
          }))
        : [];

      const pendingMap = {};
      if (userData) {
        normalizedTeams.forEach((team) => {
          if (team.joinRequests?.some((request) => request.userId === userData.id)) {
            pendingMap[team.id] = true;
          }
        });
      }

      setHackathon(hackathonData);
      setTeams(normalizedTeams);
      setUser(userData);
      setPendingRequests(pendingMap);
    } catch (error) {
      console.error('Failed to load team dashboard:', error);
      showToast(error.message || 'Unable to load team details', 'error');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (location.state?.justRegistered) {
      showToast('Welcome aboard! Time to assemble your team.', 'success');
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (userTeam) {
      setActivePanel('status');
    }
  }, [userTeam]);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    if (!id) return;

    if (disableAllActions) {
      showToast(
        hasPendingRequest
          ? 'You already have a join request pending. Please wait for a response.'
          : 'You are already part of a team for this hackathon.',
        'warning'
      );
      return;
    }

    if (!teamForm.name.trim()) {
      showToast('Team name is required.', 'warning');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: teamForm.name.trim(),
        bio: teamForm.bio.trim() || undefined,
        rolesRequired: teamForm.roles
          .split(',')
          .map((role) => role.trim())
          .filter(Boolean)
      };

      const createdTeam = await createTeamForHackathon(id, payload);
      showToast('Team created successfully! Invite your friends to join.', 'success');
      setTeamForm({ name: '', bio: '', roles: '' });
      setTeams((prev) => [createdTeam, ...prev.filter((team) => team.id !== createdTeam.id)]);
    } catch (error) {
      showToast(error.message || 'Failed to create team', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    if (!teamId) return;

    const targetTeam = teams.find((team) => team.id === teamId);
    const targetMemberCount = targetTeam?.members?.length || 0;
    if (teamCapacity && targetMemberCount >= teamCapacity) {
      showToast('This team already has the maximum number of members.', 'warning');
      return;
    }

    if (disableTeamActions) {
      showToast('You are already part of a team for this hackathon.', 'warning');
      return;
    }

    if (hasPendingRequest) {
      showToast('You already have a join request pending. Please wait for a response.', 'warning');
      return;
    }

    setJoinLoading(teamId);
    try {
      const preferredRole = joinRoles[teamId];
      const result = await requestJoinTeam(teamId, {
        role: preferredRole?.trim() || undefined
      });
      showToast(result.message || 'Join request sent!', 'success');
      setJoinRoles((prev) => ({ ...prev, [teamId]: '' }));
      setPendingRequests((prev) => ({ ...prev, [teamId]: true }));
      await loadData(false);
    } catch (error) {
      showToast(error.message || 'Unable to join team', 'error');
    } finally {
      setJoinLoading(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageGradient}`}>
        <Skeleton width="w-32" height="h-32" rounded="rounded-full" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center text-center ${pageGradient} p-6`}>
        <h2 className="text-2xl font-semibold text-rose-500 mb-4">Hackathon not found</h2>
        <Button variant="primary" onClick={() => navigate('/hackathons')}>
          Browse Hackathons
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className={`min-h-screen ${pageGradient} py-16 px-4`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.section
          className={`${glassCard} overflow-hidden`}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-rose-400/10 to-sky-400/10" />
          <div className="relative z-10 p-8 lg:p-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <span className={badgeGlow}>
                <Sparkles className="w-4 h-4" />
                Team Collaboration Hub
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                {hackathon.title}
              </h1>
              <p className="text-slate-600 text-base lg:text-lg">
                Build your dream team or join an existing one to compete in style. Collaborate, innovate, and win together with a workspace made for light theme lovers.
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 shadow-sm">
                  <CalendarIcon />
                  {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 shadow-sm">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Team size up to {hackathon.teamSize || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button variant="secondary" onClick={() => navigate(`/hackathons/${id}`)} className="px-6 py-3">
                View details
              </Button>
              <Button variant="primary" onClick={handleRefresh} isLoading={refreshing} className="px-6 py-3">
                <ArrowRight className="w-4 h-4 mr-2" />
                Refresh teams
              </Button>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-10 lg:grid-cols-2">
          <motion.section
            className={`${glassCard} p-0 overflow-hidden`}
            custom={0.1}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-transparent" />
            <div className="relative z-10 p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className={badgeGlow}>
                    <PenSquare className="w-4 h-4" />
                    Team Studio
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900">Shape your team experience</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Create a brand-new squad or keep tabs on your existing crew — all inside a single elegant workspace.
                  </p>
                </div>
                {userTeam && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    You have a team
                  </span>
                )}
              </div>

              <div className="w-full sm:w-auto inline-flex bg-white/70 rounded-full p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActivePanel('create')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                    activePanel === 'create'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Create team
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel('status')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                    activePanel === 'status'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  My status
                </button>
              </div>

              {activePanel === 'create' ? (
                <form onSubmit={handleCreateTeam} className="space-y-5">
                  <Input
                    label="Team name"
                    name="teamName"
                    value={teamForm.name}
                    onChange={(event) => setTeamForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="e.g. Quantum Coders"
                    disabled={creating || disableAllActions}
                    icon={<Crown className="w-5 h-5" />}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 tracking-wide">Team bio</label>
                    <motion.textarea
                      className="w-full h-28 rounded-2xl border border-white/50 bg-white/85 backdrop-blur px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:text-gray-500"
                      value={teamForm.bio}
                      onChange={(event) => setTeamForm((prev) => ({ ...prev, bio: event.target.value }))}
                      placeholder="Share your team's mission or focus areas"
                      disabled={creating || disableAllActions}
                      whileFocus={{ scale: 1.01 }}
                    />
                    <p className="text-xs font-medium text-slate-500/80 ml-1">Let others know what makes your team unique.</p>
                  </div>
                  <Input
                    label="Roles needed"
                    name="roles"
                    value={teamForm.roles}
                    onChange={(event) => setTeamForm((prev) => ({ ...prev, roles: event.target.value }))}
                    placeholder="e.g. Frontend, ML Engineer, Designer"
                    disabled={creating || disableAllActions}
                    helperText="Separate multiple roles with commas."
                    icon={<Target className="w-5 h-5" />}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={creating}
                    disabled={creating || disableAllActions}
                    fullWidth
                    className="mt-2"
                  >
                    Launch team
                  </Button>
                  {hasPendingRequest && (
                    <p className="text-xs text-amber-600 font-medium">You have a join request awaiting approval. Feel free to explore teams while you wait.</p>
                  )}
                </form>
              ) : (
                <div className="space-y-5">
                  {userTeam ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 text-emerald-700 px-5 py-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">Current team</div>
                      <h3 className="text-lg font-semibold text-emerald-800">{userTeam.name}</h3>
                      <p className="text-sm text-emerald-700/80">Members: {userTeam.members?.length || 0}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {userTeam.leaderId === user?.id ? (
                          <Button
                            variant="danger"
                            onClick={async () => {
                              const ok = window.confirm('Delete this team? This action is irreversible.');
                              if (!ok) return;
                              try {
                                await deleteTeam(userTeam.id);
                                showToast('Team deleted', 'success');
                                // reload teams and user
                                await loadData(false);
                                navigate(`/hackathons/${id}`);
                              } catch (err) {
                                showToast(err.message || 'Failed to delete team', 'error');
                              }
                            }}
                          >
                            Delete team
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              const ok = window.confirm('Leave this team? You can join another later.');
                              if (!ok) return;
                              try {
                                await leaveTeam(userTeam.id);
                                showToast('Left the team', 'success');
                                await loadData(false);
                              } catch (err) {
                                showToast(err.message || 'Failed to leave team', 'error');
                              }
                            }}
                          >
                            Leave team
                          </Button>
                        )}
                        <Button variant="ghost" onClick={() => navigate(`/hackathons/${id}`)} className="mt-0">
                          Manage participation
                        </Button>
                      </div>
                    </div>
                  ) : hasPendingRequest ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 text-amber-700 px-5 py-4 space-y-3">
                      <h3 className="text-lg font-semibold">Request pending</h3>
                      <p className="text-sm">
                        Hang tight! The team leader has received your message. You’ll join as soon as they accept your request.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 text-slate-600 px-5 py-4 space-y-3">
                      <h3 className="text-lg font-semibold text-slate-800">No team yet</h3>
                      <p className="text-sm">Create one or browse the explorer to find the perfect match.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            className={`${glassCard} flex flex-col overflow-hidden`}
            custom={0.2}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/15 via-purple-400/10 to-sky-400/20" />
            <div className="relative z-10">
              <div className="px-8 pt-8 pb-6 border-b border-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className={badgeGlow}>
                      <Users className="w-4 h-4" />
                      Team explorer
                    </span>
                    <h2 className="text-2xl font-semibold text-slate-900">Find your dream squad</h2>
                    <p className="text-sm text-slate-500">Scroll through curated teams, send a role message, and await approval.</p>
                  </div>
                  {refreshing ? (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  ) : (
                    <Button variant="ghost" onClick={handleRefresh} className="text-sm font-semibold">Refresh</Button>
                  )}
                </div>
              </div>
              <div className="p-8 pt-6 space-y-4 max-h-[540px] overflow-y-auto custom-scrollbar">
                {teams.length === 0 ? (
                  <div className="text-center text-slate-500 py-16">
                    <p className="text-base font-medium">No teams yet. Be the first to launch a crew!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {teams.map((team, index) => {
                      const memberCount = team.members?.length || 0;
                      const rolesNeeded = Array.isArray(team.rolesRequired) ? team.rolesRequired : [];
                      const isUserMember = userTeam && team.id === userTeam.id;
                      const isPending = pendingRequests[team.id];
                      const teamIsFull = teamCapacity ? memberCount >= teamCapacity : false;
                      const disableJoin = disableAllActions || isPending || teamIsFull;
                      const buttonLabel = isPending
                        ? 'Request sent'
                        : hasPendingRequest
                        ? 'Pending approval'
                        : 'Request to join';
                      const buttonVariant = isPending || hasPendingRequest ? 'secondary' : 'primary';

                      return (
                        <motion.div
                          key={team.id}
                          className="relative border border-white/60 rounded-3xl bg-white/85 backdrop-blur p-6 shadow-[0_25px_60px_-30px_rgba(79,70,229,0.3)]"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          {isUserMember ? (
                            <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold">
                              <UserCheck className="w-3.5 h-3.5" />
                              You’re in
                            </div>
                          ) : teamIsFull ? (
                            <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-100 text-rose-600 text-xs font-semibold">
                              <Users className="w-3.5 h-3.5" />
                              Team full
                            </div>
                          ) : null}
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-semibold text-slate-900">{team.name}</h3>
                              {team.leader && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
                                  <Crown className="w-3.5 h-3.5" />
                                  {team.leader.name}
                                </span>
                              )}
                            </div>
                            {team.bio && <p className="text-sm text-slate-600 leading-relaxed">{team.bio}</p>}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {rolesNeeded.length > 0 ? (
                                rolesNeeded.map((role, roleIndex) => (
                                  <span
                                    key={`${team.id}-role-${roleIndex}`}
                                    className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 font-semibold"
                                  >
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold">
                                  Open to all skills
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Members ({memberCount})</p>
                              <div className="space-y-1.5 text-sm text-slate-600">
                                {team.members?.map((member) => (
                                  <div key={`${team.id}-member-${member.id}`} className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 font-semibold text-xs">
                                      {member.user?.name?.[0] || '?'}
                                    </span>
                                    <span className="font-medium">{member.user?.name || 'Anonymous'}</span>
                                    {member.role && <span className="text-xs text-slate-400">— {member.role}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {!isUserMember && (
                              <div className="space-y-3">
                                {teamIsFull ? (
                                  <p className="text-sm text-rose-500 font-semibold text-center">
                                    This team already reached the member limit.
                                  </p>
                                ) : (
                                  <>
                                    <Input
                                      label="Preferred role"
                                      placeholder="How would you contribute?"
                                      value={joinRoles[team.id] || ''}
                                      onChange={(event) => setJoinRoles((prev) => ({ ...prev, [team.id]: event.target.value }))}
                                      disabled={Boolean(joinLoading) || disableJoin}
                                    />
                                    <Button
                                      variant={buttonVariant}
                                      fullWidth
                                      onClick={() => handleJoinTeam(team.id)}
                                      disabled={Boolean(joinLoading) || disableJoin}
                                      isLoading={joinLoading === team.id}
                                    >
                                      {buttonLabel}
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
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
      </div>

      <Toast isOpen={toast.open} message={toast.message} type={toast.type} onClose={handleToastClose} />
    </motion.div>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-12 7h14a2 2 0 002-2V7a2 2 0 00-2-2h-1V3m-12 2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
