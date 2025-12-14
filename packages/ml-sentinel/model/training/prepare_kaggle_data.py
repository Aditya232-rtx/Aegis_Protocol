"""
Aegis Protocol - Real-World Data Preparation
Download and process Kaggle ETH/USDT OHLCV data for LSTM training

Source: https://www.kaggle.com/datasets/srisahithis/multi-timeframe-ethusdt-ohlcv-data-20192024
"""

import numpy as np
import pandas as pd
from datetime import datetime
import os

# Configuration
KAGGLE_DATASET = "srisahithis/multi-timeframe-ethusdt-ohlcv-data-20192024"
OUTPUT_FILE = "training_data_real.csv"
TIMEFRAME = "5m"  # Use 5-minute data for training (good balance)
NUM_SAMPLES = 10000  # Take last 10k samples
CRASH_INJECTION_RATE = 0.05  # 5% of data will be crash scenarios

def download_kaggle_dataset():
    """Download dataset from Kaggle using kagglehub (no auth needed!)"""
    print("=" * 60)
    print("[*] DOWNLOADING KAGGLE DATASET")
    print("=" * 60)
    
    try:
        import kagglehub
        print("[+] KaggleHub detected")
        
        # Download dataset
        print(f"[*] Downloading: {KAGGLE_DATASET}")
        print("[*] This may take a few minutes on first download...")
        
        path = kagglehub.dataset_download(KAGGLE_DATASET)
        
        print(f"[+] Dataset downloaded to: {path}")
        print(f"[*] Moving files to ./kaggle_data/")
        
        # Copy files to our working directory
        import shutil
        os.makedirs('./kaggle_data', exist_ok=True)
        
        # Recursively find and copy all CSV files
        csv_count = 0
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.endswith('.csv'):
                    src = os.path.join(root, file)
                    dst = os.path.join('./kaggle_data', file)
                    shutil.copy2(src, dst)
                    print(f"[+] Copied: {file}")
                    csv_count += 1
        
        if csv_count == 0:
            print("[!] No CSV files found in downloaded dataset")
            return False
        
        print(f"[+] Dataset ready! ({csv_count} files)\n")
        return True
        
    except ImportError:
        print("[!] kagglehub not installed")
        print("[*] Install with: pip install kagglehub")
        return False
    except Exception as e:
        print(f"[!] Error downloading dataset: {e}")
        return False

def load_ohlcv_data():
    """Load OHLCV data from downloaded files"""
    print("=" * 60)
    print("[*] LOADING OHLCV DATA")
    print("=" * 60)
    
    # Find the target timeframe file
    data_dir = './kaggle_data'
    files = os.listdir(data_dir) if os.path.exists(data_dir) else []
    
    # Look for timeframe file (e.g., ETHUSDT_5m.csv)
    target_file = None
    for f in files:
        if f'_{TIMEFRAME}.' in f and f.endswith('.csv'):
            target_file = os.path.join(data_dir, f)
            break
    
    if not target_file:
        print(f"[!] Could not find {TIMEFRAME} data file")
        print(f"[*] Available files: {files}")
        return None
    
    print(f"[+] Loading: {os.path.basename(target_file)}")
    df = pd.read_csv(target_file)
    
    print(f"[+] Loaded {len(df)} candles")
    print(f"[*] Columns: {df.columns.tolist()}")
    print(f"\n[*] Sample data:")
    print(df.head())
    
    return df

def calculate_blr_from_ohlcv(df):
    """
    Estimate Buy-side Liquidity Ratio (BLR) from OHLCV data
    
    Since we don't have actual order book data, we use:
    - Price action (close vs open) to estimate buy/sell pressure
    - Volume distribution to estimate liquidity
    """
    print("\n" + "=" * 60)
    print("[*] CALCULATING BLR FROM OHLCV")
    print("=" * 60)
    
    # Calculate price change and direction
    df['price_change'] = df['close'] - df['open']
    df['is_bullish'] = (df['price_change'] > 0).astype(int)
    
    # Estimate buy/sell volume based on price action
    # Bullish candles: more buy pressure
    # Bearish candles: more sell pressure
    df['buy_volume_est'] = df['volume'] * (0.5 + 0.3 * df['is_bullish'])
    df['sell_volume_est'] = df['volume'] * (0.5 + 0.3 * (1 - df['is_bullish']))
    
    # Add volatility factor (higher volatility = more uncertainty)
    df['volatility'] = (df['high'] - df['low']) / df['close']
    df['buy_volume_est'] *= (1 + 0.2 * df['volatility'])
    
    # Calculate BLR
    df['blr'] = df['buy_volume_est'] / (df['sell_volume_est'] + 1e-6)
    df['blr'] = df['blr'].clip(0.3, 2.0)  # Reasonable range
    
    # Use close price as mid_price
    df['mid_price'] = df['close']
    
    print(f"[+] BLR calculated")
    print(f"    Mean BLR: {df['blr'].mean():.4f}")
    print(f"    Min BLR: {df['blr'].min():.4f}")
    print(f"    Max BLR: {df['blr'].max():.4f}")
    
    return df

def inject_crash_scenarios(df, rate=0.05):
    """
    Inject synthetic crash scenarios into real data
    
    Find volatile periods and simulate what a crash would look like:
    - Drop BLR dramatically
    - Increase sell pressure
    - Calculate high risk scores
    """
    print("\n" + "=" * 60)
    print("[*] INJECTING CRASH SCENARIOS")
    print("=" * 60)
    
    num_crashes = int(len(df) * rate)
    print(f"[*] Creating {num_crashes} crash scenarios ({rate*100:.1f}% of data)")
    
    # Find high-volatility periods (good candidates for crash injection)
    df['volatility_rank'] = df['volatility'].rank(pct=True)
    crash_indices = df.nlargest(num_crashes, 'volatility_rank').index
    
    # Mark crash periods
    df['is_crash_scenario'] = False
    df.loc[crash_indices, 'is_crash_scenario'] = True
    
    # For crash scenarios, simulate extreme conditions
    for idx in crash_indices:
        # Decay BLR over next few candles
        window = min(20, len(df) - idx)  # 20-candle crash window
        for i in range(window):
            if idx + i < len(df):
                # Exponential decay of BLR
                decay_factor = np.exp(-i / 10)
                df.loc[idx + i, 'blr'] = max(0.3, df.loc[idx, 'blr'] * (0.4 + 0.6 * decay_factor))
                df.loc[idx + i, 'sell_volume_est'] *= (1.5 + 0.5 * (1 - decay_factor))
                df.loc[idx + i, 'is_crash_scenario'] = True
    
    print(f"[+] Crash scenarios injected")
    print(f"    Total crash samples: {df['is_crash_scenario'].sum()}")
    
    return df

def calculate_risk_scores(df):
    """Calculate risk scores based on market conditions"""
    print("\n" + "=" * 60)
    print("[*] CALCULATING RISK SCORES")
    print("=" * 60)
    
    # Use same formula as synthetic data for consistency
    blr_normalized = np.clip(df['blr'].values / 1.5, 0, 1.0)
    blr_risk = 1.0 - blr_normalized
    blr_risk = np.clip(blr_risk, 0, 1)
    blr_risk = np.power(blr_risk * 1.2, 1.6)
    blr_risk = np.clip(blr_risk, 0, 1)
    
    volume_ratio = df['sell_volume_est'] / (df['buy_volume_est'] + 1e-6)
    volume_risk = np.clip((volume_ratio - 0.8) / 1.5, 0, 1)
    
    risk_score = 0.9 * blr_risk + 0.1 * volume_risk
    risk_score = np.clip(risk_score, 0, 1)
    
    df['risk_score'] = risk_score
    df['alert_triggered'] = (df['blr'] < 0.4) | df['is_crash_scenario']
    
    print(f"[+] Risk scores calculated")
    print(f"    Mean risk: {df['risk_score'].mean():.4f}")
    print(f"    Alerts triggered: {df['alert_triggered'].sum()} ({df['alert_triggered'].sum()/len(df)*100:.1f}%)")
    
    return df

def prepare_training_data(df, num_samples=10000):
    """Prepare final training dataset"""
    print("\n" + "=" * 60)
    print("[*] PREPARING TRAINING DATA")
    print("=" * 60)
    
    # Take last N samples for training
    df_train = df.tail(num_samples).copy()
    
    # Select and rename columns to match training format
    df_final = pd.DataFrame({
        'timestamp': pd.to_datetime(df_train['open_time'], unit='ms') if 'open_time' in df_train.columns else range(len(df_train)),
        'blr': df_train['blr'].round(4),
        'buy_volume': df_train['buy_volume_est'].round(2),
        'sell_volume': df_train['sell_volume_est'].round(2),
        'mid_price': df_train['mid_price'].round(2),
        'alert_triggered': df_train['alert_triggered'],
        'risk_score': df_train['risk_score'].round(4)
    })
    
    print(f"[+] Training dataset prepared")
    print(f"    Total samples: {len(df_final)}")
    print(f"\n[*] Sample data:")
    print(df_final.head())
    print("\n[*] Crash period samples:")
    print(df_final[df_final['alert_triggered']].head())
    
    return df_final

def main():
    """Main pipeline"""
    print("\n" + "=" * 60)
    print("AEGIS PROTOCOL - REAL-WORLD DATA PREPARATION")
    print("Hybrid Training Data: Real OHLCV + Synthetic Crashes")
    print("=" * 60 + "\n")
    
    # Step 1: Check if data already exists
    if os.path.exists('./kaggle_data') and len(os.listdir('./kaggle_data')) > 0:
        print("[*] Data files already exist in ./kaggle_data/, skipping download\n")
    else:
        # Download dataset
        if not download_kaggle_dataset():
            print("\n[!] Please manually download the dataset and place in ./kaggle_data/")
            print(f"[*] Dataset URL: https://www.kaggle.com/datasets/{KAGGLE_DATASET}")
            return
    
    # Step 2: Load OHLCV data
    df = load_ohlcv_data()
    if df is None:
        return
    
    # Step 3: Calculate BLR and features
    df = calculate_blr_from_ohlcv(df)
    
    # Step 4: Inject crash scenarios
    df = inject_crash_scenarios(df, rate=CRASH_INJECTION_RATE)
    
    # Step 5: Calculate risk scores
    df = calculate_risk_scores(df)
    
    # Step 6: Prepare final training data
    df_final = prepare_training_data(df, num_samples=NUM_SAMPLES)
    
    # Step 7: Save to CSV
    df_final.to_csv(OUTPUT_FILE, index=False)
    print(f"\n[+] Training data saved to: {OUTPUT_FILE}")
    
    print("\n" + "=" * 60)
    print("[+] READY FOR TRAINING!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Update train_lstm.py to use 'training_data_real.csv'")
    print("2. Run: python train_lstm.py")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
