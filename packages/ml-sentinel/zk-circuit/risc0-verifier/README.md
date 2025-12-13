# Risc Zero zkVM Integration for LSTM Crash Prediction

## Overview

This directory contains the Risc Zero zero-knowledge VM integration for generating cryptographic proofs of LSTM crash predictions without revealing model weights.

## Why Risc Zero?

- **LSTM Support**: Unlike EZKL, Risc Zero's VM-based approach handles LSTM loops natively
- **Reliability**: Proven for complex computations
- **Flexibility**: General-purpose zkVM (not circuit-based)

## Project Structure

```
risc0-verifier/
├── Cargo.toml                  # Workspace configuration
├── host/                       # Host program (triggers proof generation)
│   ├── Cargo.toml
│   └── src/
│       └── main.rs             # Reads inputs, generates proof, saves receipt
├── methods/                    # Guest code package
│   ├── Cargo.toml
│   ├── build.rs  
│   ├── src/
│   │   └── lib.rs
│   └── guest/
│       ├── Cargo.toml
│       └── src/
│           └── main.rs         # LSTM forward pass in zkVM (the "proof logic")
└── README.md                   # This file
```

## Installation

### 1. Install Rust

```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri https://win.rustup.rs/ -OutFile rustup-init.exe
.\rustup-init.exe

# Linux/Mac
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Install Risc Zero Toolchain

```bash
cargo install cargo-risczero
cargo risczero install
```

### 3. Build the Project

```bash
cd packages/ml-sentinel/zk-circuit/risc0-verifier
cargo build --release
```

**Build time:** ~5-10 minutes (first time)  
**Binary location:** `target/release/host`

## Usage

### Automated (via Python)

The inference engine automatically triggers proof generation when risk > 0.8:

```python
# In inference.py (already integrated)
from prove_adapter import generate_risc_zero_proof

if risk_score > CRASH_THRESHOLD:
    if generate_risc_zero_proof(self.model, current_sequence):
        logger.info("✓ RISC ZERO PROOF GENERATED")
```

### Manual (for testing)

1. **Create input file** (`zk_input.json`):
```json
{
  "weights": {
    "lstm1_kernel": [[...]],
    "lstm1_recurrent": [[...]],
    "lstm1_bias": [...],
    "lstm2_kernel": [[...]],
    "lstm2_recurrent": [[...]],
    "lstm2_bias": [...],
    "dense_kernel": [[...]],
    "dense_bias": [...]
  },
  "market_data": {
    "sequence": [
      [blr, buy_volume, sell_volume, mid_price],
      ... // 60 timesteps
    ]
  }
}
```

2. **Run host binary**:
```bash
cd risc0-verifier
./target/release/host
```

3. **Output**:
- Proof saved to: `../../verification-proofs/proofs/risk_receipt.dat`
- Risk score printed to console

## How It Works

### Guest Code (zkVM)

The **guest code** (`methods/guest/src/main.rs`) runs inside the zero-knowledge virtual machine:

1. Receives model weights and market data as inputs
2. Performs LSTM forward pass:
   - Layer 1: 128 LSTM units
   - Layer 2: 64 LSTM units  
   - Dense: Output layer
3. Computes risk score via sigmoid activation
4. **Commits** risk score to public journal (this becomes the "proof")

**Key Point:** Weights remain private. Only the risk score is revealed.

### Host Code (Trigger)

The **host code** (`host/src/main.rs`) runs on the local machine:

1. Reads `zk_input.json` with weights and market data
2. Sets up zkVM environment
3. Executes guest code in zkVM
4. Generates cryptographic **receipt** (the proof)
5. Saves receipt to `verification-proofs/proofs/risk_receipt.dat`

## Verification

The generated proof can be verified on-chain using the Risc Zero verifier contract.

**Contract location:** `packages/verification-proofs/contracts/RiscZeroVerifier.sol`

```solidity
function verify(
    bytes calldata seal,
    bytes32 imageId,
    bytes calldata journal
) external view returns (bool);
```

## Performance

- **Proof generation time:** 30-60 seconds
- **Proof size:** ~200 KB
- **Trade-off:** Reliability over speed (acceptable for high-risk events)

## Troubleshooting

### "Host binary not found"
**Solution:** Build the project first:
```bash
cd risc0-verifier
cargo build --release
```

### "cargo: command not found"
**Solution:** Install Rust (see Installation section)

### "failed to compile guest"
**Solution:** Install Risc Zero toolchain:
```bash
cargo install cargo-risczero
cargo risczero install
```

### Proof generation timeout
- Increase timeout in `prove_adapter.py` (currently 120s)
- Check system resources (proof generation is CPU-intensive)

## Development

### Testing the Guest Code

```bash
cd risc0-verifier
cargo test --release
```

### Testing End-to-End

1. Export a test input:
```bash
python -c "
import json
weights = {'lstm1_kernel': [[0.1]*512]*4, ...}  # simplified
market_data = {'sequence': [[1.0, 5000, 5000, 3000]]*60}
json.dump({'weights': weights, 'market_data': market_data}, open('zk_input.json', 'w'))
"
```

2. Run host:
```bash
./target/release/host
```

## Next Steps

- [ ] Deploy `RiscZeroVerifier.sol` to testnet
- [ ] Test on-chain verification
- [ ] Optimize proof generation time
- [ ] Add batching for multiple predictions

---

**Built with Risc Zero zkVM - Reliable Zero-Knowledge Proofs**
