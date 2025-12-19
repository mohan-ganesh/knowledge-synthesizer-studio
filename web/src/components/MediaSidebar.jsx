import React from 'react';
import './LiveAPIDemo.css';

const MediaSidebar = ({
    audioStreaming,
    toggleAudio,
    videoStreaming,
    toggleVideo,
    screenSharing,
    toggleScreen,
    audioInputDevices,
    selectedMic,
    setSelectedMic,
    videoInputDevices,
    selectedCamera,
    setSelectedCamera,
    videoPreviewRef
}) => {
    return (
        <div className="media-sidebar">
            {/* Media Streaming Section */}
            <div className="control-group">
                <h3>Media Controls</h3>
                <div className="input-group">
                    <label>Microphone:</label>
                    <select
                        value={selectedMic}
                        onChange={(e) => setSelectedMic(e.target.value)}
                    >
                        <option value="">Default Microphone</option>
                        {audioInputDevices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Microphone ${device.deviceId}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="input-group">
                    <label>Camera:</label>
                    <select
                        value={selectedCamera}
                        onChange={(e) => setSelectedCamera(e.target.value)}
                    >
                        <option value="">Default Camera</option>
                        {videoInputDevices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${device.deviceId}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="button-group-vertical">
                    <button
                        onClick={toggleAudio}
                        className={audioStreaming ? "active" : ""}
                    >
                        {audioStreaming ? "Stop Mic" : "Start Mic"}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={videoStreaming ? "active" : ""}
                    >
                        {videoStreaming ? "Stop Camera" : "Start Camera"}
                    </button>
                    <button
                        onClick={toggleScreen}
                        className={screenSharing ? "active" : ""}
                    >
                        {screenSharing ? "Stop Screen Share" : "Share Screen"}
                    </button>
                </div>
                <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="video-preview"
                    hidden
                />
            </div>
        </div>
    );
};

export default MediaSidebar;
