import { useState, useCallback } from 'react';
import { Coordinates } from '../types';

interface UseMapMarkersProps {
  shouldResetOnDoubleSet?: boolean;
}

interface UseMapMarkersReturn {
  firstMarker: Coordinates | null;
  secondMarker: Coordinates | null;
  setFirstMarker: (coords: Coordinates) => void;
  setSecondMarker: (coords: Coordinates) => void;
  handleMapClick: (coords: Coordinates) => void;
  resetMarkers: () => void;
  bothMarkersSet: boolean;
}

const useMapMarkers = ({ 
  shouldResetOnDoubleSet = false 
}: UseMapMarkersProps = {}): UseMapMarkersReturn => {
  const [firstMarker, setFirstMarker] = useState<Coordinates | null>(null);
  const [secondMarker, setSecondMarker] = useState<Coordinates | null>(null);

  const resetMarkers = useCallback(() => {
    setFirstMarker(null);
    setSecondMarker(null);
  }, []);

  const handleMapClick = useCallback((coords: Coordinates) => {
    if (!firstMarker) {
      setFirstMarker(coords);
    } else if (!secondMarker) {
      setSecondMarker(coords);
    } else if (shouldResetOnDoubleSet) {
      resetMarkers();
      setFirstMarker(coords);
    }
  }, [firstMarker, secondMarker, shouldResetOnDoubleSet, resetMarkers]);

  return {
    firstMarker,
    secondMarker,
    setFirstMarker,
    setSecondMarker,
    handleMapClick,
    resetMarkers,
    bothMarkersSet: !!firstMarker && !!secondMarker
  };
};

export default useMapMarkers;