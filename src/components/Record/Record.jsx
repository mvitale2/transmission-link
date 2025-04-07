import React, { useState, useRef, useEffect } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { createClient } from '@supabase/supabase-js';
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";

function Record() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [sendDisabled, setSendDisabled] = useState(true);
  const [limit, setLimit] = useState(3600); // Default to 1 hour
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  function LimitButtons() {

    const handleClick = (limit) => {
        setLimit(limit);
    }
    
    return (
      <>
        <Typography variant="subtitle1" sx={{ mr: 2 }} align="center">
          Select how long the message link will last:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent={"center"}>
            {/* Each button appears contained if its respective length is equal to the current selected limit in seconds */}
            <Button
            variant={limit === 3600 ? "contained" : "outlined"}
            onClick={() => handleClick(3600)}
            >
            1 Hour
            </Button>
            <Button
            variant={limit === 7200 ? "contained" : "outlined"}
            onClick={() => handleClick(7200)}
            >
            2 Hours
            </Button>
            <Button
            variant={limit === 10800 ? "contained" : "outlined"}
            onClick={() => handleClick(10800)}
            >
            3 Hours
            </Button>
            <Button
            variant={limit === 21600 ? "contained" : "outlined"}
            onClick={() => handleClick(21600)}
            >
            6 Hours
            </Button>
        </Stack>
      </>
    );
  }

  const startRecording = async () => {
    try {
      // Request access to the user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Clear previous audio chunks
      audioChunksRef.current = [];

      // Collect audio data as it becomes available
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        setSendDisabled(false); // Enable the send button
        console.log("Recording complete:", audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setSendDisabled(true); // Disable the send button while recording
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // Stop the recording
      setIsRecording(false);
    }
  };
  
  async function uploadAudio(audioBlob) {
    const fileName = `audio-${Date.now()}.webm`;

    const {data, error } = await supabase.storage.from('audio-messages').upload(fileName, audioBlob)
    if (error) {
        console.error("Error uploading audio:", error);
    } else {
        // console.log("Audio uploaded successfully:", data);
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('audio-messages').createSignedUrl(fileName, limit);
        if (signedUrlError) {
            console.error("Error creating signed URL:", signedUrlError);
            return null;
        } else {
            alert(`Audio uploaded. Access it here:\n${signedUrlData.signedUrl}`);
        }
    }
  }

  const sendAudio = () => {
    if (audioBlob) {
        uploadAudio(audioBlob);
    }
    // Reset the state after sending
    setAudioBlob(null);
    setSendDisabled(true);
  };

  return (
    <>
      <Stack direction="column" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
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
          disabled={sendDisabled} // Disable until recording is complete
          onClick={sendAudio}
        >
          Send Voice Message
        </Button>
        {!sendDisabled && <LimitButtons />}
        {/* display audio player if an audioBlob exists */}
        {audioBlob && (
          <audio
            controls
            src={URL.createObjectURL(audioBlob)} // Preview the recorded audio
          />
        )}
      </Stack>
    </>
  );
}

export default Record;