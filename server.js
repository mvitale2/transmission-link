import express from "express";
import http from "http";
import { Server } from "socket.io";

// Initialize the Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Listen for new socket connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // When a client joins a room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    // Notify other clients in the room that a new user has joined
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // Relay an offer from one client to the others in the room
  socket.on("offer", (data) => {
    socket
      .to(data.roomId)
      .emit("offer", { offer: data.offer, senderId: socket.id });
  });

  // Relay an answer from one client to the others in the room
  socket.on("answer", (data) => {
    socket
      .to(data.roomId)
      .emit("answer", { answer: data.answer, senderId: socket.id });
  });

  // Relay ICE candidates to other clients in the room
  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", {
      candidate: data.candidate,
      senderId: socket.id,
    });
  });

  // Log client disconnects
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Define the port number. Use environment variable or default to 5000.
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server is listening on port ${PORT}`);
});
