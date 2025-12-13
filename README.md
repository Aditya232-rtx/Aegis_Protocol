# AI-Sentinel - LSTM Crash Prediction System

## 🎯 Overview

AI-Sentinel is a real-time market crash prediction system using LSTM neural networks with Zero-Knowledge Machine Learning (ZKML) verification. This system provides live risk assessment, 24-hour trend analysis, and liquidity health monitoring.

---

## 📁 Project Structure

```
ai-sentinel/
├── packages/
│   ├── ml-sentinel/                    # ML inference engine
│   │   ├── model/                      # LSTM model & inference
│   │   │   ├── trained/                # Trained model files
│   │   │   │   ├── aegis_lstm_model.h5 # Keras LSTM model
│   │   │   │   └── network.onnx        # ONNX export for ZK
│   │   │   ├── inference.py            # ⭐ Main inference engine
│   │   │   └── test_enhanced_output.py # Output testing
│   │   ├── config/
│   │   │   └── constants.py            # Configuration paths
│   │   ├── data-pipeline/
│   │   │   └── data/
│   │   │       └── market_depth.json   # Input market data
│   │   ├── zk-circuit/                 # Zero-knowledge proofs
│   │   └── logs/                       # Inference logs
│   │
│   ├── frontend-integration-data/      # ⭐ Frontend data output
│   │   └── public/
│   │       └── live_feed.json          # ⭐⭐ YOUR DATA SOURCE
│   │
│   └── verification-proofs/            # ZK verification contracts
│       └── contracts/
│           └── Verifier.sol            # Blockchain verifier
│
└── .gitignore
```

---

## 🚀 Quick Start for Frontend Team

### Step 1: Run the Inference Engine

The ML team provides real-time predictions via a background service:

```bash
# From project root
python packages/ml-sentinel/model/inference.py
```

**What happens:**
- Loads trained LSTM model (60-timestep sequence)
- Reads market data every 10 seconds
- Outputs predictions to `packages/frontend-integration-data/public/live_feed.json`
- Runs 24/7 in production

**First-time note:** Engine needs 60 samples (~10 minutes) before making predictions.

---

## 📊 Frontend Integration

### The Data You Need

**File Location:** `packages/frontend-integration-data/public/live_feed.json`

**JSON Format:**
```json
{
  "riskScore": 0.2648,
  "change24h": -12.5,
  "liquidityHealth": 0.9999,
  "timestamp": "2025-12-14T01:45:09.038578",
  "status": "normal"
}
```

**Field Descriptions:**

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `riskScore` | float | 0.0 - 1.0 | LSTM crash probability prediction<br>• 0.0-0.6: Normal<br>• 0.6-0.8: Warning<br>• 0.8-1.0: Critical |
| `change24h` | float | ±∞ | 24-hour percentage change in risk<br>• Negative = Risk decreasing<br>• Positive = Risk increasing<br>• 0.0 for first 24 hours |
| `liquidityHealth` | float | 0.0 - ∞ | Buy Liquidity Ratio (BLR)<br>• <0.5: Very low liquidity<br>• 0.5-1.0: Normal<br>• >1.0: High liquidity |
| `timestamp` | string | ISO 8601 | When prediction was generated |
| `status` | string | enum | `"normal"` \| `"warning"` \| `"critical"` |

---

### Integration Methods

#### Option 1: Polling (Recommended for Development)

```javascript
// React Example
import { useState, useEffect } from 'react';

function MarketMonitor() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Poll every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/live_feed.json');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Market Risk Monitor</h2>
      <div className={`risk-${data.status}`}>
        <p>Risk Score: {(data.riskScore * 100).toFixed(2)}%</p>
        <p>24h Change: {data.change24h.toFixed(2)}%</p>
        <p>Liquidity: {data.liquidityHealth.toFixed(4)}</p>
        <p>Status: {data.status.toUpperCase()}</p>
      </div>
    </div>
  );
}
```

#### Option 2: Server-Sent Events (Production)

```javascript
// Backend server (Node.js/Express)
const fs = require('fs');
const express = require('express');
const app = express();

app.get('/api/risk-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  
  const sendData = () => {
    const data = fs.readFileSync(
      './packages/frontend-integration-data/public/live_feed.json', 
      'utf8'
    );
    res.write(`data: ${data}\n\n`);
  };

  // Send every 3 seconds
  const interval = setInterval(sendData, 3000);
  sendData(); // Send immediately

  req.on('close', () => clearInterval(interval));
});
```

```javascript
// Frontend (React)
useEffect(() => {
  const eventSource = new EventSource('/api/risk-stream');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setData(data);
  };

  return () => eventSource.close();
}, []);
```

---

### UI/UX Recommendations

**Color Coding by Status:**
```css
.risk-normal { 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.risk-warning { 
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.risk-critical { 
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  animation: pulse 2s infinite;
}
```

**Display Components:**
1. **Risk Gauge** - Circular progress showing riskScore (0-100%)
2. **Trend Indicator** - Arrow showing 24h change direction
3. **Liquidity Bar** - Health meter for liquidityHealth
4. **Status Badge** - Color-coded alert level

---

## 🔧 For ML Team

### Running the System

**1. Start Inference Engine:**
```bash
python packages/ml-sentinel/model/inference.py
```

**Output:** Real-time predictions to `packages/frontend-integration-data/public/live_feed.json`

**2. Generate ZK Proofs (Optional):**
```bash
python packages/ml-sentinel/zk-circuit/scripts/zk_setup_placeholder.py
```

**Output:** Verification contract at `packages/verification-proofs/contracts/Verifier.sol`

**3. Verify Handoff:**
```bash
python packages/verify_handoff.py
```

**Checks:** All ZK artifacts and contracts are generated correctly.

---

## 📝 Key Configuration

**Update Output Paths:**
File: `packages/ml-sentinel/config/constants.py`

```python
# Frontend output location
FRONTEND_OUTPUT = str(ML_SENTINEL_ROOT.parent / 
                     "frontend-integration-data" / 
                     "public" / "live_feed.json")

# Model paths
MODEL_PATH = str(ML_SENTINEL_ROOT / "model" / "trained" / "aegis_lstm_model.h5")

# Inference settings
INFERENCE_INTERVAL_SECONDS = 10  # Update every 10s
SEQUENCE_LENGTH = 60             # 60 timesteps required
```

---

## 🎨 Example Dashboard Implementation

```javascript
// Complete dashboard component
function CrashPredictionDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/live_feed.json');
      const data = await res.json();
      setMetrics(data);
      setHistory(prev => [...prev.slice(-20), data]); // Keep last 20
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Dashboard status={metrics?.status}>
      <MetricCard
        title="Crash Risk"
        value={`${(metrics?.riskScore * 100).toFixed(1)}%`}
        trend={metrics?.change24h}
        icon={<AlertIcon />}
      />
      
      <MetricCard
        title="24h Change"
        value={`${metrics?.change24h > 0 ? '+' : ''}${metrics?.change24h.toFixed(2)}%`}
        status={metrics?.change24h > 0 ? 'warning' : 'normal'}
        icon={<TrendIcon />}
      />
      
      <MetricCard
        title="Liquidity Health"
        value={metrics?.liquidityHealth.toFixed(4)}
        status={metrics?.liquidityHealth > 1 ? 'normal' : 'warning'}
        icon={<WaterDropIcon />}
      />

      <ChartContainer>
        <LineChart data={history} />
      </ChartContainer>
    </Dashboard>
  );
}
```

---

## 🔐 Zero-Knowledge Verification (Advanced)

For blockchain team: Deploy the generated Solidity contract to verify predictions on-chain.

**Contract:** `packages/verification-proofs/contracts/Verifier.sol`

**Usage:**
```solidity
function verifyPrediction(
    bytes calldata proof,
    uint256[] calldata publicInputs
) external returns (bool);
```

---

## 🚨 Important Notes

### For Frontend Developers:

1. **Poll Frequency:** Update every 2-3 seconds (model updates every 10s)
2. **First 24 Hours:** `change24h` will be `0.0` until sufficient data
3. **Error Handling:** File may not exist initially - handle gracefully
4. **Status Thresholds:**
   - Normal: riskScore < 0.6
   - Warning: 0.6 ≤ riskScore < 0.8
   - Critical: riskScore ≥ 0.8

### For ML Team:

1. **Model Location:** `packages/ml-sentinel/model/trained/aegis_lstm_model.h5`
2. **Startup Time:** ~10 minutes to collect 60 samples before first prediction
3. **Logging:** Check `packages/ml-sentinel/logs/sentinel.log` for issues

---

## 📦 Dependencies

**ML Team:**
```bash
pip install tensorflow numpy pandas
```

**Frontend Team:**
- Standard fetch API (built-in)
- No additional dependencies required
- Pure JSON polling approach

---

## 🤝 Team Collaboration

**ML Team Provides:**
- Running inference engine (24/7 service)
- Updated `live_feed.json` every 10 seconds
- Model retraining when needed

**Frontend Team Consumes:**
- `live_feed.json` file via HTTP polling
- Real-time UI updates every 2-3 seconds
- Visual representation of metrics

**Blockchain Team:**
- Deploys `Verifier.sol` contract
- Verifies high-risk predictions on-chain
- Reads proofs from `packages/verification-proofs/proofs/`

---

## 📞 Support

**File Issues:** Check logs at `packages/ml-sentinel/logs/sentinel.log`

**Missing Data:** Ensure inference engine is running:
```bash
ps aux | grep inference.py  # Linux/Mac
Get-Process | Where-Object {$_.ProcessName -like "*python*"}  # Windows
```

**Questions:** Contact ML team for model-related issues, frontend team for integration help.

---

## 🎯 Production Checklist

- [ ] Inference engine running as systemd service / Windows service
- [ ] `live_feed.json` accessible via web server (nginx/Apache)
- [ ] Frontend polling every 2-3 seconds
- [ ] Error handling for missing/stale data
- [ ] Alert system for critical status
- [ ] Dashboard displays all 3 metrics clearly
- [ ] Mobile responsive design
- [ ] ZK proofs generated for critical events

---

**Built with ❤️ by Team Aegis**
