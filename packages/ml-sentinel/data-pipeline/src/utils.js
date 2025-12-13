/**
 * Aegis Protocol - Sentinel Layer
 * Utility Functions for Market Depth Analysis
 * 
 * This module contains mathematical and formatting utilities.
 */

/**
 * Calculate the mid-price from best bid and ask
 * @param {Array<{price: number, volume: number}>} buyOrders - Buy orders
 * @param {Array<{price: number, volume: number}>} sellOrders - Sell orders
 * @returns {number} Mid-price
 */
function calculateMidPrice(buyOrders, sellOrders) {
    if (!buyOrders.length || !sellOrders.length) {
        console.warn("⚠️ Unable to calculate mid-price: insufficient order data");
        return 0;
    }

    const bestBid = Math.max(...buyOrders.map(order => order.price));
    const bestAsk = Math.min(...sellOrders.map(order => order.price));

    const midPrice = (bestBid + bestAsk) / 2;

    return midPrice;
}

/**
 * Filter orders within a percentage threshold of mid-price
 * @param {Array<{price: number, volume: number}>} orders - Orders to filter
 * @param {number} midPrice - Current mid-price
 * @param {boolean} isBuy - True for buy orders, false for sell orders
 * @param {number} delta - Percentage threshold (default 0.02 for 2%)
 * @returns {Array<{price: number, volume: number}>} Filtered orders
 */
function filterOrdersByThreshold(orders, midPrice, isBuy, delta = 0.02) {
    if (midPrice === 0) return [];

    const lowerBound = midPrice * (1 - delta);
    const upperBound = midPrice * (1 + delta);

    const filtered = orders.filter(order => {
        if (isBuy) {
            return order.price >= lowerBound && order.price <= midPrice;
        } else {
            return order.price >= midPrice && order.price <= upperBound;
        }
    });

    return filtered;
}

/**
 * Calculate total volume from orders
 * @param {Array<{price: number, volume: number}>} orders - Orders
 * @returns {number} Total volume
 */
function calculateTotalVolume(orders) {
    return orders.reduce((sum, order) => sum + order.volume, 0);
}

/**
 * Calculate Buy-Side Liquidity Ratio (BLR)
 * Formula: BLR = Σ V_buy / Σ V_sell
 * @param {number} buyVolume - Total buy-side volume
 * @param {number} sellVolume - Total sell-side volume
 * @returns {number} BLR ratio (or 0 if invalid)
 */
function calculateBLR(buyVolume, sellVolume) {
    if (sellVolume === 0) {
        console.warn("⚠️ Sell volume is zero, cannot calculate BLR");
        return 0;
    }

    return buyVolume / sellVolume;
}

/**
 * Format timestamp in ISO 8601 format
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} ISO timestamp
 */
function formatTimestamp(date = new Date()) {
    return date.toISOString();
}

/**
 * Format BLR data for logging/storage
 * @param {Object} data - Market depth data
 * @returns {string} Formatted JSON string
 */
function formatMarketData(data) {
    return JSON.stringify(data, null, 2);
}

/**
 * Generate formatted WARNING message for critical BLR
 * This format is designed to be easily grep-able by Python scripts
 * @param {number} blr - Current BLR
 * @param {number} threshold - Threshold value
 * @returns {string} Formatted warning message
 */
function generateCriticalWarning(blr, threshold) {
    const timestamp = formatTimestamp();
    return `[AEGIS-SENTINEL-WARNING] CRITICAL_BLR_DETECTED | Timestamp: ${timestamp} | BLR: ${blr.toFixed(4)} | Threshold: ${threshold} | Status: TRIGGER_LSTM_PIPELINE`;
}

/**
 * Validate order data structure
 * @param {Array} orders - Orders to validate
 * @returns {boolean} True if valid
 */
function validateOrders(orders) {
    if (!Array.isArray(orders)) return false;
    if (orders.length === 0) return false;

    return orders.every(order =>
        order &&
        typeof order.price === 'number' &&
        typeof order.volume === 'number' &&
        order.price > 0 &&
        order.volume > 0
    );
}

module.exports = {
    calculateMidPrice,
    filterOrdersByThreshold,
    calculateTotalVolume,
    calculateBLR,
    formatTimestamp,
    formatMarketData,
    generateCriticalWarning,
    validateOrders
};
