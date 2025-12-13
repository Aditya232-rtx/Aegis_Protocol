// app/hooks/useUnstoppable.ts
import { useState } from 'react';

// Mock data for Phase 1
const MOCK_USER = {
  domain: "satoshi.crypto",
  badges: ["ANCIENT ONE"], // The specific badge from your Figma
  walletAddress: "0x123...abc"
};

export const useUnstoppable = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<typeof MOCK_USER | null>(null);

  const connect = async () => {
    // TODO (Member A): Connect to UAuth/Unstoppable Domains SDK here
    // For now, we mock the login for the UI build
    setIsConnected(true);
    setUser(MOCK_USER);
  };

  return {
    isConnected,
    user,
    connect,
    // Helper to check for the shield badge
    hasAncientBadge: user?.badges.includes("ANCIENT ONE") ?? false
  };
};