import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Link
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import AddIcon from "@mui/icons-material/Add";
import Record from "../Record/Record.jsx"

export default function Main({ onJoin }) {
  const [roomId, setRoomId] = useState("");
  const currentUrl = window.location.href;
  const homeUrl = currentUrl.replace(/\?.*/, "");


  const handleJoin = () => {
    if (roomId !== "") {
      console.log(`Joining room: ${roomId}`);
      onJoin(roomId); // Navigates and handles joining the room 
    } else {
      alert("Please enter a room ID");
    }
  };

  // Function to generate a random room ID and join the room
  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10); // generate an 8-char id for the user 
    setRoomId(newRoomId);
    console.log(`Created room: ${newRoomId}`);
    onJoin(newRoomId); // Automatically join to the room
    // functionality for hosting the room on webrtc goes here
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper
        elevation={6}
        sx={{ p: 4, borderRadius: 4, backdropFilter: "blur(8px)" }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          <Link href={homeUrl} underline="none" color="inherit">🔗 Transmission Link</Link>
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Secure Peer-to-Peer Voice Chat
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          label="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mb: 2 }}
        >
          <Button
            variant="contained"
            startIcon={<CallIcon />}
            color="primary"
            onClick={handleJoin}
          >
            Join Call
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            color="secondary"
            onClick={handleCreateRoom}
          >
            Create New Room
          </Button>
        </Stack>
        <Record/>
        <Typography
          variant="caption"
          display="block"
          align="center"
          sx={{ mt: 2 }}
          color="text.secondary"
        >
          Made with ❤️ by Transmission Team
        </Typography>
      </Paper>
    </Container>
  );
}
