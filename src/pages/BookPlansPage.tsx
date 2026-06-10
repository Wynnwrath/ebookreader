import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiZap, FiAward, FiTrendingUp } from "react-icons/fi";
import { useReadingPlans } from "../features/plans/hooks/useReadingPlans";
import { PlanCard } from "../features/plans/components/PlanCard";
import { ReadingHeatmap } from "../features/plans/components/ReadingHeatmap";
import { PlanCreatorModal } from "../features/plans/components/PlanCreatorModal";

const BookPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    plans,
    dbBooks,
    covers,
    readingLog,
    streakDays,
    handleCreatePlan,
    handleTogglePlan,
    handleDeletePlan,
    getPlanProgress,
    getCurrentWeekDays,
    toggleDateCompletion,
  } = useReadingPlans();

  return (
    <div className="p-margin-desktop space-y-8 max-w-container-max mx-auto w-full page-transition pb-24 text-on-surface">
      
      {/* Header Panel (No page title/description to match native app feel) */}
      <section className="flex justify-start items-center border-b border-outline-variant/10 pb-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition shadow-md py-2 px-4 rounded-xl font-sans text-xs font-bold cursor-pointer border border-black/5 dark:border-white/10"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Reading Plan</span>
        </button>
      </section>

      {/* Grid: Stats & Active Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Active/Inactive Plans */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
            <h2 className="text-xl font-serif font-bold text-on-surface">Active Schedules</h2>
            <span className="text-xs text-on-surface-variant/70 font-semibold">{plans.length} total plans</span>
          </div>

          <div className="space-y-6">
            {plans.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-low/20 border border-outline-variant/10 rounded-2xl border-dashed">
                <p className="text-sm text-on-surface-variant/70">No reading plans active. Create one to begin your target tracking.</p>
              </div>
            ) : (
              plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  covers={covers}
                  dbBooks={dbBooks}
                  handleTogglePlan={handleTogglePlan}
                  handleDeletePlan={handleDeletePlan}
                  toggleDateCompletion={toggleDateCompletion}
                  getCurrentWeekDays={getCurrentWeekDays}
                  getPlanProgress={getPlanProgress}
                  onNavigateToBook={(bookId) => navigate(`/book-details/${bookId}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar Column: Heatmap & Streaks */}
        <div className="space-y-8">
          {/* Reading Heatmap */}
          <ReadingHeatmap readingLog={readingLog} />

          {/* Reading Streak Card */}
          <div className="bg-surface-container-low/40 border border-outline-variant/15 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25">
                <FiZap className="w-5 h-5 text-amber-500 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface font-sans">Streak Tracker</h3>
                <p className="text-[11px] text-on-surface-variant/80 font-medium">Keep check-ins constant.</p>
              </div>
            </div>

            <div className="text-center py-2 flex items-baseline justify-center gap-1.5">
              <span className="text-4xl font-extrabold text-amber-500 font-serif">{streakDays}</span>
              <span className="text-[10px] font-bold text-on-surface-variant/85 uppercase tracking-widest">Days Streak</span>
            </div>
          </div>

          {/* Achievements list */}
          <div className="bg-surface-container-low/40 border border-outline-variant/15 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10 pb-3 flex items-center gap-2">
              <FiAward className="w-4 h-4 text-tertiary" />
              <span>Milestones Unlocked</span>
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary text-[10px] shrink-0 font-extrabold shadow-sm">I</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">First Ebook Imported</p>
                  <p className="text-[10px] text-on-surface-variant/75 truncate">Expanded the private digital archive</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] shrink-0 font-extrabold shadow-sm">II</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{streakDays >= 10 ? "10 Days Streak Achieved" : "10 Days Streak"}</p>
                  <p className="text-[10px] text-on-surface-variant/75 truncate">Established persistent reading habits</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-surface-container-high border border-outline-variant/15 flex items-center justify-center text-on-surface-variant/55 text-[10px] shrink-0 font-extrabold shadow-sm">III</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface-variant truncate">Scholarly Mastermind</p>
                  <p className="text-[10px] text-on-surface-variant/65 truncate">Read 5 hours total within one week</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Plan Builder Modal */}
      <PlanCreatorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        dbBooks={dbBooks}
        onSubmit={handleCreatePlan}
      />

    </div>
  );
};

export default BookPlansPage;
