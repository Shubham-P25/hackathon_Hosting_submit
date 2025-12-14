import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const fieldVariants = {
  initial: { scale: 1, y: 0 },
  focus: { scale: 1.01, y: -2 },
  hover: { scale: 1.01 }
};

const ringClasses = (
  state = { error: false, disabled: false }
) => {
  if (state.disabled) {
    return 'border-gray-200 bg-gray-100/70 text-gray-500';
  }
  if (state.error) {
    return 'border-rose-400/70 shadow-[0_10px_30px_-12px_rgba(244,63,94,0.45)]';
  }
  return 'border-white/30 shadow-[0_10px_30px_-12px_rgba(79,70,229,0.45)]';
};

export const Input = forwardRef(({
  label,
  error,
  icon,
  helperText,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-slate-600 tracking-wide">
          {label}
        </label>
      )}
      <motion.div
        className="relative group"
        variants={fieldVariants}
        initial="initial"
        whileHover="hover"
        whileFocus="focus"
      >
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 opacity-0 transition-opacity duration-300 group-focus-within:opacity-90 group-hover:opacity-70 ${disabled ? '!opacity-30' : ''}`}
        />
        <div
          className={`relative flex items-center gap-3 rounded-2xl border backdrop-blur bg-white/85 px-4 py-3 transition-all duration-300 ${ringClasses({ error, disabled })}`}
        >
          {icon && (
            <span className={`flex items-center justify-center text-indigo-500/90 ${disabled ? 'text-gray-400' : ''}`}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-700 placeholder:text-slate-400 selection:bg-indigo-200/70 selection:text-slate-900 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>
      </motion.div>
      {helperText && !error && (
        <p className="text-xs font-medium text-slate-500/80 ml-1">
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-xs font-semibold text-rose-500 ml-1">{error}</p>
      )}
    </div>
  );
});

export const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder,
  icon,
  helperText,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-slate-600 tracking-wide">
          {label}
        </label>
      )}
      <motion.div
        className="relative group"
        variants={fieldVariants}
        initial="initial"
        whileHover="hover"
        whileFocus="focus"
      >
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 opacity-0 transition-opacity duration-300 group-focus-within:opacity-90 group-hover:opacity-70 ${disabled ? '!opacity-30' : ''}`}
        />
        <div
          className={`relative flex items-center gap-3 rounded-2xl border backdrop-blur bg-white/85 px-4 py-3 transition-all duration-300 ${ringClasses({ error, disabled })}`}
        >
          {icon && (
            <span className={`flex items-center justify-center text-indigo-500/90 ${disabled ? 'text-gray-400' : ''}`}>
              {icon}
            </span>
          )}
          <select
            ref={ref}
            disabled={disabled}
            className={`w-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-700 placeholder:text-slate-400 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option, idx) => (
              <option key={idx} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        </div>
      </motion.div>
      {helperText && !error && (
        <p className="text-xs font-medium text-slate-500/80 ml-1">
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-xs font-semibold text-rose-500 ml-1">{error}</p>
      )}
    </div>
  );
});
