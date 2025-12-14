import hre from "hardhat";

async function main() {
    console.log("\n💰 === COMPLETE ACCOUNT SETUP ===\n");

    // Get signers
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];

    // Known Binance Hot Wallet with lots of ETH
    const whaleAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC";

    console.log("Step 1: Get 10,000 ETH from mainnet whale");
    console.log("═══════════════════════════════════════════════════════════\n");

    // Impersonate whale and get massive funds
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whaleAddress],
    });
    const whaleSigner = await hre.ethers.getSigner(whaleAddress);

    const balBefore = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance before: ${hre.ethers.formatEther(balBefore)} ETH`);

    const tx = await whaleSigner.sendTransaction({
        to: deployer.address,
        value: hre.ethers.parseEther("10000.0"),
        maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
        maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
    });
    await tx.wait();

    const balAfter = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance after:  ${hre.ethers.formatEther(balAfter)} ETH`);
    console.log(`✅ Received 10,000 ETH from whale\n`);

    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [whaleAddress],
    });

    // Now fund all accounts
    console.log("Step 2: Fund named accounts");
    console.log("═══════════════════════════════════════════════════════════\n");

    const rookie = signers[1];
    const ancientOne = signers[2];
    const whale = signers[3];
    const cleanSheet = signers[4];
    const sentinel = signers[5];

    const accounts = [
        { name: "The Rookie", signer: rookie, amount: "500" },
        { name: "The Ancient One", signer: ancientOne, amount: "1000" },
        { name: "The Whale", signer: whale, amount: "5000" },
        { name: "Clean Sheet", signer: cleanSheet, amount: "900" },
        { name: "Sentinel", signer: sentinel, amount: "1000" },
    ];

    for (const account of accounts) {
        const fundTx = await deployer.sendTransaction({
            to: account.signer.address,
            value: hre.ethers.parseEther(account.amount),
            maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
        });
        await fundTx.wait();

        const balance = await hre.ethers.provider.getBalance(account.signer.address);
        console.log(`✅ ${account.name.padEnd(20)} ${hre.ethers.formatEther(balance)} ETH`);
    }

    console.log("\n🎉 All accounts funded successfully!\n");

    console.log("📋 Final Account Summary:");
    console.log("═══════════════════════════════════════════════════════════");
    for (const account of accounts) {
        const balance = await hre.ethers.provider.getBalance(account.signer.address);
        console.log(`${account.name.padEnd(20)} ${account.signer.address}`);
        console.log(`${' '.repeat(20)} ${hre.ethers.formatEther(balance)} ETH\n`);
    }
    console.log("═══════════════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
