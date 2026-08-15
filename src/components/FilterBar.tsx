'use client';

import React from 'react';
import { FilterState } from '../types/project';
import { Search, Filter, RotateCcw, FolderGit2, User, CheckCircle2 } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  uniqueProjects: string[];
  uniqueMembers: string[];
  totalFiltered: number;
  totalAll: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  uniqueProjects,
  uniqueMembers,
  totalFiltered,
  totalAll,
}) => {
  const isFiltered =
    filters.projectName !== 'ALL' ||
    filters.assignedTo !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.searchQuery !== '';

  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-slate-800 shadow-lg mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by task name, project, or assignee..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Project Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={filters.projectName}
              onChange={(e) => onFilterChange({ projectName: e.target.value })}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Projects ({uniqueProjects.length})</option>
              {uniqueProjects.map((proj) => (
                <option key={proj} value={proj} className="bg-slate-900 text-slate-200">
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
            <User className="w-3.5 h-3.5 text-violet-400" />
            <select
              value={filters.assignedTo}
              onChange={(e) => onFilterChange({ assignedTo: e.target.value })}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Members ({uniqueMembers.length})</option>
              {uniqueMembers.map((member) => (
                <option key={member} value={member} className="bg-slate-900 text-slate-200">
                  {member}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="Completed" className="bg-slate-900 text-emerald-400">Completed (100%)</option>
              <option value="In Progress" className="bg-slate-900 text-blue-400">In Progress (1-99%)</option>
              <option value="Not Started" className="bg-slate-900 text-slate-400">Not Started (0%)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

        </div>

        {/* Filtered Count indicator */}
        <div className="text-xs font-medium text-slate-400 self-end lg:self-center">
          Showing <span className="text-slate-100 font-bold">{totalFiltered}</span> of{' '}
          <span className="text-slate-100 font-bold">{totalAll}</span> tasks
        </div>

      </div>
    </div>
  );
};
