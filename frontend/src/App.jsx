import { useMemo, useState } from "react";

import { connectSocket } from "./socket";
import AcceptInvite from "./components/acceptInvite";
import Login from "./components/login";
import ChatWindow from "./components/chatWindow";
import InviteUser from "./components/inviteUser";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("inviteToken");
  }, []);

  const handleLogin = (token, userData) => {
    setToken(token);
    setUser(userData);

    connectSocket(token);
  };

  if (!token) {
    if (inviteToken) {
      return (
        <AcceptInvite inviteToken={inviteToken} onLogin={handleLogin} />
      );
    }

    return <Login onLogin={handleLogin} />;
  }

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
