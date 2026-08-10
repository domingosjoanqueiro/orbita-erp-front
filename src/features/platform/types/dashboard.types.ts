export interface PlatformStats {
  totalCompanies: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalSystemUsers: number;
  activeCompanies: number;
  inactiveCompanies: number;
  recentCompanies: {
    id: number;
    name: string;
    email: string;
    country: string;
    isActive: boolean;
    createdAt: string;
    usersCount: number;
  }[];
  recentSystemUsers: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isRoot: boolean;
    isActive: boolean;
    createdAt: string;
  }[];
}

export interface PlatformActivity {
  id: number;
  type: 'company_created' | 'user_created' | 'company_updated' | 'user_login';
  description: string;
  user: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
}