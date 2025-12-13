// Risc Zero Host - Triggers ZK Proof Generation
// Reads inputs from Python inference engine and generates proof

use risc0_zkvm::{default_prover, ExecutorEnv};
use serde::{Deserialize, Serialize};
use std::fs;

// Import the guest binary
use methods::{LSTM_VERIFY_ELF, LSTM_VERIFY_ID};

#[derive(Serialize, Deserialize)]
struct LSTMWeights {
    lstm1_kernel: Vec<Vec<f32>>,
    lstm1_recurrent: Vec<Vec<f32>>,
    lstm1_bias: Vec<f32>,
    lstm2_kernel: Vec<Vec<f32>>,
    lstm2_recurrent: Vec<Vec<f32>>,
    lstm2_bias: Vec<f32>,
    dense_kernel: Vec<Vec<f32>>,
    dense_bias: Vec<f32>,
}

#[derive(Serialize, Deserialize)]
struct MarketData {
    sequence: Vec<Vec<f32>>,
}

#[derive(Serialize, Deserialize)]
struct ZKInput {
    weights: LSTMWeights,
    market_data: MarketData,
}

fn main() {
    println!("=".repeat(60));
    println!("RISC ZERO - LSTM CRASH PREDICTION PROOF");
    println!("=".repeat(60));
    
    // 1. Read input from file (exported by inference.py)
    println!("\n[1/4] Reading inputs from zk_input.json...");
    let input_path = "../../zk_input.json";
    let input_str = fs::read_to_string(input_path)
        .expect("Failed to read zk_input.json");
    let zk_input: ZKInput = serde_json::from_str(&input_str)
        .expect("Failed to parse zk_input.json");
    
    println!("    ✓ Loaded {} timesteps", zk_input.market_data.sequence.len());
    
    // 2. Build executor environment with inputs
    println!("\n[2/4] Setting up zkVM environment...");
    let env = ExecutorEnv::builder()
        .write(&zk_input.weights).unwrap()
        .write(&zk_input.market_data).unwrap()
        .build().unwrap();
    
    println!("    ✓ Environment configured");
    
    // 3. Generate proof (this runs guest code in zkVM)
    println!("\n[3/4] Generating zero-knowledge proof...");
    println!("    (This may take 30-60 seconds...)");
    
    let prover = default_prover();
    let prove_info = prover
        .prove(env, LSTM_VERIFY_ELF)
        .expect("Failed to generate proof");
    
    let receipt = prove_info.receipt;
    println!("    ✓ Proof generated successfully!");
    
    // 4. Extract risk score from journal (public output)
    let risk_score: f32 = receipt.journal.decode().expect("Failed to decode journal");
    println!("\n[4/4] Risk Score (proven): {:.6}", risk_score);
    
    // 5. Save receipt (proof) to file
    let proof_path = "../../../verification-proofs/proofs/risk_receipt.dat";
    fs::create_dir_all("../../../verification-proofs/proofs").ok();
    
    let receipt_bytes = bincode::serialize(&receipt).expect("Failed to serialize receipt");
    fs::write(proof_path, receipt_bytes).expect("Failed to write proof");
    
    println!("\n✅ Proof saved to: {}", proof_path);
    println!("=".repeat(60));
    println!("RISC ZERO PROOF GENERATION COMPLETE");
    println!("=".repeat(60));
    println!("\nimage_id: {:?}", LSTM_VERIFY_ID);
    println!("risk_score: {:.6}", risk_score);
    println!("\n");
}
