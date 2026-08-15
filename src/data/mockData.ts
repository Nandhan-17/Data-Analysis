import { TaskItem, TaskStatus, RiskLevel } from '../types/project';

const determineStatus = (progress: number): TaskStatus => {
  if (progress === 100) return 'Completed';
  if (progress > 0) return 'In Progress';
  return 'Not Started';
};

const calculateRiskLevel = (progress: number, daysRequired: number): RiskLevel => {
  if (progress < 50 && daysRequired > 25) return 'High Risk';
  if ((progress < 50 && daysRequired >= 20) || (progress >= 50 && progress < 80 && daysRequired > 25)) {
    return 'Medium Risk';
  }
  return 'Low Risk';
};

export const RAW_TASKS_DATA = [
  { id: 'TSK-001', projectName: 'Marketing', taskName: 'Market Research', assignedTo: 'Alice', startDate: '01-01-2024', daysRequired: 13, endDate: '14-01-2024', progress: 78 },
  { id: 'TSK-002', projectName: 'Marketing', taskName: 'Content Creation', assignedTo: 'Bob', startDate: '14-01-2024', daysRequired: 14, endDate: '28-01-2024', progress: 100 },
  { id: 'TSK-003', projectName: 'Marketing', taskName: 'Social Media Planning', assignedTo: 'Charlie', startDate: '28-01-2024', daysRequired: 22, endDate: '19-02-2024', progress: 45 },
  { id: 'TSK-004', projectName: 'Marketing', taskName: 'Campaign Analysis', assignedTo: 'Daisy', startDate: '18-02-2024', daysRequired: 25, endDate: '14-03-2024', progress: 0 },
  { id: 'TSK-005', projectName: 'Product Dev', taskName: 'Prototype Development', assignedTo: 'Ethan', startDate: '02-01-2024', daysRequired: 18, endDate: '20-01-2024', progress: 100 },
  { id: 'TSK-006', projectName: 'Product Dev', taskName: 'Quality Assurance', assignedTo: 'Fiona', startDate: '20-01-2024', daysRequired: 10, endDate: '30-01-2024', progress: 78 },
  { id: 'TSK-007', projectName: 'Product Dev', taskName: 'User Interface Design', assignedTo: 'Gabriel', startDate: '04-02-2024', daysRequired: 25, endDate: '29-02-2024', progress: 0 },
  { id: 'TSK-008', projectName: 'Customer Svc', taskName: 'Service Improvement', assignedTo: 'Hannah', startDate: '01-02-2024', daysRequired: 22, endDate: '23-02-2024', progress: 100 },
  { id: 'TSK-009', projectName: 'Customer Svc', taskName: 'Ticket Resolution', assignedTo: 'Ian', startDate: '24-02-2024', daysRequired: 25, endDate: '20-03-2024', progress: 100 },
  { id: 'TSK-010', projectName: 'Customer Svc', taskName: 'Customer Feedback', assignedTo: 'Julia', startDate: '21-03-2024', daysRequired: 30, endDate: '20-04-2024', progress: 0 },
  { id: 'TSK-011', projectName: 'Financial', taskName: 'Budget Analysis', assignedTo: 'Kevin', startDate: '02-02-2024', daysRequired: 22, endDate: '24-02-2024', progress: 10 },
  { id: 'TSK-012', projectName: 'Financial', taskName: 'Financial Reporting', assignedTo: 'Mark', startDate: '13-02-2024', daysRequired: 21, endDate: '09-03-2024', progress: 78 },
  { id: 'TSK-013', projectName: 'Financial', taskName: 'Investment Planning', assignedTo: 'Mark', startDate: '19-03-2024', daysRequired: 25, endDate: '13-04-2024', progress: 100 },
  { id: 'TSK-014', projectName: 'Research', taskName: 'Market Trends Analysis', assignedTo: 'Nathan', startDate: '02-01-2024', daysRequired: 23, endDate: '25-01-2024', progress: 50 },
  { id: 'TSK-015', projectName: 'Research', taskName: 'Data Collection', assignedTo: 'Olivia', startDate: '26-01-2024', daysRequired: 32, endDate: '27-02-2024', progress: 0 },
  { id: 'TSK-016', projectName: 'Research', taskName: 'Research Paper Writing', assignedTo: 'Peter', startDate: '28-02-2024', daysRequired: 27, endDate: '26-03-2024', progress: 0 },
  { id: 'TSK-017', projectName: 'Development', taskName: 'Software Development', assignedTo: 'Quinn', startDate: '02-01-2024', daysRequired: 36, endDate: '07-02-2024', progress: 100 },
  { id: 'TSK-018', projectName: 'Development', taskName: 'Feature Enhancement', assignedTo: 'Rachel', startDate: '08-02-2024', daysRequired: 34, endDate: '13-03-2024', progress: 0 },
  { id: 'TSK-019', projectName: 'Development', taskName: 'Code Review', assignedTo: 'Sam', startDate: '14-03-2024', daysRequired: 30, endDate: '13-04-2024', progress: 0 },
  { id: 'TSK-020', projectName: 'Production', taskName: 'Manufacturing', assignedTo: 'Tim', startDate: '03-01-2024', daysRequired: 47, endDate: '19-02-2024', progress: 30 },
  { id: 'TSK-021', projectName: 'Production', taskName: 'Quality Control', assignedTo: 'Ursula', startDate: '17-02-2024', daysRequired: 27, endDate: '15-03-2024', progress: 0 },
  { id: 'TSK-022', projectName: 'Production', taskName: 'Packaging Design', assignedTo: 'Victor', startDate: '14-03-2024', daysRequired: 22, endDate: '05-04-2024', progress: 0 },
  { id: 'TSK-023', projectName: 'Sales', taskName: 'Lead Generation', assignedTo: 'Wendy', startDate: '03-01-2024', daysRequired: 60, endDate: '03-03-2024', progress: 70 },
  { id: 'TSK-024', projectName: 'Sales', taskName: 'Client Meetings', assignedTo: 'Xavier', startDate: '06-01-2024', daysRequired: 20, endDate: '26-01-2024', progress: 78 },
  { id: 'TSK-025', projectName: 'Sales', taskName: 'Contract Negotiation', assignedTo: 'Yvette', startDate: '03-02-2024', daysRequired: 35, endDate: '09-03-2024', progress: 0 },
  { id: 'TSK-026', projectName: 'Support', taskName: 'Technical Support', assignedTo: 'Zoe', startDate: '01-01-2024', daysRequired: 25, endDate: '26-01-2024', progress: 100 },
  { id: 'TSK-027', projectName: 'Support', taskName: 'Bug Fixes', assignedTo: 'Aaron', startDate: '27-01-2024', daysRequired: 31, endDate: '27-02-2024', progress: 100 },
  { id: 'TSK-028', projectName: 'Support', taskName: 'Software Updates', assignedTo: 'Bella', startDate: '02-03-2024', daysRequired: 22, endDate: '24-03-2024', progress: 0 },
  { id: 'TSK-029', projectName: 'Operations', taskName: 'Process Optimization', assignedTo: 'Calvin', startDate: '03-01-2024', daysRequired: 30, endDate: '02-02-2024', progress: 40 },
  { id: 'TSK-030', projectName: 'Operations', taskName: 'Inventory Management', assignedTo: 'Diane', startDate: '03-02-2024', daysRequired: 25, endDate: '28-02-2024', progress: 0 },
  { id: 'TSK-031', projectName: 'Operations', taskName: 'Facility Maintenance', assignedTo: 'Edward', startDate: '29-02-2024', daysRequired: 20, endDate: '20-03-2024', progress: 0 },
  { id: 'TSK-032', projectName: 'Consulting', taskName: 'Strategic Planning', assignedTo: 'Fiona', startDate: '02-01-2024', daysRequired: 35, endDate: '06-02-2024', progress: 60 },
  { id: 'TSK-033', projectName: 'Consulting', taskName: 'Market Expansion', assignedTo: 'Gary', startDate: '02-02-2024', daysRequired: 32, endDate: '05-03-2024', progress: 0 },
  { id: 'TSK-034', projectName: 'Consulting', taskName: 'Client Advisory', assignedTo: 'Helen', startDate: '06-03-2024', daysRequired: 25, endDate: '31-03-2024', progress: 0 },
  { id: 'TSK-035', projectName: 'Training', taskName: 'Employee Training', assignedTo: 'Isaac', startDate: '04-01-2024', daysRequired: 27, endDate: '31-01-2024', progress: 80 },
  { id: 'TSK-036', projectName: 'Training', taskName: 'Certification Programs', assignedTo: 'Jane', startDate: '28-01-2024', daysRequired: 30, endDate: '27-02-2024', progress: 0 },
  { id: 'TSK-037', projectName: 'Training', taskName: 'Skill Development', assignedTo: 'Kyle', startDate: '28-02-2024', daysRequired: 22, endDate: '21-03-2024', progress: 0 },
  { id: 'TSK-038', projectName: 'Events', taskName: 'Event Planning', assignedTo: 'Laura', startDate: '03-01-2024', daysRequired: 25, endDate: '28-01-2024', progress: 30 },
  { id: 'TSK-039', projectName: 'Events', taskName: 'Conference Management', assignedTo: 'Mike', startDate: '03-02-2024', daysRequired: 20, endDate: '23-02-2024', progress: 0 },
  { id: 'TSK-040', projectName: 'Events', taskName: 'Sponsorship Coordination', assignedTo: 'Nancy', startDate: '24-02-2024', daysRequired: 35, endDate: '30-03-2024', progress: 0 },
  { id: 'TSK-041', projectName: 'Logistics', taskName: 'Supply Chain Management', assignedTo: 'Oscar', startDate: '03-01-2024', daysRequired: 25, endDate: '28-01-2024', progress: 50 },
  { id: 'TSK-042', projectName: 'Logistics', taskName: 'Transportation Planning', assignedTo: 'Patricia', startDate: '29-01-2024', daysRequired: 30, endDate: '28-02-2024', progress: 100 },
  { id: 'TSK-043', projectName: 'Logistics', taskName: 'Inventory Optimization', assignedTo: 'Quentin', startDate: '29-03-2024', daysRequired: 20, endDate: '18-04-2024', progress: 0 },
  { id: 'TSK-044', projectName: 'Engineering', taskName: 'Product Design', assignedTo: 'Rachel', startDate: '02-01-2024', daysRequired: 25, endDate: '27-01-2024', progress: 20 },
  { id: 'TSK-045', projectName: 'Engineering', taskName: 'System Integration', assignedTo: 'Sam', startDate: '02-02-2024', daysRequired: 22, endDate: '24-02-2024', progress: 0 },
  { id: 'TSK-046', projectName: 'Engineering', taskName: 'Prototype Testing', assignedTo: 'Tom', startDate: '23-02-2024', daysRequired: 27, endDate: '21-03-2024', progress: 0 },
];

export const INITIAL_TASKS: TaskItem[] = RAW_TASKS_DATA.map((t) => ({
  ...t,
  status: determineStatus(t.progress),
  riskLevel: calculateRiskLevel(t.progress, t.daysRequired),
}));

export const UNIQUE_PROJECTS = Array.from(
  new Set(INITIAL_TASKS.map((t) => t.projectName))
).sort();

export const UNIQUE_TEAM_MEMBERS = Array.from(
  new Set(INITIAL_TASKS.map((t) => t.assignedTo))
).sort();
