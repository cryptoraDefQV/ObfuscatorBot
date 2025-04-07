import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table schema for Discord users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  discordId: text("discord_id").unique(),
});

// Obfuscation logs to track usage
export const obfuscationLogs = pgTable("obfuscation_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Discord user ID
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  success: boolean("success").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  discordId: true,
});

export const insertObfuscationLogSchema = createInsertSchema(obfuscationLogs).pick({
  userId: true,
  fileName: true,
  fileSize: true,
  success: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertObfuscationLog = z.infer<typeof insertObfuscationLogSchema>;
export type ObfuscationLog = typeof obfuscationLogs.$inferSelect;

// Define obfuscation levels
export const ObfuscationLevel = {
  Light: "light",     // Basic obfuscation (comments removal, minification)
  Medium: "medium",   // Default level (variable renaming + light)
  Heavy: "heavy",     // Advanced obfuscation (string encryption + medium)
} as const;

// Validation schema for obfuscation level
export const obfuscationLevelSchema = z.enum([
  ObfuscationLevel.Light,
  ObfuscationLevel.Medium, 
  ObfuscationLevel.Heavy
]);

// Schema for the Lua code obfuscation request
export const obfuscateRequestSchema = z.object({
  code: z.string().min(1, "Lua code is required"),
  level: obfuscationLevelSchema.default(ObfuscationLevel.Medium),
});

export type ObfuscateRequest = z.infer<typeof obfuscateRequestSchema>;
export type ObfuscationLevelType = z.infer<typeof obfuscationLevelSchema>;
