// Enhanced hook to fetch real badge data from IdentityRegistry
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useContracts } from './useContracts';

export type UserBadge =
  | "NEWBIE"
  | "ANCIENT_ONE"
  | "WHALE"
  | "CLEAN_SHEET"
  | "DEFAULT";

export interface RiskParams {
  ltv: number;
  liquidationPenalty: number;
  gracePeriod: number;
}

export interface UseUnstoppableResult {
  badge: UserBadge;
  domainName: string | null;
  hasShield: boolean;
  riskParams: RiskParams | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Map contract badge string to UserBadge type
function mapBadge(badgeStr: string): UserBadge {
  const normalized = badgeStr.toLowerCase();

  if (normalized.includes('ancient')) return 'ANCIENT_ONE';
  if (normalized.includes('whale')) return 'WHALE';
  if (normalized.includes('clean')) return 'CLEAN_SHEET';
  if (normalized === 'default') return 'DEFAULT';

  return 'NEWBIE';
}

// Determine if user has shield (grace period > 0)
function hasGracePeriod(gracePeriod: number): boolean {
  return gracePeriod > 0;
}

export function useUnstoppable(
  walletAddress: string | null
): UseUnstoppableResult {
  const contracts = useContracts(walletAddress);
  const [badge, setBadge] = useState<UserBadge>('NEWBIE');
  const [domainName, setDomainName] = useState<string | null>('Guest');
  const [hasShield, setHasShield] = useState(false);
  const [riskParams, setRiskParams] = useState<RiskParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentity = useCallback(async () => {
    if (!contracts || !walletAddress) {
      setBadge('NEWBIE');
      setDomainName('Guest');
      setHasShield(false);
      setRiskParams(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch risk parameters from IdentityRegistry
      const params = await contracts.identityRegistry.getRiskParameters(walletAddress);

      // Try to get domain name (reverse resolution)
      let domain = 'Guest';
      try {
        const reverseName = await contracts.identityRegistry.reverseNameOf(walletAddress);
        if (reverseName && reverseName !== '') {
          domain = reverseName;
        }
      } catch (err) {
        // Reverse name not found, keep as Guest
        console.log('No domain name found, using Guest');
      }

      // Get badge from mock registry
      let badgeStr = 'Default';
      try {
        // MockIdentityRegistry has getBadge function
        const contractBadge = await contracts.identityRegistry.getBadge(walletAddress);
        if (contractBadge && contractBadge !== '') {
          badgeStr = contractBadge;
        }
      } catch (err) {
        console.log('No badge found, using Default');
      }

      const userBadge = mapBadge(badgeStr);
      const gracePeriod = Number(params.gracePeriod);

      setBadge(userBadge);
      setDomainName(domain);
      setHasShield(hasGracePeriod(gracePeriod));
      setRiskParams({
        ltv: Number(params.ltv),
        liquidationPenalty: Number(params.liquidationPenalty),
        gracePeriod: gracePeriod,
      });
    } catch (err: any) {
      console.error('Failed to fetch identity:', err);
      setError(err.message || 'Failed to fetch identity data');

      // Set defaults on error
      setBadge('NEWBIE');
      setDomainName('Guest');
      setHasShield(false);
    } finally {
      setLoading(false);
    }
  }, [contracts, walletAddress]);

  // Auto-fetch on mount and when wallet changes
  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  return {
    badge,
    domainName,
    hasShield,
    riskParams,
    loading,
    error,
    refresh: fetchIdentity,
  };
}