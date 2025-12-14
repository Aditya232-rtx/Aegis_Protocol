"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NetworkBackground from "@/app/components/NetworkBackground";
import Header from "@/app/components/aegis/Header";
import RiskGauge from "@/app/components/aegis/RiskGauge";
import AssetCard from "@/app/components/aegis/AssetCard";
import MarketConditions from "@/app/components/aegis/MarketConditions";
import CollateralList from "@/app/components/aegis/CollateralList";
import FooterDock from "@/app/components/aegis/FooterDock";
import { Wallet, Activity, TrendingUp, Lock } from "lucide-react";
import CountdownTimer from "@/app/components/aegis/CountdownTimer";

// Import blockchain hooks
import { useUser } from "@/app/context/UserContext";
import { useAegisState } from "@/app/hooks/useAegisState";
import { useUserPosition, formatUSD, formatETH, getRiskLevel, formatHealthFactor } from "@/app/hooks/useUserPosition";
import { useRescueTx } from "@/app/hooks/useRescueTx";

export default function DashboardPage() {
    const router = useRouter();
    const { walletAddress, badge, hasShield, isConnected } = useUser();
    const { threatLevel, riskScore } = useAegisState();
    const { position, loading, refresh } = useUserPosition(walletAddress);

    // Connect Rescue Hook
    const { triggerRescue, state: rescueState } = useRescueTx(walletAddress, refresh);

    const [isDemoMode, setIsDemoMode] = useState(false);
    const [gracePeriodExpired, setGracePeriodExpired] = useState(false);

    // Allow viewing dashboard with demo data even without wallet
    // Redirect disabled to show example interface
    // useEffect(() => {
    //     if (!isConnected && !walletAddress) {
    //         console.log("⚠️ No wallet connected, redirecting to landing page...");
    //         router.push("/");
    //     }
    // }, [isConnected, walletAddress, router]);

    // Show demo data if wallet not connected
    // (Users can still connect wallet to see their real data)

    // Map ThreatLevel to risk state for UI
    const riskState = React.useMemo(() => {
        switch (threatLevel) {
            case 'RED': return 'danger';
            case 'YELLOW': return 'warning';
            default: return 'safe';
        }
    }, [threatLevel]);

    const isCritical = riskState === "danger";
    const isWarning = riskState === "warning";

    // Use real data from blockchain or show empty state
    const displayData = loading ? {
        collateral: "Loading...",
        debt: "Loading...",
        health: "...",
        healthColor: "text-slate-500",
        borrowable: "Loading...",
        borrowSubtitle: "Fetching data...",
        riskScore: Math.round(riskScore * 100),
        liquidationPrice: "...",
    } : position ? {
        collateral: formatUSD(position.totalCollateralUSD),
        debt: formatUSD(position.totalDebtUSD),
        health: formatHealthFactor(position.healthFactor),
        healthColor: getRiskLevel(position.healthFactor) === 'safe'
            ? "text-emerald-400"
            : getRiskLevel(position.healthFactor) === 'warning'
                ? "text-amber-500"
                : "text-red-500",
        borrowable: formatUSD(position.availableBorrowsUSD),
        borrowSubtitle: isCritical
            ? "Borrowing disabled"
            : isWarning
                ? "Borrowing disabled during elevated risk"
                : "At current rates",
        riskScore: Math.round(riskScore * 100),
        liquidationPrice: formatUSD(position.liquidationPrice),
    } : {
        // Empty state when wallet not connected
        collateral: "$0.00",
        debt: "$0.00",
        health: "---",
        healthColor: "text-slate-500",
        borrowable: "$0.00",
        borrowSubtitle: "Connect wallet to view",
        riskScore: Math.round(riskScore * 100),
        liquidationPrice: "$0.00",
    };

    // Refresh data periodically
    useEffect(() => {
        if (!walletAddress) return;

        const interval = setInterval(() => {
            refresh();
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [walletAddress, refresh]);

    // Map badge to tier for CountdownTimer
    const userTier = badge === "ANCIENT_ONE" ? "ANCIENT_ONE" :
        badge === "WHALE" ? "WHALE" :
            "NEWBIE";

    return (
        <main className={`min-h-screen ${isCritical ? "bg-[#1a0505]" : "bg-[#020817]"} text-white relative overflow-x-hidden selection:bg-red-500/30 font-sans transition-colors duration-1000`}>
            {/* Background overlay for critical state */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isCritical ? "opacity-20 bg-red-900/20 mix-blend-overlay" : "opacity-0"}`} />
            <NetworkBackground />

            <Header
                isDemoMode={isDemoMode}
                onToggleDemo={() => setIsDemoMode(!isDemoMode)}
                variant={riskState}
            />

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto p-6 relative z-10 space-y-6 pb-24">

                {/* Hero: Countdown Timer (Warning Mode Only) */}
                {isWarning && hasShield && (
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
                        <RiskGauge score={displayData.riskScore} variant={riskState} />
                    </div>

                    {/* Right Column: Asset Grid (3 Columns) */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Row 1, Card 1 */}
                        <AssetCard
                            icon={Wallet}
                            label="Total Collateral"
                            value={displayData.collateral}
                            subtitle={position ? `${formatETH(position.collateralETH)}` : "No deposits"}
                            iconColor={isCritical ? "text-red-400" : isWarning ? "text-amber-500" : "text-emerald-400"}
                        />
                        {/* Row 1, Card 2 */}
                        <AssetCard
                            icon={Activity}
                            label="Current Debt"
                            value={displayData.debt}
                            subtitle="USDC borrowed"
                            iconColor={isCritical ? "text-red-400" : isWarning ? "text-amber-500" : "text-cyan-400"}
                        />
                        {/* Row 1, Card 3 */}
                        <AssetCard
                            icon={TrendingUp}
                            label="Health Factor"
                            value={displayData.health}
                            subtitle={isCritical ? "Liquidation Imminent" : isWarning ? "Approaching Liquidation" : "Safe Zone > 1.5"}
                            trend={isCritical ? "-0.31" : isWarning ? "-0.24" : "+0.12"}
                            trendPositive={!isCritical && !isWarning}
                            iconColor={displayData.healthColor}
                        />

                        {/* Row 2, Card 1 */}
                        <AssetCard
                            icon={isCritical || isWarning ? Lock : TrendingUp}
                            label="Available to Borrow"
                            value={displayData.borrowable}
                            subtitle={displayData.borrowSubtitle}
                            iconColor={isCritical ? "text-slate-500" : isWarning ? "text-amber-500" : "text-emerald-400"}
                        />
                        {/* Row 2, Card 2 */}
                        <AssetCard
                            icon={Lock}
                            label="Liquidation Price"
                            value={displayData.liquidationPrice}
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
                onTransactionSuccess={refresh}
                onRescue={triggerRescue}
            />
        </main>
    );
}
