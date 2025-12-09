import { useState } from "react";

export default function Login({ onLogin, onForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginUser = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
      onLogin(data.token, data.user);
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={loginUser} className="flex flex-col gap-4">
        <input
          className="border p-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-blue-600 text-white p-2 rounded">Login</button>
        <button
          type="button"
          className="text-blue-600 underline text-left"
          onClick={onForgot}
        >
          Forgot password?
        </button>
      </form>
    </div>
  );
}
