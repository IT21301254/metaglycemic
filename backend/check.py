from pymongo import MongoClient
from datetime import datetime, timedelta
import json

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["glycemic_data"]
recommendations = db.recommendations

# 1. Count all documents
total_count = recommendations.count_documents({})
print(f"Total documents in recommendations collection: {total_count}")

# 2. Show a sample of documents
print("\nSample documents:")
sample_docs = list(recommendations.find().limit(5))
for doc in sample_docs:
    doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
    # Convert dates to strings
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    print(json.dumps(doc, indent=2))

# 3. Check if any documents have expired or will expire soon
now = datetime.utcnow()
expiring_soon = recommendations.count_documents({
    "initiated_at": {"$lt": now + timedelta(hours=2)}
})
print(f"\nDocuments expiring within 2 hours: {expiring_soon}")

# 4. Check for documents with missing fields
missing_prediction_id = recommendations.count_documents({"prediction_id": {"$exists": False}})
print(f"Documents missing prediction_id: {missing_prediction_id}")

missing_initiated_at = recommendations.count_documents({"initiated_at": {"$exists": False}})
print(f"Documents missing initiated_at: {missing_initiated_at}")

# 5. Test querying by a known prediction_id
if sample_docs:
    test_id = sample_docs[0].get('prediction_id')
    if test_id:
        result = recommendations.find_one({"prediction_id": test_id})
        print(f"\nTest query for prediction_id '{test_id}': {'Found' if result else 'Not found'}")

# 6. Check different status values
statuses = recommendations.distinct("status")
print(f"\nDistinct status values: {statuses}")
for status in statuses:
    count = recommendations.count_documents({"status": status})
    print(f"  Documents with status '{status}': {count}")

# 7. Examine the indexes
print("\nIndexes on recommendations collection:")
for index in recommendations.list_indexes():
    print(json.dumps(index, default=str, indent=2))