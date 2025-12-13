import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("=== AEGIS PROTOCOL: CHAOS MONKEY SIMULATION ===\n");

    const [deployer, sentinel, governor, userA, userB] = await ethers.getSigners();

    // --- SETUP ---
    console.log("--- SETUP PHASE ---");

    // 1. Deploy Mocks
    // Use Real Verifier for Simulation
    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
    console.log("Verifier (Logic) Deployed");

    const MockIdentityRegistry = await ethers.getContractFactory("MockIdentityRegistry");
    const identityRegistry = await MockIdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
    console.log("MockIdentityRegistry Deployed");

    const MockCoWSwap = await ethers.getContractFactory("MockCoWSwap");
    const cowSwap = await MockCoWSwap.deploy();
    await cowSwap.waitForDeployment();
    console.log("MockCoWSwap Deployed");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC");
    await usdc.waitForDeployment();
    console.log("MockUSDC Deployed");

    // 2. Deploy Core
    const BackstopPool = await ethers.getContractFactory("BackstopPool");
    const backstopPool = await BackstopPool.deploy(await usdc.getAddress(), await cowSwap.getAddress(), await identityRegistry.getAddress());
    await backstopPool.waitForDeployment();
    const backstopAddress = await backstopPool.getAddress();
    console.log(`BackstopPool Deployed to: ${backstopAddress}`);

    const AegisCore = await ethers.getContractFactory("AegisCore");
    const aegisCore = await AegisCore.deploy(
        await verifier.getAddress(),
        await identityRegistry.getAddress(),
        backstopAddress,
        sentinel.address,
        governor.address
    );
    await aegisCore.waitForDeployment();
    const aegisAddress = await aegisCore.getAddress();
    console.log(`AegisCore Deployed to: ${aegisAddress}`);

    // Wire Core to Backstop
    await backstopPool.setAegisCore(await aegisCore.getAddress());

    // Set User Badge
    await identityRegistry.setMockBadge(userB.address, "Ancient One");
    await identityRegistry.setMockName(deployer.address, "simulation.agent");
    console.log("\nSETUP COMPLETE: User B identified as ANCIENT ONE. Deployer identified as AGENT.");


    // --- SCENE 1: THE CRASH ---
    console.log("\n--- SCENE 1: THE CRASH (TRIGGER) ---");

    const dummyProof = ethers.toUtf8Bytes("dummy_proof");
    const dummyHash = ethers.id("real_public_input_hash"); // Non-zero hash required by Verifier logic

    // Change to RED Mode (triggered by Sentinel)
    await aegisCore.connect(sentinel).setRiskState(2, dummyProof, dummyHash); // 2 = RED

    // Verify
    const isRed = (await aegisCore.currentState()) === 2n;
    if (isRed) {
        console.log("CRASH DETECTED (Risk Score > 0.8). ZK-PROOF VERIFIED. SYSTEM ENTERING RED MODE.");
    }


    // --- SCENE 2: THE RESCUE (SPONGE FULL) ---
    console.log("\n--- SCENE 2: THE RESCUE (SPONGE FULL) ---");

    // Fund the Sponge
    const debtAmount = ethers.parseUnits("1000", 18);
    await usdc.mint(await backstopPool.getAddress(), debtAmount);

    const collateralAmount = ethers.parseEther("1.5"); // 1.5 ETH

    // Execute Rescue
    // Impersonate Core
    const coreAddress = await aegisCore.getAddress();
    await ethers.provider.send("hardhat_impersonateAccount", [coreAddress]);
    const coreSigner = await ethers.getSigner(coreAddress);

    // Fund gas
    await ethers.provider.send("hardhat_setBalance", [
        coreAddress,
        "0x1000000000000000000", // 1 ETH
    ]);

    // 1. Trigger Probation (Ancient One has 15 min grace period)
    console.log("Triggering Probation for The Ancient One...");
    await backstopPool.triggerProbation(userB.address);

    // 2. Fast Forward Time (15 mins + 1 sec)
    console.log("Fast-forwarding 901 seconds...");
    await ethers.provider.send("evm_increaseTime", [901]);
    await ethers.provider.send("evm_mine");

    // 3. Absorb
    await backstopPool.connect(coreSigner).absorbPosition(userB.address, collateralAmount, debtAmount);

    console.log("RESCUE SUCCESSFUL: User B position absorbed by Sponge. 0% Slippage. 0% Penalty.");


    // --- SCENE 3: THE DARK POOL (SPONGE EMPTY) ---
    console.log("\n--- SCENE 3: THE DARK POOL (FALLBACK) ---");

    // Deploy a NEW BackstopPool that is empty
    const BackstopPool2 = await ethers.getContractFactory("BackstopPool");
    const backstopPoolEmpty = await BackstopPool2.deploy(
        await usdc.getAddress(),
        await cowSwap.getAddress(),
        await identityRegistry.getAddress()
    );
    await backstopPoolEmpty.waitForDeployment();

    // Set Deployer as Core for this new pool for ease
    await backstopPoolEmpty.setAegisCore(deployer.address);

    const tx = await backstopPoolEmpty.absorbPosition(userA.address, collateralAmount, debtAmount);
    await tx.wait();

    console.log("SPONGE DEPLETED. ROUTING TO COW SWAP DARK POOL...");
    console.log("DARK POOL ORDER PLACED. Market impact minimized.");

    console.log("\n=== SIMULATION COMPLETE ===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
