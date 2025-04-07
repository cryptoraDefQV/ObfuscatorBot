import { Button } from "@/components/ui/button";
import { Code, Menu, HelpCircle } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-gray-900 py-4 px-6 flex items-center justify-between border-b border-gray-700">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
          <Code className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-xl font-bold">Lua Obfuscator Bot</h1>
      </div>
      <div className="flex items-center space-x-4">
        <a 
          href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68608&scope=bot"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-4 rounded-md text-sm transition-colors">
            Add to Server
          </Button>
        </a>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    </header>
  );
}
