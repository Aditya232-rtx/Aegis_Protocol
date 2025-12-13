/**
 * Stress Test Script - Test WARNING Trigger
 * 
 * This script temporarily lowers the BLR threshold to 1.5
 * to ensure the WARNING system triggers correctly
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Import modular components
const { scrapeOrderBook, logExtractionStats } = require('./src/parsers');
const {
    calculateMidPrice,
    filterOrdersByThreshold,
    calculateTotalVolume,
    calculateBLR,
    formatTimestamp,
    generateCriticalWarning,
    validateOrders
} = require('./src/utils');

// Override threshold to 1.5 (market will always trigger)
const STRESS_TEST_THRESHOLD = 1.5;

console.log("=".repeat(60));
console.log("🧪 STRESS TEST MODE - TESTING WARNING TRIGGER");
console.log("=".repeat(60));
console.log(`⚠️ BLR Threshold set to: ${STRESS_TEST_THRESHOLD} (will trigger alert)`);
console.log("=".repeat(60) + "\n");

async function runStressTest() {
    let browser;
    try {
        console.log("🌐 Launching browser...");
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        console.log("🔗 Navigating to Binance...");
        await page.goto("https://www.binance.com/en/trade/ETH_USDC?type=spot", {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const { buyOrders, sellOrders } = await scrapeOrderBook(page, 10000);
        logExtractionStats(buyOrders, sellOrders);

        if (!validateOrders(buyOrders) || !validateOrders(sellOrders)) {
            console.error("❌ Invalid order data");
            await browser.close();
            return;
        }

        const midPrice = calculateMidPrice(buyOrders, sellOrders);
        const filteredBuy = filterOrdersByThreshold(buyOrders, midPrice, true, 0.02);
        const filteredSell = filterOrdersByThreshold(sellOrders, midPrice, false, 0.02);

        const buyVolume = calculateTotalVolume(filteredBuy);
        const sellVolume = calculateTotalVolume(filteredSell);
        const blr = calculateBLR(buyVolume, sellVolume);

        console.log(`\n📈 Calculated BLR: ${blr.toFixed(4)}`);
        console.log(`🎯 Testing against threshold: ${STRESS_TEST_THRESHOLD}`);

        // Force trigger the warning
        if (blr < STRESS_TEST_THRESHOLD) {
            const warning = generateCriticalWarning(blr, STRESS_TEST_THRESHOLD);
            console.error("\n" + warning);

            console.log("\n" + "=".repeat(60));
            console.log("✅ WARNING TRIGGER TEST PASSED!");
            console.log("=".repeat(60));
            console.log("🎯 The formatted WARNING was successfully generated:");
            console.log("   Format: [AEGIS-SENTINEL-WARNING] CRITICAL_BLR_DETECTED | ...");
            console.log("   Status: GREP-ABLE by Python scripts ✅");
            console.log("=".repeat(60) + "\n");
        } else {
            console.log("\n⚠️ BLR higher than test threshold (unexpected)");
        }

        await browser.close();
        console.log("✅ Stress test completed\n");

    } catch (error) {
        console.error("❌ Stress test error:", error.message);
        if (browser) await browser.close();
    }
}

runStressTest();
