'use client';

import React from 'react';
import { TaskItem } from '../types/project';
import { Layers, CheckSquare, TrendingUp, AlertTriangle, ArrowUpRight, Clock, Target } from 'lucide-react';

interface KpiCardsProps {
  tasks: TaskItem[];
  allTasks: TaskItem[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ tasks, allTasks }) => {
  const totalTasks = tasks.length;
  const uniqueProjectsCount = new Set(tasks.map((t) => t.projectName)).size;
  
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const notStartedCount = tasks.filter((t) => t.status === 'Not Started').length;

  const avgCompletion = totalTasks > 0
    ? (tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks).toFixed(2)
    : '0.00';

  const highRiskCount = tasks.filter((t) => t.riskLevel === 'High Risk').length;
  const highRiskPercentage = totalTasks > 0 ? ((highRiskCount / totalTasks) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Total Active Projects */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> Active Domains
          </span>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{uniqueProjectsCount}</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">Total Unique Projects</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>Target Domains</span>
          <span className="font-semibold text-slate-200">15 Corporate Units</span>
        </div>
      </div>

      {/* 2. Total Tracked Tasks */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {totalTasks} Total
          </span>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{totalTasks}</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">Tracked Enterprise Tasks</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
          <span className="text-emerald-400 font-semibold">{completedCount} Done</span>
          <span className="text-blue-400 font-semibold">{inProgressCount} Active</span>
          <span className="text-slate-400 font-semibold">{notStartedCount} Pending</span>
        </div>
      </div>

      {/* 3. Average Completion Rate */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Target className="w-3 h-3" /> Baseline 36.89%
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{avgCompletion}%</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Avg Progress Rate</p>
          </div>
          
          {/* Mini Radial Gauge */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="18" stroke="#1e293b" strokeWidth="4" fill="transparent" />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="#6366f1"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * Number(avgCompletion)) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 w-full bg-slate-900/50 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Number(avgCompletion))}%` }}
          />
        </div>
      </div>

      {/* 4. High Risk / Delay Alert Count */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {highRiskPercentage}% Impact
          </span>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-rose-400 tracking-tight">{highRiskCount}</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">High Risk / Delay Alerts</p>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-rose-400" /> Threshold:</span>
          <span className="font-semibold text-slate-300">Progress &lt;50% &amp; Days &gt;25</span>
        </div>
      </div>

    </div>
  );
};
