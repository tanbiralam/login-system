import { useState } from "react";
import { getSocket } from "../socket";

export default function MessageInput({ user }) {
  const [text, setText] = useState("");

  const send = () => {
    const socket = getSocket();
    const receiverId = user?.id === 3 ? 4 : 3; // temporary: send to the other logged-in user
    if (!socket) {
      console.log("send_message aborted: socket not connected");
      return;
    }
    console.log("Emitting send_message", { receiverId, content: text });
    socket.emit("send_message", {
      receiverId,
      content: text,
    });
    setText("");
  };

  return (
    <div className="flex gap-2">
      <input
        className="border p-2 flex-1"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={send} className="bg-blue-600 text-white px-4 rounded">
        Send
      </button>
    </div>
  );
}
