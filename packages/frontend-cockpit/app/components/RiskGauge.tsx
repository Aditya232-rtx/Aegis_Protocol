"use client";
import { Progress } from "@/components/ui/progress"; // Ensure you have this installed via shadcn
import { useEffect, useState } from "react";
import riskData from "@/app/data/risk_simulation.json"; // Importing the JSON

export default function RiskGauge() {
  const [score, setScore] = useState(0);

  // Simulate "Loading" the data
  useEffect(() => {
    // We multiply by 100 because Progress bar uses 0-100, model uses 0.0-1.0
    const targetScore = riskData.currentRiskScore * 100;
    const timer = setTimeout(() => setScore(targetScore), 500);
    return () => clearTimeout(timer);
  }, []);

  // Determine Color Logic
  const getColor = (val: number) => {
    if (val < 50) return "bg-green-500"; // Safe
    if (val < 80) return "bg-yellow-500"; // Warning
    return "bg-red-600 animate-pulse";   // Critical (with pulse animation)
  };

  return (
    <div className="w-full p-6 border rounded-xl bg-slate-900 shadow-lg">
      <div className="flex justify-between mb-2">
        <h3 className="font-semibold text-slate-200">AI Risk Watchtower</h3>
        <span className={`font-bold ${score > 80 ? "text-red-500" : "text-green-500"}`}>
          {(score / 100).toFixed(2)} / 1.0
        </span>
      </div>

      {/* Custom Wrapper to handle the color injection */}
      <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${getColor(score)}`} 
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Status: <span className="text-white">{riskData.message}</span>
      </p>
    </div>
  );
}