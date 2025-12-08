import { useState } from "react";

export default function InviteUser({ authToken }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!authToken) return;

    setInviteLoading(true);
    setInviteStatus(null);

    try {
      const res = await fetch("http://localhost:8000/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteStatus("Invite sent successfully.");
        setInviteEmail("");
      } else {
        setInviteStatus(data.message || "Failed to send invite.");
      }
    } catch (err) {
      setInviteStatus("Failed to send invite.");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg flex flex-col gap-3 shadow-sm bg-white">
      <h2 className="text-xl font-semibold">Invite User</h2>
      <form onSubmit={sendInvite} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded"
          placeholder="invitee email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          disabled={inviteLoading}
          required
        />
        <button
          className="bg-green-600 text-white p-2 rounded disabled:opacity-60"
          disabled={inviteLoading || !inviteEmail}
        >
          {inviteLoading ? "Sending..." : "Send Invite"}
        </button>
      </form>
      {inviteStatus && <p className="text-sm text-gray-700">{inviteStatus}</p>}
    </div>
  );
}
