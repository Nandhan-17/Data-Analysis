'use client';

import React from 'react';
import { TaskItem, UserRole } from '../types/project';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Sparkles, BarChart3, Users, PieChart as PieIcon, ShieldAlert, Cpu } from 'lucide-react';

interface AnalyticsChartsProps {
  tasks: TaskItem[];
  currentRole: UserRole;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ tasks, currentRole }) => {
  // 1. Calculate Average Progress per Project
  const projectMap: Record<string, { totalProgress: number; count: number }> = {};
  tasks.forEach((t) => {
    if (!projectMap[t.projectName]) {
      projectMap[t.projectName] = { totalProgress: 0, count: 0 };
    }
    projectMap[t.projectName].totalProgress += t.progress;
    projectMap[t.projectName].count += 1;
  });

  const projectChartData = Object.keys(projectMap)
    .map((name) => ({
      name,
      avgProgress: Math.round(projectMap[name].totalProgress / projectMap[name].count),
      taskCount: projectMap[name].count,
    }))
    .sort((a, b) => b.avgProgress - a.avgProgress);

  // 2. Calculate Workload Heatmap / Task Distribution per Team Member
  const memberMap: Record<string, { taskCount: number; highRiskCount: number }> = {};
  tasks.forEach((t) => {
    if (!memberMap[t.assignedTo]) {
      memberMap[t.assignedTo] = { taskCount: 0, highRiskCount: 0 };
    }
    memberMap[t.assignedTo].taskCount += 1;
    if (t.riskLevel === 'High Risk') {
      memberMap[t.assignedTo].highRiskCount += 1;
    }
  });

  const workloadChartData = Object.keys(memberMap)
    .map((assignedTo) => ({
      assignedTo,
      taskCount: memberMap[assignedTo].taskCount,
      highRiskCount: memberMap[assignedTo].highRiskCount,
    }))
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 10); // Top 10 members

  // 3. Task Status Donut Data
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const notStartedCount = tasks.filter((t) => t.status === 'Not Started').length;

  const statusPieData = [
    { name: 'Completed (100%)', value: completedCount, color: '#10b981' },
    { name: 'In Progress (1-99%)', value: inProgressCount, color: '#3b82f6' },
    { name: 'Not Started (0%)', value: notStartedCount, color: '#64748b' },
  ];

  // 4. Role-Based AI Executive Summary Generation
  const highRiskCount = tasks.filter((t) => t.riskLevel === 'High Risk').length;
  const topBottleneckProject = projectChartData.length > 0 ? projectChartData[projectChartData.length - 1] : null;
  const topContributor = workloadChartData.length > 0 ? workloadChartData[0] : null;

  const renderAiSummary = () => {
    if (currentRole === 'Admin') {
      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="flex items-start gap-2">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 font-bold shrink-0">ADMIN</span>
            Overall system health shows <strong className="text-white">{tasks.length} active tasks</strong> with <strong className="text-rose-400">{highRiskCount} high-risk bottlenecks</strong> requiring executive priority intervention.
          </p>
          <p className="flex items-start gap-2">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">OPTIMIZATION</span>
            Top executing domain: <strong className="text-emerald-400">{projectChartData[0]?.name || 'N/A'}</strong> ({projectChartData[0]?.avgProgress || 0}% avg completion). Lowest domain velocity: <strong className="text-rose-400">{topBottleneckProject?.name || 'N/A'}</strong>.
          </p>
        </div>
      );
    }

    if (currentRole === 'Project Manager') {
      return (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="flex items-start gap-2">
            <span className="p-1 rounded bg-purple-500/20 text-purple-400 font-bold shrink-0">PM FOCUS</span>
            <strong className="text-rose-400">{highRiskCount} tasks</strong> exceed 25 days duration with under 50% completion. Prioritize schedule re-baselining for Development, Engineering, and Operations units.
          </p>
          <p className="flex items-start gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400 font-bold shrink-0">RECOMMENDATION</span>
            Reassign upcoming tasks from heavy bandwidth contributors to prevent schedule slip in upcoming Q2 milestones.
          </p>
        </div>
      );
    }

    // HR Viewer
    return (
      <div className="space-y-3 text-xs leading-relaxed text-slate-300">
        <p className="flex items-start gap-2">
          <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">HR BANDWIDTH</span>
          Top assigned individual: <strong className="text-indigo-300">{topContributor?.assignedTo || 'N/A'}</strong> with <strong className="text-indigo-300">{topContributor?.taskCount || 0} active assignments</strong>. Monitor burnout metrics.
        </p>
        <p className="flex items-start gap-2">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">TEAM BALANCE</span>
          Total team roster count across filtered dataset is <strong className="text-white">{Object.keys(memberMap).length} members</strong>. Resource distribution is optimal across customer-facing roles.
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* 1. Project Progress Bar Chart (Spans 2 Cols) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Project Progress Overview</h2>
              <p className="text-xs text-slate-400">Average completion percentage (%) per domain</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
            {projectChartData.length} Projects
          </span>
        </div>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectChartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                formatter={(value: any) => [`${value}% Avg Progress`, 'Completion']}
              />
              <Bar dataKey="avgProgress" radius={[6, 6, 0, 0]}>
                {projectChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.avgProgress >= 70
                        ? '#10b981'
                        : entry.avgProgress >= 35
                        ? '#6366f1'
                        : '#f43f5e'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Task Status Donut Chart */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Status Distribution</h2>
              <p className="text-xs text-slate-400">Tasks grouped by completion tier</p>
            </div>
          </div>
        </div>

        <div className="w-full h-[220px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {statusPieData.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Workload Heatmap / Task Distribution Bar Chart (Spans 2 Cols) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Team Workload Distribution</h2>
              <p className="text-xs text-slate-400">Assigned task counts per individual (Top 10)</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
            Bandwidth Matrix
          </span>
        </div>

        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="assignedTo" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="taskCount" name="Total Assigned Tasks" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="highRiskCount" name="High Risk Tasks" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. AI Executive Summary & Productivity Engine Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between bg-gradient-to-b from-slate-900/90 to-indigo-950/40 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-indigo-200 flex items-center gap-1.5">
                  NexusAI Insights <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h2>
                <p className="text-xs text-slate-400">Contextual Telemetry Engine</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentRole}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-indigo-500/20 shadow-inner">
            {renderAiSummary()}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Real-time Alerting</span>
          <span className="text-indigo-400 font-semibold cursor-pointer hover:underline">View AI Recommendations &rarr;</span>
        </div>
      </div>

    </div>
  );
};
