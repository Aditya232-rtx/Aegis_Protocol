import hre from "hardhat";

async function main() {
    console.log("\n💼 === COMPLETE POSITION SETUP ===\n");

    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    const rookie = signers[1];
    const ancientOne = signers[2];
    const whale = signers[3];
    const cleanSheet = signers[4];

    // Get contracts
    const aegisPoolAddress = "0xFE92134da38df8c399A90a540f20187D19216E05";
    const usdcAddress = "0x64079a2Edd1104a2323E2b732A1244BCE011B1F5";

    const aegisPool = await hre.ethers.getContractAt("AegisPool", aegisPoolAddress);
    const usdc = await hre.ethers.getContractAt("MockERC20", usdcAddress);

    const gasConfig = {
        maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
        maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
    };

    // Step 1: Fund AegisPool AND BackstopPool with USDC
    console.log("Step 1: Funding Pools with USDC");
    console.log("═".repeat(60));
    const amount = hre.ethers.parseUnits("1000000", 18); // 1M USDC
    await usdc.mint(aegisPoolAddress, amount);
    console.log("✅ Minted 1,000,000 USDC to AegisPool");

    // Fund Backstop for Rescue
    // BACKSTOP ADDRESS HAS CHANGED AFTER DEPLOYMENT, WE NEED TO GET IT DYNAMICALLY?
    // Users provided Backstop address hardcoded? No, we need fresh address.
    // Assuming deploy-and-export ran, we can import it? 
    // Or just query it from deployer console log.
    // For now, I'll rely on hardcoded for this tool call, BUT I need to fetch it.
    // Actually, setup-positions.js gets contracts. 
    // Let's add Backstop fetching.

    // Backstop was 0xeA8AE08513f8230cAA8d031D28cB4Ac8CE720c68 in last run
    const backstopAddress = "0x0Deeb4b6492C1a55Bb7C0555AaFf65fF6dC424B2";
    await usdc.mint(backstopAddress, amount);
    console.log("✅ Minted 1,000,000 USDC to BackstopPool\n");

    // Step 2: Set up positions for each account
    const accounts = [
        { signer: deployer, name: "Deployer", depositETH: "5", borrowUSDC: "5000" },
        { signer: rookie, name: "The Rookie", depositETH: "2", borrowUSDC: "3000" }, // HF ~1.33
        { signer: ancientOne, name: "The Ancient One", depositETH: "10", borrowUSDC: "15000" },
        { signer: whale, name: "The Whale", depositETH: "50", borrowUSDC: "75000" },
        { signer: cleanSheet, name: "Clean Sheet", depositETH: "3", borrowUSDC: "0" },
    ];

    console.log("Step 2: Setting up account positions");
    console.log("═".repeat(60));

    for (const account of accounts) {
        console.log(`\n📊 ${account.name} (${account.signer.address})`);

        try {
            // Deposit ETH
            console.log(`   💰 Depositing ${account.depositETH} ETH...`);
            const depositTx = await aegisPool.connect(account.signer).depositETH({
                value: hre.ethers.parseEther(account.depositETH),
                ...gasConfig
            });
            await depositTx.wait();

            // Borrow USDC (if specified)
            if (parseFloat(account.borrowUSDC) > 0) {
                console.log(`   💸 Borrowing ${account.borrowUSDC} USDC...`);
                const borrowAmount = hre.ethers.parseUnits(account.borrowUSDC, 18);
                const borrowTx = await aegisPool.connect(account.signer).borrowUSDC(
                    borrowAmount,
                    gasConfig
                );
                await borrowTx.wait();
            }

            // Get final position
            const collateral = await aegisPool.userCollateralETH(account.signer.address);
            const debt = await aegisPool.userDebtUSDC(account.signer.address);

            console.log(`   ✅ Collateral: ${hre.ethers.formatEther(collateral)} ETH`);
            console.log(`   ✅ Debt: ${hre.ethers.formatUnits(debt, 18)} USDC`);

        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
        }
    }

    console.log("\n\n📋 Final Summary:");
    console.log("═".repeat(60));
    console.log("Account              Collateral    Debt (USDC)");
    console.log("─".repeat(60));

    for (const account of accounts) {
        const collateral = await aegisPool.userCollateralETH(account.signer.address);
        const debt = await aegisPool.userDebtUSDC(account.signer.address);
        const collStr = `${hre.ethers.formatEther(collateral)} ETH`.padEnd(13);
        const debtStr = hre.ethers.formatUnits(debt, 18);
        console.log(`${account.name.padEnd(20)} ${collStr} ${debtStr}`);
    }
    console.log("═".repeat(60));
    console.log("\n✅ All positions ready! Connect wallet to see data.\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
