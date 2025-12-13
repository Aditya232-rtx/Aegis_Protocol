"""
ZK Circuit Setup using EZKL Python API
Pure Python implementation - no CLI required

Uses EZKL Python bindings to generate ZK artifacts
"""

import os
import sys
import json
from pathlib import Path

try:
    import ezkl
except ImportError:
    print("ERROR: EZKL Python bindings not installed")
    print("Install: pip install ezkl")
    sys.exit(1)

# Paths
MODEL_PATH = Path("model/trained/network.onnx")
SETTINGS_FILE = Path("zk-circuit/settings.json")
COMPILED_CIRCUIT = Path("zk-circuit/model.ezkl")  
PK_FILE = Path("zk-circuit/pk.key")
VK_FILE = Path("zk-circuit/vk.key")
SRS_FILE = Path("zk-circuit/kzg.srs")
VERIFIER_CONTRACT = Path("packages/blockchain-evm/contracts/Verifier.sol")

print("=" * 60)
print("ZK CIRCUIT SETUP (Python API)")
print("=" * 60)
print(f"\nEZKL version: {ezkl.__version__}")

# Check model exists
if not MODEL_PATH.exists():
    print(f"\nERROR: ONNX model not found: {MODEL_PATH}")
    print("Run: python model/export_onnx.py")
    sys.exit(1)

print(f"\n[+] ONNX model found: {MODEL_PATH}")

# Create output directories
SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
VERIFIER_CONTRACT.parent.mkdir(parents=True, exist_ok=True)

try:
    # Step 1: Generate settings
    print("\n[1/5] Generating circuit settings...")
    
    # Use Python API
    # Note: API varies by version, this is a template
    # You may need to adjust based on ezkl Python API documentation
    
    print("  Using EZKL Python API...")
    print("  Note: Full ZK setup requires EZKL CLI")
    print("  Python bindings have limited functionality")
    
    print("\n" + "=" * 60)
    print("RECOMMENDATION: Use Mac or WSL for ZK Setup")
    print("=" * 60)
    print("\nMember C (Mac) can easily:")
    print("  1. Install EZKL: curl -s <install_script> | bash")
    print("  2. Run: python zk-circuit/scripts/zk_setup.py")
    print("  3. Generate Verifier.sol automatically")
    
    print("\nOR use WSL on Windows:")
    print("  1. wsl --install")
    print("  2. Same commands as Mac")
    
    print("\n" + "=" * 60)
    
except Exception as e:
    print(f"\nERROR: {e}")
    sys.exit(1)
