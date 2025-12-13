"""
Blockchain Handoff Verification Script
Verifies that all ZK circuit artifacts are generated and ready for Member C

Checks:
1. ZK circuit files (pk.key, vk.key, settings.json, model.ezkl)
2. Solidity verifier contract (Verifier.sol)
3. Proof output directory

Outputs: SUCCESS message with file paths if ready for handoff
"""

import os
import sys
from pathlib import Path

# Define expected paths
ZK_DIR = Path("packages/ml-sentinel/zk-circuit")
BLOCKCHAIN_DIR = Path("packages/verification-proofs")

EXPECTED_FILES = {
    "Proving Key": ZK_DIR / "pk.key",
    "Verification Key": ZK_DIR / "vk.key",
    "Settings": ZK_DIR / "settings.json",
    "Compiled Circuit": ZK_DIR / "model.ezkl",
    "Verifier Contract": BLOCKCHAIN_DIR / "contracts/Verifier.sol",
}

EXPECTED_DIRS = {
    "Proofs Directory": BLOCKCHAIN_DIR / "proofs",
    "Contracts Directory": BLOCKCHAIN_DIR / "contracts",
}

def verify_handoff():
    """Verify blockchain handoff readiness"""
    print("\n" + "=" * 70)
    print("BLOCKCHAIN HANDOFF VERIFICATION")
    print("=" * 70 + "\n")
    
    all_ready = True
    existing_files = []
    missing_files = []
    
    # Check files
    print("[1/2] Checking ZK Artifacts...")
    for name, path in EXPECTED_FILES.items():
        abs_path = path.resolve()
        if abs_path.exists():
            file_size = abs_path.stat().st_size
            print(f"  ✓ {name}: {abs_path} ({file_size:,} bytes)")
            existing_files.append((name, abs_path))
        else:
            print(f"  ✗ {name}: NOT FOUND at {abs_path}")
            missing_files.append((name, abs_path))
            all_ready = False
    
    # Check directories
    print(f"\n[2/2] Checking Output Directories...")
    for name, path in EXPECTED_DIRS.items():
        abs_path = path.resolve()
        if abs_path.exists():
            print(f"  ✓ {name}: {abs_path}")
        else:
            print(f"  ℹ {name}: Creating {abs_path}")
            try:
                os.makedirs(abs_path, exist_ok=True)
                print(f"    Created successfully")
            except Exception as e:
                print(f"    Error: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    if all_ready:
        print("✅ SUCCESS: HANDOFF READY")
        print("=" * 70)
        print(f"\nAll ZK artifacts generated successfully!")
        print(f"\nGenerated Files ({len(existing_files)}):")
        for name, path in existing_files:
            print(f"  • {name}")
            print(f"    → {path}")
        print(f"\n🎯 Member C can now:")
        print(f"  1. Deploy Verifier.sol to blockchain")
        print(f"  2. Read proofs from packages/verification-proofs/proofs/")
        print(f"  3. Verify crash predictions on-chain")
    else:
        print("⏳ HANDOFF PENDING")
        print("=" * 70)
        print(f"\nMissing artifacts ({len(missing_files)}):")
        for name, path in missing_files:
            print(f"  • {name}: {path}")
        print(f"\n📋 To complete setup:")
        print(f"  1. Install Visual Studio C++ Build Tools")
        print(f"  2. Install tf2onnx: pip install tf2onnx")
        print(f"  3. Export ONNX model: python model/export_onnx.py")
        print(f"  4. Run ZK setup: python zk-circuit/scripts/zk_setup.py")
        print(f"\n  OR use EZKL CLI directly with the exported model")
    
    print("=" * 70 + "\n")
    
    return all_ready

if __name__ == "__main__":
    success = verify_handoff()
    sys.exit(0 if success else 1)
