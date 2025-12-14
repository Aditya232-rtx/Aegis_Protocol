# 🛡️ Aegis Protocol

### AI-Driven Insolvency Protection & Liquidity Sponge

**Aegis Protocol** is a next-generation decentralized lending safety layer that prevents liquidation cascades using Artificial Intelligence and Cross-Chain ZK-Proofs. It acts as a "Liquidity Sponge," absorbing bad debt during market volatility rather than dumping collateral, protecting both the protocol and the user.

---

## 🚨 The Problem
Traditional DeFi lending protocols (like Aave or Compound) rely on **Atomic Liquidations**:
1.  **Price Crashes**: Collateral value drops.
2.  **Instant Sell-Off**: Liquidators seize collateral and immediately sell it on DEXs to repay debt.
3.  **Cascading Slippage**: This selling pressure drives prices down further, triggering *more* liquidations.
4.  **Inefficiency**: Users lose 10-15% in penalties, and the market suffers from "MEV wars" and gas spikes.

## 💡 The Solution: Aegis Sponge
Aegis introduces a **Probationary Liquidation** mechanism:
1.  **AI Sentinel**: Continuously monitors wallet risk using off-chain ML models.
2.  **Sponge Rescue**: When a user enters the "Red Zone" (Critical Risk), they are not immediately liquidated. Instead, the **Backstop Pool (Sponge)** interacts:
    *   It pays off the user's debt (USDC) to the pool.
    *   It takes custody of the collateral (ETH).
    *   **It Does NOT Sell**: The Sponge holds the collateral, waiting for market stabilization or executing gradual, optimized exits via Dark Pools (CoW Swap).
3.  **ZKML Verification**: All risk scoring and state transitions are verified on-chain, ensuring the AI cannot be manipulated.

---

## 🌟 Why Aegis? (USPs)

### 1. 🛡️ Liquidity Sponge (The "Backstop")
*   **The Problem**: Traditional protocols dump collateral instantly, crashing the price.
*   **The Solution**: Aegis **absorbs** the debt. The Backstop Pool buys the bad debt and holds the collateral ("Diamond Hands") until the market recovers.
*   **Effect**: Zero slippage, no price cascades, and saved user funds.

### 2. 🧠 Trustless AI Sentinel
*   **The Problem**: AI is powerful but centralized (black box).
*   **The Solution**: We verify AI inferences on-chain using **ZKML**.
*   **Effect**: You don't trust the bot; you trust the Zero-Knowledge Proof.

### 3. 🧩 Cross-Chain Architecture
*   **The Problem**: Ethereum gas is too expensive for complex ZK verification.
*   **The Solution**: We offload heavy computation to **Ergo** (eUTXO) and bridge state back to EVM.
*   **Effect**: Cheap, scalable, and decentralized security.

---

## 🏗️ Project Architecture

```bash
Aegis_Protocol/
├── packages/
│   ├── blockchain-evm/       # Solidity Smart Contracts (The Core)
│   │   ├── contracts/
│   │   │   ├── core/         # AegisPool, AegisCore, BackstopPool
│   │   │   └── security/     # Verifier, IdentityRegistry
│   │   └── scripts/          # Chaos Monkey & Deployment
│   │
│   ├── frontend-cockpit/     # Next.js Dashboard (The UI)
│   │   ├── app/components/   # Reusable UI Widgets (RiskGauge, AssetCard)
│   │   └── hooks/            # Blockchain Integration Hooks
│   │
│   ├── ml-sentinel/          # AI Risk Engine (Python/TensorFlow)
│   │   └── models/           # Pre-trained Sentinel Models
│   │
│   └── blockchain-ergo/      # ErgoScript & Off-Chain Logic
│       └── src/              # Guard Scripts for Rosen Bridge
```

---

## ⚡ Why ErgoScript?

We chose **Ergo** as our security layer for three critical reasons:

1.  **eUTXO Model**: Unlike Ethereum's Account model, Ergo's Extended UTXO model allows for **parallel transaction processing** and deterministic box guarding. This makes it perfect for handling high-throughput risk assessments without state contention.
2.  **Sigma Protocols**: Ergo has built-in support for **Zero-Knowledge Proofs (Sigma Protocols)** at the protocol level. Writing "Guard Scripts" that verify complex cryptographic statements is cheaper and safer than on EVM.
3.  **NiPoPoWs & Rosen Bridge**: Ergo's unique "Non-Interactive Proofs of Proof-of-Work" allow for ultra-lightweight bridges (Rosen) that don't rely on centralized multisigs, ensuring our cross-chain messaging is fully decentralized.

## 🔐 Decentralizing ZKML with ErgoScript

A critical innovation of Aegis is how we handle **Model Integrity**. We don't want a centralized admin flipping a "Panic Switch."

### The Ergo Guard Script
We deploy a **Guard Script** on the Ergo blockchain that acts as an immutable logic gate for the Rosen Bridge watchers.

1.  **Commitment**: The ML Model's hash is hardcoded into the Guard Script (or a UTXO register).
2.  **Proof Submission**: The Sentinel submits a ZK-Proof (RiscZero/Halo2) asserted to the Guard Address.
3.  **Verification Logic**:
    *   The Guard Script checks `Verify(Proof, PublicInputs, ModelHash) == true`.
    *   It ensures the `RiskScore` output matches the input data.
    *   **Crucially**: The Guard Script *prevents* any transaction that updates the Global Risk State unless a valid ZK Proof is attached.
4.  **Bridging**: Once the Ergo transaction is confirmed (meaning the Proof is valid), the Rosen Bridge watchers observe the state change and relay the specific boolean flag (`isCritical: true`) to the Ethereum `AegisCore` contract.

This architecture ensures that **not even the developers** can trigger a system-wide liquidation event without a mathematical proof of insolvency generated by the governed AI model.

---

## 🚀 Getting Started

Follow these steps to set up the Aegis Protocol locally.

### Prerequisites
- Node.js (v16+)
- Python (v3.8+) for ML Sentinel
- Docker (optional, for Ergo node)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Aditya232-rtx/Aegis_Protocol.git
    cd Aegis_Protocol
    ```

2.  **Install Dependencies**
    Running the following command at the root will verify the workspace structure.
    ```bash
    npm install
    ```

3.  **Local Blockchain Setup (EVM)**
    Spin up a local Hardhat node to simulate the Ethereum network.
    ```bash
    cd packages/blockchain-evm
    npx hardhat node
    ```

4.  **Deploy Contracts**
    Deploy the core Aegis contracts (Pool, Sponge, Verifier) to your local node.
    ```bash
    # In a new terminal
    cd packages/blockchain-evm
    npx hardhat run scripts/deploy-and-export.js --network localhost
    ```

5.  **Run the UI**
    Launch the Next.js cockpit to interact with the protocol.
    ```bash
    cd packages/frontend-cockpit
    npm run dev
    ```
    Visit `http://localhost:3000` to view the dashboard.

6.  **Simulate Insolvency (Chaos Monkey)**
    Test the protocol's resilience by simulating market crashes and user insolvency.
    ```bash
    npx hardhat run scripts/chaos-monkey-live.js --network localhost
    ```

---

## 🔮 Future Enhancements & Vision

Aegis aims to become the standard for **DeFi Insurance Layers**.

*   **Multi-Chain Sponge**: Expanding the Backstop Pool to Arbitrum, Optimism, and Base using LayerZero.
*   **Decentralized Model Training**: Moving from off-chain training to Federated Learning on Akash Network.
*   **Privacy-First Liquidations**: Using Midnight or Aztec to obscure user positions while maintaining protocol solvency.
*   **Generalized Risk Oracle**: Offering the "Sentinel" score as a public oracle for other lending protocols (composability).

---

## 🤝 Contribution Guidelines

We welcome contributions to Aegis Protocol!

1.  **Fork** the repository.
2.  **Create a Branch**: `git checkout -b feature/amazing-feature`.
3.  **Commit**: `git commit -m 'Add some amazing feature'`.
4.  **Push**: `git push origin feature/amazing-feature`.
5.  **Open a Pull Request**.

Please ensure all tests pass before submitting.

---

## 👥 The Team

*   **Anmol Kadam** - [GitHub](https://github.com/NMOLE08)
*   **Aditya Jadhav** - [GitHub](https://github.com/Aditya232-rtx)
*   **Atharva Gadi** - [GitHub](https://github.com/Atharva-Gadi)
