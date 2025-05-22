import { useState, useEffect, useCallback } from 'react';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  location: {
    lat: number;
    lng: number;
  } | null;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    location: null,
  });

  const getPosition = useCallback(() => {
    setState(prevState => ({ ...prevState, loading: true }));

    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: {
          code: 0,
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        },
        location: null,
      });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        error: null,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState({
        loading: false,
        error,
        location: null,
      });
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: options.enableHighAccuracy || false,
        timeout: options.timeout || 5000,
        maximumAge: options.maximumAge || 0,
      }
    );
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  useEffect(() => {
    getPosition();
  }, [getPosition]);

  return {
    ...state,
    getPosition,
  };
}