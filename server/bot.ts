import { Client, GatewayIntentBits, Events, Message, Attachment } from "discord.js";
import { obfuscateLua } from "./obfuscator";
import { IStorage } from "./storage";
import path from "path";

const COMMAND_PREFIX = "!";
const OBFUSCATE_COMMAND = "obfuscate";

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
      // MessageContent is a privileged intent and must be enabled in the Discord Developer Portal
      // GatewayIntentBits.MessageContent
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Discord bot logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore messages from bots (including self)
    if (message.author.bot) return;

    // Check if message starts with the command prefix
    if (!message.content.startsWith(COMMAND_PREFIX)) return;

    const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === OBFUSCATE_COMMAND) {
      await handleObfuscateCommand(message, storage);
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

async function handleObfuscateCommand(message: Message, storage: IStorage) {
  try {
    // Check if there are any attachments
    if (!message.attachments.size) {
      await message.reply("Please attach a Lua file to obfuscate.");
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
      await message.reply("Processing your Lua file. I'll send you the obfuscated code via DM.");
      
      // Fetch the attachment content
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to download attachment: ${response.statusText}`);
      }
      
      const luaCode = await response.text();
      
      // Obfuscate the code
      const obfuscatedCode = obfuscateLua(luaCode);
      
      // Send the obfuscated code to the user via DM
      await message.author.send({
        content: "Here's your obfuscated Lua code:",
        files: [{
          attachment: Buffer.from(obfuscatedCode),
          name: `obfuscated_${fileName}`
        }]
      });
      
      // Confirm in the channel that the DM was sent
      await message.reply("I've sent you a DM with the obfuscated code!");
      
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
