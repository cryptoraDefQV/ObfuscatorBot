import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Code } from "lucide-react";

export default function CommandSimulation() {
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-6">
      <h2 className="font-semibold text-lg mb-4">Command Simulation</h2>
      
      {/* User Message Example */}
      <div className="flex mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 mr-3">
          <Avatar>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
        <div>
          <div className="flex items-center">
            <span className="font-medium text-blue-400">UserName</span>
            <span className="text-gray-400 text-xs ml-2">Today at 12:34 PM</span>
          </div>
          <div className="mt-1 text-gray-300">
            <p className="mb-2">
              <code className="bg-gray-800 px-1 py-0.5 rounded">!obfuscate</code>
            </p>
            <div className="bg-gray-800 rounded p-2 inline-flex items-center">
              <Code className="h-4 w-4 text-indigo-400 mr-2" />
              <span className="text-sm">script.lua</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bot Response Example */}
      <div className="flex">
        <div className="w-10 h-10 rounded-full flex-shrink-0 mr-3 overflow-hidden">
          <div className="bg-indigo-500 w-full h-full flex items-center justify-center">
            <Code className="h-5 w-5 text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center">
            <span className="font-medium text-indigo-400">LuaObfuscatorBot</span>
            <span className="bg-indigo-500 text-white text-xs px-1 rounded ml-2">BOT</span>
            <span className="text-gray-400 text-xs ml-2">Today at 12:34 PM</span>
          </div>
          <div className="mt-1 text-gray-300">
            <p>I've sent you a DM with the obfuscated code!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
