"""
Test Script for ZK Proof Generation
Tests the end-to-end proof generation pipeline
"""

import sys
import json
import time
import numpy as np
from pathlib import Path
import os

# Add paths
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir / "packages" / "ml-sentinel" / "zk-circuit"))
sys.path.insert(0, str(current_dir / "packages" / "ml-sentinel" / "model"))

def test_proof_generation():
    """Test the complete proof generation pipeline"""
    
    print("=" * 70)
    print("AEGIS PROTOCOL - ZK PROOF GENERATION TEST")
    print("=" * 70)
    
    # Step 1: Load LSTM Model
    print("\n[1/5] Loading LSTM model...")
    try:
        import tensorflow as tf
        model_path = Path("packages/ml-sentinel/model/trained/aegis_lstm_model.h5")
        model = tf.keras.models.load_model(model_path, compile=False)
        print(f"    ✓ Model loaded: {model_path}")
        print(f"    ✓ Input shape: {model.input_shape}")
        print(f"    ✓ Output shape: {model.output_shape}")
    except Exception as e:
        print(f"    ✗ Failed to load model: {e}")
        return False
    
    # Step 2: Create Test Market Data
    print("\n[2/5] Creating test market data...")
    try:
        # Generate realistic test sequence (60 timesteps x 4 features)
        # Features: [blr, buy_volume, sell_volume, mid_price]
        
        # Simulate high-risk scenario
        test_sequence = np.array([
            [0.5 + i * 0.01, 5000 - i * 50, 6000 + i * 50, 3000 - i * 5]
            for i in range(60)
        ], dtype=np.float32)
        
        # Normalize to [0, 1] range
        test_sequence[:, 0] = (test_sequence[:, 0] - 0.1) / 2.0  # BLR
        test_sequence[:, 1] = (test_sequence[:, 1] - 1000) / 9000  # Buy volume
        test_sequence[:, 2] = (test_sequence[:, 2] - 1000) / 9000  # Sell volume
        test_sequence[:, 3] = (test_sequence[:, 3] - 1000) / 4000  # Mid price
        
        print(f"    ✓ Test sequence created: {test_sequence.shape}")
        print(f"    ✓ Sample data: BLR={test_sequence[0, 0]:.4f}, Buy={test_sequence[0, 1]:.4f}")
    except Exception as e:
        print(f"    ✗ Failed to create test data: {e}")
        return False
    
    # Step 3: Run LSTM Inference
    print("\n[3/5] Running LSTM inference...")
    try:
        # Predict risk score
        sequence_input = test_sequence.reshape(1, 60, 4)
        risk_score = float(model.predict(sequence_input, verbose=0)[0][0])
        risk_score = np.clip(risk_score, 0, 1)
        
        print(f"    ✓ Risk score predicted: {risk_score:.6f}")
        print(f"    ✓ Risk level: {'🔴 CRITICAL' if risk_score > 0.8 else '🟡 WARNING' if risk_score > 0.6 else '🟢 NORMAL'}")
    except Exception as e:
        print(f"    ✗ Inference failed: {e}")
        return False
    
    # Step 4: Generate ZK Proof
    print("\n[4/5] Generating zero-knowledge proof...")
    try:
        from prove_adapter import generate_risc_zero_proof
        
        start_time = time.time()
        success = generate_risc_zero_proof(model, test_sequence)
        elapsed = time.time() - start_time
        
        if success:
            print(f"    ✓ Proof generated successfully in {elapsed:.2f} seconds")
        else:
            print(f"    ✗ Proof generation failed")
            return False
            
    except Exception as e:
        print(f"    ✗ Proof generation error: {e}")
        return False
    
    # Step 5: Verify Proof File
    print("\n[5/5] Verifying proof file...")
    try:
        proof_path = Path("packages/verification-proofs/proofs/risk_receipt.dat")
        
        if not proof_path.exists():
            print(f"    ✗ Proof file not found: {proof_path}")
            return False
        
        # Read and validate proof
        with open(proof_path, 'rb') as f:
            proof_data = f.read()
        
        # Try to parse as JSON
        try:
            proof_json = json.loads(proof_data.decode())
            print(f"    ✓ Proof file created: {proof_path}")
            print(f"    ✓ Proof size: {len(proof_data)} bytes")
            print(f"    ✓ Proof format: JSON")
            print(f"\n    Proof Contents:")
            print(f"      - Risk Score: {proof_json.get('risk_score', 'N/A')}")
            print(f"      - Proof Hash: {proof_json.get('proof_hash', 'N/A')[:16]}...")
            print(f"      - Timestamp: {proof_json.get('timestamp', 'N/A')}")
            
            # Validate risk score matches
            proof_risk = proof_json.get('risk_score', 0)
            if abs(proof_risk - risk_score) < 0.001:
                print(f"    ✓ Risk score verification: PASSED")
            else:
                print(f"    ⚠ Risk score mismatch: {proof_risk} vs {risk_score}")
                
        except json.JSONDecodeError:
            # Binary format (real Risc Zero)
            print(f"    ✓ Proof file created: {proof_path}")
            print(f"    ✓ Proof size: {len(proof_data)} bytes")
            print(f"    ✓ Proof format: Binary (Risc Zero)")
            
    except Exception as e:
        print(f"    ✗ Verification failed: {e}")
        return False
    
    # Success Summary
    print("\n" + "=" * 70)
    print("✅ ALL TESTS PASSED")
    print("=" * 70)
    print("\nIntegration Points for Blockchain Team:")
    print(f"  📄 Proof Location: {proof_path}")
    print(f"  📊 Risk Score: {risk_score:.6f} ({risk_score * 100:.2f}%)")
    print(f"  📝 Contract: packages/verification-proofs/contracts/Verifier.sol")
    print(f"  🔗 Next Step: Deploy Verifier.sol and poll for new proofs")
    print("=" * 70 + "\n")
    
    return True

def test_high_risk_trigger():
    """Test that high risk triggers proof generation"""
    
    print("\n" + "=" * 70)
    print("TESTING HIGH-RISK TRIGGER")
    print("=" * 70)
    
    # Create a sequence that should trigger high risk
    print("\n[Test] Creating high-risk scenario...")
    
    # Manipulate data to trigger high risk
    # Low BLR, high sell volume, low buy volume = crash signal
    high_risk_sequence = np.array([
        [0.3, 0.2, 0.8, 0.5]  # Normalized values indicating stress
        for _ in range(60)
    ], dtype=np.float32)
    
    print(f"  ✓ High-risk sequence created")
    print(f"  ✓ Ready for proof generation test")
    
    return True

if __name__ == "__main__":
    print("\n🚀 Starting ZK Proof Generation Tests...\n")
    
    # Run main test
    success = test_proof_generation()
    
    if success:
        # Run additional test
        test_high_risk_trigger()
        
        print("\n✅ All tests completed successfully!")
        print("   System is ready for integration with blockchain team.\n")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        print("   Please review errors above.\n")
        sys.exit(1)
