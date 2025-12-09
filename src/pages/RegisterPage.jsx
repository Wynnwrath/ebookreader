import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import stellarbg from "../assets/images/stellarbg.gif";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import { invoke } from "@tauri-apps/api/core";

function RegisterPage() {
    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        const form = e.target;

        const username = form.username.value.trim();
        const password = form.password.value.trim();
        const confirmPassword = form.confirmPassword.value.trim();

        // Debug log to see what values we're getting
        console.log("Form values:", { username, password, confirmPassword });

        if (!username || !password || !confirmPassword) {
            setError("Please fill out all fields.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const result = await invoke("register", {
                username: username,
                password: password,
            });

            console.log("Registration result:", result);

            if (result === true) {
                setSuccess("Account created successfully!");
                setTimeout(() => navigate("/"), 1500);
            } else {
                // Show the actual result from the backend
                setError(`Registration failed: ${JSON.stringify(result)}`);
            }
        } catch (err) {
            console.error("Full error object:", err);

            // Display detailed error information
            const errorMessage = err.message || err.toString();
            const errorDetails = err.response?.data || err.data || "";

            setError(`Error: ${errorMessage}${errorDetails ? ` - ${JSON.stringify(errorDetails)}` : ""}`);
        }
    }

    return (
        <div
            className="relative h-screen w-screen flex items-center justify-center bg-cover bg-center font-[Inter]"
            style={{ backgroundImage: `url(${stellarbg})` }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            {/* Glass Box */}
            <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 w-80 text-center shadow-lg">
                <h1 className="text-3xl font-bold text-white mb-6 tracking-widest spaceGlow">
                    REGISTER
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <input
                        type="text"
                        name="username"
                        placeholder="Create Username"
                        className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Create Password"
                        className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {success && <p className="text-green-400 text-sm">{success}</p>}

                    <button
                        type="submit"
                        className="w-full bg-blue-500/80 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
                    >
                        Register
                    </button>

                    <p
                        className="mt-4 text-sm text-gray-300 hover:text-white cursor-pointer transition"
                        onClick={() => navigate("/")}
                    >
                        Already have an account? Login
                    </p>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;
