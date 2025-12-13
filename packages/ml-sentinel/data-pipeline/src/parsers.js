/**
 * Aegis Protocol - Sentinel Layer
 * DOM Parsing Logic for Order Book Extraction
 * 
 * This module handles all DOM parsing and data extraction from Binance.
 */

/**
 * Extract order book data from Binance page using Puppeteer
 * @param {Page} page - Puppeteer page instance
 * @param {number} waitTime - Time to wait for order book (ms)
 * @returns {Promise<{buyOrders: Array, sellOrders: Array}>}
 */
async function scrapeOrderBook(page, waitTime = 10000) {
    console.log("\n🔎 Extracting order book data from page...");

    // Wait for the order book to load
    try {
        await page.waitForSelector('[class*="bid"], [class*="ask"], .orderbook, [class*="orderbook"]', {
            timeout: waitTime
        });

        // Give extra time for data to populate
        await page.waitForTimeout(3000);

    } catch (error) {
        console.warn("⚠️ Timeout waiting for order book elements");
    }

    // Extract order data in browser context
    const orderData = await page.evaluate(() => {
        const buyOrders = [];
        const sellOrders = [];

        /**
         * Strategy 1: Table-based extraction (most common)
         */
        const extractFromTables = () => {
            const bidRows = document.querySelectorAll('[class*="bid"], [class*="Bid"], .bids tr, [data-side="BUY"]');
            const askRows = document.querySelectorAll('[class*="ask"], [class*="Ask"], .asks tr, [data-side="SELL"]');

            // Process buy orders
            bidRows.forEach(row => {
                try {
                    const cells = row.querySelectorAll('td, div, span');
                    if (cells.length >= 2) {
                        const priceText = cells[0]?.textContent || '';
                        const volumeText = cells[1]?.textContent || '';

                        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                        const volume = parseFloat(volumeText.replace(/[^0-9.]/g, ''));

                        if (!isNaN(price) && !isNaN(volume) && price > 0 && volume > 0) {
                            buyOrders.push({ price, volume });
                        }
                    }
                } catch (e) {
                    // Skip invalid rows
                }
            });

            // Process sell orders
            askRows.forEach(row => {
                try {
                    const cells = row.querySelectorAll('td, div, span');
                    if (cells.length >= 2) {
                        const priceText = cells[0]?.textContent || '';
                        const volumeText = cells[1]?.textContent || '';

                        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                        const volume = parseFloat(volumeText.replace(/[^0-9.]/g, ''));

                        if (!isNaN(price) && !isNaN(volume) && price > 0 && volume > 0) {
                            sellOrders.push({ price, volume });
                        }
                    }
                } catch (e) {
                    // Skip invalid rows
                }
            });
        };

        /**
         * Strategy 2: General extraction by color/pattern
         */
        const extractByPattern = () => {
            const allElements = document.querySelectorAll('*');

            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                const priceMatch = text.match(/\$?\d{1,5}\.\d{2,4}/);

                if (priceMatch && el.children.length === 0) {
                    const price = parseFloat(priceMatch[0].replace('$', ''));

                    if (price > 1000 && price < 10000) {
                        const parent = el.parentElement;
                        const siblings = parent?.children || [];

                        for (let sibling of siblings) {
                            const siblingText = sibling.textContent?.trim() || '';
                            const volumeMatch = siblingText.match(/\d+\.\d{2,8}/);

                            if (volumeMatch && sibling !== el) {
                                const volume = parseFloat(volumeMatch[0]);

                                if (volume < 1000) {
                                    const style = window.getComputedStyle(el);
                                    const color = style.color;

                                    // Green = buy, Red = sell
                                    if (color.includes('rgb(14, 203, 129)') || color.includes('green')) {
                                        buyOrders.push({ price, volume });
                                    } else if (color.includes('rgb(246, 70, 93)') || color.includes('red')) {
                                        sellOrders.push({ price, volume });
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };

        // Try table extraction first
        extractFromTables();

        // If insufficient data, try pattern extraction
        if (buyOrders.length < 5 || sellOrders.length < 5) {
            extractByPattern();
        }

        return { buyOrders, sellOrders };
    });

    return orderData;
}

/**
 * Display sample orders for debugging
 * @param {Array} orders - Orders to display
 * @param {string} type - Order type ('BUY' or 'SELL')
 * @param {number} count - Number of samples to show
 */
function displaySampleOrders(orders, type, count = 3) {
    if (orders.length > 0) {
        console.log(`   Sample ${type} orders (first ${count}):`);
        orders.slice(0, count).forEach((order, idx) => {
            console.log(`   ${idx + 1}. Price: $${order.price.toFixed(2)}, Volume: ${order.volume.toFixed(4)} ETH`);
        });
    }
}

/**
 * Log extraction statistics
 * @param {Array} buyOrders - Buy orders
 * @param {Array} sellOrders - Sell orders
 */
function logExtractionStats(buyOrders, sellOrders) {
    console.log(`✅ Extracted ${buyOrders.length} BUY orders`);
    console.log(`✅ Extracted ${sellOrders.length} SELL orders`);

    displaySampleOrders(buyOrders, 'BUY');
    displaySampleOrders(sellOrders, 'SELL');
}

module.exports = {
    scrapeOrderBook,
    displaySampleOrders,
    logExtractionStats
};
