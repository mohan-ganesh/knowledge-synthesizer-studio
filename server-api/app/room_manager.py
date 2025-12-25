
import json
import uuid
from datetime import datetime
from google.cloud import storage
from .config import GCS_BUCKET_NAME

class RoomManager:
    def __init__(self, bucket_name):
        self.bucket_name = bucket_name
        self.client = None
        self.bucket = None

    def _get_bucket(self):
        if not self.client:
            try:
                self.client = storage.Client()
                self.bucket = self.client.bucket(self.bucket_name)
            except Exception as e:
                print(f"❌ Failed to initialize GCS client for RoomManager: {e}")
                return None
        return self.bucket

    def _get_blob(self, room_id, created_at=None):
        bucket = self._get_bucket()
        if not bucket:
            return None
        
        # If created_at is provided, use it to determine the path
        # Otherwise, use current date (for new rooms)
        if created_at:
            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        else:
            dt = datetime.utcnow()
        
        month = dt.strftime("%Y-%m")
        day = dt.strftime("%d")
        
        return bucket.blob(f"rooms/{month}/{day}/{room_id}/metadata.json")

    def create_room(self, name=None):
        """Creates a new room with OPEN status and an explicit name."""
        room_id = str(uuid.uuid4())
        # Force a default name if None or empty string to ensure the 'name' key always exists
        display_name = name if (name and name.strip()) else f"Room-{room_id[:8]}"
        
        print(f"🛠️ Creating room ID: {room_id} with Name: {display_name}")
        
        metadata = {
            "room_id": room_id,
            "name": display_name,
            "status": "open",
            "created_at": datetime.utcnow().isoformat(),
            "closed_at": None
        }
        self._save_metadata(room_id, metadata)
        print(f"✅ Room created successfully: {json.dumps(metadata)}")
        return metadata

    def get_room(self, room_id):
        """Retrieves room metadata."""
        blob = self._get_blob(room_id)
        if not blob or not blob.exists():
            return None
        
        try:
            content = blob.download_as_text()
            return json.loads(content)
        except Exception as e:
            print(f"❌ Error reading room {room_id}: {e}")
            return None

    def list_rooms(self):
        """Lists all open rooms."""
        bucket = self._get_bucket()
        if not bucket:
            return []
        
        # List all blobs with prefix 'rooms/'
        # Structure is rooms/{month}/{day}/{id}/metadata.json
        blobs = bucket.list_blobs(prefix="rooms/")
        rooms = []
        
        for blob in blobs:
            if blob.name.endswith("metadata.json"):
                try:
                    content = blob.download_as_text()
                    metadata = json.loads(content)
                    if metadata.get("status") == "open":
                        rooms.append(metadata)
                except Exception as e:
                    print(f"⚠️ Error reading blob {blob.name}: {e}")
                    continue
        
        # Sort by creation time (descending)
        rooms.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return rooms

    def close_room(self, room_id):
        """Closes a room."""
        metadata = self.get_room(room_id)
        if not metadata:
            return False
            
        metadata["status"] = "closed"
        metadata["closed_at"] = datetime.utcnow().isoformat()
        # Pass created_at to ensure we save to the correct date folder
        self._save_metadata(room_id, metadata, metadata.get("created_at"))
        print(f"🔒 Room closed: {room_id}")
        return True

    def _save_metadata(self, room_id, metadata, created_at=None):
        blob = self._get_blob(room_id, created_at or metadata.get("created_at"))
        if blob:
            blob.upload_from_string(json.dumps(metadata), content_type="application/json")

    def ensure_room_exists(self, room_id):
        """
        Checks if room exists. If not, auto-creates it (backward compatibility).
        Returns the room metadata.
        """
        metadata = self.get_room(room_id)
        if not metadata:
            print(f"⚠️ Room {room_id} not found. Auto-creating...")
            # Use the provided ID instead of generating a new one
            metadata = {
                "room_id": room_id,
                "name": f"Session-{room_id[:8]}",
                "status": "open",
                "created_at": datetime.utcnow().isoformat(),
                "closed_at": None
            }
            self._save_metadata(room_id, metadata)
        return metadata

# Singleton
room_manager = RoomManager(GCS_BUCKET_NAME)
