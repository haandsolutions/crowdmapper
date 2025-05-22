import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  initials: text("initials"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  initials: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  distance: real("distance"),
  icon: text("icon").notNull(),
  placeId: text("place_id"),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  category: true,
  address: true,
  description: true,
  imageUrl: true,
  latitude: true,
  longitude: true,
  distance: true,
  icon: true,
  placeId: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export const crowdLevels = pgTable("crowd_levels", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  level: integer("level").notNull(), // 1-low, 2-medium, 3-high
  percentage: integer("percentage").notNull(), // 0-100
  timestamp: timestamp("timestamp").notNull(),
  waitTime: integer("wait_time"), // in minutes
});

export const insertCrowdLevelSchema = createInsertSchema(crowdLevels).pick({
  locationId: true,
  level: true,
  percentage: true,
  timestamp: true,
  waitTime: true,
});

export type InsertCrowdLevel = z.infer<typeof insertCrowdLevelSchema>;
export type CrowdLevel = typeof crowdLevels.$inferSelect;

export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  crowdPerception: integer("crowd_perception").notNull(), // 1-low, 2-medium, 3-high
});

// Create a base schema from the table
const baseCheckInSchema = createInsertSchema(checkIns).pick({
  userId: true,
  locationId: true, 
  timestamp: true,
  crowdPerception: true,
});

// Override the timestamp field to accept ISO string dates
export const insertCheckInSchema = baseCheckInSchema.extend({
  timestamp: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  locationId: true,
  content: true,
  timestamp: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  locationId: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
