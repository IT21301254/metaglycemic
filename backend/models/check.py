import tensorflow as tf

# Specify the path to your model file
model_path = "glycemic_event_prediction_model.keras"

try:
    model = tf.keras.models.load_model(model_path)
    print("Model loaded successfully!")
    print(f"Model summary:")
    model.summary()
except Exception as e:
    print(f"Error loading model: {e}")