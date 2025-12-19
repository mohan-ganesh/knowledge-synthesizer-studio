
import asyncio
import json
import uuid
import websockets
from fastapi import WebSocket, WebSocketDisconnect
from .config import GEMINI_MODEL_ID
from .room_manager import room_manager
from .auth import generate_access_token
from .session import sessions, Session, broadcast_to_users
from .gemini import connect_to_gemini, logger

async def handle_websocket_client(client_websocket: WebSocket) -> None:
    """
    Handles a new WebSocket client connection.
    """
    await client_websocket.accept()
    
    # Generate unique client ID for logging
    client_id = str(uuid.uuid4())[:8]
    print(f"[Client: {client_id}] 🔌 New WebSocket connection...")
    session = None
    
    try:
        # Wait for the first message from the client
        # In Websockets library: recv(). In FastAPI: receive_text()
        service_setup_message = await client_websocket.receive_text()
        service_setup_message_data = json.loads(service_setup_message)

        bearer_token = service_setup_message_data.get("bearer_token")
        service_url = service_setup_message_data.get("service_url")
        session_id = service_setup_message_data.get("session_id", "default")
        
        log_prefix = f"[Session: {session_id}] [Client: {client_id}]"

        # --- Room Management Check ---
        room_meta = room_manager.ensure_room_exists(session_id)
        if room_meta.get("status") == "closed":
             print(f"{log_prefix} ❌ Room is CLOSED. Rejecting connection.")
             await client_websocket.close(code=1008, reason="Room is closed")
             return
        # -----------------------------

        # If no bearer token provided, generate one using default credentials
        if not bearer_token:
            print(f"{log_prefix} 🔑 Generating access token using default credentials...")
            bearer_token = generate_access_token()
            if not bearer_token:
                print(f"{log_prefix} ❌ Failed to generate access token")
                await client_websocket.close(
                    code=1008, reason="Authentication failed"
                )
                return

        if not service_url:
            print(f"{log_prefix} ❌ Error: Service URL is missing")
            await client_websocket.close(
                code=1008, reason="Service URL is required"
            )
            return

        # Get or create session
        if session_id not in sessions:
            print(f"{log_prefix} Creating new session")
            sessions[session_id] = Session(session_id)
        
        session = sessions[session_id]
        
        # If there's a pending cleanup task for this session, cancel it!
        if session.cleanup_task:
             session.cleanup_task.cancel()
             session.cleanup_task = None
             print(f"{log_prefix} 🛡️ Cleanup cancelled. User returned.")

        session.users.add(client_websocket)
        session.user_ids[client_websocket] = client_id
        print(f"{log_prefix} User joined. Total users in session: {len(session.users)}")

        # Connect to Gemini if first user or not connected
        # Use a lock-like mechanism (checking gemini_ws is enough if we are careful)
        # But since we have await points, we should be careful.
        # Ideally we'd use an asyncio.Lock on the session.
        # if not hasattr(session, 'init_lock'):
        #      session.init_lock = asyncio.Lock()
        init_lock = session.get_init_lock()
        
        async with init_lock:
             if not session.gemini_ws:
                 await connect_to_gemini(session, bearer_token, service_url)

        # Main loop: Read from client, forward to Gemini, Broadcast to others
        # FastAPI's iter_text() yields strings
        try:
            async for message in client_websocket.iter_text():
                # message is already a string
                
                # Log User message
                logger.log_message(session_id, client_id, "User", message)

                # Check if this is a setup message
                try:
                    data = json.loads(message)
                    if "setup" in data:
                        # --- Enforce Backend Model ID ---
                        if "model" in data["setup"]:
                            current_model_uri = data["setup"]["model"]
                            # URI format: projects/{project}/locations/{location}/publishers/{publisher}/models/{model}
                            if "/models/" in current_model_uri:
                                prefix = current_model_uri.split("/models/")[0]
                                new_model_uri = f"{prefix}/models/{GEMINI_MODEL_ID}"
                                data["setup"]["model"] = new_model_uri
                                # Re-serialize message with updated model
                                message = json.dumps(data)
                                print(f"{log_prefix} 🔧 Enforcing Model ID: {GEMINI_MODEL_ID}")
                        # --------------------------------

                        # If session already has a gemini connection active and we are not the first user...
                        if getattr(session, 'setup_complete', False):
                            print(f"{log_prefix} Skipping duplicate setup message")
                            # Send a fake 'setupComplete' to this client so it knows it's ready
                            response = {"setupComplete": {}}
                            await client_websocket.send_text(json.dumps(response))
                            continue
                        else:
                            # Mark setup as complete (or in progress)
                            session.setup_complete = True
                except:
                    pass

                # Handle Ping/Pong
                try:
                    data = json.loads(message)
                    if data.get("ping"):
                        await client_websocket.send_text(json.dumps({"pong": True}))
                        continue
                except:
                    pass

                # 1. Forward to Gemini
                if session.gemini_ws:
                    await session.gemini_ws.send(message)
                    
                    # --- Text Extraction for Logs ---
                    try:
                        data = json.loads(message)
                        client_content = data.get("clientContent", {})
                        turns = client_content.get("turns", [])
                        for turn in turns:
                            for part in turn.get("parts", []):
                                text = part.get("text")
                                if text:
                                    logger.log_message(session_id, client_id, "UserText (Direct)", text)
                    except:
                        pass
                else:
                    # Try to reconnect? For now just log
                    print(f"{log_prefix} Warning: Gemini not connected")

                # 2. Broadcast to other users in the room
                await broadcast_to_users(session, message, exclude_user=client_websocket)
        except WebSocketDisconnect:
             print(f"{log_prefix} Client disconnected (WebSocketDisconnect)")
                
    except Exception as e:
        print(f"{log_prefix} Error processing message loop: {e}")

    except asyncio.TimeoutError:
        print(f"[Client: {client_id}] ⏱️ Timeout waiting for the first message")
        await client_websocket.close(code=1008, reason="Timeout")
    except json.JSONDecodeError as e:
        print(f"[Client: {client_id}] ❌ Invalid JSON in first message: {e}")
        await client_websocket.close(code=1008, reason="Invalid JSON")
    except Exception as e:  # Catch-all for other errors
        print(f"[Client: {client_id}] ❌ Error handling client: {e}")
        # Only try to close if not already closed
        try:
             await client_websocket.close()
        except:
             pass
    finally:
        # Cleanup
        if session and client_websocket in session.users:
            session.users.remove(client_websocket)
            if client_websocket in session.user_ids:
                del session.user_ids[client_websocket]
            print(f"[Session: {session.session_id}] [Client: {client_id}] User left. Remaining users: {len(session.users)}")
            
            # Flush logs for THIS session 
            logger.flush_session_logs(session_id)
            
            # If session is empty, wait for a grace period before cleaning up
            if not session.users:
                print(f"[Session: {session.session_id}] empty. Starting 30s grace period...")
                
                async def delayed_cleanup(sid):
                    await asyncio.sleep(30) # 30 second grace period
                    if sid not in sessions:
                        return
                    
                    s = sessions[sid]
                    if not s.users:
                        print(f"Session {sid} cleanup initiated after grace period.")
                        if s.gemini_task:
                            s.gemini_task.cancel()
                        if s.gemini_ws:
                            try:
                                await s.gemini_ws.close()
                            except:
                                pass
                        if sid in sessions:
                            del sessions[sid]
                        print(f"Session {sid} cleaned up.")
                    else:
                        print(f"Session {sid} cleanup aborted - user returned during grace period.")

                session.cleanup_task = asyncio.create_task(delayed_cleanup(session_id))
