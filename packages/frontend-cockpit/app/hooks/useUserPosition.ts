// Hook to fetch user position data from AegisLens
"use client";
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

export interface UserPosition {
    totalCollateralUSD: string;
    totalDebtUSD: string;
    availableBorrowsUSD: string;
    currentLiquidationThreshold: string;
    ltv: string;
    healthFactor: string;
    liquidationPrice: string;
    // Raw values for calculations
    healthFactorRaw: bigint;
    collateralETH: bigint;
    debtUSDC: bigint;
}

export interface UseUserPositionResult {
    position: UserPosition | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useUserPosition(
    walletAddress: string | null
): UseUserPositionResult {
    const contracts = useContracts(walletAddress);
    const [position, setPosition] = useState<UserPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPosition = useCallback(async () => {
        if (!contracts || !walletAddress) {
            setPosition(null);
            setLoading(false); // Ensure loading is false
            return;
        }

        setLoading(true);
        setError(null);

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.error('⏱️ useUserPosition: Request timed out after 10 seconds');
            setError('Request timed out. Please refresh the page.');
            setLoading(false);
        }, 10000);

        try {
            // Fetch raw collateral and debt first
            const collateralETH = await contracts.aegisPool.userCollateralETH(walletAddress);
            const debtUSDC = await contracts.aegisPool.userDebtUSDC(walletAddress);

            // Then fetch calculated position data from AegisLens
            const poolAddress = await contracts.aegisPool.getAddress();
            const userData = await contracts.aegisLens.getUserPosition(
                poolAddress,
                walletAddress
            );

            clearTimeout(timeoutId); // Clear timeout on success

            // Format the data
            const formatted: UserPosition = {
                totalCollateralUSD: ethers.formatUnits(userData.totalCollateralUSD, 18),
                totalDebtUSD: ethers.formatUnits(userData.totalDebtUSD, 18),
                availableBorrowsUSD: ethers.formatUnits(userData.availableBorrowsUSD, 18),
                currentLiquidationThreshold: userData.currentLiquidationThreshold.toString(),
                ltv: userData.ltv.toString(),
                healthFactor: ethers.formatUnits(userData.healthFactor, 18),
                liquidationPrice: ethers.formatUnits(userData.liquidationPrice, 18),
                // Store raw values
                healthFactorRaw: userData.healthFactor,
                collateralETH: collateralETH,
                debtUSDC: debtUSDC,
            };

            setPosition(formatted);
            setLoading(false);
        } catch (err: any) {
            clearTimeout(timeoutId); // Clear timeout on error
            console.error('Failed to fetch user position:', err);
            setError(err.message || 'Failed to fetch position');
            setLoading(false); // Ensure loading is set to false on error
        }
    }, [contracts, walletAddress]);

    // Auto-fetch on mount and when wallet changes
    useEffect(() => {
        fetchPosition();
    }, [fetchPosition]);

    return {
        position,
        loading,
        error,
        refresh: fetchPosition,
    };
}

// Helper to determine risk level from health factor
export function getRiskLevel(healthFactor: string): 'safe' | 'warning' | 'danger' {
    const hf = parseFloat(healthFactor);

    if (hf >= 1.5) return 'safe';
    if (hf >= 1.0) return 'warning';
    return 'danger';
}

// Helper to format USD values
export function formatUSD(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

// Helper to format ETH values
export function formatETH(value: string | bigint): string {
    const valueStr = typeof value === 'bigint' ? ethers.formatEther(value) : value;
    const num = parseFloat(valueStr);
    if (isNaN(num)) return '0.00 ETH';

    return `${num.toFixed(4)} ETH`;
}

// Helper to format health factor for display
export function formatHealthFactor(healthFactor: string): string {
    const hf = parseFloat(healthFactor);

    // If NaN or 0, return 0.0
    if (isNaN(hf) || hf === 0) return '0.0';

    // Clamp to 1.5 max as per user request
    if (hf > 1.5) return '1.5';

    // Otherwise format to 2 decimal places
    return hf.toFixed(2);
}
