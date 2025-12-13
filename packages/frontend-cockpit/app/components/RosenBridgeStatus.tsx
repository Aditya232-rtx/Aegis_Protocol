"use client";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import riskData from "@/app/data/risk_simulation.json";

export default function RosenBridgeStatus() {
  // Logic: If risk is > 0.8, the bridge activates automatically
  const isActive = riskData.currentRiskScore >= 0.8;

  return (
    <div className={`
      flex items-center gap-3 px-4 py-2 rounded-full border text-sm transition-all duration-500
      ${isActive 
        ? "bg-indigo-950 border-indigo-500 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
        : "bg-slate-900 border-slate-800 text-slate-500"}
    `}>
      <div className="relative">
        <ArrowRightLeft className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-600"}`} />
        {isActive && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        )}
      </div>

      <div className="flex flex-col leading-none">
        <span className="text-[10px] uppercase font-bold tracking-wider">Ergo Rosen Bridge</span>
        <span className="font-semibold">
          {isActive ? (
            <span className="flex items-center gap-2 text-indigo-300">
              Bridging Liquidity...
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          ) : (
            "Standby Mode"
          )}
        </span>
      </div>
    </div>
  );
}
