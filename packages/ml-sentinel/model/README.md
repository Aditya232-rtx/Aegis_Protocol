# Aegis Protocol - LSTM Model

## Python ML Environment for Market Crash Prediction

This directory contains the LSTM model training and inference pipeline.

---

## 🚀 Quick Start

### Step 1: Set Up Python Environment

```bash
# Navigate to model directory
cd ml-sentinel/model

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Generate Synthetic Training Data

```bash
cd training
python generate_synthetic_data.py
```

**Output**: `training_data.csv` with 10,000 time steps

### Step 3: Train LSTM Model

```bash
python train_lstm.py
```

**Outputs**:
- `aegis_lstm_model.h5` - Trained model
- `training_history.png` - Loss/MAE plots
- `prediction_results.png` - Actual vs predicted

---

## 📊 Data Pipeline Integration

The LSTM model consumes data from the Node.js crawler:

```
data-pipeline/data/market_depth.csv → LSTM Training → Risk Predictions
```

**Real Data Training** (after collecting history):
```python
# In train_lstm.py, change:
DATA_FILE = '../data-pipeline/data/market_depth.csv'
```

---

## 🏗️ Directory Structure

```
model/
├── requirements.txt           # Python dependencies
├── training/
│   ├── generate_synthetic_data.py   # Synthetic data generator
│   ├── train_lstm.py                # LSTM training pipeline
│   ├── training_data.csv            # Generated training data
│   ├── aegis_lstm_model.h5          # Trained model (after training)
│   ├── training_history.png         # Training metrics (after training)
│   └── prediction_results.png       # Prediction visualization (after training)
└── inference/
    └── (Future: Flask/FastAPI inference API)
```

---

## 🧠 LSTM Architecture

```
Input: (sequence_length=50, features=4)
  ↓
LSTM Layer (50 units, tanh activation)
  ↓
Dropout (0.2)
  ↓
Dense Layer (1 unit, sigmoid activation)
  ↓
Output: Risk Score (0.0 to 1.0)
```

**Features**:
1. `blr` - Buy-Side Liquidity Ratio
2. `buy_volume` - Buy order volume
3. `sell_volume` - Sell order volume
4. `mid_price` - Mid-market price

**Target**: `risk_score` (0.0 = safe, 1.0 = crash)

---

## 📈 Synthetic Data Details

**Total Samples**: 10,000 time steps  
**Healthy Phase**: 9,900 steps (BLR ~ 1.0-1.5)  
**Crash Phase**: 100 steps (BLR decays to ~0.35)  

**Crash Simulation**:
- Exponential BLR decay
- Increased sell pressure
- 15% price drop
- Risk score rises to 1.0

---

## 🎯 Next Steps

After training the model:

1. **Export to ONNX** (for ZKML):
   ```python
   import tf2onnx
   # Convert model to ONNX format
   ```

2. **Build Inference API** (`inference/`):
   - Flask/FastAPI server
   - Real-time prediction endpoint
   - Integration with data pipeline

3. **Deploy ZK Circuit** (`../zk-circuit/`):
   - EZKL configuration
   - Proof generation
   - Smart contract integration

---

## 📚 Dependencies

See `requirements.txt` for full list. Key packages:
- `tensorflow` - Deep learning framework
- `pandas` / `numpy` - Data manipulation
- `scikit-learn` - Preprocessing & metrics
- `onnx` / `tf2onnx` - Model export for ZKML

---

**Aegis Protocol - Sentinel Layer**  
*Predictive Intelligence for DeFi Circuit Breakers*
