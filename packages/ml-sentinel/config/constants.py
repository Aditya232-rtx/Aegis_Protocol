"""
Shared Configuration Constants
For ml-sentinel production inference and ZK integration
"""

import os
from pathlib import Path

# Get ml-sentinel root directory (parent of config/)
ML_SENTINEL_ROOT = Path(__file__).parent.parent.absolute()

# Model Paths
MODEL_PATH = str(ML_SENTINEL_ROOT / "model" / "trained" / "aegis_lstm_model.h5")
ONNX_MODEL_PATH = str(ML_SENTINEL_ROOT / "model" / "trained" / "network.onnx")

# Data Paths
MARKET_DATA_INPUT = str(ML_SENTINEL_ROOT / "data-pipeline" / "data" / "market_depth.json")
FRONTEND_OUTPUT = str(ML_SENTINEL_ROOT.parent / "frontend-cockpit" / "public" / "live_feed.json")

# Logging
LOG_FILE = str(ML_SENTINEL_ROOT / "logs" / "sentinel.log")
LOG_LEVEL = "INFO"

# Inference Settings
INFERENCE_INTERVAL_SECONDS = 10  # How often to run inference
SEQUENCE_LENGTH = 60  # Must match training configuration
FEATURE_COLUMNS = ['blr', 'buy_volume', 'sell_volume', 'mid_price']

# Risk Thresholds
CRASH_THRESHOLD = 0.8  # Trigger ZK proof if risk > 0.8
WARNING_THRESHOLD = 0.6

# Feature Normalization Ranges (from training)
BLR_MIN = 0.3
BLR_MAX = 1.5
VOLUME_MIN = 0
VOLUME_MAX = 10000
PRICE_MIN = 2500
PRICE_MAX = 3500

