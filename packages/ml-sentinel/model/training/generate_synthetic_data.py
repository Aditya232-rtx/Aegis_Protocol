"""
Aegis Protocol - Sentinel Layer
Synthetic Data Generator for LSTM Training

This script generates synthetic market depth data simulating a crash scenario.
Used for training the LSTM model before sufficient real data is collected.

Output: training_data.csv with 10,000 time steps
"""

# -*- coding: utf-8 -*-
import sys
import os

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Configuration
NUM_TIMESTEPS = 10000
CRASH_START = 9500  # Last 500 steps simulate crash (was 100)
HEALTHY_BLR_MEAN = 1.2
HEALTHY_BLR_STD = 0.2  # Increased variance for more training diversity
CRASH_BLR_FINAL = 0.35
BASE_PRICE = 3000.0  # ETH/USDC base price
BASE_VOLUME = 5000.0  # Base trading volume

def generate_healthy_phase(num_steps):
    """Generate healthy market conditions (BLR ~ 1.0-1.5)"""
    print(f"[*] Generating {num_steps} healthy market steps...")
    
    # Healthy BLR with some noise
    blr = np.random.normal(HEALTHY_BLR_MEAN, HEALTHY_BLR_STD, num_steps)
    blr = np.clip(blr, 0.8, 1.8)  # Keep in reasonable range
    
    # Generate corresponding volumes
    sell_volume = np.random.uniform(BASE_VOLUME * 0.8, BASE_VOLUME * 1.2, num_steps)
    buy_volume = blr * sell_volume
    
    # Mid-price with random walk
    price_changes = np.random.normal(0, 10, num_steps)
    mid_price = BASE_PRICE + np.cumsum(price_changes)
    mid_price = np.clip(mid_price, BASE_PRICE * 0.9, BASE_PRICE * 1.1)
    
    # No alerts in healthy phase
    alert_triggered = np.zeros(num_steps, dtype=bool)
    
    return blr, buy_volume, sell_volume, mid_price, alert_triggered

def generate_crash_phase(num_steps):
    """Generate crash simulation (BLR decays from 1.2 to < 0.4)"""
    print(f"[!] Generating {num_steps} crash simulation steps...")
    
    # BLR decay from healthy to critical
    blr_start = HEALTHY_BLR_MEAN
    blr_end = CRASH_BLR_FINAL
    
    # Exponential decay for realistic crash pattern
    t = np.linspace(0, 1, num_steps)
    decay_rate = 3.0
    blr = blr_start + (blr_end - blr_start) * (1 - np.exp(-decay_rate * t))
    
    # Add some noise
    noise = np.random.normal(0, 0.02, num_steps)
    blr = blr + noise
    blr = np.clip(blr, 0.2, 1.5)
    
    # As BLR drops, sell pressure increases
    sell_volume = BASE_VOLUME * (1 + (1 - blr) * 2)  # More selling as BLR drops
    buy_volume = blr * sell_volume
    
    # Price drops during crash
    price_drop = np.linspace(0, -BASE_PRICE * 0.15, num_steps)  # 15% drop
    mid_price = BASE_PRICE + price_drop + np.random.normal(0, 5, num_steps)
    
    # Alerts triggered when BLR < 0.4
    alert_triggered = (blr < 0.4)
    
    return blr, buy_volume, sell_volume, mid_price, alert_triggered

def generate_timestamps(num_steps, start_date=None):
    """Generate sequential timestamps (1 minute intervals)"""
    if start_date is None:
        start_date = datetime.now() - timedelta(days=7)  # Start 7 days ago
    
    timestamps = [start_date + timedelta(minutes=i) for i in range(num_steps)]
    return timestamps

def calculate_risk_score(blr, buy_volume, sell_volume):
    """
    Calculate risk score (0.0 to 1.0) based on market conditions.
    
    STRONG, DETERMINISTIC FORMULA for better LSTM learning:
    - Risk is inversely correlated with BLR (primary signal)
    - Clear thresholds with smooth transitions
    
    Thresholds:
    - BLR >= 1.5: risk_score = 0.0 (SAFE)
    - BLR = 1.0: risk_score ~ 0.15 (LOW RISK)
    - BLR = 0.8: risk_score ~ 0.35 (MEDIUM RISK)
    - BLR = 0.6: risk_score ~ 0.60 (HIGH RISK)
    - BLR <= 0.4: risk_score >= 0.85 (CRITICAL)
    """
    # Primary signal: BLR-based risk (90% weight)
    # Use exponential curve for stronger signal
    blr_normalized = np.clip(blr / 1.5, 0, 1.0)  # Normalize to [0, 1.0] (strict bound)
    blr_risk = 1.0 - blr_normalized  # Inverse relationship
    blr_risk = np.clip(blr_risk, 0, 1)  # Ensure [0, 1] before power
    blr_risk = np.power(blr_risk * 1.2, 1.6)  # Exponential amplification (safer exponent)
    blr_risk = np.clip(blr_risk, 0, 1)  # Final clipping
    
    # Secondary signal: Volume imbalance (10% weight)
    volume_ratio = sell_volume / (buy_volume + 1e-6)
    volume_risk = np.clip((volume_ratio - 0.8) / 1.5, 0, 1)
    
    # Combined risk score (heavily weighted toward BLR)
    risk_score = 0.9 * blr_risk + 0.1 * volume_risk
    risk_score = np.clip(risk_score, 0, 1)
    risk_score = np.nan_to_num(risk_score, nan=0.0)  # Handle any remaining NaNs
    
    return risk_score

def generate_synthetic_data():
    """Main function to generate complete training dataset"""
    print("=" * 60)
    print("AEGIS PROTOCOL - SYNTHETIC DATA GENERATION")
    print("Training Data for LSTM Market Crash Predictor")
    print("=" * 60)
    print(f"Total Time Steps: {NUM_TIMESTEPS}")
    print(f"Healthy Phase: {CRASH_START} steps")
    print(f"Crash Phase: {NUM_TIMESTEPS - CRASH_START} steps")
    print("=" * 60 + "\n")
    
    # Generate timestamps
    timestamps = generate_timestamps(NUM_TIMESTEPS)
    
    # Generate healthy phase
    healthy_steps = CRASH_START
    blr_healthy, buy_healthy, sell_healthy, price_healthy, alert_healthy = \
        generate_healthy_phase(healthy_steps)
    
    # Generate crash phase
    crash_steps = NUM_TIMESTEPS - CRASH_START
    blr_crash, buy_crash, sell_crash, price_crash, alert_crash = \
        generate_crash_phase(crash_steps)
    
    # Combine both phases
    blr = np.concatenate([blr_healthy, blr_crash])
    buy_volume = np.concatenate([buy_healthy, buy_crash])
    sell_volume = np.concatenate([sell_healthy, sell_crash])
    mid_price = np.concatenate([price_healthy, price_crash])
    alert_triggered = np.concatenate([alert_healthy, alert_crash])
    
    # Calculate risk scores (LSTM target)
    risk_score = calculate_risk_score(blr, buy_volume, sell_volume)
    
    # Create DataFrame
    df = pd.DataFrame({
        'timestamp': timestamps,
        'blr': blr,
        'buy_volume': buy_volume,
        'sell_volume': sell_volume,
        'mid_price': mid_price,
        'alert_triggered': alert_triggered,
        'risk_score': risk_score  # Target for LSTM
    })
    
    # Round numerical values
    df['blr'] = df['blr'].round(4)
    df['buy_volume'] = df['buy_volume'].round(2)
    df['sell_volume'] = df['sell_volume'].round(2)
    df['mid_price'] = df['mid_price'].round(2)
    df['risk_score'] = df['risk_score'].round(4)
    
    # Save to CSV
    output_file = 'training_data_new.csv'
    df.to_csv(output_file, index=False)
    
    print(f"\n[+] Training data generated successfully!")
    print(f"[*] Saved to: {output_file}")
    print(f"\n[*] Dataset Statistics:")
    print(f"   Total samples: {len(df)}")
    print(f"   Alerts triggered: {alert_triggered.sum()} ({alert_triggered.sum()/len(df)*100:.1f}%)")
    print(f"   Average BLR: {blr.mean():.4f}")
    print(f"   Minimum BLR: {blr.min():.4f}")
    print(f"   Maximum BLR: {blr.max():.4f}")
    print(f"   Average Risk Score: {risk_score.mean():.4f}\n")
    
    # Display sample rows
    print("Sample rows (first 5):")
    print(df.head())
    print("\nSample rows (crash period - last 5):")
    print(df.tail())
    
    print("\n" + "=" * 60)
    print("[+] Ready for LSTM training!")
    print("=" * 60)
    
    return df

if __name__ == "__main__":
    df = generate_synthetic_data()
