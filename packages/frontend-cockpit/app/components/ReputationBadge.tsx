"use client";
import { useUser } from "@/app/context/UserContext";
import { ShieldCheck, User, UserCircle } from "lucide-react"; 
import { Badge } from "@/components/ui/badge"; 

export default function ReputationBadge() {
  const { badge, hasShield } = useUser();

  // Fix: Show a default state instead of returning null for NEWBIE
  const isGuest = badge === "NEWBIE";

  return (
    <div className="flex items-center gap-2 p-4 bg-slate-900 rounded-lg border border-slate-800">
      
      {/* 1. The Visual Icon */}
      {isGuest ? (
        <UserCircle className="text-slate-500 h-8 w-8" />
      ) : hasShield ? (
        <ShieldCheck className="text-green-400 h-8 w-8" />
      ) : (
        <User className="text-blue-400 h-8 w-8" />
      )}

      <div>
        {/* 2. Badge Name */}
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white">
            {isGuest ? "Guest User" : badge === "ANCIENT_ONE" ? "Ancient One" : "Whale Trader"}
          </h3>
          <Badge variant={hasShield ? "default" : "secondary"}>
            {hasShield ? "Protected" : "Standard"}
          </Badge>
        </div>

        {/* 3. The "Winning Condition" Text */}
        {hasShield ? (
          <p className="text-xs text-green-300 mt-1">
            Resilience Buffer Active: 15-min liquidation delay.
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-1">
            Connect wallet to view reputation score.
          </p>
        )}
      </div>
    </div>
  );
}