import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import CommandUsage from "@/components/commandUsage";
import CommandSimulation from "@/components/commandSimulation";
import DmExample from "@/components/dmExample";
import TryItYourself from "@/components/tryItYourself";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-discord-bg text-white">
      <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex flex-grow">
        <Sidebar isOpen={mobileMenuOpen} />

        <main className="flex-grow p-6">
          <CommandUsage />
          <CommandSimulation />
          <DmExample />
          <TryItYourself />
        </main>
      </div>
    </div>
  );
}
