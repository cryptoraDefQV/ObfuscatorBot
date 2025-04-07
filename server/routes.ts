import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { obfuscateRequestSchema } from "@shared/schema";
import { startBot } from "./bot";
import { obfuscateLua } from "./obfuscator";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for obfuscating Lua code from the web interface
  app.post("/api/obfuscate", async (req, res) => {
    try {
      const { code } = obfuscateRequestSchema.parse(req.body);
      
      try {
        const obfuscatedCode = obfuscateLua(code);
        res.json({ obfuscatedCode });
      } catch (error) {
        console.error("Error obfuscating code:", error);
        res.status(500).json({ 
          message: "Failed to obfuscate code", 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(400).json({ 
          message: "Invalid request", 
          error: error instanceof Error ? error.message : "Unknown error"
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
