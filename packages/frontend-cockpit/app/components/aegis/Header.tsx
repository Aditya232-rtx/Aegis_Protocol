"use client";
import React from "react";
import { Settings, ShieldCheck, User } from "lucide-react";
import { useUser } from "@/app/context/UserContext";

interface HeaderProps {
    isDemoMode: boolean;
    onToggleDemo?: () => void;
    variant?: "safe" | "danger" | "warning";
}

export default function Header({ isDemoMode, onToggleDemo, variant = "safe" }: HeaderProps) {
    const { badge } = useUser();
    const isCritical = variant === "danger";
    const isWarning = variant === "warning";

    return (
        <header className="w-full h-20 border-b border-slate-800 bg-[#020817]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                    <ShieldCheck className="text-teal-400 h-6 w-6" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">AEGIS</span>
            </div>

            {/* Center: Threat Level */}
            <div className="hidden md:flex flex-col items-center">
                <span className={`text-[10px] ${isCritical ? "text-red-500 font-bold animate-pulse" : isWarning ? "text-amber-500 font-bold" : "text-slate-500"} uppercase tracking-widest mb-1`}>
                    {isCritical ? "Threat Level: DEFCON 1" : isWarning ? "Threat Level: ELEVATED" : "Threat Level"}
                </span>

                {isCritical ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-bold text-red-500 tracking-wider">CRITICAL THRESHOLD BREACH</span>
                    </div>
                ) : isWarning ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-amber-500 tracking-wider">ELEVATED RISK DETECTED</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400 tracking-wider">ALL SYSTEMS NOMINAL</span>
                    </div>
                )}
            </div>

            {/* Right: User & Actions */}
            <div className="flex items-center gap-4">
                {/* User Profile Pill */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800">
                    <div className="h-8 w-8 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400">
                        <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400">satoshi.crypto</span>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">
                            {badge === "ANCIENT_ONE" ? "Ancient One" : "Verified User"}
                        </span>
                    </div>
                </div>

                {/* Settings (Demo Mode Only) */}
                {isDemoMode && (
                    <button
                        onClick={onToggleDemo}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                )}
            </div>
        </header>
    );
}
