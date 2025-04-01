import { useRef, useState } from "react";

function App() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pc = useRef(null);
  const [started, setStarted] = useState(false);

  const start = async () => {
    pc.current = new RTCPeerConnection();

    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = localStream;
    localStream
      .getTracks()
      .forEach((track) => pc.current.addTrack(track, localStream));

    pc.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Simulate signaling (loopback)
    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    const answerPC = new RTCPeerConnection();
    answerPC.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
    answerPC.onicecandidate = (e) => {
      if (e.candidate) {
        pc.current.addIceCandidate(e.candidate);
      }
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        answerPC.addIceCandidate(e.candidate);
      }
    };

    answerPC.oniceconnectionstatechange = () => {
      console.log("AnswerPC State:", answerPC.iceConnectionState);
    };

    answerPC.setRemoteDescription(pc.current.localDescription);
    const answer = await answerPC.createAnswer();
    await answerPC.setLocalDescription(answer);
    pc.current.setRemoteDescription(answer);

    setStarted(true);
  };

  return (
    <div>
      <h1>WebRTC Local Test</h1>
      <button onClick={start} disabled={started}>
        Start
      </button>
      <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
        <video ref={localVideoRef} autoPlay playsInline muted width={300} />
        <video ref={remoteVideoRef} autoPlay playsInline width={300} />
      </div>
    </div>
  );
}

export default App;
