import { 
  users, locations, crowdLevels, checkIns, reviews, favorites,
  type User, type InsertUser, 
  type Location, type InsertLocation, 
  type CrowdLevel, type InsertCrowdLevel,
  type CheckIn, type InsertCheckIn,
  type Review, type InsertReview,
  type Favorite, type InsertFavorite
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  getLocations(): Promise<Location[]>;
  getLocationsByCategory(category: string): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Crowd level operations
  getCurrentCrowdLevel(locationId: number): Promise<CrowdLevel | undefined>;
  getCrowdLevelHistory(locationId: number, limit?: number): Promise<CrowdLevel[]>;
  createCrowdLevel(crowdLevel: InsertCrowdLevel): Promise<CrowdLevel>;
  
  // Check-in operations
  getCheckInsByLocation(locationId: number): Promise<CheckIn[]>;
  getCheckInsByUser(userId: number): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  
  // Review operations
  getReviewsByLocation(locationId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Favorite operations
  getFavoritesByUser(userId: number): Promise<Favorite[]>;
  getFavoriteLocations(userId: number): Promise<Location[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: number, locationId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private crowdLevels: Map<number, CrowdLevel>;
  private checkIns: Map<number, CheckIn>;
  private reviews: Map<number, Review>;
  private favorites: Map<number, Favorite>;
  
  private userCurrentId: number;
  private locationCurrentId: number;
  private crowdLevelCurrentId: number;
  private checkInCurrentId: number;
  private reviewCurrentId: number;
  private favoriteCurrentId: number;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.crowdLevels = new Map();
    this.checkIns = new Map();
    this.reviews = new Map();
    this.favorites = new Map();
    
    this.userCurrentId = 1;
    this.locationCurrentId = 1;
    this.crowdLevelCurrentId = 1;
    this.checkInCurrentId = 1;
    this.reviewCurrentId = 1;
    this.favoriteCurrentId = 1;
    
    // Initialize with some sample data for development
    this.initSampleData();
  }

  private initSampleData() {
    // Sample locations
    const locationData: InsertLocation[] = [
      {
        name: "Skyline Café",
        category: "Coffee shop",
        address: "123 Coffee Street, Cityville",
        description: "A cozy café with a great view of the city skyline.",
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        latitude: 40.7128,
        longitude: -74.0060,
        distance: 0.3,
        icon: "coffee"
      },
      {
        name: "Garden Park",
        category: "Park",
        address: "123 Park Avenue, Cityville",
        description: "A beautiful park with gardens and playgrounds.",
        imageUrl: "https://images.unsplash.com/photo-1527518120952-a02b3a8bf9c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        latitude: 40.7200,
        longitude: -74.0000,
        distance: 0.5,
        icon: "tree"
      },
      {
        name: "Central Mall",
        category: "Shopping",
        address: "456 Shopping Blvd, Cityville",
        description: "The largest shopping mall in the city with over 100 stores.",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        latitude: 40.7150,
        longitude: -74.0080,
        distance: 1.2,
        icon: "shopping-bag"
      }
    ];

    locationData.forEach(loc => this.createLocation(loc));

    // Sample crowd levels
    const now = new Date();
    this.createCrowdLevel({
      locationId: 1,
      level: 1, // low
      percentage: 35,
      timestamp: now,
      waitTime: 0
    });
    
    this.createCrowdLevel({
      locationId: 2,
      level: 2, // medium
      percentage: 65,
      timestamp: now,
      waitTime: 15
    });
    
    this.createCrowdLevel({
      locationId: 3,
      level: 3, // high
      percentage: 85,
      timestamp: now,
      waitTime: 30
    });
    
    // Create crowd level history
    for (let i = 1; i <= 3; i++) {
      for (let j = 1; j <= 24; j++) {
        const historyDate = new Date();
        historyDate.setHours(historyDate.getHours() - j);
        
        const randomPercentage = Math.floor(Math.random() * 100) + 1;
        let level = 1;
        if (randomPercentage > 70) level = 3;
        else if (randomPercentage > 40) level = 2;
        
        this.createCrowdLevel({
          locationId: i,
          level,
          percentage: randomPercentage,
          timestamp: historyDate,
          waitTime: level === 1 ? 0 : level === 2 ? 15 : 30
        });
      }
    }
    
    // Sample users
    this.createUser({
      username: "john.doe",
      password: "password123",
      displayName: "John Doe",
      initials: "JD"
    });
    
    this.createUser({
      username: "alice.smith",
      password: "password123",
      displayName: "Alice Smith",
      initials: "AS"
    });
    
    // Sample reviews
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    this.createReview({
      userId: 1,
      locationId: 2,
      content: "Great park! It was moderately busy but still plenty of space to relax. The playground area was more crowded though.",
      timestamp: twoHoursAgo
    });
    
    this.createReview({
      userId: 2,
      locationId: 2,
      content: "Visited in the morning and it was nice and quiet. By noon it got much busier. Best to come early!",
      timestamp: yesterday
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocationsByCategory(category: string): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(
      (location) => location.category === category
    );
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationCurrentId++;
    const location: Location = { ...insertLocation, id };
    this.locations.set(id, location);
    return location;
  }

  // Crowd level operations
  async getCurrentCrowdLevel(locationId: number): Promise<CrowdLevel | undefined> {
    const levels = Array.from(this.crowdLevels.values())
      .filter(cl => cl.locationId === locationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return levels.length > 0 ? levels[0] : undefined;
  }

  async getCrowdLevelHistory(locationId: number, limit: number = 24): Promise<CrowdLevel[]> {
    return Array.from(this.crowdLevels.values())
      .filter(cl => cl.locationId === locationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createCrowdLevel(insertCrowdLevel: InsertCrowdLevel): Promise<CrowdLevel> {
    const id = this.crowdLevelCurrentId++;
    const crowdLevel: CrowdLevel = { ...insertCrowdLevel, id };
    this.crowdLevels.set(id, crowdLevel);
    return crowdLevel;
  }

  // Check-in operations
  async getCheckInsByLocation(locationId: number): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter(checkIn => checkIn.locationId === locationId);
  }

  async getCheckInsByUser(userId: number): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter(checkIn => checkIn.userId === userId);
  }

  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = this.checkInCurrentId++;
    const checkIn: CheckIn = { ...insertCheckIn, id };
    this.checkIns.set(id, checkIn);
    return checkIn;
  }

  // Review operations
  async getReviewsByLocation(locationId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.locationId === locationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewCurrentId++;
    const review: Review = { ...insertReview, id };
    this.reviews.set(id, review);
    return review;
  }

  // Favorite operations
  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId);
  }

  async getFavoriteLocations(userId: number): Promise<Location[]> {
    const userFavorites = await this.getFavoritesByUser(userId);
    const favoriteLocationIds = userFavorites.map(fav => fav.locationId);
    
    return Array.from(this.locations.values())
      .filter(location => favoriteLocationIds.includes(location.id));
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    // Check if already exists
    const existingFavorite = Array.from(this.favorites.values()).find(
      fav => fav.userId === insertFavorite.userId && fav.locationId === insertFavorite.locationId
    );
    
    if (existingFavorite) return existingFavorite;
    
    const id = this.favoriteCurrentId++;
    const favorite: Favorite = { ...insertFavorite, id };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async deleteFavorite(userId: number, locationId: number): Promise<void> {
    const favoriteToDelete = Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.locationId === locationId
    );
    
    if (favoriteToDelete) {
      this.favorites.delete(favoriteToDelete.id);
    }
  }
}

export const storage = new MemStorage();
