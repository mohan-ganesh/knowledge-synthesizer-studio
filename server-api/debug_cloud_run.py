
import asyncio
import websockets
import sys
import ssl
from urllib.parse import urlparse

async def debug_connection(url):
    print(f"Testing connection to: {url}")
    print("-" * 50)
    
    # Bypass SSL verification for debugging
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        # Try a simple connection WITHOUT Origin header
        async with websockets.connect(
            url, 
            ssl=ssl_context
            # origin="http://localhost:5173"  # Removed Origin
        ) as ws:
            print("✅ WebSocket connection successful!")
            greeting = await ws.recv() # Wait for something? Or just close
            print(f"Received: {greeting}")
            await ws.close()
            return
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ Connection Rejected with Status Code: {e.status_code}")
        print("Response Headers:")
        for k, v in e.headers.items():
            print(f"  {k}: {v}")
            
        if e.status_code == 403:
            print("\nDiagnosis: 403 Forbidden.")
            print("This usually means the Cloud Run service is not public, or 'Allow unauthenticated invocations' was not selected.")
        elif e.status_code == 404:
            print("\nDiagnosis: 404 Not Found.")
            print("Verify the URL and that the server is listening on the correct path (root).")
        elif e.status_code == 502 or e.status_code == 503:
            print("\nDiagnosis: 502/503 Service Unavailable.")
            print("This implies Cloud Run could not reach your container. Check Cloud Run logs for startup crashes.")
            
    except Exception as e:
        print(f"❌ Connection Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    url = "wss://knowledge-base-api-964252795915.us-central1.run.app"
    if len(sys.argv) > 1:
        url = sys.argv[1]
        
    try:
        asyncio.run(debug_connection(url))
    except KeyboardInterrupt:
        pass
