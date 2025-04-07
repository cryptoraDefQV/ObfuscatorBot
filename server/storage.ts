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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createObfuscationLog(log: InsertObfuscationLog): Promise<ObfuscationLog> {
    const id = this.logId++;
    const timestamp = new Date();
    const obfuscationLog: ObfuscationLog = { ...log, id, timestamp };
    this.obfuscationLogs.set(id, obfuscationLog);
    return obfuscationLog;
  }

  async getUserObfuscationLogs(userId: string): Promise<ObfuscationLog[]> {
    return Array.from(this.obfuscationLogs.values()).filter(
      (log) => log.userId === userId
    );
  }
}

export const storage = new MemStorage();
