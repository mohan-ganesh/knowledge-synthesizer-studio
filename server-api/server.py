#!/usr/bin/env python3
"""
WebSocket Proxy Server for Gemini Live API
Handles authentication and proxies WebSocket connections.

This server acts as a bridge between the browser client and Gemini API,
handling Google Cloud authentication automatically using default credentials.
Uses FastAPI for HTTP and Websocket handling.
"""

import uvicorn
import os
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import WS_PORT, GCS_BUCKET_NAME
from app.websocket import handle_websocket_client
from app.room_manager import room_manager
from pydantic import BaseModel

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateRoomRequest(BaseModel):
    name: str = None

class CreateRoomResponse(BaseModel):
    room_id: str
    name: str

@app.get("/")
async def root():
    return {"message": "Gemini Live API Proxy with Multi-User Support"}

@app.post("/room", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest = None):
    """Create a new room with an optional name."""
    name = request.name if request else None
    room_meta = room_manager.create_room(name=name)
    return room_meta

@app.get("/rooms")
async def list_rooms():
    """List all open rooms."""
    return room_manager.list_rooms()

@app.get("/room/{room_id}")
async def get_room(room_id: str):
    """Get room details."""
    room = room_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@app.post("/room/{room_id}/close")
async def close_room(room_id: str):
    """Close a room."""
    success = room_manager.close_room(room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room closed"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await handle_websocket_client(websocket)

@app.websocket("/")
async def websocket_endpoint_root(websocket: WebSocket):
    await handle_websocket_client(websocket)

if __name__ == "__main__":
    print(f"""
╔════════════════════════════════════════════════════════════════╗
║     Gemini Live API Proxy Server                               ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🔌 WebSocket Proxy: ws://0.0.0.0:{WS_PORT}/ws                 ║
║  🌐 HTTP API: http://0.0.0.0:{WS_PORT}/docs                    ║
║  👥 Multi-user Session Support Enabled                         ║
║  💾 Logging to GCS: {GCS_BUCKET_NAME}                          ║
║                                                                ║
║  Authentication:                                               ║
║  • Uses Google Cloud default credentials                       ║
║  • Run: gcloud auth application-default login                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝ 
""")
    uvicorn.run(app, host="0.0.0.0", port=WS_PORT)