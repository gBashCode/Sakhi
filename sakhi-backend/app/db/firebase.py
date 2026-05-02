import os
import firebase_admin
from firebase_admin import credentials, firestore

# Global variable to hold the initialized app to avoid initializing twice
_firebase_app = None

def init_firebase():
    global _firebase_app
    if not _firebase_app:
        cred_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "firebase-credentials.json")
        try:
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
    return _firebase_app

def get_db():
    if not _firebase_app:
        init_firebase()
    return firestore.client()
