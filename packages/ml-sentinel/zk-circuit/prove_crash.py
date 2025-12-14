"""
ZK Crash Proof Generator
Generates zero-knowledge proof when market crash is detected

This script is triggered automatically by inference.py when risk > 0.8
It creates a cryptographic proof that can be verified on-chain.

Input: crash_input.json (market data that triggered crash detection)
Output: ../../packages/blockchain-evm/proofs/crash_proof.json
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Paths
SCRIPT_DIR = Path(__file__).parent
ZK_DIR = SCRIPT_DIR.parent
COMPILED_CIRCUIT = ZK_DIR / "model.ezkl"
PK_FILE = ZK_DIR / "pk.key"
VK_FILE = ZK_DIR / "vk.key"
SRS_FILE = ZK_DIR / "kzg.srs"
SETTINGS_FILE = ZK_DIR / "settings.json"

# Input/Output paths
INPUT_DATA_FILE = ZK_DIR / "crash_input.json"
WITNESS_FILE = ZK_DIR / "witness.json"
PROOF_FILE = Path("../../packages/blockchain-evm/proofs/crash_proof.json")
PROOF_FILE = (SCRIPT_DIR / PROOF_FILE).resolve()

def check_prerequisites():
    """Verify all required files exist"""
    required_files = [
        (COMPILED_CIRCUIT, "Compiled circuit"),
        (PK_FILE, "Proving key"),
        (VK_FILE, "Verification key"),
        (SRS_FILE, "SRS file"),
        (SETTINGS_FILE, "Settings file"),
        (INPUT_DATA_FILE, "Input data")
    ]
    
    missing = []
    for file_path, name in required_files:
        if not file_path.exists():
            missing.append(f"  - {name}: {file_path}")
    
    if missing:
        print("❌ Missing required files:")
        print("\n".join(missing))
        print("\nRun zk_setup.py first!")
        return False
    
    return True

def generate_proof(input_path=None):
    """Generate ZK proof for crash prediction"""
    print("\n" + "=" * 60)
    print("ZK PROOF GENERATION")
    print("=" * 60)
    
    # Use provided input or default
    if input_path:
        input_file = Path(input_path)
    else:
        input_file = INPUT_DATA_FILE
    
    if not check_prerequisites():
        return False
    
    print(f"\n[1/3] Loading input data: {input_file}")
    try:
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        print(f"  ✓ Input data loaded")
    except Exception as e:
        print(f"  ✗ Failed to load input: {e}")
        return False
    
    # Create proof output directory
    os.makedirs(PROOF_FILE.parent, exist_ok=True)
    
    # Generate witness
    print(f"\n[2/3] Generating witness...")
    try:
        result = subprocess.run([
            "ezkl", "gen-witness",
            "-M", str(COMPILED_CIRCUIT),
            "-I", str(input_file),
            "-O", str(WITNESS_FILE),
            "-S", str(SETTINGS_FILE)
        ], capture_output=True, text=True, check=True)
        print(f"  ✓ Witness generated")
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Witness generation failed: {e.stderr}")
        return False
    
    # Generate proof
    print(f"\n[3/3] Generating zero-knowledge proof...")
    try:
        result = subprocess.run([
            "ezkl", "prove",
            "-M", str(COMPILED_CIRCUIT),
            "-W", str(WITNESS_FILE),
            "--pk-path", str(PK_FILE),
            "--proof-path", str(PROOF_FILE),
            "--srs-path", str(SRS_FILE)
        ], capture_output=True, text=True, check=True)
        print(f"  ✓ Proof generated")
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Proof generation failed: {e.stderr}")
        return False
    
    # Add metadata to proof
    try:
        with open(PROOF_FILE, 'r') as f:
            proof_data = json.load(f)
        
        # Add metadata
        proof_with_metadata = {
            "proof": proof_data,
            "timestamp": datetime.now().isoformat(),
            "input": input_data,
            "type": "market_crash_prediction"
        }
        
        with open(PROOF_FILE, 'w') as f:
            json.dump(proof_with_metadata, f, indent=2)
        
        print(f"\n✅ PROOF GENERATED SUCCESSFULLY!")
        print(f"   Saved to: {PROOF_FILE}")
        print(f"   Size: {PROOF_FILE.stat().st_size} bytes")
    except Exception as e:
        print(f"Warning: Could not add metadata: {e}")
    
    print("=" * 60 + "\n")
    return True

if __name__ == "__main__":
    # Accept input file path as argument
    input_path = sys.argv[1] if len(sys.argv) > 1 else None
    success = generate_proof(input_path)
    sys.exit(0 if success else 1)
