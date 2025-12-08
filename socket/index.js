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
    const userKey = String(socket.userId);
    console.log("User connected:", socket.userId);

    onlineUsers.set(userKey, socket.id);
    console.log("Online users map after connect:", Array.from(onlineUsers.entries()));

    registerMessageHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);
      onlineUsers.delete(userKey);
      console.log("Online users map after disconnect:", Array.from(onlineUsers.entries()));
    });
  });

  return io;
};
