import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CategoryFilter, CrowdLevelFilter, Location } from "@/lib/types";
import LocationCard from "./LocationCard";
import { mockCategories, mockCrowdLevels, mockLocations } from "@/lib/mock-data";

export default function Sidebar() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>(mockCategories);
  const [crowdLevelFilters, setCrowdLevelFilters] = useState<CrowdLevelFilter[]>(mockCrowdLevels);
  
  // Fetch locations from API
  const { data: locations, isLoading, error } = useQuery({
    queryKey: ["/api/locations"],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading locations",
        description: "There was a problem loading the locations. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const toggleCategoryFilter = (value: string) => {
    setCategoryFilters(prev => 
      prev.map(filter => 
        filter.value === value 
          ? { ...filter, selected: !filter.selected } 
          : filter
      )
    );
  };
  
  const toggleCrowdLevelFilter = (value: number) => {
    setCrowdLevelFilters(prev => 
      prev.map(filter => 
        filter.value === value 
          ? { ...filter, selected: !filter.selected } 
          : filter
      )
    );
  };
  
  // Filter locations based on search and filters
  const getFilteredLocations = () => {
    let filtered = locations || mockLocations;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        location => location.name.toLowerCase().includes(search) || 
                  location.category.toLowerCase().includes(search)
      );
    }
    
    // Apply category filters if any selected
    const selectedCategories = categoryFilters
      .filter(filter => filter.selected)
      .map(filter => filter.value);
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(location => 
        selectedCategories.includes(location.category)
      );
    }
    
    // Apply crowd level filters if any selected
    const selectedLevels = crowdLevelFilters
      .filter(filter => filter.selected)
      .map(filter => filter.value);
    
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(location => 
        location.crowdLevel && selectedLevels.includes(location.crowdLevel.level)
      );
    }
    
    return filtered;
  };
  
  const filteredLocations = getFilteredLocations();
  
  return (
    <div className="hidden md:block w-80 bg-white shadow-md z-30 overflow-y-auto">
      <div className="p-4">
        {/* Search Input */}
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search locations" 
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
        </div>
        
        {/* Category Filters */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-700">Filters</h3>
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map(filter => (
              <button 
                key={filter.value}
                className={`px-3 py-1 rounded-full text-sm ${
                  filter.selected 
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => toggleCategoryFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Crowd Level Filters */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-700">Crowd Level</h3>
          <div className="flex flex-wrap gap-2">
            {crowdLevelFilters.map(filter => {
              const levelColor = filter.value === 1 
                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                : filter.value === 2 
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-red-100 text-red-700 hover:bg-red-200";
              
              const dotColor = filter.value === 1 
                ? "bg-crowd-low" 
                : filter.value === 2 
                  ? "bg-crowd-medium" 
                  : "bg-crowd-high";
                
              return (
                <button 
                  key={filter.value}
                  className={`px-3 py-1 rounded-full text-sm flex items-center ${
                    filter.selected ? levelColor : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => toggleCrowdLevelFilter(filter.value)}
                >
                  <span className={`w-2 h-2 ${dotColor} rounded-full mr-1`}></span>
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Location Cards */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-t-lg"></div>
                <div className="bg-gray-100 p-3 rounded-b-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLocations.length > 0 ? (
          filteredLocations.map((location: Location) => (
            <LocationCard key={location.id} location={location} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-search text-gray-400 text-2xl mb-2"></i>
            <p>No locations match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
