// Hook for lending operations (deposit, borrow, repay, withdraw)
"use client";
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContracts, getContractWithSigner } from './useContracts';

// Gas configuration for forked mainnet
const getGasConfig = () => ({
    maxFeePerGas: ethers.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
});

export interface TransactionState {
    loading: boolean;
    error: string | null;
    txHash: string | null;
    success: boolean;
}

export interface UseLendingResult {
    depositCollateral: (amountETH: string) => Promise<void>;
    borrowUSDC: (amountUSDC: string) => Promise<void>;
    repayDebt: (amountUSDC: string) => Promise<void>;
    withdrawCollateral: (amountETH: string) => Promise<void>;
    state: TransactionState;
}

export function useLending(
    walletAddress: string | null,
    onSuccess?: () => void
): UseLendingResult {
    const contracts = useContracts(walletAddress);
    const [state, setState] = useState<TransactionState>({
        loading: false,
        error: null,
        txHash: null,
        success: false,
    });

    const resetState = () => {
        setState({
            loading: false,
            error: null,
            txHash: null,
            success: false,
        });
    };

    const depositCollateral = useCallback(
        async (amountETH: string) => {
            if (!contracts || !walletAddress) {
                setState({
                    loading: false,
                    error: 'Wallet not connected',
                    txHash: null,
                    success: false,
                });
                return;
            }

            resetState();
            setState((prev) => ({ ...prev, loading: true }));

            try {
                // Get contract with signer
                const poolWithSigner = await getContractWithSigner(
                    contracts.aegisPool,
                    contracts.provider
                );

                // Convert ETH amount to wei
                const amountWei = ethers.parseEther(amountETH);

                // Send transaction
                const tx = await poolWithSigner.depositETH({
                    value: amountWei,
                    ...getGasConfig()
                });

                setState((prev) => ({ ...prev, txHash: tx.hash }));

                // Wait for confirmation
                await tx.wait();

                setState({
                    loading: false,
                    error: null,
                    txHash: tx.hash,
                    success: true,
                });

                if (onSuccess) onSuccess();
            } catch (err: any) {
                console.error('Deposit failed:', err);
                setState({
                    loading: false,
                    error: err.message || 'Transaction failed',
                    txHash: null,
                    success: false,
                });
            }
        },
        [contracts, walletAddress, onSuccess]
    );

    const borrowUSDC = useCallback(
        async (amountUSDC: string) => {
            if (!contracts || !walletAddress) {
                setState({
                    loading: false,
                    error: 'Wallet not connected',
                    txHash: null,
                    success: false,
                });
                return;
            }

            resetState();
            setState((prev) => ({ ...prev, loading: true }));

            try {
                const poolWithSigner = await getContractWithSigner(
                    contracts.aegisPool,
                    contracts.provider
                );

                // Convert USDC amount (18 decimals in our mock)
                const amountWei = ethers.parseUnits(amountUSDC, 18);

                const tx = await poolWithSigner.borrowUSDC(amountWei, getGasConfig());
                setState((prev) => ({ ...prev, txHash: tx.hash }));

                await tx.wait();

                setState({
                    loading: false,
                    error: null,
                    txHash: tx.hash,
                    success: true,
                });

                if (onSuccess) onSuccess();
            } catch (err: any) {
                console.error('Borrow failed:', err);
                setState({
                    loading: false,
                    error: err.message || 'Transaction failed',
                    txHash: null,
                    success: false,
                });
            }
        },
        [contracts, walletAddress, onSuccess]
    );

    const repayDebt = useCallback(
        async (amountUSDC: string) => {
            if (!contracts || !walletAddress) {
                setState({
                    loading: false,
                    error: 'Wallet not connected',
                    txHash: null,
                    success: false,
                });
                return;
            }

            resetState();
            setState((prev) => ({ ...prev, loading: true }));

            try {
                const poolWithSigner = await getContractWithSigner(
                    contracts.aegisPool,
                    contracts.provider
                );
                const usdcWithSigner = await getContractWithSigner(
                    contracts.usdc,
                    contracts.provider
                );

                const amountWei = ethers.parseUnits(amountUSDC, 18);

                // First approve USDC spending
                const approveTx = await usdcWithSigner.approve(
                    await contracts.aegisPool.getAddress(),
                    amountWei,
                    getGasConfig()
                );
                await approveTx.wait();

                // Then repay
                const tx = await poolWithSigner.repayUSDC(amountWei, getGasConfig());
                setState((prev) => ({ ...prev, txHash: tx.hash }));

                await tx.wait();

                setState({
                    loading: false,
                    error: null,
                    txHash: tx.hash,
                    success: true,
                });

                if (onSuccess) onSuccess();
            } catch (err: any) {
                console.error('Repay failed:', err);
                setState({
                    loading: false,
                    error: err.message || 'Transaction failed',
                    txHash: null,
                    success: false,
                });
            }
        },
        [contracts, walletAddress, onSuccess]
    );

    const withdrawCollateral = useCallback(
        async (amountETH: string) => {
            if (!contracts || !walletAddress) {
                setState({
                    loading: false,
                    error: 'Wallet not connected',
                    txHash: null,
                    success: false,
                });
                return;
            }

            resetState();
            setState((prev) => ({ ...prev, loading: true }));

            try {
                const poolWithSigner = await getContractWithSigner(
                    contracts.aegisPool,
                    contracts.provider
                );

                const amountWei = ethers.parseEther(amountETH);

                const tx = await poolWithSigner.withdrawETH(amountWei, getGasConfig());
                setState((prev) => ({ ...prev, txHash: tx.hash }));

                await tx.wait();

                setState({
                    loading: false,
                    error: null,
                    txHash: tx.hash,
                    success: true,
                });

                if (onSuccess) onSuccess();
            } catch (err: any) {
                console.error('Withdraw failed:', err);
                setState({
                    loading: false,
                    error: err.message || 'Transaction failed',
                    txHash: null,
                    success: false,
                });
            }
        },
        [contracts, walletAddress, onSuccess]
    );

    return {
        depositCollateral,
        borrowUSDC,
        repayDebt,
        withdrawCollateral,
        state,
    };
}
