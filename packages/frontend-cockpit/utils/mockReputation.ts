// app/utils/mockReputation.ts

export type UserBadge = "ANCIENT_ONE" | "WHALE" | "NEWBIE";

interface UserProfile {
  badge: UserBadge;
  creationDate: string;
  assetValue: string;
  resilienceBuffer: boolean; // This is the shield logic
}

// 1. We hardcode specific wallets to specific roles for the demo
const MOCK_DATABASE: Record<string, UserProfile> = {
  // Scenario A: The "Ancient One" (Your main demo wallet)
  "0x123...": { 
    badge: "ANCIENT_ONE",
    creationDate: "2019-01-01",
    assetValue: "$50,000",
    resilienceBuffer: true, // 15 min grace period active
  },
  // Scenario B: A rich user (Whale)
  "0x456...": {
    badge: "WHALE",
    creationDate: "2023-05-20",
    assetValue: "$1,500,000",
    resilienceBuffer: false,
  },
};

// 2. The function that "fetches" the data
export const getMockReputation = (walletAddress: string): UserProfile => {
  // Normalize address to lowercase for matching
  const key = Object.keys(MOCK_DATABASE).find(
    (k) => k.toLowerCase() === walletAddress.toLowerCase()
  );

  if (key) {
    return MOCK_DATABASE[key];
  }

  // Default fallback for any other wallet (The "Newbie")
  return {
    badge: "NEWBIE",
    creationDate: "2024-01-01",
    assetValue: "$0",
    resilienceBuffer: false,
  };
};