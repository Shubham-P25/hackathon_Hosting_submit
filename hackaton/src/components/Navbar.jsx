import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants = {
    hidden: { y: -100 },
    visible: { 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-gray-900 shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {isScrolled && (
            <Link 
              to="/" 
              className="flex items-center space-x-2"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl font-bold text-red-600">SubmitIt</span>
              </motion.div>
            </Link>
          )}
          {isScrolled && (
            <nav className="hidden md:flex items-center space-x-8 transition-opacity duration-300">
              <Link to="/hackathons" className={`text-base font-medium ${location.pathname.startsWith('/hackathons') ? 'text-red-500' : 'text-white'} hover:text-red-400 transition-colors`}>Hackathons</Link>
              <Link to="/host" className={`text-base font-medium ${location.pathname.startsWith('/host') ? 'text-red-500' : 'text-white'} hover:text-red-400 transition-colors`}>Host</Link>
              <Link to="/dashboard" className={`text-base font-medium ${location.pathname.startsWith('/dashboard') ? 'text-red-500' : 'text-white'} hover:text-red-400 transition-colors`}>Dashboard</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors border bg-red-600 text-white border-white/20 hover:bg-white/10"
                >
                  Login / Sign Up
                </Link>
              </motion.div>
            </nav>
          )}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isMobileMenuOpen && isScrolled && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-gray-900 px-4 pt-2 pb-4 rounded-b-lg shadow-lg"
            >
              <Link to="/hackathons" className="block py-2 text-white hover:text-red-400" onClick={() => setIsMobileMenuOpen(false)}>Hackathons</Link>
              <Link to="/host" className="block py-2 text-white hover:text-red-400" onClick={() => setIsMobileMenuOpen(false)}>Host</Link>
              <Link to="/dashboard" className="block py-2 text-white hover:text-red-400" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/login" className="block py-2 text-white hover:text-red-400" onClick={() => setIsMobileMenuOpen(false)}>Login / Sign Up</Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
