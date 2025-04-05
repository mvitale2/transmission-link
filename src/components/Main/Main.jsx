import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";

export default function Main({ onJoin }) {
  const [roomId, setRoomId] = useState("");

  const handleJoin = () => {
    if (roomId !== "") {
      console.log(`Joining room: ${roomId}`);
      onJoin(roomId); // Navigates and handles joining the room 
    } else {
      alert("Please enter a room ID");
    }
  };

  // New function to generate a random room ID and join the room
  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10); // generate an 8-char id for the user 
    setRoomId(newRoomId);
    console.log(`Created room: ${newRoomId}`);
    onJoin(newRoomId); // Automatically join to the room 
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper
        elevation={6}
        sx={{ p: 4, borderRadius: 4, backdropFilter: "blur(8px)" }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          🔗 Transmission Link
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
          <Button variant="outlined" startIcon={<MicIcon />}>
            Record
          </Button>
        </Stack>
        <Stack direction="column" spacing={2} justifyContent="center">
          <Button
            fullWidth
            variant="contained"
            endIcon={<SendIcon />}
            color="secondary"
          >
            Send Audio Message
          </Button>
          <Button
            fullWidth
            variant="contained"
            endIcon={<AddIcon />}
            color="secondary"
            onClick={handleCreateRoom}
          >
            Create New Room
          </Button>
        </Stack>
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
