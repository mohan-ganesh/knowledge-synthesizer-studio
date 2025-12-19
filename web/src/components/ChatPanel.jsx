import React, { useEffect, useRef } from 'react';
import './LiveAPIDemo.css';

const ChatPanel = ({
    chatMessages,
    chatInput,
    setChatInput,
    sendMessage,
    connected,
    rooms,
    fetchRooms,
    createRoom,
    setRoomId,
    roomId,
    currentRoomName,
    setCurrentRoomName,
    virtualRoomName,
    setVirtualRoomName,
    onConnect
}) => {
    const chatContainerRef = useRef(null);

    // Scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current && connected) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages, connected]);

    // Fetch rooms on mount if not connected
    // Added a small delay to handle race condition with background room closure
    useEffect(() => {
        if (!connected) {
            const timer = setTimeout(() => {
                fetchRooms();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [connected, fetchRooms]);

    if (!connected) {
        return (
            <div className="chat-panel lobby">
                <div className="lobby-container">
                    <div className="lobby-header">
                        <h2>Welcome to  Knowledge Synthesiser Studio</h2>
                        <p>Join an active room or start a new collaborative session.</p>
                    </div>

                    <div className="lobby-sections">
                        <section className="rooms-section">
                            <h3>Active Rooms</h3>
                            {rooms.length === 0 ? (
                                <div className="no-rooms">
                                    <p>No active rooms found.</p>
                                    <button onClick={fetchRooms} className="refresh-btn">
                                        <span className="material-symbols-outlined">refresh</span>
                                        Refresh
                                    </button>
                                </div>
                            ) : (
                                <div className="room-grid">
                                    {rooms.map(room => (
                                        <div key={room.room_id} className={`room-card ${roomId === room.room_id ? 'selected' : ''}`} onClick={() => setRoomId(room.room_id)}>
                                            <div className="room-card-info">
                                                <span className="room-id">{room.name || room.room_id.substring(0, 8)}</span>
                                                <span className="room-date">ID: {room.room_id.substring(0, 8)} • {new Date(room.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <button
                                                className="join-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRoomId(room.room_id);
                                                    setCurrentRoomName(room.name || `Session-${room.room_id.substring(0, 8)}`);
                                                    onConnect(room.room_id);
                                                }}
                                            >
                                                Join
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="create-section">
                            <h3>Start New Session</h3>
                            <div className="create-card">
                                <div className="input-group">
                                    <label>Define Virtual Room Name <span className="required-star">*</span>:</label>
                                    <input
                                        type="text"
                                        value={virtualRoomName}
                                        onChange={(e) => setVirtualRoomName(e.target.value)}
                                        placeholder="e.g. Marketing Sync, Design Review..."
                                        required
                                    />
                                    <p className="input-hint">Create a new named room and enter immediately.</p>
                                </div>
                                <div className="create-actions">
                                    <button
                                        onClick={createRoom}
                                        className={`primary-btn ${!virtualRoomName.trim() ? 'disabled' : 'active'}`}
                                        disabled={!virtualRoomName.trim()}
                                    >
                                        Launch My Room
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-panel">
            <div className="chat-container" ref={chatContainerRef}>
                {chatMessages.length === 0 && (
                    <div className="empty-chat">Waiting for Gemini...</div>
                )}
                {chatMessages.map((msg, index) => (
                    <div key={index} className={`message ${msg.type}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="chat-input-area">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatPanel;
