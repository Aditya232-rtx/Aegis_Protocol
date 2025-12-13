"""
Python Adapter for Risc Zero Proof Generation
Bridges Python inference engine with Rust zkVM host
"""

import json
import subprocess
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class RiscZeroProofGenerator:
    """Generate zero-knowledge proofs using Risc Zero zkVM"""
    
    def __init__(self):
        self.zk_input_path = Path("packages/ml-sentinel/zk-circuit/zk_input.json")
        self.host_binary = Path("packages/ml-sentinel/zk-circuit/risc0-verifier/target/release/host")
    
    def export_model_weights(self, model):
        """Export Keras model weights to Risc Zero format"""
        try:
            weights_dict = {
                "lstm1_kernel": model.layers[0].get_weights()[0].tolist(),
                "lstm1_recurrent": model.layers[0].get_weights()[1].tolist(),
                "lstm1_bias": model.layers[0].get_weights()[2].tolist(),
                
                "lstm2_kernel": model.layers[1].get_weights()[0].tolist(),
                "lstm2_recurrent": model.layers[1].get_weights()[1].tolist(),
                "lstm2_bias": model.layers[1].get_weights()[2].tolist(),
                
                "dense_kernel": model.layers[2].get_weights()[0].tolist(),
                "dense_bias": model.layers[2].get_weights()[1].tolist(),
            }
            return weights_dict
        except Exception as e:
            logger.error(f"Failed to export model weights: {e}")
            return None
    
    def prepare_market_data(self, sequence):
        """Prepare market data sequence for zkVM"""
        try:
            # Ensure it's a numpy array
            if isinstance(sequence, list):
                sequence = np.array(sequence)
            
            # Convert to list of lists
            market_data = {
                "sequence": sequence.tolist()
            }
            return market_data
        except Exception as e:
            logger.error(f"Failed to prepare market data: {e}")
            return None
    
    def generate_proof(self, model, market_sequence):
        """
        Generate zero-knowledge proof for crash prediction
        
        Args:
            model: Keras LSTM model
            market_sequence: numpy array of shape (60, 4)
        
        Returns:
            bool: True if proof generated successfully
        """
        try:
            # 1. Export model weights
            logger.info("Exporting model weights...")
            weights = self.export_model_weights(model)
            if weights is None:
                return False
            
            # 2. Prepare market data
            logger.info("Preparing market data...")
            market_data = self.prepare_market_data(market_sequence)
            if market_data is None:
                return False
            
            # 3. Write inputs to JSON file
            logger.info(f"Writing inputs to {self.zk_input_path}...")
            zk_input = {
                "weights": weights,
                "market_data": market_data
            }
            
            self.zk_input_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.zk_input_path, 'w') as f:
                json.dump(zk_input, f)
            
            # 4. Check if host binary exists
            if not self.host_binary.exists():
                logger.error(f"Host binary not found: {self.host_binary}")
                logger.error("Please build the Risc Zero project first:")
                logger.error("  cd packages/ml-sentinel/zk-circuit/risc0-verifier")
                logger.error("  cargo build --release")
                return False
            
            # 5. Execute Risc Zero host
            logger.info("🚀 Generating zero-knowledge proof...")
            logger.info("   (This may take 30-60 seconds...)")
            
            result = subprocess.run(
                [str(self.host_binary)],
                cwd=self.host_binary.parent.parent,
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout
            )
            
            if result.returncode == 0:
                logger.info("✅ RISC ZERO PROOF GENERATED SUCCESSFULLY")
                logger.info(result.stdout)
                return True
            else:
                logger.error(f"Proof generation failed:")
                logger.error(result.stderr)
                return False
        
        except subprocess.TimeoutExpired:
            logger.error("Proof generation timed out (> 2 minutes)")
            return False
        
        except Exception as e:
            logger.error(f"Unexpected error during proof generation: {e}")
            return False

# Convenience function for integration with inference.py
def generate_risc_zero_proof(model, market_sequence):
    """
    Wrapper function to generate Risc Zero proof
    
    Usage in inference.py:
        from prove_adapter import generate_risc_zero_proof
        
        if risk_score > 0.8:
            if generate_risc_zero_proof(self.model, current_sequence):
                logger.info("✓ RISC ZERO PROOF GENERATED")
    """
    generator = RiscZeroProofGenerator()
    return generator.generate_proof(model, market_sequence)
