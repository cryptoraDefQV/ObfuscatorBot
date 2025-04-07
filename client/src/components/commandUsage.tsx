import { Card } from "@/components/ui/card";

export default function CommandUsage() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="font-semibold text-lg mb-2">How to use the Obfuscator</h2>
      <p className="text-gray-300 mb-3">
        Obfuscate your Lua code by using the <code className="bg-gray-700 px-1 rounded">!obfuscate</code> command and attaching your Lua file.
      </p>
      <div className="bg-gray-900 rounded p-3 border border-gray-700">
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
    </div>
  );
}
