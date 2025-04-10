import './App.css'
import { useState, useEffect } from 'react';
import Main from './components/Main/Main.jsx';
import Room from './components/Room/Room.jsx';
import Decrypt from './components/Decrypt/Decrypt.jsx';

function App() {
  const [join, setJoin] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [voiceId, setVoiceId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('voiceId')
    if (id) {
      setVoiceId(id);
      console.log(`Obtained voice id: ${id}`)
    }
  }, []); // runs on mount

  const handleJoin = (id) => {
    setRoomId(id); // Set the roomId when joining
    setJoin(true); // Set join to true
  };

  const handleLeave = () => {
    setJoin(false); // Reset join to false
    setRoomId(''); // Clear the roomId
    console.log(`Room id cleared: ${roomId}`);
  };

  return (
    <>
      {voiceId ? (
        <Decrypt fileName={voiceId} />
      ) : (null)}
      {join ? (
        <Room roomId={roomId} onLeave={handleLeave} />
      ) : (
        <Main onJoin={handleJoin} />
      )}
    </>
  );
}

export default App;
