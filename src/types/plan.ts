export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  targetPagesPerDay: number;
  durationDays: number;
  active: boolean;
  startDate: string;
  bookId: number | null;
  progressPercentage?: number;
  completedDates: string[];
}
