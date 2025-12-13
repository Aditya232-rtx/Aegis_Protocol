// app/components/TrafficLight.tsx
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react'; 
import { ThreatLevel } from '../hooks/useAegisState';

interface TrafficLightProps {
  level: ThreatLevel;
}

export const TrafficLight = ({ level }: TrafficLightProps) => {
  // State 0: Green (Nominal)
  if (level === 'GREEN') {
    return (
      <div className="w-full p-4 rounded-lg bg-slate-900/50 border border-emerald-500/20 flex items-center justify-center gap-3 transition-all duration-500">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-emerald-500 font-mono tracking-widest text-sm uppercase">
          Threat Level: All Systems Nominal
        </span>
      </div>
    );
  }

  // State 1: Yellow (Elevated Risk)
  if (level === 'YELLOW') {
    return (
      <div className="w-full p-4 rounded-lg bg-yellow-950/30 border border-yellow-500/50 flex items-center justify-center gap-3 transition-all duration-500">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <span className="text-yellow-500 font-bold font-mono tracking-widest text-sm uppercase">
          Threat Level: Elevated Risk Detected
        </span>
      </div>
    );
  }

  // State 2: Red (Critical Breach)
  return (
    <div className="w-full p-4 rounded-lg bg-red-950/50 border border-red-500 animate-pulse flex items-center justify-center gap-3 transition-all duration-500">
      <Zap className="w-5 h-5 text-red-500" />
      <span className="text-red-500 font-extrabold font-mono tracking-widest text-sm uppercase">
        Threat Level: Critical Threshold Breach
      </span>
    </div>
  );
};