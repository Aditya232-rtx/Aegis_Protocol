"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useUnstoppable, UserBadge } from "@/app/hooks/useUnstoppable";

// Add global declaration for Window
declare global {
    interface Window {
        ethereum: any;
    }
}

interface UserContextType {
    walletAddress: string | null;
    badge: UserBadge;
    domainName: string | null;
    hasShield: boolean;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Fetch real identity data from blockchain
    const { badge, domainName, hasShield } = useUnstoppable(walletAddress);

    /**
     * CONNECT WALLET FLOW (Enhanced with Blockchain Integration)
     * 1. Connects to MetaMask
     * 2. Fetches real badge and identity data from IdentityRegistry contract
     * 3. Redirects to dashboard
     */
    const connectWallet = async () => {
        console.log("🖱️ connectWallet triggered");

        if (typeof window === "undefined") {
            console.warn("Server-side execution detected, aborting wallet connect");
            return;
        }

        if (!window.ethereum) {
            console.error("❌ No crypto wallet found in window.ethereum");
            alert("MetaMask (or a Web3 wallet) is not installed. Please install it to use this feature.");
            return;
        }

        try {
            console.log("🔌 Initializing Ethers Provider with window.ethereum...");

            // 1. Initialize Ethers Provider
            const provider = new ethers.BrowserProvider(window.ethereum);

            console.log("👋 Requesting accounts (opening popup)...");

            // 2. Request Access
            const accounts = await provider.send("eth_requestAccounts", []);

            console.log("✅ Accounts received:", accounts);

            if (!accounts || accounts.length === 0) {
                alert("No accounts authorized.");
                return;
            }

            const connectedAddress = accounts[0];
            setWalletAddress(connectedAddress);
            setIsConnected(true);

            console.log("🔗 Connected to:", connectedAddress);
            console.log("📡 Fetching identity data from blockchain...");

            // Identity data will be fetched automatically by useUnstoppable hook

            // 3. Redirect to Dashboard
            router.push("/dashboard");

        } catch (error: any) {
            console.error("Connection Error:", error);
            // Handle user rejection explicitly
            if (error?.code === 4001 || error?.info?.error?.code === 4001) {
                alert("Connection request was rejected by the user.");
            } else {
                alert(`Failed to connect wallet: ${error?.message || "Unknown error"}`);
            }
        }
    };

    const disconnectWallet = () => {
        setWalletAddress(null);
        setIsConnected(false);
        router.push("/");
    };

    // Check for existing connection on mount
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window === "undefined" || !window.ethereum) return;

            try {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts.length > 0) {
                    console.log("🔄 Restoring connection to:", accounts[0]);
                    setWalletAddress(accounts[0]);
                    setIsConnected(true);
                }
            } catch (error) {
                console.error("Failed to check existing connection:", error);
            }
        };

        checkConnection();
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else if (accounts[0] !== walletAddress) {
                setWalletAddress(accounts[0]);
                setIsConnected(true);
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, [walletAddress]);

    return (
        <UserContext.Provider
            value={{
                walletAddress,
                badge,
                domainName,
                hasShield,
                isConnected,
                connectWallet,
                disconnectWallet
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};