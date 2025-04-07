import { Card } from "@/components/ui/card";
import { Shield, FileText, BookOpen, Check, HelpCircle, Cog, AlertTriangle, FileCode, Lock } from "lucide-react";

export default function CommandUsage() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="section-header font-semibold text-xl mb-4">How to use OBFUSCORE</h2>
      <p className="text-gray-300 mb-4">
        Protect your Lua code by using the <code className="bg-gray-700 px-1 rounded">!obfuscate</code> command and attaching your Lua file.
      </p>
      
      {/* Step by step instructions */}
      <div className="bg-gray-900 rounded p-4 border border-gray-700 mb-6">
        <h3 className="font-semibold mb-3 text-blue-400">Simple 3-step process:</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <span className="text-white font-bold">1</span>
            </div>
            <div>
              <p className="text-gray-200 font-medium">Type <code className="bg-gray-700 px-1 rounded">!obfuscate</code> in a Discord channel</p>
              <p className="text-gray-400 text-sm">Optionally add your protection level: light, medium (default), or heavy</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <span className="text-white font-bold">2</span>
            </div>
            <div>
              <p className="text-gray-200 font-medium">Attach your .lua file to the message</p>
              <p className="text-gray-400 text-sm">Only files with the .lua extension will be processed</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <span className="text-white font-bold">3</span>
            </div>
            <div>
              <p className="text-gray-200 font-medium">Get obfuscated code via DM</p>
              <p className="text-gray-400 text-sm">OBFUSCORE will privately send you the obfuscated file</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Discord-style embeds */}
      <div className="mb-6">
        <h3 className="section-header font-semibold mb-3">Bot Responses:</h3>
        <div className="space-y-3">
          {/* Processing embed */}
          <div className="discord-embed p-3">
            <div className="flex items-center mb-1">
              <Cog className="h-5 w-5 mr-2 text-blue-400 animate-spin" />
              <span className="font-semibold text-white">Processing Lua File</span>
            </div>
            <p className="text-gray-300 text-sm mb-1">
              I'm working on obfuscating your file with <strong>heavy</strong> protection.
            </p>
            <div className="flex text-xs text-gray-400 mt-2 justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-1">
                  <img src="/logo.png" alt="OBFUSCORE Logo" className="w-full h-full object-contain" />
                </div>
                <span>OBFUSCORE</span>
              </div>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
          {/* Success embed */}
          <div className="discord-embed border-green-500 p-3">
            <div className="flex items-center mb-1">
              <Check className="h-5 w-5 mr-2 text-green-400" />
              <span className="font-semibold text-white">DM Sent Successfully</span>
            </div>
            <p className="text-gray-300 text-sm mb-1">
              I've sent you a DM with the obfuscated code!
            </p>
            <div className="flex text-xs text-gray-400 mt-2 justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-1">
                  <img src="/logo.png" alt="OBFUSCORE Logo" className="w-full h-full object-contain" />
                </div>
                <span>OBFUSCORE</span>
              </div>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
          {/* Error embed example */}
          <div className="discord-embed border-red-500 p-3">
            <div className="flex items-center mb-1">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
              <span className="font-semibold text-white">Invalid File Type</span>
            </div>
            <p className="text-gray-300 text-sm mb-1">
              No valid Lua files found. Please attach a file with the <code className="bg-gray-800 px-1 rounded">.lua</code> extension.
            </p>
            <div className="flex text-xs text-gray-400 mt-2 justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-1">
                  <img src="/logo.png" alt="OBFUSCORE Logo" className="w-full h-full object-contain" />
                </div>
                <span>OBFUSCORE</span>
              </div>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Protection levels */}
      <h3 className="section-header font-semibold mb-3">Protection Levels:</h3>
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900 rounded-lg p-3 border border-blue-800 hover:border-blue-600 transition-colors">
          <div className="flex items-center mb-2">
            <FileCode className="h-5 w-5 mr-2 text-blue-500" />
            <h4 className="font-medium text-blue-400">Light</h4>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm">Basic obfuscation:</p>
            <ul className="text-gray-400 text-xs pl-5 list-disc">
              <li>Comments removal</li>
              <li>Code minification</li>
              <li>Whitespace removal</li>
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-800">
              <code className="bg-gray-800 px-2 py-1 rounded text-xs">!obfuscate light</code>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 border border-blue-800 hover:border-blue-600 transition-colors">
          <div className="flex items-center mb-2">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            <h4 className="font-medium text-blue-400">Medium (Default)</h4>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm">Standard protection:</p>
            <ul className="text-gray-400 text-xs pl-5 list-disc">
              <li>Variable name obfuscation</li>
              <li>Light protection features</li>
              <li>Structure preservation</li>
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-800">
              <code className="bg-gray-800 px-2 py-1 rounded text-xs">!obfuscate</code> or <code className="bg-gray-800 px-2 py-1 rounded text-xs">!obfuscate medium</code>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 border border-blue-800 hover:border-blue-600 transition-colors">
          <div className="flex items-center mb-2">
            <Lock className="h-5 w-5 mr-2 text-blue-500" />
            <h4 className="font-medium text-blue-400">Heavy</h4>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm">Maximum protection:</p>
            <ul className="text-gray-400 text-xs pl-5 list-disc">
              <li>String encryption</li>
              <li>Control flow obfuscation</li>
              <li>Medium protection features</li>
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-800">
              <code className="bg-gray-800 px-2 py-1 rounded text-xs">!obfuscate heavy</code>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700 flex items-start">
        <HelpCircle className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-gray-200 font-medium">Need help?</p>
          <p className="text-gray-400 text-sm">
            Type <code className="bg-gray-700 px-1 rounded">!help</code> to see all available commands and details.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            For best results with FiveM scripts, use light protection for config files, medium for utilities, and heavy for core business logic.
          </p>
        </div>
      </div>
    </div>
  );
}
