import { useState } from "react";

import { connectSocket } from "./socket";
import Login from "./components/login";
import ChatWindow from "./components/chatWindow";
import InviteUser from "./components/inviteUser";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = (token, userData) => {
    setToken(token);
    setUser(userData);

    connectSocket(token);
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1">
          <ChatWindow user={user} />
        </div>
        <div className="w-full md:w-80">
          <InviteUser authToken={token} />
        </div>
      </div>
    </div>
  );
}

export default App;
