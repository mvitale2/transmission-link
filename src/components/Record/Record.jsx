import React, { useState, useRef } from "react";
import {
  Button,
  IconButton,
  Stack,
  Typography,
  TextField,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import CopyIcon from "@mui/icons-material/ContentCopy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";

// Import the Supabase client from the centralized file (adjust path/casing as needed)
import { supabase } from "../../SupabaseClient.jsx";

// ------------------- SHARE LINK COMPONENT -------------------
function ShareLink({ id }) {
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.replace(/\?.*/, ""); // Remove any query parameters
  const shareLink = `${baseUrl}?voiceId=${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      // console.log("Link copied to clipboard:", shareLink);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  return (
    <Stack direction="row" spacing={2} justifyContent="center">
      <Typography>{shareLink}</Typography>
      <Button startIcon={<CopyIcon />} onClick={handleCopy} />
    </Stack>
  );
}

// ------------------- PASSWORD FIELD COMPONENT -------------------
function PasswordField({ onPasswordChange, visible }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleClick = () => {
    setShowPassword(!showPassword);
    // console.log("Show password toggled:", !showPassword);
  };

  const handleChange = (e) => {
    const newPassword = e.target.value;
    onPasswordChange(newPassword); // Notify parent component of the password change
    // console.log("Password field changed, new value:", newPassword);
  };

  return (
    <div style={{ display: visible ? "block" : "none" }}>
      <Typography>Enter a password to send your message:</Typography>
      <TextField
        type={showPassword ? "text" : "password"}
        label="Password"
        onChange={handleChange}
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleClick} edge="end">
                {showPassword ? <VisibilityOffIcon /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
}

// ------------------- RECORD COMPONENT -------------------
function Record() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [sendDisabled, setSendDisabled] = useState(true);
  const [linkVisible, setLinkVisible] = useState(false)
  const [linkId, setLinkId] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Notify Record component of the password
  const handlePasswordChange = (newPassword) => {
    setPassword(newPassword);
    setSendDisabled(newPassword === "");
  };

  // ------------------- Encryption and Utility Functions -------------------
  const generateRandId = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    console.log("Generated random ID:", result);
    return result;
  };

  async function deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptMessage(passphrase, audio) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const arrayBuffer = await audio.arrayBuffer();

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      arrayBuffer
    );

    return {
      ciphertext: new Uint8Array(encrypted),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
    };
  }
  // ------------------------------------------------------------------------

  // ------------------- Audio Recording Functions -------------------
  const startRecording = async () => {
    console.log("Attempting to start recording...");
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // console.log("Microphone access granted. Stream:", stream);

      // Initialize MediaRecorder; specify mimeType if needed (e.g., "audio/webm")
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      // console.log("MediaRecorder initialized:", mediaRecorder);

      // Clear previous audio chunks
      audioChunksRef.current = [];

      // Collect audio data as it becomes available
      mediaRecorder.ondataavailable = (event) => {
        console.log(
          "ondataavailable event received, data size:",
          event.data.size
        );
        audioChunksRef.current.push(event.data);
        console.log(
          "Current audioChunks length:",
          audioChunksRef.current.length
        );
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // console.log(
        //   "Recording stopped. Collected audio chunks:",
        //   audioChunksRef.current
        // );
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // console.log("Created audio blob, size:", blob.size);
        setAudioBlob(blob);
        // Do not enable send until a password is provided.
        // setSendDisabled(false);
      };

      // Start recording
      mediaRecorder.start();
      // console.log("Recording started.");
      setIsRecording(true);
      setSendDisabled(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    console.log("Stop recording invoked.");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // Stop the recorder
      setIsRecording(false);
      // Show the password field after recording stops so user can enter a password before sending.
      setShowPasswordField(true);
    } else {
      console.warn("No MediaRecorder instance found.");
    }
  };
  // --------------------------------------------------------------------

  // ------------------- Supabase & Upload Functions -------------------
  async function uploadAudio(audioBlob, passphrase) {
    const id = generateRandId();
    const fileName = `${id}`;
    console.log("Uploading audio with fileName:", fileName);
    // Encrypt the audio blob with the provided passphrase
    const { ciphertext, salt, iv } = await encryptMessage(
      passphrase,
      audioBlob
    );
    // Create a new Blob from the ciphertext
    const file = new Blob([ciphertext], { type: "application/octet-stream" });
    // console.log("Encrypted audio file created, size:", file.size);

    // Upload the encrypted file to Supabase storage
    const { data, error } = await supabase.storage
      .from("encrypted-audio-messages")
      .upload(fileName, file, {
        metadata: {
          // Convert salt and iv to Base64 strings for storage
          salt: btoa(String.fromCharCode(...salt)),
          iv: btoa(String.fromCharCode(...iv)),
        },
      });
    if (error) {
      console.error("Error uploading encrypted audio:", error);
    } else {
      console.log("Audio uploaded successfully:", data);
      setLinkVisible(true);
      setLinkId(fileName);
    }

    // Insert metadata into the message_metadata table
    const { data: metadata, error: metadataError } = await supabase
      .from("message_metadata")
      .insert([{ filename: fileName, salt: salt, iv: iv }]);

    if (metadataError) {
      console.error("Error uploading metadata:", metadataError);
    } 
    // else {
    //   // console.log("Metadata uploaded successfully:", metadata);
    // }
  }

  const sendAudio = () => {
    console.log(
      "Send button triggered. Audio blob:",
      audioBlob,
      "Password:",
      password
    );
    if (audioBlob && password) {
      uploadAudio(audioBlob, password);
      // Reset the states after sending
      setAudioBlob(null);
      setSendDisabled(true);
      setPassword("");
      setShowPasswordField(false);
    } else {
      console.warn("Missing audio blob or password.");
    }
  };
  // --------------------------------------------------------------------

  return (
    <>
      <Stack
        direction="column"
        spacing={2}
        justifyContent="center"
        sx={{ mb: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<MicIcon />}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop Recording" : "Record a Voice Message"}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          endIcon={<SendIcon />}
          color="secondary"
          disabled={sendDisabled}
          onClick={sendAudio}
        >
          Send Voice Message
        </Button>
        <PasswordField
          onPasswordChange={handlePasswordChange}
          visible={showPasswordField}
        />
        {/* Preview the recorded audio if available */}
        {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
      </Stack>
      {linkVisible && <ShareLink id={linkId} />}
    </>
  );
}

export default Record;
