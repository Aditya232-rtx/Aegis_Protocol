"use client";
import React from "react";
import { LucideIcon } from "lucide-react";

interface AssetCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    subtitle: string;
    trend?: string;
    trendPositive?: boolean;
    iconColor?: string;
}

export default function AssetCard({
    icon: Icon,
    label,
    value,
    subtitle,
    trend,
    trendPositive = true,
    iconColor = "text-emerald-400"
}: AssetCardProps) {
    return (
        <div className="p-5 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col justify-between h-full hover:border-slate-700 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                {/* Icon Box */}
                <div className={`p-2 rounded-lg bg-slate-950/50 border border-slate-800 ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Trend Indicator */}
                {trend && (
                    <span className={`text-xs font-mono font-medium ${trendPositive ? "text-emerald-400" : "text-red-400"}`}>
                        {trend}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                <div className="text-2xl font-bold text-white font-mono tracking-tight">
                    {value}
                </div>
                <span className="text-[10px] text-slate-400 block">{subtitle}</span>
            </div>
        </div>
    );
}
