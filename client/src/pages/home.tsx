import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import CommandUsage from "@/components/commandUsage";
import CommandSimulation from "@/components/commandSimulation";
import DmExample from "@/components/dmExample";
import TryItYourself from "@/components/tryItYourself";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Lock, ArrowRight } from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-discord-bg text-white">
      <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex flex-grow">
        <Sidebar isOpen={mobileMenuOpen} />

        <main className="flex-grow">
          {/* Hero Banner */}
          <div className="relative mb-6">
            <div className="w-full h-64 overflow-hidden">
              <img 
                src="/banner.png" 
                alt="OBFUSCORE Banner" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black bg-opacity-40">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">OBFUS</span>
                <span className="text-white">CORE</span>
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mb-6">
                Powerful Lua code protection with multiple security levels, 
                designed to help developers shield their code from unauthorized access.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68608&scope=bot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm md:text-base transition-colors flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Add To Discord
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <a href="#try-it-yourself">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 px-6 py-2 rounded-md text-sm md:text-base transition-colors flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Try It Now
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div className="p-6">
            <CommandUsage />
            <CommandSimulation />
            <DmExample />
            <div id="try-it-yourself">
              <TryItYourself />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
