import { Button } from "@/components/ui/button";
import { Shield, Menu, HelpCircle, BarChart } from "lucide-react";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  
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
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <div className="relative h-8 w-8 mr-3">
              <img src="/logo.png" alt="OBFUSCORE Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">OBFUS</span>
              <span className="text-white">CORE</span>
            </h1>
          </div>
        </Link>
      </div>
      
      <div className="hidden md:flex items-center space-x-6 mx-4">
        <Link href="/">
          <div className={`flex items-center space-x-1 cursor-pointer ${location === '/' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}>
            <span>Home</span>
          </div>
        </Link>
        <Link href="/stats">
          <div className={`flex items-center space-x-1 cursor-pointer ${location === '/stats' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}>
            <BarChart className="h-4 w-4 mr-1" />
            <span>Statistics</span>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <a 
          href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68608&scope=bot"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-md text-sm transition-colors">
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
