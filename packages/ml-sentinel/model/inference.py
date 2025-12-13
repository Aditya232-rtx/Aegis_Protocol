"""
Production Inference Engine
24/7 real-time LSTM risk score prediction with frontend integration

Input: data-pipeline/data/market_depth.json
Output: ../../../frontend-integration-data/public/live_feed.json
"""

import os
import sys
import json
import time
import logging
import numpy as np
import subprocess
from datetime import datetime
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import configuration
from config.constants import (
    MODEL_PATH, MARKET_DATA_INPUT, FRONTEND_OUTPUT, LOG_FILE,
    INFERENCE_INTERVAL_SECONDS, SEQUENCE_LENGTH, FEATURE_COLUMNS,
    CRASH_THRESHOLD, WARNING_THRESHOLD,
    BLR_MIN, BLR_MAX, VOLUME_MIN, VOLUME_MAX, PRICE_MIN, PRICE_MAX
)

# Setup logging
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SentinelInferenceEngine:
    """Production inference engine for market crash detection"""
    
    def __init__(self):
        self.model = None
        self.feature_buffer = []  # Rolling window of features
        self.scaler_params = self._init_scaler()
        
        # Track risk history for 24h change calculation
        self.risk_history = []  # List of (timestamp, risk_score) tuples
        self.first_risk_score = None  # Baseline risk score
        
    def _init_scaler(self):
        """Initialize normalization parameters (from training)"""
        return {
            'blr': {'min': BLR_MIN, 'max': BLR_MAX},
            'buy_volume': {'min': VOLUME_MIN, 'max': VOLUME_MAX},
            'sell_volume': {'min': VOLUME_MIN, 'max': VOLUME_MAX},
            'mid_price': {'min': PRICE_MIN, 'max': PRICE_MAX}
        }
    
    def load_model(self):
        """Load trained LSTM model"""
        try:
            import tensorflow as tf
            logger.info(f"Loading model from: {MODEL_PATH}")
            # Load with compile=False for inference only (Keras 3.x compatibility)
            self.model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            logger.info("Model loaded successfully")
            logger.info(f"  Input shape: {self.model.input_shape}")
            logger.info(f"  Output shape: {self.model.output_shape}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def read_market_data(self):
        """Read latest market data from crawler output"""
        try:
            with open(MARKET_DATA_INPUT, 'r') as f:
                data = json.load(f)
            
            # Handle both list and dict formats
            if isinstance(data, list):
                if len(data) == 0:
                    logger.warning("Market data is empty list")
                    data = {}
                else:
                    data = data[-1]  # Take most recent entry
            
            # Extract features (with defaults)
            features = {
                'blr': data.get('blr', data.get('buyLiquidityRatio', 1.0)),
                'buy_volume': data.get('buyVolume', data.get('buy_volume', 5000)),
                'sell_volume': data.get('sellVolume', data.get('sell_volume', 5000)),
                'mid_price': data.get('midPrice', data.get('mid_price', 3000))
            }
            
            return features
        
        except FileNotFoundError:
            logger.warning(f"Market data file not found: {MARKET_DATA_INPUT}")
            # Return default safe values
            return {
                'blr': 1.2,
                'buy_volume': 5000,
                'sell_volume': 4000,
                'mid_price': 3000
            }
        except Exception as e:
            logger.error(f"Error reading market data: {e}")
            return None
    
    def normalize_features(self, features):
        """Normalize features to [0, 1] range"""
        normalized = {}
        for key, value in features.items():
            min_val = self.scaler_params[key]['min']
            max_val = self.scaler_params[key]['max']
            normalized[key] = (value - min_val) / (max_val - min_val)
            normalized[key] = np.clip(normalized[key], 0, 1)
        
        return normalized
    
    def update_buffer(self, features):
        """Update rolling feature buffer"""
        # Convert to array
        feature_array = np.array([
            features['blr'],
            features['buy_volume'],
            features['sell_volume'],
            features['mid_price']
        ])
        
        # Add to buffer
        self.feature_buffer.append(feature_array)
        
        # Keep only last SEQUENCE_LENGTH samples
        if len(self.feature_buffer) > SEQUENCE_LENGTH:
            self.feature_buffer = self.feature_buffer[-SEQUENCE_LENGTH:]
    
    def predict_risk(self):
        """Run model prediction"""
        # Need at least SEQUENCE_LENGTH samples
        if len(self.feature_buffer) < SEQUENCE_LENGTH:
            logger.warning(f"Insufficient data: {len(self.feature_buffer)}/{SEQUENCE_LENGTH} samples")
            return None
        
        try:
            # Prepare input sequence
            sequence = np.array(self.feature_buffer[-SEQUENCE_LENGTH:])
            sequence = sequence.reshape(1, SEQUENCE_LENGTH, len(FEATURE_COLUMNS))
            
            # Run prediction
            risk_score = float(self.model.predict(sequence, verbose=0)[0][0])
            risk_score = np.clip(risk_score, 0, 1)
            
            return risk_score
        
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return None
    
    def calculate_24h_change(self, current_risk):
        """Calculate 24h percentage change in risk score"""
        try:
            current_time = datetime.now()
            
            # Add current risk to history
            self.risk_history.append((current_time, current_risk))
            
            # Store first risk score as baseline
            if self.first_risk_score is None:
                self.first_risk_score = current_risk
            
            # Remove entries older than 24 hours
            cutoff_time = current_time - pd.Timedelta(hours=24)
            self.risk_history = [(t, r) for t, r in self.risk_history if t > cutoff_time]
            
            # Calculate change from 24h ago
            if len(self.risk_history) > 1:
                # Get oldest entry in last 24h window
                oldest_risk = self.risk_history[0][1]
                
                # Calculate percentage change
                if oldest_risk > 0:
                    change_24h = ((current_risk - oldest_risk) / oldest_risk) * 100
                else:
                    change_24h = 0.0
                
                return round(change_24h, 2)
            else:
                # Not enough data yet (first 24h)
                return 0.0
        
        except Exception as e:
            logger.error(f"Error calculating 24h change: {e}")
            return 0.0
    
    def write_output(self, risk_score, change_24h, blr):
        """Write all metrics to frontend live feed"""
        try:
            # Create output directory if needed
            output_path = Path(FRONTEND_OUTPUT)
            os.makedirs(output_path.parent, exist_ok=True)
            
            # Determine status based on thresholds
            if risk_score > CRASH_THRESHOLD:
                status = "critical"
            elif risk_score > WARNING_THRESHOLD:
                status = "warning"
            else:
                status = "normal"
            
            # Build comprehensive metrics object
            metrics = {
                "riskScore": round(risk_score, 4),
                "change24h": change_24h,
                "liquidityHealth": round(blr, 4),
                "timestamp": datetime.now().isoformat(),
                "status": status
            }
            
            # Write JSON (overwrite)
            with open(output_path, 'w') as f:
                json.dump(metrics, f, indent=2)
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to write output: {e}")
            return False
    
    def save_crash_input(self, features):
        """Save current input data for ZK proof generation"""
        try:
            crash_input_path = Path("zk-circuit/crash_input.json")
            crash_input_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save normalized features
            crash_data = {
                "timestamp": datetime.now().isoformat(),
                "features": features,
                "input_tensor": self.feature_buffer[-SEQUENCE_LENGTH:] if len(self.feature_buffer) >= SEQUENCE_LENGTH else []
            }
            
            with open(crash_input_path, 'w') as f:
                json.dump(crash_data, f, indent=2, default=lambda x: x.tolist() if isinstance(x, np.ndarray) else x)
            
            return str(crash_input_path)
        except Exception as e:
            logger.error(f"Failed to save crash input: {e}")
            return None
    
    def trigger_zk_proof_generation(self, crash_input_path):
        """Trigger ZK proof generation script"""
        try:
            prove_script = Path("zk-circuit/prove_crash.py")
            if not prove_script.exists():
                logger.warning(f"ZK proof script not found: {prove_script}")
                return False
            
            logger.info("Triggering ZK proof generation...")
            
            # Run proof generation in background
            result = subprocess.run(
                [sys.executable, str(prove_script), crash_input_path],
                capture_output=True,
                text=True,
                timeout=60  # 1 minute timeout
            )
            
            if result.returncode == 0:
                logger.info("✓ PROOF GENERATED")
                print("\n" + "="*60)
                print("✅ ZK PROOF GENERATED SUCCESSFULLY")
                print("="*60 + "\n")
                return True
            else:
                logger.error(f"Proof generation failed: {result.stderr}")
                return False
        
        except subprocess.TimeoutExpired:
            logger.error("Proof generation timed out")
            return False
        except Exception as e:
            logger.error(f"Error triggering proof generation: {e}")
            return False
    
    def check_crash_trigger(self, risk_score, features):
        """Check if crash threshold exceeded and trigger ZK proof"""
        if risk_score > CRASH_THRESHOLD:
            logger.critical(f"⚠️  CRASH THRESHOLD EXCEEDED: {risk_score:.4f} > {CRASH_THRESHOLD}")
            print("\n" + "="*60)
            print("🚨 MARKET CRASH DETECTED - INITIATING ZK PROOF")
            print("="*60 + "\n")
            
            # Save crash input data
            crash_input_path = self.save_crash_input(features)
            if crash_input_path:
                # Trigger ZK proof generation  
                self.trigger_zk_proof_generation(crash_input_path)
            
            return True
        elif risk_score > WARNING_THRESHOLD:
            logger.warning(f"⚡ High risk detected: {risk_score:.4f}")
            return False
        else:
            logger.info(f"✓ Risk score normal: {risk_score:.4f}")
            return False
    
    def run_inference_loop(self):
        """Main 24/7 inference loop"""
        logger.info("="*60)
        logger.info("SENTINEL INFERENCE ENGINE - PRODUCTION MODE")
        logger.info("="*60)
        logger.info(f"Monitoring: {MARKET_DATA_INPUT}")
        logger.info(f"Output: {FRONTEND_OUTPUT}")
        logger.info(f"Interval: {INFERENCE_INTERVAL_SECONDS}s")
        logger.info(f"Crash threshold: {CRASH_THRESHOLD}")
        logger.info("="*60)
        
        iteration = 0
        
        try:
            while True:
                iteration += 1
                logger.info(f"\n[Iteration {iteration}] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # 1. Read market data
                features = self.read_market_data()
                if features is None:
                    logger.error("Failed to read market data, skipping iteration")
                    time.sleep(INFERENCE_INTERVAL_SECONDS)
                    continue
                
                logger.info(f"  Market data: BLR={features['blr']:.4f}, "
                           f"Buy={features['buy_volume']:.0f}, "
                           f"Sell={features['sell_volume']:.0f}")
                
                # 2. Normalize and buffer
                normalized = self.normalize_features(features)
                self.update_buffer(normalized)
                
                # 3. Predict (if enough data)
                risk_score = self.predict_risk()
                
                if risk_score is not None:
                    # 4. Calculate 24h change
                    change_24h = self.calculate_24h_change(risk_score)
                    
                    # 5. Write all metrics to output
                    blr = features['blr']
                    if self.write_output(risk_score, change_24h, blr):
                        logger.info(f"  ✓ Metrics: Risk={risk_score:.4f}, "
                                   f"24h Change={change_24h:+.2f}%, "
                                   f"BLR={blr:.4f} → {FRONTEND_OUTPUT}")
                    
                    # 6. Check thresholds and trigger ZK proof if needed
                    self.check_crash_trigger(risk_score, features)
                
                # Wait for next iteration
                time.sleep(INFERENCE_INTERVAL_SECONDS)
        
        except KeyboardInterrupt:
            logger.info("\n\nShutdown requested by user")
            logger.info("="*60)
            logger.info("INFERENCE ENGINE STOPPED")
            logger.info("="*60)
        
        except Exception as e:
            logger.critical(f"Fatal error in inference loop: {e}")
            raise

def main():
    """Main entry point"""
    # Create engine
    engine = SentinelInferenceEngine()
    
    # Load model
    if not engine.load_model():
        logger.error("Failed to load model. Exiting.")
        sys.exit(1)
    
    # Start inference loop
    engine.run_inference_loop()

if __name__ == "__main__":
    main()
