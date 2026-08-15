'use client';

import React from 'react';
import { UserRole } from '../types/project';
import { Sparkles, Shield, UserCheck, Briefcase, Activity } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange }) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & AI Title */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Nexus<span className="text-indigo-400">AI</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Enterprise v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Project Health & Productivity Intelligence Platform
            </p>
          </div>
        </div>

        {/* Status Badge & Role Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Operational Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>AI Telemetry: <strong className="text-emerald-400 font-medium">Live</strong></span>
          </div>

          {/* Role Switcher Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-inner">
            <span className="text-xs text-slate-400 pl-2 font-medium flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Role:
            </span>
            <div className="relative">
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 cursor-pointer transition-all hover:bg-slate-750"
              >
                <option value="Admin">Admin View</option>
                <option value="Project Manager">Project Manager</option>
                <option value="HR Viewer">HR Viewer</option>
              </select>
            </div>
          </div>

          {/* Role Badge Indicator */}
          <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/30 text-indigo-300">
            {currentRole === 'Admin' && <Shield className="w-3.5 h-3.5 text-indigo-400" />}
            {currentRole === 'Project Manager' && <Briefcase className="w-3.5 h-3.5 text-purple-400" />}
            {currentRole === 'HR Viewer' && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{currentRole} Access</span>
          </div>
        </div>

      </div>
    </header>
  );
};
