import { useEffect, useMemo, useState } from "react";

import { connectSocket } from "./socket";
import AcceptInvite from "./components/acceptInvite";
import Login from "./components/login";
import ChatWindow from "./components/chatWindow";
import InviteUser from "./components/inviteUser";
import ForgotPassword from "./components/forgotPassword";
import ResetPassword from "./components/resetPassword";
import PdfTools from "./components/pdfTools";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mode, setMode] = useState("login");
  const [activeCard, setActiveCard] = useState("chat");

  const { inviteToken, resetToken } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      inviteToken: params.get("inviteToken"),
      resetToken: params.get("token"),
    };
  }, []);

  const handleLogin = (token, userData) => {
    setToken(token);
    setUser(userData);

    connectSocket(token);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/auth/me", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          handleLogin(data.token, data.user);
        }
      } catch (err) {
        // ignore bootstrap errors
      } finally {
        setAuthChecked(true);
      }
    };

    bootstrapAuth();
  }, []);

  if (!authChecked) {
    return (
      <div className="p-6 text-center text-gray-700">Loading...</div>
    );
  }

  if (!token) {
    if (inviteToken) {
      return (
        <AcceptInvite inviteToken={inviteToken} onLogin={handleLogin} />
      );
    }

    if (resetToken) {
      return (
        <ResetPassword
          resetToken={resetToken}
          onDone={() => {
            setMode("login");
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      );
    }

    if (mode === "forgot") {
      return (
        <ForgotPassword
          onBack={() => setMode("login")}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onForgot={() => setMode("forgot")}
      />
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setActiveCard("chat")}
          className={`border rounded p-4 text-left transition ${
            activeCard === "chat"
              ? "bg-blue-50 border-blue-500"
              : "bg-white hover:border-blue-300"
          }`}
        >
          <p className="text-lg font-semibold">Chat</p>
          <p className="text-sm text-gray-600">
            Open the existing chat experience.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveCard("pdf")}
          className={`border rounded p-4 text-left transition ${
            activeCard === "pdf"
              ? "bg-blue-50 border-blue-500"
              : "bg-white hover:border-blue-300"
          }`}
        >
          <p className="text-lg font-semibold">PDF</p>
          <p className="text-sm text-gray-600">
            Upload, parse, and annotate financial statements.
          </p>
        </button>
      </div>

      {activeCard === "chat" ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex-1">
            <ChatWindow user={user} />
          </div>
          <div className="w-full md:w-80">
            <InviteUser authToken={token} />
          </div>
        </div>
      ) : (
        <PdfTools />
      )}
    </div>
  );
}

export default App;
