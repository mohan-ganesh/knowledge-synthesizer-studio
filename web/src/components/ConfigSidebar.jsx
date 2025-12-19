import React from 'react';
import './LiveAPIDemo.css';

const ConfigSidebar = ({
    connected,
    proxyUrl,
    setProxyUrl,
    roomId,
    currentRoomName,
    projectId,
    setProjectId,
    systemInstructions,
    setSystemInstructions,
    voice,
    setVoice,
    temperature,
    setTemperature,
    enableProactiveAudio,
    setEnableProactiveAudio,
    enableGrounding,
    setEnableGrounding,
    enableAffectiveDialog,
    setEnableAffectiveDialog,
    enableAlertTool,
    setEnableAlertTool,
    enableCssStyleTool,
    setEnableCssStyleTool,
    enableInputTranscription,
    setEnableInputTranscription,
    enableOutputTranscription,
    setEnableOutputTranscription,
    disableActivityDetection,
    setDisableActivityDetection,
    silenceDuration,
    setSilenceDuration,
    prefixPadding,
    setPrefixPadding,
    endSpeechSensitivity,
    setEndSpeechSensitivity,
    startSpeechSensitivity,
    setStartSpeechSensitivity,
    setupJson
}) => {
    return (
        <div className="config-sidebar">
            {/* API Configuration Section */}
            <div className="control-group">
                <h3>Connection Settings</h3>
                <div className="input-group">
                    <label>Virtual Room Name:</label>
                    <div className="status-value">{currentRoomName || "Not Connected"}</div>
                </div>

                <div className="input-group">
                    <label>Technical Room ID:</label>
                    <div className="status-value technical-id">{roomId || "None"}</div>
                </div>
            </div>

            <div className="control-group">
                <h3>Gemini Behavior</h3>
                <div className="input-group">
                    <label>System Instructions:</label>
                    <textarea
                        rows="3"
                        value={systemInstructions}
                        onChange={(e) => setSystemInstructions(e.target.value)}
                        disabled={connected}
                    />
                </div>
                <div className="input-group">
                    <label>Voice:</label>
                    <select
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        disabled={connected}
                    >
                        <option value="Puck">Puck (Default)</option>
                        <option value="Charon">Charon</option>
                        <option value="Kore">Kore</option>
                        <option value="Fenrir">Fenrir</option>
                        <option value="Aoede">Aoede</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>Temperature: {temperature}</label>
                    <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        disabled={connected}
                    />
                </div>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={enableProactiveAudio}
                        onChange={(e) => setEnableProactiveAudio(e.target.checked)}
                        disabled={connected}
                    />
                    <label>Enable proactive audio</label>
                </div>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={enableGrounding}
                        onChange={(e) => setEnableGrounding(e.target.checked)}
                        disabled={connected}
                    />
                    <label>Enable Google grounding</label>
                </div>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={enableAffectiveDialog}
                        onChange={(e) => setEnableAffectiveDialog(e.target.checked)}
                        disabled={connected}
                    />
                    <label>Enable affective dialog</label>
                </div>
            </div>

            <div className="control-group">
                <h3>Custom Tools</h3>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={enableAlertTool}
                        onChange={(e) => setEnableAlertTool(e.target.checked)}
                        disabled={connected || enableGrounding}
                    />
                    <label>Show Alert Box</label>
                </div>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={enableCssStyleTool}
                        onChange={(e) => setEnableCssStyleTool(e.target.checked)}
                        disabled={connected || enableGrounding}
                    />
                    <label>Add CSS Style</label>
                </div>
            </div>

            <div className="control-group">
                <h3>Transcription Settings</h3>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={enableInputTranscription}
                        onChange={(e) =>
                            setEnableInputTranscription(e.target.checked)
                        }
                        disabled={connected}
                    />
                    <label>Enable input transcription</label>
                </div>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={enableOutputTranscription}
                        onChange={(e) =>
                            setEnableOutputTranscription(e.target.checked)
                        }
                        disabled={connected}
                    />
                    <label>Enable output transcription</label>
                </div>
            </div>

            <div className="control-group">
                <h3>Activity Detection Settings</h3>
                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        checked={disableActivityDetection}
                        onChange={(e) =>
                            setDisableActivityDetection(e.target.checked)
                        }
                        disabled={connected}
                    />
                    <label>Disable automatic activity detection</label>
                </div>
                <div className="input-group">
                    <label>Silence duration (ms):</label>
                    <input
                        type="number"
                        value={silenceDuration}
                        onChange={(e) => setSilenceDuration(e.target.value)}
                        min="500"
                        max="10000"
                        step="100"
                        disabled={connected}
                    />
                </div>
                <div className="input-group">
                    <label>Prefix padding (ms):</label>
                    <input
                        type="number"
                        value={prefixPadding}
                        onChange={(e) => setPrefixPadding(e.target.value)}
                        min="0"
                        max="2000"
                        step="100"
                        disabled={connected}
                    />
                </div>
                <div className="input-group">
                    <label>End of speech sensitivity:</label>
                    <select
                        value={endSpeechSensitivity}
                        onChange={(e) => setEndSpeechSensitivity(e.target.value)}
                        disabled={connected}
                    >
                        <option value="END_SENSITIVITY_UNSPECIFIED">Default</option>
                        <option value="END_SENSITIVITY_HIGH">High</option>
                        <option value="END_SENSITIVITY_LOW">Low</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>Start of speech sensitivity:</label>
                    <select
                        value={startSpeechSensitivity}
                        onChange={(e) => setStartSpeechSensitivity(e.target.value)}
                        disabled={connected}
                    >
                        <option value="START_SENSITIVITY_UNSPECIFIED">
                            Default
                        </option>
                        <option value="START_SENSITIVITY_HIGH">High</option>
                        <option value="START_SENSITIVITY_LOW">Low</option>
                    </select>
                </div>
            </div>

            {setupJson && (
                <div className="control-group">
                    <h3>Setup Message JSON</h3>
                    <pre className="setup-json-display">
                        {JSON.stringify(setupJson, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ConfigSidebar;
