import { useState, useRef, useEffect } from "react";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { MdKeyboardArrowDown, MdExitToApp } from "react-icons/md";
import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";

export default function HeaderRight() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // For web app — try closing the window
  const handleExit = async() => {
    await invoke('exit_app');
  };

  // Dropdown menu items
  const menuItems = [
    {
      label: "Profile",
      icon: <CgProfile className="text-lg" />,
      action: () => navigate("/profile"),
    },
    {
      label: "Settings",
      icon: <IoSettingsOutline className="text-lg" />,
      action: () => console.log("Settings clicked"),
    },
  ];

  return (
    <div
      className="flex items-center gap-5 ml-auto relative z-50"
      ref={dropdownRef}
    >
      {/* Notifications */}
      <IoIosNotificationsOutline className="text-2xl text-white hover:text-stellar-glow transition" />

      {/* Profile Dropdown */}
      <div
        className="relative flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <CgProfile className="text-3xl text-white bg-gradient-to-br from-stellar-glow to-stellar-accent rounded-full p-1.5" />
        <h1 className="hidden md:block text-white font-medium">
          Seth A. Pinca
        </h1>
        <MdKeyboardArrowDown
          className={`text-2xl text-white transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />

        {/* Dropdown Menu */}
        {open && (
          <div
            className="
              absolute right-0 top-full mt-3 
              bg-gray-950 border border-white/10 
              rounded-lg w-44 py-2 z-50 
              shadow-[0_0_15px_rgba(255,153,51,0.25)]
            "
          >
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="flex items-center gap-2 w-full text-left px-4 py-2
                           text-gray-200 hover:bg-white/10 hover:text-white transition"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Exit Button (Rightmost) */}
      <button
        onClick={handleExit}
        className="
          flex items-center gap-2 px-4 py-1.5 ml-2
          bg-gradient-to-r from-red-600 to-red-800 
          text-white font-semibold rounded-lg 
          hover:opacity-90 hover:scale-[1.02] transition-all duration-200
          shadow-[0_0_8px_rgba(255,0,0,0.4)]
        "
      >
        <MdExitToApp className="text-lg" />
        Exit
      </button>
    </div>
  );
}
