import { useLocation } from "wouter";
import { Marker } from "@react-google-maps/api";
import { Location } from "@/lib/types";
import { getCrowdLevelColor } from "@/lib/crowd-utils";

interface MapMarkerProps {
  location: Location;
  position: {
    lat: number;
    lng: number;
  };
  selected?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export default function MapMarker({ 
  location, 
  position, 
  selected = false, 
  onMouseEnter, 
  onMouseLeave,
  onClick
}: MapMarkerProps) {
  const [_, setLocation] = useLocation();
  const level = location.crowdLevel?.level || 1;
  const crowdColor = getCrowdLevelColor(level);
  
  // Define marker colors based on crowd level
  const markerColors = {
    1: 'green', // Low crowd
    2: 'orange', // Medium crowd
    3: 'red'  // High crowd
  };
  
  // Handle marker click
  const handleMarkerClick = (e: google.maps.MapMouseEvent) => {
    // Call the onClick handler if provided for info window
    if (onClick) {
      onClick();
      // Prevent event propagation
      if (e.domEvent) {
        e.domEvent.stopPropagation();
      }
    }
  };
  
  // Custom SVG marker based on crowd level
  const customMarker = () => {
    const color = markerColors[level as keyof typeof markerColors];
    
    return {
      path: 'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z',
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: 'white',
      scale: selected ? 2.0 : 1.5,
      anchor: new google.maps.Point(12, 22),
    };
  };
  
  return (
    <Marker
      position={position}
      icon={customMarker()}
      animation={selected ? google.maps.Animation.BOUNCE : undefined}
      onClick={handleMarkerClick}
      onMouseOver={onMouseEnter}
      onMouseOut={onMouseLeave}
      zIndex={selected ? 999 : undefined}
      title={location.name}
    />
  );
}
