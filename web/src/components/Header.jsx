import React, { useState, useEffect, useRef } from 'react';
import { useHeaderConfig } from '../hooks/useHeaderConfig';
import './Header.css';

const Header = ({ activePage = 'knowledge-synthesizer' }) => {
    const { config, loading, error } = useHeaderConfig(activePage);
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

    if (loading) {
        return (
            <div className="header">
                <div className="header-left">
                    <span className="material-icons menu-icon">menu</span>
                    <span className="header-logo">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        console.error('Header error:', error);
        return (
            <div className="header">
                <div className="header-left">
                    <span className="material-icons menu-icon">menu</span>
                    <span className="header-logo">Garvik</span>
                </div>
            </div>
        );
    }

    const { branding, user, actions } = config || {};

    return (
        <div className="header">
            <div className="header-left">
                <span className="material-icons menu-icon">menu</span>
                <span className="header-logo">
                    <a href={branding?.homeUrl || '/'}>
                        <img
                            src={branding?.logoUrl || '/assets/images/garvik-logo.png'}
                            alt={branding?.appName || 'Garvik'}
                            loading="lazy"
                        />
                    </a>
                </span>
            </div>

            <div className="header-right">
                {!user?.authenticated && (
                    <button onClick={handleSignIn} className="submit-button">
                        Sign In
                    </button>
                )}

                {user?.authenticated && (
                    <div className="profile-dropdown" ref={dropdownRef}>
                        <img
                            src={user.avatarUrl}
                            alt="User Avatar"
                            className="header-profile-icon"
                            id="profile-icon"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        />

                        {dropdownOpen && (
                            <div className="dropdown-menu show" id="profile-dropdown-menu">
                                <div className="dropdown-header">
                                    <img
                                        src={user.avatarUrl}
                                        alt="User Avatar"
                                        className="dropdown-profile-icon"
                                    />
                                    <div className="user-details">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-email">{user.email}</span>
                                        {user.provider && (
                                            <span className="user-provider">{user.provider}</span>
                                        )}
                                    </div>
                                </div>
                                <a
                                    href={(import.meta.env.VITE_HEADER_API_URL || 'https://mohan-ganesh.appspot.com') + '/profile'}
                                    className="dropdown-item"
                                >
                                    <span className="material-icons">person</span>
                                    <span>My Profile</span>
                                </a>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item">
                                    <span className="material-icons">logout</span>
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

export default Header;
