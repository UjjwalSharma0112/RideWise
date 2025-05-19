import React, { useState } from 'react';
import { CarFront, User } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onSelect: (role: UserRole, contact: string) => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onSelect }) => {
  const [contact, setContact] = useState('');

  if (!isOpen) return null;

  const handleSelect = (role: UserRole) => {
    if (!contact.trim()) {
      alert('Please enter your contact information.');
      return;
    }
    const userId=crypto.randomUUID();
    localStorage.setItem('userId',userId);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userContact', contact.trim());

    onSelect(role, contact.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Choose Your Role</h2>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => handleSelect('passenger')}
            className="flex items-center justify-center space-x-3 bg-blue-50 hover:bg-blue-100 text-blue-700 p-6 rounded-lg transition-colors border-2 border-blue-200"
          >
            <User size={24} />
            <span className="text-lg font-medium">I'm a Passenger</span>
          </button>
          <button
            onClick={() => handleSelect('driver')}
            className="flex items-center justify-center space-x-3 bg-green-50 hover:bg-green-100 text-green-700 p-6 rounded-lg transition-colors border-2 border-green-200"
          >
            <CarFront size={24} />
            <span className="text-lg font-medium">I'm a Driver</span>
          </button>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Add Your Contact</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Enter phone or email"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
