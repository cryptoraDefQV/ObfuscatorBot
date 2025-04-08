import { 
  Client, 
  GatewayIntentBits, 
  Events, 
  Message, 
  Attachment, 
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder,
  Interaction,
  EmbedBuilder,
  GuildMember,
  TextChannel,
  PermissionFlagsBits,
  TextBasedChannel,
  GuildChannel
} from "discord.js";
import { obfuscateLua, obfuscateJavaScript, obfuscateHTML } from "./obfuscator";
import { IStorage } from "./storage";
import { ObfuscationLevel, ObfuscationLevelType } from "@shared/schema";
import path from "path";
import fs from "fs";

const COMMAND_PREFIX = "!";
const OBFUSCATE_COMMAND = "obfuscate";
const TEMP_OBFUSCATE_COMMAND = "tempobfuscate";
const HELP_COMMAND = "help";
const STATS_COMMAND = "stats";
const VERIFY_COMMAND = "verify";
const SETUP_VERIFY_COMMAND = "setupverify";
const WELCOME_COMMAND = "welcome";
const UPTIME_COMMAND = "uptime";

// Track bot start time
let botStartTime = new Date();
let lastResponseTime = 0;

// IDs for verification - customize these for specific servers
const VERIFICATION_ROLE_ID = "1359162446253920406"; // Role ID to assign upon verification
const WELCOME_CHANNEL_ID = "1359162724654776540"; // Channel ID for welcome messages

// Stats channel IDs - these are read-only channels for displaying statistics
const STATS_TOTAL_CHANNEL_ID = "1359162732473094346"; // Total stats channel
const STATS_DAILY_CHANNEL_ID = "1359162740656308457";  // Daily stats channel
const STATS_LANGUAGES_CHANNEL_ID = "1359162732473094346"; // Language stats channel


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

  // Create Discord client with required intents for all functionality
  // For full functionality, you need to enable Message Content Intent and Server Members Intent in the Discord Developer Portal
  console.log("Attempting to create Discord client with required intents");
  
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
    // Display custom ASCII art startup message
    console.log(`

───── ObfusCore v1.0 ─ Discord Lua Obfuscator ───────

[ ObfusCore ] Initializing secure console interface...
[ ObfusCore ] Environment: Discord Bot
[ ObfusCore ] Engine: Lua Bytecode Obfuscator
[ ObfusCore ] ^7Encrypting function headers... ^
[ ObfusCore ] Shuffling variable stacks... ^
[ ObfusCore ] System Online.Ready for obfuscation.
[ ObfusCore ] You are protected.
======================================================`);
    
    console.log(`//Discord bot logged in as// ${readyClient.user.tag}`);
    
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
      
      // Initialize stats channels
      if (storage) {
        await updateStatsChannels(readyClient, storage);
        
        // Set up interval to update stats channels every hour
        setInterval(async () => {
          try {
            await updateStatsChannels(readyClient, storage);
            console.log("Updated stats channels with latest information");
          } catch (statsError) {
            console.error("Failed to update stats channels:", statsError);
          }
        }, 60 * 60 * 1000); // Every hour
      }
      
    } catch (error) {
      console.error("Failed to send startup notification:", error);
    }
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore messages from bots (including self)
    if (message.author.bot) return;
    
    const startTime = Date.now();
    
    // Handle the message then update response time
    const handleMessage = async () => {

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
    } else if (command === TEMP_OBFUSCATE_COMMAND) {
      await handleTempObfuscateCommand(message, args, storage);
    } else if (command === HELP_COMMAND) {
      await handleHelpCommand(message);
    } else if (command === STATS_COMMAND) {
      // Delete the stats command message
      if (message.deletable) {
        await message.delete();
      }
      await handleStatsCommand(message, storage);
    } else if (command === SETUP_VERIFY_COMMAND) {
      // Only allow server admins to set up verification
      if (message.guild && message.member?.permissions.has("Administrator")) {
        await setupVerification(message.channel);
      } else {
        await message.reply("You need administrator permissions to set up verification.");
      }
    } else if (command === UPTIME_COMMAND) {
      const now = new Date();
      const uptime = now.getTime() - botStartTime.getTime();
      
      // Calculate uptime components
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
      
      const uptimeEmbed = {
        color: 0x3498db,
        title: "⚡ OBFUSCORE Status",
        thumbnail: {
          url: "attachment://logo.png"
        },
        fields: [
          {
            name: "⌛ Uptime",
            value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``,
            inline: true
          },
          {
            name: "⏱️ Response Time",
            value: `\`${lastResponseTime}ms\``,
            inline: true
          },
          {
            name: "🌐 Server Status",
            value: `• Online: \`${client.guilds.cache.size} servers\`\n• Response: \`${lastResponseTime}ms\`\n• Last Update: <t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: false
          },
          {
            name: "📊 Statistics",
            value: `• Total Commands: \`${client.guilds.cache.size * 10}\`\n• Active Users: \`${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\`\n• Protection Level: \`Heavy\``,
            inline: false
          }
        ],
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: "OBFUSCORE Bot",
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      await message.reply({
        embeds: [uptimeEmbed],
        files: [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      });
    } else if (command === WELCOME_COMMAND) {
      // Only allow server admins to post welcome messages
      if (message.guild && message.member?.permissions.has("Administrator")) {
        if (args.length > 0) {
          const userId = args[0].replace(/<@!?(\d+)>/, '$1'); // Extract user ID from mention
          try {
            const member = await message.guild.members.fetch(userId);
            await sendWelcomeMessage(message.channel, member);
          } catch (error) {
            await message.reply("Couldn't find that user. Make sure you mention a valid user.");
          }
        } else {
          await message.reply("Please mention a user to welcome. Usage: `!welcome @user`");
        }
      } else {
        await message.reply("You need administrator permissions to send welcome messages.");
      }
    }
    
    // Calculate and store response time
    lastResponseTime = Date.now() - startTime;
  };
  
  await handleMessage();
  });
  
  // Handle button interactions (for verification)
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'verify') {
      await handleVerification(interaction);
    }
  });
  
  // Auto-welcome new members when they join
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      console.log(`New member joined: ${member.user.tag}`);
      
      // Find the welcome channel
      const welcomeChannel = member.guild.channels.cache.find(channel => 
        channel.id === WELCOME_CHANNEL_ID || 
        (channel.type === ChannelType.GuildText && 
         channel.name.toLowerCase().includes('welcome'))
      );
      
      if (welcomeChannel && welcomeChannel.type === ChannelType.GuildText) {
        await sendWelcomeMessage(welcomeChannel, member);
      } else {
        console.log(`No welcome channel found in guild ${member.guild.name}`);
      }
    } catch (error) {
      console.error("Error handling new member join:", error);
    }
  });

  // Log in to Discord
  client.login(token).catch((error) => {
    console.error("Failed to log in to Discord:", error);
    
    if (error.toString().includes("disallowed intents")) {
      console.warn("\n------------------------------------------------------");
      console.warn("IMPORTANT: PRIVILEGED INTENTS ARE NOT ENABLED");
      console.warn("To enable the bot to function properly, you need to:");
      console.warn("1. Go to Discord Developer Portal: https://discord.com/developers/applications");
      console.warn("2. Select your application");
      console.warn("3. Go to 'Bot' tab");
      console.warn("4. Under 'Privileged Gateway Intents'");
      console.warn("5. Enable 'MESSAGE CONTENT INTENT'");
      console.warn("6. Enable 'SERVER MEMBERS INTENT'");
      console.warn("7. Save changes and restart the bot");
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
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} [language] [level]\` - Obfuscate an attached file\n` +
          `\`${COMMAND_PREFIX}${TEMP_OBFUSCATE_COMMAND} [hours] [language] [level]\` - Create temporary obfuscation that expires\n` +
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
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND}\` - Obfuscate Lua with default (medium) level\n` +
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} light\` - Use light obfuscation for Lua\n` +
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} heavy\` - Use heavy obfuscation for Lua\n` +
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} js medium\` - Obfuscate JavaScript with medium protection\n` +
          `\`${COMMAND_PREFIX}${OBFUSCATE_COMMAND} html heavy\` - Obfuscate HTML with heavy protection\n` +
          `\`${COMMAND_PREFIX}${TEMP_OBFUSCATE_COMMAND} 48\` - Create temp Lua file that expires in 48 hours\n` +
          `\`${COMMAND_PREFIX}${TEMP_OBFUSCATE_COMMAND} 12 js heavy\` - Temp JavaScript file with heavy protection`
      }
    ],
    thumbnail: {
      url: "attachment://logo.png" // Reference to the attached image
    },
    footer: {
      text: "Attach a .lua, .js, or .html file with your command to obfuscate it",
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
async function handleTempObfuscateCommand(message: Message, args: string[], storage: IStorage) {
  // Get reference to client for notifications
  const client = message.client;
  try {
    // First argument should be the expiration time in hours
    let expirationHours = 24; // Default: 24 hours if not specified
    let argsOffset = 0;
    
    if (args.length > 0 && !isNaN(Number(args[0]))) {
      expirationHours = Math.max(1, Math.min(168, parseInt(args[0], 10))); // Between 1 hour and 7 days
      argsOffset = 1; // Skip the first argument when processing the rest
    }
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);
    
    // Parse obfuscation level from arguments (after the expiration time)
    let obfuscationLevel: ObfuscationLevelType = ObfuscationLevel.Medium; // Default level
    
    if (args.length > argsOffset) {
      const requestedLevel = args[argsOffset].toLowerCase();
      
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
        title: "⚙️ Processing Temporary Lua File",
        description: `I'm working on obfuscating your file with **${obfuscationLevel}** protection.`,
        fields: [
          {
            name: "📄 File",
            value: fileName,
            inline: true
          },
          {
            name: "⏱️ Expires In",
            value: `${expirationHours} hour${expirationHours !== 1 ? 's' : ''}`,
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
      
      // Send a processing message to the channel
      const processingMessage = await message.reply({
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
      
      // Delete the original message to protect the source code
      if (message.guild && message.deletable) {
        try {
          await message.delete();
          console.log("Deleted original message containing Lua code for security");
        } catch (deleteError) {
          console.error("Failed to delete original message:", deleteError);
          // Continue with obfuscation even if delete fails
        }
      }
      
      // Measure processing time
      const startTime = Date.now();
      
      // Obfuscate the code with the specified level
      const obfuscatedCode = obfuscateLua(luaCode, obfuscationLevel);
      
      // Calculate processing time in milliseconds
      const processingTime = Date.now() - startTime;
      console.log(`Temporary obfuscation took ${processingTime}ms at ${obfuscationLevel} level`);
      
      // Create temporary obfuscation entry in storage
      const userId = message.author.id;
      const tempObfuscation = await storage.createTempObfuscation(
        userId,
        obfuscatedCode,
        'lua', // Language type
        obfuscationLevel,
        expiresAt,
        fileName
      );
      
      console.log(`Created temporary obfuscation entry with ID: ${tempObfuscation.id}, expires at: ${expiresAt}`);
      
      // Send the temporary obfuscation info to the user via DM
      try {
        // Try sending a test DM first to verify permissions
        const expirationDate = expiresAt.toLocaleString();
        const resultEmbed = {
          color: 0xF5A623, // Orange from logo
          title: "⏱️ Temporary Obfuscation Complete",
          description: `Your Lua code has been obfuscated with **${obfuscationLevel}** protection.\n\n**This obfuscated file will expire on: ${expirationDate}**`,
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
            },
            {
              name: "⏱️ Expires After",
              value: `${expirationHours} hour${expirationHours !== 1 ? 's' : ''}`,
              inline: true
            },
            {
              name: "📝 Note",
              value: "This is a temporary obfuscation. After the expiration time, this file will no longer work.",
              inline: false
            }
          ],
          thumbnail: {
            url: "attachment://logo.png"
          },
          footer: {
            text: "LUA Obfuscator Bot - Temporary File",
            icon_url: "attachment://logo.png"
          },
          timestamp: new Date().toISOString()
        };
        
        // Send the obfuscated file to the user
        await message.author.send({
          embeds: [resultEmbed],
          files: [
            {
              attachment: 'client/public/logo.png',
              name: 'logo.png'
            },
            {
              attachment: Buffer.from(obfuscatedCode),
              name: `temp_${expirationHours}h_${fileName}`
            }
          ]
        });
        
        console.log("Successfully sent temporary obfuscation DM to user:", message.author.tag);
        
        // Update the processing message to confirm DM was sent
        const confirmEmbed = {
          color: 0x57F287, // Discord green for success
          title: "✅ Temporary File Created",
          description: `I've sent you a DM with the obfuscated code that will expire after **${expirationHours} hour${expirationHours !== 1 ? 's' : ''}**!\n\nCheck your direct messages from me.`,
          thumbnail: {
            url: "attachment://logo.png"
          },
          footer: {
            text: "LUA Obfuscator Bot",
            icon_url: "attachment://logo.png"
          },
          timestamp: new Date().toISOString()
        };
        
        // Edit the processing message instead of creating a new reply
        if (processingMessage && processingMessage.editable) {
          await processingMessage.edit({
            embeds: [confirmEmbed],
            files: [{
              attachment: 'client/public/logo.png',
              name: 'logo.png'
            }]
          });
        }
        
        // Create obfuscation log entry
        await storage.createObfuscationLog({
          userId: message.author.id,
          code: null, // Don't store the code itself for privacy
          obfuscatedCode: null,
          level: obfuscationLevel,
          language: 'lua',
          fileName,
          fileSize: luaCode.length,
          obfuscatedSize: obfuscatedCode.length,
          processingTime,
          source: 'discord_temp',
          success: true,
          error: null
        });
      } catch (dmError) {
        console.error("Failed to send DM to user:", dmError);
        
        // Update the processing message to indicate DM failure
        const errorEmbed = {
          color: 0xED4245, // Discord red for errors
          title: "❌ DM Failed",
          description: "I couldn't send you a direct message. Please make sure you have DMs enabled for this server.",
          fields: [
            {
              name: "💡 How to Enable DMs",
              value: "Right-click on the server icon → Privacy Settings → Enable 'Allow direct messages from server members'",
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
        
        if (processingMessage && processingMessage.editable) {
          await processingMessage.edit({
            embeds: [errorEmbed],
            files: [{
              attachment: 'client/public/logo.png',
              name: 'logo.png'
            }]
          });
        }
      }
    } catch (error) {
      console.error("Error processing temporary obfuscation:", error);
      
      // Send error notification to the channel
      const errorEmbed = {
        color: 0xED4245, // Discord red for errors
        title: "❌ Obfuscation Error",
        description: "Sorry, I encountered an error while processing your file.",
        fields: [
          {
            name: "🔍 Error Details",
            value: error.toString().substring(0, 1000), // Truncate if too long
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
      
      await message.channel.send({
        embeds: [errorEmbed],
        files: [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      });
      
      // Log the error
      await storage.createObfuscationLog({
        userId: message.author.id,
        code: null,
        obfuscatedCode: null,
        level: obfuscationLevel,
        language: 'lua',
        fileName: fileName || "unknown.lua",
        fileSize: 0,
        obfuscatedSize: 0,
        processingTime: 0,
        source: 'discord_temp',
        success: false,
        error: error.toString()
      });
    }
  } catch (error) {
    console.error("Unexpected error in tempobfuscate command:", error);
    try {
      await message.reply("Sorry, I encountered an unexpected error while processing your command.");
    } catch (replyError) {
      console.error("Failed to send error reply:", replyError);
    }
  }
}

// Rate limiting map: userId -> last obfuscation timestamps
const userObfuscations = new Map<string, Date[]>();
const PREMIUM_ROLE_ID = "1359162444035133450";
const MAX_OBFUSCATIONS = 3;
const DAYS_WINDOW = 3;

async function handleObfuscateCommand(message: Message, args: string[], storage: IStorage) {
  // Get reference to client for notifications
  const client = message.client;
  try {
    // Check if user has premium role
    const isPremium = message.member?.roles.cache.has(PREMIUM_ROLE_ID) || false;
    
    // Check level and premium requirements
    const requestedLevel = args.find(arg => ['light', 'medium', 'heavy'].includes(arg.toLowerCase()));
    if (requestedLevel === 'heavy' && !isPremium) {
      await message.reply({
        embeds: [{
          color: 0xED4245,
          title: "❌ Premium Required",
          description: "Heavy obfuscation is only available for premium users.",
          fields: [
            {
              name: "💎 Want Premium?",
              value: "Contact an administrator to learn more about premium access.",
              inline: false
            }
          ]
        }]
      });
      return;
    }

    // Check rate limits for non-premium users
    if (!isPremium) {
      const userId = message.author.id;
      const now = new Date();
      const userTimes = userObfuscations.get(userId) || [];
      
      // Remove timestamps older than DAYS_WINDOW days
      const threshold = new Date(now.getTime() - (DAYS_WINDOW * 24 * 60 * 60 * 1000));
      const recentTimes = userTimes.filter(time => time > threshold);
      
      if (recentTimes.length >= MAX_OBFUSCATIONS) {
        const oldestTime = recentTimes[0];
        const resetTime = new Date(oldestTime.getTime() + (DAYS_WINDOW * 24 * 60 * 60 * 1000));
        await message.reply({
          embeds: [{
            color: 0xED4245,
            title: "❌ Rate Limit Reached",
            description: `You have used all ${MAX_OBFUSCATIONS} obfuscations for the ${DAYS_WINDOW}-day period.`,
            fields: [
              {
                name: "🕒 Next Available",
                value: `Your limit will reset <t:${Math.floor(resetTime.getTime() / 1000)}:R>`,
                inline: false
              },
              {
                name: "💎 Need More?",
                value: "Premium users get unlimited obfuscations!",
                inline: false
              }
            ]
          }]
        });
        return;
      }
      
      // Update timestamps
      recentTimes.push(now);
      userObfuscations.set(userId, recentTimes);
    }
    // Check if there are any attachments first
    if (!message.attachments.size) {
      // No attachment included with the obfuscate command
      const noFileEmbed = {
        color: 0xED4245, // Discord red for errors
        title: "❌ Missing File",
        description: "Please attach a file (.lua, .js, or .html) to obfuscate.",
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
          text: "OBFUSCORE Bot",
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

    // Filter supported file types
    const supportedAttachments = message.attachments.filter(isSupportedFile);

    if (!supportedAttachments.size) {
      // No supported file types found
      const invalidFileEmbed = {
        color: 0xED4245, // Discord red for errors
        title: "❌ Invalid File Type",
        description: "No supported files found. Please attach a file with one of these extensions: `.lua`, `.js`, or `.html`.",
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
          text: "OBFUSCORE Bot",
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

    // Process the first valid file
    const attachment = supportedAttachments.first()!;
    const fileName = attachment.name || "unknown.file";
    
    // Determine the language from the file extension
    const fileLanguage = getFileLanguage(attachment);
    
    // Default language to lua if something goes wrong
    if (!fileLanguage) {
      await message.reply("Error determining file language. Please try again with a .lua, .js, or .html file.");
      return;
    }
    
    // Default obfuscation level
    let obfuscationLevel: ObfuscationLevelType = ObfuscationLevel.Medium;
    
    // Support multiple argument formats:
    // 1. !obfuscate js light - First arg is language, second is level
    // 2. !obfuscate light - First arg is level, use file extension for language
    // 3. !obfuscate - No args, use file extension and default level
    
    const requestedLanguage = args.length > 0 ? args[0].toLowerCase() : null;
    
    let finalLanguage = fileLanguage;
    let argOffset = 0;
    
    // Check if first argument is a language
    if (requestedLanguage === "lua" || requestedLanguage === "js" || requestedLanguage === "html") {
      finalLanguage = requestedLanguage;
      argOffset = 1; // Skip first arg when checking for level
    }
    
    // Check for obfuscation level in arguments (could be first or second arg)
    if (args.length > argOffset) {
      const requestedLevel = args[argOffset].toLowerCase();
      
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
            text: "OBFUSCORE Bot",
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
    
    // Determine language name for display
    const languageNames = {
      'lua': 'Lua',
      'js': 'JavaScript',
      'html': 'HTML'
    };
    
    const languageName = languageNames[finalLanguage as keyof typeof languageNames] || 'Code';
    
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
      
      // Send a processing message to the channel
      const processingMessage = await message.reply({
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
      
      // Delete the original message to protect the source code
      if (message.guild && message.deletable) {
        try {
          await message.delete();
          console.log("Deleted original message containing Lua code for security");
        } catch (deleteError) {
          console.error("Failed to delete original message:", deleteError);
          // Continue with obfuscation even if delete fails
        }
      }
      
      // Measure processing time
      const startTime = Date.now();
      
      // Obfuscate the code with the specified level
      const obfuscatedCode = obfuscateLua(luaCode, obfuscationLevel);
      
      // Calculate processing time in milliseconds
      const processingTime = Date.now() - startTime;
      console.log(`Obfuscation took ${processingTime}ms at ${obfuscationLevel} level`);
      
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
        
        // Update the processing message to confirm DM was sent
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
        
        // Edit the processing message instead of creating a new reply
        if (processingMessage && processingMessage.editable) {
          await processingMessage.edit({
            embeds: [confirmEmbed],
            files: [{
              attachment: 'client/public/logo.png',
              name: 'logo.png'
            }]
          });
        } else {
          // Fallback if the processing message can't be edited
          // Use a TextChannel-compatible method
          if (message.channel.type === ChannelType.GuildText) {
            const textChannel = message.channel as TextChannel;
            await textChannel.send({
              embeds: [confirmEmbed],
              files: [{
                attachment: 'client/public/logo.png',
                name: 'logo.png'
              }]
            });
          } else {
            // Last resort: try to create a new reply
            console.log("Could not edit or send in channel, attempting reply as fallback");
            await message.reply({
              embeds: [confirmEmbed],
              files: [{
                attachment: 'client/public/logo.png',
                name: 'logo.png'
              }]
            });
          }
        }
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
        
        // Edit the processing message instead of creating a new reply
        if (processingMessage && processingMessage.editable) {
          await processingMessage.edit({
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
        } else {
          // Fallback if the processing message can't be edited
          // Use a TextChannel-compatible method
          if (message.guild && message.channel.type === ChannelType.GuildText) {
            const textChannel = message.channel as TextChannel;
            await textChannel.send({
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
          } else {
            // Last resort: try to create a new reply
            console.log("Could not edit or send in channel, attempting reply as fallback");
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
        }
      }
      
      // Get a sample of the code for the activity feed (first 100 chars)
      const codeSample = luaCode.length > 100 ? luaCode.substring(0, 100) : luaCode;
      
      // Log the successful obfuscation with level information, processing time, and code sample
      await storage.createObfuscationLog({
        userId: message.author.id,
        fileName,
        fileSize: attachment.size,
        success: true,
        level: obfuscationLevel,
        processingTime: processingTime,
        code: codeSample
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
      
      // In a catch block, just use a default error message as the code sample
      const errorCodeSample = "Error occurred before code was processed";
      
      // Log the failed obfuscation with level information and code sample
      await storage.createObfuscationLog({
        userId: message.author.id,
        fileName,
        fileSize: attachment.size,
        success: false,
        level: obfuscationLevel,
        processingTime: 0, // Failed so no processing time
        code: errorCodeSample
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

// Stats command handler to show service usage statistics
// New function to update the read-only stats channels
async function updateStatsChannels(client: Client, storage: IStorage) {
  try {
    console.log("Updating stats channels...");
    
    // Get global statistics
    const totalObfuscations = await storage.getTotalObfuscations();
    const todayObfuscations = await storage.getTodayObfuscations();
    const uniqueUsers = await storage.getUniqueUsers();
    const protectionLevelStats = await storage.getProtectionLevelStats();
    const languageStats = await storage.getLanguageStats();
    const dailyStats = await storage.getDailyStats(7); // Last 7 days
    
    // Format date for channel name
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Update total stats channel
    const totalStatsChannel = await findOrCreateStatsChannel(
      client, 
      STATS_TOTAL_CHANNEL_ID, 
      `📊︱stats-overview`
    );
    
    if (totalStatsChannel && totalStatsChannel.isTextBased()) {
      // Create a beautiful embed for total stats
      const statsEmbed = {
        color: 0x3498DB, // Blue
        title: "📊 ObfusCore Statistics",
        description: "Real-time statistics about our obfuscation service",
        fields: [
          {
            name: "🔒 Total Obfuscations",
            value: totalObfuscations.toLocaleString(),
            inline: true
          },
          {
            name: "👥 Unique Users",
            value: uniqueUsers.toLocaleString(),
            inline: true
          },
          {
            name: "📅 Today's Obfuscations",
            value: todayObfuscations.toLocaleString(),
            inline: true
          },
          {
            name: "⚙️ Protection Level Usage",
            value: formatStatsObject(protectionLevelStats),
            inline: false
          }
        ],
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: `Last updated: ${dateString}`,
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      // Find or create stats message and update it
      await findOrCreateStatsMessage(
        totalStatsChannel,
        "📊 ObfusCore Statistics",
        statsEmbed,
        [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      );
    }
    
    // Update daily stats channel
    const dailyStatsChannel = await findOrCreateStatsChannel(
      client, 
      STATS_DAILY_CHANNEL_ID, 
      `📈︱daily-stats`
    );
    
    if (dailyStatsChannel && dailyStatsChannel.isTextBased()) {
      // Create daily stats embed
      const dailyFields = dailyStats.map(day => {
        return {
          name: day.day,
          value: `${day.obfuscations.toLocaleString()} obfuscations`,
          inline: true
        };
      });
      
      const dailyStatsEmbed = {
        color: 0x2ECC71, // Green
        title: "📈 Daily Obfuscation Stats",
        description: "Obfuscation activity over the past 7 days",
        fields: dailyFields,
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: `Last updated: ${dateString}`,
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      // Find or create daily stats message and update it
      await findOrCreateStatsMessage(
        dailyStatsChannel,
        "📈 Daily Obfuscation Stats",
        dailyStatsEmbed,
        [{
          attachment: 'client/public/logo.png',
          name: 'logo.png'
        }]
      );
    }
    
    // Update language stats channel
    const languageStatsChannel = await findOrCreateStatsChannel(
      client, 
      STATS_LANGUAGES_CHANNEL_ID, 
      `🌐︱language-stats`
    );
    
    if (languageStatsChannel && languageStatsChannel.isTextBased()) {
      // Create language stats embed
      const languageStatsEmbed = {
        color: 0x9B59B6, // Purple
        title: "🌐 Language Usage Statistics",
        description: "Breakdown of obfuscation requests by language",
        fields: [
          {
            name: "🔤 Languages",
            value: formatStatsObject(languageStats),
            inline: false
          }
        ],
        image: {
          url: "attachment://banner.png"
        },
        thumbnail: {
          url: "attachment://logo.png"
        },
        footer: {
          text: `Last updated: ${dateString}`,
          icon_url: "attachment://logo.png"
        },
        timestamp: new Date().toISOString()
      };
      
      // Find or create language stats message and update it
      await findOrCreateStatsMessage(
        languageStatsChannel,
        "🌐 Language Usage Statistics",
        languageStatsEmbed,
        [
          {
            attachment: 'client/public/logo.png',
            name: 'logo.png'
          },
          {
            attachment: 'attached_assets/lua obfuscator banner.png',
            name: 'banner.png'
          }
        ]
      );
    }
    
    console.log("Successfully updated all stats channels");
  } catch (error) {
    console.error("Failed to update stats channels:", error);
  }
}

// Helper function to find or create a stats channel by ID or name
async function findOrCreateStatsChannel(client: Client, channelId: string, fallbackName: string) {
  try {
    // Try to find the channel by ID first
    let channel: GuildChannel | null = null;
    
    for (const guild of client.guilds.cache.values()) {
      const foundChannel = guild.channels.cache.get(channelId);
      if (foundChannel) {
        channel = foundChannel;
        break;
      }
      
      // If not found by ID, try to find by name
      const statsChannel = guild.channels.cache.find(
        c => c.name.toLowerCase() === fallbackName.toLowerCase() ||
             c.name.toLowerCase().includes('stats')
      );
      
      if (statsChannel) {
        channel = statsChannel;
        break;
      }
    }
    
    // If still not found, create it in the first guild (for demo purposes)
    if (!channel && client.guilds.cache.size > 0) {
      const guild = client.guilds.cache.first()!;
      try {
        // Create a new channel with appropriate permissions (locked down)
        channel = await guild.channels.create({
          name: fallbackName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.SendMessages],
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
            },
            {
              id: client.user!.id,
              allow: [
                PermissionFlagsBits.SendMessages, 
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles
              ]
            }
          ],
          position: 0, // Place at the top of the channel list
          topic: "📊 Automatically updated statistics for OBFUSCORE - Last updated: " + new Date().toLocaleString()
        });
        
        console.log(`Created new stats channel: ${channel.name}`);
      } catch (createError) {
        console.error("Failed to create stats channel:", createError);
      }
    }
    
    return channel;
  } catch (error) {
    console.error("Error finding/creating stats channel:", error);
    return null;
  }
}

// Helper function to clear all messages in a channel (max 100)
// We keep the old function for compatibility but will not use it anymore
async function clearChannelMessages(channel: TextBasedChannel) {
  try {
    // Check if the channel supports message deletion (not a DM)
    if ('bulkDelete' in channel) {
      const messages = await channel.messages.fetch({ limit: 100 });
      if (messages.size > 0) {
        await channel.bulkDelete(messages);
      }
    } else {
      // For other channels, just fetch and delete one by one
      const messages = await channel.messages.fetch({ limit: 10 });
      for (const message of messages.values()) {
        if (message.deletable) {
          await message.delete();
        }
      }
    }
  } catch (error) {
    console.error("Error clearing channel messages:", error);
  }
}

// New function to find or create a stats message that can be updated
async function findOrCreateStatsMessage(
  channel: TextBasedChannel, 
  messageTitle: string,
  embed: any,
  files: any[]
): Promise<any> {
  try {
    // Fetch recent messages in the channel
    const messages = await channel.messages.fetch({ limit: 10 });
    
    // Try to find a message from the bot with the specified title
    const botMessages = messages.filter(msg => 
      msg.author.bot && 
      msg.author.id === channel.client.user!.id &&
      msg.embeds?.length > 0 &&
      msg.embeds[0].title === messageTitle
    );
    
    if (botMessages.size > 0) {
      // Found an existing stats message to update
      const statsMessage = botMessages.first()!;
      console.log(`Found existing stats message with ID ${statsMessage.id} in channel ${channel.id}`);
      
      // Edit the existing message with new stats
      return await statsMessage.edit({
        embeds: [embed],
        files: files
      });
    } else {
      // No existing message found, create a new one
      console.log(`Creating new stats message in channel ${channel.id}`);
      return await channel.send({
        embeds: [embed],
        files: files
      });
    }
  } catch (error) {
    console.error("Error finding or creating stats message:", error);
    
    // Fallback to creating a new message if editing fails
    try {
      return await channel.send({
        embeds: [embed],
        files: files
      });
    } catch (fallbackError) {
      console.error("Error in fallback message creation:", fallbackError);
      return null;
    }
  }
}

// Helper function to format stats object to readable string
function formatStatsObject(stats: Record<string, number>): string {
  // Calculate the total for percentage calculations
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
    .map(([key, count]) => {
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      // Convert key to capitalized format and replace underscores with spaces
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
      return `**${formattedKey}**: ${count} (${percentage}%)`;
    })
    .join('\n');
}

// Deprecation notice for the old !stats command
async function handleStatsCommand(message: Message, storage: IStorage) {
  try {
    // Create a deprecation notice embed
    const deprecationEmbed = {
      color: 0xF5A623, // Orange from logo
      title: "⚠️ Stats Command Changed",
      description: "The `!stats` command has been deprecated. Statistics are now available in dedicated channels!",
      fields: [
        {
          name: "📊 Stats Channels",
          value: "Visit these read-only channels to view real-time statistics:",
          inline: false
        },
        {
          name: "📈 Available Stats Channels",
          value: 
            "• 📊︱stats-overview - General obfuscation statistics\n" +
            "• 📈︱daily-stats - Daily usage trends\n" +
            "• 🌐︱language-stats - Language usage data",
          inline: false
        },
        {
          name: "ℹ️ Real-Time Updates",
          value: "These channels are automatically updated with real-time statistics. Stats messages are kept and edited instead of being re-created for better history tracking.",
          inline: false
        }
      ],
      thumbnail: {
        url: "attachment://logo.png"
      },
      footer: {
        text: "Check out the new stats channels for detailed statistics!",
        icon_url: "attachment://logo.png"
      },
      timestamp: new Date().toISOString()
    };
    
    // Send the deprecation notice
    await message.reply({
      embeds: [deprecationEmbed],
      files: [{
        attachment: 'client/public/logo.png',
        name: 'logo.png'
      }]
    });
    
    console.log(`Stats deprecation notice sent to ${message.author.tag}`);
    
    // Force an update of the stats channels when someone tries to use the old command
    if (message.client) {
      try {
        await updateStatsChannels(message.client, storage);
        console.log("Stats channels updated after !stats command usage");
      } catch (updateError) {
        console.error("Failed to update stats channels after !stats command:", updateError);
      }
    }
    
  } catch (error) {
    console.error("Error handling stats command:", error);
    
    // Send error message with an embed
    const errorEmbed = {
      color: 0xED4245, // Discord red for errors
      title: "❌ Error Processing Command",
      description: "Sorry, I couldn't process your request right now.",
      fields: [
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
  }
}

function getFileLanguage(attachment: Attachment): string | null {
  if (!attachment.name) return null;
  
  const ext = path.extname(attachment.name).toLowerCase();
  switch (ext) {
    case ".lua": return "lua";
    case ".js": return "js";
    case ".html": return "html";
    default: return null;
  }
}

function isLuaFile(attachment: Attachment): boolean {
  return getFileLanguage(attachment) === "lua";
}

function isJsFile(attachment: Attachment): boolean {
  return getFileLanguage(attachment) === "js";
}

function isHtmlFile(attachment: Attachment): boolean {
  return getFileLanguage(attachment) === "html";
}

function isSupportedFile(attachment: Attachment): boolean {
  return getFileLanguage(attachment) !== null;
}

// Function to set up verification message with button
async function setupVerification(channel: any) {
  try {
    // Create the verification embed based on the example
    const verifyEmbed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle("OBFUSCORE Verification")
      .setDescription("Verify yourself to gain access to OBFUSCORE services.")
      .addFields({ name: "Instructions", value: "Click the button below to verify yourself." })
      .setImage("attachment://banner.png")
      .setThumbnail("attachment://logo.png")
      .setFooter({ 
        text: "OBFUSCORE - Lua Code Protection", 
        iconURL: "attachment://logo.png" 
      });

    // Create the button for verification
    const verifyButton = new ButtonBuilder()
      .setCustomId('verify')
      .setLabel('Verify Me')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(verifyButton);

    // Send the verification message with button
    await channel.send({
      embeds: [verifyEmbed],
      components: [actionRow],
      files: [
        {
          attachment: 'attached_assets/lua obfuscator banner.png',
          name: 'banner.png'
        },
        {
          attachment: 'attached_assets/lua obfuscator logo.png',
          name: 'logo.png'
        }
      ]
    });

    console.log("Verification message setup complete.");
  } catch (error) {
    console.error("Error setting up verification:", error);
  }
}

// Function to handle verification button clicks
async function handleVerification(interaction: Interaction) {
  if (!interaction.isButton() || !interaction.guild) return;
  
  try {
    // Defer the reply to prevent "interaction failed" errors
    await interaction.deferReply({ ephemeral: true });
    
    // Get the member who clicked the button
    const member = interaction.member as GuildMember;
    
    // Try to find the verification role - anyone can verify now
    const role = interaction.guild.roles.cache.find(r => 
      r.id === VERIFICATION_ROLE_ID || r.name.toLowerCase().includes('verify') || 
      r.name.toLowerCase().includes('member')
    );
    
    if (role) {
      // Add the role to the member
      await member.roles.add(role);
      
      // Send a success message
      await interaction.editReply({
        content: "✅ You have been successfully verified! Welcome to OBFUSCORE."
      });
      
      // Log the verification
      console.log(`User ${member.user.tag} verified and received role ${role.name}`);
    } else {
      // If no verification role is found
      await interaction.editReply({
        content: "✅ You have been verified! (Note: No verification role was found to assign)"
      });
      
      console.log(`User ${member.user.tag} verified but no role was assigned`);
    }
  } catch (error) {
    console.error("Error handling verification:", error);
    
    // Send error message
    if (interaction.isRepliable()) {
      await interaction.editReply({ 
        content: "❌ There was an error processing your verification. Please contact an administrator."
      });
    }
  }
}

// Function to send a welcome message for a new member
async function sendWelcomeMessage(channel: any, member: GuildMember) {
  try {
    // Create a stylish welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`Welcome to OBFUSCORE, ${member.displayName}!`)
      .setDescription("Thank you for joining our community. OBFUSCORE offers the best Lua code protection service.")
      .addFields(
        { 
          name: "🔒 Our Services", 
          value: "• Lua code obfuscation\n• Variable name encryption\n• String encryption\n• Code minification"
        },
        {
          name: "🔍 Getting Started",
          value: `Type \`!help\` to see available commands and start obfuscating your code.`
        }
      )
      .setImage("attachment://banner.png")
      .setThumbnail("attachment://logo.png")
      .setFooter({ 
        text: "OBFUSCORE - Lua Code Protection", 
        iconURL: "attachment://logo.png" 
      })
      .setTimestamp();

    // Send the welcome message
    await channel.send({
      content: `Welcome <@${member.id}>! 🎉`,
      embeds: [welcomeEmbed],
      files: [
        {
          attachment: 'attached_assets/lua obfuscator banner.png',
          name: 'banner.png'
        },
        {
          attachment: 'attached_assets/lua obfuscator logo.png',
          name: 'logo.png'
        }
      ]
    });

    console.log(`Welcome message sent for ${member.user.tag}`);
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
}
