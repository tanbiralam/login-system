import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import MessageInput from "./messageInput";

export default function ChatWindow({ user }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.log("Socket unavailable in ChatWindow; ensure connectSocket was called");
      return;
    }

    console.log("Setting up chat listeners for user", user?.id);

    socket.on("receive_message", (msg) => {
      console.log("Received message", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message_sent", (msg) => {
      console.log("Acknowledged sent message", msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_sent");
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-10 border p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Chat</h2>

      <div className="h-80 overflow-y-auto p-2 border mb-4 rounded">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 my-1 rounded ${
              m.senderId === user.id ? "bg-blue-200" : "bg-gray-200"
            }`}
          >
            <p className="text-sm">{m.content}</p>
          </div>
        ))}
      </div>

      <MessageInput user={user} />
    </div>
  );
}
