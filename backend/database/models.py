# database/models.py
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime
import os

# Get MongoDB connection string from environment or use default
mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
db_name = os.environ.get('DB_NAME', 'glycemic_data')

# Create client
client = MongoClient(mongodb_uri)
db = client[db_name]

# Define collections
users = db.users
glucose_readings = db.glucose_readings
insulin_doses = db.insulin_doses
meal_entries = db.meal_entries
activity_entries = db.activity_entries
vitals_entries = db.vitals_entries

# Schema validation definitions
user_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["username", "email", "created_at"],
            "properties": {
                "username": {
                    "bsonType": "string",
                    "description": "Username must be a string and is required"
                },
                "email": {
                    "bsonType": "string",
                    "description": "Email must be a string and is required"
                },
                "created_at": {
                    "bsonType": "date",
                    "description": "Created at timestamp is required"
                }
            }
        }
    }
}

glucose_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["value", "timestamp"],
            "properties": {
                "user_id": {
                    "bsonType": "string",
                    "description": "User ID (optional)"
                },
                "value": {
                    "bsonType": "double",
                    "description": "Glucose value in mg/dL"
                },
                "timestamp": {
                    "bsonType": "date",
                    "description": "When the reading was taken"
                },
                "meal_context": {
                    "bsonType": "string",
                    "enum": ["before_meal", "after_meal", "fasting", "bedtime", None],
                    "description": "Meal context for the reading"
                },
                "notes": {
                    "bsonType": "string",
                    "description": "Optional notes"
                }
            }
        }
    }
}

insulin_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["insulin_type", "dose", "timestamp"],
            "properties": {
                "user_id": {
                    "bsonType": "string",
                    "description": "User ID (optional)"
                },
                "insulin_type": {
                    "bsonType": "string",
                    "enum": ["basal", "bolus"],
                    "description": "Type of insulin"
                },
                "dose": {
                    "bsonType": "double",
                    "description": "Insulin dose in units"
                },
                "timestamp": {
                    "bsonType": "date",
                    "description": "When the insulin was taken"
                },
                "notes": {
                    "bsonType": "string",
                    "description": "Optional notes"
                }
            }
        }
    }
}

meal_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["carbs", "timestamp"],
            "properties": {
                "user_id": {
                    "bsonType": "string",
                    "description": "User ID (optional)"
                },
                "carbs": {
                    "bsonType": "double",
                    "description": "Carbohydrate amount in grams"
                },
                "meal_type": {
                    "bsonType": "string",
                    "enum": ["Breakfast", "Lunch", "Dinner", "Snack", None],
                    "description": "Type of meal"
                },
                "timestamp": {
                    "bsonType": "date",
                    "description": "When the meal was consumed"
                },
                "description": {
                    "bsonType": "string",
                    "description": "Meal description"
                }
            }
        }
    }
}

activity_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["activity_type", "duration", "timestamp"],
            "properties": {
                "user_id": {
                    "bsonType": "string",
                    "description": "User ID (optional)"
                },
                "activity_type": {
                    "bsonType": "string",
                    "description": "Type of activity"
                },
                "duration": {
                    "bsonType": "int",
                    "description": "Duration in minutes"
                },
                "intensity": {
                    "bsonType": "string",
                    "enum": ["light", "moderate", "vigorous", None],
                    "description": "Activity intensity"
                },
                "timestamp": {
                    "bsonType": "date",
                    "description": "When the activity occurred"
                },
                "notes": {
                    "bsonType": "string",
                    "description": "Optional notes"
                }
            }
        }
    }
}

vitals_schema = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["timestamp"],
            "properties": {
                "user_id": {
                    "bsonType": "string",
                    "description": "User ID (optional)"
                },
                "heart_rate": {
                    "bsonType": ["int", "null"],
                    "description": "Heart rate in bpm"
                },
                "gsr": {
                    "bsonType": ["double", "null"],
                    "description": "Galvanic skin response"
                },
                "stress_level": {
                    "bsonType": ["string", "null"],
                    "enum": ["low", "medium", "high", None],
                    "description": "Stress level indicator"
                },
                "timestamp": {
                    "bsonType": "date",
                    "description": "When the vitals were measured"
                },
                "notes": {
                    "bsonType": "string",
                    "description": "Optional notes"
                }
            }
        }
    }
}

def init_db():
    """Initialize database with collections and indexes"""
    # Create collections with validation if they don't exist
    if "users" not in db.list_collection_names():
        db.create_collection("users", **user_schema)
    
    if "glucose_readings" not in db.list_collection_names():
        db.create_collection("glucose_readings", **glucose_schema)
    
    if "insulin_doses" not in db.list_collection_names():
        db.create_collection("insulin_doses", **insulin_schema)
    
    if "meal_entries" not in db.list_collection_names():
        db.create_collection("meal_entries", **meal_schema)
    
    if "activity_entries" not in db.list_collection_names():
        db.create_collection("activity_entries", **activity_schema)
    
    if "vitals_entries" not in db.list_collection_names():
        db.create_collection("vitals_entries", **vitals_schema)
    
    # Create indexes for faster queries
    glucose_readings.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    insulin_doses.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    meal_entries.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    activity_entries.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    vitals_entries.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    users.create_index("email", unique=True)
    users.create_index("username", unique=True)

# Helper functions to create new documents with proper formatting
def create_user(username, email):
    """Create a new user document"""
    user_doc = {
        "username": username,
        "email": email,
        "created_at": datetime.utcnow()
    }
    return users.insert_one(user_doc)

def format_document_for_response(doc):
    """Format a MongoDB document for API response"""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
        doc["timestamp"] = doc["timestamp"].isoformat()
    if "created_at" in doc and isinstance(doc["created_at"], datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc