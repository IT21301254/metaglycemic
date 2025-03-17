# database/db.py
from pymongo import MongoClient
import os

# Get MongoDB connection string from environment or use default
mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
db_name = os.environ.get('DB_NAME', 'glycemic_data')

# Create client
client = MongoClient(mongodb_uri)
db = client[db_name]

# Collection references
users = db.users
glucose_readings = db.glucose_readings
insulin_doses = db.insulin_doses
meal_entries = db.meal_entries
activity_entries = db.activity_entries
vitals_entries = db.vitals_entries

def init_db():
    """Initialize database indexes"""
    # Create indexes for faster queries
    glucose_readings.create_index([("user_id", 1), ("timestamp", -1)])
    insulin_doses.create_index([("user_id", 1), ("timestamp", -1)])
    meal_entries.create_index([("user_id", 1), ("timestamp", -1)])
    activity_entries.create_index([("user_id", 1), ("timestamp", -1)])
    vitals_entries.create_index([("user_id", 1), ("timestamp", -1)])
    users.create_index("email", unique=True)
    users.create_index("username", unique=True)