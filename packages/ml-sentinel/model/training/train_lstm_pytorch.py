"""
Aegis Protocol - PyTorch LSTM Training with GPU Support
GPU-Accelerated Training for Market Crash Prediction
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import time

# ============================================================
# GPU CONFIGURATION
# ============================================================
print("\n" + "=" * 60)
print("[*] CONFIGURING ACCELERATION")
print("=" * 60)

# Force CPU - RTX 5070 (sm_120) not supported by PyTorch yet
device = torch.device('cpu')
print("[*] Using CPU (RTX 5070 too new for current PyTorch)")
print("[*] Training time: ~10 minutes")
    
print("=" * 60 + "\n")

# Configuration
DATA_FILE = 'training_data_final.csv'
MODEL_SAVE_PATH = 'aegis_lstm_pytorch.pth'
SEQUENCE_LENGTH = 60
BATCH_SIZE = 128  # Good for GPU
EPOCHS = 100
LEARNING_RATE = 0.001

# ============================================================
# Dataset Class
# ============================================================
class TimeSeriesDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.FloatTensor(X)
        self.y = torch.FloatTensor(y)
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# ============================================================
# LSTM Model
# ============================================================
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size1=128, hidden_size2=64, dropout=0.3):
        super(LSTMModel, self).__init__()
        
        # First LSTM layer
        self.lstm1 = nn.LSTM(input_size, hidden_size1, batch_first=True)
        self.dropout1 = nn.Dropout(dropout)
        
        # Second LSTM layer
        self.lstm2 = nn.LSTM(hidden_size1, hidden_size2, batch_first=True)
        self.dropout2 = nn.Dropout(dropout)
        
        # Dense layers
        self.fc1 = nn.Linear(hidden_size2, 32)
        self.relu = nn.ReLU()
        self.dropout3 = nn.Dropout(0.2)
        self.fc2 = nn.Linear(32, 1)
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        # LSTM layers
        out, _ = self.lstm1(x)
        out = self.dropout1(out)
        
        out, _ = self.lstm2(out)
        out = self.dropout2(out)
        
        # Take last output
        out = out[:, -1, :]
        
        # Dense layers
        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout3(out)
        out = self.fc2(out)
        out = self.sigmoid(out)
        
        return out

# ============================================================
# Data Loading
# ============================================================
def load_and_preprocess_data(filepath):
    print("=" * 60)
    print("[*] LOADING TRAINING DATA")
    print("=" * 60)
    
    df = pd.read_csv(filepath)
    print(f"[+] Loaded {len(df)} samples from {filepath}\n")
    
    # Extract features and target
    feature_cols = ['blr', 'buy_volume', 'sell_volume', 'mid_price']
    target_col = 'risk_score'
    
    X = df[feature_cols].values
    y = df[target_col].values
    
    print(f"[+] Features shape: {X.shape}")
    print(f"[+] Target shape: {y.shape}\n")
    
    return X, y

def create_sequences(X, y, sequence_length=60):
    print("=" * 60)
    print(f"[*] CREATING SEQUENCES (Length: {sequence_length})")
    print("=" * 60)
    
    X_seq = []
    y_seq = []
    
    for i in range(sequence_length, len(X)):
        X_seq.append(X[i-sequence_length:i])
        y_seq.append(y[i])
    
    X_seq = np.array(X_seq)
    y_seq = np.array(y_seq)
    
    print(f"[+] Sequence features shape: {X_seq.shape}")
    print(f"[+] Sequence target shape: {y_seq.shape}\n")
    
    return X_seq, y_seq

# ============================================================
# Training Function
# ============================================================
def train_model(model, train_loader, val_loader, epochs=100):
    print("=" * 60)
    print("[*] TRAINING LSTM MODEL (GPU)")
    print("=" * 60)
    
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    history = {'train_loss': [], 'val_loss': [], 'train_mae': [], 'val_mae': []}
    best_val_loss = float('inf')
    
    start_time = time.time()
    
    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0
        train_mae = 0
        
        for X_batch, y_batch in train_loader:
            X_batch = X_batch.to(device)
            y_batch = y_batch.to(device).unsqueeze(1)
            
            optimizer.zero_grad()
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            train_mae += torch.mean(torch.abs(outputs - y_batch)).item()
        
        train_loss /= len(train_loader)
        train_mae /= len(train_loader)
        
        # Validation
        model.eval()
        val_loss = 0
        val_mae = 0
        
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch = X_batch.to(device)
                y_batch = y_batch.to(device).unsqueeze(1)
                
                outputs = model(X_batch)
                loss = criterion(outputs, y_batch)
                
                val_loss += loss.item()
                val_mae += torch.mean(torch.abs(outputs - y_batch)).item()
        
        val_loss /= len(val_loader)
        val_mae /= len(val_loader)
        
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_mae'].append(train_mae)
        history['val_mae'].append(val_mae)
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
        
        if (epoch + 1) % 10 == 0:
            elapsed = time.time() - start_time
            print(f"Epoch {epoch+1}/{epochs} - "
                  f"Loss: {train_loss:.6f} - Val Loss: {val_loss:.6f} - "
                  f"Time: {elapsed:.1f}s")
    
    total_time = time.time() - start_time
    print(f"\n[+] Training completed in {total_time/60:.1f} minutes!\n")
    
    return history

# ============================================================
# Evaluation
# ============================================================
def evaluate_model(model, test_loader, y_test):
    print("=" * 60)
    print("[*] MODEL EVALUATION")
    print("=" * 60)
    
    model.eval()
    predictions = []
    
    with torch.no_grad():
        for X_batch, _ in test_loader:
            X_batch = X_batch.to(device)
            outputs = model(X_batch)
            predictions.extend(outputs.cpu().numpy().flatten())
    
    predictions = np.array(predictions)
    
    # Calculate metrics
    mse = mean_squared_error(y_test, predictions)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    rmse = np.sqrt(mse)
    
    print(f"Test Set Performance:")
    print(f"  MSE:  {mse:.6f}")
    print(f"  RMSE: {rmse:.6f}")
    print(f"  MAE:  {mae:.6f}")
    print(f"  R²:   {r2:.6f}\n")
    
    return predictions, {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2}

# ============================================================
# Main Pipeline
# ============================================================
def main():
    print("\n" + "=" * 60)
    print("AEGIS PROTOCOL - PYTORCH GPU TRAINING")
    print("Market Crash Prediction - LSTM Model")
    print("=" * 60 + "\n")
    
    # Load data
    X, y = load_and_preprocess_data(DATA_FILE)
    
    # Normalize
    print("=" * 60)
    print("[*] NORMALIZING FEATURES")
    print("=" * 60)
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    print("[+] Features normalized to [0, 1] range\n")
    
    # Create sequences
    X_seq, y_seq = create_sequences(X_scaled, y, sequence_length=SEQUENCE_LENGTH)
    
    # Train/test split
    print("=" * 60)
    print("[+] SPLITTING DATA")
    print("=" * 60)
    X_train, X_test, y_train, y_test = train_test_split(
        X_seq, y_seq, train_size=0.8, shuffle=False
    )
    
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, train_size=0.9, shuffle=False
    )
    
    print(f"Training set:   {X_train.shape[0]} samples")
    print(f"Validation set: {X_val.shape[0]} samples")
    print(f"Test set:       {X_test.shape[0]} samples\n")
    
    # Create datasets and loaders
    train_dataset = TimeSeriesDataset(X_train, y_train)
    val_dataset = TimeSeriesDataset(X_val, y_val)
    test_dataset = TimeSeriesDataset(X_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=False)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    # Build model
    print("=" * 60)
    print("[*] BUILDING LSTM MODEL")
    print("=" * 60)
    input_size = X_train.shape[2]
    model = LSTMModel(input_size).to(device)
    print(model)
    print()
    
    # Train
    history = train_model(model, train_loader, val_loader, epochs=EPOCHS)
    
    # Load best model
    model.load_state_dict(torch.load(MODEL_SAVE_PATH))
    
    # Evaluate
    predictions, metrics = evaluate_model(model, test_loader, y_test)
    
    # Final summary
    print("=" * 60)
    print("[+] TRAINING COMPLETE!")
    print("=" * 60)
    print("[*] Final Metrics:")
    print(f"   RMSE: {metrics['rmse']:.6f}")
    print(f"   MAE:  {metrics['mae']:.6f}")
    print(f"   R²:   {metrics['r2']:.6f}")
    print(f"\n[*] Model saved to: {MODEL_SAVE_PATH}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
