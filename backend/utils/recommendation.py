# utils/recommendation.py
import requests
import logging
import json
import threading
from datetime import datetime, timedelta
from pymongo import MongoClient, DESCENDING, IndexModel, ASCENDING
from bson import ObjectId
import uuid
import time

# Configure logging with file output
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("recommendation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration for recommendation service
RECOMMENDATION_SERVICE_URL = "http://localhost:5080/recommend"
TIMEOUT = 10  # seconds

# MongoDB connection (reuse the same connection as your main app)
mongodb_uri = "mongodb://localhost:27017/"
db_name = "glycemic_data"
client = MongoClient(mongodb_uri)
db = client[db_name]

# Collections
glucose_readings = db.glucose_readings
insulin_doses = db.insulin_doses
meal_entries = db.meal_entries
activity_entries = db.activity_entries
recommendations = db.recommendations  # New collection for recommendations

# Create indexes for recommendations collection
def ensure_recommendation_indexes():
    """Ensure proper indexes exist on recommendations collection"""
    try:
        # Index for finding recommendations by ID
        recommendations.create_index([("prediction_id", ASCENDING)], unique=True)
        
        # Index for cleaning up old recommendations
        recommendations.create_index([("initiated_at", ASCENDING)])
        
        # Expire recommendations after 1 day (TTL index)
        recommendations.create_index(
            [("initiated_at", ASCENDING)],
            expireAfterSeconds=86400  # 24 hours in seconds
        )
        
        logger.info("Recommendation indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating recommendation indexes: {str(e)}")

# Ensure indexes exist
ensure_recommendation_indexes()

def generate_recommendation(prediction_id, current_glucose, hypo_prob, hyper_prob, time_to_hypo, time_to_hyper):
    """
    Generate a recommendation based on the prediction results - synchronous version
    
    Args:
        prediction_id: The prediction ID from the prediction function
        current_glucose: Current glucose level in mg/dL
        hypo_prob: Probability of hypoglycemia (0-1)
        hyper_prob: Probability of hyperglycemia (0-1)
        time_to_hypo: Estimated time to hypoglycemia in minutes
        time_to_hyper: Estimated time to hyperglycemia in minutes
        
    Returns:
        A simple text recommendation based on the input parameters
    """
    # Use the provided prediction_id instead of generating a new one
    logger.info(f"Using prediction ID: {prediction_id}")
    
    # Create initial document in MongoDB immediately
    try:
        # Create the document synchronously
        initial_doc = {
            "prediction_id": prediction_id,
            "status": "pending", 
            "initiated_at": datetime.utcnow(),
            "prediction_data": {
                "current_glucose": float(current_glucose),
                "hypo_probability": float(hypo_prob),
                "hyper_probability": float(hyper_prob),
                "time_to_hypo": float(time_to_hypo) if hypo_prob > 0.3 else None,
                "time_to_hyper": float(time_to_hyper) if hyper_prob > 0.3 else None
            }
        }
        
        # Use update_one with upsert to create or update the document
        result = recommendations.update_one(
            {"prediction_id": prediction_id},
            {"$set": initial_doc},
            upsert=True
        )
        if result.upserted_id:
            logger.info(f"Created initial recommendation document with ID: {result.upserted_id}")
        else:
            logger.info(f"Updated existing recommendation document for prediction: {prediction_id}")
    except Exception as e:
        logger.error(f"Failed to create initial recommendation document: {str(e)}")
    
    # Start a thread to fetch the detailed recommendation
    thread = threading.Thread(
        target=fetch_recommendation_async,
        args=(prediction_id, current_glucose, hypo_prob, hyper_prob, time_to_hypo, time_to_hyper)
    )
    thread.daemon = True
    thread.start()
    logger.info(f"Started async thread for prediction {prediction_id}")
    
    # Return a simple recommendation immediately based on the parameters
    if current_glucose < 70:
        return "URGENT: Current glucose level is low. Consume 15-20g of fast-acting carbohydrates immediately."

    if current_glucose > 180:
        return "Your glucose is currently high. Check ketones if over 240 mg/dL. Consider taking correction insulin as advised by your healthcare provider."

    if hypo_prob > 0.7 and time_to_hypo < 30:
        return f"WARNING: High risk of hypoglycemia in approximately {int(time_to_hypo)} minutes. Consider consuming 15g of carbohydrates to prevent low blood sugar."

    if hyper_prob > 0.7 and time_to_hyper < 30:
        return f"ALERT: High risk of hyperglycemia in approximately {int(time_to_hyper)} minutes. Check for missed insulin doses or recent high-carb meals."

    if hypo_prob > 0.3:
        return f"Moderate risk of low blood sugar. Monitor closely over the next {int(time_to_hypo)} minutes."

    if hyper_prob > 0.3:
        return f"Moderate risk of high blood sugar. Be mindful of carb intake and insulin timing."

    return "Your glucose levels appear stable. Continue with regular monitoring."

def get_recent_user_data(user_id=None, hours=12):
    """Fetch recent user data from MongoDB"""
    try:
        # Set time range for query
        since_date = datetime.utcnow() - timedelta(hours=hours)
        
        # Define query filter
        query = {'timestamp': {'$gte': since_date}}
        if user_id:
            query['user_id'] = user_id
            
        # Get latest glucose readings
        recent_glucose = list(glucose_readings.find(query).sort('timestamp', DESCENDING).limit(5))
        
        # Calculate trend if we have enough readings
        trend = "stable"
        if len(recent_glucose) >= 3:
            # Simple trend calculation based on last 3 readings
            values = [reading['value'] for reading in recent_glucose[:3]]
            if values[0] > values[1] > values[2]:
                trend = "rising"
            elif values[0] < values[1] < values[2]:
                trend = "falling"
        
        # Get recent insulin doses
        recent_insulin = list(insulin_doses.find(query).sort('timestamp', DESCENDING).limit(3))
        insulin_info = {
            "basal": sum(dose['dose'] for dose in recent_insulin if dose['insulin_type'] == 'basal'),
            "bolus": sum(dose['dose'] for dose in recent_insulin if dose['insulin_type'] == 'bolus'),
            "time_since_last_bolus": 0  # Default value
        }
        
        # Calculate time since last bolus if we have any
        bolus_doses = [dose for dose in recent_insulin if dose['insulin_type'] == 'bolus']
        if bolus_doses:
            last_bolus_time = bolus_doses[0]['timestamp']
            insulin_info["time_since_last_bolus"] = int((datetime.utcnow() - last_bolus_time).total_seconds() / 60)
        
        # Get recent meals
        recent_meals = list(meal_entries.find(query).sort('timestamp', DESCENDING).limit(3))
        recent_carbs = sum(meal['carbs'] for meal in recent_meals)
        
        # Get recent activity
        recent_activities = list(activity_entries.find(query).sort('timestamp', DESCENDING).limit(3))
        recent_activity = sum(activity['duration'] for activity in recent_activities)
        
        # Get current glucose if we have readings
        current_glucose = recent_glucose[0]['value'] if recent_glucose else None
        
        return {
            "current_glucose": current_glucose,
            "trend": trend,
            "recent_insulin": insulin_info,
            "recent_carbs": recent_carbs,
            "recent_activity": recent_activity,
            "latest_reading_time": recent_glucose[0]['timestamp'].isoformat() if recent_glucose else None
        }
        
    except Exception as e:
        logger.error(f"Error fetching user data from MongoDB: {str(e)}")
        return None

def fetch_recommendation_async(prediction_id, current_glucose, hypo_prob, hyper_prob, time_to_hypo, time_to_hyper):
    """Fetch recommendation from LLM service asynchronously"""
    logger.info(f"Starting fetch_recommendation_async for prediction {prediction_id}")
    
    try:
        # Check if the document exists in MongoDB already
        existing_doc = recommendations.find_one({"prediction_id": prediction_id})
        if not existing_doc:
            logger.error(f"Document with prediction_id {prediction_id} not found in MongoDB")
            # Try to create it again
            recommendations.insert_one({
                "prediction_id": prediction_id,
                "status": "pending",
                "initiated_at": datetime.utcnow(),
                "error": "Document had to be recreated in async thread"
            })
        else:
            logger.info(f"Found existing document for prediction_id {prediction_id}")
        
        # Determine trend based on probabilities
        if hypo_prob > 0.6:
            trend = "falling"
        elif hyper_prob > 0.6:
            trend = "rising"
        else:
            trend = "stable"
        
        # Get recent data from MongoDB
        user_data = get_recent_user_data()
        
        if not user_data:
            # If MongoDB data fetch fails, use the prediction data we already have
            user_data = {
                "current_glucose": float(current_glucose),
                "trend": trend,
                "recent_insulin": {
                    "bolus": 0,
                    "basal": 0,
                    "time_since_last_bolus": 0
                },
                "recent_carbs": 0,
                "recent_activity": 0
            }
        else:
            # Use the MongoDB data but ensure we have the current glucose value
            # (the one from prediction might be more current than what's in MongoDB)
            user_data["current_glucose"] = float(current_glucose)
            # Override trend with prediction-based trend if available
            user_data["trend"] = trend
        
        # Update the document with user data
        logger.info(f"Updating document with user data for prediction {prediction_id}")
        
        # Insert or update in MongoDB
        update_result = recommendations.update_one(
            {"prediction_id": prediction_id},
            {"$set": {
                "status": "processing",
                "updated_at": datetime.utcnow(),
                "request_data": user_data,
            }}
        )
        
        if update_result.matched_count == 0:
            logger.error(f"Could not update document for prediction {prediction_id} - document not found")
        else:
            logger.info(f"Document updated successfully for prediction {prediction_id}")
        
        # Make the request to the recommendation service
        logger.info(f"Requesting recommendation for prediction {prediction_id}")
        
        # Short delay to ensure document is created before proceeding
        time.sleep(0.5)
        
        response = requests.post(
            RECOMMENDATION_SERVICE_URL,
            json=user_data,
            timeout=TIMEOUT
        )
        
        logger.info(f"Received response from recommendation service: {response.status_code}")
        
        if response.status_code == 200:
            recommendation_data = response.json()
            recommendation_text = recommendation_data.get("recommendation", "No recommendation available.")
            
            # Update the recommendation in MongoDB
            update_result = recommendations.update_one(
                {"prediction_id": prediction_id},
                {"$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "recommendation": recommendation_text,
                    "data": recommendation_data
                }}
            )
            
            if update_result.matched_count == 0:
                logger.error(f"Could not update document with recommendation - document not found")
            else:
                logger.info(f"Successfully updated document with recommendation for prediction {prediction_id}")
            
            return recommendation_text
        else:
            logger.error(f"Error from recommendation service: {response.status_code}")
            
            # Update the recommendation in MongoDB
            recommendations.update_one(
                {"prediction_id": prediction_id},
                {"$set": {
                    "status": "error",
                    "error": f"Service error: {response.status_code}"
                }}
            )
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        
        # Update the recommendation in MongoDB
        recommendations.update_one(
            {"prediction_id": prediction_id},
            {"$set": {
                "status": "error",
                "error": f"Request error: {str(e)}"
            }}
        )
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        
        # Update the recommendation in MongoDB
        recommendations.update_one(
            {"prediction_id": prediction_id},
            {"$set": {
                "status": "error",
                "error": f"Unexpected error: {str(e)}"
            }}
        )
        return None

def get_recommendation_status(prediction_id):
    """Get the status of a recommendation by prediction ID"""
    logger.info(f"Getting recommendation status for prediction {prediction_id}")
    recommendation = recommendations.find_one({"prediction_id": prediction_id})
    
    if recommendation:
        logger.info(f"Found recommendation with status: {recommendation.get('status')}")
        # Convert ObjectId to string for JSON serialization
        if '_id' in recommendation:
            recommendation['_id'] = str(recommendation['_id'])
            
        # Convert datetime objects to ISO strings
        if 'initiated_at' in recommendation and isinstance(recommendation['initiated_at'], datetime):
            recommendation['initiated_at'] = recommendation['initiated_at'].isoformat()
            
        if 'completed_at' in recommendation and isinstance(recommendation['completed_at'], datetime):
            recommendation['completed_at'] = recommendation['completed_at'].isoformat()
        
        if 'updated_at' in recommendation and isinstance(recommendation['updated_at'], datetime):
            recommendation['updated_at'] = recommendation['updated_at'].isoformat()
            
        return recommendation
    else:
        logger.error(f"Recommendation with ID {prediction_id} not found")
        return {"status": "not_found"}

def clean_old_recommendations(days=7):
    """Clean up old recommendations from the database"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        result = recommendations.delete_many({"initiated_at": {"$lt": cutoff_date}})
        logger.info(f"Deleted {result.deleted_count} old recommendations")
    except Exception as e:
        logger.error(f"Error cleaning old recommendations: {str(e)}")