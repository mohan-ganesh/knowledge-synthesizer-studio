import asyncio
import websockets
import json

PORT = 9090

async def echo(websocket):
    print("Mock Gemini: Client connected")
    try:
        async for message in websocket:
            print(f"Mock Gemini received: {message}")
            # Echo back a response pretending to be Gemini
            try:
                data = json.loads(message)
                # Just assuming it might be JSON, but Gemini protocol is complex.
                # For this test, we just send back a simple text string or JSON.
                # The proxy expects messages to be broadcasted.
                
                response = {"text": f"Gemini heard: {data}"}
                await websocket.send(json.dumps(response))
            except:
                # If not JSON, just echo string
                await websocket.send(f"Gemini Echo: {message}")
    except Exception as e:
        print(f"Mock Gemini Error: {e}")
    finally:
        print("Mock Gemini: Client disconnected")

async def main():
    async with websockets.serve(echo, "localhost", PORT):
        print(f"Mock Gemini Server running on ws://localhost:{PORT}")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
