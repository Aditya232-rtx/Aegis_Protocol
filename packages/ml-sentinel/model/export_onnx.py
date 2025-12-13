"""
ONNX Model Export Utility
Converts trained Keras (.h5) model to ONNX format for ZK circuit integration
"""

import tensorflow as tf
import onnx
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.constants import MODEL_PATH, ONNX_MODEL_PATH

def export_to_onnx():
    """Export Keras model to ONNX format"""
    
    print("=" * 60)
    print("ONNX MODEL EXPORT")
    print("=" * 60)
    
    # Load Keras model
    print(f"\n[1/3] Loading Keras model from: {MODEL_PATH}")
    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print(f"      Model loaded successfully")
        print(f"      Input shape: {model.input_shape}")
        print(f"      Output shape: {model.output_shape}")
    except Exception as e:
        print(f"      Error loading model: {e}")
        return False
    
    # Convert to ONNX using tf2onnx
    print(f"\n[2/3] Converting to ONNX format...")
    try:
        import tf2onnx
        import onnx
        
        # Create spec for conversion
        spec = (tf.TensorSpec(model.input_shape, tf.float32, name="input"),)
        
        # Convert
        model_proto, _ = tf2onnx.convert.from_keras(
            model,
            input_signature=spec,
            opset=13
        )
        
        print(f"      Conversion successful")
        
    except Exception as e:
        print(f"      Conversion error: {e}")
        return False
    
    # Save ONNX model  
    print(f"\n[3/3] Saving ONNX model...")
    try:
        os.makedirs(os.path.dirname(ONNX_MODEL_PATH), exist_ok=True)
        onnx.save(model_proto, ONNX_MODEL_PATH)
        file_size = os.path.getsize(ONNX_MODEL_PATH) / 1024
        print(f"      Saved to: {ONNX_MODEL_PATH}")
        print(f"      Size: {file_size:.2f} KB")
        
        # Validate
        onnx_model = onnx.load(ONNX_MODEL_PATH)
        onnx.checker.check_model(onnx_model)
        print(f"      Validation: PASSED")
        
    except Exception as e:
        print(f"      Save/validation error: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ ONNX EXPORT COMPLETE!")
    print("=" * 60)
    print(f"\nONNX Model: {ONNX_MODEL_PATH}")
    print(f"\nNext: Run ZK circuit setup")
    print(f"  python zk-circuit/scripts/zk_setup.py")
    print("=" * 60 + "\n")
    
    return True

if __name__ == "__main__":
    success = export_to_onnx()
    sys.exit(0 if success else 1)
