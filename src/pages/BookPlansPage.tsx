import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  FiCalendar, 
  FiClock, 
  FiBookOpen, 
  FiZap, 
  FiPlus, 
  FiCheckCircle, 
  FiTrendingUp,
  FiTrash2,
  FiAward
} from "react-icons/fi";

interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  targetPagesPerDay: number;
  durationDays: number;
  active: boolean;
  progressPercentage: number;
  startDate: string;
  booksCount: number;
}

const BookPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<ReadingPlan[]>([
    {
      id: "1",
      title: "Daily Scholarly Ritual",
      description: "Read 25 pages of deep reference material daily to enhance focus.",
      targetPagesPerDay: 25,
      durationDays: 30,
      active: true,
      progressPercentage: 68,
      startDate: "2026-05-15",
      booksCount: 2
    },
    {
      id: "2",
      title: "Classical Philosophy Track",
      description: "Dive into ancient wisdom with targeted reading schedules.",
      targetPagesPerDay: 15,
      durationDays: 14,
      active: true,
      progressPercentage: 42,
      startDate: "2026-06-01",
      booksCount: 1
    },
    {
      id: "3",
      title: "Rapid Technical Syllabus",
      description: "Go through modern guides, reference libraries, and publications.",
      targetPagesPerDay: 40,
      durationDays: 20,
      active: false,
      progressPercentage: 0,
      startDate: "2026-06-05",
      booksCount: 3
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPages, setNewPages] = useState(20);
  const [newDuration, setNewDuration] = useState(14);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPlan: ReadingPlan = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc || "No description provided.",
      targetPagesPerDay: newPages,
      durationDays: newDuration,
      active: true,
      progressPercentage: 0,
      startDate: new Date().toISOString().split("T")[0],
      booksCount: 1
    };

    setPlans([newPlan, ...plans]);
    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewPages(20);
    setNewDuration(14);
  };

  const handleTogglePlan = (id: string) => {
    setPlans(plans.map(p => {
      if (p.id === id) {
        return { ...p, active: !p.active };
      }
      return p;
    }));
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  return (
    <div className="p-margin-desktop space-y-12 max-w-container-max mx-auto w-full page-transition pb-24 text-on-surface">
      
      {/* Header Panel */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-on-surface tracking-tight">
            Book Plans & <span className="text-tertiary">Schedules</span>
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1.5">
            Configure target limits, schedules, and daily challenges for systematic library coverage.
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-tertiary/15 text-tertiary border border-tertiary/30 hover:bg-tertiary/25 hover:border-tertiary transition-all duration-200 py-2.5 px-4 rounded-lg font-label-md text-sm shadow-sm cursor-pointer self-start md:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Reading Plan</span>
        </button>
      </section>

      {/* Grid: Stats & Active Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Active/Inactive Plans */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold font-serif text-on-surface border-b border-outline-variant/10 pb-2">
            Your Custom Reading Plans
          </h2>

          <div className="space-y-4">
            {plans.map(plan => (
              <div 
                key={plan.id}
                className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-6 hover:border-outline-variant/30 transition shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold font-serif text-on-surface">{plan.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        plan.active 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                          : "bg-surface-container-highest border-outline-variant/30 text-on-surface-variant/70"
                      }`}>
                        {plan.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed max-w-xl">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePlan(plan.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        plan.active
                          ? "bg-surface-container border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
                          : "bg-tertiary/10 border-tertiary/20 text-tertiary hover:bg-tertiary/20"
                      }`}
                    >
                      {plan.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-on-surface-variant/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border border-transparent hover:border-red-400/20 cursor-pointer"
                      title="Delete Plan"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Metric */}
                {plan.active && (
                  <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                    <div className="flex justify-between text-xs font-medium text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-3.5 h-3.5 text-tertiary" />
                        <span>Started {plan.startDate} &bull; {plan.durationDays} Days Duration</span>
                      </span>
                      <span className="font-bold text-on-surface">{plan.progressPercentage}% Complete</span>
                    </div>

                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-tertiary rounded-full transition-all duration-500" 
                        style={{ width: `${plan.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta details list */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant/80">
                  <div className="flex items-center gap-1.5">
                    <FiBookOpen className="w-4 h-4 text-on-surface-variant/60" />
                    <span>{plan.targetPagesPerDay} Pages / Day</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-outline-variant/40" />
                  <div className="flex items-center gap-1.5">
                    <FiClock className="w-4 h-4 text-on-surface-variant/60" />
                    <span>Est. {Math.round(plan.targetPagesPerDay * 1.5)} mins daily</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-outline-variant/40" />
                  <div>
                    <span>{plan.booksCount} Books Included</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Achievements, Streaks & Quick Tips */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-serif text-on-surface border-b border-outline-variant/10 pb-2">
            Weekly Milestones
          </h2>

          {/* Reading Streak Card */}
          <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/25">
                <FiZap className="w-5 h-5 text-amber-500 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Daily Reading Streak</h3>
                <p className="text-[11px] text-on-surface-variant font-medium">Keep reading every day to earn rewards.</p>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-4xl font-extrabold text-amber-500 font-serif">14</span>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1.5">Days Active</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-outline-variant/10">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-on-surface-variant font-bold">{day}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx < 5 
                      ? "bg-amber-500/20 border border-amber-500/30 text-amber-500"
                      : "bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant/40"
                  }`}>
                    {idx < 5 ? "✓" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements list */}
          <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <FiAward className="w-4 h-4 text-tertiary" />
              <span>Unlocked Milestones</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary text-xs shrink-0 font-bold">I</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">First Ebook Imported</p>
                  <p className="text-[10px] text-on-surface-variant truncate">Successfully expanded the archive</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xs shrink-0 font-bold">II</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">10 Days Streak Achieved</p>
                  <p className="text-[10px] text-on-surface-variant truncate">Established constant scholarly habits</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/10 flex items-center justify-center text-on-surface-variant/50 text-xs shrink-0 font-bold">III</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface-variant truncate">Scholarly Mastermind</p>
                  <p className="text-[10px] text-on-surface-variant/60 truncate">Read 5 hours total within one week</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Plan Builder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-backdrop">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden relative p-8 flex flex-col gap-6 animate-zoom-in-modal text-on-surface">
            
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <h2 className="text-2xl font-serif font-bold text-on-surface">Create Reading Plan</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-1 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Plan Title</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Philosophy Marathon" 
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                <textarea 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Summarize your goals..." 
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pages / Day</label>
                  <input 
                    type="number" 
                    value={newPages} 
                    onChange={e => setNewPages(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Duration (Days)</label>
                  <input 
                    type="number" 
                    value={newDuration} 
                    onChange={e => setNewDuration(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition shadow-sm font-bold text-xs cursor-pointer"
                >
                  Create Plan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default BookPlansPage;
