import { Message } from "../models/message.model.js";
import { onlineUsers } from "./user.map.js";

export const registerMessageHandlers = (io, socket) => {
  socket.on("send_message", async ({ receiverId, content }) => {
    try {
      const newMessage = await Message.create({
        senderId: socket.userId,
        receiverId,
        content,
      });

      socket.emit("message_sent", newMessage);

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", newMessage);
      }
    } catch (err) {
      console.error("Message error:", err);
    }
  });
};
