import React from 'react';
import './LiveAPIDemo.css';

const AppToolbar = ({
    connected,
    onDisconnect,
    isConfigOpen,
    toggleConfig,
    isMediaOpen,
    toggleMedia
}) => {
    return (
        <div className="app-toolbar">
            <div className="toolbar-left">
                <button
                    className={`icon-btn ${isConfigOpen ? 'active' : ''}`}
                    onClick={toggleConfig}
                    title="Toggle Configuration"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1>Knowledge Synthesizer Studio</h1>
            </div>
            <div className="toolbar-right">
                {connected && (
                    <button
                        className="icon-btn disconnect"
                        onClick={onDisconnect}
                        title="Leave Room"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                )}
                <button
                    className={`icon-btn ${isMediaOpen ? 'active' : ''}`}
                    onClick={toggleMedia}
                    title="Toggle Media Sidebar"
                >
                    <span className="material-symbols-outlined">info</span>
                </button>
            </div>
        </div>
    );
};

export default AppToolbar;
