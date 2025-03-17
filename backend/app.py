# app.py
from flask import Flask, request, jsonify
from utils.recommendation import get_recommendation_status
from flask_cors import CORS
from prediction import predict_glucose_events
from database.db import (
    glucose_readings, insulin_doses, meal_entries, 
    activity_entries, vitals_entries, users, init_db
)
from datetime import datetime, timedelta
from bson import ObjectId
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize database
init_db()

# Helper function to convert ObjectId to string
def json_serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple endpoint to check if API is running"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0'
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Helper function to pad and interpolate data
            def interpolate_data(input_data, target_length=12):
                if len(input_data) >= target_length:
                    return input_data[-target_length:]
                
                # If no data, return default
                if len(input_data) == 0:
                    return [statistics.mean(input_data) if input_data else 120] * target_length
                
                # Linear interpolation to fill missing points
                interpolated = []
                for i in range(target_length):
                    # Calculate the index in the original data
                    orig_index = (i * len(input_data)) / target_length
                    
                    # Get surrounding indices
                    lower_index = int(orig_index)
                    upper_index = min(lower_index + 1, len(input_data) - 1)
                    
                    # Linear interpolation
                    if lower_index == upper_index:
                        interpolated.append(input_data[lower_index])
                    else:
                        lower_value = input_data[lower_index]
                        upper_value = input_data[upper_index]
                        fraction = orig_index - lower_index
                        interpolated_value = lower_value + fraction * (upper_value - lower_value)
                        interpolated.append(interpolated_value)
                
                return interpolated
            
            # Extract and interpolate data
            glucose_readings = interpolate_data(
                data.get('glucose_readings', []), 
                target_length=12
            )
            
            insulin_data = {
                'basal': interpolate_data(
                    data.get('insulin', {}).get('basal', []), 
                    target_length=12
                ),
                'bolus': interpolate_data(
                    data.get('insulin', {}).get('bolus', []), 
                    target_length=12
                )
            }
            
            carb_data = interpolate_data(
                data.get('carbs', []), 
                target_length=12
            )
            
            activity_data = interpolate_data(
                data.get('activity', []), 
                target_length=12
            )
            
            # Use default values if no data
            heart_rate_data = interpolate_data(
                data.get('heart_rate', []), 
                target_length=12
            ) or [70] * 12
            
            gsr_data = interpolate_data(
                data.get('gsr', []), 
                target_length=12
            ) or [1] * 12
            
            # Prepare data for model
            prediction_data = {
                'glucose_readings': glucose_readings,
                'insulin': insulin_data,
                'carbs': carb_data,
                'activity': activity_data,
                'heart_rate': heart_rate_data,
                'gsr': gsr_data
            }
            
            # Process prediction
            prediction_result = predict_glucose_events(
                prediction_data['glucose_readings'], 
                prediction_data['insulin'],
                prediction_data['carbs'],
                prediction_data['activity'],
                prediction_data['heart_rate'],
                prediction_data['gsr']
            )
            
            return jsonify(prediction_result)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/glucose', methods=['POST', 'GET'])
def glucose_endpoint():
    """Endpoint to save or retrieve glucose readings"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields
            if 'value' not in data:
                return jsonify({'error': 'Glucose value is required'}), 400
                
            # Set timestamp if not provided
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow()
            else:
                data['timestamp'] = datetime.fromisoformat(data['timestamp'])
            
            # Insert into database
            result = glucose_readings.insert_one(data)
            
            return jsonify({
                'message': 'Glucose reading saved successfully',
                'id': str(result.inserted_id)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'GET':
        try:
            # Get user_id from query params
            user_id = request.args.get('user_id')
            limit = int(request.args.get('limit', 100))
            
            # Get readings from the last 24 hours by default
            since = request.args.get('since')
            if since:
                since_date = datetime.fromisoformat(since)
            else:
                since_date = datetime.utcnow() - timedelta(hours=24)
            
            # Query database
            query = {'timestamp': {'$gte': since_date}}
            if user_id:
                query['user_id'] = user_id
                
            results = list(glucose_readings.find(query).sort('timestamp', -1).limit(limit))
            
            # Convert ObjectId to string for JSON serialization
            return json.dumps({'readings': results}, default=json_serialize), 200, {'Content-Type': 'application/json'}
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/insulin', methods=['POST', 'GET'])
def insulin_endpoint():
    """Endpoint to save or retrieve insulin doses"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields
            if 'dose' not in data or 'insulin_type' not in data:
                return jsonify({'error': 'Dose and insulin_type are required'}), 400
                
            # Set timestamp if not provided
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow()
            else:
                data['timestamp'] = datetime.fromisoformat(data['timestamp'])
            
            # Insert into database
            result = insulin_doses.insert_one(data)
            
            return jsonify({
                'message': 'Insulin dose saved successfully',
                'id': str(result.inserted_id)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'GET':
        try:
            # Similar to glucose endpoint
            user_id = request.args.get('user_id')
            limit = int(request.args.get('limit', 100))
            
            since = request.args.get('since')
            if since:
                since_date = datetime.fromisoformat(since)
            else:
                since_date = datetime.utcnow() - timedelta(hours=24)
            
            query = {'timestamp': {'$gte': since_date}}
            if user_id:
                query['user_id'] = user_id
                
            results = list(insulin_doses.find(query).sort('timestamp', -1).limit(limit))
            
            return json.dumps({'doses': results}, default=json_serialize), 200, {'Content-Type': 'application/json'}
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/meal', methods=['POST', 'GET'])
def meal_endpoint():
    """Endpoint to save or retrieve meal entries"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields
            if 'carbs' not in data:
                return jsonify({'error': 'Carbohydrate value is required'}), 400
                
            # Set timestamp if not provided
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow()
            else:
                data['timestamp'] = datetime.fromisoformat(data['timestamp'])
            
            # Insert into database
            result = meal_entries.insert_one(data)
            
            return jsonify({
                'message': 'Meal entry saved successfully',
                'id': str(result.inserted_id)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'GET':
        # Similar implementation as above endpoints
        # Get recent meal entries
        pass

@app.route('/api/activity', methods=['POST', 'GET'])
def activity_endpoint():
    """Endpoint to save or retrieve activity entries"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields
            if 'activity_type' not in data or 'duration' not in data:
                return jsonify({'error': 'Activity type and duration are required'}), 400
                
            # Set timestamp if not provided
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow()
            else:
                data['timestamp'] = datetime.fromisoformat(data['timestamp'])
            
            # Insert into database
            result = activity_entries.insert_one(data)
            
            return jsonify({
                'message': 'Activity entry saved successfully',
                'id': str(result.inserted_id)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'GET':
        # Similar implementation as above endpoints
        pass

@app.route('/api/vitals', methods=['POST', 'GET'])
def vitals_endpoint():
    """Endpoint to save or retrieve vital signs"""
    if request.method == 'POST':
        try:
            data = request.get_json()
                
            # Set timestamp if not provided
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow()
            else:
                data['timestamp'] = datetime.fromisoformat(data['timestamp'])
            
            # Insert into database
            result = vitals_entries.insert_one(data)
            
            return jsonify({
                'message': 'Vitals entry saved successfully',
                'id': str(result.inserted_id)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'GET':
        # Similar implementation as above endpoints
        pass

@app.route('/api/data/recent', methods=['GET'])
def recent_data():
    """Get recent data for all types for display on home screen"""
    try:
        user_id = request.args.get('user_id')
        hours = int(request.args.get('hours', 24))
        
        since_date = datetime.utcnow() - timedelta(hours=hours)
        
        # Query filter
        query = {'timestamp': {'$gte': since_date}}
        if user_id:
            query['user_id'] = user_id
            
        # Get recent data of each type
        recent_glucose = list(glucose_readings.find(query).sort('timestamp', -1).limit(20))
        recent_insulin = list(insulin_doses.find(query).sort('timestamp', -1).limit(10))
        recent_meals = list(meal_entries.find(query).sort('timestamp', -1).limit(10))
        recent_activity = list(activity_entries.find(query).sort('timestamp', -1).limit(5))
        
        # Create timeline of all events
        timeline = []
        for reading in recent_glucose:
            timeline.append({
                'type': 'glucose',
                'value': reading['value'],
                'timestamp': reading['timestamp'],
                'id': str(reading['_id'])
            })
            
        for dose in recent_insulin:
            timeline.append({
                'type': 'insulin',
                'value': dose['dose'],
                'insulin_type': dose['insulin_type'],
                'timestamp': dose['timestamp'],
                'id': str(dose['_id'])
            })
            
        for meal in recent_meals:
            timeline.append({
                'type': 'meal',
                'value': meal['carbs'],
                'meal_type': meal.get('meal_type', ''),
                'timestamp': meal['timestamp'],
                'id': str(meal['_id'])
            })
            
        for activity in recent_activity:
            timeline.append({
                'type': 'activity',
                'value': activity['duration'],
                'activity_type': activity['activity_type'],
                'timestamp': activity['timestamp'],
                'id': str(activity['_id'])
            })
            
        # Sort timeline by timestamp (newest first)
        timeline.sort(key=lambda x: x['timestamp'], reverse=True)
        
        response = {
            'timeline': timeline,
            'glucose_data': [{'time': g['timestamp'].strftime('%H:%M'), 'value': g['value']} for g in sorted(recent_glucose, key=lambda x: x['timestamp'])]
        }
        
        return json.dumps(response, default=json_serialize), 200, {'Content-Type': 'application/json'}
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# Add this new endpoint to app.py
@app.route('/api/recommendation/<prediction_id>', methods=['GET'])
def get_recommendation(prediction_id):
    """Endpoint to get recommendation status for a specific prediction"""
    try:
        recommendation_data = get_recommendation_status(prediction_id)
        
        if recommendation_data["status"] == "not_found":
            return jsonify({
                'error': 'Recommendation not found',
                'status': 'not_found'
            }), 404
            
        return jsonify(recommendation_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)