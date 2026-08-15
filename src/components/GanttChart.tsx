'use client';

import React, { useState } from 'react';
import { TaskItem } from '../types/project';
import { Calendar, ChevronRight, Clock, AlertCircle } from 'lucide-react';

interface GanttChartProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
}

// Convert DD-MM-YYYY string to Date object
const parseDDMMYYYY = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date();
};

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, onSelectTask }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Define overall timeline bounds (Jan 1, 2024 to Apr 30, 2024)
  const timelineStart = new Date(2024, 0, 1).getTime();
  const timelineEnd = new Date(2024, 3, 30).getTime();
  const totalDurationMs = timelineEnd - timelineStart;

  const monthHeaders = [
    { label: 'Jan 2024', widthPercent: 25.8 }, // 31 days / 120
    { label: 'Feb 2024', widthPercent: 24.2 }, // 29 days / 120
    { label: 'Mar 2024', widthPercent: 25.8 }, // 31 days / 120
    { label: 'Apr 2024', widthPercent: 24.2 }, // 29 days / 120
  ];

  const uniqueProjects = Array.from(new Set(tasks.map((t) => t.projectName))).sort();

  const filteredTasks = selectedCategory === 'ALL'
    ? tasks
    : tasks.filter((t) => t.projectName === selectedCategory);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 mb-6 shadow-xl">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Interactive Task Gantt Timeline
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Live Schedule View
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Visualizing task duration spans and completion progress overlays (Jan - Apr 2024)
            </p>
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl text-xs">
          <span className="text-slate-400 font-medium pl-1">Domain:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1 outline-none border border-slate-700 cursor-pointer"
          >
            <option value="ALL">All Domains ({uniqueProjects.length})</option>
            {uniqueProjects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px]">
          
          {/* Month Header Grid */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl mb-3 text-xs font-bold text-slate-300 py-2.5 px-3">
            <div className="w-1/3 min-w-[240px] pl-2 text-slate-400">Task &amp; Assigned Owner</div>
            <div className="w-2/3 flex items-center">
              {monthHeaders.map((m, idx) => (
                <div
                  key={idx}
                  className="text-center text-slate-300 border-l border-slate-800 first:border-l-0"
                  style={{ width: `${m.widthPercent}%` }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Task Timeline Rows */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                No tasks found matching timeline criteria.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const sDate = parseDDMMYYYY(t.startDate).getTime();
                const eDate = parseDDMMYYYY(t.endDate).getTime();

                // Calculate relative percentages
                const leftPercent = Math.max(0, Math.min(100, ((sDate - timelineStart) / totalDurationMs) * 100));
                const endPercent = Math.max(0, Math.min(100, ((eDate - timelineStart) / totalDurationMs) * 100));
                const widthPercent = Math.max(2, endPercent - leftPercent);

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="flex items-center bg-slate-900/40 hover:bg-slate-850/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl py-2 px-3 transition-all cursor-pointer group"
                  >
                    {/* Left Details Column */}
                    <div className="w-1/3 min-w-[240px] pr-4">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="font-semibold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                          {t.taskName}
                        </span>
                        {t.riskLevel === 'High Risk' && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                          {t.projectName}
                        </span>
                        <span>&bull;</span>
                        <span>{t.assignedTo}</span>
                        <span>&bull;</span>
                        <span className="text-slate-300 font-medium">{t.daysRequired}d</span>
                      </div>
                    </div>

                    {/* Timeline Bar Canvas Column */}
                    <div className="w-2/3 relative h-7 bg-slate-950/60 rounded-lg border border-slate-800/60 overflow-hidden flex items-center px-1">
                      
                      {/* Timeline grid subtle background lines */}
                      <div className="absolute inset-0 grid grid-cols-4 pointer-events-none divide-x divide-slate-800/40" />

                      {/* Main Task Span Bar */}
                      <div
                        className="absolute h-5 rounded-md transition-all flex items-center justify-between px-2 text-[10px] font-bold shadow-md"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor:
                            t.status === 'Completed'
                              ? '#065f46'
                              : t.riskLevel === 'High Risk'
                              ? '#9f1239'
                              : '#1e1b4b',
                          borderColor:
                            t.status === 'Completed'
                              ? '#10b981'
                              : t.riskLevel === 'High Risk'
                              ? '#f43f5e'
                              : '#6366f1',
                          borderWidth: '1px',
                        }}
                      >
                        {/* Progress Fill Bar inside span */}
                        <div
                          className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/80 to-purple-500/80 opacity-60 pointer-events-none"
                          style={{ width: `${t.progress}%` }}
                        />

                        {/* Progress Text Label */}
                        <span className="relative z-10 text-white font-mono text-[10px] drop-shadow">
                          {t.progress}%
                        </span>

                        <span className="relative z-10 text-slate-200 font-normal hidden md:inline text-[9px]">
                          {t.startDate} &rarr; {t.endDate}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Gantt Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" /> Completed (100%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500" /> In Progress (Overlay)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500" /> High Risk (&lt;50% &amp; &gt;25d)
          </span>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Click any row for task details
        </span>
      </div>

    </div>
  );
};
