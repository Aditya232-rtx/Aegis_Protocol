// Enhanced deployment script that saves addresses to frontend config
import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { ethers } = hre;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gas fee configuration for forked mainnet
const getGasConfig = () => ({
    maxFeePerGas: ethers.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
});

async function main() {
    console.log("=== AEGIS PROTOCOL: DEPLOYMENT WITH ADDRESS EXPORT ===\n");

    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const sentinel = signers[5];

    console.log("Deploying from:", deployer.address);
    console.log("---\n");

    // Deploy all contracts
    console.log("📦 Deploying Contracts...");

    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy(getGasConfig());
    await verifier.waitForDeployment();
    console.log("✅ Verifier deployed");

    const MockIdentityRegistry = await ethers.getContractFactory("MockIdentityRegistry");
    const identityRegistry = await MockIdentityRegistry.deploy(getGasConfig());
    await identityRegistry.waitForDeployment();
    console.log("✅ IdentityRegistry deployed");

    const MockCoWSwap = await ethers.getContractFactory("MockCoWSwap");
    const cowSwap = await MockCoWSwap.deploy(getGasConfig());
    await cowSwap.waitForDeployment();
    console.log("✅ CoWSwap deployed");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", getGasConfig());
    await usdc.waitForDeployment();
    console.log("✅ USDC deployed");

    const BackstopPool = await ethers.getContractFactory("BackstopPool");
    const backstopPool = await BackstopPool.deploy(
        await usdc.getAddress(),
        await cowSwap.getAddress(),
        await identityRegistry.getAddress(),
        getGasConfig()
    );
    await backstopPool.waitForDeployment();
    console.log("✅ BackstopPool deployed");

    const AegisCore = await ethers.getContractFactory("AegisCore");
    const aegisCore = await AegisCore.deploy(
        await verifier.getAddress(),
        await identityRegistry.getAddress(),
        await backstopPool.getAddress(),
        sentinel.address,
        deployer.address,
        getGasConfig()
    );
    await aegisCore.waitForDeployment();
    console.log("✅ AegisCore deployed");

    const MockOracle = await ethers.getContractFactory("MockOracle");
    const oracle = await MockOracle.deploy(getGasConfig());
    await oracle.waitForDeployment();
    console.log("✅ MockOracle deployed");

    const AegisPool = await ethers.getContractFactory("AegisPool");
    const aegisPool = await AegisPool.deploy(
        await aegisCore.getAddress(),
        await usdc.getAddress(),
        await identityRegistry.getAddress(),
        await oracle.getAddress(),
        getGasConfig()
    );
    await aegisPool.waitForDeployment();
    console.log("✅ AegisPool deployed");

    const AegisLens = await ethers.getContractFactory("AegisLens");
    const aegisLens = await AegisLens.deploy(
        await identityRegistry.getAddress(),
        await oracle.getAddress(),
        getGasConfig()
    );
    await aegisLens.waitForDeployment();
    console.log("✅ AegisLens deployed");

    // Wire up
    await backstopPool.setAegisCore(await aegisCore.getAddress(), getGasConfig());
    console.log("✅ Contracts wired up\n");

    // Collect addresses
    const addresses = {
        AegisCore: await aegisCore.getAddress(),
        AegisPool: await aegisPool.getAddress(),
        BackstopPool: await backstopPool.getAddress(),
        IdentityRegistry: await identityRegistry.getAddress(),
        AegisLens: await aegisLens.getAddress(),
        MockOracle: await oracle.getAddress(),
        USDC: await usdc.getAddress(),
        Verifier: await verifier.getAddress(),
    };

    // Print addresses
    console.log("📋 Deployed Addresses:");
    console.log("=".repeat(60));
    Object.entries(addresses).forEach(([name, address]) => {
        console.log(`${name.padEnd(20)}: ${address}`);
    });
    console.log("=".repeat(60));

    // Save to frontend config
    const frontendConfigPath = path.join(
        __dirname,
        '../../frontend-cockpit/app/config/addresses.ts'
    );

    try {
        let configContent = fs.readFileSync(frontendConfigPath, 'utf8');

        // Create the new contracts block
        const newContractsBlock = `contracts: {
        AegisCore: "${addresses.AegisCore}",
        AegisPool: "${addresses.AegisPool}",
        BackstopPool: "${addresses.BackstopPool}",
        IdentityRegistry: "${addresses.IdentityRegistry}",
        AegisLens: "${addresses.AegisLens}",
        MockOracle: "${addresses.MockOracle}",
        USDC: "${addresses.USDC}",
        Verifier: "${addresses.Verifier}",
    }`;

        // 1. Update MAINNET_FORK_CONFIG
        configContent = configContent.replace(
            /(export const MAINNET_FORK_CONFIG[\s\S]*?contracts: \{)[^}]*(\})/s,
            `$1\n${Object.entries(addresses).map(([k, v]) => `        ${k}: "${v}",`).join('\n')}\n    $2`
        );

        // 2. Update LOCALHOST_CONFIG
        configContent = configContent.replace(
            /(export const LOCALHOST_CONFIG[\s\S]*?contracts: \{)[^}]*(\})/s,
            `$1\n${Object.entries(addresses).map(([k, v]) => `        ${k}: "${v}",`).join('\n')}\n    $2`
        );


        fs.writeFileSync(frontendConfigPath, configContent);
        console.log("\n✨ Addresses saved to frontend config!");
        console.log(`   ${frontendConfigPath}`);
    } catch (error) {
        console.error("\n⚠️  Failed to update frontend config:", error);
        console.log("   Please manually update addresses.ts with the addresses above");
    }

    console.log("\n🎉 Deployment complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the frontend: cd packages/frontend-cockpit && npm run dev");
    console.log("   2. Connect your wallet to http://localhost:3000");
    console.log("   3. The dashboard will now show real blockchain data!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
