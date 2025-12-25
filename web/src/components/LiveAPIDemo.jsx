import React, { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { GeminiLiveAPI, MultimodalLiveResponseType } from "../utils/gemini-api";
import {
  AudioStreamer,
  VideoStreamer,
  ScreenCapture,
  AudioPlayer,
} from "../utils/media-utils";
import { ShowAlertTool, AddCSSStyleTool } from "../utils/tools";
import StudioHeader from "./StudioHeader";
import ConfigSidebar from "./ConfigSidebar";
import ChatPanel from "./ChatPanel";
import MediaSidebar from "./MediaSidebar";
import "./LiveAPIDemo.css";

const LiveAPIDemo = () => {
  // Connection State
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Ready to connect...");
  const [setupJson, setSetupJson] = useState(null);

  // Configuration State
  const [proxyUrl, setProxyUrl] = useState(
    import.meta.env.VITE_PROXY_URL || "ws://localhost:8080"
  );
  const [projectId, setProjectId] = useState(
    import.meta.env.VITE_PROJECT_ID || ""
  );
  const model = "gemini-live-managed-by-backend";

  // Room Management State
  const [roomId, setRoomId] = useState(localStorage.getItem("roomId") || "default");
  const [currentRoomName, setCurrentRoomName] = useState(localStorage.getItem("currentRoomName") || "Default Session");
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [virtualRoomName, setVirtualRoomName] = useState("");

  useEffect(() => {
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("currentRoomName", currentRoomName);
  }, [roomId, currentRoomName]);

  const getHttpUrl = useCallback(() => {
    // Derive HTTP URL from WebSocket Proxy URL
    // ws://localhost:8080/ws -> http://localhost:8080 or https://...
    let url = proxyUrl.replace("wss://", "https://").replace("ws://", "http://");
    // Remove trailing /ws if present
    if (url.endsWith("/ws")) {
      url = url.slice(0, -3);
    }
    // Remove trailing slash
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    return url;
  }, [proxyUrl]);

  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const baseUrl = getHttpUrl();
      const res = await fetch(`${baseUrl}/rooms`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setRooms(data);
      setDebugInfo(`Fetched ${data.length} active rooms`);
    } catch (e) {
      console.error(e);
      setDebugInfo(`Error fetching rooms: ${e.message}`);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [getHttpUrl]);


  useEffect(() => {
    // Auto-correct URL if it's missing /ws (legacy config fix)


    localStorage.setItem("model", model);
  }, [model]);
  const [systemInstructions, setSystemInstructions] = useState(
    `Role:
Your name is Garvik, You are the Lead Moderator and Discussion Facilitator. Your purpose is to host a high-level panel discussion on a specific subject. You are intellectually curious, professionally neutral, and highly skilled at extracting deep insights from your panelists.
The Objective:
To guide the conversation by asking probing, "curious" questions that challenge the panelists to expand on their knowledge, defend their positions, and explore the nuances of the subject matter.
Operating Instructions:
Set the Stage: At the beginning of the session, briefly introduce the topic and acknowledge the expertise of the panel.
Curiosity-Driven Questioning: Your primary tool is the "Curious Question." Avoid simple "Yes/No" questions. Instead, use open-ended prompts like:
"What are the underlying assumptions behind...?"
"How would you reconcile [Point A] with the conflicting evidence of [Point B]?"
"If we look at this through the lens of [Specific Angle], how does the conclusion change?"
"What is a perspective on this topic that is often overlooked?"
Active Listening & Synthesis: Before moving to a new question, briefly synthesize or reflect on what the panelist just said to show you are following the logic (e.g., "It sounds like you’re suggesting that... which leads me to ask...").
Facilitation Flow:
Do not answer the questions yourself. You are the seeker of information, not the source.
If there are multiple panelists, direct specific questions to specific individuals or ask for a "rebuttal/addition" from another panelist.
Keep the tone professional, encouraging, and intellectually rigorous.
Course Correction: If the discussion veers too far off-topic, politely nudge the panelists back to the core subject with a transitionary question.
Communication Style:
Tone: Sophisticated, inquisitive, objective, and engaging.
Format: Start each response with a brief acknowledgement of the previous answer, followed by a new, deep-dive question.
Persona: Think of yourself as a mix between a high-end podcast host (like Lex Fridman or Terry Gross) and a Socratic philosopher.
Interaction Trigger:
Initially, provide a brief, professional greeting using speech (audio) to acknowledge the start of the session. Then, wait for the user to provide the Subject and the List of Panelists. Do NOT use tools for standard dialogue or greetings.`
  );
  const [voice, setVoice] = useState("Puck");
  const [temperature, setTemperature] = useState(1.0);
  const [enableProactiveAudio, setEnableProactiveAudio] = useState(true);
  const [enableGrounding, setEnableGrounding] = useState(false);
  const [enableAffectiveDialog, setEnableAffectiveDialog] = useState(true);
  const [enableAlertTool, setEnableAlertTool] = useState(true);
  const [enableCssStyleTool, setEnableCssStyleTool] = useState(true);
  const [enableInputTranscription, setEnableInputTranscription] =
    useState(true);
  const [enableOutputTranscription, setEnableOutputTranscription] =
    useState(true);

  // Activity Detection State
  const [disableActivityDetection, setDisableActivityDetection] =
    useState(false);
  const [silenceDuration, setSilenceDuration] = useState(500);
  const [prefixPadding, setPrefixPadding] = useState(500);
  const [endSpeechSensitivity, setEndSpeechSensitivity] = useState(
    "END_SENSITIVITY_UNSPECIFIED"
  );
  const [startSpeechSensitivity, setStartSpeechSensitivity] = useState(
    "START_SENSITIVITY_UNSPECIFIED"
  );

  // Media State
  const [audioStreaming, setAudioStreaming] = useState(false);
  const [videoStreaming, setVideoStreaming] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");


  // Refs
  const clientRef = useRef(null);
  const audioStreamerRef = useRef(null);
  const videoStreamerRef = useRef(null);
  const screenCaptureRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // UI State for Sidebars
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  // Handle window resize for sidebars
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // We don't automatically close them on resize to avoid annoying the user 
        // if they intentionally opened one, but we could if we wanted to be strict.
        // For now, let's just leave this here as a placeholder for potential future logic.
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleConfig = () => setIsConfigOpen(!isConfigOpen);
  const toggleMedia = () => setIsMediaOpen(!isMediaOpen);


  // Initialize Media Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputDevices(
          devices.filter((device) => device.kind === "audioinput")
        );
        setVideoInputDevices(
          devices.filter((device) => device.kind === "videoinput")
        );
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };
    getDevices();
  }, []);



  const addMessage = useCallback((text, type, mode = "add", isFinished = false) => {
    setChatMessages((prev) => {
      // Check if we can modify the last message
      if (
        mode !== "add" &&
        prev.length > 0 &&
        prev[prev.length - 1].type === type &&
        !prev[prev.length - 1].isFinished
      ) {
        const newMessages = [...prev];
        // Create a shallow copy of the message to avoid mutating state directly
        const target = { ...newMessages[newMessages.length - 1] };
        newMessages[newMessages.length - 1] = target;

        if (mode === "append") {
          target.text += text;
        } else if (mode === "replace") {
          // Only replace if text is provided and not just whitespace
          if (text && text.trim().length > 0) {
            target.text = text;
          }
        }

        if (isFinished) {
          target.isFinished = true;
        }
        return newMessages;
      }

      // Create new message
      // Don't create empty messages
      if ((!text || text.trim().length === 0) && !isFinished) return prev;

      return [...prev, { text: text || "", type, isFinished }];
    });
  }, []);

  const handleMessage = useCallback((message) => {
    // Diagnostic logging for raw protocol messages
    console.log(`[Protocol] Message Type: ${message.type}`, message.data);
    setDebugInfo(`Message: ${message.type}`);

    switch (message.type) {
      case MultimodalLiveResponseType.TEXT:
        addMessage(message.data, "assistant");
        break;
      case MultimodalLiveResponseType.AUDIO:
        if (audioPlayerRef.current) {
          audioPlayerRef.current.play(message.data);
        }
        break;
      case MultimodalLiveResponseType.INPUT_TRANSCRIPTION:
        addMessage(
          message.data.text,
          "user-transcript",
          "append",
          message.data.finished
        );
        break;
      case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
        addMessage(
          message.data.text,
          "assistant",
          "append",
          message.data.finished
        );
        break;
      case MultimodalLiveResponseType.SETUP_COMPLETE:
        addMessage("Ready!", "system");
        if (clientRef.current && clientRef.current.lastSetupMessage) {
          setSetupJson(clientRef.current.lastSetupMessage);
        }
        break;
      case MultimodalLiveResponseType.TOOL_CALL: {
        const functionCalls = message.data.functionCalls;
        functionCalls.forEach((functionCall) => {
          const { name, args } = functionCall;
          console.log(
            `Calling function ${name} with parameters: ${JSON.stringify(args)}`
          );
          clientRef.current.callFunction(name, args);
        });
        break;
      }
      case MultimodalLiveResponseType.TURN_COMPLETE:
        setDebugInfo("Turn complete");
        break;
      case MultimodalLiveResponseType.INTERRUPTED:
        addMessage("[Interrupted]", "system");
        if (audioPlayerRef.current) {
          audioPlayerRef.current.interrupt();
        }
        break;
      case MultimodalLiveResponseType.ERROR:
        addMessage(`[Protocol Error: ${message.data}]`, "system");
        toast.error(`Gemini Protocol Error: ${message.data}`);
        break;
      default:
        break;
    }
  }, [addMessage]);

  const closeRoom = useCallback(async (idToClose) => {
    try {
      const baseUrl = getHttpUrl();
      const res = await fetch(`${baseUrl}/room/${idToClose}/close`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to close room");
      setDebugInfo(`Room ${idToClose} closed successfully`);
    } catch (e) {
      console.error(e);
      setDebugInfo(`Error closing room: ${e.message}`);
    }
  }, [getHttpUrl]);

  const disconnect = useCallback(async (isIntentional = false) => {
    const idToClose = roomId;

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }
    if (videoStreamerRef.current) {
      videoStreamerRef.current.stop();
      videoStreamerRef.current = null;
    }
    if (screenCaptureRef.current) {
      screenCaptureRef.current.stop();
      screenCaptureRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.destroy();
      audioPlayerRef.current = null;
    }

    setConnected(false);
    setAudioStreaming(false);
    setVideoStreaming(false);
    setScreenSharing(false);

    // Only close on server if it's an intentional exit
    if (isIntentional && idToClose && idToClose !== "default") {
      await closeRoom(idToClose);
    }

    // Clear session-specific state and localStorage
    setRoomId("");
    setCurrentRoomName("");
    localStorage.removeItem("roomId");
    localStorage.removeItem("currentRoomName");

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.hidden = true;
    }

    // Refresh rooms list to reflect closure in lobby
    fetchRooms();
  }, [roomId, closeRoom, fetchRooms]);

  // Initial fetch
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Store the latest disconnect in a ref for the unmount cleanup
  const disconnectRef = useRef(disconnect);
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (disconnectRef.current) {
        disconnectRef.current(false); // Unintentional disconnect on unmount
      }
    };
  }, []);

  const connect = useCallback(async (overrideRoomId = null, options = {}) => {
    if (!proxyUrl && !projectId) {
      toast.error("Please provide both a Proxy URL and Project ID");
      return;
    }

    try {
      // Use overrideRoomId if provided, otherwise fall back to state
      const targetRoomId = overrideRoomId || roomId;
      clientRef.current = new GeminiLiveAPI(proxyUrl, projectId, model, targetRoomId);

      clientRef.current.systemInstructions = systemInstructions;
      clientRef.current.inputAudioTranscription = enableInputTranscription;
      clientRef.current.outputAudioTranscription = enableOutputTranscription;
      clientRef.current.googleGrounding = enableGrounding;
      clientRef.current.enableAffectiveDialog = enableAffectiveDialog;
      clientRef.current.responseModalities = ["AUDIO"];
      clientRef.current.voiceName = voice;
      clientRef.current.temperature = parseFloat(temperature);
      clientRef.current.proactivity = {
        proactiveAudio: enableProactiveAudio,
      };
      clientRef.current.automaticActivityDetection = {
        disabled: disableActivityDetection,
        silence_duration_ms: parseInt(silenceDuration),
        prefix_padding_ms: parseInt(prefixPadding),
        end_of_speech_sensitivity: endSpeechSensitivity,
        start_of_speech_sensitivity: startSpeechSensitivity,
      };

      if (!enableGrounding) {
        if (enableAlertTool) {
          clientRef.current.addFunction(new ShowAlertTool());
        }
        if (enableCssStyleTool) {
          clientRef.current.addFunction(new AddCSSStyleTool());
        }
      }

      clientRef.current.onReceiveResponse = handleMessage;
      clientRef.current.onErrorMessage = (error) => {
        console.error("Error:", error);
        setDebugInfo("Error: " + error);
        toast.error(`Connection Error: ${error}`);
      };
      clientRef.current.onConnectionStarted = () => {
        setConnected(true);
        setReconnecting(false);
      };
      clientRef.current.onClose = () => {
        setConnected(false);
        // If it was an intentional disconnect, we can clean up everything
        // Otherwise, the client will attempt to reconnect on its own
        if (clientRef.current && clientRef.current.intentionalDisconnect) {
          disconnect(true);
        }
      };
      clientRef.current.onReconnecting = (attempt, delay) => {
        setReconnecting(true);
        setDebugInfo(`Reconnecting (Attempt ${attempt})...`);
        toast.loading(`Connection lost. Retrying in ${delay / 1000}s...`, {
          id: "reconnect-toast",
          duration: 2000,
        });
      };

      await clientRef.current.connect();

      audioStreamerRef.current = new AudioStreamer(clientRef.current);
      videoStreamerRef.current = new VideoStreamer(clientRef.current);
      screenCaptureRef.current = new ScreenCapture(clientRef.current);
      audioPlayerRef.current = new AudioPlayer();
      await audioPlayerRef.current.init();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.setVolume(volume / 100);
      }

      setDebugInfo("Connected successfully");

      // Auto-start media based on preferences
      // Note: We don't need a delay if the streamers are newly created above
      if (options.useMic) {
        toggleAudio();
      }
      if (options.useCam) {
        toggleVideo();
      }
    } catch (error) {
      console.error("Connection failed:", error);
      setDebugInfo("Error: " + error.message);
    }
  }, [
    proxyUrl,
    projectId,
    model,
    roomId,
    systemInstructions,
    enableInputTranscription,
    enableOutputTranscription,
    enableGrounding,
    enableAffectiveDialog,
    voice,
    temperature,
    enableProactiveAudio,
    disableActivityDetection,
    silenceDuration,
    prefixPadding,
    endSpeechSensitivity,
    startSpeechSensitivity,
    volume,
    handleMessage,
    disconnect,
  ]);

  const toggleAudio = useCallback(async () => {
    if (!audioStreaming) {
      try {
        if (!audioStreamerRef.current && clientRef.current) {
          audioStreamerRef.current = new AudioStreamer(clientRef.current);
        }

        if (audioStreamerRef.current) {
          await audioStreamerRef.current.start(selectedMic);
          setAudioStreaming(true);
          addMessage("[Microphone on]", "system");
        } else {
          addMessage("[Connect to Gemini first]", "system");
        }
      } catch (error) {
        addMessage("[Audio error: " + error.message + "]", "system");
      }
    } else {
      if (audioStreamerRef.current) audioStreamerRef.current.stop();
      setAudioStreaming(false);
      addMessage("[Microphone off]", "system");
    }
  }, [audioStreaming, selectedMic, addMessage]);

  const toggleVideo = useCallback(async () => {
    if (!videoStreaming) {
      try {
        if (!videoStreamerRef.current && clientRef.current) {
          videoStreamerRef.current = new VideoStreamer(clientRef.current);
        }

        if (videoStreamerRef.current) {
          const video = await videoStreamerRef.current.start({
            deviceId: selectedCamera,
          });
          setVideoStreaming(true);

          // Wait for React to render the video element
          setTimeout(() => {
            if (videoPreviewRef.current) {
              videoPreviewRef.current.srcObject = video.srcObject;
            }
          }, 100);

          addMessage("[Camera on]", "system");
        } else {
          addMessage("[Connect to Gemini first]", "system");
        }
      } catch (error) {
        addMessage("[Video error: " + error.message + "]", "system");
      }
    } else {
      if (videoStreamerRef.current) videoStreamerRef.current.stop();
      setVideoStreaming(false);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      addMessage("[Camera off]", "system");
    }
  }, [videoStreaming, selectedCamera, addMessage]);

  const createRoom = useCallback(async (options = {}) => {
    if (!virtualRoomName.trim()) {
      setDebugInfo("Error: Room name is mandatory.");
      return;
    }
    try {
      const baseUrl = getHttpUrl();
      console.log("🛠️ Creating room with name:", virtualRoomName);
      const res = await fetch(`${baseUrl}/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: virtualRoomName })
      });
      if (!res.ok) throw new Error("Failed to create room");
      const data = await res.json();
      console.log("✅ Room response:", data);

      setDebugInfo(`Created virtual room: ${data.name}`);
      setVirtualRoomName(""); // Clear name input after success
      setCurrentRoomName(data.name); // Set the current session name

      // Auto-select the new room and connect immediately
      setRoomId(data.room_id);

      // Pass the new room_id directly to connect to avoid race condition with state
      await connect(data.room_id, options);

      // Refresh list in background for others
      fetchRooms();
    } catch (e) {
      console.error(e);
      setDebugInfo(`Error creating room: ${e.message}`);
    }
  }, [fetchRooms, getHttpUrl, virtualRoomName, connect, toggleAudio, toggleVideo]);

  const toggleScreen = async () => {
    if (!screenSharing) {
      try {
        if (!screenCaptureRef.current && clientRef.current) {
          screenCaptureRef.current = new ScreenCapture(clientRef.current);
        }

        if (screenCaptureRef.current) {
          const video = await screenCaptureRef.current.start();
          setScreenSharing(true);

          // Wait for React to render the video element
          setTimeout(() => {
            if (videoPreviewRef.current) {
              videoPreviewRef.current.srcObject = video.srcObject;
            }
          }, 100);

          addMessage("[Screen sharing on]", "system");
        } else {
          addMessage("[Connect to Gemini first]", "system");
        }
      } catch (error) {
        addMessage("[Screen share error: " + error.message + "]", "system");
      }
    } else {
      if (screenCaptureRef.current) screenCaptureRef.current.stop();
      setScreenSharing(false);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      addMessage("[Screen sharing off]", "system");
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    if (clientRef.current) {
      addMessage(chatInput, "user");
      clientRef.current.sendTextMessage(chatInput);
      setChatInput("");
    } else {
      addMessage("[Connect to Gemini first]", "system");
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setVolume(newVolume / 100);
    }
  };

  return (
    <div className={`live-api-demo ${isConfigOpen ? 'config-open' : ''} ${isMediaOpen ? 'media-open' : ''}`}>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Unified Studio Header */}
      <StudioHeader
        connected={connected}
        onDisconnect={() => disconnect(true)}
        isConfigOpen={isConfigOpen}
        toggleConfig={toggleConfig}
        isMediaOpen={isMediaOpen}
        toggleMedia={toggleMedia}
        activePage="knowledge-synthesizer"
      />

      <div className="main-container">
        <div className={`sidebar-container left ${isConfigOpen ? 'open' : 'closed'}`}>
          <ConfigSidebar
            connected={connected}
            proxyUrl={proxyUrl}
            setProxyUrl={setProxyUrl}
            roomId={roomId}
            currentRoomName={currentRoomName}
            projectId={projectId}
            setProjectId={setProjectId}
            rooms={rooms}
            setRoomId={setRoomId}
            setCurrentRoomName={setCurrentRoomName}
            fetchRooms={fetchRooms}
            createRoom={createRoom}
            systemInstructions={systemInstructions}
            setSystemInstructions={setSystemInstructions}
            voice={voice}
            setVoice={setVoice}
            temperature={temperature}
            setTemperature={setTemperature}
            enableProactiveAudio={enableProactiveAudio}
            setEnableProactiveAudio={setEnableProactiveAudio}
            enableGrounding={enableGrounding}
            setEnableGrounding={setEnableGrounding}
            enableAffectiveDialog={enableAffectiveDialog}
            setEnableAffectiveDialog={setEnableAffectiveDialog}
            enableAlertTool={enableAlertTool}
            setEnableAlertTool={setEnableAlertTool}
            enableCssStyleTool={enableCssStyleTool}
            setEnableCssStyleTool={setEnableCssStyleTool}
            enableInputTranscription={enableInputTranscription}
            setEnableInputTranscription={setEnableInputTranscription}
            enableOutputTranscription={enableOutputTranscription}
            setEnableOutputTranscription={setEnableOutputTranscription}
            disableActivityDetection={disableActivityDetection}
            setDisableActivityDetection={setDisableActivityDetection}
            silenceDuration={silenceDuration}
            setSilenceDuration={setSilenceDuration}
            prefixPadding={prefixPadding}
            setPrefixPadding={setPrefixPadding}
            endSpeechSensitivity={endSpeechSensitivity}
            setEndSpeechSensitivity={setEndSpeechSensitivity}
            startSpeechSensitivity={startSpeechSensitivity}
            setStartSpeechSensitivity={setStartSpeechSensitivity}
            setupJson={setupJson}
          />
        </div>

        <ChatPanel
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          connected={connected}
          rooms={rooms}
          isLoadingRooms={isLoadingRooms}
          fetchRooms={fetchRooms}
          createRoom={createRoom}
          setRoomId={setRoomId}
          roomId={roomId}
          currentRoomName={currentRoomName}
          setCurrentRoomName={setCurrentRoomName}
          virtualRoomName={virtualRoomName}
          setVirtualRoomName={setVirtualRoomName}
          onConnect={connect}
          debugInfo={debugInfo}
          audioStreaming={audioStreaming}
          toggleAudio={toggleAudio}
          videoStreaming={videoStreaming}
          toggleVideo={toggleVideo}
          screenSharing={screenSharing}
          toggleScreen={toggleScreen}
          videoPreviewRef={videoPreviewRef}
        />

        <div className={`sidebar-container right ${isMediaOpen ? 'open' : 'closed'}`}>
          <MediaSidebar
            audioStreaming={audioStreaming}
            toggleAudio={toggleAudio}
            videoStreaming={videoStreaming}
            toggleVideo={toggleVideo}
            screenSharing={screenSharing}
            toggleScreen={toggleScreen}
            audioInputDevices={audioInputDevices}
            selectedMic={selectedMic}
            setSelectedMic={setSelectedMic}
            videoInputDevices={videoInputDevices}
            selectedCamera={selectedCamera}
            setSelectedCamera={setSelectedCamera}
            videoPreviewRef={videoPreviewRef}
          />
        </div>
      </div>

    </div>
  );
};

export default LiveAPIDemo;
