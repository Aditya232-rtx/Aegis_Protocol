"use client";
import React, { useState } from "react";
import NetworkBackground from "@/app/components/NetworkBackground";
import Header from "@/app/components/aegis/Header";
import RiskGauge from "@/app/components/aegis/RiskGauge";
import AssetCard from "@/app/components/aegis/AssetCard";
import MarketConditions from "@/app/components/aegis/MarketConditions";
import CollateralList from "@/app/components/aegis/CollateralList";
import FooterDock from "@/app/components/aegis/FooterDock";
import { Wallet, Activity, TrendingUp, Lock } from "lucide-react";

import CountdownTimer from "@/app/components/aegis/CountdownTimer";

export default function DashboardPage() {
    const [isDemoMode, setIsDemoMode] = useState(true);
    const [riskState, setRiskState] = useState<"safe" | "warning" | "danger">("safe");
    const [gracePeriodExpired, setGracePeriodExpired] = useState(false);

    // Quick Tier Mock for Demo - In real app, comes from useUser()
    const userTier = "ANCIENT_ONE";

    // Toggle Sequence: Safe -> Warning -> Danger -> Safe
    const toggleRisk = () => {
        setRiskState(prev => {
            if (prev === "safe") return "warning";
            if (prev === "warning") return "danger";
            return "safe";
        });
        // Reset grace period on toggle
        setGracePeriodExpired(false);
    };

    // Data mocks based on State
    const data = {
        safe: {
            collateral: "$1,247,832",
            debt: "$312,458",
            health: "3.99",
            healthColor: "text-emerald-400",
            borrowable: "$523,891",
            borrowSubtitle: "At current rates",
            riskScore: 23
        },
        warning: { // Elevated Risk
            collateral: "$847,291",
            debt: "$612,458",
            health: "1.38",
            healthColor: "text-amber-500", // Warning Amber
            borrowable: "Paused",
            borrowSubtitle: "Borrowing disabled during elevated risk",
            riskScore: 67
        },
        danger: {
            collateral: "$312,104",
            debt: "$298,459",
            health: "1.04",
            healthColor: "text-red-500",
            borrowable: "$0",
            borrowSubtitle: "Borrowing disabled",
            riskScore: 94
        }
    };

    const currentData = data[riskState];
    const isCritical = riskState === "danger";
    const isWarning = riskState === "warning";

    return (
        <main className={`min-h-screen ${isCritical ? "bg-[#1a0505]" : "bg-[#020817]"} text-white relative overflow-x-hidden selection:bg-red-500/30 font-sans transition-colors duration-1000`}>
            {/* Background handles its own redness if needed, or we use CSS filters */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isCritical ? "opacity-20 bg-red-900/20 mix-blend-overlay" : "opacity-0"}`} />
            <NetworkBackground />

            <Header
                isDemoMode={isDemoMode}
                onToggleDemo={toggleRisk}
                variant={riskState}
            />

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto p-6 relative z-10 space-y-6 pb-24">

                {/* Hero: Countdown Timer (Warning Mode Only) */}
                {isWarning && (
                    <div className="flex justify-center">
                        <CountdownTimer
                            userTier={userTier}
                            onExpire={() => setGracePeriodExpired(true)}
                        />
                    </div>
                )}

                {/* Top Row Wrapper */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Left Column: The Watchtower (Risk Gauge) */}
                    <div className="lg:col-span-1 h-full min-h-[350px]">
                        <RiskGauge score={currentData.riskScore} variant={riskState} />
                    </div>

                    {/* Right Column: Asset Grid (3 Columns) */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Row 1, Card 1 */}
                        <AssetCard
                            icon={Wallet}
                            label="Total Collateral"
                            value={currentData.collateral}
                            subtitle="Across 4 assets"
                            iconColor={isCritical ? "text-red-400" : isWarning ? "text-amber-500" : "text-emerald-400"}
                        />
                        {/* Row 1, Card 2 */}
                        <AssetCard
                            icon={Activity}
                            label="Current Debt"
                            value={currentData.debt}
                            subtitle="USDC borrowed"
                            iconColor={isCritical ? "text-red-400" : isWarning ? "text-amber-500" : "text-cyan-400"}
                        />
                        {/* Row 1, Card 3 */}
                        <AssetCard
                            icon={TrendingUp}
                            label="Health Factor"
                            value={currentData.health}
                            subtitle={isCritical ? "Liquidation Imminent" : isWarning ? "Approaching Liquidation" : "Safe Zone > 1.5"}
                            trend={isCritical ? "-0.31" : isWarning ? "-0.24" : "+0.12"}
                            trendPositive={!isCritical && !isWarning}
                            iconColor={currentData.healthColor}
                        />

                        {/* Row 2, Card 1 */}
                        <AssetCard
                            icon={isCritical || isWarning ? Lock : TrendingUp}
                            label="Available to Borrow"
                            value={currentData.borrowable}
                            subtitle={currentData.borrowSubtitle}
                            iconColor={isCritical ? "text-slate-500" : isWarning ? "text-amber-500" : "text-emerald-400"}
                        />
                        {/* Row 2, Card 2 */}
                        <AssetCard
                            icon={Lock}
                            label="Liquidation Price"
                            value="$2,847.00"
                            subtitle="ETH/USD threshold"
                            iconColor={isCritical ? "text-red-400" : isWarning ? "text-amber-500" : "text-indigo-400"}
                        />
                    </div>
                </div>

                {/* Bottom Row: Market & Collateral */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
                    <MarketConditions isCritical={isCritical} isWarning={isWarning} />
                    <CollateralList isCritical={isCritical} isWarning={isWarning} />
                </div>

            </div>

            <FooterDock
                isCritical={isCritical}
                isWarning={isWarning}
                gracePeriodExpired={gracePeriodExpired}
                userTier={userTier}
            />
        </main>
    );
}
