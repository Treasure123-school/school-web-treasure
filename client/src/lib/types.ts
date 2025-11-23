export interface DashboardStats {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
} // fixed
export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  authorId: string;
  publishedAt: string;
  color?: string;
} // fixed
export interface GradeItem {
  subject: string;
  assessment: string;
  score: string;
  grade: string;
  maxScore?: number;
} // fixed
export interface AttendanceDay {
  day: string;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
} // fixed
export interface ClassScheduleItem {
  subject: string;
  class: string;
  room: string;
  students: number;
  time: string;
  status: 'upcoming' | 'completed' | 'current';
  color: string;
}
