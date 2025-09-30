import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const inputVariants = {
  focus: { scale: 1.02 },
  blur: { scale: 1 }
};

export const Input = forwardRef(({ 
  label,
  error,
  icon,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <motion.div
        className="relative rounded-md shadow-sm"
        whileFocus="focus"
        whileBlur="blur"
        variants={inputVariants}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm
            focus:ring-2 focus:ring-red-500 focus:border-red-500
            disabled:bg-gray-100 disabled:text-gray-500
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
      </motion.div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

export const Select = forwardRef(({ 
  label,
  error,
  options = [],
  placeholder,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:ring-2 focus:ring-red-500 focus:border-red-500
          disabled:bg-gray-100 disabled:text-gray-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, idx) => (
          <option key={idx} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});
