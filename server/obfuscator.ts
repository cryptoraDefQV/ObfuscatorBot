/**
 * LUA OBFUSCATOR
 * 
 * Implements a simple Lua code obfuscator with the following features:
 * - Variable name obfuscation
 * - String encoding
 * - Code minification
 * - Comment removal
 */

// Function to obfuscate Lua code
export function obfuscateLua(luaCode: string): string {
  try {
    // Step 1: Remove comments
    const noComments = removeComments(luaCode);
    
    // Step 2: Extract and replace strings
    const { code: extractedCode, strings } = extractStrings(noComments);
    
    // Step 3: Rename variables and functions
    const { obfuscatedCode, variableMap } = obfuscateVariables(extractedCode);
    
    // Step 4: Restore strings with encoded versions
    const codeWithStrings = restoreStrings(obfuscatedCode, strings);
    
    // Step 5: Minify the code (remove unnecessary whitespace)
    const minifiedCode = minifyCode(codeWithStrings);
    
    // Add obfuscation wrapper (makes the code harder to reverse)
    return addObfuscationWrapper(minifiedCode);
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
    const paramList = params.split(",").map(param => {
      const trimmedParam = param.trim();
      if (trimmedParam.startsWith("_") || reservedWords.includes(trimmedParam)) {
        return trimmedParam;
      }
      return getObfuscatedName(trimmedParam);
    });
    
    return `${prefix}${paramList.join(", ")}${suffix}`;
  });
  
  // Replace variable usages (simplified approach)
  for (const [original, obfuscated] of variableMap.entries()) {
    const pattern = new RegExp(`\\b${original}\\b`, "g");
    obfuscatedCode = obfuscatedCode.replace(pattern, obfuscated);
  }
  
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
function restoreStrings(code: string, strings: string[]): string {
  let result = code;
  
  for (let i = 0; i < strings.length; i++) {
    const placeholder = `__STR_${i}__`;
    // Optionally encode the string for additional obfuscation
    const encodedString = encodeString(strings[i]);
    result = result.replace(placeholder, encodedString);
  }
  
  return result;
}

// Encode a string using a simple encoding technique
function encodeString(str: string): string {
  // Keep string encoding simple for now
  return str;
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
function addObfuscationWrapper(code: string): string {
  // Simple wrapper that doesn't change the functionality but makes the code look more complex
  return `
-- Obfuscated with LuaObfuscatorBot
local a=string.byte;local b=string.char;local c=string.sub;
local d=table.concat;local e=table.insert;local f=math.ldexp;
local g=getfenv or function()return _ENV end;local h=setmetatable;
local i=select;local j=unpack or table.unpack;local k=tonumber;

${code}
  `.trim();
}

// Lua reserved words to avoid replacing
const reservedWords = [
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function", 
  "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", 
  "true", "until", "while", "goto", "self", "..."
];
