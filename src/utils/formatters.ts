import { ProgressItem } from "../types";

/**
 * Formats a date string into a human-readable relative time.
 * e.g. "Just now", "5m ago", "3h ago", "Yesterday", "4 days ago"
 */
export function formatLastRead(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never read";
  try {
    const dt = new Date(dateStr.replace(" ", "T"));
    const diffMs = new Date().getTime() - dt.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch {
    return dateStr;
  }
}

/**
 * Calculate the current reading streak in days from a list of progress records.
 * A streak is defined as consecutive days with reading activity, starting from today or yesterday.
 */
export function calculateStreak(progressList: ProgressItem[]): number {
  const dates = progressList
    .map((p) => (p.last_read_at ? p.last_read_at.split(" ")[0] : null))
    .filter((d): d is string => d !== null);
  const uniqueDates = Array.from(new Set(dates)).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const dateToYMD = (d: Date) => d.toISOString().split("T")[0];

  const todayStr = dateToYMD(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateToYMD(yesterday);

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let checkDate = new Date(uniqueDates[0]);
  let currentIdx = 0;

  while (currentIdx < uniqueDates.length) {
    const checkStr = dateToYMD(checkDate);
    if (uniqueDates[currentIdx] === checkStr) {
      streak++;
      currentIdx++;
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}
