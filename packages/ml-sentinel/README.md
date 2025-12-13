# Aegis Protocol - Sentinel Layer

## Professional Monorepo Structure

Enterprise-grade intelligence layer for predictive market crash detection.

---

## 📁 Directory Structure

```
ml-sentinel/
├── data-pipeline/          # Node.js Crawlers (✅ Complete)
│   ├── src/
│   │   ├── crawler.js      # Main entry point
│   │   ├── parsers.js      # DOM parsing logic
│   │   └── utils.js        # Math & Formatting
│   ├── data/               # Output files (auto-generated)
│   │   ├── market_depth.json
│   │   └── market_depth.csv
│   ├── package.json
│   └── README.md
├── model/                  # Python/TensorFlow LSTM
│   ├── training/           # Model training scripts
│   └── inference/          # Inference API service
├── zk-circuit/             # EZKL Configuration
└── scripts/                # Utility scripts
```

---

## 🚀 Quick Start

### Data Pipeline

```bash
cd data-pipeline
npm install
npm start
```

**Output**: `data/market_depth.json` and `data/market_depth.csv`

---

## 🎯 System Overview

### Intelligence Layer Goals

1. **Detect market crashes before they happen** using LSTM
2. **Trigger blockchain circuit breaker** via ZK-Proofs
3. **Live visualization** through Firebase for frontend

### Integration Strategy

```
Scraper (Node 1) → Database (Node 2) → LSTM (Node 3) → ZK-Proof → Smart Contract
                      ↓
                   Firebase → Frontend (Live Graph)
```

---

## 📊 Data Flow

### Phase I: Data Collection (✅ Current)

- Scrape Binance ETH/USDC order book
- Calculate Buy-Side Liquidity Ratio (BLR)
- Save to JSON/CSV for LSTM training

### Phase II: Model Training (Next)

- Python reads `market_depth.csv`
- Train LSTM on historical BLR patterns
- Generate crash predictions

### Phase III: ZK-Proof Circuit (Future)

- Convert LSTM to ONNX format
- Generate ZK-Proof with EZKL
- Submit proof to smart contract

---

## 🔬 BLR Calculation

**Formula:**
```
BLR = Σ V_buy / Σ V_sell
```

**Constraint:** Only orders within 2% (δ) of mid-price

**Trigger:** If BLR < 0.4 → Critical alert

---

## 📦 Modules

### Data Pipeline (Production-Ready)

- ✅ Modular architecture (utils, parsers, crawler)
- ✅ Puppeteer for dynamic content
- ✅ JSON/CSV persistence
- ✅ Environment-based configuration
- ✅ Formatted WARNING for Python grep

### Model (Coming Next)

- [ ] LSTM architecture design
- [ ] Training pipeline
- [ ] Inference API server
- [ ] Flask/FastAPI REST endpoints

### ZK-Circuit (Future)

- [ ] EZKL configuration
- [ ] ONNX model export
- [ ] Proof generation
- [ ] On-chain verification

---

## 🛠️ Development

### Environment Variables

```bash
# Data Pipeline
BLR_THRESHOLD=0.4                    # Alert threshold
PRICE_DELTA=0.02                     # 2% price range
HEADLESS=true                        # Browser mode
ENABLE_PERIODIC_SCRAPING=false       # Continuous mode
```

### Scripts

```bash
# Run once
npm start

# Development (visible browser)
npm run start:dev

# Continuous monitoring
npm run start:continuous
```

---

## 📚 Documentation

- [Data Pipeline README](data-pipeline/README.md) - Full crawler documentation
- [Architecture Guide](ARCHITECTURE.md) - System architecture & API integration

---

**Aegis Protocol - Sentinel Layer**  
*Moving from reactive price feeds to predictive Market Depth analysis*
