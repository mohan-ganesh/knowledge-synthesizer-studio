
import os

DEBUG = False
# Use PORT env var for Cloud Run, default to 8080
WS_PORT = int(os.environ.get("PORT", 8080))
GCS_BUCKET_NAME = "mg-brian-knowledge"
GEMINI_MODEL_ID = os.environ.get("GEMINI_MODEL_ID", "gemini-live-2.5-flash-native-audio")
