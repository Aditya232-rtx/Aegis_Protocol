"use client";
import React from "react";
import { ExternalLink, ShieldCheck, Zap, ShieldAlert } from "lucide-react";

interface RiskGaugeProps {
    score?: number;
    variant?: "safe" | "danger" | "warning";
}

export default function RiskGauge({ score = 23, variant = "safe" }: RiskGaugeProps) {
    const riskScore = score;
    const isCritical = variant === "danger";
    const isWarning = variant === "warning";

    // Theme Colors
    let primaryColor = "#10b981"; // emerald
    let glowColor = "bg-emerald-500/5";
    let textColor = "text-emerald-400";
    let subTextColor = "text-emerald-500/80";

    if (isCritical) {
        primaryColor = "#ef4444"; // red
        glowColor = "bg-red-500/5";
        textColor = "text-red-400";
        subTextColor = "text-red-500/80";
    } else if (isWarning) {
        primaryColor = "#f59e0b"; // amber
        glowColor = "bg-amber-500/5";
        textColor = "text-amber-500";
        subTextColor = "text-amber-500/80";
    }

    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (riskScore / 100) * circumference;

    return (
        <div className={`h-full flex flex-col items-center justify-center p-8 bg-slate-900/50 backdrop-blur-md border ${isCritical ? "border-red-900/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : isWarning ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "border-slate-800"} rounded-2xl relative overflow-hidden group`}>
            {/* Background Glow */}
            <div className={`absolute inset-0 ${glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                {isCritical ? <Zap className="h-3 w-3 text-red-500" /> : isWarning ? <ShieldAlert className="h-3 w-3 text-amber-500" /> : <ShieldCheck className="h-3 w-3" />}
                The Watchtower
            </h3>

            {/* SVG Gauge */}
            <div className="relative flex items-center justify-center">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90"
                >
                    {/* Background Ring */}
                    <circle
                        stroke="#1e293b"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Progress Ring */}
                    <circle
                        stroke={primaryColor}
                        strokeWidth={stroke}
                        strokeDasharray={circumference + " " + circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className={`transition-all duration-1000 ease-out ${isCritical ? "drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : ""}`}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isCritical ? (
                        <Zap className={`h-6 w-6 ${textColor} mb-1 animate-pulse`} />
                    ) : (
                        <ShieldCheck className={`h-6 w-6 ${textColor} mb-1`} />
                    )}

                    <span className={`text-4xl font-mono font-bold ${textColor}`}>
                        {riskScore}%
                    </span>
                    <span className={`text-[10px] ${subTextColor} uppercase tracking-wider font-semibold`}>
                        Risk Score
                    </span>
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 text-center space-y-4">
                <div>
                    <span className="text-slate-500 text-xs mr-2">AI Confidence:</span>
                    <span className={`${textColor} font-bold text-xs uppercase`}>{isCritical ? "Low" : "High"}</span>
                </div>

                {/* Integration Point */}
                {/* INTEGRATION POINT (Member B): Fetch live risk score from ML Model API here. */}

                <a href="#" className="inline-flex items-center gap-1 text-[10px] text-emerald-500/60 hover:text-emerald-400 transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verify on Explorer
                    <ExternalLink className="h-2.5 w-2.5" />
                </a>
            </div>
        </div>
    );
}
