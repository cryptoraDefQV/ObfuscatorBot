/**
 * LUA OBFUSCATOR
 * 
 * Implements a Lua code obfuscator with multiple levels of protection:
 * - Light: Comment removal and minification
 * - Medium (Default): Light + Variable name obfuscation
 * - Heavy: Medium + String encryption + Control flow obfuscation
 * 
 * Safety measures are implemented to handle issues with invalid code and
 * ensure the obfuscator doesn't crash on unexpected inputs.
 */

import { ObfuscationLevelType, ObfuscationLevel } from "@shared/schema";

// Main obfuscation function with level selection
export function obfuscateLua(luaCode: string, level: ObfuscationLevelType = ObfuscationLevel.Medium): string {
  try {
    console.log(`Obfuscating Lua code with level: ${level}`);
    
    // Step 1: Always remove comments (all levels)
    let result = removeComments(luaCode);
    
    if (level === ObfuscationLevel.Light) {
      // For light obfuscation, just minify after removing comments
      return minifyCode(result);
    }
    
    // Step 2: Extract and replace strings
    const { code: extractedCode, strings } = extractStrings(result);
    
    // Step 3: Rename variables and functions (Medium and Heavy)
    const { obfuscatedCode, variableMap } = obfuscateVariables(extractedCode);
    
    // Step 4: Restore strings (potentially with encoding for Heavy)
    const shouldEncodeStrings = level === ObfuscationLevel.Heavy;
    const codeWithStrings = restoreStrings(obfuscatedCode, strings, shouldEncodeStrings);
    
    // Step 5: Minify the code (all levels)
    const minifiedCode = minifyCode(codeWithStrings);
    
    // Step 6: Add obfuscation wrapper (Medium and Heavy)
    return addObfuscationWrapper(minifiedCode, level);
  } catch (error) {
    console.error("Obfuscation error:", error);
    throw new Error(`Failed to obfuscate Lua code: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Remove single line and multi-line comments
function removeComments(code: string): string {
  // Remove multi-line comments (--[[ ... ]])
  let result = code.replace(/--\[\[[\s\S]*?\]\]/g, "");
  
  // Remove single line comments (-- ...)
  result = result.replace(/--[^\n]*/g, "");
  
  return result;
}

// Extract string literals to protect them during obfuscation
function extractStrings(code: string): { code: string, strings: string[] } {
  const strings: string[] = [];
  const stringPattern = /(["'])(?:\\\1|.)*?\1/g;
  
  const extractedCode = code.replace(stringPattern, (match) => {
    const index = strings.length;
    strings.push(match);
    return `__STR_${index}__`;
  });
  
  return { code: extractedCode, strings };
}

// Obfuscate variable and function names
function obfuscateVariables(code: string): { obfuscatedCode: string, variableMap: Map<string, string> } {
  // Identify variable and function definitions (simplified approach)
  const variablePattern = /\b(local\s+)(\w+)(\s*=)/g;
  const functionPattern = /\b(function\s+)(\w+)(\s*\()/g;
  const paramPattern = /\b(function\s+\w+\s*\()([^)]+)(\))/g;
  
  const variableMap = new Map<string, string>();
  let variableCounter = 0;
  
  // Generate a new obfuscated name
  const getObfuscatedName = (originalName: string): string => {
    if (!variableMap.has(originalName)) {
      variableMap.set(originalName, generateVarName(variableCounter++));
    }
    return variableMap.get(originalName)!;
  };
  
  // Replace variable declarations
  let obfuscatedCode = code.replace(variablePattern, (match, prefix, name, suffix) => {
    // Don't obfuscate if name is already obfuscated or is a special name
    if (name.startsWith("_") || reservedWords.includes(name)) {
      return match;
    }
    return `${prefix}${getObfuscatedName(name)}${suffix}`;
  });
  
  // Replace function declarations
  obfuscatedCode = obfuscatedCode.replace(functionPattern, (match, prefix, name, suffix) => {
    // Don't obfuscate if name is already obfuscated or is a special name
    if (name.startsWith("_") || reservedWords.includes(name)) {
      return match;
    }
    return `${prefix}${getObfuscatedName(name)}${suffix}`;
  });
  
  // Replace function parameters (simplified, not handling all cases)
  obfuscatedCode = obfuscatedCode.replace(paramPattern, (match, prefix, params, suffix) => {
    const paramList = params.split(",").map((param: string) => {
      const trimmedParam = param.trim();
      if (trimmedParam.startsWith("_") || reservedWords.includes(trimmedParam)) {
        return trimmedParam;
      }
      return getObfuscatedName(trimmedParam);
    });
    
    return `${prefix}${paramList.join(", ")}${suffix}`;
  });
  
  // Replace variable usages (simplified approach)
  Array.from(variableMap.entries()).forEach(([original, obfuscated]) => {
    const pattern = new RegExp(`\\b${original}\\b`, "g");
    obfuscatedCode = obfuscatedCode.replace(pattern, obfuscated);
  });
  
  return { obfuscatedCode, variableMap };
}

// Generate variable names like a, b, c, ..., aa, ab, ...
function generateVarName(index: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  
  do {
    result = chars[index % chars.length] + result;
    index = Math.floor(index / chars.length) - 1;
  } while (index >= 0);
  
  return result;
}

// Restore string literals with encoded versions
function restoreStrings(code: string, strings: string[], encodeStrings: boolean = false): string {
  let result = code;
  
  for (let i = 0; i < strings.length; i++) {
    const placeholder = `__STR_${i}__`;
    const string = strings[i];
    
    // Apply string encoding for heavy obfuscation level
    const encodedString = encodeStrings ? encodeString(string) : string;
    result = result.replace(placeholder, encodedString);
  }
  
  return result;
}

// Encode a string using a simple encoding technique
function encodeString(str: string): string {
  // For heavy obfuscation, we convert strings to char codes
  // Example: "hello" becomes 'string.char(104,101,108,108,111)'
  if (str.length > 2) {
    const content = str.substring(1, str.length - 1);
    const quote = str[0];
    
    // Convert each character to its ASCII code
    const charCodes = [];
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      // Handle escape sequences properly
      if (char === '\\' && i + 1 < content.length) {
        i++;
        if (content[i] === 'n') charCodes.push(10);
        else if (content[i] === 't') charCodes.push(9);
        else if (content[i] === 'r') charCodes.push(13);
        else if (content[i] === quote) charCodes.push(quote.charCodeAt(0));
        else charCodes.push(content[i].charCodeAt(0));
      } else {
        charCodes.push(char.charCodeAt(0));
      }
    }
    
    // Return function that builds the string from char codes
    return `(function() return string.char(${charCodes.join(',')}) end)()`;
  }
  
  return str; // Return as-is for very short strings
}

// Minify code by removing unnecessary whitespace
function minifyCode(code: string): string {
  return code
    // Replace multiple spaces with a single space
    .replace(/\s+/g, " ")
    // Remove spaces around operators
    .replace(/\s*([=+\-*/%<>!&|:;,()])\s*/g, "$1")
    // Add back spaces after keywords
    .replace(/(if|else|elseif|end|then|do|while|for|function|local)\b/g, "$1 ")
    // Fix "--" comments that might have lost their spacing
    .replace(/([^-])-(-[^-])/g, "$1- $2")
    // Remove unnecessary semicolons
    .replace(/;\s*;/g, ";")
    .trim();
}

// Add an obfuscation wrapper to make code harder to reverse
function addObfuscationWrapper(code: string, level: ObfuscationLevelType = ObfuscationLevel.Medium): string {
  // Base wrapper for all levels
  let wrapper = `
-- Obfuscated with LuaObfuscatorBot
`;

  // Add more complex wrappers based on obfuscation level
  if (level === ObfuscationLevel.Heavy) {
    wrapper += `
local a=string.byte;local b=string.char;local c=string.sub;
local d=table.concat;local e=table.insert;local f=math.ldexp;
local g=getfenv or function()return _ENV end;local h=setmetatable;
local i=select;local j=unpack or table.unpack;local k=tonumber;
local function l(m,n)local o={};for p=1,#m do o[p]=b(a(c(m,p,p))+n)end;return d(o)end;
`;
    
    // For heavy obfuscation, we can also add some dummy functions and variables
    wrapper += `
local x,y,z=2305,823,function(A)return A end;
local B,C,D=true,false,0;
while B do if D>20 then B=C;break;end;D=D+1;end;
`;
  } else if (level === ObfuscationLevel.Medium) {
    wrapper += `
local a=string.byte;local b=string.char;local c=string.sub;
local d=table.concat;local e=table.insert;local f=math.ldexp;
local g=getfenv or function()return _ENV end;local h=setmetatable;
local i=select;local j=unpack or table.unpack;local k=tonumber;
`;
  }
  
  return (wrapper + "\n" + code).trim();
}

// Lua reserved words to avoid replacing
const reservedWords = [
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function", 
  "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", 
  "true", "until", "while", "goto", "self", "..."
];
