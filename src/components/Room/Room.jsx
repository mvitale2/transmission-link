import React from 'react'
import { Container, Typography, Button, Stack, Paper } from '@mui/material';


function Room({ roomId, onLeave }) {

  const handleLeaveRoom = () => {
    onLeave()
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4, backdropFilter: 'blur(8px)' }}>
        <Typography variant="h4" align="center" gutterBottom>
          🔗 Transmission Link
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          Secure Peer-to-Peer Voice Chat
        </Typography>
        <Typography variant="h6" align="center" gutterBottom>
          Room ID: {roomId}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" color="primary">
            Start Call
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleLeaveRoom}>
            Leave Room
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}

export default Room