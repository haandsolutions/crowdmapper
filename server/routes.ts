import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import https from "https";
import { storage } from "./storage";
import { insertCheckInSchema, insertCrowdLevelSchema, insertFavoriteSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";

// Load Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all locations
  app.get("/api/locations", async (_req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      
      // For each location, get the current crowd level
      const locationsWithCrowd = await Promise.all(
        locations.map(async (location) => {
          const crowdLevel = await storage.getCurrentCrowdLevel(location.id);
          return {
            ...location,
            crowdLevel: crowdLevel || null
          };
        })
      );
      
      res.json(locationsWithCrowd);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Get locations by category
  app.get("/api/locations/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const locations = await storage.getLocationsByCategory(category);
      
      // For each location, get the current crowd level
      const locationsWithCrowd = await Promise.all(
        locations.map(async (location) => {
          const crowdLevel = await storage.getCurrentCrowdLevel(location.id);
          return {
            ...location,
            crowdLevel: crowdLevel || null
          };
        })
      );
      
      res.json(locationsWithCrowd);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations by category" });
    }
  });

  // Get a single location with current crowd level
  app.get("/api/locations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }

      const location = await storage.getLocation(id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      const crowdLevel = await storage.getCurrentCrowdLevel(id);
      
      res.json({
        ...location,
        crowdLevel: crowdLevel || null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  // Get crowd level history for a location
  app.get("/api/locations/:id/crowd-history", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
      
      const crowdHistory = await storage.getCrowdLevelHistory(id, limit);
      
      res.json(crowdHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crowd history" });
    }
  });

  // Get reviews for a location
  app.get("/api/locations/:id/reviews", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }

      const reviews = await storage.getReviewsByLocation(id);
      
      // For each review, fetch the user information
      const reviewsWithUsers = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? {
              id: user.id,
              displayName: user.displayName || user.username,
              initials: user.initials || user.username.substring(0, 2).toUpperCase()
            } : null
          };
        })
      );
      
      res.json(reviewsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Create a check-in
  app.post("/api/check-ins", async (req: Request, res: Response) => {
    try {
      // For debugging
      console.log("Received check-in request:", req.body);
      
      const validatedData = insertCheckInSchema.parse(req.body);
      
      // Use the provided timestamp or create one
      const checkInData = {
        ...validatedData,
        timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date()
      };
      
      const checkIn = await storage.createCheckIn(checkInData);

      // Create a new crowd level based on this check-in
      // In a real app, you would aggregate multiple check-ins
      const crowdLevel = await storage.createCrowdLevel({
        locationId: checkIn.locationId,
        level: checkIn.crowdPerception,
        percentage: checkIn.crowdPerception === 1 ? 30 : checkIn.crowdPerception === 2 ? 60 : 90,
        timestamp: new Date(),
        waitTime: checkIn.crowdPerception === 1 ? 0 : checkIn.crowdPerception === 2 ? 15 : 30
      });
      
      res.status(201).json({ checkIn, crowdLevel });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Check-in validation error:", error.errors);
        return res.status(400).json({ message: "Invalid check-in data", errors: error.errors });
      }
      console.error("Failed to create check-in:", error);
      res.status(500).json({ message: "Failed to create check-in" });
    }
  });

  // Create a review
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      // Add the current timestamp if not provided
      const reviewData = {
        ...validatedData,
        timestamp: validatedData.timestamp || new Date()
      };
      
      const review = await storage.createReview(reviewData);
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Create a crowd level (direct reporting)
  app.post("/api/crowd-levels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCrowdLevelSchema.parse(req.body);
      
      const crowdLevel = await storage.createCrowdLevel(validatedData);
      
      res.status(201).json(crowdLevel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid crowd level data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create crowd level" });
    }
  });
  
  // Create or find a location
  app.post("/api/locations", async (req: Request, res: Response) => {
    try {
      const { name, address, latitude, longitude, placeId, category, description } = req.body;
      
      // Check if this location already exists by placeId or coordinates
      const existingLocations = await storage.getLocations();
      const existingLocation = existingLocations.find(
        loc => (placeId && loc.placeId === placeId) || 
              (Math.abs(loc.latitude - latitude) < 0.0001 && 
               Math.abs(loc.longitude - longitude) < 0.0001)
      );
      
      if (existingLocation) {
        return res.status(200).json(existingLocation);
      }
      
      // Create a new location
      const iconMap: Record<string, string> = {
        "Restaurant": "fa-utensils",
        "Coffee shop": "fa-coffee",
        "Bar": "fa-cocktail",
        "Shopping center": "fa-shopping-bag",
        "Gym": "fa-dumbbell",
        "Park": "fa-tree",
        "Museum": "fa-landmark",
        "Library": "fa-book",
        "Beach": "fa-umbrella-beach",
        "Airport": "fa-plane-departure",
        "Movie theater": "fa-film",
        "Train station": "fa-train",
        "Hospital": "fa-hospital",
        "School": "fa-school",
        "University": "fa-university",
        "Other": "fa-map-marker-alt"
      };
      
      const newLocation = await storage.createLocation({
        name,
        category: category || "Other",
        address,
        latitude,
        longitude,
        placeId: placeId || null,
        description: description || `Location at ${address}`,
        imageUrl: "https://source.unsplash.com/random/800x600/?place",
        icon: iconMap[category] || "fa-map-marker-alt"
      });
      
      res.status(201).json(newLocation);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  // Add a location to favorites
  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFavoriteSchema.parse(req.body);
      
      const favorite = await storage.createFavorite(validatedData);
      
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  // Remove a location from favorites
  app.delete("/api/favorites", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        locationId: z.number()
      });
      
      const { userId, locationId } = schema.parse(req.body);
      
      await storage.deleteFavorite(userId, locationId);
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  // Get user favorites
  app.get("/api/users/:id/favorites", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const favoriteLocations = await storage.getFavoriteLocations(id);
      
      // For each location, get the current crowd level
      const locationsWithCrowd = await Promise.all(
        favoriteLocations.map(async (location) => {
          const crowdLevel = await storage.getCurrentCrowdLevel(location.id);
          return {
            ...location,
            crowdLevel: crowdLevel || null
          };
        })
      );
      
      res.json(locationsWithCrowd);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite locations" });
    }
  });

  // Google Maps API proxy endpoints
  // Places Autocomplete API
  app.get("/api/places/autocomplete", async (req: Request, res: Response) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      const { input, types } = req.query;
      
      if (!input) {
        return res.status(400).json({ message: "Missing required parameter: input" });
      }
      
      // Build Google Places API URL
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input as string
      )}&types=${types || "geocode"}&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Make request to Google Places API
      https.get(url, (apiRes) => {
        let data = "";
        
        apiRes.on("data", (chunk) => {
          data += chunk;
        });
        
        apiRes.on("end", () => {
          try {
            const parsedData = JSON.parse(data);
            res.json(parsedData);
          } catch (error) {
            console.error("Error parsing Google Places API response:", error);
            res.status(500).json({ message: "Failed to parse Places API response" });
          }
        });
      }).on("error", (error) => {
        console.error("Error making request to Google Places API:", error);
        res.status(500).json({ message: "Failed to fetch places data" });
      });
    } catch (error) {
      console.error("Error in places autocomplete API:", error);
      res.status(500).json({ message: "Failed to process autocomplete request" });
    }
  });
  
  // Places Details API
  app.get("/api/places/details", async (req: Request, res: Response) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      const { place_id } = req.query;
      
      if (!place_id) {
        return res.status(400).json({ message: "Missing required parameter: place_id" });
      }
      
      // Build Google Places Details API URL
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Make request to Google Places API
      https.get(url, (apiRes) => {
        let data = "";
        
        apiRes.on("data", (chunk) => {
          data += chunk;
        });
        
        apiRes.on("end", () => {
          try {
            const parsedData = JSON.parse(data);
            res.json(parsedData);
          } catch (error) {
            console.error("Error parsing Google Places Details API response:", error);
            res.status(500).json({ message: "Failed to parse Places Details API response" });
          }
        });
      }).on("error", (error) => {
        console.error("Error making request to Google Places Details API:", error);
        res.status(500).json({ message: "Failed to fetch place details" });
      });
    } catch (error) {
      console.error("Error in place details API:", error);
      res.status(500).json({ message: "Failed to process place details request" });
    }
  });
  
  // Geocode API
  app.get("/api/geocode", async (req: Request, res: Response) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      const { latlng } = req.query;
      
      if (!latlng) {
        return res.status(400).json({ message: "Missing required parameter: latlng" });
      }
      
      // Build Google Geocoding API URL
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Make request to Google Geocoding API
      https.get(url, (apiRes) => {
        let data = "";
        
        apiRes.on("data", (chunk) => {
          data += chunk;
        });
        
        apiRes.on("end", () => {
          try {
            const parsedData = JSON.parse(data);
            res.json(parsedData);
          } catch (error) {
            console.error("Error parsing Google Geocoding API response:", error);
            res.status(500).json({ message: "Failed to parse Geocoding API response" });
          }
        });
      }).on("error", (error) => {
        console.error("Error making request to Google Geocoding API:", error);
        res.status(500).json({ message: "Failed to fetch geocoding data" });
      });
    } catch (error) {
      console.error("Error in geocoding API:", error);
      res.status(500).json({ message: "Failed to process geocoding request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
