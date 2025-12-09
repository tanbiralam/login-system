import { useState } from "react";

export default function ResetPassword({ resetToken, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Password updated. You can log in now.");
        onDone?.();
      } else {
        setStatus(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setStatus("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Reset Password</h1>
      <p className="text-sm text-gray-700">
        Enter a new password to finish resetting your account.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded"
          placeholder="new password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded"
          placeholder="confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button
          className="bg-blue-600 text-white p-2 rounded disabled:opacity-60"
          disabled={!password || !confirm || loading}
        >
          {loading ? "Updating..." : "Reset password"}
        </button>
      </form>

      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
