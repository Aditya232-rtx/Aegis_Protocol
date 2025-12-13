# Aegis Protocol - Data Pipeline

## Production-Ready Market Depth Scraper

The Sentinel Layer's data pipeline is a modular, enterprise-grade scraper that monitors Binance ETH/USDC order book depth and calculates the Buy-Side Liquidity Ratio (BLR) to detect critical market conditions.

---

## 📁 Project Structure

```
data-pipeline/
├── src/
│   ├── crawler.js      # Main entry point
│   ├── parsers.js      # DOM parsing logic
│   └── utils.js        # Mathematical utilities
├── data/
│   ├── market_depth.json   # Time-series data (auto-generated)
│   └── market_depth.csv    # CSV export (auto-generated)
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run Once

```bash
npm start
```

### Development Mode (Visible Browser)

```bash
npm run start:dev
```

### Continuous Monitoring

```bash
npm run start:continuous
```

---

## 📊 Output Files

### JSON Format (`data/market_depth.json`)

```json
[
  {
    "timestamp": "2025-12-13T08:44:16.180Z",
    "blr": 0.9999,
    "buyVolume": 3113.53,
    "sellVolume": 3113.86,
    "midPrice": 3113.70,
    "alertTriggered": false,
    "rawOrders": {
      "buyCount": 1,
      "sellCount": 1,
      "filteredBuyCount": 1,
      "filteredSellCount": 1
    }
  }
]
```

### CSV Format (`data/market_depth.csv`)

```csv
timestamp,blr,buy_volume,sell_volume,mid_price,alert_triggered
2025-12-13T08:44:16.180Z,0.9999,3113.53,3113.86,3113.70,false
```

---

## ⚙️ Configuration

Set environment variables to configure behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_URL` | Binance ETH/USDC | Target trading page |
| `BLR_THRESHOLD` | 0.4 | Alert threshold (40%) |
| `PRICE_DELTA` | 0.02 | Price threshold (2%) |
| `HEADLESS` | true | Run browser headless |
| `ENABLE_PERIODIC_SCRAPING` | false | Enable continuous mode |
| `SCRAPE_INTERVAL` | 60000 | Interval in ms (60s) |

**Example:**

```bash
BLR_THRESHOLD=0.35 PRICE_DELTA=0.03 npm start
```

---

## 🔬 BLR Calculation

### Formula

```
BLR = Σ V_buy / Σ V_sell
```

Where:
- `Σ V_buy` = Sum of buy order volumes within 2% below mid-price
- `Σ V_sell` = Sum of sell order volumes within 2% above mid-price

### Algorithm

1. **Extract Order Book**: Scrape buy/sell orders from Binance
2. **Calculate Mid-Price**: `(Best Bid + Best Ask) / 2`
3. **Filter Orders**:
   - Buy orders: `[mid-price × 0.98, mid-price]`
   - Sell orders: `[mid-price, mid-price × 1.02]`
4. **Sum Volumes**: Calculate total buy and sell volumes
5. **Calculate BLR**: Divide buy volume by sell volume
6. **Check Threshold**: If BLR < 0.4 → Trigger alert

---

## 🚨 Alert Format

When BLR drops below threshold, the system outputs a **formatted WARNING** designed for Python grep/parsing:

```
[AEGIS-SENTINEL-WARNING] CRITICAL_BLR_DETECTED | Timestamp: 2025-12-13T08:44:16.180Z | BLR: 0.3512 | Threshold: 0.4 | Status: TRIGGER_LSTM_PIPELINE
```

This format allows the Python LSTM service to:
```python
# Python example for monitoring
import subprocess

result = subprocess.run(['grep', 'AEGIS-SENTINEL-WARNING', 'logs.txt'], 
                       capture_output=True, text=True)
if result.stdout:
    # Parse and trigger LSTM pipeline
    trigger_lstm_model()
```

---

## 📦 Modular Architecture

### `src/utils.js`

Mathematical and formatting utilities:
- `calculateMidPrice()` - Calculate mid-price from orders
- `filterOrdersByThreshold()` - Filter orders within threshold
- `calculateBLR()` - Compute Buy-Side Liquidity Ratio
- `generateCriticalWarning()` - Format alert messages
- `validateOrders()` - Data validation

### `src/parsers.js`

DOM parsing and extraction:
- `scrapeOrderBook()` - Extract orders from Binance page
- Multiple extraction strategies (table-based, pattern-based)
- Robust error handling

### `src/crawler.js`

Main orchestration:
- Puppeteer browser management
- Data persistence (JSON/CSV)
- Environment configuration
- Periodic scraping support

---

## 🔗 Integration with LSTM Model

The output files (`market_depth.json` and `market_depth.csv`) serve as the **input feed** for the Python LSTM model training pipeline.

**Workflow:**

```
1. Crawler scrapes Binance → Calculates BLR
2. Data saved to JSON/CSV → Historical dataset builds
3. Python reads CSV → Trains LSTM model
4. LSTM predicts crashes → Triggers ZK-Proof circuit
5. Smart contract receives proof → Activates circuit breaker
```

---

## 🛠️ Troubleshooting

**Issue**: No orders extracted
- **Solution**: Binance DOM changed. Update selectors in `parsers.js`

**Issue**: Browser timeout
- **Solution**: Increase `WAIT_FOR_ORDERS` environment variable

**Issue**: Permission denied on data directory
- **Solution**: Ensure write permissions for `data/` folder

---

## 📈 Next Steps

1. **Run continuous monitoring**: `npm run start:continuous`
2. **Build LSTM model** in `../model/training/`
3. **Set up database** for larger-scale storage
4. **Create API server** to serve data to frontend
5. **Implement ZK-Proof circuit** in `../zk-circuit/`

---

## 📜 License

MIT License - Aegis Protocol Team
