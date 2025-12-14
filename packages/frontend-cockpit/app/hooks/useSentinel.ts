// Hook to read ML sentinel live feed
"use client";
import { useState, useEffect } from 'react';

export interface SentinelData {
    riskScore: number;        // 0-1 scale
    change24h: number;
    liquidityHealth: number;
    timestamp: string;
    status: 'normal' | 'warning' | 'critical';
    ethPrice: number;
    volatility: number;
    marketDepth: {
        bidLiquidity: number;
        askLiquidity: number;
        spread: number;
    };
}

export function useSentinel() {
    const [data, setData] = useState<SentinelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSentinelData() {
            try {
                // Add timestamp to prevent caching
                const response = await fetch(`/live_feed.json?t=${new Date().getTime()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch sentinel data');
                }
                const jsonData = await response.json();
                setData(jsonData);
                setError(null);
            } catch (err: any) {
                console.error('Sentinel data fetch error:', err);
                setError(err.message);
                // Fallback to safe defaults
                setData({
                    riskScore: 0.15,
                    change24h: 0,
                    liquidityHealth: 0.98,
                    timestamp: new Date().toISOString(),
                    status: 'normal',
                    ethPrice: 2500,
                    volatility: 0.05,
                    marketDepth: {
                        bidLiquidity: 1500000,
                        askLiquidity: 1450000,
                        spread: 0.002
                    }
                });
            } finally {
                setLoading(false);
            }
        }

        // Initial fetch
        fetchSentinelData();

        // Poll every 5 seconds
        const interval = setInterval(fetchSentinelData, 5000);

        return () => clearInterval(interval);
    }, []);

    return { data, loading, error };
}
