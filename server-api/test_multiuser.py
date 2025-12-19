import asyncio
import websockets
import json
import logging

# Configure logging
logging.basicConfig(
    format="%(asctime)s %(message)s",
    level=logging.INFO,
)

PROXY_URI = "ws://localhost:8080"
MOCK_GEMINI_URI = "ws://localhost:9090"
SESSION_ID = "test-session-123"

async def connect_client(name):
    """
    Connects a client to the proxy and performs the setup handshake.
    """
    async with websockets.connect(PROXY_URI) as websocket:
        logging.info(f"{name}: Connected to proxy")
        
        # 1. Send Setup Message
        setup_msg = {
            "bearer_token": "dummy-token",
            "service_url": MOCK_GEMINI_URI,
            "session_id": SESSION_ID
        }
        await websocket.send(json.dumps(setup_msg))
        
        # Keep connection open and return it? 
        # Websockets context manager closes on exit.
        # We need to run logic inside here.
        yield websocket

async def run_test():
    async with websockets.connect(PROXY_URI) as client_a, \
               websockets.connect(PROXY_URI) as client_b:
                   
        logging.info("Client A: Connected")
        logging.info("Client B: Connected")

        # 1. Setup Client A
        setup_a = {
            "bearer_token": "dummy-token",
            "service_url": MOCK_GEMINI_URI,
            "session_id": SESSION_ID
        }
        await client_a.send(json.dumps(setup_a))
        logging.info("Client A: sent setup")
        
        # 2. Setup Client B
        setup_b = {
            "bearer_token": "dummy-token",
            "service_url": MOCK_GEMINI_URI,
            "session_id": SESSION_ID
        }
        await client_b.send(json.dumps(setup_b))
        logging.info("Client B: sent setup")

        # Give some time for server to process joins
        await asyncio.sleep(1)

        # 3. Client A sends a message
        msg_a = {"text": "Hello from Client A"}
        await client_a.send(json.dumps(msg_a))
        logging.info(f"Client A: Sent {msg_a}")

        # 4. Verify Client B receives it (Fan-in broadcast)
        # Note: Client B might receive multiple messages (Gemini echo, etc.)
        # We just check for our specific message.
        
        received_by_b = False
        gemini_echo_received = False
        
        try:
            while not (received_by_b and gemini_echo_received):
                message = await asyncio.wait_for(client_b.recv(), timeout=5.0)
                logging.info(f"Client B received: {message}")
                
                try:
                    data = json.loads(message)
                except:
                    data = message
                
                # Check for direct broadcast
                if data == msg_a:
                    received_by_b = True
                    logging.info("✅ Client B received broadcast from Client A")
                
                # Check for Gemini Echo
                if isinstance(data, dict) and "Gemini heard" in str(data):
                    gemini_echo_received = True
                    logging.info("✅ Client B received Gemini echo")

        except asyncio.TimeoutError:
            logging.error("❌ Timeout waiting for messages on Client B")
        
        if received_by_b and gemini_echo_received:
            logging.info("✅ TEST PASSED: Broadcasting and Gemini Proxy working")
        else:
            logging.error("❌ TEST FAILED")

if __name__ == "__main__":
    asyncio.run(run_test())
