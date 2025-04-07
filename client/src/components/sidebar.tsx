import { Code, HelpCircle, Sliders, Shield, LifeBuoy, Github } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside className={`w-64 bg-gray-700 p-4 flex flex-col fixed md:static h-screen z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out md:block`}>
      <div className="pb-4 mb-4 border-b border-gray-600">
        <h2 className="uppercase text-gray-400 text-xs font-semibold tracking-wider mb-2">Bot Commands</h2>
        <div className="py-1 px-2 rounded bg-gray-800 text-white flex items-center mb-2">
          <span className="text-indigo-400 mr-2">!</span>
          <span>obfuscate</span>
        </div>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center">
          <span className="text-indigo-400 mr-2">!</span>
          <span>help</span>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="uppercase text-gray-400 text-xs font-semibold tracking-wider mb-2">Settings</h2>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center mb-1">
          <Sliders className="mr-2 h-4 w-4" />
          <span>Obfuscation Options</span>
        </div>
        <div className="py-1 px-2 rounded hover:bg-gray-800 text-gray-400 flex items-center mb-1">
          <Shield className="mr-2 h-4 w-4" />
          <span>Privacy</span>
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
