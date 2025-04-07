import { Client, GatewayIntentBits, Events, Message, Attachment } from "discord.js";
import { obfuscateLua } from "./obfuscator";
import { IStorage } from "./storage";
import { ObfuscationLevel, ObfuscationLevelType } from "@shared/schema";
import path from "path";

const COMMAND_PREFIX = "!";
const OBFUSCATE_COMMAND = "obfuscate";
const HELP_COMMAND = "help";

// Check if necessary secrets are available
export function startBot(storage: IStorage) {
  const token = process.env.DISCORD_BOT_TOKEN;
  
  if (!token) {
    console.error("Missing DISCORD_BOT_TOKEN environment variable");
    return;
  }

  // Create Discord client with basic intents to avoid "disallowed intents" error
  // For full functionality, you need to enable Message Content Intent in the Discord Developer Portal
  console.log("Attempting to create Discord client with minimal intents");
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,  // Privileged intent for reading message content
      GatewayIntentBits.GuildMembers,    // For accessing guild member information
      GatewayIntentBits.DirectMessageReactions,  // For handling DM reactions
      GatewayIntentBits.GuildMessageReactions     // For handling guild message reactions
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Discord bot logged in as ${readyClient.user.tag}`);
    
    // Set bot's status to show it's ready for commands
    readyClient.user.setPresence({
      status: 'online',
      activities: [{ name: `${COMMAND_PREFIX}help for commands`, type: 0 }]
    });
    
    console.log("Bot is ready and listening for commands.");
    console.log(`Use ${COMMAND_PREFIX}${HELP_COMMAND} to see available commands.`);
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore messages from bots (including self)
    if (message.author.bot) return;

    // Log all messages for debugging
    let channelInfo = 'DM';
    if (message.guild) {
      const channel = message.channel;
      // Safe way to access channel name regardless of channel type
      const channelName = channel.toString();
      channelInfo = `${message.guild.name} ${channelName}`;
    }
    console.log(`Received message from ${message.author.tag} in ${channelInfo}: ${message.content}`);

    // Check if message starts with the command prefix
    if (!message.content.startsWith(COMMAND_PREFIX)) return;

    const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === OBFUSCATE_COMMAND) {
      await handleObfuscateCommand(message, args, storage);
    } else if (command === HELP_COMMAND) {
      await handleHelpCommand(message);
    }
  });

  // Log in to Discord
  client.login(token).catch((error) => {
    console.error("Failed to log in to Discord:", error);
    
    if (error.toString().includes("disallowed intents")) {
      console.warn("\n------------------------------------------------------");
      console.warn("IMPORTANT: MESSAGE CONTENT INTENT IS NOT ENABLED");
      console.warn("To enable the bot to read messages, you need to:");
      console.warn("1. Go to Discord Developer Portal: https://discord.com/developers/applications");
      console.warn("2. Select your application");
      console.warn("3. Go to 'Bot' tab");
      console.warn("4. Under 'Privileged Gateway Intents'");
      console.warn("5. Enable 'MESSAGE CONTENT INTENT'");
      console.warn("6. Save changes and restart the bot");
      console.warn("------------------------------------------------------\n");
    }
  });

  return client;
}

// Help command handler to show available commands and options
async function handleHelpCommand(message: Message) {
  const helpEmbed = {
    title: "Lua Obfuscator Bot - Help",
    description: "This bot can obfuscate your Lua code to protect it from unauthorized viewing or copying.",
    color: 0x3498db,
    fields: [
      {
        name: "📌 Available Commands",
        value: 
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} [level]\` - Obfuscate an attached Lua file\n` +
          `\`${COMMAND_PREFIX}${HELP_COMMAND}\` - Show this help message`
      },
      {
        name: "🔒 Obfuscation Levels",
        value: 
          "**light** - Basic obfuscation (comments removal, minification)\n" +
          "**medium** - Default level (variable renaming + light)\n" +
          "**heavy** - Advanced obfuscation (string encryption + medium)"
      },
      {
        name: "📝 Examples",
        value: 
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND}\` - Obfuscate with default (medium) level\n` +
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} light\` - Use light obfuscation\n` +
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} heavy\` - Use heavy obfuscation`
      }
    ],
    footer: {
      text: "Attach a .lua file with your command to obfuscate it"
    }
  };
  
  await message.reply({ embeds: [helpEmbed] });
}

// Main command handler for obfuscation
async function handleObfuscateCommand(message: Message, args: string[], storage: IStorage) {
  try {
    // Parse obfuscation level from arguments
    let obfuscationLevel: ObfuscationLevelType = ObfuscationLevel.Medium; // Default level
    
    if (args.length > 0) {
      const requestedLevel = args[0].toLowerCase();
      
      if (requestedLevel === ObfuscationLevel.Light || 
          requestedLevel === ObfuscationLevel.Medium || 
          requestedLevel === ObfuscationLevel.Heavy) {
        obfuscationLevel = requestedLevel as ObfuscationLevelType;
      } else {
        await message.reply(
          `Invalid obfuscation level: "${requestedLevel}". ` +
          `Valid options are: light, medium, heavy. Using medium as default.`
        );
      }
    }
    
    // Check if there are any attachments
    if (!message.attachments.size) {
      await message.reply(
        "Please attach a Lua file to obfuscate.\n" +
        `Type \`${COMMAND_PREFIX}${HELP_COMMAND}\` for help.`
      );
      return;
    }

    const luaAttachments = message.attachments.filter(
      (attachment) => isLuaFile(attachment)
    );

    if (!luaAttachments.size) {
      await message.reply("No valid Lua files found. Please attach a .lua file.");
      return;
    }

    // Process the first valid Lua file
    const attachment = luaAttachments.first()!;
    const fileName = attachment.name || "unknown.lua";
    
    try {
      // Acknowledge receipt of the command in the channel
      await message.reply(`Processing your Lua file with ${obfuscationLevel} obfuscation. I'll send you the obfuscated code via DM.`);
      
      // Fetch the attachment content
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to download attachment: ${response.statusText}`);
      }
      
      const luaCode = await response.text();
      
      // Obfuscate the code with the specified level
      const obfuscatedCode = obfuscateLua(luaCode, obfuscationLevel);
      
      // Send the obfuscated code to the user via DM
      console.log("Attempting to send DM to user:", message.author.tag);
      try {
        // Check if the user allows DMs
        console.log("Checking if user allows DMs...");
        
        // Try sending a test DM first to verify permissions
        await message.author.send({
          content: `Preparing your obfuscated Lua code with ${obfuscationLevel} protection...`
        });
        
        console.log("Test DM sent successfully, now sending the file...");
        
        // If test DM succeeds, send the actual file
        await message.author.send({
          content: `Here's your Lua code obfuscated with ${obfuscationLevel} protection:`,
          files: [{
            attachment: Buffer.from(obfuscatedCode),
            name: `obfuscated_${fileName}`
          }]
        });
        
        console.log("Successfully sent DM with file to user:", message.author.tag);
        
        // Confirm in the channel that the DM was sent
        await message.reply("I've sent you a DM with the obfuscated code!");
      } catch (error: any) {
        console.error("Failed to send DM:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error details:", errorMessage);
        
        // Check for common DM failure reasons
        let errorMsg = "I couldn't send you a DM. ";
        
        if (errorMessage.includes("cannot send messages to this user") || 
            errorMessage.includes("blocked") ||
            errorMessage.includes("not allowed")) {
          errorMsg += "This may be because you have your DMs closed or have blocked the bot. ";
        }
        
        // If DM fails, try to send in the channel instead
        await message.reply({
          content: errorMsg + "Here's your obfuscated code in the channel instead:",
          files: [{
            attachment: Buffer.from(obfuscatedCode),
            name: `obfuscated_${fileName}`
          }]
        });
      }
      
      // Log the successful obfuscation
      await storage.createObfuscationLog({
        userId: message.author.id,
        fileName,
        fileSize: attachment.size,
        success: true
      });
      
    } catch (error) {
      console.error("Error handling obfuscate command:", error);
      
      // Send error message to the user
      await message.reply(
        "Sorry, I couldn't obfuscate your Lua file. " +
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      
      // Log the failed obfuscation
      await storage.createObfuscationLog({
        userId: message.author.id,
        fileName,
        fileSize: attachment.size,
        success: false
      });
    }
  } catch (error) {
    console.error("Unexpected error in obfuscate command handler:", error);
    await message.reply("An unexpected error occurred. Please try again later.");
  }
}

function isLuaFile(attachment: Attachment): boolean {
  if (!attachment.name) return false;
  
  const ext = path.extname(attachment.name).toLowerCase();
  return ext === ".lua";
}
