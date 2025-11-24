from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import os

# Load model
print("Loading model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded.")

# Connect to MongoDB
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/neontix')
client = MongoClient(MONGO_URI)
db = client.get_database()
events_collection = db.events

def backfill():
    # Find events without embeddings (missing, null, or empty)
    events = list(events_collection.find({
        '$or': [
            {'embedding': {'$exists': False}},
            {'embedding': None},
            {'embedding': {'$size': 0}}
        ]
    }))
    print(f"Found {len(events)} events to backfill.")

    for event in events:
        text = f"{event.get('title', '')} {event.get('description', '')}"
        if not text.strip():
            print(f"Skipping event {event['_id']} (no text)")
            continue
            
        print(f"Generating embedding for: {event.get('title')}")
        embedding = model.encode(text).tolist()
        
        events_collection.update_one(
            {'_id': event['_id']},
            {'$set': {'embedding': embedding}}
        )
        print(f"Updated event {event['_id']}")

    print("Backfill complete.")

if __name__ == '__main__':
    backfill()
