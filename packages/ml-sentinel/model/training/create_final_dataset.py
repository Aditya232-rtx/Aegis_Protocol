"""
Combine Real Kaggle Data + Simple Linear Crashes
Final training dataset generator
"""

import pandas as pd
import numpy as np

print("=" * 60)
print("CREATING FINAL TRAINING DATASET")
print("Real Kaggle Data + Simple Linear Crashes")
print("=" * 60 + "\n")

# 1. Load real Kaggle data (already processed with BLR)
print("[1] Loading real-world data...")
df_real = pd.read_csv('training_data_real.csv')
print(f"    Loaded {len(df_real)} real samples")

# 2. Load simple linear crashes
print("[2] Generating simple linear crashes...")
import subprocess
subprocess.run(['python', 'generate_linear_crashes.py'], check=True)

df_crashes = pd.read_csv('crashes_linear.csv')
print(f"    Generated {len(df_crashes)} crash samples")

# 3. Combine: 50/50 mix of real data and crashes
print("[3] Combining datasets...")

# Use all available real data (or sample 5000 if we have more)
num_real_samples = min(5000, len(df_real))
df_healthy = df_real.sample(n=num_real_samples, random_state=42)

# Use all crash samples  
df_risky = df_crashes

# Combine
df_final = pd.concat([df_healthy, df_risky], ignore_index=True)

# Shuffle
df_final = df_final.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"    Final dataset: {len(df_final)} samples")
print(f"    Real samples: {len(df_healthy)}")
print(f"    Crash samples: {len(df_risky)}")
print(f"    Risk distribution:")
print(f"      Low risk (<0.3): {(df_final['risk_score'] < 0.3).sum()}")
print(f"      Medium (0.3-0.7): {((df_final['risk_score'] >= 0.3) & (df_final['risk_score'] < 0.7)).sum()}")
print(f"      High (>0.7): {(df_final['risk_score'] >= 0.7).sum()}")

# 4. Save final dataset
output = 'training_data_final.csv'
df_final.to_csv(output, index=False)

print(f"\n[+] Final training data saved: {output}")
print(f"[*] Ready for GPU-accelerated training!")
print("=" * 60 + "\n")
