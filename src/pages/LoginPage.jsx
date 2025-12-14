import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import stellarbg from "../assets/images/stellarbg.gif";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import { invoke } from '@tauri-apps/api/core';

function LoginPage() {
  const navigate = useNavigate();

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const username = e.target.username.value.trim();
    const password = e.target.password.value.trim();

    const isValid = await invoke('login', {username: username, password: password})

    if (isValid) {
      localStorage.setItem('username', username);
      navigate("/home");
    } else {
      setError("Invalid username or password.");
    }
  }

  function handleClick() {
    navigate("/register");
  }

  return (
    <div
      className="relative h-screen w-screen flex items-center justify-center bg-cover bg-center font-[Inter]"
      style={{ backgroundImage: `url(${stellarbg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Glassmorphic Login Box */}
      <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 w-80 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6 tracking-widest spaceGlow">
          STELLARON
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="w-full bg-blue-500/80 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Login
            </button>
            <button onClick={handleClick}
              type="button"
              className="w-full bg-blue-500/80 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Register
            </button>
          </div>

          {/* Forgot password & footer */}
          <div className="mt-4 text-sm text-gray-300 space-y-2">
            <p className="hover:text-white cursor-pointer transition">
              Forgot password?
            </p>
            <p className="hover:text-white cursor-pointer transition">
              Trouble signing in?
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
