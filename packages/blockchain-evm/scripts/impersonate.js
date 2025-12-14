import hre from "hardhat";

async function main() {
    console.log("\n🐳 === WHALE IMPERSONATION SCRIPT ===\n");

    // 1. Setup Accounts
    const [mySigner] = await hre.ethers.getSigners();
    const myAddress = mySigner.address;

    // Known Binance Hot Wallet with lots of ETH
    const whaleAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC";

    console.log(`Targeting Whale: ${whaleAddress}`);
    console.log(`Beneficiary:     ${myAddress}\n`);

    // 2. Check Initial Balance
    const balStart = await hre.ethers.provider.getBalance(myAddress);
    console.log(`💰 Initial Balance: ${hre.ethers.formatEther(balStart)} ETH`);

    // 3. Impersonate the Whale
    console.log(`\n🎭 Impersonating whale account...`);
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whaleAddress],
    });
    const whaleSigner = await hre.ethers.getSigner(whaleAddress);

    // 4. Send the Money (100 ETH)
    console.log(`💸 Sending 100 ETH from whale to ${myAddress}...`);

    // When forking mainnet, we need to set gas fees manually
    const tx = await whaleSigner.sendTransaction({
        to: myAddress,
        value: hre.ethers.parseEther("100.0"),
        maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
        maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
    });

    console.log(`⏳ Waiting for transaction: ${tx.hash}`);
    await tx.wait();

    // 5. Verify
    const balEnd = await hre.ethers.provider.getBalance(myAddress);
    console.log(`\n💰 Final Balance:   ${hre.ethers.formatEther(balEnd)} ETH`);
    console.log(`📈 Gained:          ${hre.ethers.formatEther(balEnd - balStart)} ETH`);
    console.log(`\n✅ Success! You now have whale-level funds for testing.\n`);

    // 6. Stop impersonation
    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [whaleAddress],
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
