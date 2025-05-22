import { useState, useEffect, useRef } from "react";
import { Marker } from "@react-google-maps/api";
import { getOrCreateLocation } from "@/lib/locationService";
import { Location } from "@/lib/types";
import { getCrowdLevelColor } from "@/lib/crowd-utils";
import { useToast } from "@/hooks/use-toast";

interface GoogleMapsMarkerProps {
  placeId: string;
  position: google.maps.LatLngLiteral;
  title?: string;
  placeData?: any;
  onLocationReady: (location: Location) => void;
}

export default function GoogleMapsMarker({
  placeId,
  position,
  title,
  placeData,
  onLocationReady
}: GoogleMapsMarkerProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Handle marker click - fetch or create location
  const handleMarkerClick = async () => {
    if (location) {
      // If we already have the location data, just call the handler with position
      const markerPosition = getMarkerPosition();
      
      // Create a modified location with the correct position for the info window
      const locationWithPosition = {
        ...location,
        latitude: markerPosition.lat,
        longitude: markerPosition.lng
      };
      
      onLocationReady(locationWithPosition);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const locationData = await getOrCreateLocation(placeId, placeData);
      
      // Get current marker position
      const markerPosition = getMarkerPosition();
      
      // Create a location with the marker position to ensure proper InfoWindow positioning
      const locationWithPosition = {
        ...locationData,
        latitude: markerPosition.lat,
        longitude: markerPosition.lng
      };
      
      setLocation(locationWithPosition);
      onLocationReady(locationWithPosition);
    } catch (err) {
      console.error("Error handling marker click:", err);
      setError("Failed to load location data");
      toast({
        title: "Error",
        description: "Failed to load location data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Custom SVG marker icon
  const getCustomMarker = () => {
    // Default marker is blue
    const crowdLevel = location?.crowdLevel?.level;
    let markerColor = 'blue';
    
    if (crowdLevel) {
      if (crowdLevel === 1) markerColor = 'green';
      else if (crowdLevel === 2) markerColor = 'orange';
      else if (crowdLevel === 3) markerColor = 'red';
    }
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: markerColor,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: 'white',
      scale: 8,
    };
  };

  // Get marker position for info window
  const getMarkerPosition = () => {
    if (markerRef.current) {
      return markerRef.current.getPosition()?.toJSON() || position;
    }
    return position;
  };

  return (
    <Marker
      position={position}
      title={title || "Location"}
      icon={getCustomMarker()}
      onClick={handleMarkerClick}
      animation={google.maps.Animation.DROP}
      opacity={loading ? 0.5 : 1}
      onLoad={(marker) => {
        markerRef.current = marker;
      }}
    />
  );
}