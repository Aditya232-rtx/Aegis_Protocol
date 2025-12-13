"use client";
import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, Shield } from "lucide-react";

interface CountdownTimerProps {
    userTier: "NEWBIE" | "ANCIENT_ONE" | "WHALE";
    onExpire: () => void;
}

export default function CountdownTimer({ userTier, onExpire }: CountdownTimerProps) {
    // Determine initial time based on tier
    // Ancient One = 15 mins (900s), Whale = 30 mins (1800s), Newbie = 0
    const getInitialTime = () => {
        if (userTier === "WHALE") return 1800;
        if (userTier === "ANCIENT_ONE") return 900;
        return 0;
    };

    const [timeLeft, setTimeLeft] = useState(getInitialTime());
    const [isActive, setIsActive] = useState(timeLeft > 0);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) {
            if (timeLeft === 0) onExpire();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeLeft, onExpire]);

    // Construct the minutes:seconds display
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (userTier === "NEWBIE") return null;

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-amber-950/20 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.1)] mb-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Reputation Grace Period</span>
            </div>

            <div className="text-6xl font-mono font-bold text-amber-500 tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                {formattedTime}
            </div>

            <div className="text-xs text-amber-500/60 uppercase tracking-wide mt-1 mb-4">
                until automatic position adjustment
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Shield className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase">
                    {userTier === "WHALE" ? "Whale Benefit: +30 min grace period applied" : "Ancient One Benefit: +15 min grace period applied"}
                </span>
            </div>
        </div>
    );
}
