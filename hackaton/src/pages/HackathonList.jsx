import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Filter, 
  X, 
  MapPin, 
  Globe, 
  Users, 
  TrendingUp,
  Zap,
  Sparkles,
  ChevronDown,
  
} from 'lucide-react';

// Local Rupee renderer for filter icons
function Rupee({ size = 16, className = '' }) {
  return (
    <span className={`${className} inline-block`} style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
      ₹
    </span>
  );
}
import { getHackathons } from '../api';
import HackathonCard from '../components/HackathonCard';
import { Skeleton } from '../ui/Skeleton';

// Enhanced Search Component
const EnhancedSearch = ({ value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <motion.div 
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`relative bg-white backdrop-blur-lg rounded-2xl border-2 transition-all duration-300 shadow-lg ${
        isFocused 
          ? 'border-indigo-500 shadow-xl shadow-indigo-500/25 scale-[1.02]' 
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-xl'
      }`}>
        <SearchIcon 
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
            isFocused ? 'text-indigo-500' : 'text-gray-400'
          }`} 
          size={20} 
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-12 pr-4 py-4 bg-transparent text-gray-900 placeholder-gray-500 rounded-2xl focus:outline-none text-lg font-medium"
        />
        {value && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => onChange({ target: { value: '' } })}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </motion.button>
        )}
      </div>
      
      {/* Animated border effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10 blur-xl"
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

// Enhanced Filter Select Component
const FilterSelect = ({ value, onChange, options, icon: Icon, label, delay = 0, onToggle, filterId }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onToggle?.(filterId, newIsOpen);
  };
  
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.button
        onClick={toggleDropdown}
        className={`w-full bg-white backdrop-blur-lg border-2 rounded-xl px-4 py-3 text-left transition-all duration-300 shadow-md hover:shadow-lg ${
          value ? 'border-indigo-200 text-indigo-700 bg-indigo-50/50' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
        } ${isOpen ? 'ring-2 ring-indigo-200 shadow-xl' : ''}`}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          borderColor: isOpen ? '#c7d2fe' : undefined,
          boxShadow: isOpen ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : undefined
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={16} className={value ? 'text-indigo-500' : 'text-gray-400'} />
            <span className="font-medium">
              {value || label}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-gray-400" />
          </motion.div>
        </div>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white backdrop-blur-lg border border-gray-200 rounded-xl shadow-xl z-[100] overflow-hidden"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                onClick={() => {
                  onChange({ target: { value: option.value } });
                  setIsOpen(false);
                  onToggle?.(filterId, false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${
                  value === option.value ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-700'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90]" 
          onClick={() => {
            setIsOpen(false);
            onToggle?.(filterId, false);
          }}
        />
      )}
    </motion.div>
  );
};

export default function HackathonList() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    domain: '',
    status: '',
    mode: '',
    sortBy: 'popular'
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [openDropdowns, setOpenDropdowns] = useState({});

  useEffect(() => {
    getHackathons().then(data => {
      setHackathons(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const count = Object.values(filters).filter(value => value && value !== 'popular').length;
    setActiveFiltersCount(count);
  }, [filters]);

  const filteredHackathons = hackathons.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesLocation = !filters.location || h.location === filters.location || h.mode === filters.location;
    const matchesDomain = !filters.domain || h.domain === filters.domain;
    const matchesFee = !filters.mode || 
      (filters.mode === 'free' && (!h.Is_Paid && !h.paid)) ||
      (filters.mode === 'paid' && (h.Is_Paid || h.paid));
    
    return matchesSearch && matchesLocation && matchesDomain && matchesFee;
  });

  const filterOptions = {
    location: [
      { value: '', label: 'All' },
      { value: 'online', label: 'Online' },
      { value: 'offline', label: 'Offline' }
    ],
    domain: [
      { value: '', label: 'All Domains' },
      { value: 'web', label: 'Web Development' },
      { value: 'mobile', label: 'Mobile Apps' },
      { value: 'ai', label: 'AI/ML' },
      { value: 'blockchain', label: 'Blockchain' }
    ],
    mode: [
      { value: '', label: 'Both' },
      { value: 'free', label: 'Free' },
      { value: 'paid', label: 'Paid' }
    ],
    sortBy: [
      { value: 'popular', label: 'Most Popular' },
      { value: 'recent', label: 'Most Recent' },
      { value: 'prize', label: 'Highest Prize' }
    ]
  };

  const handleDropdownToggle = (filterId, isOpen) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [filterId]: isOpen
    }));
  };

  const hasOpenDropdowns = Object.values(openDropdowns).some(isOpen => isOpen);

  const clearAllFilters = () => {
    setFilters({
      search: '',
      location: '',
      domain: '',
      status: '',
      mode: '',
      sortBy: 'popular'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-indigo-200/30 rounded-full blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.h1 
            className="text-4xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Discover Amazing 
            <motion.span
              className="inline-block ml-3"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Sparkles className="inline text-yellow-500" size={40} />
            </motion.span>
          </motion.h1>
          <motion.h2
            className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Hackathons
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Join the most exciting coding competitions, showcase your skills, and win amazing prizes!
          </motion.p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div 
          className="mb-12 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Search Bar */}
          <EnhancedSearch
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search for your next hackathon adventure..."
          />
          
          {/* Filters Section */}
          <motion.div 
            className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="text-indigo-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                {activeFiltersCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full font-medium"
                  >
                    {activeFiltersCount}
                  </motion.span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <motion.button
                  onClick={clearAllFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} />
                  Clear All
                </motion.button>
              )}
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              animate={{
                marginBottom: hasOpenDropdowns ? '10rem' : '1rem'
              }}
              transition={{ 
                duration: 0.3, 
                ease: "easeInOut"
              }}
            >
              <FilterSelect
                value={filters.location}
                onChange={e => setFilters({ ...filters, location: e.target.value })}
                options={filterOptions.location}
                icon={MapPin}
                label="Mode"
                delay={0.1}
                onToggle={handleDropdownToggle}
                filterId="location"
              />
              <FilterSelect
                value={filters.domain}
                onChange={e => setFilters({ ...filters, domain: e.target.value })}
                options={filterOptions.domain}
                icon={Globe}
                label="Domain"
                delay={0.2}
                onToggle={handleDropdownToggle}
                filterId="domain"
              />
              <FilterSelect
                value={filters.mode}
                onChange={e => setFilters({ ...filters, mode: e.target.value })}
                options={filterOptions.mode}
                icon={Rupee}
                label="Fee"
                delay={0.3}
                onToggle={handleDropdownToggle}
                filterId="mode"
              />
              <FilterSelect
                value={filters.sortBy}
                onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
                options={filterOptions.sortBy}
                icon={TrendingUp}
                label="Sort By"
                delay={0.4}
                onToggle={handleDropdownToggle}
                filterId="sortBy"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Results Header */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? 'Loading...' : `${filteredHackathons.length} Hackathons Found`}
            </h3>
            <p className="text-gray-600">
              {filters.search && `Search results for "${filters.search}"`}
            </p>
          </div>
          <motion.div 
            className="flex items-center gap-2 text-indigo-600"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap size={20} />
            <span className="font-medium">Live Updates</span>
          </motion.div>
        </motion.div>

        {/* Hackathon Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200 shadow-lg"
              >
                <div className="animate-pulse">
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-48 rounded-2xl mb-4"></div>
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-6 rounded-lg mb-2"></div>
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-4 rounded-lg w-2/3"></div>
                </div>
              </motion.div>
            ))
          ) : filteredHackathons.length > 0 ? (
            filteredHackathons.map((hackathon, index) => (
              <motion.div
                key={hackathon.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <HackathonCard 
                  hackathon={hackathon} 
                  onNavigate={(path) => navigate(path)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="col-span-full text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 border border-gray-200 max-w-md mx-auto shadow-lg">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Hackathons Found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
                <motion.button
                  onClick={clearAllFilters}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
