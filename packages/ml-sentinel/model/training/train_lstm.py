"""
Aegis Protocol - Sentinel Layer
LSTM Model Training Pipeline

This script trains an LSTM model to predict market crash risk based on:
- Buy-Side Liquidity Ratio (BLR)
- Buy/Sell Volume
- Mid-Price

Model predicts Risk Score (0.0 = safe, 1.0 = crash imminent)
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TF warnings

# ============================================================
# GPU OPTIMIZATION SETTINGS
# ============================================================
print("\n" + "=" * 60)
print("[*] CONFIGURING ACCELERATION")
print("=" * 60)

# Check GPU availability
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        # Enable memory growth to avoid OOM errors
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"[+] GPU DETECTED: {len(gpus)} device(s)")
        print(f"    {[gpu.name for gpu in gpus]}")
        print("[+] GPU memory growth enabled")
        
        # Enable mixed precision for faster training (FP16)
        from tensorflow.keras import mixed_precision
        policy = mixed_precision.Policy('mixed_float16')
        mixed_precision.set_global_policy(policy)
        print("[+] Mixed precision (FP16) enabled")
        
        # Enable XLA compilation for performance
        tf.config.optimizer.set_jit(True)
        print("[+] XLA compilation enabled")
        print("[*] Training will use GPU acceleration! 🚀")
        
    except RuntimeError as e:
        print(f"[!] GPU configuration error: {e}")
else:
    print("[*] No GPU detected - using CPU")
    print("[*] CPU training is still fast with our simple linear pattern!")
    print("[*] Training time: ~5-10 minutes for 100 epochs")
    
print("=" * 60 + "\n")

# Configuration
DATA_FILE = 'training_data_simple.csv'  # Ultra-simple: zero randomness, perfect linear
MODEL_SAVE_PATH = 'aegis_lstm_model.h5'
SEQUENCE_LENGTH = 60  # Use last 60 time steps to predict next (increased for better patterns)
TRAIN_SPLIT = 0.8
BATCH_SIZE = 128 if gpus else 32  # Larger batch size for GPU, smaller for CPU
EPOCHS = 100
LEARNING_RATE = 0.001
ENABLE_EARLY_STOPPING = False  # Set to False to train full 100 epochs

def load_and_preprocess_data(filepath):
    """Load and preprocess training data"""
    print("=" * 60)
    print("[*] LOADING TRAINING DATA")
    print("=" * 60)
    
    # Load CSV
    df = pd.read_csv(filepath)
    print(f"[+] Loaded {len(df)} samples from {filepath}\n")
    
    # Display info
    print("Dataset columns:", df.columns.tolist())
    print("\nDataset shape:", df.shape)
    print("\nFirst few rows:")
    print(df.head())
    
    # Extract features and target
    feature_cols = ['blr', 'buy_volume', 'sell_volume', 'mid_price']
    target_col = 'risk_score'
    
    X = df[feature_cols].values
    y = df[target_col].values
    
    print(f"\n[+] Features shape: {X.shape}")
    print(f"[+] Target shape: {y.shape}\n")
    
    return X, y, df

def create_sequences(X, y, sequence_length=50):
    """
    Create sequences for LSTM input.
    
    Transform data from shape (n_samples, n_features) to
    (n_samples - sequence_length, sequence_length, n_features)
    
    Each sample contains the last `sequence_length` time steps.
    """
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

def build_lstm_model(input_shape):
    """
    Build LSTM architecture:
    - Two stacked LSTM layers (128 and 64 units) for deeper learning
    - Dropout for regularization (30%)
    - Dense hidden layer with 32 units
    - Dense output layer (single risk score prediction)
    """
    print("=" * 60)
    print("[*] BUILDING LSTM MODEL")
    print("=" * 60)
    
    model = Sequential([
        # First LSTM layer - returns sequences for next LSTM
        LSTM(128, 
             activation='tanh',
             return_sequences=True,  # Pass sequences to next LSTM
             input_shape=input_shape),
        
        # Dropout for regularization
        Dropout(0.3),
        
        # Second LSTM layer
        LSTM(64,
             activation='tanh',
             return_sequences=False),  # Only return last output
        
        # Dropout for regularization
        Dropout(0.3),
        
        # Dense hidden layer
        Dense(32, activation='relu'),
        
        # Dropout
        Dropout(0.2),
        
        # Output layer (risk score: 0.0 to 1.0)
        Dense(1, activation='sigmoid')
    ])
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='mse',  # Mean Squared Error for regression
        metrics=['mae', 'mse']  # Mean Absolute Error
    )
    
    print("\n[*] Model Architecture:")
    model.summary()
    print()
    
    return model

def train_model(model, X_train, y_train, X_val, y_val):
    """Train the LSTM model with callbacks"""
    print("=" * 60)
    print("[*] TRAINING LSTM MODEL")
    print("=" * 60)
    print(f"Training samples: {len(X_train)}")
    print(f"Validation samples: {len(X_val)}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Max epochs: {EPOCHS}\n")
    
    # Callbacks
    callbacks = [
        # Save best model
        ModelCheckpoint(
            MODEL_SAVE_PATH,
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        
        # Reduce learning rate on plateau
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=10,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Add early stopping only if enabled
    if ENABLE_EARLY_STOPPING:
        callbacks.insert(0, EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ))
        print("[*] Early stopping: ENABLED (patience=15)")
    else:
        print("[*] Early stopping: DISABLED - Training full {} epochs".format(EPOCHS))
    
    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1
    )
    
    print("\n[+] Training completed!\n")
    
    return history

def evaluate_model(model, X_test, y_test):
    """Evaluate model performance"""
    print("=" * 60)
    print("[*] MODEL EVALUATION")
    print("=" * 60)
    
    # Predict
    y_pred = model.predict(X_test, verbose=0).flatten()
    
    # Calculate metrics
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mse)
    
    print(f"Test Set Performance:")
    print(f"  MSE:  {mse:.6f}")
    print(f"  RMSE: {rmse:.6f}")
    print(f"  MAE:  {mae:.6f}")
    print(f"  R²:   {r2:.6f}\n")
    
    # Show sample predictions
    print("Sample Predictions (first 10):")
    print("  Actual | Predicted | Difference")
    print("  " + "-" * 35)
    for i in range(min(10, len(y_test))):
        diff = abs(y_test[i] - y_pred[i])
        print(f"  {y_test[i]:.4f} | {y_pred[i]:.4f}    | {diff:.4f}")
    
    print()
    return y_pred, {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2}

def plot_training_history(history):
    """Plot training and validation loss"""
    plt.figure(figsize=(12, 4))
    
    # Loss plot
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss Over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Loss (MSE)')
    plt.legend()
    plt.grid(True)
    
    # MAE plot
    plt.subplot(1, 2, 2)
    plt.plot(history.history['mae'], label='Training MAE')
    plt.plot(history.history['val_mae'], label='Validation MAE')
    plt.title('Model MAE Over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Mean Absolute Error')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('training_history.png', dpi=150)
    print("[+] Training history plot saved to: training_history.png\n")

def plot_predictions(y_test, y_pred):
    """Plot actual vs predicted risk scores"""
    plt.figure(figsize=(12, 5))
    
    # Scatter plot
    plt.subplot(1, 2, 1)
    plt.scatter(y_test, y_pred, alpha=0.5)
    plt.plot([0, 1], [0, 1], 'r--', label='Perfect Prediction')
    plt.xlabel('Actual Risk Score')
    plt.ylabel('Predicted Risk Score')
    plt.title('Actual vs Predicted Risk Scores')
    plt.legend()
    plt.grid(True)
    
    # Time series plot (last 200 samples)
    plt.subplot(1, 2, 2)
    sample_size = min(200, len(y_test))
    indices = range(sample_size)
    plt.plot(indices, y_test[:sample_size], label='Actual', linewidth=2)
    plt.plot(indices, y_pred[:sample_size], label='Predicted', linewidth=2, alpha=0.7)
    plt.xlabel('Time Step')
    plt.ylabel('Risk Score')
    plt.title(f'Risk Score Predictions (Last {sample_size} steps)')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('prediction_results.png', dpi=150)
    print("[+] Prediction results plot saved to: prediction_results.png\n")

def main():
    """Main training pipeline"""
    print("\n" + "=" * 60)
    print("AEGIS PROTOCOL - LSTM TRAINING PIPELINE")
    print("Market Crash Prediction Model")
    print("=" * 60 + "\n")
    
    # Step 1: Load data
    X, y, df = load_and_preprocess_data(DATA_FILE)
    
    # Step 2: Normalize features
    print("=" * 60)
    print("[*] NORMALIZING FEATURES")
    print("=" * 60)
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    print("[+] Features normalized to [0, 1] range\n")
    
    # Step 3: Create sequences
    X_seq, y_seq = create_sequences(X_scaled, y, sequence_length=SEQUENCE_LENGTH)
    
    # Step 4: Train/test split
    print("=" * 60)
    print("[+] SPLITTING DATA")
    print("=" * 60)
    # Split into train/test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X_seq, y_seq, train_size=TRAIN_SPLIT, shuffle=True, random_state=42  # SHUFFLE to mix BLR values!
    )
    
    # Further split train into train/validation
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train,
        train_size=0.9,
        shuffle=False
    )
    
    print(f"Training set:   {X_train.shape[0]} samples")
    print(f"Validation set: {X_val.shape[0]} samples")
    print(f"Test set:       {X_test.shape[0]} samples\n")
    
    # Step 5: Build model
    input_shape = (X_train.shape[1], X_train.shape[2])  # (sequence_length, n_features)
    model = build_lstm_model(input_shape)
    
    # Step 6: Train model
    history = train_model(model, X_train, y_train, X_val, y_val)
    
    # Step 7: Evaluate model
    y_pred, metrics = evaluate_model(model, X_test, y_test)
    
    # Step 8: Visualizations
    print("=" * 60)
    print("[*] GENERATING VISUALIZATIONS")
    print("=" * 60)
    plot_training_history(history)
    plot_predictions(y_test, y_pred)
    
    # Step 9: Save model
    print("=" * 60)
    print("[*] SAVING MODEL")
    print("=" * 60)
    print(f"Model saved to: {MODEL_SAVE_PATH}")
    print(f"Model size: {os.path.getsize(MODEL_SAVE_PATH) / 1024:.2f} KB\n")
    
    # Final summary
    print("=" * 60)
    print("[+] TRAINING COMPLETE!")
    print("=" * 60)
    print("[*] Final Metrics:")
    print(f"   RMSE: {metrics['rmse']:.6f}")
    print(f"   MAE:  {metrics['mae']:.6f}")
    print(f"   R²:   {metrics['r2']:.6f}")
    print("\n[*] Model is ready for deployment!")
    print("   Next steps:")
    print("   1. Export to ONNX format (for ZKML)")
    print("   2. Deploy inference API")
    print("   3. Integrate with data pipeline")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()

