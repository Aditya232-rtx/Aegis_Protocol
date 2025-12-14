"use client";
import React, { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Zap, AlertTriangle, ExternalLink, Lock } from "lucide-react";
import TransactionModal from "./TransactionModal";

interface FooterDockProps {
    isCritical?: boolean;
    isWarning?: boolean;
    gracePeriodExpired?: boolean;
    userTier?: string;
    onRescue?: () => void;
    onTransactionSuccess?: () => void;
}

export default function FooterDock({
    isCritical = false,
    isWarning = false,
    gracePeriodExpired = false,
    userTier = "NEWBIE",
    onRescue,
    onTransactionSuccess
}: FooterDockProps) {
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [borrowModalOpen, setBorrowModalOpen] = useState(false);

    if (isCritical) {
        // ... (Existing Critical Return Logic) ...
        return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-6">
                <button
                    onClick={onRescue}
                    className="w-full relative group overflow-hidden bg-red-950/30 backdrop-blur-xl border-2 border-red-500 rounded-2xl p-4 shadow-[0_0_40px_rgba(220,38,38,0.4)] flex items-center justify-between hover:bg-red-900/40 transition-all"
                >
                    {/* Pulsing Background */}
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse" />

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/50">
                            <Zap className="h-6 w-6 text-red-500 animate-pulse" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-red-100 tracking-wider">ACTIVATE SPONGE RESCUE</h3>
                                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                    Urgent
                                </span>
                            </div>
                            <p className="text-xs text-red-300/70 mt-1 flex items-center gap-1">
                                Liquidity Source: <span className="text-red-200 font-semibold">Ergo via Rosen Bridge</span>
                                <ExternalLink className="h-3 w-3" />
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 pr-4">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-bold text-red-400">Initialize</span>
                    </div>
                </button>
            </div>
        )
    }

    if (isWarning) {
        // Logic for Repay Button State
        let repayDisabled = true;
        let repayText = "System Paused";
        let repayStyle = "text-slate-500 bg-slate-800/50 cursor-not-allowed";

        const hasPrivilege = userTier === "ANCIENT_ONE" || userTier === "WHALE";

        if (hasPrivilege && !gracePeriodExpired) {
            repayDisabled = false;
            repayText = "Repay Now";
            repayStyle = "text-amber-500 bg-amber-950/50 border border-amber-500/50 hover:bg-amber-900/50 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]";
        } else if (hasPrivilege && gracePeriodExpired) {
            repayText = "Grace Window Closed";
        }

        return (
            <>
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 p-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]">

                        {/* Standard Borrow Button (Unlocked) */}
                        <button
                            onClick={() => setBorrowModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-all group border border-transparent"
                        >
                            <ArrowUpCircle className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300" />
                            <span className="text-sm font-medium">Borrow</span>
                        </button>

                        {/* Conditional Repay Button */}
                        <button
                            disabled={repayDisabled}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${repayStyle}`}
                        >
                            {repayDisabled && <AlertTriangle className="h-4 w-4" />}
                            <span className="text-sm font-bold uppercase tracking-wide">{repayText}</span>
                        </button>
                    </div>
                </div>

                <TransactionModal
                    type="borrow"
                    isOpen={borrowModalOpen}
                    onClose={() => setBorrowModalOpen(false)}
                    onSuccess={onTransactionSuccess}
                />
            </>
        );
    }

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-1 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-700 shadow-2xl shadow-black/50">

                    <button
                        onClick={() => setDepositModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-all group"
                    >
                        <ArrowDownCircle className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300" />
                        <span className="text-sm font-medium">Deposit</span>
                    </button>

                    <div className="w-px h-6 bg-slate-800" />

                    <button
                        onClick={() => setBorrowModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-all group shadow-none"
                    >
                        <ArrowUpCircle className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300" />
                        <span className="text-sm font-medium">Borrow</span>
                    </button>

                </div>
            </div>

            <TransactionModal
                type="deposit"
                isOpen={depositModalOpen}
                onClose={() => setDepositModalOpen(false)}
                onSuccess={onTransactionSuccess}
            />
            <TransactionModal
                type="borrow"
                isOpen={borrowModalOpen}
                onClose={() => setBorrowModalOpen(false)}
                onSuccess={onTransactionSuccess}
            />
        </>
    );
}
