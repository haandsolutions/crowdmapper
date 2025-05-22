import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CitySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCitySelect: (location: { lat: number; lng: number; name: string }) => void;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

export default function CitySelectionDialog({
  open,
  onOpenChange,
  onCitySelect,
}: CitySelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle search input change
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 2) {
      setLoading(true);
      try {
        // Call our server proxy for Google Places Autocomplete API
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(value)}&types=geocode`
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

  // Handle city selection
  const handleCitySelect = async (placeId: string, description: string) => {
    try {
      console.log("Getting place details for:", placeId);
      
      // Get place details for coordinates from our server proxy
      const response = await fetch(`/api/places/details?place_id=${placeId}`);

      if (response.ok) {
        const data = await response.json();
        console.log("Place details:", data);
        
        if (data.result && data.result.geometry && data.result.geometry.location) {
          const location = data.result.geometry.location;
          console.log("Selected location:", location);
          
          // Call the parent callback with location information
          onCitySelect({
            lat: location.lat,
            lng: location.lng,
            name: description,
          });
          
          // Close the dialog
          onOpenChange(false);
        } else {
          console.error("No location data in place details response:", data);
          
          // Show an error message (could use toast here)
          alert("Could not get location coordinates. Please try another city.");
        }
      } else {
        console.error("Failed to get place details, API returned:", response.status);
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
            Select Your City
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-6">
            We couldn't access your location. Please select a city or area to see nearby locations.
          </Dialog.Description>

          <div className="space-y-4">
            <div className="relative">
              <Input
                className="w-full pl-10"
                placeholder="Search for a city..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            )}

            <div className="max-h-[280px] overflow-y-auto space-y-1">
              {predictions.map((prediction) => (
                <Button
                  key={prediction.place_id}
                  variant="ghost"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => handleCitySelect(prediction.place_id, prediction.description)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {prediction.description}
                </Button>
              ))}
            </div>
          </div>

          <Dialog.Close asChild>
            <Button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500"
              variant="ghost"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}