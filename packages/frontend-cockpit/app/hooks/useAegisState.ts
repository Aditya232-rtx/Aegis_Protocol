// Hook to fetch Aegis Protocol risk state from ML sentinel
"use client";
import { useState, useCallback } from 'react';
import { useRiskMonitor } from './useRiskMonitor';
import { useUser } from '../context/UserContext';

export type ThreatLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface UseAegisStateResult {
  threatLevel: ThreatLevel;
  riskScore: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAegisState(): UseAegisStateResult {
  const { walletAddress } = useUser();
  const riskMonitor = useRiskMonitor(walletAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    // Refresh is handled by useSentinel polling
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  return {
    threatLevel: riskMonitor.threatLevel,
    riskScore: riskMonitor.systemRisk,
    loading,
    error,
    refresh
  };
}