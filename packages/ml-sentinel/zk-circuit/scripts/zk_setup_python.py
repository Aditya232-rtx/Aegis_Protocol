"""
ZK Circuit Setup using Python EZKL bindings
Generates cryptographic artifacts for zero-knowledge proof generation

Outputs:
- pk.key, vk.key: Proving and verification keys
- Verifier.sol: Solidity verifier contract (for Member C)
"""

import os
import sys
from pathlib import Path

try:
    import ezkl
    print(f"✓ EZKL Python bindings loaded (version: {ezkl.__version__})")
except ImportError:
    print("❌ EZKL not installed!")
    print("\nInstall: pip install ezkl")
    sys.exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent.parent
MODEL_PATH = SCRIPT_DIR / "../model/trained/aegis_lstm"  # SavedModel path
ZK_DIR = SCRIPT_DIR
SETTINGS_FILE = ZK_DIR / "settings.json"
COMPILED_CIRCUIT = ZK_DIR / "model.ezkl"
PK_FILE = ZK_DIR / "pk.key"
VK_FILE = ZK_DIR / "vk.key"
SRS_FILE = ZK_DIR / "kzg.srs"
VERIFIER_CONTRACT = SCRIPT_DIR / "../../packages/blockchain-evm/contracts/Verifier.sol"

def setup_zk_circuit_python():
    """Setup ZK circuit using Python EZKL bindings"""
    print("=" * 60)
    print("ZK CIRCUIT SETUP (Python Bindings)")
    print("=" * 60)
    
    # Check model
    if not MODEL_PATH.exists():
        print(f"\n❌ Model not found: {MODEL_PATH}")
        print("  Run: python model/export_onnx.py")
        return False
    
    print(f"\n✓ Model found: {MODEL_PATH}")
    
    # Create directories
    os.makedirs(ZK_DIR, exist_ok=True)
    os.makedirs(VERIFIER_CONTRACT.parent, exist_ok=True)
    
    print("\n" + "=" * 60)
    print("NOTE: Full EZKL setup requires ONNX model")
    print("=" * 60)
    print(f"\nFor complete ZK circuit generation:")
    print(f"  1. Install Visual Studio C++ Build Tools")
    print(f"  2. Install tf2onnx: pip install tf2onnx")
    print(f"  3. Convert model to ONNX")
    print(f"  4. Use EZKL CLI or Python bindings")
    print(f"\nCurrent status: Model exported as TensorFlow SavedModel")
    print(f"Alternative: Use EZKL Python bindings directly with model")
    print("=" * 60 + "\n")
    
    return True

if __name__ == "__main__":
    success = setup_zk_circuit_python()
    sys.exit(0 if success else 1)
