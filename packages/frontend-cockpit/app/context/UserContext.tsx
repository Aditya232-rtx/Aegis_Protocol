"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { UserBadge } from "@/utils/mockReputation";

// Add global declaration for Window
declare global {
    interface Window {
        ethereum: any;
    }
}

// !!! ---------------------------------------------------------------- !!!
// DEVELOPER: REPLACE THIS ADDRESS WITH YOUR OWN METAMASK WALLET ADDRESS
// TO TEST THE "ANCIENT ONE" / "SATOSHI.CRYPTO" UNSTOPPABLE DOMAINS DEMO.
const DEMO_WALLET_ADDRESS = "0x550270e895f30c26dc63703a03c29294c6688099";
// !!! ---------------------------------------------------------------- !!!

interface UserContextType {
    walletAddress: string | null;
    badge: UserBadge;
    domainName: string | null;
    hasShield: boolean;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [badge, setBadge] = useState<UserBadge>("NEWBIE");
    const [domainName, setDomainName] = useState<string | null>("Guest");
    const [hasShield, setHasShield] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    /**
     * CONNECT WALLET FLOW
     * The "Wizard of Oz" Moment:
     * 1. Connects to Metamask.
     * 2. Checks if the connected address matches our DEMO_WALLET.
     * 3. If YES: Simulates a successful Unstoppable Domains resolution -> "satoshi.crypto" / ANCIENT_ONE.
     * 4. If NO: Treats as a standard guest -> "Guest" / NEWBIE.
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
            // Note: In Ethers v6, BrowserProvider is designed for this
            const provider = new ethers.BrowserProvider(window.ethereum);

            console.log("👋 Requesting accounts (opening popup)...");

            // 2. Request Access
            // We use 'eth_requestAccounts' which should trigger the popup
            const accounts = await provider.send("eth_requestAccounts", []);

            console.log("✅ Accounts received:", accounts);

            if (!accounts || accounts.length === 0) {
                alert("No accounts authorized.");
                return;
            }

            const connectedAddress = accounts[0];
            setWalletAddress(connectedAddress);
            setIsConnected(true);

            // 3. The "Unstoppable Domains" Simulation
            // We check against the hardcoded demo address to simulate identity resolution.
            console.log("🧐 Current Connected Address:", connectedAddress);
            console.log("🎯 Configured Demo Address:", DEMO_WALLET_ADDRESS);

            if (connectedAddress.toLowerCase() === DEMO_WALLET_ADDRESS.toLowerCase()) {
                console.log("✅ Unstoppable Domains Resolution: Verified 'satoshi.crypto'");
                setBadge("ANCIENT_ONE");
                setDomainName("satoshi.crypto");
                setHasShield(true); // Ancient Ones get the Shield
            } else {
                console.log("ℹ️ Basic Wallet Connected: Standard Guest Profile");
                console.log(`💡 TIP: To see the 'Satoshi' demo, copy '${connectedAddress}' and paste it as the DEMO_WALLET_ADDRESS in 'app/context/UserContext.tsx'`);
                setBadge("NEWBIE");
                setDomainName("Guest");
                setHasShield(false);
            }

            // 4. Redirect to Dashboard
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

    return (
        <UserContext.Provider value={{ walletAddress, badge, domainName, hasShield, isConnected, connectWallet }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};