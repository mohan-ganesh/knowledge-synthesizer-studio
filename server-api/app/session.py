
import asyncio
from .config import DEBUG

class Session:
    def __init__(self, session_id):
        self.session_id = session_id
        self.users = set()  # Set of client websockets
        self.user_ids = {}  # Map websockets to client_ids
        self.gemini_ws = None
        self.gemini_task = None
        self.cleanup_task = None
        # Init lock created on demand or here? 
        # Better here but need to ensure we run in async context if creating Lock immediately? 
        # asyncio.Lock() is bound to the loop. 
        # Safer to create on demand or ensures it's created in the loop.
        self.init_lock = None

    def get_init_lock(self):
        if self.init_lock is None:
            self.init_lock = asyncio.Lock()
        return self.init_lock

# Global registry
sessions = {}

async def broadcast_to_users(session: Session, message: str, exclude_user=None):
    """Broadcasts a message to all users in the session, optionally excluding one."""
    if not session.users:
        return
        
    recipients = [user for user in session.users if user != exclude_user]
    
    if not recipients:
        return

    if DEBUG:
        print(f"[Session: {session.session_id}] Broadcasting to {len(recipients)} users")
        
    coros = [user.send_text(message) for user in recipients]
    results = await asyncio.gather(*coros, return_exceptions=True)
    
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            if DEBUG:
                print(f"Error broadcasting to user: {result}")
