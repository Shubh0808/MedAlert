import { useEffect, useRef, useState } from "react";

export const useGeolocation = ({ watch = false } = {}) => {
  const watchId = useRef(null);
  const [state, setState] = useState({
    loading: false,
    error: "",
    position: null
  });

  const updatePosition = (position) => {
    setState({
      loading: false,
      error: "",
      position: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      }
    });
  };

  const handleError = (error) => {
    setState((current) => ({
      ...current,
      loading: false,
      error: error.message || "Unable to read current location."
    }));
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: "Geolocation is not supported by this browser.",
        position: null
      });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000
    });
  };

  useEffect(() => {
    if (!watch || !navigator.geolocation) {
      return undefined;
    }

    watchId.current = navigator.geolocation.watchPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 15000
    });

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [watch]);

  return {
    ...state,
    requestLocation
  };
};
