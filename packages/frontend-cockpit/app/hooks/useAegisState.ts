// app/hooks/useAegisState.ts
import { useState } from 'react';

// Define the 3 system states based on your Figma designs
export type ThreatLevel = 'GREEN' | 'YELLOW' | 'RED';

export const useAegisState = () => {
  // Default to GREEN (Nominal) for now
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('GREEN');

  // This is the data Gadi (Member B) will eventually feed us
  // For now, it's just a mock number
  const [riskScore, setRiskScore] = useState<number>(0.23); // 0.23 = 23% (Green)

  // Helper to manually force state (for your Demo/Debug panel)
  const setManualThreatLevel = (level: ThreatLevel) => {
    setThreatLevel(level);

    // Auto-update risk score to match visual state for realism
    if (level === 'GREEN') setRiskScore(0.23);
    if (level === 'YELLOW') setRiskScore(0.67);
    if (level === 'RED') setRiskScore(0.94);
  };

  return {
    threatLevel,
    riskScore,
    setManualThreatLevel, // <--- Use this in your debug buttons
  };
};