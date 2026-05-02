import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Global variable to hold the initialized app to avoid initializing twice
_firebase_app = None

def init_firebase():
    global _firebase_app
    if not _firebase_app:
        try:
            # Priority 1: Read from environment variable (for Render / cloud deployments)
            cred_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            if cred_json:
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                _firebase_app = firebase_admin.initialize_app(cred)
                print("Firebase initialized from env variable")
            else:
                # Priority 2: Read from local file (for local development)
                cred_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "firebase-credentials.json")
                cred = credentials.Certificate(cred_path)
                _firebase_app = firebase_admin.initialize_app(cred)
                print("Firebase initialized from local file")
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
    return _firebase_app

def get_db():
    if not _firebase_app:
        init_firebase()
    return firestore.client()
