"""
Mock Risc Zero Proof Generator for Hackathon Demo
Simulates proof generation without actual zkVM compilation

USE THIS FOR DEMO - Replace with real Risc Zero after hackathon on Linux
"""

import json
import time
import hashlib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MockRiscZeroProofGenerator:
    """Mock proof generator for demonstration purposes"""
    
    def __init__(self):
        self.zk_input_path = Path("packages/ml-sentinel/zk-circuit/zk_input.json")
        self.proof_output = Path("packages/verification-proofs/proofs/risk_receipt.dat")
    
    def generate_proof(self, model, market_sequence):
        """
        MOCK proof generation for hackathon demo
        
        In production (Linux), this would call real Risc Zero
        """
        try:
            logger.info("🎭 DEMO MODE: Generating mock zero-knowledge proof...")
            logger.info("   (Using simulated zkVM for hackathon demonstration)")
            
            # Simulate proof generation time
            time.sleep(2)  # 2 seconds instead of 60
            
            # Create mock proof data
            proof_data = self._create_mock_proof(model, market_sequence)
            
            # Save to expected location
            self.proof_output.parent.mkdir(parents=True, exist_ok=True)
            with open(self.proof_output, 'wb') as f:
                f.write(proof_data)
            
            logger.info("✅ MOCK PROOF GENERATED SUCCESSFULLY")
            logger.info(f"   Proof saved to: {self.proof_output}")
            logger.info("   📝 Note: Using demo mode - deploy on Linux for real ZK proofs")
            
            return True
            
        except Exception as e:
            logger.error(f"Mock proof generation failed: {e}")
            return False
    
    def _create_mock_proof(self, model, market_sequence):
        """Create a mock proof receipt"""
        
        # Get risk score from model
        import numpy as np
        sequence = np.array(market_sequence).reshape(1, 60, 4)
        risk_score = float(model.predict(sequence, verbose=0)[0][0])
        
        # Create deterministic "proof" using hash
        proof_input = f"{risk_score}_{market_sequence.tobytes().hex()}"
        proof_hash = hashlib.sha256(proof_input.encode()).hexdigest()
        
        # Mock receipt structure
        mock_receipt = {
            "version": "mock-v1.0-hackathon",
            "risk_score": risk_score,
            "proof_hash": proof_hash,
            "timestamp": time.time(),
            "note": "DEMO MODE - Real ZK proof requires Linux deployment",
            "journal": {
                "public_output": risk_score,
                "commit_hash": proof_hash[:16]
            }
        }
        
        # Return as JSON bytes (in real Risc Zero this would be bincode)
        return json.dumps(mock_receipt, indent=2).encode()


# Convenience function matching the real API
def generate_risc_zero_proof(model, market_sequence):
    """
    Mock wrapper for hackathon demo
    
    DEPLOYMENT NOTE:
    - For demo: Uses this mock generator (works on Windows)
    - For production: Build real Risc Zero on Linux and replace this file
    """
    generator = MockRiscZeroProofGenerator()
    return generator.generate_proof(model, market_sequence)
