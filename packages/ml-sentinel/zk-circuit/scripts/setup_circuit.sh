#!/bin/bash
# EZKL Circuit Setup Script
# Automates ZK circuit generation for LSTM crash prediction model

set -e  # Exit on error

echo "============================================================"
echo "EZKL ZK CIRCUIT SETUP"
echo "============================================================"
echo ""

# Configuration
MODEL_PATH="../model/trained/network.onnx"
INPUT_JSON="input.json"
SETTINGS_JSON="settings.json"
COMPILED_CIRCUIT="network.ezkl"
PK_PATH="pk.key"
VK_PATH="vk.key"
VERIFIER_SOL="Verifier.sol"
SRS_PATH="kzg.srs"

# Check if EZKL is installed
if ! command -v ezkl &> /dev/null; then
    echo "❌ EZKL not found!"
    echo ""
    echo "Please install EZKL:"
    echo "  cargo install --git https://github.com/zkonduit/ezkl"
    echo ""
    echo "Or download from: https://github.com/zkonduit/ezkl/releases"
    exit 1
fi

echo "✓ EZKL found: $(ezkl --version)"
echo ""

# Step 1: Generate Settings
echo "[1/6] Generating circuit settings..."
ezkl gen-settings \
    -M $MODEL_PATH \
    -O $SETTINGS_JSON \
    --input-visibility public \
    --param-visibility fixed

echo "✓ Settings generated: $SETTINGS_JSON"
echo ""

# Step 2: Compile Circuit
echo "[2/6] Compiling circuit..."
ezkl compile-circuit \
    -M $MODEL_PATH \
    -S $SETTINGS_JSON \
    --compiled-circuit $COMPILED_CIRCUIT

echo "✓ Circuit compiled: $COMPILED_CIRCUIT"
echo ""

# Step 3: Get SRS (Structured Reference String)
echo "[3/6] Downloading SRS..."
ezkl get-srs \
    -S $SETTINGS_JSON \
    --srs-path $SRS_PATH

echo "✓ SRS downloaded: $SRS_PATH"
echo ""

# Step 4: Setup (Generate proving & verification keys)
echo "[4/6] Generating proving/verification keys..."
ezkl setup \
    -M $COMPILED_CIRCUIT \
    -S $SETTINGS_JSON \
    --srs-path $SRS_PATH \
    --pk-path $PK_PATH \
    --vk-path $VK_PATH

echo "✓ Keys generated:"
echo "  - Proving key: $PK_PATH"
echo "  - Verification key: $VK_PATH"
echo ""

# Step 5: Create EVM Verifier Contract
echo "[5/6] Creating Solidity verifier contract..."
ezkl create-evm-verifier \
    -S $SETTINGS_JSON \
    --srs-path $SRS_PATH \
    --vk-path $VK_PATH \
    --sol-code-path $VERIFIER_SOL \
    --deployment-code-path verifier_bytecode.txt

echo "✓ Verifier contract created: $VERIFIER_SOL"
echo ""

# Step 6: Summary
echo "[6/6] Setup complete!"
echo ""
echo "============================================================"
echo "✅ ZK CIRCUIT SETUP SUCCESSFUL"
echo "============================================================"
echo ""
echo "Generated files:"
echo "  📄 $SETTINGS_JSON       - Circuit configuration"
echo "  📦 $COMPILED_CIRCUIT    - Compiled circuit"
echo "  🔑 $PK_PATH             - Proving key"
echo "  🔑 $VK_PATH             - Verification key"
echo "  📜 $VERIFIER_SOL        - Solidity verifier contract"
echo ""
echo "Next steps:"
echo "  1. Generate proof:   ezkl prove ..."
echo "  2. Verify proof:     ezkl verify ..."
echo "  3. Deploy Verifier.sol to blockchain"
echo ""
echo "============================================================"
