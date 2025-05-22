import { Link } from "wouter";
import { Location } from "@/lib/types";
import CrowdLevelBadge from "./CrowdLevelBadge";
import { eventEmitter, EVENTS } from "@/lib/eventEmitter";

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  const percentage = location.crowdLevel?.percentage || 0;
  const level = location.crowdLevel?.level || 1;
  
  const getOccupancyColor = (level: number) => {
    switch (level) {
      case 1: return "text-green-700";
      case 2: return "text-amber-700";
      case 3: return "text-red-700";
      default: return "text-green-700";
    }
  };
  
  // Handler to focus on this location on the map
  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Emit event to focus on this location on the map
    eventEmitter.emit(EVENTS.FOCUS_LOCATION, location);
  };

  return (
    <div className="mb-4 cursor-pointer">
      <div 
        className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        onClick={handleLocationClick}
      >
        <div className="relative h-32">
          <img 
            src={location.imageUrl} 
            alt={location.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <CrowdLevelBadge level={level} size="small" className="shadow-sm" />
          </div>
          <div className="absolute bottom-2 right-2">
            <Link 
              href={`/locations/${location.id}`}
              onClick={(e) => e.stopPropagation()} // Prevent triggering the parent's onClick
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-md"
              title="View details"
            >
              <i className="fas fa-info text-xs p-1"></i>
            </Link>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-800">{location.name}</h3>
          <div className="text-sm text-gray-600 mb-2">
            {location.category} • {location.distance} miles away
          </div>
          <div className="flex items-center">
            <div className={`text-sm font-medium ${getOccupancyColor(level)} flex items-center`}>
              <i className="fas fa-users mr-1 text-xs"></i> 
              {percentage}% occupied
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
