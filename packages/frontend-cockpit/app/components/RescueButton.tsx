"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { useRescueTx } from "@/app/hooks/useRescueTx";
import riskData from "@/app/data/risk_simulation.json";

export default function RescueButton() {
  const { executeRescue, loading, success } = useRescueTx();

  // Phase 3 rule: Rescue only allowed if risk >= 0.8
  const isCritical = riskData.currentRiskScore >= 0.8;

  const handleClick = () => {
    if (!isCritical || loading) return;
    executeRescue();
  };

  // ✅ State 1: Success
  if (success) {
    return (
      <Button className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-bold cursor-default">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        Position Saved
      </Button>
    );
  }

  // ✅ State 2: Normal / Critical / Loading
  return (
    <div className="w-full mt-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-1 rounded-xl bg-gradient-to-r from-red-600 to-orange-600">
        <Button
          onClick={handleClick}
          disabled={!isCritical || loading}
          className={`
            w-full h-16 text-lg font-bold uppercase tracking-wider
            flex items-center justify-center gap-3
            ${isCritical
              ? "bg-slate-950 hover:bg-red-950/50 text-red-500 animate-pulse"
              : "bg-slate-900 text-slate-500 cursor-not-allowed opacity-60"}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Securing Assets…
            </>
          ) : (
            <>
              <Zap className="w-6 h-6 fill-current" />
              {isCritical ? "Activate Sponge Rescue" : "System Safe"}
              {isCritical && (
                <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20 normal-case">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Urgent
                </span>
              )}
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-slate-500 text-xs mt-3">
        Liquidity Source: <span className="text-slate-300">Backstop Pool</span>
      </p>
    </div>
  );
}
