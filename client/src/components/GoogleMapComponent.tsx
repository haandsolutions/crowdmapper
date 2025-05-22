import { useState, useCallback, useEffect, memo, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Location } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { 
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  defaultMapCenter, 
  mapContainerStyle, 
  mapOptions 
} from "@/lib/mapSettings";
import MapMarker from "./MapMarker";
import GoogleMapsMarker from "./GoogleMapsMarker";
import CitySelectionDialog from "./CitySelectionDialog";
import CustomInfoWindow from "./CustomInfoWindow";
import { getOrCreateLocation } from "@/lib/locationService";

interface GoogleMapComponentProps {
  locations: Location[];
  selectedLocationId?: number;
  mapCenter?: { lat: number; lng: number };
  focusedLocation?: Location | null;
  showInfoWindow?: boolean;
  onInfoWindowClose?: () => void;
}

function GoogleMapComponent({ 
  locations, 
  selectedLocationId,
  mapCenter: externalMapCenter,
  focusedLocation,
  showInfoWindow,
  onInfoWindowClose
}: GoogleMapComponentProps) {
  const { toast } = useToast();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<number | null>(null);
  const [infoWindowLocation, setInfoWindowLocation] = useState<Location | null>(null);
  const [customMapCenter, setCustomMapCenter] = useState<{lat: number, lng: number} | null>(null);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [cityName, setCityName] = useState<string | null>(null);
  
  // Get user's geolocation
  const { location: userLocation, error: locationError, loading: locationLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 7000
  });
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'] as any
  });
  
  // Google Maps markers state
  const [googleMarkers, setGoogleMarkers] = useState<Array<{
    id: string;
    placeId: string;
    position: google.maps.LatLngLiteral;
    title?: string;
    placeData?: any;
  }>>([]);

  // Manually show city selection dialog for testing and if geolocation fails
  useEffect(() => {
    // Force show dialog after a delay if no location is detected
    const timer = setTimeout(() => {
      if (!userLocation && !customMapCenter) {
        setCityDialogOpen(true);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [userLocation, customMapCenter]);
  
  // Show city selection dialog if geolocation explicitly fails
  useEffect(() => {
    if (!locationLoading && locationError && !customMapCenter) {
      setCityDialogOpen(true);
    }
  }, [locationLoading, locationError, customMapCenter]);

  // Set map center to user location if available
  useEffect(() => {
    if (userLocation && !customMapCenter) {
      setCustomMapCenter(userLocation);
      
      // Try to get city name using reverse geocoding
      const getLocationName = async () => {
        try {
          const response = await fetch(
            `/api/geocode?latlng=${userLocation.lat},${userLocation.lng}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              // Look for locality (city) in the address components
              for (const result of data.results) {
                const cityComponent = result.address_components?.find(
                  (component: any) => component.types.includes("locality")
                );
                
                if (cityComponent) {
                  setCityName(cityComponent.long_name);
                  toast({
                    title: "Location detected",
                    description: `Showing places near ${cityComponent.long_name}`,
                  });
                  break;
                }
              }
            }
          } else {
            console.error("Failed to get location name from geocoding API");
          }
        } catch (error) {
          console.error("Error getting location name:", error);
        }
      };
      
      getLocationName();
    }
  }, [userLocation, customMapCenter, toast]);

  // Effect to handle external map center updates
  useEffect(() => {
    if (map && externalMapCenter) {
      map.setCenter(externalMapCenter);
      map.setZoom(15); // A closer zoom when focusing on a specific location
    }
  }, [map, externalMapCenter]);
  
  // Effect to handle focused location
  useEffect(() => {
    if (focusedLocation) {
      setInfoWindowLocation(focusedLocation);
    }
  }, [focusedLocation]);
  
  // Effect to handle showing/hiding info window
  useEffect(() => {
    if (showInfoWindow === false) {
      setInfoWindowLocation(null);
    }
  }, [showInfoWindow]);

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
    
    // Add click listener to map to support adding new locations
    map.addListener("click", async (event: any) => {
      if (!event.placeId) return;
      
      console.log("Map clicked on place:", event.placeId);
      
      // Allow default behavior to be suppressed if necessary
      event.stop();
      
      try {
        // Check if we already have a marker for this place
        const existingMarker = googleMarkers.find(marker => marker.placeId === event.placeId);
        if (existingMarker) {
          console.log("Using existing marker for place:", existingMarker);
          // Directly fetch location since we already have the marker
          const locationData = await getOrCreateLocation(
            event.placeId, 
            existingMarker.placeData
          );
          
          // Create a location with the marker position for proper InfoWindow positioning
          const locationWithPosition = {
            ...locationData,
            latitude: existingMarker.position.lat,
            longitude: existingMarker.position.lng
          };
          
          console.log("Setting info window location with existing marker:", locationWithPosition);
          setInfoWindowLocation(locationWithPosition);
          return;
        }
        
        // Get place details
        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
          {
            placeId: event.placeId,
            fields: ["name", "geometry", "formatted_address", "types"],
          },
          async (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
              console.log("Got place details:", place);
              
              // Add marker to our list
              const newMarker = {
                id: `google-${Date.now()}`,
                placeId: event.placeId,
                position: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                },
                title: place.name || "Location",
                placeData: place,
              };
              
              console.log("Created new marker:", newMarker);
              setGoogleMarkers(prev => [...prev, newMarker]);
              
              // Directly get or create the location and open info window
              try {
                const locationData = await getOrCreateLocation(
                  event.placeId,
                  place
                );
                
                // Create a location with the marker position to ensure proper InfoWindow positioning
                const locationWithPosition = {
                  ...locationData,
                  latitude: newMarker.position.lat,
                  longitude: newMarker.position.lng
                };
                
                console.log("Setting info window with new location:", locationWithPosition);
                setInfoWindowLocation(locationWithPosition);
              } catch (err) {
                console.error("Error creating location from place:", err);
              }
            }
          }
        );
      } catch (error) {
        console.error("Error handling map click:", error);
      }
    });
    
    toast({
      title: "Map loaded",
      description: "Interactive Google Maps loaded successfully.",
    });
  }, [locations, googleMarkers, toast]);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle city selection
  const handleCitySelect = (location: { lat: number; lng: number; name: string }) => {
    console.log("City selected:", location);
    setCustomMapCenter({ lat: location.lat, lng: location.lng });
    setCityName(location.name);
    setCityDialogOpen(false);
    
    toast({
      title: "Location set",
      description: `Showing places near ${location.name}`,
    });
    
    // Recenter the map
    if (map) {
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(13);
    }
  };
  
  // For debugging - manually open the city selection dialog
  const openCitySelectionDialog = () => {
    setCityDialogOpen(true);
  };

  // Calculate map center based on external center, user location, custom selection, or locations
  const getMapCenter = () => {
    // External map center from parent has highest priority
    if (externalMapCenter) {
      return externalMapCenter;
    }
    
    // Custom map center (from city selection dialog)
    if (customMapCenter) {
      return customMapCenter;
    }
    
    // User's detected location
    if (userLocation) {
      return userLocation;
    }
    
    // Selected or focused location
    if (locations.length > 0) {
      // If we have a focused location from sidebar
      if (focusedLocation) {
        return { lat: focusedLocation.latitude, lng: focusedLocation.longitude };
      }
      
      // If we have a selected location id
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        return { lat: selectedLocation.latitude, lng: selectedLocation.longitude };
      }
      
      // If no selected location, use first location
      return { lat: locations[0].latitude, lng: locations[0].longitude };
    }
    
    // Default fallback
    return defaultMapCenter;
  };

  // Handle marker click
  const handleMarkerClick = (location: Location) => {
    setInfoWindowLocation(location);
  };
  
  // Handle Google Maps marker location ready (after potential save/load)
  const handleGoogleLocationReady = (location: Location) => {
    console.log("Google location ready:", location);
    setInfoWindowLocation(location);
  };

  // Handle info window close
  const handleInfoWindowClose = () => {
    setInfoWindowLocation(null);
    // Call the external callback if provided
    if (onInfoWindowClose) {
      onInfoWindowClose();
    }
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
    <>
      <div className="relative flex-1 overflow-hidden">
        {/* Floating button to open city selection */}
        <button 
          onClick={openCitySelectionDialog}
          className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
          title="Change location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </button>
        
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={getMapCenter()}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* User Location Marker */}
          {(userLocation || customMapCenter) && (
            <div className="absolute top-4 right-4 bg-white rounded-md shadow-md p-2 z-10">
              <div className="flex items-center text-sm font-medium">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                {cityName ? `Your location: ${cityName}` : 'Your current location'}
              </div>
            </div>
          )}
          
          {/* Map Markers from database */}
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
          
          {/* Google Maps markers that are not in our database yet */}
          {googleMarkers.map((marker) => (
            <GoogleMapsMarker
              key={marker.id}
              placeId={marker.placeId}
              position={marker.position}
              title={marker.title}
              placeData={marker.placeData}
              onLocationReady={handleGoogleLocationReady}
            />
          ))}

          {/* Custom Info Window */}
          {infoWindowLocation && (
            <>
              {console.log("Rendering info window with position:", { lat: infoWindowLocation.latitude, lng: infoWindowLocation.longitude })}
              <CustomInfoWindow 
                location={infoWindowLocation}
                position={{ lat: infoWindowLocation.latitude, lng: infoWindowLocation.longitude }}
                onClose={handleInfoWindowClose}
              />
            </>
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
      
      {/* City Selection Dialog */}
      <CitySelectionDialog
        open={cityDialogOpen}
        onOpenChange={setCityDialogOpen}
        onCitySelect={handleCitySelect}
      />
    </>
  );
}

// Memoize the map component to prevent unnecessary re-renders
export default memo(GoogleMapComponent);