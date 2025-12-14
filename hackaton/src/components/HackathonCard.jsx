import { useState, useEffect } from 'react';
import { checkRegistrationStatus } from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  Globe, 
  Calendar, 
  Clock, 
  MapPin, 
  
  Eye, 
  Heart,
  Share2,
  ExternalLink,
  Star,
  Zap,
  Target,
  Award
} from 'lucide-react';

// Local Rupee renderer to avoid dependency issues and to match Indian currency symbol
function Rupee({ size = 16, className = '' }) {
  // size maps to font-size roughly; lucide icons use px size props
  return (
    <span className={`${className} inline-block`} style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
      ₹
    </span>
  );
}

// Utility function to format date range
const fmtRange = ({ start, end }) => {
  if (!start || !end) return 'TBD';
  const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startDate} - ${endDate}`;
};

// Meta component for displaying icon + text
const Meta = ({ icon: Icon, label, color = "text-slate-600" }) => (
  <div className={`flex items-center gap-2 ${color}`}>
    <Icon size={16} className="flex-shrink-0" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

// Pill component for tags
const Pill = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200",
    success: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200",
    warning: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200",
    premium: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200"
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]} transition-all duration-200 hover:scale-105`}>
      {children}
    </span>
  );
};

// Button component
const Button = ({ children, variant = "primary", size = "md", className = "", onClick, ...props }) => {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <motion.button
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-semibold transition-all duration-200 ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export function HackathonCard({ hackathon, onNavigate }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const routeTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(hackathon.likes || Math.floor(Math.random() * 500) + 50);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        staggerChildren: 0.1 
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: hackathon.title,
        text: hackathon.description,
        url: window.location.href
      });
    }
  };

  const getPrizeDisplay = () => {
    if (!hackathon.prize) return "Prize TBD";
    return `₹${hackathon.prize.toLocaleString()}`;
  };

  const getStatusColor = () => {
    const now = new Date();
    const startDate = new Date(hackathon.startDate);
    const endDate = new Date(hackathon.endDate);
    
    if (now < startDate) return { color: "text-blue-600", bg: "bg-blue-100", text: "Upcoming" };
    if (now >= startDate && now <= endDate) return { color: "text-green-600", bg: "bg-green-100", text: "Live" };
    return { color: "text-gray-600", bg: "bg-gray-100", text: "Ended" };
  };

  const status = getStatusColor();

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      if (!hackathon?.id) return;
      try {
        const res = await checkRegistrationStatus(hackathon.id);
        if (!mounted) return;
        setIsRegistered(Boolean(res?.registered));
      } catch (e) {
        // fail silently — registration status is optional
        console.error('checkRegistrationStatus error:', e);
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, [hackathon?.id]);

  return (
    <motion.div
      className="group relative"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"
        animate={{
          scale: isHovered ? 1.05 : 1,
          opacity: isHovered ? 0.8 : 0
        }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.div
        className="relative bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-white/20"
        whileHover={{ 
          y: -8,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <motion.div 
            className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color} shadow-lg`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {status.text}
          </motion.div>
        </div>

        {/* Like and Share buttons */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <motion.button
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
            onClick={handleLike}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </motion.button>
          <motion.button
            className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white backdrop-blur-md transition-all duration-200"
            onClick={handleShare}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Share2 size={16} />
          </motion.button>
        </div>

        {/* Image Section */}
        <motion.div 
          className="relative h-56 overflow-hidden"
          variants={contentVariants}
        >
          <motion.img 
            src={hackathon.poster || hackathon.image || '/api/placeholder/400/300'} 
            alt={hackathon.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Floating stats */}
          <motion.div 
            className="absolute bottom-4 left-4 flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
              <Users size={12} className="inline mr-1" />
              {hackathon.participants?.toLocaleString() || "0"}
            </div>
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
              <Heart size={12} className="inline mr-1" />
              {likeCount}
            </div>
          </motion.div>
        </motion.div>

        {/* Content Section */}
        <motion.div 
          className="p-6"
          variants={contentVariants}
        >
          {/* Title */}
          <motion.h3 
            className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2"
            variants={contentVariants}
          >
            {hackathon.title}
          </motion.h3>

          {/* Description */}
          <motion.p 
            className={`text-gray-600 mb-4 leading-relaxed ${showFullDescription ? '' : 'line-clamp-2'}`}
            variants={contentVariants}
          >
            {hackathon.description || "Join this exciting hackathon and showcase your skills!"}
          </motion.p>
          
          {hackathon.description && hackathon.description.length > 100 && (
            <button
              className="text-indigo-600 text-sm font-medium hover:text-indigo-700 mb-4"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}

          {/* Key Info Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-3 mb-4"
            variants={contentVariants}
          >
            <Meta 
              icon={Rupee} 
              label={getPrizeDisplay()}
              color="text-green-600" 
            />
            <Meta 
              icon={Calendar} 
              label={fmtRange({start: hackathon.startDate, end: hackathon.endDate})}
            />
            <Meta 
              icon={MapPin} 
              label={hackathon.location || hackathon.mode || "Online"}
            />
            <Meta 
              icon={Users} 
              label={`Team: ${hackathon.teamSize || hackathon.members || "1-4"}`}
            />
          </motion.div>

          {/* Tags */}
          <motion.div 
            className="flex flex-wrap gap-2 mb-6"
            variants={contentVariants}
          >
            {hackathon.domain && (
              <Pill variant="default">{hackathon.domain}</Pill>
            )}
            <Pill variant={hackathon.Is_Paid || hackathon.paid ? "warning" : "success"}>
              {hackathon.Is_Paid || hackathon.paid ? "Paid" : "Free"}
            </Pill>
            {hackathon.mode && (
              <Pill variant="default">{hackathon.mode}</Pill>
            )}
            {hackathon.difficulty && (
              <Pill variant="premium">{hackathon.difficulty}</Pill>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex gap-3"
            variants={contentVariants}
          >
            {isRegistered ? (
              <Button variant="secondary" className="flex-1 shadow-lg" onClick={() => routeTo(`/hackathons/${hackathon.id}`)} disabled>
                <Star size={16} className="mr-2" />
                Already registered
              </Button>
            ) : (
              <Button
                variant="primary"
                className="flex-1 shadow-lg"
                onClick={() => routeTo(`/hackathons/${hackathon.id}/registration`)}
              >
                <Zap size={16} className="mr-2" />
                Apply Now
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => routeTo(`/hackathons/${hackathon.id}`)}
            >
              <Eye size={16} />
            </Button>
          </motion.div>
        </motion.div>

        {/* Hover overlay effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default HackathonCard;