import { useRef, useState, useEffect } from "react";
import "./Audio.css";

// use this tutorial for actual webrtc connection
// https://www.videosdk.live/developer-hub/webrtc/webrtc-react

function App() {
  const [started, setStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStarted(true);
      streamRef.current = stream;

      // Set up audio context and analyser
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Determines the frequency data size
      analyserRef.current = analyser;

      source.connect(analyser);

      // Set the audio stream to the audio element
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setStarted(false);
    }
  };

  const stop = () => {
    setStarted(false);
    setIsSpeaking(false);

    // Stop the audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close the audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  useEffect(() => {
    if (!started) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);

    const monitorAudio = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const avgVolume =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

      console.log(avgVolume)

      // Set isSpeaking to true if volume exceeds a threshold
      setIsSpeaking(avgVolume > 2); // Adjust threshold as needed

      if (started) {
        requestAnimationFrame(monitorAudio);
      }
    };

    monitorAudio();

    // Cleanup function to stop monitoring when `started` is false
    return () => {
      setIsSpeaking(false);
    };
  }, [started]);

  return (
    <div className="main">
      <h1>WebRTC Audio Detection</h1>
      <button onClick={start} disabled={started}>
        Start
      </button>
      <button onClick={stop} disabled={!started}>
        Stop
      </button>
      <audio ref={audioRef} />
      <div className={`status ${isSpeaking ? "speaking" : ""}`}>
        <p>You</p>
      </div>
    </div>
  );
}

export default App;
