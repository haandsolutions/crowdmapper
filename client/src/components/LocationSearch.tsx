import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CrowdLevelBadge from "./CrowdLevelBadge";

interface PlacePrediction {
  description: string;
  place_id: string;
}

interface PlaceDetails {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
}

export default function LocationSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [crowdLevel, setCrowdLevel] = useState<number>(0);
  const [, setLocation] = useLocation();

  // Search for places
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 2) {
      setLoading(true);
      try {
        // Use the Places API through our server proxy
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(value)}`
        );

        if (response.ok) {
          const data = await response.json();
          setPredictions(data.predictions || []);
        } else {
          console.error("Failed to fetch predictions");
          setPredictions([]);
        }
      } catch (error) {
        console.error("Error fetching predictions:", error);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setPredictions([]);
    }
  };

  // Get place details and select it
  const handlePlaceSelect = async (placeId: string) => {
    setLoading(true);
    try {
      // Get place details for coordinates from our server proxy
      const response = await fetch(`/api/places/details?place_id=${placeId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setSelectedPlace(data.result);
          // Clear predictions after selecting
          setPredictions([]);
        } else {
          console.error("No place details found");
          toast({
            title: "Error",
            description: "Could not get place details. Please try another location.",
            variant: "destructive"
          });
        }
      } else {
        console.error("Failed to get place details");
        toast({
          title: "Error",
          description: "Could not get place details. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error getting place details:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a location and check in
  const createLocationMutation = useMutation({
    mutationFn: async (level: number) => {
      if (!selectedPlace) return null;

      // First, create or get the location
      const locationData = await apiRequest<{id: number; name: string; [key: string]: any}>("POST", "/api/locations", {
        name: selectedPlace.name,
        address: selectedPlace.formatted_address,
        latitude: selectedPlace.geometry.location.lat,
        longitude: selectedPlace.geometry.location.lng,
        placeId: selectedPlace.place_id,
        category: "Other", // Default category
        description: `This is a location at ${selectedPlace.formatted_address}`,
      });

      // For debugging
      console.log("Location created/found:", locationData);
      
      if (!locationData || !locationData.id) {
        throw new Error("Failed to get valid location data");
      }

      // Now check in to the location
      const result = await apiRequest("POST", "/api/check-ins", {
        userId: 1, // Default user
        locationId: locationData.id,
        crowdPerception: level,
        timestamp: new Date().toISOString()
      });

      return { location: locationData, checkInResult: result };
    },
    onSuccess: (data) => {
      if (data && data.location && data.location.id) {
        toast({
          title: "Success!",
          description: "Your check-in has been recorded.",
        });
        
        // Navigate to the location details page
        setLocation(`/locations/${data.location.id}`);
      }
    },
    onError: (error) => {
      console.error("Error creating location and checking in:", error);
      toast({
        title: "Failed to check in",
        description: "There was a problem with your check-in. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCheckIn = (level: number) => {
    if (!selectedPlace) {
      toast({
        title: "No location selected",
        description: "Please select a location first.",
        variant: "destructive",
      });
      return;
    }

    createLocationMutation.mutate(level);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          className="w-full pl-10"
          placeholder="Search for any place..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {/* Predictions dropdown */}
      {predictions.length > 0 && (
        <Card className="p-2 shadow-md absolute z-10 max-h-60 overflow-y-auto w-full">
          {predictions.map((prediction) => (
            <Button
              key={prediction.place_id}
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              onClick={() => handlePlaceSelect(prediction.place_id)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {prediction.description}
            </Button>
          ))}
        </Card>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Selected place card */}
      {selectedPlace && (
        <Card className="p-4">
          <h3 className="font-medium text-lg">{selectedPlace.name}</h3>
          <p className="text-gray-600 mb-4">{selectedPlace.formatted_address}</p>
          
          <h4 className="font-medium mb-2">How crowded is it?</h4>
          <div className="flex gap-2 mb-4">
            <Button
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700"
              onClick={() => handleCheckIn(1)}
              disabled={createLocationMutation.isPending}
            >
              <i className="fas fa-user-alt mr-2"></i> Low
            </Button>
            <Button
              className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700"
              onClick={() => handleCheckIn(2)}
              disabled={createLocationMutation.isPending}
            >
              <i className="fas fa-users mr-2"></i> Medium
            </Button>
            <Button
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700"
              onClick={() => handleCheckIn(3)}
              disabled={createLocationMutation.isPending}
            >
              <i className="fas fa-users mr-2"></i> High
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}