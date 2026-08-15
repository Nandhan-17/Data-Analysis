'use client';

import React, { useState, useMemo } from 'react';
import { UserRole, FilterState, TaskItem } from '../types/project';
import { INITIAL_TASKS, UNIQUE_PROJECTS, UNIQUE_TEAM_MEMBERS } from '../data/mockData';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { KpiCards } from '../components/KpiCards';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { GanttChart } from '../components/GanttChart';
import { TaskTable } from '../components/TaskTable';
import { TaskModal } from '../components/TaskModal';
import { Cpu, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [selectedTaskModal, setSelectedTaskModal] = useState<TaskItem | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    projectName: 'ALL',
    assignedTo: 'ALL',
    status: 'ALL',
    searchQuery: '',
  });

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      projectName: 'ALL',
      assignedTo: 'ALL',
      status: 'ALL',
      searchQuery: '',
    });
  };

  // Filter tasks based on active state
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Project Filter
      if (filters.projectName !== 'ALL' && task.projectName !== filters.projectName) {
        return false;
      }
      // 2. Assigned To Filter
      if (filters.assignedTo !== 'ALL' && task.assignedTo !== filters.assignedTo) {
        return false;
      }
      // 3. Status Filter
      if (filters.status !== 'ALL' && task.status !== filters.status) {
        return false;
      }
      // 4. Search Query Filter
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = task.taskName.toLowerCase().includes(q);
        const matchesProject = task.projectName.toLowerCase().includes(q);
        const matchesAssigned = task.assignedTo.toLowerCase().includes(q);
        if (!matchesName && !matchesProject && !matchesAssigned) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, filters]);

  // Update Task Progress in State
  const handleUpdateProgress = (taskId: string, newProgress: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus =
            newProgress === 100
              ? 'Completed'
              : newProgress > 0
              ? 'In Progress'
              : 'Not Started';
          const newRisk =
            newProgress < 50 && t.daysRequired > 25
              ? 'High Risk'
              : (newProgress < 50 && t.daysRequired >= 20) ||
                (newProgress >= 50 && newProgress < 80 && t.daysRequired > 25)
              ? 'Medium Risk'
              : 'Low Risk';
          return {
            ...t,
            progress: newProgress,
            status: newStatus,
            riskLevel: newRisk,
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header & Role Switcher */}
      <Header currentRole={currentRole} onRoleChange={setCurrentRole} />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          uniqueProjects={UNIQUE_PROJECTS}
          uniqueMembers={UNIQUE_TEAM_MEMBERS}
          totalFiltered={filteredTasks.length}
          totalAll={tasks.length}
        />

        {/* Dynamic KPI Cards */}
        <KpiCards tasks={filteredTasks} allTasks={tasks} />

        {/* Recharts Engine Visualizations & AI Executive Insights */}
        <AnalyticsCharts tasks={filteredTasks} currentRole={currentRole} />

        {/* Interactive Gantt Chart Timeline View */}
        <GanttChart tasks={filteredTasks} onSelectTask={setSelectedTaskModal} />

        {/* Advanced Task Data Matrix Table */}
        <TaskTable tasks={filteredTasks} onSelectTask={setSelectedTaskModal} />

      </main>

      {/* Task Inspection & Telemetry Modal */}
      <TaskModal
        task={selectedTaskModal}
        onClose={() => setSelectedTaskModal(null)}
        onUpdateProgress={handleUpdateProgress}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">NexusAI Enterprise Platform</span>
            <span>&bull; Powered by Next.js, Tailwind CSS &amp; Recharts Engine</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 46 Dataset Tasks Parsed</span>
            <span>Baseline Avg Progress: <strong className="text-slate-300 font-mono">36.89%</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
