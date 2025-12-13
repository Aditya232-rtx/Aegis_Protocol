"""
SIMPLE Linear Crash Data Generator
Creates easy-to-learn patterns for LSTM training

Strategy: Linear BLR decay over 100 steps
- Step 0: BLR = 1.2 (healthy)
- Step 100: BLR = 0.3 (crash)
- Risk score increases linearly with BLR drop
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_simple_crash_data(num_crashes=50, steps_per_crash=100):
    """
    Generate SIMPLE, LINEAR crash scenarios
    
    Each crash:
    - 100 steps total
    - BLR decays LINEARLY from 1.2 to 0.3
    - Risk score increases LINEARLY from 0.0 to 1.0
    - No noise, no randomness - pure linear relationships
    """
    print("=" * 60)
    print("[*] GENERATING SIMPLE LINEAR CRASH DATA")
    print("=" * 60)
    print(f"Crashes: {num_crashes}")
    print(f"Steps per crash: {steps_per_crash}")
    print(f"Total samples: {num_crashes * steps_per_crash}\n")
    
    all_data = []
    
    for crash_idx in range(num_crashes):
        for step in range(steps_per_crash):
            # Linear interpolation
            progress = step / steps_per_crash
            
            # BLR: 1.2 → 0.3 (linear)
            blr = 1.2 - (0.9 * progress)
            
            # Risk: 0.0 → 1.0 (linear)
            risk_score = progress
            
            # Volumes based on BLR
            sell_volume = 5000.0 * (1 + progress)  # Selling increases
            buy_volume = blr * sell_volume
            
            # Price drops slightly
            mid_price = 3000.0 - (300.0 * progress)
            
            # Alert when BLR < 0.4
            alert = (blr < 0.4)
            
            all_data.append({
                'blr': round(blr, 4),
                'buy_volume': round(buy_volume, 2),
                'sell_volume': round(sell_volume, 2),
                'mid_price': round(mid_price, 2),
                'alert_triggered': alert,
                'risk_score': round(risk_score, 4)
            })
    
    df = pd.DataFrame(all_data)
    
    # Add timestamps
    start_time = datetime.now() - timedelta(days=7)
    df['timestamp'] = [start_time + timedelta(minutes=i) for i in range(len(df))]
    
    # Reorder columns
    df = df[['timestamp', 'blr', 'buy_volume', 'sell_volume', 'mid_price', 'alert_triggered', 'risk_score']]
    
    print(f"[+] Generated {len(df)} crash samples")
    print(f"\nFirst 5 rows (crash start):")
    print(df.head())
    print(f"\nLast 5 rows (crash end):")
    print(df.tail())
    
    return df

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("SIMPLE LINEAR CRASH GENERATOR")
    print("=" * 60 + "\n")
    
    # Generate crashes
    df_crashes = generate_simple_crash_data(num_crashes=100, steps_per_crash=100)
    
    # Save
    output_file = "crashes_linear.csv"
    df_crashes.to_csv(output_file, index=False)
    
    print(f"\n[+] Saved to: {output_file}")
    print(f"[*] Total samples: {len(df_crashes)}")
    print(f"[*] Mean BLR: {df_crashes['blr'].mean():.4f}")
    print(f"[*] Mean Risk: {df_crashes['risk_score'].mean():.4f}")
    print("\n" + "=" * 60 + "\n")
