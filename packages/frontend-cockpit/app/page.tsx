"use client";
import { useState } from "react";
import Link from "next/link";
import NetworkBackground from "@/app/components/NetworkBackground";
import { ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/UserContext";

export default function LandingPage() {
  const { connectWallet } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    await connectWallet();
    // We stay loading until the redirect happens or fails
    setTimeout(() => setIsLoading(false), 5000); // Safety timeout
  };

  return (
    <main className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center relative overflow-hidden">
      <NetworkBackground />

      <div className="z-10 text-center space-y-8 max-w-4xl px-6">
        {/* Badge / Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-medium text-teal-300 tracking-wider uppercase">
            Open Source • Community Driven
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white">
          Aegis Protocol: <br />
          <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Civilized DeFi.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          An Open-Source approach to Operational Resilience & Reputation-Based Risk.
          Transparent, accessible, and educational by design.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 pt-8">
          <Button
            size="lg"
            onClick={handleConnect}
            disabled={isLoading}
            className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black border-0 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all duration-300 hover:scale-105"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Connecting..." : "Connect Wallet to Continue"}
          </Button>

          <p className="text-sm text-slate-400 pt-2">
            🔒 Wallet connection required to access the dashboard
          </p>
        </div>

        <p className="text-xs text-slate-500 pt-4 opacity-60">
          Connect your MetaMask wallet to view your position and interact with the protocol
        </p>
      </div>
    </main>
  );
}
