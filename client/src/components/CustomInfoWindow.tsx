import React from "react";
import { InfoWindow } from "@react-google-maps/api";
import { Link, useLocation } from "wouter";
import { Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { getCrowdLevelLabel, formatTimestamp } from "@/lib/crowd-utils";
import { Badge } from "@/components/ui/badge";

interface CustomInfoWindowProps {
  location: Location;
  onClose: () => void;
  position: {
    lat: number;
    lng: number;
  };
}

export default function CustomInfoWindow({ location, onClose, position }: CustomInfoWindowProps) {
  const [_, setLocation] = useLocation();
  const crowdLevel = location.crowdLevel;
  
  // Determine color based on crowd level
  const getCrowdLevelColor = (level: number) => {
    return level === 1 
      ? "bg-green-100 text-green-700 border-green-200" 
      : level === 2 
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-red-100 text-red-700 border-red-200";
  };
  
  // Handle view details click
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(`/locations/${location.id}`);
    onClose();
  };

  return (
    <InfoWindow
      position={position}
      onCloseClick={onClose}
      options={{
        pixelOffset: new google.maps.Size(0, -40)
      }}
    >
      <div className="p-3 max-w-xs">
        <div className="flex flex-col">
          {/* Header with location name and category */}
          <div className="mb-2">
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{location.name}</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{location.category}</p>
              {crowdLevel && (
                <Badge variant="outline" className={getCrowdLevelColor(crowdLevel.level)}>
                  {getCrowdLevelLabel(crowdLevel.level)}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Crowd Level Information */}
          {crowdLevel && (
            <div className="p-3 bg-gray-50 rounded-md mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Crowd Level:</span>
                <span className="text-sm font-bold">
                  {crowdLevel.percentage}% occupied
                </span>
              </div>
              
              {crowdLevel.waitTime && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Wait Time:</span>
                  <span className="text-sm">~{crowdLevel.waitTime} min</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Updated:</span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(crowdLevel.timestamp)}
                </span>
              </div>
            </div>
          )}
          
          {/* Location Address */}
          <div className="mb-3">
            <p className="text-sm text-gray-700">{location.address}</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="default" 
              className="flex-1"
              size="sm"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.preventDefault();
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`, '_blank');
              }}
            >
              Directions
            </Button>
          </div>
        </div>
      </div>
    </InfoWindow>
  );
}