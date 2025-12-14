import React from 'react';

export default function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white to-gray-100">
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg transform-gpu animate-tilt">
          <svg className="w-12 h-12 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-700">{message}</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we prepare your experience.</p>
        </div>
      </div>
    </div>
  );
}
