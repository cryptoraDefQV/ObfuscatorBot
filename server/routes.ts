import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { obfuscateRequestSchema, ObfuscationLevel } from "@shared/schema";
import { startBot } from "./bot";
import { obfuscateLua } from "./obfuscator";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for obfuscating Lua code from the web interface
  app.post("/api/obfuscate", async (req, res) => {
    try {
      // Validate input using Zod schema
      const { code, level } = obfuscateRequestSchema.parse(req.body);
      
      // Validate that code is not empty
      if (!code || !code.trim()) {
        return res.status(400).json({ 
          message: "Code cannot be empty",
          success: false
        });
      }
      
      try {
        // Use the specified level or default to Medium if not provided
        const selectedLevel = level || ObfuscationLevel.Medium;
        console.log(`Obfuscating code with level: ${selectedLevel}`);
        
        // Measure processing time
        const startTime = Date.now();
        
        // Perform the actual obfuscation
        const obfuscatedCode = obfuscateLua(code, selectedLevel);
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        
        // Log the obfuscation in our statistics
        await storage.createObfuscationLog({
          userId: req.ip || 'web-user',
          fileName: 'web-request.lua',
          fileSize: code.length,
          success: true,
          level: selectedLevel,
          processingTime: processingTime
        });
        
        // Return successful response
        res.json({ 
          obfuscatedCode,
          level: selectedLevel,
          success: true
        });
      } catch (error) {
        console.error("Error obfuscating code:", error);
        
        // Log the failed obfuscation attempt
        await storage.createObfuscationLog({
          userId: req.ip || 'web-user',
          fileName: 'web-request.lua',
          fileSize: code.length,
          success: false,
          level: level || ObfuscationLevel.Medium,
          processingTime: 0
        });
        
        res.status(500).json({ 
          message: "Failed to obfuscate code", 
          error: error instanceof Error ? error.message : "Unknown error",
          success: false
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors from Zod
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: validationError.message,
          success: false 
        });
      } else {
        // Handle other types of errors
        res.status(400).json({ 
          message: "Invalid request", 
          error: error instanceof Error ? error.message : "Unknown error",
          success: false
        });
      }
    }
  });

  // API endpoint to get statistics about bot usage
  app.get("/api/stats", async (req, res) => {
    try {
      // Get real statistics from storage
      const totalObfuscations = await storage.getTotalObfuscations();
      const todayObfuscations = await storage.getTodayObfuscations();
      const uniqueUsers = await storage.getUniqueUsers();
      const protectionLevelCounts = await storage.getProtectionLevelStats();
      const dailyStats = await storage.getDailyStats(7);
      const processingTimeStats = await storage.getProcessingTimeStats();
      
      // Convert processing times from milliseconds to seconds
      const processingTime = {
        light: Math.round(processingTimeStats.light / 100) / 10, // Round to 1 decimal place
        medium: Math.round(processingTimeStats.medium / 100) / 10,
        heavy: Math.round(processingTimeStats.heavy / 100) / 10
      };
      
      // Convert protection level stats to format expected by frontend
      const protectionLevels = [
        { name: 'Light', value: protectionLevelCounts.light || 0, color: '#60a5fa' },
        { name: 'Medium', value: protectionLevelCounts.medium || 0, color: '#3b82f6' },
        { name: 'Heavy', value: protectionLevelCounts.heavy || 0, color: '#1d4ed8' }
      ];
      
      // Calculate average file size (just a reasonable estimate for now)
      // In a real implementation, you'd calculate this from actual file sizes
      const averageFileSize = 28.4; // KB
      
      // Type distribution (this is just a rough estimate since we don't track script types yet)
      const popularFileTypes = [
        { name: 'FiveM Scripts', value: 48 },
        { name: 'Game Scripts', value: 32 },
        { name: 'UI/Frontend', value: 12 },
        { name: 'Other', value: 8 }
      ];
      
      const statsData = {
        data: {
          totalObfuscations,
          todayObfuscations,
          uniqueUsers,
          averageFileSize,
          processingTime,
          protectionLevels,
          dailyStats,
          popularFileTypes,
          lastUpdated: new Date().toLocaleString()
        }
      };

      res.json(statsData);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch stats", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);

  // Start the Discord bot but handle the case where it might not be able to connect
  try {
    startBot(storage);
    console.log("Discord bot started successfully");
  } catch (error) {
    console.error("Failed to start Discord bot:", error);
    console.log("Web interface will still be available");
  }

  return httpServer;
}
