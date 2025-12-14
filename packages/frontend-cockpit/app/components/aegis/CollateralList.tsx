"use client";
import React from "react";
import { useUser } from "@/app/context/UserContext";
import { useContracts } from "@/app/hooks/useContracts";
import { usePriceOracle } from "@/app/hooks/usePriceOracle";
import { ethers } from "ethers";

interface CollateralListProps {
    isCritical?: boolean;
    isWarning?: boolean;
}

interface CollateralAsset {
    symbol: string;
    name: string;
    value: string;
    balance: string;
    percent: number;
}

export default function CollateralList({ isCritical = false, isWarning = false }: CollateralListProps) {
    const { walletAddress } = useUser();
    const contracts = useContracts(walletAddress);
    const { ethPrice } = usePriceOracle();
    const [assets, setAssets] = React.useState<CollateralAsset[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchCollateral() {
            // If no wallet, show nothing
            if (!contracts || !walletAddress) {
                setAssets([]);
                setLoading(false);
                return;
            }

            try {
                // Get user's ETH collateral
                const collateralETH = await contracts.aegisPool.userCollateralETH(walletAddress);

                if (collateralETH === BigInt(0)) {
                    setAssets([]);
                    setLoading(false);
                    return;
                }

                // Use dynamic price from ML oracle
                const collateralUSD = Number(ethers.formatEther(collateralETH)) * ethPrice;

                const ethAsset: CollateralAsset = {
                    symbol: "ETH",
                    name: "Ethereum",
                    value: `$${collateralUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    balance: `${ethers.formatEther(collateralETH)} ETH`,
                    percent: 100, // 100% since we only have ETH
                };

                setAssets([ethAsset]);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch collateral:", error);
                setAssets([]);
                setLoading(false);
            }
        }

        fetchCollateral();

        // Refresh every 10 seconds
        const interval = setInterval(fetchCollateral, 10000);
        return () => clearInterval(interval);
    }, [contracts, walletAddress]);

    if (loading) {
        return (
            <div className={`p-6 bg-slate-900/50 backdrop-blur-md border ${isCritical ? "border-red-900/30" : isWarning ? "border-amber-500/30" : "border-slate-800"} rounded-2xl h-full`}>
                <h3 className={`text-xs font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-slate-500"} uppercase tracking-widest mb-6`}>
                    Collateral Breakdown
                </h3>
                <div className="text-slate-500 text-sm">Loading...</div>
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className={`p-6 bg-slate-900/50 backdrop-blur-md border ${isCritical ? "border-red-900/30" : isWarning ? "border-amber-500/30" : "border-slate-800"} rounded-2xl h-full`}>
                <h3 className={`text-xs font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-slate-500"} uppercase tracking-widest mb-6`}>
                    Collateral Breakdown
                </h3>
                <div className="text-slate-500 text-sm">No collateral deposited</div>
            </div>
        );
    }

    return (
        <div className={`p-6 bg-slate-900/50 backdrop-blur-md border ${isCritical ? "border-red-900/30 shadow-[0_0_20px_rgba(220,38,38,0.1)]" : isWarning ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "border-slate-800"} rounded-2xl h-full transition-all duration-500`}>
            <h3 className={`text-xs font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-slate-500"} uppercase tracking-widest mb-6`}>
                Collateral Breakdown
            </h3>

            <div className="space-y-6">
                {assets.map((asset) => (
                    <div key={asset.symbol}>
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${isCritical ? "bg-red-900/20 border-red-500/30 text-red-500" : isWarning ? "bg-amber-900/20 border-amber-500/30 text-amber-500" : "bg-slate-800 border-slate-700 text-white"} border flex items-center justify-center text-[10px] font-bold`}>
                                    {asset.symbol.slice(0, 2)}
                                </div>
                                <span className={`font-bold ${isCritical ? "text-red-100" : isWarning ? "text-amber-100" : "text-white"} text-sm`}>{asset.symbol}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-sm text-slate-300">{asset.value}</div>
                                <div className="font-mono text-[10px] text-slate-500">{asset.balance}</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${isCritical ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" : isWarning ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-emerald-500"} rounded-full transition-all duration-1000`}
                                style={{ width: `${asset.percent}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
