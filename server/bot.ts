import { Client, GatewayIntentBits, Events, Message, Attachment, ChannelType } from "discord.js";
import { obfuscateLua } from "./obfuscator";
import { IStorage } from "./storage";
import { ObfuscationLevel, ObfuscationLevelType } from "@shared/schema";
import path from "path";

const COMMAND_PREFIX = "!";
const OBFUSCATE_COMMAND = "obfuscate";
const HELP_COMMAND = "help";

// Owner information for system notifications
const OWNER_ID = "1294068543859724451"; // iliasyuki's user ID

// Check if necessary secrets are available
// Global client reference for easier access in handlers
let discordClient: Client | null = null;

// Helper function to send notifications to the bot owner with nice embeds
export async function sendOwnerNotification(message: string, isError = false) {
  try {
    if (!discordClient || !discordClient.isReady()) {
      console.error("Cannot send notification: Discord client not ready");
      return;
    }
    
    const owner = await discordClient.users.fetch(OWNER_ID);
    if (owner) {
      // Create a stylish embed for the notification
      const embed = {
        color: isError ? 0xED4245 : 0xF5A623, // Red for errors, Orange (from logo) for info
        title: isError ? "⚠️ ERROR ALERT" : "🔔 SYSTEM NOTIFICATION",
        description: message,
        thumbnail: {
          url: "attachment://logo.png" // Reference to the attached image
        },
        timestamp: new Date().toISOString(),
        footer: {
          text: "LUA Obfuscator Bot",
          icon_url: "attachment://logo.png" // Use logo in footer too
        }
      };
      
      // Send the embed with attached logo
      await owner.send({
        embeds: [embed],
        files: [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      });
      
      console.log(`Notification sent to owner: ${message}`);
    }
  } catch (error) {
    console.error(`Failed to send notification to owner: ${error}`);
  }
}

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
  
  // Set global client reference
  discordClient = client;

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Discord bot logged in as ${readyClient.user.tag}`);
    
    // Set bot's status to show it's ready for commands
    readyClient.user.setPresence({
      status: 'online',
      activities: [{ name: `${COMMAND_PREFIX}help for commands`, type: 0 }]
    });
    
    console.log("Bot is ready and listening for commands.");
    console.log(`Use ${COMMAND_PREFIX}${HELP_COMMAND} to see available commands.`);
    
    // Send notification to owner that bot is online
    try {
      const uptime = new Date().toLocaleString();
      await sendOwnerNotification(`Bot is now online! (${uptime})\nLogged in as: ${readyClient.user.tag}`);
    } catch (error) {
      console.error("Failed to send startup notification:", error);
    }
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

  // Attach error handlers to catch unhandled errors
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await sendOwnerNotification(`Uncaught Exception: ${error.message}`, true);
  });

  process.on('unhandledRejection', async (error, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', error);
    await sendOwnerNotification(`Unhandled Promise Rejection: ${error}`, true);
  });
  
  return client;
}

// Help command handler to show available commands and options
async function handleHelpCommand(message: Message) {
  const helpEmbed = {
    title: "LUA Obfuscator Bot - Help",
    description: "This bot can obfuscate your Lua code to protect it from unauthorized viewing or copying.",
    color: 0xF5A623, // Orange from logo
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
    thumbnail: {
      url: "attachment://logo.png" // Reference to the attached image
    },
    footer: {
      text: "Attach a .lua file with your command to obfuscate it",
      icon_url: "attachment://logo.png"
    },
    timestamp: new Date().toISOString()
  };
  
  await message.reply({ 
    embeds: [helpEmbed],
    files: [{
      attachment: 'client/public/logo.png',
      name: 'logo.png'
    }]
  });
}

// Main command handler for obfuscation
async function handleObfuscateCommand(message: Message, args: string[], storage: IStorage) {
  // Get reference to client for notifications
  const client = message.client;
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
        // Invalid obfuscation level specified
        const invalidLevelEmbed = {
          color: 0xF5A623, // Orange from logo (warning rather than error)
          title: "⚠️ Invalid Protection Level",
          description: `"${requestedLevel}" is not a valid protection level. Using **medium** protection (default).`,
          fields: [
            {
              name: "🔒 Valid Protection Levels",
              value: "• **light** - Basic protection (comments removal, minification)\n" +
                     "• **medium** - Default level (light + variable renaming)\n" +
                     "• **heavy** - Maximum protection (medium + string encryption)",
              inline: false
            }
          ],
          thumbnail: {
            url: "attachment://logo.png"
          },
          footer: {
            text: "LUA Obfuscator Bot",
            icon_url: "attachment://logo.png"
          },
          timestamp: new Date().toISOString()
        };
        
        await message.reply({
          embeds: [invalidLevelEmbed],
          files: [{
            attachment: 'client/public/logo.png',
            name: 'logo.png'
          }]
        });
      }
    }
    
    // Check if there are any attachments
    if (!message.attachments.size) {
      // No attachment included with the obfuscate command
      const noFileEmbed = {
        color: 0xED4245, // Discord red for errors
        title: "❌ Missing File",
        description: "Please attach a Lua file (.lua) to obfuscate.",
        fields: [
          {
            name: "📚 Need Help?",
            value: `Type \`${COMMAND_PREFIX}${HELP_COMMAND}\` for more information.`,
            inline: false
          }
        ],
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: "LUA Obfuscator Bot",
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      await message.reply({
        embeds: [noFileEmbed],
        files: [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      });
      return;
    }

    const luaAttachments = message.attachments.filter(
      (attachment) => isLuaFile(attachment)
    );

    if (!luaAttachments.size) {
      // Invalid file type attached (not a .lua file)
      const invalidFileEmbed = {
        color: 0xED4245, // Discord red for errors
        title: "❌ Invalid File Type",
        description: "No valid Lua files found. Please attach a file with the `.lua` extension.",
        fields: [
          {
            name: "🔍 What happened?",
            value: "The file you attached doesn't have a `.lua` extension. Only Lua files can be obfuscated.",
            inline: false
          },
          {
            name: "📚 Need Help?",
            value: `Type \`${COMMAND_PREFIX}${HELP_COMMAND}\` for more information.`,
            inline: false
          }
        ],
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: "LUA Obfuscator Bot",
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      await message.reply({
        embeds: [invalidFileEmbed],
        files: [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      });
      return;
    }

    // Process the first valid Lua file
    const attachment = luaAttachments.first()!;
    const fileName = attachment.name || "unknown.lua";
    
    try {
      // Acknowledge receipt of the command in the channel with an embed
      const processingEmbed = {
        color: 0xF5A623, // Orange from logo
        title: "⚙️ Processing Lua File",
        description: `I'm working on obfuscating your file with **${obfuscationLevel}** protection.`,
        fields: [
          {
            name: "📄 File",
            value: fileName,
            inline: true
          },
          {
            name: "📨 Delivery Method",
            value: "You'll receive the result via DM",
            inline: true
          }
        ],
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: "LUA Obfuscator Bot",
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      await message.reply({
        embeds: [processingEmbed],
        files: [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      });
      
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
        const testEmbed = {
          color: 0xF5A623, // Orange from logo
          title: "🔒 Obfuscation in Progress",
          description: `Preparing your Lua code with **${obfuscationLevel}** protection...`,
          thumbnail: {
            url: "attachment://logo.png"
          },
          footer: {
            text: "LUA Obfuscator Bot",
            icon_url: "attachment://logo.png"
          },
          timestamp: new Date().toISOString()
        };
        
        await message.author.send({
          embeds: [testEmbed],
          files: [{
            attachment: 'client/public/logo.png',
            name: 'logo.png'
          }]
        });
        
        console.log("Test DM sent successfully, now sending the file...");
        
        // If test DM succeeds, send the actual file with a nice embed
        const resultEmbed = {
          color: 0xF5A623, // Orange from logo
          title: "✅ Obfuscation Complete",
          description: `Your Lua code has been obfuscated with **${obfuscationLevel}** protection.`,
          fields: [
            {
              name: "📄 File",
              value: fileName,
              inline: true
            },
            {
              name: "🔒 Protection Level",
              value: obfuscationLevel.charAt(0).toUpperCase() + obfuscationLevel.slice(1),
              inline: true
            }
          ],
          thumbnail: {
            url: "attachment://logo.png"
          },
          footer: {
            text: "LUA Obfuscator Bot",
            icon_url: "attachment://logo.png"
          },
          timestamp: new Date().toISOString()
        };
        
        await message.author.send({
          embeds: [resultEmbed],
          files: [
            {
              attachment: 'client/public/logo.png',
              name: 'logo.png'
            },
            {
              attachment: Buffer.from(obfuscatedCode),
              name: `obfuscated_${fileName}`
            }
          ]
        });
        
        console.log("Successfully sent DM with file to user:", message.author.tag);
        
        // Confirm in the channel that the DM was sent using embed
        const confirmEmbed = {
          color: 0x57F287, // Discord green for success
          title: "✅ DM Sent Successfully",
          description: `I've sent you a DM with the obfuscated code!\nCheck your direct messages from me.`,
          thumbnail: {
            url: "attachment://logo.png"
          },
          footer: {
            text: "LUA Obfuscator Bot",
            icon_url: "attachment://logo.png"
          },
          timestamp: new Date().toISOString()
        };
        
        await message.reply({
          embeds: [confirmEmbed],
          files: [{
            attachment: 'client/public/logo.png',
            name: 'logo.png'
          }]
        });
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
        
        // If DM fails, try to send in the channel instead with a nice embed
        const fallbackEmbed = {
          color: 0xF5A623, // Orange from logo
          title: "⚠️ DM Delivery Failed",
          description: errorMsg + "Here's your obfuscated code in the channel instead:",
          fields: [
            {
              name: "📄 File",
              value: fileName,
              inline: true
            },
            {
              name: "🔒 Protection Level",
              value: obfuscationLevel.charAt(0).toUpperCase() + obfuscationLevel.slice(1),
              inline: true
            }
          ],
          thumbnail: {
            url: "attachment://logo.png"
          },
          footer: {
            text: "LUA Obfuscator Bot",
            icon_url: "attachment://logo.png"
          },
          timestamp: new Date().toISOString()
        };
        
        await message.reply({
          embeds: [fallbackEmbed],
          files: [
            {
              attachment: 'client/public/logo.png',
              name: 'logo.png'
            },
            {
              attachment: Buffer.from(obfuscatedCode),
              name: `obfuscated_${fileName}`
            }
          ]
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
      
      // Send error message to the user with an embed
      const errorEmbed = {
        color: 0xED4245, // Discord red for errors
        title: "❌ Obfuscation Failed",
        description: "Sorry, I couldn't obfuscate your Lua file.",
        fields: [
          {
            name: "📄 File",
            value: fileName,
            inline: true
          },
          {
            name: "❓ Error",
            value: error instanceof Error ? error.message : "Unknown error",
            inline: false
          }
        ],
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: "LUA Obfuscator Bot",
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      await message.reply({
        embeds: [errorEmbed],
        files: [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      });
      
      // Log the failed obfuscation
      await storage.createObfuscationLog({
        userId: message.author.id,
        fileName,
        fileSize: attachment.size,
        success: false
      });
      
      // Send notification to owner about the error
      const errorMsg = error instanceof Error ? error.message : String(error);
      const userInfo = `${message.author.tag} (${message.author.id})`;
      const guildInfo = message.guild ? ` in ${message.guild.name}` : '';
      await sendOwnerNotification(
        `Obfuscation error for ${fileName} by ${userInfo}${guildInfo}.\nError: ${errorMsg}`, 
        true
      );
    }
  } catch (error) {
    console.error("Unexpected error in obfuscate command handler:", error);
    
    // Send critical error message with an embed
    const criticalErrorEmbed = {
      color: 0xED4245, // Discord red for errors
      title: "⚠️ Critical Error",
      description: "An unexpected error occurred while processing your command. Please try again later.",
      fields: [
        {
          name: "❓ Error Type",
          value: error instanceof Error ? error.constructor.name : "Unknown Error",
          inline: true
        }
      ],
      thumbnail: {
        url: "attachment://logo.png"
      },
      footer: {
        text: "LUA Obfuscator Bot",
        icon_url: "attachment://logo.png"
      },
      timestamp: new Date().toISOString()
    };
    
    await message.reply({
      embeds: [criticalErrorEmbed],
      files: [{
        attachment: 'client/public/logo.png',
        name: 'logo.png'
      }]
    });
    
    // Send notification to owner about critical error
    const errorMsg = error instanceof Error ? error.message : String(error);
    const userInfo = `${message.author.tag} (${message.author.id})`;
    const guildInfo = message.guild ? ` in ${message.guild.name}` : '';
    await sendOwnerNotification(
      `CRITICAL ERROR in obfuscate command by ${userInfo}${guildInfo}.\nError: ${errorMsg}`, 
      true
    );
  }
}

function isLuaFile(attachment: Attachment): boolean {
  if (!attachment.name) return false;
  
  const ext = path.extname(attachment.name).toLowerCase();
  return ext === ".lua";
}
