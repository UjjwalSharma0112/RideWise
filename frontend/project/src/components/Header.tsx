import React from 'react';
import { Car } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole | null;
  onRoleChange: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Car className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">RideWise</h1>
            <p className="text-xs text-blue-100">Connect, ride, save together</p>
          </div>
        </div>
        {currentRole && (
          <button
            onClick={onRoleChange}
            className="bg-white/20 px-4 py-1 rounded-full text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            {currentRole === 'passenger' ? 'Passenger Mode' : 'Driver Mode'}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;