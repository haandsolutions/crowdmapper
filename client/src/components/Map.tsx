import { useState, useCallback, memo } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Location } from "@/lib/types";
import MapMarker from "./MapMarker";
import { useToast } from "@/hooks/use-toast";
import { 
  GOOGLE_MAPS_API_KEY, 
  defaultMapCenter, 
  mapContainerStyle, 
  mapOptions 
} from "@/lib/mapSettings";
import CustomInfoWindow from "./CustomInfoWindow";

interface MapProps {
  locations: Location[];
  selectedLocationId?: number;
}

function MapComponent({ locations, selectedLocationId }: MapProps) {
  const { toast } = useToast();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<number | null>(null);
  const [infoWindowLocation, setInfoWindowLocation] = useState<Location | null>(null);
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // If we have locations, fit the map to show all markers
    if (locations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.latitude, lng: location.longitude });
      });
      map.fitBounds(bounds);
    }
    
    toast({
      title: "Map loaded",
      description: "Interactive Google Maps loaded successfully.",
    });
  }, [locations, toast]);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate map center based on locations or use default
  const getMapCenter = () => {
    if (locations.length > 0) {
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        return { lat: selectedLocation.latitude, lng: selectedLocation.longitude };
      }
      
      // If no selected location, use first location
      return { lat: locations[0].latitude, lng: locations[0].longitude };
    }
    return defaultMapCenter;
  };

  // Handle marker click - show the info window
  const handleMarkerClick = (location: Location) => {
    setInfoWindowLocation(location);
  };

  // Handle info window close
  const handleInfoWindowClose = () => {
    setInfoWindowLocation(null);
  };

  // Show error message if map fails to load
  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <h3 className="text-lg font-medium text-red-500 mb-2">Error loading map</h3>
          <p className="text-gray-600">There was a problem loading Google Maps. Please check your API key and try again.</p>
        </div>
      </div>
    );
  }

  // Show loading indicator
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getMapCenter()}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Map Markers */}
        {locations.map((location) => (
          <MapMarker
            key={location.id}
            location={location}
            position={{ lat: location.latitude, lng: location.longitude }}
            selected={location.id === selectedLocationId || location.id === hoveredLocationId}
            onMouseEnter={() => setHoveredLocationId(location.id)}
            onMouseLeave={() => setHoveredLocationId(null)}
            onClick={() => handleMarkerClick(location)}
          />
        ))}

        {/* Custom Info Window */}
        {infoWindowLocation && (
          <CustomInfoWindow
            location={infoWindowLocation}
            position={{ lat: infoWindowLocation.latitude, lng: infoWindowLocation.longitude }}
            onClose={handleInfoWindowClose}
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm z-10 max-w-[180px]">
          <h4 className="font-semibold mb-2">Crowd Level</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-crowd-low mr-2"></div>
              <span>Low (0-40%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-crowd-medium mr-2"></div>
              <span>Medium (41-70%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-crowd-high mr-2"></div>
              <span>High (71-100%)</span>
            </div>
          </div>
        </div>
      </GoogleMap>
    </div>
  );
}

// Memoize the map component to prevent unnecessary re-renders
export default memo(MapComponent);
