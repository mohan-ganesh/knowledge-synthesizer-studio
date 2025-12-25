
import datetime
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from google.cloud import storage

class ConversationLogger:
    def __init__(self, bucket_name):
        self.bucket_name = bucket_name
        self.buffer = {} # {session_id: {client_id: [messages]}}
        self.client = None
        self.bucket = None
        self.executor = ThreadPoolExecutor(max_workers=4)

    def _get_bucket(self):
        if not self.client:
            try:
                self.client = storage.Client()
                self.bucket = self.client.bucket(self.bucket_name)
            except Exception as e:
                print(f"❌ Failed to initialize GCS client: {e}")
                return None
        return self.bucket

    def log_message(self, session_id, client_id, sender, text):
        """Buffer a message for logging."""
        if session_id not in self.buffer:
            self.buffer[session_id] = {}
        if client_id not in self.buffer[session_id]:
            self.buffer[session_id][client_id] = []

        message_entry = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "sender": sender,
            "text": text
        }
        self.buffer[session_id][client_id].append(message_entry)

    def flush_session_logs(self, session_id):
        """Flush logs for a specific session to GCS."""
        if session_id not in self.buffer:
            return

        session_data = self.buffer.pop(session_id)
        
        # Offload GCS write to thread pool
        asyncio.get_event_loop().run_in_executor(
            self.executor, 
            self._write_to_gcs, 
            session_id, 
            session_data
        )

    def _write_to_gcs(self, session_id, session_data):
        """Synchronous GCS write function."""
        bucket = self._get_bucket()
        if not bucket:
            return

        # Get current date for organizing logs
        now = datetime.datetime.utcnow()
        month = now.strftime("%Y-%m")  # e.g., "2025-12"
        day = now.strftime("%d")        # e.g., "20"

        for client_id, messages in session_data.items():
            if not messages:
                continue

            # Format: sessions/{month}/{day}/{session_id}/{client_id}.jsonl
            blob_name = f"sessions/{month}/{day}/{session_id}/{client_id}.jsonl"
            blob = bucket.blob(blob_name)

            content = ""
            for msg in messages:
                content += json.dumps(msg) + "\n"

            try:
                # Append if exists (read-modify-write)
                current_content = ""
                if blob.exists():
                     current_content = blob.download_as_text()
                
                new_content = current_content + content
                blob.upload_from_string(new_content)
                print(f"✅ Logs saved to gs://{self.bucket_name}/{blob_name}")
            except Exception as e:
                print(f"❌ Failed to write logs to GCS: {e}")
