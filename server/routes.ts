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
        
        // Perform the actual obfuscation
        const obfuscatedCode = obfuscateLua(code, selectedLevel);
        
        // Return successful response
        res.json({ 
          obfuscatedCode,
          level: selectedLevel,
          success: true
        });
      } catch (error) {
        console.error("Error obfuscating code:", error);
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
      // In a real app, you would get this data from a database
      res.json({
        totalObfuscations: 0,
        activeUsers: 0,
        serverCount: 0
      });
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
