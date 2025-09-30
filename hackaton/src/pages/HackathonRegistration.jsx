import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { registerForHackathon, getHackathonById } from '../api';
import { Input, Select } from '../ui/Form';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { Users, Trophy, Globe, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const gradientText = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent";
const cardGradient = "bg-gradient-to-br from-white/80 via-indigo-100 to-cyan-100 border border-white/50 backdrop-blur-xl";
const formGradient = "bg-white/80 border border-white/50 backdrop-blur-xl";

export default function HackathonRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [form, setForm] = useState({
    instituteName: '',
    course: '',
    gender: '',
    phoneNumber: '',
    profession: ''
  });
  const [hackathon, setHackathon] = useState(null);
  useEffect(() => {
    getHackathonById(id).then(data => setHackathon(data));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await registerForHackathon(id, form);
      if (response.error) {
        setError(response.error);
        setToast({ open: true, message: response.error, type: 'error' });
      } else {
        setToast({ open: true, message: 'Registration successful!', type: 'success' });
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (err) {
      setError(err.message);
      setToast({ open: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToastClose = () => setToast({ ...toast, open: false });

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 rounded-3xl shadow-2xl overflow-hidden bg-white/0">
        {/* Left: Hackathon Details Card */}
        <motion.div
          className={cardGradient + " flex flex-col justify-center h-full w-full p-8 rounded-3xl shadow-xl"}
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
                <span className={gradientText + " inline-flex items-center gap-1 font-semibold"}><Trophy className="w-4 h-4 text-pink-400" />{`$${hackathon.prize || 0} prize`}</span>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={<span className={gradientText + " font-semibold"}>Institute Name*</span>}
              name="instituteName"
              required
              value={form.instituteName}
              onChange={handleChange}
            />
            <Input
              label={<span className={gradientText + " font-semibold"}>Course*</span>}
              name="course"
              required
              value={form.course}
              onChange={handleChange}
            />
            <Select
              label={<span className={gradientText + " font-semibold"}>Gender*</span>}
              name="gender"
              required
              value={form.gender}
              onChange={handleChange}
              options={['Male', 'Female', 'Other']}
              placeholder="Select gender"
            />
            <Input
              label={<span className={gradientText + " font-semibold"}>Phone Number*</span>}
              name="phoneNumber"
              required
              value={form.phoneNumber}
              onChange={handleChange}
            />
            <Input
              label={<span className={gradientText + " font-semibold"}>Profession*</span>}
              name="profession"
              required
              value={form.profession}
              onChange={handleChange}
            />
            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              className="rounded-xl px-8 py-3 text-lg tracking-wide font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner"
            >
              Register
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
