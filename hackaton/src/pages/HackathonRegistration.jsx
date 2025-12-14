import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { registerForHackathon, getHackathonById, checkRegistrationStatus } from '../api';
import { Input, Select } from '../ui/Form';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';
import { Users, Trophy, Globe, Calendar, Clock, GraduationCap, BookOpen, User, Phone, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const gradientText = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent";
const cardGradient = "bg-gradient-to-br from-white/80 via-indigo-100 to-cyan-100 border border-white/50 backdrop-blur-xl";
const formGradient = "bg-white/80 border border-white/50 backdrop-blur-xl";

export default function HackathonRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [form, setForm] = useState({
    instituteName: '',
    course: '',
    gender: '',
    phoneNumber: '',
    profession: ''
  });
  const [hackathon, setHackathon] = useState(null);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  const disableForm = useMemo(
    () => loading || isRegistered || checkingRegistration,
    [loading, isRegistered, checkingRegistration]
  );

  useEffect(() => {
    let isMounted = true;

    const loadHackathon = async () => {
      if (!id) {
        setFetchError('Registration link is missing a hackathon ID.');
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        const data = await getHackathonById(id);
        if (!isMounted) return;

        if (!data || data.error || data.message === 'Hackathon not found') {
          const message = data?.message || data?.error || 'Unable to load hackathon details.';
          setFetchError(message);
          setToast({ open: true, message, type: 'error' });
          setHackathon(null);
        } else {
          setHackathon(data);
          setFetchError('');
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err.message || 'Failed to load hackathon.';
        setFetchError(message);
        setToast({ open: true, message, type: 'error' });
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    loadHackathon();

    const verifyRegistration = async () => {
      if (!id) {
        setCheckingRegistration(false);
        return;
      }

      try {
        setCheckingRegistration(true);
        const status = await checkRegistrationStatus(id);
        if (!isMounted) return;
        setIsRegistered(Boolean(status?.registered));
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to check registration status:', err);
      } finally {
        if (isMounted) {
          setCheckingRegistration(false);
        }
      }
    };

    verifyRegistration();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistered) {
      setToast({ open: true, message: 'You are already registered for this hackathon.', type: 'info' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setToast({ open: true, message: 'Please log in to register for hackathons.', type: 'warning' });
      setTimeout(() => navigate('/login', { state: { from: location.pathname } }), 1200);
      return;
    }

    const sanitizedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );

    if (Object.values(sanitizedForm).some((value) => !value)) {
      setToast({ open: true, message: 'Please fill in all required fields.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const response = await registerForHackathon(id, sanitizedForm);
      if (response.error) {
        setError(response.error);
        setToast({ open: true, message: response.error, type: 'error' });
      } else {
        setToast({ open: true, message: 'Registration successful! Redirecting you to the team hub...', type: 'success' });
        setIsRegistered(true);
        setTimeout(() => navigate(`/hackathons/${id}/teams`, { state: { justRegistered: true } }), 1200);
      }
    } catch (err) {
      setError(err.message);
      setToast({ open: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToastClose = () => setToast({ ...toast, open: false });

  if (pageLoading) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex flex-col items-center gap-4">
          <Skeleton width="w-32" height="h-32" rounded="rounded-full" />
          <p className="text-indigo-600 font-semibold">Loading hackathon details...</p>
        </div>
      </motion.div>
    );
  }

  if (fetchError) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-rose-200 max-w-lg w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-rose-600 mb-3">Unable to open registration</h2>
          <p className="text-rose-500 mb-6">{fetchError}</p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/hackathons')}
              className="px-6"
            >
              Back to Hackathons
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/hackathons/${id}`)}
              disabled={!id}
              className="px-6"
            >
              View Details
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-white py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-start rounded-3xl shadow-2xl overflow-hidden p-12 bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100">
        {/* Left: Hackathon Details Card */}
        <motion.div
          className={cardGradient + " flex flex-col gap-2 w-full p-8 rounded-3xl shadow-xl self-start"}
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          {hackathon && (
            <>
              <motion.img
                src={hackathon.poster}
                alt={hackathon.title}
                className="w-full h-64 object-cover rounded-2xl mb-6 shadow-lg border border-white/40 hover:scale-105 hover:shadow-2xl transition-transform duration-200"
                whileHover={{ scale: 1.04 }}
              />
              <h2 className={gradientText + " text-3xl font-extrabold leading-tight drop-shadow mb-2"}>{hackathon.title}</h2>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <span className={gradientText + " inline-flex items-center gap-1 font-semibold"}><Users className="w-4 h-4 text-blue-400" />{`${hackathon.participants?.toLocaleString() || "0"} participants`}</span>
                <span className={gradientText + " inline-flex items-center gap-1 font-semibold"}><Trophy className="w-4 h-4 text-pink-400" />{`₹${hackathon.prize || 0} prize`}</span>
                <span className={gradientText + " inline-flex items-center gap-1 font-semibold"}><Globe className="w-4 h-4 text-cyan-400" />{`Mode: ${hackathon.mode || "ONLINE"}`}</span>
                <span className={gradientText + " inline-flex items-center gap-1 font-semibold"}><Calendar className="w-4 h-4 text-purple-400" />{`Dates: ${hackathon.startDate || "TBA"} - ${hackathon.endDate || "TBA"}`}</span>
                <span className={gradientText + " inline-flex items-center gap-1 font-semibold"}><Clock className="w-4 h-4 text-blue-400" />{`Team Size: ${hackathon.teamSize || hackathon.members || "N/A"}`}</span>
                <span className={gradientText + " inline-flex items-center gap-1 font-semibold"}><Globe className="w-4 h-4 text-cyan-400" />{`Location: ${hackathon.location || "N/A"}`}</span>
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 text-blue-700 text-xs font-bold shadow">{hackathon.domain}</span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 text-pink-700 text-xs font-bold shadow">{hackathon.Is_Paid || hackathon.paid ? "Paid" : "Free"}</span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-100 via-blue-100 to-purple-100 text-cyan-700 text-xs font-bold shadow">{hackathon.location}</span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 text-purple-700 text-xs font-bold shadow">{hackathon.mode}</span>
              </div>
              <div className="mt-4">
                <p className={gradientText + " text-base font-semibold"}>{hackathon.description}</p>
              </div>
            </>
          )}
        </motion.div>
        {/* Right: Registration Form */}
        <motion.div
          className={formGradient + " flex flex-col justify-center h-full w-full p-8 rounded-3xl shadow-xl"}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <h1 className={gradientText + " text-2xl font-bold mb-6 text-center drop-shadow-lg"}>Hackathon Registration</h1>
          <Toast isOpen={toast.open} message={toast.message} type={toast.type} onClose={handleToastClose} />
          {checkingRegistration && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-600 px-4 py-3 rounded-xl mb-4 text-sm font-semibold text-center">
              Checking your registration status...
            </div>
          )}
          {isRegistered && !checkingRegistration && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl mb-4 text-sm font-semibold text-center shadow">
              You are already registered for this hackathon.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={<span className={gradientText + " font-semibold"}>Institute Name*</span>}
              name="instituteName"
              required
              value={form.instituteName}
              onChange={handleChange}
              disabled={disableForm}
              icon={<GraduationCap className="w-5 h-5" />}
              placeholder="e.g. Stanford University"
              helperText="Mention the institute or organization you represent."
            />
            <Input
              label={<span className={gradientText + " font-semibold"}>Course*</span>}
              name="course"
              required
              value={form.course}
              onChange={handleChange}
              disabled={disableForm}
              icon={<BookOpen className="w-5 h-5" />}
              placeholder="e.g. B.Tech Computer Science"
              helperText="Share your current course or specialization."
            />
            <Select
              label={<span className={gradientText + " font-semibold"}>Gender*</span>}
              name="gender"
              required
              value={form.gender}
              onChange={handleChange}
              options={['Male', 'Female', 'Other']}
              placeholder="Select gender"
              disabled={disableForm}
              icon={<User className="w-5 h-5" />}
              helperText="We use this information only for inclusive reporting."
            />
            <Input
              label={<span className={gradientText + " font-semibold"}>Phone Number*</span>}
              name="phoneNumber"
              required
              value={form.phoneNumber}
              onChange={handleChange}
              disabled={disableForm}
              icon={<Phone className="w-5 h-5" />}
              placeholder="e.g. +1 98765 43210"
              helperText="We'll only contact you for hackathon updates."
            />
            <Input
              label={<span className={gradientText + " font-semibold"}>Profession*</span>}
              name="profession"
              required
              value={form.profession}
              onChange={handleChange}
              disabled={disableForm}
              icon={<Briefcase className="w-5 h-5" />}
              placeholder="e.g. Student, Product Engineer"
              helperText="Let organizers know your current role."
            />
            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              disabled={disableForm}
              className="rounded-xl px-8 py-3 text-lg tracking-wide font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner"
            >
              {isRegistered ? 'Registered' : 'Register'}
            </Button>
          </form>
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mt-4 font-semibold text-center shadow">
              {error}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
