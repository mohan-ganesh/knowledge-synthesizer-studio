import React, { useEffect, useRef } from 'react';
import './LiveAPIDemo.css';

const ChatPanel = ({
    chatMessages,
    chatInput,
    setChatInput,
    sendMessage,
    connected,
    rooms,
    isLoadingRooms,
    fetchRooms,
    createRoom,
    setRoomId,
    roomId,
    currentRoomName,
    setCurrentRoomName,
    virtualRoomName,
    setVirtualRoomName,
    onConnect,
    debugInfo
}) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
    const [roomToJoin, setRoomToJoin] = React.useState(null);
    const [useMic, setUseMic] = React.useState(true);
    const [useCam, setUseCam] = React.useState(false);
    const chatContainerRef = useRef(null);

    const roomNameInputRef = useRef(null);

    const handleLaunch = () => {
        createRoom({ useMic, useCam });
        setIsModalOpen(false);
    };

    const handleJoin = () => {
        if (roomToJoin) {
            setRoomId(roomToJoin.room_id);
            setCurrentRoomName(roomToJoin.name || `Session-${roomToJoin.room_id.substring(0, 8)}`);
            onConnect(roomToJoin.room_id, { useMic, useCam });
            setIsJoinModalOpen(false);
        }
    };

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isModalOpen && roomNameInputRef.current) {
            setTimeout(() => {
                roomNameInputRef.current.focus();
            }, 100);
        }
    }, [isModalOpen]);

    // Scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current && connected) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages, connected]);


    if (!connected) {
        return (
            <div className="chat-panel lobby">
                <div className="lobby-container">
                    <div className="lobby-header">
                        <h2>Welcome to Knowledge Synthesiser Studio</h2>
                        <p>Join an active room or start a new collaborative session.</p>
                    </div>

                    <div className="lobby-sections">
                        <div className="lobby-column rooms-column">
                            <h3>Active Rooms</h3>
                            <div className="rooms-content">
                                {isLoadingRooms ? (
                                    <div className="rooms-loading-state">
                                        <div className="loading-spinner-small"></div>
                                        <p>Checking for active rooms...</p>
                                    </div>
                                ) : rooms.length === 0 ? (
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
                                                        setRoomToJoin(room);
                                                        setIsJoinModalOpen(true);
                                                    }}
                                                >
                                                    Join
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lobby-column create-column">
                            <h3>Ready to start?</h3>
                            <div className="create-card">
                                <p className="create-hint">Start a new collaborative session with your own virtual room.</p>
                                <button className="primary-btn launch-modal-btn" onClick={() => setIsModalOpen(true)}>
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Create New Room
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`}>
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Launch New Session</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label>Virtual Room Name <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    ref={roomNameInputRef}
                                    value={virtualRoomName}
                                    onChange={(e) => setVirtualRoomName(e.target.value)}
                                    placeholder="e.g. Project Alpha Sync"
                                />
                            </div>
                            <div className="media-toggles">
                                <div className={`toggle-group ${useMic ? 'active' : ''}`} onClick={() => setUseMic(!useMic)}>
                                    <div className="toggle-info">
                                        <span className="material-symbols-outlined">{useMic ? 'mic' : 'mic_off'}</span>
                                        <span>Microphone</span>
                                    </div>
                                    <div className={`toggle-switch ${useMic ? 'on' : 'off'}`}></div>
                                </div>
                                <div className={`toggle-group ${useCam ? 'active' : ''}`} onClick={() => setUseCam(!useCam)}>
                                    <div className="toggle-info">
                                        <span className="material-symbols-outlined">{useCam ? 'videocam' : 'videocam_off'}</span>
                                        <span>Camera</span>
                                    </div>
                                    <div className={`toggle-switch ${useCam ? 'on' : 'off'}`}></div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button
                                className={`primary-btn ${!virtualRoomName.trim() ? 'disabled' : ''}`}
                                onClick={handleLaunch}
                                disabled={!virtualRoomName.trim()}
                            >
                                Launch Session
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`modal-overlay ${isJoinModalOpen ? 'open' : ''}`}>
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Join Session</h3>
                            <button className="close-btn" onClick={() => setIsJoinModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="room-preview-info">
                                <p>You are about to join:</p>
                                <h4>{roomToJoin?.name || roomToJoin?.room_id.substring(0, 8)}</h4>
                                <span className="room-id-hint">ID: {roomToJoin?.room_id.substring(0, 8)}</span>
                            </div>

                            <div className="media-toggles">
                                <div className={`toggle-group ${useMic ? 'active' : ''}`} onClick={() => setUseMic(!useMic)}>
                                    <div className="toggle-info">
                                        <span className="material-symbols-outlined">{useMic ? 'mic' : 'mic_off'}</span>
                                        <span>Microphone</span>
                                    </div>
                                    <div className={`toggle-switch ${useMic ? 'on' : 'off'}`}></div>
                                </div>
                                <div className={`toggle-group ${useCam ? 'active' : ''}`} onClick={() => setUseCam(!useCam)}>
                                    <div className="toggle-info">
                                        <span className="material-symbols-outlined">{useCam ? 'videocam' : 'videocam_off'}</span>
                                        <span>Camera</span>
                                    </div>
                                    <div className={`toggle-switch ${useCam ? 'on' : 'off'}`}></div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={() => setIsJoinModalOpen(false)}>Cancel</button>
                            <button
                                className="primary-btn"
                                onClick={handleJoin}
                            >
                                Confirm Join
                            </button>
                        </div>
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
            {debugInfo && (
                <div className="debug-info-container">
                    <pre className="debug-json">{debugInfo}</pre>
                </div>
            )}
        </div>
    );
};

export default ChatPanel;
