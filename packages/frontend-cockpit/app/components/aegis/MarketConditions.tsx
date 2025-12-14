"use client";
import React from "react";
import { BarChart3, HelpCircle } from "lucide-react";

interface MarketConditionsProps {
    isCritical?: boolean;
    isWarning?: boolean;
}

export default function MarketConditions({ isCritical = false, isWarning = false }: MarketConditionsProps) {
    return (
        <div className={`p-6 bg-slate-900/50 backdrop-blur-md border ${isCritical ? "border-red-900/30 shadow-[0_0_20px_rgba(220,38,38,0.1)]" : isWarning ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "border-slate-800"} rounded-2xl h-full transition-all duration-500`}>
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className={`h-4 w-4 ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-slate-500"}`} />
                <h3 className={`text-xs font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-slate-500"} uppercase tracking-widest`}>
                    Market Conditions
                </h3>
            </div>

            {/* INTEGRATION POINT (Member B): Ingest Real-time CEX Orderbook Data (Binance/Coinbase). */}

            <div className="grid grid-cols-2 gap-y-6">
                {/* Metric 1 */}
                <div>
                    <span className="text-xs text-slate-500 block mb-1">ETH Price</span>
                    <div className={`text-xl font-mono font-bold ${isCritical ? "text-red-50 animate-pulse" : isWarning ? "text-amber-50" : "text-white"}`}>
                        $3,247.82
                    </div>
                </div>

                {/* Metric 2 */}
                <div>
                    <span className="text-xs text-slate-500 block mb-1">24h Change</span>
                    <div className={`text-xl font-mono font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-400"}`}>
                        {isCritical ? "-12.4%" : isWarning ? "+0.8%" : "+2.34%"}
                    </div>
                </div>

                {/* Metric 3 */}
                <div>
                    <span className="text-xs text-slate-500 block mb-1">Volatility Index</span>
                    <div className={`text-xl font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-white"}`}>
                        {isCritical ? "Extreme" : isWarning ? "High" : "Low"}
                    </div>
                </div>

                {/* Metric 4 */}
                <div>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-slate-500">Liquidity Health (BLR)</span>
                        <HelpCircle className="h-3 w-3 text-slate-600" />
                    </div>
                    <div className={`text-xl font-mono font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-400"}`}>
                        {isCritical ? "18%" : isWarning ? "42%" : "78%"}
                    </div>
                </div>
            </div>
        </div>
    );
}
