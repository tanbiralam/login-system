import { useState } from "react";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(
        "http://localhost:8000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      setStatus(data.message || "If the email exists, a reset link was sent.");
    } catch (err) {
      setStatus("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Forgot Password</h1>
      <p className="text-sm text-gray-700">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          className="bg-blue-600 text-white p-2 rounded disabled:opacity-60"
          disabled={!email || loading}
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <button
          type="button"
          className="text-blue-600 underline text-left"
          onClick={onBack}
        >
          Back to login
        </button>
      </form>

      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
