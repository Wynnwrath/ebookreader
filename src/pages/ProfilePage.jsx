import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import stellarbg from "../assets/images/stellarbg.gif";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";

function ProfilePage() {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    const [profile, setProfile] = useState({
        username: "stellar_user",
        bio: "Exploring the cosmos, one star at a time."
    });

    const [stats] = useState({
        booksCompleted: 42,
        booksInProgress: 5,
        totalReadingTime: "248h",
        recentlyCompleted: [
            { title: "The Martian", author: "Andy Weir", completedDate: "Dec 10, 2025" },
            { title: "Project Hail Mary", author: "Andy Weir", completedDate: "Dec 5, 2025" },
            { title: "Dune", author: "Frank Herbert", completedDate: "Nov 28, 2025" },
            { title: "Foundation", author: "Isaac Asimov", completedDate: "Nov 20, 2025" },
            { title: "Neuromancer", author: "William Gibson", completedDate: "Nov 15, 2025" }
        ],
        favorites: [
            { title: "Foundation", author: "Isaac Asimov", genre: "Sci-Fi" },
            { title: "Ender's Game", author: "Orson Scott Card", genre: "Sci-Fi" },
            { title: "Neuromancer", author: "William Gibson", genre: "Cyberpunk" },
            { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy" },
            { title: "1984", author: "George Orwell", genre: "Dystopian" }
        ]
    });

    function handleLogout() {
        navigate("/");
    }

    function handleEdit() {
        setIsEditing(!isEditing);
    }

    function handleSave(e) {
        e.preventDefault();
        setIsEditing(false);
        // Here you would typically save to backend
    }

    function handleChange(e) {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    }

    return (
        <div
            className="relative min-h-screen w-screen bg-cover bg-center font-[Inter]"
            style={{ backgroundImage: `url(${stellarbg})` }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            {/* Content Container */}
            <div className="relative z-10 h-screen overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold text-white tracking-widest spaceGlow">
                            PROFILE
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500/80 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left Column - Profile Info */}
                        <div className="col-span-1 space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg">
                                {/* Profile Picture */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white/30">
                                            {profile.username.charAt(0).toUpperCase()}
                                        </div>
                                        <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Profile Form */}
                                <form onSubmit={handleSave} className="flex flex-col space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-semibold">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={profile.username}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-semibold">Bio</label>
                                        <textarea
                                            name="bio"
                                            value={profile.bio}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            rows="4"
                                            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 resize-none"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-4">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    type="submit"
                                                    className="w-full bg-green-500/80 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleEdit}
                                                    className="w-full bg-gray-500/80 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleEdit}
                                                className="w-full bg-blue-500/80 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
                                            >
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-white/10 rounded-lg p-4 text-center">
                                        <p className="text-white text-4xl font-bold">{stats.booksCompleted}</p>
                                        <p className="text-gray-300 text-sm mt-1">Books Completed</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-4 text-center">
                                        <p className="text-white text-4xl font-bold">{stats.booksInProgress}</p>
                                        <p className="text-gray-300 text-sm mt-1">In Progress</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-4 text-center">
                                        <p className="text-white text-4xl font-bold">{stats.totalReadingTime}</p>
                                        <p className="text-gray-300 text-sm mt-1">Total Reading Time</p>
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
                                <div className="text-sm text-gray-300 space-y-3">
                                    <p className="hover:text-white cursor-pointer transition">
                                        Change Password
                                    </p>
                                    <p className="hover:text-white cursor-pointer transition">
                                        Privacy Settings
                                    </p>
                                    <p className="hover:text-white cursor-pointer transition text-red-400 hover:text-red-300">
                                        Delete Account
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Recently Completed */}
                        <div className="col-span-1">
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg h-full">
                                <h2 className="text-2xl font-bold text-white mb-6">Recently Completed</h2>
                                <div className="space-y-4">
                                    {stats.recentlyCompleted.map((book, index) => (
                                        <div key={index} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition cursor-pointer">
                                            <div className="flex items-start">
                                                <div className="w-12 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                                                    BOOK
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <h3 className="text-white font-semibold">{book.title}</h3>
                                                    <p className="text-gray-300 text-sm">{book.author}</p>
                                                    <p className="text-gray-400 text-xs mt-1">{book.completedDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Favorites */}
                        <div className="col-span-1">
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg h-full">
                                <h2 className="text-2xl font-bold text-white mb-6">Favorites</h2>
                                <div className="space-y-4">
                                    {stats.favorites.map((book, index) => (
                                        <div key={index} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition cursor-pointer">
                                            <div className="flex items-start">
                                                <span className="text-yellow-400 text-2xl mr-3">★</span>
                                                <div className="flex-1">
                                                    <h3 className="text-white font-semibold">{book.title}</h3>
                                                    <p className="text-gray-300 text-sm">{book.author}</p>
                                                    <span className="inline-block mt-2 px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded">
                            {book.genre}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;