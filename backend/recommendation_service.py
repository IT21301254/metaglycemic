# recommendation_service.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging
from datetime import datetime
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("recommendation_service.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Ollama API configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "medllama2"  # Change to your preferred model for diabetes recommendations

@app.route('/health', methods=['GET'])
def health_check():
    """Simple endpoint to check if service is running"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recommend', methods=['POST'])
def generate_recommendation():
    """Generate a recommendation based on user data using Ollama LLM"""
    try:
        data = request.get_json()
        
        # Extract relevant data for the recommendation
        current_glucose = data.get('current_glucose', 0)
        glucose_trend = data.get('trend', 'stable')
        recent_insulin = data.get('recent_insulin', {})
        recent_carbs = data.get('recent_carbs', 0)
        recent_activity = data.get('recent_activity', 0)
        
        # Log the request data
        logger.info(f"Generating recommendation for glucose: {current_glucose}, trend: {glucose_trend}")
        
        # Construct a prompt for Ollama
        prompt = f"""
        As a diabetes management assistant, provide personalized recommendations based on this data:
        
        Current glucose: {current_glucose} mg/dL
        Recent trend: {glucose_trend}
        Recent insulin: {recent_insulin}
        Recent carbs: {recent_carbs}g
        Recent activity: {recent_activity} minutes
        
        Provide a concise, actionable recommendation focusing on immediate steps to maintain healthy glucose levels.
        Keep your response under 3 sentences and very practical.
        """
        
        # Generate fallback recommendation in case Ollama fails
        fallback_recommendation = ""
        if current_glucose < 70:
            fallback_recommendation = "URGENT: Your glucose is low. Consume 15-20g of fast-acting carbs immediately and recheck in 15 minutes."
        elif current_glucose > 180:
            fallback_recommendation = "Your glucose is high. Check ketones if over 240 mg/dL. Consider correction insulin after confirming with your healthcare provider."
        elif glucose_trend == "rising" and current_glucose > 140:
            fallback_recommendation = "Your glucose is rising. Consider light activity for 10-15 minutes to help stabilize levels."
        elif glucose_trend == "falling" and current_glucose < 100:
            fallback_recommendation = "Your glucose is falling. Consider a small 15g carb snack if you plan to be active or it's been >4 hours since your last meal."
        else:
            fallback_recommendation = "Your glucose levels appear to be in an acceptable range. Continue regular monitoring and stay hydrated."
        
        # Call Ollama API
        try:
            logger.info(f"Calling Ollama API with model: {MODEL_NAME}")
            ollama_response = requests.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=15  # Increased timeout for LLM processing
            )
            
            # Check if Ollama request was successful
            if ollama_response.status_code == 200:
                response_data = ollama_response.json()
                recommendation = response_data.get('response', '')
                
                if not recommendation or len(recommendation.strip()) < 10:
                    logger.warning("Ollama returned empty/short recommendation, using fallback")
                    recommendation = fallback_recommendation
                
                logger.info(f"Recommendation generated successfully: {recommendation[:50]}...")
            else:
                error_msg = f"Ollama API error: {ollama_response.status_code} - {ollama_response.text}"
                logger.error(error_msg)
                recommendation = fallback_recommendation
                logger.info("Using fallback recommendation")
            
            return jsonify({
                "recommendation": recommendation,
                "timestamp": datetime.now().isoformat(),
                "source": "ollama" if recommendation != fallback_recommendation else "fallback"
            })
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Error calling Ollama API: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            
            return jsonify({
                "recommendation": fallback_recommendation,
                "timestamp": datetime.now().isoformat(),
                "source": "fallback"
            })
            
    except Exception as e:
        error_msg = f"Unexpected error in recommendation service: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({'error': error_msg}), 500

if __name__ == '__main__':
    logger.info("Starting recommendation service on port 5080...")
    app.run(debug=True, host='0.0.0.0', port=5080)