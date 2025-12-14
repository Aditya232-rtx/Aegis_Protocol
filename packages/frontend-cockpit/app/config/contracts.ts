// app/config/contracts.ts

// The address provided by Member C (Aditya)
export const BACKSTOP_POOL_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

// The Interface for the contract (Mocked for now, but ready for ethers.js)
export const BACKSTOP_POOL_ABI = [
  "function rescuePosition(address user) external",
  "function getRiskScore(address user) external view returns (uint256)"
];