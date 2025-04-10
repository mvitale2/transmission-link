import React, { useEffect, useRef, useState } from "react";
import { Container, Typography, Button, Stack, Paper } from "@mui/material";
import io from "socket.io-client";

// Signaling server URL
const SIGNALING_SERVER_URL = "localhost:5000"; //could make this your personal ip but currently dont know how to get all functionality working there without the use of ngrok. 

// ICE server config (STUN only; add TURN servers for production)
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function Room({ roomId, onLeave }) {
  // Socket reference and call state
  const [socketInstance, setSocketInstance] = useState(null);
  const [callEstablished, setCallEstablished] = useState(false);

  // Mute state
  const [isMuted, setIsMuted] = useState(false);

  // Refs for media & RTC
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  // -------------------------- useEffect: WebRTC + Socket Setup --------------------------
  useEffect(() => {
    console.log("Initializing socket connection to:", SIGNALING_SERVER_URL);
    const newSocket = io(SIGNALING_SERVER_URL, {
      transports: ["websocket", "polling"],
    });

    // Debug socket events
    newSocket.on("connect", () => {
      console.log("Socket connected, ID:", newSocket.id);
    });
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected.");
    });

    setSocketInstance(newSocket);

    // Join the specified room
    console.log("Joining room:", roomId);
    newSocket.emit("join-room", roomId);

    // Create the RTCPeerConnection
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    console.log("RTCPeerConnection created.");

    // Capture ICE candidates from local peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Local ICE candidate generated:", event.candidate);
        newSocket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    // Handle remote tracks (incoming audio from other peer)
    pc.ontrack = (event) => {
      console.log("Remote track received:", event.streams[0]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    // Acquire local audio stream
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        console.log("Local media stream acquired.");
        localStreamRef.current = stream;

        // Attach local audio to a hidden player (for debugging; muted by default)
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        // Add each local track to the RTCPeerConnection
        stream.getTracks().forEach((track) => {
          console.log("Adding local track to RTCPeerConnection:", track);
          pc.addTrack(track, stream);
        });
      })
      .catch((error) => {
        console.error("Error accessing local media devices:", error);
      });

    // Listen for inbound offer (another peer starts the call)
    newSocket.on("offer", async ({ offer }) => {
      console.log("Received offer:", offer);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Sending answer:", answer);
        newSocket.emit("answer", { roomId, answer });
      } catch (err) {
        console.error("Error processing offer:", err);
      }
    });

    // Listen for inbound answer (peer responds to our offer)
    newSocket.on("answer", async ({ answer }) => {
      console.log("Received answer:", answer);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setCallEstablished(true);
        console.log("Call established successfully.");
      } catch (err) {
        console.error("Error processing answer:", err);
      }
    });

    // Listen for inbound ICE candidates from peer
    newSocket.on("ice-candidate", async ({ candidate }) => {
      console.log("Received ICE candidate:", candidate);
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding received ICE candidate:", err);
      }
    });

    // Auto-create an offer if someone else joins
    newSocket.on("user-joined", async () => {
      console.log("A new user joined the room. Creating an offer.");
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        newSocket.emit("offer", { roomId, offer });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up: closing connection and socket.");
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [roomId]);
  // --------------------------------------------------------------------------------------

  // Explicitly create & send an offer on "Start Call" press
  const handleStartCall = async () => {
    console.log("Start Call button pressed.");
    if (pcRef.current && socketInstance) {
      try {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        console.log("Offer created and sent:", offer);
        socketInstance.emit("offer", { roomId, offer });
      } catch (err) {
        console.error("Error creating or sending offer:", err);
      }
    } else {
      console.error("RTCPeerConnection or socket not ready.");
    }
  };

  // Toggle local audio track (mute/unmute)
  const handleToggleMute = () => {
    console.log("Toggle mute button pressed.");
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log("Audio track enabled:", audioTrack.enabled);
        setIsMuted(!audioTrack.enabled);
      } else {
        console.warn("No audio track available.");
      }
    } else {
      console.warn("Local stream not available.");
    }
  };

  // Leave the room
  const handleLeaveRoom = () => {
    console.log("Leaving room:", roomId);
    onLeave();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 4,
          backdropFilter: "blur(8px)",
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Transmission Link
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Secure Peer-to-Peer Voice Chat
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Room ID: {roomId}
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mb: 3 }}
        >
          <Button variant="contained" color="primary" onClick={handleStartCall}>
            Start Call
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLeaveRoom}
          >
            Leave Room
          </Button>
          <Button variant="contained" onClick={handleToggleMute}>
            {isMuted ? "Unmute" : "Mute"}
          </Button>
        </Stack>

        {/* Audio elements + call status */}
        <Stack spacing={2} alignItems="center">
          {/* Hidden local audio (for debug; muted by default) */}
          <audio
            ref={localAudioRef}
            autoPlay
            muted
            style={{ display: "none" }}
          />
          {/* Remote audio */}
          <audio ref={remoteAudioRef} autoPlay style={{ display: "block" }} />
          <Typography align="center" sx={{ mt: 2 }}>
            {callEstablished ? "Call established" : "Connecting..."}
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

export default Room;
