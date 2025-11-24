from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import numpy as np
import os
from bson import ObjectId

app = Flask(__name__)

# Load model (downloading on first run might take a moment)
print("Loading model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded.")

# Connect to MongoDB
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/neontix')
client = MongoClient(MONGO_URI)
db = client.get_database()
events_collection = db.events
users_collection = db.users

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def get_popular_events(limit=10):
    all_events = list(events_collection.find())
    scored_events = []
    
    for event in all_events:
        popularity_score = len(event.get('interestedUsers', [])) + len(event.get('bookedSeats', []))
        scored_events.append((popularity_score, event))
    
    scored_events.sort(key=lambda x: x[0], reverse=True)
    top_events = scored_events[:limit]
    
    recommendations = []
    for score, event in top_events:
        recommendations.append({
            'id': str(event['_id']),
            'title': event['title'],
            'category': event.get('category'),
            'image': event.get('image'),
            'date': event.get('date'),
            'location': event.get('location'),
            'score': float(score),
            'isPopular': True
        })
    return recommendations

@app.route('/generate-embedding', methods=['POST'])
def generate_embedding():
    data = request.json
    text = f"{data.get('title', '')} {data.get('description', '')}"
    
    if not text.strip():
        return jsonify({'error': 'No text provided'}), 400
        
    embedding = model.encode(text).tolist()
    return jsonify({'embedding': embedding})

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            user_interests = []
        else:
            # 1. Get user's interested events
            # In the Event schema, 'interestedUsers' contains user IDs.
            # We need to find events where interestedUsers contains user_id
            user_interests = list(events_collection.find({
                'interestedUsers': ObjectId(user_id),
                'embedding': {'$exists': True}
            }))

        if not user_interests:
            # Fallback: Return top 10 popular events
            recommendations = get_popular_events()
            return jsonify({'recommendations': recommendations, 'message': 'Popular events fallback'})

        # 2. Calculate user profile vector (mean of interest embeddings)
        interest_embeddings = [np.array(event['embedding']) for event in user_interests]
        user_vector = np.mean(interest_embeddings, axis=0)

        # 3. Get all candidate events (not already interested)
        interested_event_ids = {event['_id'] for event in user_interests}
        candidates = list(events_collection.find({
            '_id': {'$nin': list(interested_event_ids)},
            'embedding': {'$exists': True}
        }))

        # 4. Calculate similarities
        scored_candidates = []
        for event in candidates:
            event_vector = np.array(event['embedding'])
            score = cosine_similarity(user_vector, event_vector)
            scored_candidates.append((score, event))

        # 5. Sort and pick top 20
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_20 = scored_candidates[:20]

        # 6. Format response
        recommendations = []
        for score, event in top_20:
            recommendations.append({
                'id': str(event['_id']),
                'title': event['title'],
                'category': event.get('category'),
                'image': event.get('image'),
                'date': event.get('date'),
                'location': event.get('location'),
                'score': float(score)
            })

        if not recommendations:
             # Fallback if no similar events found (e.g. user liked everything)
             recommendations = get_popular_events()
             return jsonify({'recommendations': recommendations, 'message': 'Popular events fallback (no similar found)'})

        return jsonify({'recommendations': recommendations})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
