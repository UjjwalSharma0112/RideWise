import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

import Header from './components/Header';
import PassengerMap from './components/PassengerMap';
import DriverMap from './components/DriverMap';
import RoleSelectionModal from './components/RoleSelectionModal';
import LoadingScreen from './components/LoadingScreen';
import { UserRole } from './types';

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(true);

  // Add a custom marker icon CSS fix for Leaflet
  useEffect(() => {
    // Fix Leaflet icon issue
    const link = document.createElement('style');
    link.textContent = `
      .leaflet-default-icon-path {
        background-image: url(https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png);
      }
      .leaflet-control-attribution {
        font-size: 10px;
      }
    `;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setCurrentRole(role);
    setShowRoleModal(false);
  };

  const handleRouteSubmit = () => {
    setIsLoading(true);
    // Simulate loading state for 3 seconds
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Header currentRole={currentRole} onRoleChange={() => setShowRoleModal(true)} />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-4xl mx-auto">
          {currentRole === 'passenger' ? (
            <PassengerMap onRouteSubmit={handleRouteSubmit} />
          ) : currentRole === 'driver' ? (
            <DriverMap onRouteSubmit={handleRouteSubmit} />
          ) : null}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          &copy; 2025 CarpoolBuddy. All rights reserved.
        </div>
      </footer>

      <RoleSelectionModal isOpen={showRoleModal} onSelect={handleRoleSelect} />
      <LoadingScreen role={currentRole || 'passenger'} isVisible={isLoading} />
    </div>
  );
}

export default App;