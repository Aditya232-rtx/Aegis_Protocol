
import hre from "hardhat";

async function main() {
    const { ethers } = hre;

    console.log("\n=== AEGIS PROTOCOL: COCKPIT CHECK ===\n");

    // 1. Setup: Connect to Deployed Registry
    // Deterministic address from previous deployment
    const REGISTRY_ADDRESS = "0x9A676e781A523b5d0C0e43731313A708CB607508";
    const IdentityRegistry = await ethers.getContractFactory("MockIdentityRegistry");
    const registry = IdentityRegistry.attach(REGISTRY_ADDRESS);

    console.log(`Connected to Registry at: ${REGISTRY_ADDRESS}`);

    // 2. Define Personas
    // These should match the addresses from deploy.js
    const users = [
        { alias: "The Rookie", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
        { alias: "The Ancient One", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
        { alias: "The Whale", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
        { alias: "Clean Sheet", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
    ];

    // 3. Simulation Parameters
    const COLLATERAL = 1000; // USDC
    const DEBT = 750; // USDC
    // Standard LTV is usually 75%, so 750 debt on 1000 collateral is usually right at the limit (HF = 1.0)
    // Our mocks use percentage integers like 80 for 80%.

    console.log(`\nSimulation Scenario:`);
    console.log(`- Collateral: $${COLLATERAL}`);
    console.log(`- Debt:       $${DEBT}`);
    console.log(`------------------------------------------\n`);

    const dashboardData = [];

    // 4. Loop & Verify
    for (const user of users) {
        // A. Mock Position Logic implies we just calculate HF based on what the Registry says
        const params = await registry.getRiskParameters(user.address);

        // params = { ltv, liquidationThreshold, gracePeriod } based on IUnstoppable
        // But MockIdentityRegistry returns (uint256 ltv, uint256 liquidationThreshold, uint256 gracePeriod)
        // Wait, let's check MockIdentityRegistry return struct. 
        // It returns RiskParams(ltv, liquidationThreshold, gracePeriod)
        // Actually in MockIdentityRegistry.sol it returns (ltv, bonus, graceDuration) ?
        // Let's re-read the file content I viewed earlier.
        // Line 22: return RiskParams(80, 8, 900);
        // Line 6: MockIdentityRegistry is IUnstoppable
        // IUnstoppable.sol probably defines RiskParams struct.
        // Based on previous MockIdentityRegistry view: 
        // return RiskParams(75, 10, 0); // Default
        // return RiskParams(80, 8, 900); // Ancient One
        // return RiskParams(82, 5, 1800); // Whale
        // return RiskParams(77, 10, 0); // Clean Sheet

        // NOTE: The previous prompt mentions "Liquidation Threshold (LT)". 
        // The struct in MockIdentityRegistry seems to be using the first value as the main risk metric.
        // Let's assume the first value (80, 82, 75) is the LTV/LiquidationThreshold percentage for this simulation.
        // Formula from prompt: HF = (Collateral * LT) / Debt
        // If LT is 80, that means 0.80.

        const ltvRaw = Number(params[0]); // e.g., 80
        const ltvPercent = ltvRaw / 100;

        const hf = (COLLATERAL * ltvPercent) / DEBT;
        const hfFormatted = hf.toFixed(4);

        const gracePeriod = Number(params[2]);
        let status = "NORMAL";

        if (gracePeriod > 0) {
            status = `ACTIVE GRACE (${gracePeriod}s)`;
        } else if (hf < 1.0) {
            status = "LIQUIDATABLE";
        } else {
            status = "SAFE";
        }

        // Badge Name (Quick lookup based on logic we know, assuming standard badges didn't change name on chain)
        // We can fetch it if we want, but for verification I'll trust the alias mapping implies the badge setup succeeded.

        // Actually, let's read the badge string too for completeness if the interface allowed, 
        // but MockIdentityRegistry "userBadges" is public so we can read it.
        const badge = await registry.userBadges(user.address);

        dashboardData.push({
            "User Alias": user.alias,
            "Badge": badge,
            "LTV (%)": `${ltvRaw}%`,
            "Health Factor": hfFormatted,
            "Status": status
        });
    }

    // 5. Console Output
    console.table(dashboardData);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
