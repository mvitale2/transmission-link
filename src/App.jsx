import './App.css'
import { useState, useEffect } from 'react';
import Main from './components/Main/Main.jsx';
import Room from './components/Room/Room.jsx';

function App() {
  const [join, setJoin] = useState(false);
  const [roomId, setRoomId] = useState('');

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
      {join ? (
        <Room roomId={roomId} onLeave={handleLeave} />
      ) : (
        <Main onJoin={handleJoin} />
      )}
    </>
  );
}

export default App;
