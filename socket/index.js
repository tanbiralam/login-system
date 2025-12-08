import { Server } from "socket.io";
import { socketAuth } from "./socket.auth.js";
import { registerMessageHandlers } from "./message.handler.js";
import { onlineUsers } from "./user.map.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.userId);

    onlineUsers.set(socket.userId, socket.id);

    registerMessageHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);
      onlineUsers.delete(socket.userId);
    });
  });

  return io;
};
