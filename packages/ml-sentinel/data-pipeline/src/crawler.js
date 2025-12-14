/**
 * Aegis Protocol - Sentinel Layer
 * Main Crawler Entry Point
 * 
 * Production-ready modular scraper for market depth analysis.
 * Outputs data to JSON/CSV for LSTM model consumption.
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Import modular components
const { scrapeOrderBook, logExtractionStats } = require('./parsers');
const {
    calculateMidPrice,
    filterOrdersByThreshold,
    calculateTotalVolume,
    calculateBLR,
    formatTimestamp,
    generateCriticalWarning,
    validateOrders
} = require('./utils');

// Configuration
const CONFIG = {
    TARGET_URL: process.env.TARGET_URL || "https://www.binance.com/en/trade/ETH_USDC?type=spot",
    BLR_THRESHOLD: parseFloat(process.env.BLR_THRESHOLD) || 0.4,
    PRICE_DELTA: parseFloat(process.env.PRICE_DELTA) || 0.02,
    WAIT_FOR_ORDERS: parseInt(process.env.WAIT_FOR_ORDERS) || 10000,
    HEADLESS: process.env.HEADLESS !== 'false',
    SCRAPE_INTERVAL: parseInt(process.env.SCRAPE_INTERVAL) || 60000,
    OUTPUT_DIR: path.join(__dirname, '..', 'data'),
    OUTPUT_JSON: path.join(__dirname, '..', 'data', 'market_depth.json'),
    OUTPUT_CSV: path.join(__dirname, '..', 'data', 'market_depth.csv')
};

/**
 * Ensure output directory exists
 */
async function ensureOutputDirectory() {
    try {
        await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating output directory:', error.message);
    }
}

/**
 * Append data to JSON file
 * @param {Object} data - Market depth data to append
 */
async function appendToJSON(data) {
    try {
        let existingData = [];

        // Read existing data if file exists
        try {
            const fileContent = await fs.readFile(CONFIG.OUTPUT_JSON, 'utf-8');
            existingData = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist or is empty, start fresh
            existingData = [];
        }

        // Append new data
        existingData.push(data);

        // Write back to file
        await fs.writeFile(CONFIG.OUTPUT_JSON, JSON.stringify(existingData, null, 2));
        console.log(`✅ Data appended to ${CONFIG.OUTPUT_JSON}`);

    } catch (error) {
        console.error('Error writing to JSON:', error.message);
    }
}

/**
 * Append data to CSV file
 * @param {Object} data - Market depth data to append
 */
async function appendToCSV(data) {
    try {
        let csvContent = '';
        let fileExists = false;

        // Check if file exists
        try {
            await fs.access(CONFIG.OUTPUT_CSV);
            fileExists = true;
        } catch (error) {
            // File doesn't exist
        }

        // Add header if file doesn't exist
        if (!fileExists) {
            csvContent = 'timestamp,blr,buy_volume,sell_volume,mid_price,alert_triggered\n';
        }

        // Append data row
        csvContent += `${data.timestamp},${data.blr},${data.buyVolume},${data.sellVolume},${data.midPrice},${data.alertTriggered}\n`;

        // Append to file
        await fs.appendFile(CONFIG.OUTPUT_CSV, csvContent);
        console.log(`✅ Data appended to ${CONFIG.OUTPUT_CSV}`);

    } catch (error) {
        console.error('Error writing to CSV:', error.message);
    }
}

/**
 * Save market depth data to both JSON and CSV
 * @param {Object} marketData - Market depth data
 */
async function saveMarketData(marketData) {
    await Promise.all([
        appendToJSON(marketData),
        appendToCSV(marketData)
    ]);
}

/**
 * Process market depth data and calculate BLR
 * @param {Array} buyOrders - Buy orders
 * @param {Array} sellOrders - Sell orders
 * @returns {Object|null} Market depth data
 */
function processMarketDepth(buyOrders, sellOrders) {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 SENTINEL: Market Depth Analysis Started");
    console.log("=".repeat(60));
    console.log(`⏰ Timestamp: ${formatTimestamp()}`);
    console.log(`🔗 Target: ETH/USDC Spot Market (Binance)`);

    try {
        // Validate orders
        if (!validateOrders(buyOrders) || !validateOrders(sellOrders)) {
            console.error("❌ Failed to extract valid order book data");
            console.log("💡 Tip: DOM structure may have changed or page didn't load properly");
            return null;
        }

        // Calculate mid-price
        const midPrice = calculateMidPrice(buyOrders, sellOrders);
        console.log(`📊 Mid-Price: $${midPrice.toFixed(2)}`);

        // Filter orders within 2% threshold
        const filteredBuyOrders = filterOrdersByThreshold(buyOrders, midPrice, true, CONFIG.PRICE_DELTA);
        const filteredSellOrders = filterOrdersByThreshold(sellOrders, midPrice, false, CONFIG.PRICE_DELTA);

        console.log(`🔍 Filtered BUY orders: ${filteredBuyOrders.length}/${buyOrders.length}`);
        console.log(`🔍 Filtered SELL orders: ${filteredSellOrders.length}/${sellOrders.length}`);

        // Calculate total volumes
        const buyVolume = calculateTotalVolume(filteredBuyOrders);
        const sellVolume = calculateTotalVolume(filteredSellOrders);

        // Calculate BLR
        const blr = calculateBLR(buyVolume, sellVolume);

        console.log(`\n📈 Buy-Side Liquidity Ratio (BLR): ${blr.toFixed(4)}`);
        console.log(`   Buy Volume: ${buyVolume.toFixed(2)} ETH`);
        console.log(`   Sell Volume: ${sellVolume.toFixed(2)} ETH`);

        // Check trigger condition
        const alertTriggered = blr < CONFIG.BLR_THRESHOLD && blr > 0;

        if (alertTriggered) {
            // Generate formatted WARNING for Python grep
            const warning = generateCriticalWarning(blr, CONFIG.BLR_THRESHOLD);
            console.error(warning);

            // Also log to console with visual alert
            console.log("\n" + "=".repeat(60));
            console.log("🚨 ALERT: CRITICAL MARKET CONDITIONS DETECTED!");
            console.log("=".repeat(60));
            console.log(`⚠️ BLR: ${blr.toFixed(4)} (< ${CONFIG.BLR_THRESHOLD})`);
            console.log(`📉 Support dropped below ${CONFIG.BLR_THRESHOLD * 100}% threshold`);
            console.log(`🤖 LSTM Pipeline should be triggered`);
            console.log("=".repeat(60) + "\n");
        } else if (blr > 0) {
            console.log(`\n✅ Market stable (BLR: ${blr.toFixed(4)} >= ${CONFIG.BLR_THRESHOLD})`);
        }

        console.log("\n" + "=".repeat(60));
        console.log("✅ Market Depth Analysis Completed");
        console.log("=".repeat(60) + "\n");

        // Return structured data for persistence
        return {
            timestamp: formatTimestamp(),
            blr: parseFloat(blr.toFixed(4)),
            buyVolume: parseFloat(buyVolume.toFixed(2)),
            sellVolume: parseFloat(sellVolume.toFixed(2)),
            midPrice: parseFloat(midPrice.toFixed(2)),
            alertTriggered,
            rawOrders: {
                buyCount: buyOrders.length,
                sellCount: sellOrders.length,
                filteredBuyCount: filteredBuyOrders.length,
                filteredSellCount: filteredSellOrders.length
            }
        };

    } catch (error) {
        console.error("❌ Error during market depth processing:", error);
        console.error(error.stack);
        return null;
    }
}

/**
 * Main scraping function
 */
async function runScraper() {
    console.log("🚀 Starting Sentinel Crawler (Production Mode)...\n");

    let browser;
    try {
        // Ensure output directory exists
        await ensureOutputDirectory();

        // Launch browser
        console.log("🌐 Launching browser...");
        browser = await puppeteer.launch({
            headless: CONFIG.HEADLESS,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`🔗 Navigating to ${CONFIG.TARGET_URL}...`);
        await page.goto(CONFIG.TARGET_URL, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log("✅ Page loaded successfully");

        // Scrape order book
        const { buyOrders, sellOrders } = await scrapeOrderBook(page, CONFIG.WAIT_FOR_ORDERS);
        logExtractionStats(buyOrders, sellOrders);

        // Process the data
        const marketData = processMarketDepth(buyOrders, sellOrders);

        // Save to JSON and CSV if data is valid
        if (marketData) {
            await saveMarketData(marketData);
        }

        // Close browser
        await browser.close();
        console.log("✅ Browser closed\n");

    } catch (error) {
        console.error("❌ Scraper error:", error.message);
        console.error(error.stack);

        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Main entry point
 */
async function main() {
    console.log("=".repeat(60));
    console.log("AEGIS PROTOCOL - SENTINEL LAYER");
    console.log("Intelligence Pipeline - Market Depth Scraper");
    console.log("=".repeat(60));
    console.log(`📁 Output Directory: ${CONFIG.OUTPUT_DIR}`);
    console.log(`📊 JSON Output: ${CONFIG.OUTPUT_JSON}`);
    console.log(`📈 CSV Output: ${CONFIG.OUTPUT_CSV}`);
    console.log(`⚠️ BLR Threshold: ${CONFIG.BLR_THRESHOLD}`);
    console.log(`📏 Price Delta: ${CONFIG.PRICE_DELTA * 100}%`);
    console.log("=".repeat(60) + "\n");

    // Run once
    await runScraper();

    // Optional: Periodic scraping (controlled by environment variable)
    if (process.env.ENABLE_PERIODIC_SCRAPING === 'true') {
        console.log(`⏱️ Periodic scraping enabled (every ${CONFIG.SCRAPE_INTERVAL / 1000} seconds)\n`);
        setInterval(async () => {
            console.log("\n🔄 Initiating periodic scrape...");
            await runScraper();
        }, CONFIG.SCRAPE_INTERVAL);
    }
}

// Run the scraper
if (require.main === module) {
    main().catch(console.error);
}

// Export for testing/external use
module.exports = {
    runScraper,
    processMarketDepth,
    CONFIG
};
