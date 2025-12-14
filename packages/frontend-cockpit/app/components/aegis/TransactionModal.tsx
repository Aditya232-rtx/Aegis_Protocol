"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { useLending } from "@/app/hooks/useLending";
import { useUser } from "@/app/context/UserContext";

interface TransactionModalProps {
    type: "deposit" | "borrow";
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function TransactionModal({ type, isOpen, onClose, onSuccess }: TransactionModalProps) {
    const { walletAddress } = useUser();
    const [amount, setAmount] = useState("");
    const { depositCollateral, borrowUSDC, state } = useLending(walletAddress, () => {
        setAmount("");
        if (onSuccess) onSuccess();
        setTimeout(onClose, 2000); // Close after 2 seconds on success
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;

        if (type === "deposit") {
            await depositCollateral(amount);
        } else {
            await borrowUSDC(amount);
        }
    };

    const isDeposit = type === "deposit";
    const title = isDeposit ? "Deposit ETH" : "Borrow USDC";
    const placeholder = isDeposit ? "0.0 ETH" : "0.0 USDC";
    const buttonText = state.loading ? "Processing..." : isDeposit ? "Deposit ETH" : "Borrow USDC";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Amount
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            disabled={state.loading}
                        />
                    </div>

                    {/* Error Message */}
                    {state.error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">{state.error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {state.success && (
                        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                            <p className="text-sm text-emerald-400">Transaction successful!</p>
                            {state.txHash && (
                                <p className="text-xs text-slate-400 mt-1 font-mono truncate">
                                    {state.txHash}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={state.loading || !amount || parseFloat(amount) <= 0}
                        className={`w-full py-3 rounded-lg font-medium transition-all ${state.loading || !amount || parseFloat(amount) <= 0
                            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                            : isDeposit
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-cyan-600 hover:bg-cyan-700 text-white"
                            }`}
                    >
                        {buttonText}
                    </button>
                </form>
            </div>
        </div>
    );
}
