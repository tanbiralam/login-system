import { useEffect, useState } from "react";

export default function AcceptInvite({ inviteToken, onLogin }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteToken) return;
      setStatus("Verifying invite...");
      try {
        const res = await fetch(
          `http://localhost:8000/api/invites/${inviteToken}`
        );
        const data = await res.json();
        if (data.success) {
          setEmail(data.data.email);
          setStatus(null);
        } else {
          setStatus(data.message || "Invite is invalid or expired.");
        }
      } catch (err) {
        setStatus("Failed to verify invite.");
      }
    };

    fetchInvite();
  }, [inviteToken]);

  const acceptInvite = async (e) => {
    e.preventDefault();
    if (!inviteToken || !password) return;

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("http://localhost:8000/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: inviteToken, password, name }),
      });

      const data = await res.json();
      if (data.success) {
        onLogin(data.token, data.user);
      } else {
        setStatus(data.message || "Failed to accept invite.");
      }
    } catch (err) {
      setStatus("Failed to accept invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Accept Invite</h1>
      <p className="text-sm text-gray-700">
        Set your password to finish creating your account.
      </p>

      <form onSubmit={acceptInvite} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded bg-gray-100"
          value={email}
          disabled
          placeholder="invite email"
        />

        <input
          className="border p-2 rounded"
          placeholder="your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className="bg-blue-600 text-white p-2 rounded disabled:opacity-60"
          disabled={!password || loading || !email}
        >
          {loading ? "Creating account..." : "Accept Invite"}
        </button>
      </form>

      {status && <p className="text-sm text-red-600">{status}</p>}
    </div>
  );
}
