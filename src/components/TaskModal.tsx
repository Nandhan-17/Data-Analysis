'use client';

import React, { useState } from 'react';
import { TaskItem } from '../types/project';
import { X, Calendar, User, Clock, AlertTriangle, CheckCircle2, Sparkles, Sliders } from 'lucide-react';

interface TaskModalProps {
  task: TaskItem | null;
  onClose: () => void;
  onUpdateProgress: (taskId: string, newProgress: number) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onUpdateProgress }) => {
  if (!task) return null;

  const [tempProgress, setTempProgress] = useState<number>(task.progress);

  const handleSave = () => {
    onUpdateProgress(task.id, tempProgress);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative bg-slate-900/95 overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Badge */}
        <div className="flex items-center space-x-2.5 mb-4">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {task.id}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {task.projectName}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{task.taskName}</h3>
        <p className="text-xs text-slate-400 mb-5">
          Enterprise operational task telemetry &amp; live progress controls
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center text-slate-400 mb-1">
              <User className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Assigned Member
            </div>
            <div className="font-bold text-slate-100">{task.assignedTo}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 mr-1 text-purple-400" /> Days Required
            </div>
            <div className="font-bold text-slate-100">{task.daysRequired} Days</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Timeline Window
            </div>
            <div className="font-mono text-slate-200 text-[11px]">{task.startDate} &rarr; {task.endDate}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center text-slate-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" /> Calculated Risk
            </div>
            <div className={`font-bold ${task.riskLevel === 'High Risk' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {task.riskLevel}
            </div>
          </div>
        </div>

        {/* Progress Slider simulation */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/20 mb-6">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Simulated Completion Rate
            </span>
            <span className="font-mono font-extrabold text-indigo-400 text-sm">{tempProgress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={tempProgress}
            onChange={(e) => setTempProgress(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0% (Not Started)</span>
            <span>50% (In Progress)</span>
            <span>100% (Completed)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Save Telemetry
          </button>
        </div>

      </div>
    </div>
  );
};
