import hre from "hardhat";

async function main() {
    console.log("\n💰 === FUNDING NAMED ACCOUNTS ===\n");

    // Get signers (same as deploy.js)
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];      // Has 10,100 ETH from whale impersonation
    const rookie = signers[1];         // "The Rookie"
    const ancientOne = signers[2];     // "The Ancient One"
    const whale = signers[3];          // "The Whale"
    const cleanSheet = signers[4];     // "Clean Sheet"
    const sentinel = signers[5];       // "Sentinel"

    const accounts = [
        { name: "The Rookie", signer: rookie, amount: "500" },
        { name: "The Ancient One", signer: ancientOne, amount: "1000" },
        { name: "The Whale", signer: whale, amount: "5000" }, // Reduced from 500k
        { name: "Clean Sheet", signer: cleanSheet, amount: "900" },
        { name: "Sentinel", signer: sentinel, amount: "1000" },
    ];

    console.log(`Funding from deployer: ${deployer.address}`);
    const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${hre.ethers.formatEther(deployerBalance)} ETH\n`);

    for (const account of accounts) {
        const balanceBefore = await hre.ethers.provider.getBalance(account.signer.address);

        console.log(`💸 Funding ${account.name} (${account.signer.address})`);
        console.log(`   Before: ${hre.ethers.formatEther(balanceBefore)} ETH`);

        // Send ETH
        const tx = await deployer.sendTransaction({
            to: account.signer.address,
            value: hre.ethers.parseEther(account.amount),
            maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
        });

        await tx.wait();

        const balanceAfter = await hre.ethers.provider.getBalance(account.signer.address);
        console.log(`   After:  ${hre.ethers.formatEther(balanceAfter)} ETH`);
        console.log(`   ✅ Sent ${account.amount} ETH\n`);
    }

    console.log("🎉 All accounts funded successfully!\n");

    console.log("📋 Account Summary:");
    console.log("═══════════════════════════════════════════════════════════");
    for (const account of accounts) {
        const balance = await hre.ethers.provider.getBalance(account.signer.address);
        console.log(`${account.name.padEnd(20)} ${account.signer.address} ${hre.ethers.formatEther(balance)} ETH`);
    }
    console.log("═══════════════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
