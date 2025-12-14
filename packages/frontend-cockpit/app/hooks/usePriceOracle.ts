// Dynamic price oracle based on ML sentinel risk scores
"use client";
import { useSentinel } from './useSentinel';

export function usePriceOracle() {
    const { data: sentinelData } = useSentinel();

    if (!sentinelData) {
        return {
            ethPrice: 2500,
            volatility: 0.05,
            priceChange24h: 0
        };
    }

    // Use ML-provided price if available, otherwise calculate from risk
    const basePrice = sentinelData.ethPrice || 2500;

    // Price decreases as risk increases (simulating market panic)
    // Risk 0.0 → Price stays at base
    // Risk 0.5 → Price drops 10%
    // Risk 0.8 → Price drops 25%
    // Risk 1.0 → Price drops 40%
    const riskImpact = sentinelData.riskScore * 0.4; // Max 40% drop
    const adjustedPrice = basePrice * (1 - riskImpact);

    return {
        ethPrice: Math.round(adjustedPrice),
        volatility: sentinelData.volatility,
        priceChange24h: sentinelData.change24h,
        riskScore: sentinelData.riskScore
    };
}
