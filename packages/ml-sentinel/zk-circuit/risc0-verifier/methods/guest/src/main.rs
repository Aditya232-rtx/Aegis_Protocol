// LSTM Forward Pass in Risc Zero zkVM
// Proves crash prediction without revealing model weights

#![no_main]
#![no_std]

use risc0_zkvm::guest::env;

risc0_zkvm::guest::entry!(main);

/// LSTM model weights structure
#[derive(serde::Deserialize)]
struct LSTMWeights {
    // LSTM Layer 1 (128 units)
    lstm1_kernel: Vec<Vec<f32>>,      // [4, 512] - input to gates
    lstm1_recurrent: Vec<Vec<f32>>,   // [128, 512] - hidden to gates  
    lstm1_bias: Vec<f32>,             // [512]
    
    // LSTM Layer 2 (64 units)
    lstm2_kernel: Vec<Vec<f32>>,      // [128, 256]
    lstm2_recurrent: Vec<Vec<f32>>,   // [64, 256]
    lstm2_bias: Vec<f32>,             // [256]
    
    // Dense Layer (output)
    dense_kernel: Vec<Vec<f32>>,      // [64, 1]
    dense_bias: Vec<f32>,             // [1]
}

/// Market data input (60 timesteps x 4 features)
#[derive(serde::Deserialize)]
struct MarketData {
    sequence: Vec<Vec<f32>>,  // [60, 4]
}

fn main() {
    // 1. Read inputs from host
    let weights: LSTMWeights = env::read();
    let market_data: MarketData = env::read();
    
    // 2. LSTM Forward Pass
    let hidden1 = lstm_layer_forward(
        &market_data.sequence,
        &weights.lstm1_kernel,
        &weights.lstm1_recurrent,
        &weights.lstm1_bias,
        128,
    );
    
    let hidden2 = lstm_layer_forward(
        &hidden1,
        &weights.lstm2_kernel,
        &weights.lstm2_recurrent,
        &weights.lstm2_bias,
        64,
    );
    
    // 3. Dense layer + Sigmoid
    let final_hidden = &hidden2[hidden2.len() - 1];
    let risk_score = dense_and_sigmoid(
        final_hidden,
        &weights.dense_kernel,
        &weights.dense_bias,
    );
    
    // 4. Commit risk score to public journal
    env::commit(&risk_score);
}

/// LSTM cell forward pass
fn lstm_layer_forward(
    inputs: &[Vec<f32>],
    kernel: &[Vec<f32>],
    recurrent: &[Vec<f32>],
    bias: &[f32],
    units: usize,
) -> Vec<Vec<f32>> {
    let seq_len = inputs.len();
    let mut outputs = Vec::with_capacity(seq_len);
    
    let mut h_prev = vec![0.0; units];
    let mut c_prev = vec![0.0; units];
    
    for t in 0..seq_len {
        let x_t = &inputs[t];
        
        // Compute input to all gates: W_x @ x_t
        let x_contrib = matmul_vec(kernel, x_t);
        
        // Compute hidden contribution: W_h @ h_{t-1}
        let h_contrib = matmul_vec(recurrent, &h_prev);
        
        // Add bias and split into 4 gates (each of size `units`)
        let mut gates = Vec::with_capacity(4 * units);
        for i in 0..(4 * units) {
            gates.push(x_contrib[i] + h_contrib[i] + bias[i]);
        }
        
        // Split gates: [forget, input, candidate, output]
        let f_t = sigmoid_vec(&gates[0..units]);
        let i_t = sigmoid_vec(&gates[units..2*units]);
        let c_tilde = tanh_vec(&gates[2*units..3*units]);
        let o_t = sigmoid_vec(&gates[3*units..4*units]);
        
        // Update cell state: C_t = f_t ⊙ C_{t-1} + i_t ⊙ C̃_t
        let mut c_t = Vec::with_capacity(units);
        for i in 0..units {
            c_t.push(f_t[i] * c_prev[i] + i_t[i] * c_tilde[i]);
        }
        
        // Update hidden state: h_t = o_t ⊙ tanh(C_t)
        let c_t_tanh = tanh_vec(&c_t);
        let mut h_t = Vec::with_capacity(units);
        for i in 0..units {
            h_t.push(o_t[i] * c_t_tanh[i]);
        }
        
        outputs.push(h_t.clone());
        h_prev = h_t;
        c_prev = c_t;
    }
    
    outputs
}

/// Dense layer followed by sigmoid activation
fn dense_and_sigmoid(input: &[f32], kernel: &[Vec<f32>], bias: &[f32]) -> f32 {
    let logit = dot(input, &kernel[0]) + bias[0];
    sigmoid(logit)
}

// === Helper Functions ===

fn matmul_vec(matrix: &[Vec<f32>], vec: &[f32]) -> Vec<f32> {
    matrix.iter().map(|row| dot(row, vec)).collect()
}

fn dot(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

fn sigmoid(x: f32) -> f32 {
    1.0 / (1.0 + (-x).exp())
}

fn sigmoid_vec(vec: &[f32]) -> Vec<f32> {
    vec.iter().map(|&x| sigmoid(x)).collect()
}

fn tanh_vec(vec: &[f32]) -> Vec<f32> {
    vec.iter().map(|&x| x.tanh()).collect()
}
