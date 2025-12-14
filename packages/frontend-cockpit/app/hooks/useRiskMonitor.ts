// Risk monitoring hook - determines system state based on ML sentinel + blockchain data
"use client";
import { useSentinel } from './useSentinel';
import { useUserPosition } from './useUserPosition';
import { usePriceOracle } from './usePriceOracle';

export type ThreatLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface RiskMonitorData {
    riskScore: number;          // 0-1 scale (from ML)
    threatLevel: ThreatLevel;   // System state
    healthFactor: number;       // User's health factor
    priceImpact: number;        // ETH price change impact
    systemRisk: number;         // Combined risk score
}

export function useRiskMonitor(walletAddress: string | null) {
    const { data: sentinelData } = useSentinel();
    const { position } = useUserPosition(walletAddress);
    const { ethPrice } = usePriceOracle();

    // Calculate combined risk score
    const calculateSystemRisk = (): number => {
        if (!sentinelData) return 0;

        // ML risk score is primary signal
        const mlRisk = sentinelData.riskScore;

        // Add user-specific risk if position exists
        if (position) {
            const hf = parseFloat(position.healthFactor);

            // User risk increases as health factor decreases
            const userRisk = hf < 1.5 ? (1.5 - hf) / 1.5 : 0;

            // Combined: 70% ML, 30% user position
            return mlRisk * 0.7 + userRisk * 0.3;
        }

        return mlRisk;
    };

    // Determine threat level based on risk score
    const getThreatLevel = (risk: number): ThreatLevel => {
        if (risk > 0.8) return 'RED';       // Critical (> 80%)
        if (risk >= 0.5) return 'YELLOW';   // Elevated (50% - 80%)
        return 'GREEN';                      // Normal (< 50%)
    };

    const systemRisk = calculateSystemRisk();

    // Threat level should reflect the SYSTEM state (ML Sentinel), not personal risk
    const threatLevel = getThreatLevel(sentinelData?.riskScore || 0);

    // Price impact (how much ETH has dropped from baseline)
    const baselinePrice = 2500;
    const priceImpact = ((baselinePrice - ethPrice) / baselinePrice) * 100;

    return {
        riskScore: sentinelData?.riskScore || 0,
        threatLevel,
        healthFactor: position ? parseFloat(position.healthFactor) : Infinity,
        priceImpact,
        systemRisk
    };
}
