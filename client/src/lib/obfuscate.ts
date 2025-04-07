/**
 * Client-side utility function for obfuscating Lua code
 * This provides a limited local obfuscation for the demo UI
 * Real obfuscation happens on the server side
 */

export function obfuscateCode(code: string): string {
  if (!code.trim()) return "";
  
  try {
    // Very simple client-side obfuscation for demo purposes
    // This is not as sophisticated as the server-side version

    // Step 1: Remove comments
    let result = code.replace(/--.*$/gm, "");
    result = result.replace(/--\[\[[\s\S]*?\]\]/g, "");
    
    // Step 2: Basic minification
    result = result.replace(/\s+/g, " ");
    result = result.replace(/\s*([=+\-*/%<>!&|:;,()])\s*/g, "$1");
    
    // Step 3: Add simple wrapper
    result = `-- Obfuscated with LuaObfuscatorBot Demo
local a=string.byte;local b=string.char;local c=string.sub;
local d=table.concat;local e=table.insert;local f=math.ldexp;

${result}`;
    
    return result;
  } catch (error) {
    console.error("Error obfuscating code:", error);
    return "-- Error obfuscating code";
  }
}
