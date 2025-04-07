import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function CommandUsage() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="font-semibold text-lg mb-2">How to use the Obfuscator</h2>
      <p className="text-gray-300 mb-3">
        Obfuscate your Lua code by using the <code className="bg-gray-700 px-1 rounded">!obfuscate</code> command and attaching your Lua file.
      </p>
      
      <div className="bg-gray-900 rounded p-3 border border-gray-700 mb-4">
        <p className="text-gray-300">
          <span className="text-indigo-400 font-medium">Step 1:</span> Type <code className="bg-gray-700 px-1 rounded">!obfuscate</code> in a channel where the bot is present
        </p>
        <p className="text-gray-300 mt-2">
          <span className="text-indigo-400 font-medium">Step 2:</span> Attach your .lua file to the message
        </p>
        <p className="text-gray-300 mt-2">
          <span className="text-indigo-400 font-medium">Step 3:</span> The bot will DM you the obfuscated code
        </p>
      </div>
      
      <h3 className="font-semibold text-md mb-2">Protection Levels</h3>
      <div className="bg-gray-900 rounded p-3 border border-gray-700">
        <p className="text-gray-300 mb-2">
          Choose your desired protection level by adding it after the command:
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <Shield className="h-4 w-4 mt-1 mr-2 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-gray-200 font-medium">Light</p>
              <p className="text-gray-400 text-sm">Basic obfuscation (comments removal, minification)</p>
              <code className="bg-gray-700 px-1 rounded text-xs">!obfuscate light</code>
            </div>
          </div>
          
          <div className="flex items-start">
            <Shield className="h-4 w-4 mt-1 mr-2 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-gray-200 font-medium">Medium (Default)</p>
              <p className="text-gray-400 text-sm">Standard protection (variable renaming + light features)</p>
              <code className="bg-gray-700 px-1 rounded text-xs">!obfuscate</code> or <code className="bg-gray-700 px-1 rounded text-xs">!obfuscate medium</code>
            </div>
          </div>
          
          <div className="flex items-start">
            <Shield className="h-4 w-4 mt-1 mr-2 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-gray-200 font-medium">Heavy</p>
              <p className="text-gray-400 text-sm">Maximum protection (string encryption + medium features)</p>
              <code className="bg-gray-700 px-1 rounded text-xs">!obfuscate heavy</code>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-gray-400 text-sm">
        <p>
          Need help? Type <code className="bg-gray-700 px-1 rounded">!help</code> to see all available commands.
        </p>
      </div>
    </div>
  );
}
