# Aegis Protocol: Frontend Cockpit

> **Civilized DeFi.** An Open-Source approach to Operational Resilience & Reputation-Based Risk.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-active-success.svg) ![Stack](https://img.shields.io/badge/stack-Next.js_14-black.svg)

## 🚨 The Problem: Liquidation Cascades & "PvP" DeFi
In current DeFi lending markets, operational failure (forgetting to top up collateral, network congestion, or simple human error) leads to instant, ruthless liquidation. This "Player vs Player" environment punishes loyal, long-term users the same as mercenary capital.

## 🛡️ The Solution: The Aegis Watchtower
Aegis Protocol introduces a reputation-based safety layer.
1.  **AI Risk Watchtower**: Real-time monitoring of health factors, categorizing risk into "Safe", "Elevated" (Amber), and "Critical" (Defcon 1).
2.  **Reputation Grace Period**: High-reputation users ("Ancient Ones") earn a "Shield" — a time-based grace period preventing instant liquidation during market volatility.
3.  **Sponge Rescue**: A collaborative liquidity mechanism to "soak up" bad debt before it hits the public auction block.

## ⚡ Tech Stack
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Atomic, Utility-First)
*   **Web3 Integration**: [Ethers.js v6](https://docs.ethers.org/v6/)
*   **Identity**: Unstoppable Domains / ENS Mock Integration
*   **State Management**: React Context + Hooks

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   MetaMask (or compatible Web3 Wallet)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Aditya232-rtx/Aegis_Protocol.git

# 2. Navigate to the frontend package
cd packages/frontend-cockpit

# 3. Install dependencies
npm install

# 4. Run the development server
npm run dev
```

## 🎮 Demo Highlights: "The Ancient One"
This dashboard includes a **"Wizard of Oz"** demo mode to simulate Unstoppable Domains identity resolution.

1.  **Standard Connection**: By default, connecting any wallet treats you as a "Guest" (Newbie Tier).
2.  **Unlock "Ancient One" Status**:
    *   Open your browser console (`F12`).
    *   Connect your wallet.
    *   Copy your wallet address from the logs.
    *   Open `app/context/UserContext.tsx`
    *   Paste your address into the `DEMO_WALLET_ADDRESS` constant:
        ```typescript
        const DEMO_WALLET_ADDRESS = "0xYourAddressHere";
        ```
    *   **Refresh & Reconnect**: You are now "satoshi.crypto" — seeing the Shield, the "Ancient One" badge, and the demo in its full glory.

## 📂 Project Structure
```
packages/frontend-cockpit/
├── app/
│   ├── components/      # Atomic UI components (RiskGauge, AssetCard)
│   ├── context/         # Global User & Wallet State
│   ├── dashboard/       # Main Mission Control Dashboard
│   └── hooks/           # Custom Logic (useAegisState, useUnstoppable)
├── public/              # Static assets and Debug Tools
└── ...config files
```

---
*Built with ❤️ for a more civilized decentralized future.*
