import React, { useState, useEffect, useRef } from 'react';
import { useHeaderConfig } from '../hooks/useHeaderConfig';
import './LiveAPIDemo.css';

const StudioHeader = ({
    connected,
    onDisconnect,
    isConfigOpen,
    toggleConfig,
    isMediaOpen,
    toggleMedia,
    activePage = 'knowledge-synthesizer'
}) => {
    // 1. Fetch Auth/Profile Data
    const { config } = useHeaderConfig(activePage);
    const { user } = config || {};

    // 2. Profile Dropdown State
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            const apiUrl = import.meta.env.VITE_HEADER_API_URL || 'https://mohan-ganesh.appspot.com';
            await fetch(`${apiUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            // Redirect to home page after logout
            window.location.href = apiUrl + '/';
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleSignIn = () => {
        const apiUrl = import.meta.env.VITE_HEADER_API_URL || 'https://mohan-ganesh.appspot.com';
        const redirectUri = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `${apiUrl}/sign-in?redirect_uri=${redirectUri}`;
    };

    return (
        <div className="toolbar studio-header">
            {/* LEFT: App Controls (Menu + Title) */}
            <div className="toolbar-left">
                <button
                    className={`icon-btn ${isConfigOpen ? 'active' : ''}`}
                    onClick={toggleConfig}
                    title="Toggle Configuration"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <span className="header-logo">
                    <a href="https://mohan-ganesh.appspot.com/ai/gemini-live-api-streaming">
                        <img src="https://mohan-ganesh.appspot.com/assets/images/garvik-logo.png" alt="Garvik Everyday Weave System Logo" loading="lazy" />
                    </a>
                </span>
                <h1>Knowledge Synthesizer Studio</h1>
            </div>

            {/* RIGHT: App Actions + Profile */}
            <div className="toolbar-right">

                {/* 1. App Actions */}
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

                <div className="toolbar-divider"></div>

                {/* 2. Auth / Profile Section */}
                {!user?.authenticated ? (
                    <button onClick={handleSignIn} className="primary-btn sign-in-btn">
                        Sign In
                    </button>
                ) : (
                    <div className="profile-dropdown-container" ref={dropdownRef}>
                        <img
                            src={user.avatarUrl}
                            alt="Profile"
                            className="toolbar-profile-icon"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        />

                        {dropdownOpen && (
                            <div className="dropdown-menu show" style={{ right: 0, top: '40px' }}>
                                <div className="dropdown-header">
                                    <img
                                        src={user.avatarUrl}
                                        alt="User"
                                        className="dropdown-profile-icon"
                                    />
                                    <div className="user-details">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </div>
                                <a
                                    href={(import.meta.env.VITE_HEADER_API_URL || 'https://mohan-ganesh.appspot.com') + '/profile'}
                                    className="dropdown-item"
                                >
                                    <span className="material-symbols-outlined">person</span>
                                    <span>My Profile</span>
                                </a>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item">
                                    <span className="material-symbols-outlined">logout</span>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioHeader;
