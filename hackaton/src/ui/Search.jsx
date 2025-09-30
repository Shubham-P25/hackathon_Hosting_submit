import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const Search = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className={`relative w-full ${className}`}
      animate={{ scale: isFocused ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white shadow-sm"
        {...props}
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    </motion.div>
  );
};
