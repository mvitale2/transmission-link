import "./App.css";
import { useState, useEffect } from "react";
import Main from "./components/Main/Main.jsx";
import Room from "./components/Room/Room.jsx";
import Decrypt from "./components/Decrypt/Decrypt.jsx";

function App() {
  const [join, setJoin] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [voiceId, setVoiceId] = useState("");

  // On mount, check for a voiceId query parameter and update the state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("voiceId");
    if (id) {
      setVoiceId(id);
      console.log(`Obtained voice id: ${id}`);
    }
  }, []);

  const handleJoin = (id) => {
    // If id is falsy, default roomId to an empty string
    setRoomId(id || "");
    setJoin(true);
    console.log("Joining room with id:", id);
  };

  const handleLeave = () => {
    setJoin(false);
    setRoomId("");
    console.log(`Room id cleared: ${roomId}`);
  };

  return (
    <>
      {/* If a voiceId exists in the URL, render the Decrypt component */}
      {voiceId ? <Decrypt fileName={voiceId} /> : null}
      {/* Render Room if join is true and roomId is provided, else render Main */}
      {join && roomId !== "" ? (
        <Room roomId={roomId} onLeave={handleLeave} />
      ) : (
        <Main onJoin={handleJoin} />
      )}
    </>
  );
}

export default App;
