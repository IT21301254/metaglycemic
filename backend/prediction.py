# prediction.py
import numpy as np
import uuid
import pandas as pd
import joblib
import os
import sys
from preprocessing import prepare_input_data
from utils.recommendation import generate_recommendation

# Print Python path information to debug
print(f"Python path: {sys.path}")
print(f"Current working directory: {os.getcwd()}")

# Import TensorFlow and configure GPU
try:
    import tensorflow as tf
    print(f"Successfully imported TensorFlow")
    
    # Check for GPU availability
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f"GPU devices available: {len(gpus)}")
        for gpu in gpus:
            print(f"  {gpu}")
        # Set memory growth to avoid taking all GPU memory
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            # Make GPU visible to TensorFlow
            tf.config.set_visible_devices(gpus, 'GPU')
            print("GPU configuration successful!")
        except RuntimeError as e:
            print(f"Error configuring GPU: {e}")
    else:
        print("No GPU found. Using CPU for inference.")
    
    # Import Keras from tensorflow
    try:
        from tensorflow.keras.models import load_model
        print(f"Successfully imported Keras modules from TensorFlow")
        keras_available = True
    except ImportError as e:
        print(f"Could not import from tensorflow.keras: {e}")
        keras_available = False
except ImportError as e:
    print(f"Error importing tensorflow: {e}")
    keras_available = False

# Define model directory
model_dir = os.path.join(os.path.dirname(__file__), 'models')
print(f"Model directory: {model_dir}")

# Initialize global variables
model = None
feature_scaler = None
regression_scaler = None

# Try to load model
if keras_available:
    h5_model_path = os.path.join(model_dir, 'glycemic_event_prediction_model.h5')
    if os.path.exists(h5_model_path):
        print(f"Attempting to load H5 model from {h5_model_path}")
        try:
            # Load model with GPU support
            with tf.device('/GPU:0'):
                model = load_model(h5_model_path, compile=False)
                model.compile(optimizer='adam', loss='mse', metrics=['mae'])
            print("Model loaded successfully with TensorFlow Keras on GPU")
        except Exception as e:
            print(f"Error loading model with GPU: {e}")
            # Fallback to CPU
            try:
                print("Falling back to CPU")
                with tf.device('/CPU:0'):
                    model = load_model(h5_model_path, compile=False)
                    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
                print("Model loaded successfully with TensorFlow Keras on CPU")
            except Exception as e2:
                print(f"Error loading model on CPU: {e2}")
else:
    print("TensorFlow Keras not available, will use rule-based predictions")

# Load feature scaler
feature_scaler_path = os.path.join(model_dir, 'feature_scaler.pkl')
if os.path.exists(feature_scaler_path):
    try:
        feature_scaler = joblib.load(feature_scaler_path)
        print("Feature scaler loaded successfully")
    except Exception as e:
        print(f"Error loading feature scaler: {e}")

# Load regression scaler
regression_scaler_path = os.path.join(model_dir, 'regression_scaler.pkl')
if os.path.exists(regression_scaler_path):
    try:
        regression_scaler = joblib.load(regression_scaler_path)
        print("Regression scaler loaded successfully")
    except Exception as e:
        print(f"Error loading regression scaler: {e}")

# Load feature and target columns
try:
    feature_columns = np.load(os.path.join(model_dir, 'feature_columns.npy'), allow_pickle=True).tolist()
    target_columns = np.load(os.path.join(model_dir, 'target_columns.npy'), allow_pickle=True).tolist()
    print("Feature and target columns loaded successfully")
except Exception as e:
    print(f"Error loading columns: {e}")
    feature_columns = [
        'cbg', 'glucose_change', 'glucose_acceleration',
        'glucose_rolling_mean_1h', 'glucose_rolling_std_1h',
        'basal', 'bolus', 'carbInput', 'insulin_on_board', 'carbs_on_board',
        'hr', 'gsr'
    ]
    target_columns = ['hypo_next_30min', 'hyper_next_30min', 'time_to_hypo', 'time_to_hyper']

def predict_glucose_events(recent_glucose_data, recent_insulin_data, recent_meal_data,
                          recent_activity_data=None, recent_hr_data=None, recent_gsr_data=None):
    """
    Make predictions using the trained model with user input data
    """
    # Generate a unique prediction ID at the beginning
    prediction_id = str(uuid.uuid4())
    
    # Ensure we have enough data points
    if len(recent_glucose_data) < 12:
        return {"error": "Need at least 12 glucose readings (1 hour of data)"}
    
    # Extract current glucose for all return paths
    current_glucose = recent_glucose_data[-1]
    
    # If model is available, try to use it
    if model is not None and feature_scaler is not None and regression_scaler is not None:
        try:
            # Process the input data
            input_sequence = prepare_input_data(
                recent_glucose_data, 
                recent_insulin_data,
                recent_meal_data,
                recent_activity_data,
                recent_hr_data,
                recent_gsr_data,
                feature_columns,
                feature_scaler
            )
            
            # Make prediction with model
            prediction = model.predict(input_sequence)[0]
            
            # Extract predictions
            hypo_probability = max(0, min(1, prediction[0]))
            hyper_probability = max(0, min(1, prediction[1]))
            time_to_hypo_scaled = prediction[2]
            time_to_hyper_scaled = prediction[3]
            
            # Scale back regression values
            regression_predictions = regression_scaler.inverse_transform(
                np.array([[time_to_hypo_scaled, time_to_hyper_scaled]])
            )[0]
            
            time_to_hypo = max(0, regression_predictions[0])
            time_to_hyper = max(0, regression_predictions[1])
            
            # Get risk levels
            hypo_risk = "High" if hypo_probability > 0.7 else "Medium" if hypo_probability > 0.3 else "Low"
            hyper_risk = "High" if hyper_probability > 0.7 else "Medium" if hyper_probability > 0.3 else "Low"
            
            # Get recommendation - now passing the prediction_id
            recommendation = generate_recommendation(
                prediction_id,
                current_glucose, 
                float(hypo_probability), 
                float(hyper_probability),
                float(time_to_hypo), 
                float(time_to_hyper)
            )

            # Return model prediction results
            return {
                "prediction_id": prediction_id,
                "current_glucose": float(current_glucose),
                "hypo_probability": float(hypo_probability),
                "hyper_probability": float(hyper_probability),
                "hypo_risk": hypo_risk,
                "hyper_risk": hyper_risk,
                "time_to_hypo_minutes": float(time_to_hypo) if hypo_probability > 0.3 else None,
                "time_to_hyper_minutes": float(time_to_hyper) if hyper_probability > 0.3 else None,
                "recommendation": recommendation,
                "timestamp": pd.Timestamp.now().isoformat(),
                "model_prediction": True
            }
            
        except Exception as e:
            print(f"Error in model prediction: {e}")
            # Fall through to rule-based prediction
    
    # Rule-based prediction logic (fallback)
    print("Using rule-based prediction")
    trend = 0
    if len(recent_glucose_data) >= 3:
        trend = (recent_glucose_data[-1] - recent_glucose_data[-3]) / 2
    
    # Enhanced rule-based predictions
    # Calculate hypo probability based on current level and trend
    if current_glucose < 70:
        hypo_prob = 0.9  # Already hypoglycemic
    elif current_glucose < 80 and trend < -1:
        hypo_prob = 0.7  # Heading toward hypo rapidly
    elif current_glucose < 90 and trend < 0:
        hypo_prob = 0.5  # Moderately at risk
    elif current_glucose < 100 and trend < -2:
        hypo_prob = 0.4  # Some risk due to rapid drop
    else:
        hypo_prob = max(0.1, min(0.3, 1 - (current_glucose / 120)))  # Base risk
        
    # Calculate hyper probability based on current level and trend
    if current_glucose > 180:
        hyper_prob = 0.9  # Already hyperglycemic
    elif current_glucose > 160 and trend > 1:
        hyper_prob = 0.7  # Heading toward hyper rapidly
    elif current_glucose > 140 and trend > 0:
        hyper_prob = 0.5  # Moderately at risk
    elif current_glucose > 120 and trend > 2:
        hyper_prob = 0.4  # Some risk due to rapid rise
    else:
        hyper_prob = max(0.1, min(0.3, current_glucose / 200))  # Base risk
    
    # Calculate meal impact from carb data
    recent_carbs = sum(recent_meal_data[-3:] if recent_meal_data else [0])
    if recent_carbs > 30:
        # High recent carb intake raises hyper risk and reduces hypo risk
        hyper_prob = min(0.95, hyper_prob + 0.2)
        hypo_prob = max(0.05, hypo_prob - 0.1)
    
    # Calculate insulin impact
    recent_bolus = sum(recent_insulin_data.get('bolus', [0])[-3:])
    if recent_bolus > 2:
        # High recent insulin raises hypo risk and reduces hyper risk
        hypo_prob = min(0.95, hypo_prob + 0.2)
        hyper_prob = max(0.05, hyper_prob - 0.1)
    
    # Calculate time estimates based on current values and trends
    if current_glucose < 70:
        time_to_hypo = 0  # Already in hypoglycemia
    else:
        time_to_hypo = (current_glucose - 70) * (3 if trend < 0 else 5)
    
    if current_glucose > 180:
        time_to_hyper = 0  # Already in hyperglycemia
    else:
        time_to_hyper = (180 - current_glucose) * (3 if trend > 0 else 5)
    
    # Make sure probabilities are within [0, 1]
    hypo_prob = max(0, min(1, hypo_prob))
    hyper_prob = max(0, min(1, hyper_prob))
    
    # Risk levels based on probabilities
    hypo_risk = "High" if hypo_prob > 0.7 else "Medium" if hypo_prob > 0.3 else "Low"
    hyper_risk = "High" if hyper_prob > 0.7 else "Medium" if hyper_prob > 0.3 else "Low"
    
    # Generate recommendation - pass the prediction_id
    recommendation = generate_recommendation(
        prediction_id,
        current_glucose, 
        float(hypo_prob), 
        float(hyper_prob),
        float(time_to_hypo), 
        float(time_to_hyper)
    )

    return {
        "prediction_id": prediction_id,
        "current_glucose": float(current_glucose),
        "hypo_probability": float(hypo_prob),
        "hyper_probability": float(hyper_prob),
        "hypo_risk": hypo_risk,
        "hyper_risk": hyper_risk,
        "time_to_hypo_minutes": float(time_to_hypo) if hypo_prob > 0.3 else None,
        "time_to_hyper_minutes": float(time_to_hyper) if hyper_prob > 0.3 else None,
        "recommendation": recommendation,
        "timestamp": pd.Timestamp.now().isoformat(),
        "rule_based_prediction": True,
        "note": "Using enhanced rule-based prediction"
    }