import React from 'react';
import { CarFront, User } from 'lucide-react';
import { UserRole } from '../types';

interface RoleToggleProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleToggle: React.FC<RoleToggleProps> = ({ currentRole, setRole }) => {
  return (
    <div className="flex justify-center mt-4 mb-6">
      <div className="bg-white rounded-full p-1 shadow-md inline-flex">
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
            currentRole === 'passenger'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setRole('passenger')}
          aria-label="Passenger mode"
        >
          <User size={18} />
          <span>Passenger</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
            currentRole === 'driver'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setRole('driver')}
          aria-label="Driver mode"
        >
          <CarFront size={18} />
          <span>Driver</span>
        </button>
      </div>
    </div>
  );
};

export default RoleToggle;