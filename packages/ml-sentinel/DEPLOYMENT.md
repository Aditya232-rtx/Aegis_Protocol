# Phase II: Production Deployment - Complete

## ✅ Repository Structure

```
ml-sentinel/
├── config/
│   └── constants.py              # Shared configuration
├── data-pipeline/                # Existing crawler
├── model/
│   ├── trained/
│   │   └── aegis_lstm_model.h5   # Trained model
│   ├── inference.py              # 24/7 production inference
│   ├── export_onnx.py            # ONNX converter
│   └── training/                 # Training scripts
├── zk-circuit/
│   └── scripts/
│       └── setup_circuit.sh      # EZKL automation
└── logs/                         # Production logs
```

## 📦 Components Created

### 1. Configuration (`config/constants.py`)
- Model paths
- Data I/O paths
- Inference settings
- Risk thresholds
- Normalization parameters

### 2. Inference Engine (`model/inference.py`)
- **24/7 continuous monitoring**
- Reads: `data-pipeline/data/market_depth.json`
- Writes: `../../frontend-cockpit/public/live_feed.json`
- Format: `{"currentRiskScore": 0.82}`
- Crash detection: Triggers ZK proof if risk > 0.8
- Logging to `logs/sentinel.log`

### 3. ONNX Export (`model/export_onnx.py`)
- Converts Keras model → ONNX
- Output: `model/trained/network.onnx`
- Validation included

### 4. ZK Circuit Setup (`zk-circuit/scripts/setup_circuit.sh`)
- Automates EZKL workflow
- Generates: settings, compiled circuit, keys, verifier
- Requires: EZKL installation

## 🚀 Usage

### Export Model to ONNX
```powershell
cd ml-sentinel
python model/export_onnx.py
```

### Start Inference Engine
```powershell
cd ml-sentinel  
python model/inference.py
```

**Output**: Creates `live_feed.json` for frontend integration

### Setup ZK Circuit (Linux/WSL)
```bash
cd ml-sentinel/zk-circuit/scripts
bash setup_circuit.sh
```

## 📋 Dependencies

Install additional packages:
```powershell
pip install tf2onnx onnx
```

For ZK integration:
- Install EZKL: https://github.com/zkonduit/ezkl

## 🔗 Integration Points

### Frontend Integration
- **File**: `frontend-cockpit/public/live_feed.json`
- **Format**: `{"currentRiskScore": 0.XXXX}`
- **Update interval**: Every 10 seconds (configurable in `config/constants.py`)

### Crash Detection
- If `currentRiskScore > 0.8`:
  - Logs CRITICAL event
  - Prints "TRIGGERING ZK PROOF GENERATION"
  - Ready for ZK proof workflow

## ⚙️ Configuration

Edit `config/constants.py` to customize:
- `INFERENCE_INTERVAL_SECONDS` - How often to run inference
- `CRASH_THRESHOLD` - Risk threshold for ZK trigger
- `FRONTEND_OUTPUT` - Path to live_feed.json

## 📝 Next Steps

1. ✅ Repository organized
2. ✅ Scripts created
3. ⏳ Install dependencies (`pip install tf20nnx onnx`)
4. ⏳ Export model to ONNX
5. ⏳ Test inference engine
6. ⏳ Verify frontend integration
7. ⏳ Setup ZK circuit (requires EZKL)

## 🎯 Success Criteria

- [ ] ONNX model exports successfully
- [ ] Inference engine runs without errors
- [ ] `live_feed.json` updates correctly
- [ ] Frontend receives real-time risk scores
- [ ] Crash detection triggers properly
- [ ] ZK circuit compiles (if EZKL installed)
