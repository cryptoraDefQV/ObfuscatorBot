/**
 * Client-side utility function for obfuscating Lua code
 * This provides a limited local obfuscation for the demo UI
 * Real obfuscation happens on the server side
 */

export type ObfuscationLevel = 'light' | 'medium' | 'heavy';

export function obfuscateCode(code: string, level: ObfuscationLevel = 'medium'): string {
  if (!code.trim()) return "";
  
  try {
    // Very simple client-side obfuscation for demo purposes
    // This is not as sophisticated as the server-side version
    let result: string;

    // Step 1: Remove comments (all levels)
    result = code.replace(/--.*$/gm, "");
    result = result.replace(/--\[\[[\s\S]*?\]\]/g, "");
    
    // For light level, just remove comments and do basic minification
    if (level === 'light') {
      result = result.replace(/\s+/g, " ");
      result = result.replace(/\s*([=+\-*/%<>!&|:;,()])\s*/g, "$1");
      return `-- Obfuscated with LuaObfuscatorBot Demo (Light)
${result}`;
    }
    
    // Step 2: Basic minification (medium and heavy)
    result = result.replace(/\s+/g, " ");
    result = result.replace(/\s*([=+\-*/%<>!&|:;,()])\s*/g, "$1");
    
    // Step 3: Add wrappers based on level
    if (level === 'heavy') {
      // More complex wrapper for heavy obfuscation
      result = `-- Obfuscated with LuaObfuscatorBot Demo (Heavy)
local a=string.byte;local b=string.char;local c=string.sub;
local d=table.concat;local e=table.insert;local f=math.ldexp;
local g=getfenv or function()return _ENV end;local h=setmetatable;
local i=select;local j=unpack or table.unpack;local k=tonumber;
local function l(m,n)local o={};for p=1,#m do o[p]=b(a(c(m,p,p))+n)end;return d(o)end;

${result}`;
    } else {
      // Medium level (default)
      result = `-- Obfuscated with LuaObfuscatorBot Demo (Medium)
local a=string.byte;local b=string.char;local c=string.sub;
local d=table.concat;local e=table.insert;local f=math.ldexp;

${result}`;
    }
    
    return result;
  } catch (error) {
    console.error("Error obfuscating code:", error);
    return "-- Error obfuscating code";
  }
}
