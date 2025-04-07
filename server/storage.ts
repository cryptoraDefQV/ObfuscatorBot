import { 
  users, type User, type InsertUser,
  obfuscationLogs, type ObfuscationLog, type InsertObfuscationLog
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Obfuscation log methods
  createObfuscationLog(log: InsertObfuscationLog): Promise<ObfuscationLog>;
  getUserObfuscationLogs(userId: string): Promise<ObfuscationLog[]>;
  
  // Statistics methods
  getTotalObfuscations(): Promise<number>;
  getTodayObfuscations(): Promise<number>;
  getUniqueUsers(): Promise<number>;
  getProtectionLevelStats(): Promise<Record<string, number>>;
  getDailyStats(days: number): Promise<{ day: string, obfuscations: number }[]>;
  getProcessingTimeStats(): Promise<Record<string, number>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private obfuscationLogs: Map<number, ObfuscationLog>;
  private userId: number;
  private logId: number;

  constructor() {
    this.users = new Map();
    this.obfuscationLogs = new Map();
    this.userId = 1;
    this.logId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.discordId === discordId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Ensure discordId is set to null if undefined
    const discordId = insertUser.discordId || null;
    const user: User = { ...insertUser, id, discordId };
    this.users.set(id, user);
    return user;
  }

  async createObfuscationLog(log: InsertObfuscationLog): Promise<ObfuscationLog> {
    const id = this.logId++;
    const timestamp = new Date();
    // Ensure level and processingTime are set with defaults if not provided
    const level = log.level || "medium";
    const processingTime = log.processingTime || 0;
    const obfuscationLog: ObfuscationLog = { 
      ...log, 
      id, 
      timestamp, 
      level,
      processingTime
    };
    this.obfuscationLogs.set(id, obfuscationLog);
    return obfuscationLog;
  }

  async getUserObfuscationLogs(userId: string): Promise<ObfuscationLog[]> {
    return Array.from(this.obfuscationLogs.values()).filter(
      (log) => log.userId === userId
    );
  }

  // Get total number of obfuscations ever processed
  async getTotalObfuscations(): Promise<number> {
    return this.obfuscationLogs.size;
  }

  // Get number of obfuscations processed today
  async getTodayObfuscations(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from(this.obfuscationLogs.values()).filter(
      (log) => log.timestamp >= today
    ).length;
  }

  // Get number of unique users who have used the service
  async getUniqueUsers(): Promise<number> {
    const uniqueUserIds = new Set(
      Array.from(this.obfuscationLogs.values()).map(log => log.userId)
    );
    return uniqueUserIds.size;
  }

  // Get statistics on protection levels used
  async getProtectionLevelStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {
      light: 0,
      medium: 0,
      heavy: 0
    };

    Array.from(this.obfuscationLogs.values()).forEach(log => {
      if (stats[log.level] !== undefined) {
        stats[log.level]++;
      }
    });

    return stats;
  }

  // Get daily statistics for the specified number of days
  async getDailyStats(days: number): Promise<{ day: string, obfuscations: number }[]> {
    const result: { day: string, obfuscations: number }[] = [];
    const today = new Date();
    
    // Initialize the array with the last 'days' days
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      result.unshift({ day: dayStr, obfuscations: 0 });
    }
    
    // Count obfuscations for each day
    Array.from(this.obfuscationLogs.values()).forEach(log => {
      const logDate = new Date(log.timestamp);
      const diffTime = today.getTime() - logDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < days) {
        const dayStr = logDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayEntry = result.find(entry => entry.day === dayStr);
        if (dayEntry) {
          dayEntry.obfuscations++;
        }
      }
    });
    
    return result;
  }
  
  // Get average processing times for each protection level
  async getProcessingTimeStats(): Promise<Record<string, number>> {
    const totalTimes: Record<string, number> = {
      light: 0,
      medium: 0,
      heavy: 0
    };
    
    const counts: Record<string, number> = {
      light: 0,
      medium: 0,
      heavy: 0
    };
    
    // Only include successful obfuscations with timing data
    Array.from(this.obfuscationLogs.values())
      .filter(log => log.success && log.processingTime != null && log.processingTime > 0)
      .forEach(log => {
        if (totalTimes[log.level] !== undefined && log.processingTime != null) {
          totalTimes[log.level] += log.processingTime;
          counts[log.level]++;
        }
      });
    
    // Calculate averages (in milliseconds)
    const avgTimes: Record<string, number> = {
      light: counts.light > 0 ? Math.round(totalTimes.light / counts.light) : 800, // Default to 800ms if no data
      medium: counts.medium > 0 ? Math.round(totalTimes.medium / counts.medium) : 1400, // Default to 1400ms
      heavy: counts.heavy > 0 ? Math.round(totalTimes.heavy / counts.heavy) : 2200  // Default to 2200ms
    };
    
    return avgTimes;
  }
}

export const storage = new MemStorage();
