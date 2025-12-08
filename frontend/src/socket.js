import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  socket = io("ws://localhost:8000", {
    auth: {
      token,
    },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Connected as:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("Socket connection error:", err.message);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  return socket;
};

export const getSocket = () => socket;
