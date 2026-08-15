export type UserRole = 'Admin' | 'Project Manager' | 'HR Viewer';

export type TaskStatus = 'Completed' | 'In Progress' | 'Not Started';

export type RiskLevel = 'High Risk' | 'Medium Risk' | 'Low Risk';

export interface TaskItem {
  id: string;
  projectName: string;
  taskName: string;
  assignedTo: string;
  startDate: string; // DD-MM-YYYY
  daysRequired: number;
  endDate: string; // DD-MM-YYYY
  progress: number; // 0 to 100
  status: TaskStatus;
  riskLevel: RiskLevel;
}

export interface FilterState {
  projectName: string;
  assignedTo: string;
  status: string;
  searchQuery: string;
}

export interface ProjectProgressData {
  projectName: string;
  avgProgress: number;
  totalTasks: number;
  completedTasks: number;
  highRiskTasks: number;
}

export interface UserWorkloadData {
  assignedTo: string;
  taskCount: number;
  avgProgress: number;
  highRiskCount: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}
