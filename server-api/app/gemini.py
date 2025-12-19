
import asyncio
import ssl
import certifi
import json
import websockets
from websockets.exceptions import ConnectionClosed
from .config import DEBUG, GCS_BUCKET_NAME
from .session import Session, broadcast_to_users
from .logger import ConversationLogger

# Initialize Logger (or pass it in?)
# Singleton logger for simplicity
logger = ConversationLogger(GCS_BUCKET_NAME)

async def gemini_reader_task(session: Session):
    """
    Reads messages from Gemini and broadcasts them to all users in the session.
    """
    try:
        async for message in session.gemini_ws:
            if isinstance(message, bytes):
                message = message.decode('utf-8')
            
            if DEBUG:
                print(f"[Session: {session.session_id}] Received from Gemini: {len(message)} bytes")
            
            # Log Gemini response for EVERY user in the session
            for user_ws in session.users:
                 client_id = session.user_ids.get(user_ws, "unknown")
                 logger.log_message(session.session_id, client_id, "Gemini", message)

            # --- Text Extraction for Logs ---
            try:
                data = json.loads(message)
                server_content = data.get("serverContent", {})
                
                # Check for Gemini's own transcription (Model Output)
                model_text = server_content.get("modelDraft") or ""
                if not model_text and "modelAttributes" in server_content:
                     # Some versions might have it elsewhere, but standard 2.5 uses modelDraft
                     pass
                
                # The prompt mentioned "outputTranscription" and "inputTranscription"
                # These are specifically what Gemini Live sends back when enabled
                output_text = server_content.get("outputTranscription")
                if output_text:
                    for user_ws in session.users:
                        cid = session.user_ids.get(user_ws, "unknown")
                        logger.log_message(session.session_id, cid, "GeminiText", output_text)

                input_transcription = server_content.get("inputTranscription")
                if input_transcription:
                    for user_ws in session.users:
                        cid = session.user_ids.get(user_ws, "unknown")
                        logger.log_message(session.session_id, cid, "UserText (Transcribed)", input_transcription)
            except Exception as e:
                if DEBUG:
                    print(f"Logging text extraction failed: {e}")

            # Broadcast Gemini's response to ALL users
            await broadcast_to_users(session, message)
    except ConnectionClosed:
        print(f"Gemini connection closed for session {session.session_id}")
    except Exception as e:
        print(f"Error in gemini_reader_task for session {session.session_id}: {e}")
    finally:
        print(f"Gemini reader task ended for session {session.session_id}")
        if session.gemini_ws:
            try:
                await session.gemini_ws.close()
            except:
                pass
            session.gemini_ws = None
            session.gemini_task = None
            if hasattr(session, 'setup_complete'):
                 session.setup_complete = False

async def connect_to_gemini(session: Session, bearer_token: str, service_url: str):
    """Establish connection to Gemini for the session if not already connected."""
    if session.gemini_ws:
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {bearer_token}",
    }
    
    # Create SSL context with certifi certificates
    ssl_context = ssl.create_default_context(cafile=certifi.where())

    print(f"Connecting session {session.session_id} to Gemini API...")
    try:
        session.gemini_ws = await websockets.connect(
            service_url,
            additional_headers=headers,
            ssl=ssl_context,
            ping_interval=20,
            ping_timeout=20
        )
        print(f"✅ Connected session {session.session_id} to Gemini API")
        
        # Start reading from Gemini
        session.gemini_task = asyncio.create_task(gemini_reader_task(session))
        
    except Exception as e:
        print(f"Failed to connect session {session.session_id} to Gemini API: {e}")
        raise
