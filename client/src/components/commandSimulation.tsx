import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Code, Check, Cog, FileType, Lock } from "lucide-react";

export default function CommandSimulation() {
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-6">
      <h2 className="section-header font-semibold text-xl mb-4">Command Simulation</h2>
      
      {/* Discord channel view */}
      <div className="bg-gray-800 rounded-md p-4 mb-4">
        <div className="text-gray-400 text-sm mb-3 flex items-center">
          <span className="text-blue-400 mr-1">#</span>
          <span>lua-protection</span>
        </div>
        
        {/* User Message Example */}
        <div className="flex mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 mr-3">
            <Avatar>
              <AvatarFallback className="bg-blue-700 text-white">U</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-medium text-blue-400">UserName</span>
              <span className="text-gray-400 text-xs ml-2">Today at 12:34 PM</span>
            </div>
            <div className="mt-1 text-gray-300">
              <p className="mb-2">
                <code className="bg-gray-700 px-2 py-0.5 rounded font-mono">!obfuscate heavy</code>
              </p>
              <div className="bg-gray-700 rounded p-2 inline-flex items-center border border-gray-600">
                <FileType className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-sm">fivem_script.lua</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bot Processing Response */}
        <div className="flex mb-6">
          <div className="w-10 h-10 rounded-full flex-shrink-0 mr-3 overflow-hidden">
            <img 
              src="/logo.png"
              alt="OBFUSCORE Logo" 
              className="w-full h-full object-contain bg-gray-800"
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-center">
              <span className="font-medium text-blue-400">OBFUSCORE</span>
              <span className="bg-blue-600 text-white text-xs px-1 rounded ml-2">BOT</span>
              <span className="text-gray-400 text-xs ml-2">Today at 12:34 PM</span>
            </div>
            
            {/* Processing embed */}
            <div className="mt-2 discord-embed p-3">
              <div className="flex items-center mb-1">
                <Cog className="h-5 w-5 mr-2 text-blue-400 animate-spin" />
                <span className="font-semibold text-white">Processing Lua File</span>
              </div>
              <p className="text-gray-300 text-sm">
                I'm working on obfuscating your file with <strong>heavy</strong> protection.
              </p>
              
              <div className="grid grid-cols-2 gap-3 my-3">
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-xs text-gray-400">📄 File</div>
                  <div className="text-sm text-gray-200">fivem_script.lua</div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-xs text-gray-400">🔒 Protection Level</div>
                  <div className="text-sm text-gray-200 flex items-center">
                    <Lock className="h-3 w-3 mr-1 text-blue-400" />
                    Heavy
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1">
                    <img src="/logo.png" alt="OBFUSCORE Logo" className="w-full h-full object-contain" />
                  </div>
                  <span>OBFUSCORE</span>
                </div>
                <div>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bot Success Response */}
        <div className="flex">
          <div className="w-10 h-10 rounded-full flex-shrink-0 mr-3 overflow-hidden">
            <img 
              src="/logo.png"
              alt="OBFUSCORE Logo" 
              className="w-full h-full object-contain bg-gray-800"
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-center">
              <span className="font-medium text-blue-400">OBFUSCORE</span>
              <span className="bg-blue-600 text-white text-xs px-1 rounded ml-2">BOT</span>
              <span className="text-gray-400 text-xs ml-2">Today at 12:35 PM</span>
            </div>
            
            {/* Success embed */}
            <div className="mt-2 discord-embed border-green-500 p-3">
              <div className="flex items-center mb-1">
                <Check className="h-5 w-5 mr-2 text-green-400" />
                <span className="font-semibold text-white">DM Sent Successfully</span>
              </div>
              <p className="text-gray-300 text-sm">
                I've sent you a DM with the obfuscated code!
                <br />
                Check your direct messages from me.
              </p>
              
              <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1">
                    <img src="/logo.png" alt="OBFUSCORE Logo" className="w-full h-full object-contain" />
                  </div>
                  <span>OBFUSCORE</span>
                </div>
                <div>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-gray-400 text-sm bg-gray-800 p-3 rounded-md">
        <p className="flex items-center">
          <Lock className="h-4 w-4 mr-2 text-blue-400" />
          OBFUSCORE sends all obfuscated code via direct message to protect your code's privacy.
        </p>
        <p className="mt-1">
          For examples of what the DM looks like, see the Direct Message Example below.
        </p>
      </div>
    </div>
  );
}
