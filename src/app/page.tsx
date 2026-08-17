"use client";

import React, { ChangeEvent, useMemo, useState, useCallback } from "react";

/* =========================================================
   TYPES & SCHEMAS
========================================================= */

export type StatusKey =
  | "Completed"
  | "In Progress"
  | "Not Started"
  | "At Risk"
  | "Delayed";

export type RiskLevel = "Low" | "Medium" | "High";

export type CSVRow = Record<string, string>;

export interface ProjectRecord {
  id: number;
  raw: CSVRow;
  project: string;
  member: string;
  task: string;
  target: number | null;
  startDate: string;
  endDate: string;
  progress: number;
  status: StatusKey;
  risk: RiskLevel;
  daysRequired: number | null;
  daysRemaining: number | null;
  delayDays: number;
  category: string;
}

export interface DetailItem {
  title: string;
  value: string;
}

export interface DetailDrawerData {
  title: string;
  subtitle: string;
  items: DetailItem[];
  records: ProjectRecord[];
}

export type Tab = "projects" | "members" | "analytics";

/* =========================================================
   CONSTANTS & DICTIONARIES
========================================================= */

export const STATUS_COLORS: Record<StatusKey, string> = {
  Completed: "#34A853",
  "In Progress": "#4285F4",
  "Not Started": "#FBBC04",
  "At Risk": "#FF7043",
  Delayed: "#EA4335",
};

const COLUMN_ALIASES: Record<string, string[]> = {
  project: ["project", "project_name", "project_title", "client", "client_name", "customer", "customer_name"],
  member: ["member", "team_member", "employee", "employee_name", "assigned_member", "assigned_to", "assignee", "owner", "developer"],
  task: ["task", "task_name", "task_title", "activity", "activity_name", "title", "work"],
  target: ["target", "target_value", "goal", "planned", "planned_value"],
  status: ["status", "project_status", "task_status", "state", "project_state"],
  progress: ["progress", "completion", "completion_percentage", "percent_complete", "percentage", "progress_percentage"],
  startDate: ["start_date", "started_at", "start", "created_at", "date_started"],
  endDate: ["end_date", "due_date", "deadline", "target_date", "completion_date", "finish_date"],
  category: ["category", "project_category", "task_category", "type", "department", "team", "group", "domain"],
};

const STATUS_KEYWORD_MAP: Array<{ key: StatusKey; terms: string[] }> = [
  { key: "Delayed", terms: ["delayed", "delay", "overdue", "late"] },
  { key: "At Risk", terms: ["risk", "at risk", "high risk"] },
  { key: "Completed", terms: ["completed", "complete", "done", "closed", "finished", "success"] },
  { key: "In Progress", terms: ["active", "in progress", "ongoing", "working", "started"] },
  { key: "Not Started", terms: ["pending", "todo", "to do", "not started", "waiting", "open"] },
];

/* =========================================================
   PURE UTILITY & ANALYTICS HELPERS
========================================================= */

function normalizeColumnName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((val) => val.replace(/^"(.*)"$/, "$1").trim());
}

export function parseCSV(text: string): CSVRow[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(normalizeColumnName);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function findColumn(rows: CSVRow[], possibleNames: string[]): string | null {
  if (!rows.length) return null;
  const columns = Object.keys(rows[0]);
  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);
    const exact = columns.find((col) => col === normalized);
    if (exact) return exact;
  }
  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);
    const partial = columns.find((col) => col.includes(normalized) || normalized.includes(col));
    if (partial) return partial;
  }
  return null;
}

function parseNumber(value: string): number | null {
  if (!value?.trim()) return null;
  const cleaned = value.replace(/[$₹€£,%\s]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseDate(value: string): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function differenceInDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeStatus(value: string): StatusKey {
  const valLower = value.toLowerCase().trim();
  for (const group of STATUS_KEYWORD_MAP) {
    if (group.terms.some((term) => valLower.includes(term))) {
      return group.key;
    }
  }
  return "Not Started";
}

function deriveStatus(
  rawStatus: string,
  progress: number,
  daysRemaining: number | null,
  delayDays: number
): StatusKey {
  if (rawStatus.trim()) {
    const status = normalizeStatus(rawStatus);
    if (status === "Completed" || status === "Delayed" || status === "At Risk") {
      return status;
    }
  }
  if (progress >= 100) return "Completed";
  if (delayDays > 0 && progress < 100) return "Delayed";
  if (daysRemaining !== null && daysRemaining <= 3 && progress < 80) return "At Risk";
  if (progress > 0) return "In Progress";
  return "Not Started";
}

function calculateRisk(
  progress: number,
  daysRemaining: number | null,
  delayDays: number,
  status: StatusKey
): RiskLevel {
  if (status === "Delayed" || delayDays >= 3) return "High";
  if (status === "At Risk" || (daysRemaining !== null && daysRemaining <= 3 && progress < 70)) return "High";
  if (daysRemaining !== null && daysRemaining <= 7 && progress < 80) return "Medium";
  if (progress < 30 && daysRemaining !== null && daysRemaining <= 14) return "Medium";
  return "Low";
}

export function normalizeRecords(rows: CSVRow[]): ProjectRecord[] {
  if (!rows.length) return [];

  const colProj = findColumn(rows, COLUMN_ALIASES.project);
  const colMem = findColumn(rows, COLUMN_ALIASES.member);
  const colTask = findColumn(rows, COLUMN_ALIASES.task);
  const colTarget = findColumn(rows, COLUMN_ALIASES.target);
  const colStatus = findColumn(rows, COLUMN_ALIASES.status);
  const colProgress = findColumn(rows, COLUMN_ALIASES.progress);
  const colStart = findColumn(rows, COLUMN_ALIASES.startDate);
  const colEnd = findColumn(rows, COLUMN_ALIASES.endDate);
  const colCat = findColumn(rows, COLUMN_ALIASES.category);

  const today = new Date();

  return rows.map((row, index) => {
    const project = row[colProj || ""]?.trim() || "Unassigned Project";
    const member = row[colMem || ""]?.trim() || "Unassigned Member";
    const task = row[colTask || ""]?.trim() || `Task ${index + 1}`;
    const target = colTarget ? parseNumber(row[colTarget] || "") : null;
    const progressRaw = colProgress ? parseNumber(row[colProgress] || "") : null;
    const progress = clamp(progressRaw ?? 0, 0, 100);

    const startDate = row[colStart || ""]?.trim() || "";
    const endDate = row[colEnd || ""]?.trim() || "";

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const daysRequired = start && end ? Math.max(differenceInDays(start, end), 0) : null;
    const daysRemaining = end ? differenceInDays(today, end) : null;
    const delayDays = end && progress < 100 && today > end ? Math.max(differenceInDays(end, today), 0) : 0;

    const rawStatusVal = colStatus ? row[colStatus] || "" : "";
    const status = deriveStatus(rawStatusVal, progress, daysRemaining, delayDays);
    const risk = calculateRisk(progress, daysRemaining, delayDays, status);

    return {
      id: index,
      raw: row,
      project,
      member,
      task,
      target,
      startDate,
      endDate,
      progress,
      status,
      risk,
      daysRequired,
      daysRemaining,
      delayDays,
      category: row[colCat || ""]?.trim() || "General",
    };
  });
}

/* =========================================================
   UI ICON COMPONENT
========================================================= */

export function Icon({
  name,
}: {
  name:
    | "folder"
    | "users"
    | "chart"
    | "search"
    | "upload"
    | "download"
    | "filter"
    | "refresh"
    | "alert"
    | "clock"
    | "check"
    | "activity"
    | "calendar"
    | "arrow"
    | "close";
}) {
  const common = "h-5 w-5 stroke-current";

  const renderPath = () => {
    switch (name) {
      case "folder":
        return (
          <>
            <path d="M3 7.5h6l2 2h10v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M3 7.5V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2.5" />
          </>
        );
      case "users":
        return (
          <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20a6 6 0 0 1 12 0" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M16 14a5 5 0 0 1 5 5" />
          </>
        );
      case "chart":
        return (
          <>
            <path d="M4 19V5" />
            <path d="M4 19h17" />
            <path d="m7 15 4-5 3 3 5-7" />
          </>
        );
      case "search":
        return (
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </>
        );
      case "upload":
        return (
          <>
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M5 20h14" />
          </>
        );
      case "download":
        return (
          <>
            <path d="M12 4v12" />
            <path d="m7 11 5 5 5-5" />
            <path d="M5 20h14" />
          </>
        );
      case "filter":
        return (
          <>
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
          </>
        );
      case "refresh":
        return (
          <>
            <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
            <path d="M3 5v5h5" />
            <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
            <path d="M21 19v-5h-5" />
          </>
        );
      case "alert":
        return (
          <>
            <path d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" />
            <path d="M12 16h.01" />
          </>
        );
      case "clock":
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        );
      case "check":
        return <path d="m5 12 4 4L19 6" />;
      case "activity":
        return <path d="M3 12h4l2-6 4 12 2-6h6" />;
      case "calendar":
        return (
          <>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </>
        );
      case "arrow":
        return (
          <>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </>
        );
      case "close":
        return (
          <>
            <path d="m6 6 12 12" />
            <path d="m18 6-12 12" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      className={common}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {renderPath()}
    </svg>
  );
}

/* =========================================================
   MAIN DASHBOARD COMPONENT
========================================================= */

export default function DashboardHome() {
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [projectFilter, setProjectFilter] = useState("All");
  const [memberFilter, setMemberFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const [drawer, setDrawer] = useState<DetailDrawerData | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  /* --- File Import Handler --- */
  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsedRows = parseCSV(text);
        if (!parsedRows.length) {
          setError("CSV file contains no valid rows or header format is corrupted.");
        } else {
          setRows(parsedRows);
          setPage(1);
        }
      } catch (err) {
        setError("Failed to parse CSV file. Ensure valid RFC 4180 standard file format.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  }, []);

  /* --- Data Normalization --- */
  const records = useMemo(() => normalizeRecords(rows), [rows]);

  /* --- Unique Metadata Lists --- */
  const projects = useMemo(
    () => Array.from(new Set(records.map((r) => r.project))).sort(),
    [records]
  );

  const members = useMemo(
    () => Array.from(new Set(records.map((r) => r.member))).sort(),
    [records]
  );

  /* --- Main Data Filtering --- */
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (projectFilter !== "All" && record.project !== projectFilter) return false;
      if (memberFilter !== "All" && record.member !== memberFilter) return false;
      if (statusFilter !== "All" && record.status !== statusFilter) return false;
      if (riskFilter !== "All" && record.risk !== riskFilter) return false;

      if (!query) return true;

      return (
        record.project.toLowerCase().includes(query) ||
        record.member.toLowerCase().includes(query) ||
        record.task.toLowerCase().includes(query) ||
        Object.values(record.raw).some((val) => val.toLowerCase().includes(query))
      );
    });
  }, [records, search, projectFilter, memberFilter, statusFilter, riskFilter]);

  /* --- Pagination --- */
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = useMemo(
    () => filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRecords, page]
  );

  /* --- High-Level KPIs --- */
  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    if (!total) {
      return { total: 0, completed: 0, inProgress: 0, notStarted: 0, atRisk: 0, delayed: 0, avgProgress: 0, avgDaysRequired: 0 };
    }
    const completed = filteredRecords.filter((r) => r.status === "Completed").length;
    const inProgress = filteredRecords.filter((r) => r.status === "In Progress").length;
    const notStarted = filteredRecords.filter((r) => r.status === "Not Started").length;
    const atRisk = filteredRecords.filter((r) => r.status === "At Risk" || r.risk === "High").length;
    const delayed = filteredRecords.filter((r) => r.status === "Delayed").length;

    const avgProg = filteredRecords.reduce((sum, r) => sum + r.progress, 0) / total;
    const reqDaysItems = filteredRecords.filter((r) => r.daysRequired !== null);
    const avgDays = reqDaysItems.length
      ? reqDaysItems.reduce((sum, r) => sum + (r.daysRequired || 0), 0) / reqDaysItems.length
      : 0;

    return { total, completed, inProgress, notStarted, atRisk, delayed, avgProgress: avgProg, avgDaysRequired: avgDays };
  }, [filteredRecords]);

  /* --- Data Quality Auditor --- */
  const dataQuality = useMemo(() => {
    if (!rows.length) return { columns: 0, missing: 0, duplicates: 0, valid: 0 };
    const columns = Object.keys(rows[0]).length;
    let missing = 0;

    rows.forEach((row) => {
      Object.values(row).forEach((v) => {
        if (!v.trim()) missing++;
      });
    });

    const signatures = rows.map((r) => Object.values(r).join("|"));
    const duplicates = signatures.length - new Set(signatures).size;

    return { columns, missing, duplicates, valid: rows.length - duplicates };
  }, [rows]);

  /* --- Risk Warning Pipeline --- */
  const riskAlerts = useMemo(
    () => ({
      highRisk: filteredRecords.filter((r) => r.risk === "High"),
      delayed: filteredRecords.filter((r) => r.status === "Delayed"),
      approaching: filteredRecords.filter(
        (r) => r.daysRemaining !== null && r.daysRemaining >= 0 && r.daysRemaining <= 7 && r.progress < 100
      ),
    }),
    [filteredRecords]
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Intelligence Dashboard</h1>
          <p className="text-sm text-slate-500">Full-stack operational intelligence & dataset analytics hub.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
            <Icon name="upload" />
            <span>{isImporting ? "Processing..." : "Import CSV"}</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Summary Banner */}
      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Records</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{kpis.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{kpis.completed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</span>
          <p className="mt-1 text-2xl font-bold text-blue-600">{kpis.inProgress}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">At Risk</span>
          <p className="mt-1 text-2xl font-bold text-orange-600">{kpis.atRisk}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delayed</span>
          <p className="mt-1 text-2xl font-bold text-red-600">{kpis.delayed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Progress</span>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{Math.round(kpis.avgProgress)}%</p>
        </div>
      </section>

      {/* Content Workspace Placeholder */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search datasets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="absolute left-2.5 top-2.5 text-slate-400">
              <Icon name="search" />
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Data Quality Score: <span className="font-semibold text-slate-700">{dataQuality.valid} Valid Rows</span> ({dataQuality.missing} missing values)
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{rec.project}</td>
                    <td className="px-4 py-3">{rec.member}</td>
                    <td className="px-4 py-3">{rec.task}</td>
                    <td className="px-4 py-3">{rec.progress}%</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${STATUS_COLORS[rec.status]}20`, color: STATUS_COLORS[rec.status] }}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-xs">
                      <span className={rec.risk === "High" ? "text-red-600" : rec.risk === "Medium" ? "text-amber-600" : "text-emerald-600"}>
                        {rec.risk}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No matching records found. Upload a CSV file or modify active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
