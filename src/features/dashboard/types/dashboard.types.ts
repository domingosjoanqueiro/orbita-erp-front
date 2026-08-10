export interface CompanyDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalEnrollments: number;
  activeEnrollments: number;
  approvalRate: number;
  newStudentsThisMonth: number;
  newTeachersThisMonth: number;
  newEnrollmentsThisMonth: number;
  trends: {
    students: number;
    teachers: number;
    enrollments: number;
    approvalRate: number;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'student' | 'teacher' | 'enrollment' | 'grade' | 'payment' | 'system';
  title: string;
  description?: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: {
    name: string;
    avatar?: string;
  };
}

export interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'deadline' | 'event' | 'holiday' | 'task';
  location?: string;
  isVirtual?: boolean;
  participants?: number;
  isNotified?: boolean;
  isImportant?: boolean;
}

export interface CompanyDashboardData {
  stats: CompanyDashboardStats;
  activities: DashboardActivity[];
  events: DashboardEvent[];
  quickActions?: {
    label: string;
    icon: string;
    color: string;
    href: string;
  }[];
}