import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("=== AEGIS PROTOCOL: HOLLYWOOD DEPLOYMENT ===\n");

    // 1. Signer Allocation
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const rookie = signers[1];      // "The Rookie"
    const ancientOne = signers[2];  // "The Ancient One"
    const whale = signers[3];       // "The Whale"
    const cleanSheet = signers[4];  // "Clean Sheet"
    const sentinel = signers[5];    // "Sentinel"

    console.log("--- DEPLOYING CONTRACTS ---");

    // 2. Deploy Logic
    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    const MockIdentityRegistry = await ethers.getContractFactory("MockIdentityRegistry");
    const identityRegistry = await MockIdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    const MockCoWSwap = await ethers.getContractFactory("MockCoWSwap");
    const cowSwap = await MockCoWSwap.deploy();
    await cowSwap.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC");
    await usdc.waitForDeployment();

    // 3. Deploy Core
    const BackstopPool = await ethers.getContractFactory("BackstopPool");
    const backstopPool = await BackstopPool.deploy(
        await usdc.getAddress(),
        await cowSwap.getAddress(),
        await identityRegistry.getAddress()
    );
    await backstopPool.waitForDeployment();
    const backstopAddress = await backstopPool.getAddress();

    const AegisCore = await ethers.getContractFactory("AegisCore");
    const aegisCore = await AegisCore.deploy(
        await verifier.getAddress(),
        await identityRegistry.getAddress(),
        backstopAddress,
        sentinel.address,
        deployer.address // Deployer as Governor for demo setup ease
    );
    await aegisCore.waitForDeployment();
    const aegisAddress = await aegisCore.getAddress();

    // 2b. Deploy Oracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const oracle = await MockOracle.deploy();
    await oracle.waitForDeployment();
    console.log("MockOracle Deployed");

    // 2c. Deploy Aegis Pool (Lending Market)
    const AegisPool = await ethers.getContractFactory("AegisPool");
    const aegisPool = await AegisPool.deploy(
        await aegisCore.getAddress(),
        await usdc.getAddress(),
        await identityRegistry.getAddress(),
        await oracle.getAddress()
    );
    await aegisPool.waitForDeployment();
    console.log(`AegisPool (Lending Market) Deployed to: ${await aegisPool.getAddress()}`);

    // 4. Wire Up
    await backstopPool.setAegisCore(await aegisCore.getAddress());
    console.log(`IdentityRegistry: ${await identityRegistry.getAddress()}`);
    console.log(`AegisCore: ${aegisAddress}`);
    console.log(`BackstopPool: ${backstopAddress}\n`);

    // 5. Configure Personas (Mock Setup)
    console.log("--- CONFIGURING PERSONAS ---");

    // Assign Badges
    await identityRegistry.setMockBadge(rookie.address, "Default");
    await identityRegistry.setMockBadge(ancientOne.address, "Ancient One");
    await identityRegistry.setMockBadge(whale.address, "Whale");
    await identityRegistry.setMockBadge(cleanSheet.address, "Clean Sheet");

    // Custom "Hollywood" Funding
    console.log("--- FUNDING PERSONAS (HOLLYWOOD STYLE) ---");
    const toHex = (amt) => "0x" + (BigInt(amt) * 10n ** 18n).toString(16);

    // The Whale: 200,000 ETH (2 Lakhs)
    await ethers.provider.send("hardhat_setBalance", [
        whale.address,
        toHex(200000),
    ]);
    console.log(`Verified: The Whale balance set to 200,000 ETH`);

    // The Ancient One: 1,000 ETH
    await ethers.provider.send("hardhat_setBalance", [
        ancientOne.address,
        toHex(1000),
    ]);
    console.log(`Verified: The Ancient One balance set to 1,000 ETH`);

    // The Rookie: 700 ETH
    await ethers.provider.send("hardhat_setBalance", [
        rookie.address,
        toHex(700),
    ]);
    console.log(`Verified: The Rookie balance set to 700 ETH`);

    // Clean Sheet: 500 ETH
    await ethers.provider.send("hardhat_setBalance", [
        cleanSheet.address,
        toHex(500),
    ]);
    console.log(`Verified: Clean Sheet balance set to 500 ETH`);

    // Fund Sponge
    const debtAmount = ethers.parseUnits("1000000", 18); // 1M USDC
    await usdc.mint(backstopAddress, debtAmount);
    console.log("Sponge Funded with 1,000,000 MockUSDC");


    // 6. The "Cheat Sheet" Output
    console.log("\n=== IDENTITY PERSONAS CHEAT SHEET ===");
    console.log("(Import these specific Private Keys into MetaMask for the Demo)");

    // Private keys for default Hardhat Network accounts
    // Note: These are standard well-known keys for Hardhat.
    const privateKeys = [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account 0 (Deployer)
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account 1 (Rookie)
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account 2 (Ancient One)
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account 3 (Whale)
        "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account 4 (Clean Sheet)
        "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffbb"  // Account 5 (Sentinel)
    ];

    const tableData = [
        { Role: "DEPLOYER (Admin)", Address: deployer.address, Badge: "N/A", PrivateKey: privateKeys[0] },
        { Role: "THE ROOKIE", Address: rookie.address, Badge: "Default", PrivateKey: privateKeys[1] },
        { Role: "THE ANCIENT ONE", Address: ancientOne.address, Badge: "Ancient One", PrivateKey: privateKeys[2] },
        { Role: "THE WHALE", Address: whale.address, Badge: "Whale", PrivateKey: privateKeys[3] },
        { Role: "CLEAN SHEET", Address: cleanSheet.address, Badge: "Clean Sheet", PrivateKey: privateKeys[4] },
        { Role: "SENTINEL (AI)", Address: sentinel.address, Badge: "N/A", PrivateKey: privateKeys[5] },
    ];

    console.table(tableData, ["Role", "Address", "Badge", "PrivateKey"]);

    console.log("\n=== DEPLOYMENT COMPLETE ===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
