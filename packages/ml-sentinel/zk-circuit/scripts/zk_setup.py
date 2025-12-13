"""
ZK Circuit Setup Script
Generates cryptographic artifacts for zero-knowledge proof generation

This script prepares the ZK circuit for the LSTM crash prediction model.
Run once before production deployment.

Outputs:
- settings.json: Circuit configuration
- model.ezkl: Compiled circuit  
- pk.key: Proving key
- vk.key: Verification key
- Verifier.sol: Solidity verifier contract (for blockchain deployment)
"""

import os
import sys
import json
import subprocess
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent.parent
ONNX_MODEL = SCRIPT_DIR / "../model/trained/network.onnx"
ZK_DIR = SCRIPT_DIR
SETTINGS_FILE = ZK_DIR / "settings.json"
COMPILED_CIRCUIT = ZK_DIR / "model.ezkl"
PK_FILE = ZK_DIR / "pk.key"
VK_FILE = ZK_DIR / "vk.key"
SRS_FILE = ZK_DIR / "kzg.srs"
VERIFIER_CONTRACT = SCRIPT_DIR / "../../packages/blockchain-evm/contracts/Verifier.sol"

def check_ezkl():
    """Check if EZKL is installed"""
    # Try multiple possible locations
    ezkl_paths = [
        "ezkl",  # In PATH
        "C:\\ai-sentinel\\ezkl",  # Downloaded location
        str(Path.cwd().parent.parent / "ezkl"),  # Relative
    ]
    
    for ezkl_path in ezkl_paths:
        try:
            result = subprocess.run([ezkl_path, "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"[+] EZKL found: {result.stdout.strip()}")
                return ezkl_path
        except (FileNotFoundError, OSError):
            continue
    
    print("\n[!] EZKL not found!")
    print("\nInstall EZKL:")
    print("  Download: https://github.com/zkonduit/ezkl/releases")
    print("  Or: cargo install --git https://github.com/zkonduit/ezkl")
    return None

def run_ezkl_command(cmd, description):
    """Run an EZKL command with error handling"""
    print(f"\n[*] {description}...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"[+] {description} complete")
        if result.stdout:
            print(f"  Output: {result.stdout[:200]}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[!] {description} failed!")
        print(f"  Error: {e.stderr}")
        return False

def setup_zk_circuit():
    """Main setup function"""
    print("=" * 60)
    print("ZK CIRCUIT SETUP")
    print("="  * 60)
    
    # Check EZKL
    ezkl_path = check_ezkl()
    if not ezkl_path:
        return False
    
    # Check ONNX model
    if not ONNX_MODEL.exists():
        print(f"\n[!] ONNX model not found: {ONNX_MODEL}")
        print("  Run: python model/export_onnx.py")
        return False
    
    print(f"\n[+] ONNX model found: {ONNX_MODEL}")
    
    # Create output directories
    os.makedirs(ZK_DIR, exist_ok=True)
    os.makedirs(VERIFIER_CONTRACT.parent, exist_ok=True)
    
    # Step 1: Generate settings
    if not run_ezkl_command([
        ezkl_path, "gen-settings",
        "-M", str(ONNX_MODEL),
        "-O", str(SETTINGS_FILE),
        "--input-visibility", "public",
        "--param-visibility", "fixed"
    ], "Generating settings"):
        return False
    
    # Step 2: Compile circuit
    if not run_ezkl_command([
        ezkl_path, "compile-circuit",
        "-M", str(ONNX_MODEL),
        "-S", str(SETTINGS_FILE),
        "--compiled-circuit", str(COMPILED_CIRCUIT)
    ], "Compiling circuit"):
        return False
    
    # Step 3: Get SRS
    if not run_ezkl_command([
        ezkl_path, "get-srs",
        "-S", str(SETTINGS_FILE),
        "--srs-path", str(SRS_FILE)
    ], "Downloading SRS"):
        return False
    
    # Step 4: Setup (generate keys)
    if not run_ezkl_command([
        ezkl_path, "setup",
        "-M", str(COMPILED_CIRCUIT),
        "-S", str(SETTINGS_FILE),
        "--srs-path", str(SRS_FILE),
        "--pk-path", str(PK_FILE),
        "--vk-path", str(VK_FILE)
    ], "Generating proving/verification keys"):
        return False
    
    # Step 5: Create EVM verifier
    if not run_ezkl_command([
        ezkl_path, "create-evm-verifier",
        "-S", str(SETTINGS_FILE),
        "--srs-path", str(SRS_FILE),
        "--vk-path", str(VK_FILE),
        "--sol-code-path", str(VERIFIER_CONTRACT)
    ], "Creating Solidity verifier"):
        return False
    
    # Summary
    print("\n" + "=" * 60)
    print("[+] ZK CIRCUIT SETUP COMPLETE!")
    print("=" * 60)
    print(f"\nGenerated files:")
    print(f"  [*] {SETTINGS_FILE}")
    print(f"  [*] {COMPILED_CIRCUIT}")
    print(f"  [*] {PK_FILE}")
    print(f"  [*] {VK_FILE}")
    print(f"  [*] {VERIFIER_CONTRACT}")
    print(f"\nNext: Run prove_crash.py when risk > 0.8")
    print("=" * 60 + "\n")
    
    return True

if __name__ == "__main__":
    success = setup_zk_circuit()
    sys.exit(0 if success else 1)
