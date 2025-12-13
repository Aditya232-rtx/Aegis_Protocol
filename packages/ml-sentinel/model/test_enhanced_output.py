"""
Test script to verify enhanced inference output format
"""
import json
import os
from datetime import datetime
from pathlib import Path

# Simulate the enhanced output
def test_enhanced_output():
    """Test the new JSON output format"""
    
    # Simulate metrics
    risk_score = 0.2648
    change_24h = -12.5
    blr = 1.15
    
    # Determine status
    CRASH_THRESHOLD = 0.7
    WARNING_THRESHOLD = 0.5
    
    if risk_score > CRASH_THRESHOLD:
        status = "critical"
    elif risk_score > WARNING_THRESHOLD:
        status = "warning"
    else:
        status = "normal"
    
    # Build metrics object (same as in inference.py)
    metrics = {
        "riskScore": round(risk_score, 4),
        "change24h": change_24h,
        "liquidityHealth": round(blr, 4),
        "timestamp": datetime.now().isoformat(),
        "status": status
    }
    
    # Test output path
    output_path = Path("../../../frontend-cockpit/public/live_feed_test.json")
    os.makedirs(output_path.parent, exist_ok=True)
    
    # Write JSON
    with open(output_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print("✓ Test output written successfully!")
    print(f"  Output path: {output_path.absolute()}")
    print(f"\nJSON Output:")
    print(json.dumps(metrics, indent=2))
    
    # Verify file exists and can be read
    with open(output_path, 'r') as f:
        loaded = json.load(f)
    
    print(f"\n✓ Verification: JSON file can be read back")
    print(f"  Fields present: {list(loaded.keys())}")
    print(f"  All 3 metrics present: {all(k in loaded for k in ['riskScore', 'change24h', 'liquidityHealth'])}")
    
    return True

if __name__ == "__main__":
    test_enhanced_output()
