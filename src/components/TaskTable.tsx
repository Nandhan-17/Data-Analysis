'use client';

import React, { useState } from 'react';
import { TaskItem, TaskStatus, RiskLevel } from '../types/project';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDashed,
  Table as TableIcon,
} from 'lucide-react';

interface TaskTableProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
}

type SortField = 'projectName' | 'taskName' | 'assignedTo' | 'daysRequired' | 'progress' | 'riskLevel';
type SortOrder = 'asc' | 'desc';

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onSelectTask }) => {
  const [sortField, setSortField] = useState<SortField>('projectName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Sorting Logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage) || 1;
  const paginatedTasks = sortedTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
            100% Done
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3 mr-1 text-blue-400" />
            In Progress
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <CircleDashed className="w-3 h-3 mr-1 text-slate-400" />
            Not Started
          </span>
        );
    }
  };

  const renderRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'High Risk':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" />
            High Risk
          </span>
        );
      case 'Medium Risk':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20">
            Medium
          </span>
        );
      case 'Low Risk':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Low
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl mb-8">
      
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Enterprise Task Management Matrix</h2>
            <p className="text-xs text-slate-400">Searchable, sortable, and risk-evaluated task registry</p>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-400">
          Page <strong className="text-slate-100">{currentPage}</strong> of{' '}
          <strong className="text-slate-100">{totalPages}</strong>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('projectName')}>
                <div className="flex items-center space-x-1">
                  <span>Project Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('taskName')}>
                <div className="flex items-center space-x-1">
                  <span>Task Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('assignedTo')}>
                <div className="flex items-center space-x-1">
                  <span>Assigned To</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Timeline (Start - End)</th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('daysRequired')}>
                <div className="flex items-center space-x-1">
                  <span>Days</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('progress')}>
                <div className="flex items-center space-x-1">
                  <span>Progress</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('riskLevel')}>
                <div className="flex items-center space-x-1">
                  <span>Risk Level</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No matching tasks found. Adjust active filter settings.
                </td>
              </tr>
            ) : (
              paginatedTasks.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-900/60 transition-colors group"
                >
                  <td className="py-3 px-3 font-semibold text-indigo-300">{t.projectName}</td>
                  <td className="py-3 px-3 font-medium text-slate-100 group-hover:text-indigo-200">{t.taskName}</td>
                  <td className="py-3 px-3 text-slate-300">{t.assignedTo}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {t.startDate} &rarr; {t.endDate}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{t.daysRequired}d</td>
                  
                  {/* Progress Bar + Text */}
                  <td className="py-3 px-3 min-w-[120px]">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            t.progress === 100
                              ? 'bg-emerald-500'
                              : t.progress >= 50
                              ? 'bg-indigo-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[11px] text-slate-200 w-8 text-right">
                        {t.progress}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3">{renderStatusBadge(t.status)}</td>
                  <td className="py-3 px-3">{renderRiskBadge(t.riskLevel)}</td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectTask(t)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
                      title="Inspect Task Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800 text-xs">
        <div className="text-slate-400">
          Showing {sortedTasks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, sortedTasks.length)} of {sortedTasks.length} entries
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-bold text-indigo-400">
            {currentPage}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
