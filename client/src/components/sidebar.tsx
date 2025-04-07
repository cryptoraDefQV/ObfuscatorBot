import { Code, HelpCircle, Sliders, Shield, LifeBuoy, Github, Lock, FileCode, Home, BarChart } from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  return (
    <aside className={`w-64 bg-gray-700 p-4 flex flex-col fixed md:static h-screen z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out md:block`}>
      <div className="mb-6 flex flex-col items-center">
        <div className="w-16 h-16 mb-2">
          <img src="/logo.png" alt="OBFUSCORE Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-lg font-bold">
          <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">OBFUS</span>
          <span className="text-white">CORE</span>
        </h2>
        <p className="text-xs text-gray-400 text-center mt-1">Lua Code Protection</p>
      </div>
      
      <div className="pb-4 mb-4 border-b border-gray-600">
        <h2 className="uppercase text-gray-400 text-xs font-semibold tracking-wider mb-2">Navigation</h2>
        <Link href="/">
          <div className={`py-1 px-2 rounded flex items-center mb-2 cursor-pointer ${location === '/' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </div>
        </Link>
        <Link href="/stats">
          <div className={`py-1 px-2 rounded flex items-center mb-2 cursor-pointer ${location === '/stats' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}>
            <BarChart className="mr-2 h-4 w-4" />
            <span>Statistics</span>
          </div>
        </Link>
      </div>
      
      <div className="pb-4 mb-4 border-b border-gray-600">
        <h2 className="uppercase text-gray-400 text-xs font-semibold tracking-wider mb-2">Bot Commands</h2>
        <div className="py-1 px-2 rounded bg-gray-800 text-white flex items-center mb-2">
          <span className="text-blue-400 mr-2">!</span>
          <span>obfuscate</span>
        </div>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center">
          <span className="text-blue-400 mr-2">!</span>
          <span>help</span>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="uppercase text-gray-400 text-xs font-semibold tracking-wider mb-2">Protection Levels</h2>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center mb-1">
          <FileCode className="mr-2 h-4 w-4" />
          <span>Light (Minify)</span>
        </div>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center mb-1">
          <Shield className="mr-2 h-4 w-4" />
          <span>Medium (Default)</span>
        </div>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center mb-1">
          <Lock className="mr-2 h-4 w-4" />
          <span>Heavy (Maximum)</span>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-600">
        <h2 className="uppercase text-gray-400 text-xs font-semibold tracking-wider mb-2">Support</h2>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center mb-1">
          <LifeBuoy className="mr-2 h-4 w-4" />
          <span>Get Help</span>
        </div>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center">
          <Github className="mr-2 h-4 w-4" />
          <span>GitHub</span>
        </div>
      </div>
    </aside>
  );
}
