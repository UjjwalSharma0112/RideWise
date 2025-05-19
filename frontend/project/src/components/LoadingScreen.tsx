import React from 'react';
import { UserRole } from '../types';

interface LoadingScreenProps {
  role: UserRole;
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ role, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {role === 'passenger' ? 'Looking for Drivers' : 'Looking for Passengers'}
        </h2>
        <p className="text-gray-600">
          {role === 'passenger' 
            ? 'We\'re matching you with nearby drivers...' 
            : 'Searching for passengers along your route...'}
        </p>
      </div>
    </div>
  );
}

export default LoadingScreen;