"use client";

import React, { useState, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* =========================================================
   TYPES & SCHEMAS
========================================================= */

export type StatusKey = "Completed" | "In Progress" | "Not Started" | "At Risk" | "Delayed";
export type RiskLevel = "Low" | "Medium" | "High";

export interface ProjectRecord {
  id: number;
  project: string;
  member: string;
  task: string;
  progress: number;
  status: StatusKey;
  risk: RiskLevel;
  department: string;
  weeklyTrend: number[];
}

export type Tab = "projects" | "team" | "analytics";

/* =========================================================
   MOCK / INITIAL DATA GENERATOR
========================================================= */

const INITIAL_DATA: ProjectRecord[] = [
  { id: 1, project: "Alpha AI Platform", member: "Karthik", task: "LLM Pipeline Setup", progress: 85, status: "In Progress", risk: "Low", department: "Data Science", weeklyTrend: [20, 40, 60, 75, 85] },
  { id: 2, project: "Cloud Storage Revamp", member: "Priya", task: "S3 Migration", progress: 100, status: "Completed", risk: "Low", department: "DevOps", weeklyTrend: [10, 30, 70, 90, 100] },
  { id: 3, project: "E-Commerce Gateway", member: "Arun", task: "Stripe Webhooks", progress: 45, status: "At Risk", risk: "High", department: "Backend", weeklyTrend: [15, 25, 35, 40, 45] },
  { id: 4, project: "Mobile App Refresh", member: "Deepa", task: "UI Glassmorphism Theme", progress: 30, status: "Delayed", risk: "High", department: "Frontend", weeklyTrend: [5, 10, 20, 25, 30] },
  { id: 5, project: "Analytics Dashboard", member: "Nandhan", task: "VBA & Next.js Integration", progress: 90, status: "In Progress", risk: "Medium", department: "Analytics", weeklyTrend: [30, 50, 70, 85, 90] },
  { id: 6, project: "Security Hardening", member: "Suresh", task: "OAuth2 Refresh", progress: 10, status: "Not Started", risk: "Low", department: "DevOps", weeklyTrend: [0, 0, 5, 5, 10] },
];

const GOOGLE_COLORS: Record<StatusKey, string> = {
  Completed: "#34A853",   // Google Green
  "In Progress": "#4285F4", // Google Blue
  "Not Started": "#FBBC04", // Google Yellow
  "At Risk": "#FF7043",     // Google Orange
  Delayed: "#EA4335",      // Google Red
};

/* =========================================================
   SPARKLINE SVG COMPONENT
========================================================= */

function Sparkline({ data, color = "#4285F4" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const width = 120;
  const height = 30;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function DashboardHome() {
  const [records] = useState<ProjectRecord[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  // Refs for PDF Export Pages
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  /* --- Data Filters & Calculations --- */
  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.project.toLowerCase().includes(q) ||
        r.member.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [records, search]);

  const metrics = useMemo(() => {
    const total = filteredRecords.length;
    const completed = filteredRecords.filter((r) => r.status === "Completed").length;
    const highRisk = filteredRecords.filter((r) => r.risk === "High").length;
    const avgProgress = total ? Math.round(filteredRecords.reduce((acc, r) => acc + r.progress, 0) / total) : 0;

    return { total, completed, highRisk, avgProgress };
  }, [filteredRecords]);

  /* --- Multi-Page Visual PDF Export Handler --- */
  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF("landscape", "pt", "a4");

      const pages = [
        { ref: page1Ref },
        { ref: page2Ref },
        { ref: page3Ref },
      ];

      for (let i = 0; i < pages.length; i++) {
        const targetRef = pages[i].ref.current;
        if (!targetRef) continue;

        const canvas = await html2canvas(targetRef, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#F8FAFC",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Project_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800 font-sans">
      {/* Top Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Project Intelligence Hub</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Data Science Insights, Dynamic Analytics & Team Performance Dashboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
            </svg>
            <span>{isExporting ? "Generating PDF..." : "Export Multi-Page PDF"}</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="mb-8 flex gap-2 border-b border-slate-200">
        {(["projects", "team", "analytics"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold capitalize transition border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab === "projects" ? "All Projects" : tab}
          </button>
        ))}
      </nav>

      {/* PAGE 1: ALL PROJECTS */}
      <div
        ref={page1Ref}
        className={`bg-slate-50 p-6 rounded-2xl ${activeTab === "projects" ? "block" : "hidden"}`}
      >
        <h2 className="text-xl font-bold text-slate-900 mb-4">Executive Overview & Metrics</h2>

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Projects</span>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{metrics.total}</p>
            </div>
            <Sparkline data={[2, 4, 3, 5, 6]} color="#4285F4" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</span>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">{metrics.completed}</p>
            </div>
            <Sparkline data={[1, 2, 4, 5, 8]} color="#34A853" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">High Risk Alerts</span>
              <p className="mt-2 text-3xl font-extrabold text-red-600">{metrics.highRisk}</p>
            </div>
            <Sparkline data={[5, 4, 6, 3, 2]} color="#EA4335" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Completion</span>
              <p className="mt-2 text-3xl font-extrabold text-indigo-600">{metrics.avgProgress}%</p>
            </div>
            <Sparkline data={[10, 30, 45, 60, metrics.avgProgress]} color="#FBBC04" />
          </div>
        </section>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search by project, team member, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Weekly Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{r.project}</td>
                  <td className="px-6 py-4 font-medium text-slate-500">{r.department}</td>
                  <td className="px-6 py-4">{r.member}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${r.progress}%`, backgroundColor: GOOGLE_COLORS[r.status] }}
                        />
                      </div>
                      <span className="font-semibold text-xs">{r.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                      style={{ backgroundColor: `${GOOGLE_COLORS[r.status]}15`, color: GOOGLE_COLORS[r.status] }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Sparkline data={r.weeklyTrend} color={GOOGLE_COLORS[r.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 2: TEAM FUNNEL CHART */}
      <div
        ref={page2Ref}
        className={`bg-slate-50 p-6 rounded-2xl ${activeTab === "team" ? "block" : "hidden"}`}
      >
        <h2 className="text-xl font-bold text-slate-900 mb-2">Team Member Execution Funnel</h2>
        <p className="text-sm text-slate-500 mb-6">Visual workflow pipeline tracking file and task completions.</p>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="max-w-xl mx-auto flex flex-col items-center gap-3">
            <div className="w-full bg-blue-500 text-white font-bold py-4 text-center rounded-lg shadow-sm">
              Tasks Assigned (100 Files)
            </div>
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-blue-500" />

            <div className="w-[80%] bg-indigo-500 text-white font-bold py-4 text-center rounded-lg shadow-sm">
              In Progress / Processing (75 Files)
            </div>
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-indigo-500" />

            <div className="w-[60%] bg-amber-500 text-white font-bold py-4 text-center rounded-lg shadow-sm">
              Under Review / QA (50 Files)
            </div>
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-amber-500" />

            <div className="w-[40%] bg-emerald-500 text-white font-bold py-4 text-center rounded-lg shadow-sm">
              Fully Completed (35 Files)
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3: VISUAL ANALYTICS */}
      <div
        ref={page3Ref}
        className={`bg-slate-50 p-6 rounded-2xl ${activeTab === "analytics" ? "block" : "hidden"}`}
      >
        <h2 className="text-xl font-bold text-slate-900 mb-6">Visual Analytics & Distribution Matrix</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Project Velocity (Line Chart)</h3>
            <div className="h-48 flex items-end gap-6 border-b border-l border-slate-200 pb-2 pl-2">
              {[20, 35, 50, 65, 80, 95].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${val * 1.5}px` }} />
                  <span className="text-xs text-slate-400 font-semibold">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 w-full text-left">
              Status Ratio (Pie Chart)
            </h3>
            <div className="relative w-40 h-40 rounded-full bg-[conic-gradient(#34A853_0%_35%,#4285F4_35%_65%,#FBBC04_65%_80%,#EA4335_80%_100%)] shadow-inner" />
            <div className="flex gap-4 mt-6 text-xs font-bold">
              <span className="text-emerald-600">● Done (35%)</span>
              <span className="text-blue-600">● Active (30%)</span>
              <span className="text-amber-500">● Pending (15%)</span>
              <span className="text-red-500">● Delayed (20%)</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
              Department Progress (Stacked Bar Chart)
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-600">Data Science</span>
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-100 mt-1">
                  <div style={{ width: "60%" }} className="bg-emerald-500" />
                  <div style={{ width: "25%" }} className="bg-blue-500" />
                  <div style={{ width: "15%" }} className="bg-red-500" />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-600">DevOps</span>
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-100 mt-1">
                  <div style={{ width: "80%" }} className="bg-emerald-500" />
                  <div style={{ width: "20%" }} className="bg-amber-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Risk Heatmap Matrix</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="bg-emerald-100 text-emerald-800 p-4 rounded-lg">Low Risk<br />(Dense: 12)</div>
              <div className="bg-amber-100 text-amber-800 p-4 rounded-lg">Med Risk<br />(Dense: 5)</div>
              <div className="bg-red-200 text-red-900 p-4 rounded-lg">High Risk<br />(Critical: 3)</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
