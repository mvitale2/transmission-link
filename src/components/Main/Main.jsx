import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Stack, Paper } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';

export default function App() {
  const [roomId, setRoomId] = useState('');

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4, backdropFilter: 'blur(8px)' }}>
        <Typography variant="h4" align="center" gutterBottom>
          🔗 Transmission Link
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
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
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
          <Button variant="contained" startIcon={<CallIcon />} color="primary">
            Join Call
          </Button>
          <Button variant="outlined" startIcon={<MicIcon />}>
            Record
          </Button>
        </Stack>
        <Button fullWidth variant="contained" endIcon={<SendIcon />} color="secondary">
          Send Audio Message
        </Button>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }} color="text.secondary">
          
        </Typography>
      </Paper>
    </Container>
  );
}
