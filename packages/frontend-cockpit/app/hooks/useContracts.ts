// Hook to initialize and manage contract instances
"use client";
import { useMemo, useState, useEffect } from 'react';
import { ethers, Contract, BrowserProvider } from 'ethers';
import {
    AEGIS_CORE_ABI,
    AEGIS_POOL_ABI,
    BACKSTOP_POOL_ABI,
    IDENTITY_REGISTRY_ABI,
    AEGIS_LENS_ABI,
    MOCK_ORACLE_ABI,
    MOCK_ERC20_ABI,
} from '@/app/config/abis';
import { getNetworkConfig, DEFAULT_NETWORK } from '@/app/config/addresses';

export interface AegisContracts {
    aegisCore: Contract;
    aegisPool: Contract;
    backstopPool: Contract;
    identityRegistry: Contract;
    aegisLens: Contract;
    mockOracle: Contract;
    usdc: Contract;
    provider: BrowserProvider;
    signer: ethers.Signer | null;
    chainId: number;
}

export function useContracts(
    walletAddress: string | null
): AegisContracts | null {
    const [chainId, setChainId] = useState<number | null>(null);

    // Detect network from MetaMask
    useEffect(() => {
        if (typeof window === 'undefined' || !window.ethereum) {
            return;
        }

        const detectNetwork = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const network = await provider.getNetwork();
                const detectedChainId = Number(network.chainId);

                console.log(`🌐 Detected network: Chain ID ${detectedChainId}`);
                setChainId(detectedChainId);
            } catch (error) {
                console.error('Failed to detect network:', error);
                // Fallback to default
                setChainId(DEFAULT_NETWORK.chainId);
            }
        };

        detectNetwork();

        // Listen for network changes
        const handleChainChanged = (newChainId: string) => {
            const chainIdNum = parseInt(newChainId, 16);
            console.log(`🔄 Network changed to Chain ID ${chainIdNum}`);
            setChainId(chainIdNum);
            window.location.reload(); // Reload to reinitialize contracts
        };

        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum?.removeListener('chainChanged', handleChainChanged);
        };
    }, []);

    return useMemo(() => {
        if (typeof window === 'undefined' || !window.ethereum || chainId === null) {
            return null;
        }

        try {
            // Initialize provider
            const provider = new ethers.BrowserProvider(window.ethereum);

            // Get network config based on detected chain ID
            const config = getNetworkConfig(chainId) || DEFAULT_NETWORK;

            console.log(`📋 Using config for Chain ID ${chainId}:`, {
                AegisCore: config.contracts.AegisCore,
                AegisPool: config.contracts.AegisPool,
            });

            // Initialize read-only contracts (no signer needed)
            const aegisCore = new Contract(
                config.contracts.AegisCore,
                AEGIS_CORE_ABI,
                provider
            );

            const aegisPool = new Contract(
                config.contracts.AegisPool,
                AEGIS_POOL_ABI,
                provider
            );

            const backstopPool = new Contract(
                config.contracts.BackstopPool,
                BACKSTOP_POOL_ABI,
                provider
            );

            const identityRegistry = new Contract(
                config.contracts.IdentityRegistry,
                IDENTITY_REGISTRY_ABI,
                provider
            );

            const aegisLens = new Contract(
                config.contracts.AegisLens,
                AEGIS_LENS_ABI,
                provider
            );

            const mockOracle = new Contract(
                config.contracts.MockOracle,
                MOCK_ORACLE_ABI,
                provider
            );

            const usdc = new Contract(
                config.contracts.USDC,
                MOCK_ERC20_ABI,
                provider
            );

            return {
                aegisCore,
                aegisPool,
                backstopPool,
                identityRegistry,
                aegisLens,
                mockOracle,
                usdc,
                provider,
                signer: null, // Will be set when needed for transactions
                chainId,
            };
        } catch (error) {
            console.error('Failed to initialize contracts:', error);
            return null;
        }
    }, [walletAddress, chainId]);
}

// Helper to get contract with signer for transactions
export async function getContractWithSigner(
    contract: Contract,
    provider: BrowserProvider
): Promise<Contract> {
    const signer = await provider.getSigner();
    return contract.connect(signer);
}
