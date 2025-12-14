import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { ethers } = hre;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to live feed JSON
const LIVE_FEED_PATH = path.join(__dirname, '../../frontend-integration-data/public/live_feed.json');
const FRONTEND_FEED_PATH = path.join(__dirname, '../../frontend-cockpit/public/live_feed.json');

async function main() {
    console.log("\n🎪 === CHAOS MONKEY: LIVE SIMULATION ===\n");

    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    const sentinel = signers[5];

    // Get deployed contracts
    const aegisCoreAddress = "0xb6057e08a11da09a998985874FE2119e98dB3D5D";
    const aegisCore = await hre.ethers.getContractAt("AegisCore", aegisCoreAddress);

    const gasConfig = {
        maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
        maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
    };

    console.log("📊 Starting continuous simulation...");
    console.log("   Press Ctrl+C to stop\n");

    // Simulation state
    let basePrice = 2500;
    let riskScore = 0.15;
    let currentState = 0; // GREEN
    let iteration = 0;

    // Simulation loop
    const simulate = async () => {
        iteration++;
        console.log(`\n${"=".repeat(60)}`);
        console.log(`Iteration ${iteration} - ${new Date().toLocaleTimeString()}`);
        console.log("=".repeat(60));

        // Simulate market conditions
        // Phase 1 (0-10 iterations): Normal
        // Phase 2 (11-20 iterations): Building tension
        // Phase 3 (21-30 iterations): Crisis
        // Phase 4 (31+): Recovery

        if (iteration <= 4) {
            // GREEN: Normal operations (approx 40s)
            riskScore = 0.15 + Math.random() * 0.2; // 0.15-0.35
            basePrice = 2500 + (Math.random() - 0.5) * 100; // $2450-$2550
            currentState = 0;
        } else if (iteration <= 8) {
            // YELLOW: Building tension (approx 40s)
            riskScore = 0.5 + Math.random() * 0.2; // 0.5-0.7
            basePrice = 2300 - (iteration - 4) * 40; // Faster decline
            currentState = 1;
        } else if (iteration <= 12) {
            // RED: Crisis (starts at ~1m 20s)
            riskScore = 0.8 + Math.random() * 0.15; // 0.8-0.95
            basePrice = 1800 - (iteration - 8) * 120; // Steeper crash (was 80)
            currentState = 2; // Strict setting for Red phase loops
        } else {
            // Recovery
            riskScore = Math.max(0.15, riskScore - 0.05);
            basePrice = Math.min(2500, basePrice + 50);
            // Strict logic: Red if >= 0.8
            if (riskScore >= 0.8) currentState = 2;
            else if (riskScore >= 0.5) currentState = 1;
            else currentState = 0;
        }

        // Update live feed JSON
        const liveFeed = {
            riskScore: Math.round(riskScore * 10000) / 10000,
            change24h: iteration > 1 ? -0.15 : 0,
            liquidityHealth: Math.max(0.5, 1 - riskScore * 0.5),
            timestamp: new Date().toISOString(),
            status: currentState === 2 ? 'critical' : currentState === 1 ? 'warning' : 'normal',
            ethPrice: Math.round(basePrice),
            volatility: riskScore * 0.3,
            marketDepth: {
                bidLiquidity: Math.round(1500000 * (1 - riskScore * 0.5)),
                askLiquidity: Math.round(1450000 * (1 - riskScore * 0.5)),
                spread: 0.002 + riskScore * 0.01
            }
        };

        // Write to both locations
        fs.writeFileSync(LIVE_FEED_PATH, JSON.stringify(liveFeed, null, 2));
        fs.writeFileSync(FRONTEND_FEED_PATH, JSON.stringify(liveFeed, null, 2));

        // Update blockchain state
        try {
            const dummyProof = ethers.toUtf8Bytes("dummy_proof");
            // Format Risk Score (0-1) to Basis Points (0-10000) -> Bytes32
            const riskPoints = Math.round(riskScore * 10000);
            const inputHash = ethers.zeroPadValue(ethers.toBeHex(riskPoints), 32);

            const tx = await aegisCore.connect(sentinel).setRiskState(
                currentState,
                dummyProof,
                inputHash,
                gasConfig
            );
            await tx.wait();

            console.log(`✅ State Updated on Blockchain`);
        } catch (error) {
            console.log(`⚠️  Blockchain update skipped: ${error.message}`);
        }

        // Display current state
        const stateNames = ['🟢 GREEN', '🟡 YELLOW', '🔴 RED'];
        console.log(`\n📈 Market Conditions:`);
        console.log(`   State:       ${stateNames[currentState]}`);
        console.log(`   Risk Score:  ${(riskScore * 100).toFixed(2)}%`);
        console.log(`   ETH Price:   $${basePrice.toFixed(2)}`);
        console.log(`   Liquidity:   ${(liveFeed.liquidityHealth * 100).toFixed(1)}%`);

        if (currentState === 2) {
            console.log(`\n🚨 CRITICAL STATE - Rescue button should be active!`);
        } else if (currentState === 1) {
            console.log(`\n⚠️  ELEVATED RISK - Borrowing restricted for non-privileged users`);
        }
    };

    // Run initial simulation
    await simulate();

    // Continue every 10 seconds
    setInterval(simulate, 10000);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
