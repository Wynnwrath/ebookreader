import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  FiUser, 
  FiAward, 
  FiActivity, 
  FiCheckCircle, 
  FiEdit, 
  FiSliders,
  FiZap,
  FiMoon,
  FiSun,
  FiCoffee
} from "react-icons/fi";
import Card from "../components/ui/Card";
import { AppOutletContext } from "../types";
import { useTheme } from "../hooks/useTheme";
import { useBooksWithProgress } from "../hooks/useBooksWithProgress";

interface DayData {
  day: string;
  minutes: number;
  pct: string;
}

interface Achievement {
  title: string;
  desc: string;
  unlocked: boolean;
}

const ProfilePage: React.FC = () => {
  const context = useOutletContext<AppOutletContext>();
  const userId = context?.userId ?? 1;

  const [username, setUsername] = useState<string>("cruiz");
  const [bio, setBio] = useState<string>("Avid sci-fi reader. Exploring the stars, one page at a time.");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Custom Hooks
  const { activeTheme, setTheme: handleThemeSelect } = useTheme();
  const { books, streakDays, loadData } = useBooksWithProgress(userId);

  useEffect(() => {
    if (userId) {
      loadData(true);
    }
  }, [userId, loadData]);

  // Mock reading statistics (Weekly graph percentages)
  const weekData: DayData[] = [
    { day: "Mon", minutes: 30, pct: "40%" },
    { day: "Tue", minutes: 45, pct: "60%" },
    { day: "Wed", minutes: 75, pct: "100%" },
    { day: "Thu", minutes: 20, pct: "25%" },
    { day: "Fri", minutes: 50, pct: "65%" },
    { day: "Sat", minutes: 90, pct: "120%" },
    { day: "Sun", minutes: 40, pct: "55%" }
  ];

  const completedBooksCount = books.filter(b => b.progress === 100).length;

  const achievements: Achievement[] = [
    { title: "First Voyage", desc: "Successfully imported your first EPUB book.", unlocked: books.length > 0 },
    { title: "Supergiant", desc: "Read for more than 2 hours in a single session.", unlocked: true },
    { title: "Hyperdrive", desc: "Maintained a 7-day reading streak.", unlocked: streakDays >= 7 },
    { title: "Nebula Cartographer", desc: "Fully completed 5 books.", unlocked: completedBooksCount >= 5 }
  ];

  return (
    <div className="w-full space-y-8 p-margin-desktop max-w-container-max mx-auto page-transition pb-24">
      
      {/* 1. PROFILE HEADER CARD */}
      <Card className="flex flex-col md:flex-row items-center gap-6 shadow-md p-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold shadow-lg shrink-0">
          {username.slice(0, 2).toUpperCase()}
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            {isEditing ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-bg border border-border text-text rounded px-2 py-1 text-xl font-bold focus:outline-none focus:border-primary"
                onBlur={() => setIsEditing(false)}
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <h1 className="text-2xl font-bold tracking-tight text-text">{username}</h1>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="text-text-dim hover:text-text"
                  title="Edit Username"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
              </div>
            )}
            <span className="text-xs text-text-dim font-mono bg-bg border border-border px-1.5 py-0.5 rounded w-fit mx-auto md:mx-0">#0001</span>
          </div>

          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-bg border border-border text-text rounded p-2 text-sm focus:outline-none focus:border-primary"
              onBlur={() => setIsEditing(false)}
            />
          ) : (
            <p className="text-sm text-text-dim line-clamp-2">{bio}</p>
          )}

          <div className="flex items-center gap-4 text-xs font-semibold pt-1 justify-center md:justify-start">
            <span className="flex items-center gap-1 text-primary"><FiZap /> Streak: {streakDays} {streakDays === 1 ? "Day" : "Days"}</span>
            <span className="flex items-center gap-1 text-secondary"><FiActivity /> Active Level: Initiate</span>
          </div>
        </div>
      </Card>

      {/* Grid: Theme Switcher & Weekly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. THEME SELECTION PANEL */}
        <Card className="shadow-md space-y-4 p-6">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FiSliders className="text-primary w-5 h-5" />
            <span>Theme Control Center</span>
          </h2>
          <p className="text-xs text-text-dim">Toggle and configure the UI aesthetic using custom CSS properties.</p>

          <div className="space-y-3">
            {[
              { id: "scholarly-dark", label: "Scholarly Dark", desc: "Traditional dark theme, easy on the eyes.", icon: FiMoon, style: "hover:border-primary/50" },
              { id: "scholarly-sepia", label: "Scholarly Sepia", desc: "Warm cozy parchment theme for comfortable reading.", icon: FiCoffee, style: "hover:border-primary/50" },
              { id: "scholarly-light", label: "Scholarly Light", desc: "Vibrant clean minimalist theme for daytime reading.", icon: FiSun, style: "hover:border-primary/50" }
            ].map(theme => {
              const Icon = theme.icon;
              const isSelected = activeTheme === theme.id;
              return (
                <div 
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`p-3 rounded-lg border flex items-center gap-4 cursor-pointer transition ${
                    isSelected ? "bg-primary/10 border-primary text-text shadow-sm" : "bg-bg border-border text-text-dim hover:text-text " + theme.style
                  }`}
                >
                  <div className={`p-2 rounded ${isSelected ? "bg-primary text-white" : "bg-surface text-text"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-text">{theme.label}</div>
                    <div className="text-[10px] text-text-dim mt-0.5">{theme.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 3. READING ACTIVITY GRAPH */}
        <Card className="shadow-md space-y-4 flex flex-col p-6">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FiActivity className="text-secondary w-5 h-5" />
            <span>Weekly Activity</span>
          </h2>
          <p className="text-xs text-text-dim">Daily minutes spent reading in the Stellaron app.</p>

          {/* Graphical Bars Area */}
          <div className="flex-1 flex items-end justify-between gap-2 h-48 pt-6">
            {weekData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex items-end justify-center h-32">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow transition-opacity duration-150 z-10 whitespace-nowrap">
                    {data.minutes}m
                  </div>
                  
                  {/* Visual Bar */}
                  <div 
                    className="w-full max-w-[20px] rounded-t bg-gradient-to-t from-primary to-secondary hover:brightness-110 shadow shadow-primary/20 transition-all duration-500 ease-out"
                    style={{ height: data.pct }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-text-dim">{data.day}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* 4. ACHIEVEMENTS SYSTEM */}
      <Card className="shadow-md space-y-4 p-6">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <FiAward className="text-primary w-5 h-5" />
          <span>Achievements</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                item.unlocked 
                  ? "bg-bg/40 border-border" 
                  : "bg-bg/10 border-border/40 opacity-60"
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                item.unlocked ? "bg-primary/10 text-primary" : "bg-bg text-text-dim border border-border"
              }`}>
                <FiAward className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs text-text">{item.title}</h3>
                  {item.unlocked && <FiCheckCircle className="w-3.5 h-3.5 text-tertiary" title="Unlocked" />}
                </div>
                <p className="text-[10px] text-text-dim">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};

export default ProfilePage;
