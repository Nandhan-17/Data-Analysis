 "use client"; 
 
import { 
  ChangeEvent, 
  useMemo, 
  useState, 
} from "react"; 
 
/* ========================================================= 
   TYPES 
========================================================= */ 
 
type CSVRow = Record<string, string>; 
 
type ProjectRecord = { 
  id: number; 
  raw: CSVRow; 
 
  project: string; 
  member: string; 
  task: string; 
  target: number | null; 
 
  startDate: string; 
  endDate: string; 
 
  progress: number; 
  status: StatusKey; // 
  risk: "Low" | "Medium" | "High"; 
 
  daysRequired: number | null; 
  daysRemaining: number | null; 
  delayDays: number; 
 
  category: string; 
}; 
 
type DetailItem = { 
  title: string; 
  value: string; 
}; 
 
type DetailDrawerData = { 
  title: string; 
  subtitle: string; 
  items: DetailItem[]; 
  records: ProjectRecord[]; 
}; 
 
type StatusKey = 
  | "Completed" 
  | "In Progress" 
  | "Not Started" 
  | "At Risk" 
  | "Delayed"; 
 
type Tab = 
  | "projects" 
  | "members" 
  | "analytics"; 
 
/* ========================================================= 
   CONSTANTS 
========================================================= */ 
 
const STATUS_COLORS: Record<StatusKey, string> = { 
  Completed: "#34A853", 
  "In Progress": "#4285F4", 
  "Not Started": "#FBBC04", 
  "At Risk": "#FF7043", 
  Delayed: "#EA4335", 
}; 
 
const STATUS_WORDS = { 
  completed: [ 
    "completed", 
    "complete", 
    "done", 
    "closed", 
    "finished", 
    "success", 
  ], 
 
  active: [ 
    "active", 
    "in progress", 
    "ongoing", 
    "working", 
    "started", 
  ], 
 
  pending: [ 
    "pending", 
    "todo", 
    "to do", 
    "not started", 
    "waiting", 
    "open", 
  ], 
 
  delayed: [ 
    "delayed", 
    "delay", 
    "overdue", 
    "late", 
  ], 
 
  risk: [ 
    "risk", 
    "at risk", 
    "high risk", 
  ], 
}; 
 
/* ========================================================= 
   CSV HELPERS 
========================================================= */ 
 
function normalizeColumnName(value: string) { 
  return value 
    .trim() 
    .toLowerCase() 
    .replace(/[^a-z0-9]+/g, "_") 
    .replace(/^_+|_+$/g, ""); 
} 
 
function parseCSVLine(line: string): string[] { 
  const result: string[] = []; 
 
  let current = ""; 
  let insideQuotes = false; 
 
  for (let i = 0; i < line.length; i++) { 
    const char = line[i]; 
 
    if (char === '"') { 
      if ( 
        insideQuotes && 
        line[i + 1] === '"' 
      ) { 
        current += '"'; 
        i++; 
      } else { 
        insideQuotes = !insideQuotes; 
      } 
    } else if ( 
      char === "," && 
      !insideQuotes 
    ) { 
      result.push(current.trim()); 
      current = ""; 
    } else { 
      current += char; 
    } 
  } 
 
  result.push(current.trim()); 
 
  return result.map((value) => 
    value 
      .replace(/^"(.*)"$/, "$1") 
      .trim() 
  ); 
} 
 
function parseCSV(text: string): CSVRow[] { 
  const normalized = text 
    .replace(/\r\n/g, "\n") 
    .replace(/\r/g, "\n"); 
 
  const lines = normalized 
    .split("\n") 
    .filter( 
      (line) => line.trim() !== "" 
    ); 
 
  if (lines.length < 2) { 
    return []; 
  } 
 
  const headers = parseCSVLine( 
    lines[0] 
  ).map(normalizeColumnName); 
 
  return lines.slice(1).map((line) => { 
    const values = parseCSVLine(line); 
 
    const row: CSVRow = {}; 
 
    headers.forEach( 
      (header, index) => { 
        row[header] = 
          values[index] ?? ""; 
      } 
    ); 
 
    return row; 
  }); 
} 
 
/* ========================================================= 
   COLUMN DETECTION 
========================================================= */ 
 
function findColumn( 
  rows: CSVRow[], 
  possibleNames: string[] 
): string | null { 
  if (!rows.length) { 
    return null; 
  } 
 
  const columns = Object.keys(rows[0]); 
 
  for (const name of possibleNames) { 
    const normalized = 
      normalizeColumnName(name); 
 
    const exact = columns.find( 
      (column) => 
        column === normalized 
    ); 
 
    if (exact) { 
      return exact; 
    } 
  } 
 
  for (const name of possibleNames) { 
    const normalized = 
      normalizeColumnName(name); 
 
    const partial = columns.find( 
      (column) => 
        column.includes(normalized) || 
        normalized.includes(column) 
    ); 
 
    if (partial) { 
      return partial; 
    } 
  } 
 
  return null; 
} 
 
function findProjectColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "project", 
    "project_name", 
    "project_title", 
    "client", 
    "client_name", 
    "customer", 
    "customer_name", 
  ]); 
} 
 
function findMemberColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "member", 
    "team_member", 
    "employee", 
    "employee_name", 
    "assigned_member", 
    "assigned_to", 
    "assignee", 
    "owner", 
    "developer", 
  ]); 
} 
 
function findTaskColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "task", 
    "task_name", 
    "task_title", 
    "activity", 
    "activity_name", 
    "title", 
    "work", 
  ]); 
} 
 
function findTargetColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "target", 
    "target_value", 
    "goal", 
    "planned", 
    "planned_value", 
  ]); 
} 
 
function findStatusColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "status", 
    "project_status", 
    "task_status", 
    "state", 
    "project_state", 
  ]); 
} 
 
function findProgressColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "progress", 
    "completion", 
    "completion_percentage", 
    "percent_complete", 
    "percentage", 
    "progress_percentage", 
  ]); 
} 
 
function findStartDateColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "start_date", 
    "started_at", 
    "start", 
    "created_at", 
    "date_started", 
  ]); 
} 
 
function findEndDateColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "end_date", 
    "due_date", 
    "deadline", 
    "target_date", 
    "completion_date", 
    "finish_date", 
  ]); 
} 
 
function findCategoryColumn( 
  rows: CSVRow[] 
) { 
  return findColumn(rows, [ 
    "category", 
    "project_category", 
    "task_category", 
    "type", 
    "department", 
    "team", 
    "group", 
    "domain", 
  ]); 
} 
 
/* ========================================================= 
   NUMBER / DATE HELPERS 
========================================================= */ 
 
function numberValue( 
  value: string 
) { 
  if (!value?.trim()) { 
    return null; 
  } 
 
  const cleaned = value 
    .replace( 
      /[$₹€£,%\s]/g, 
      "" 
    ) 
    .replace(/,/g, ""); 
 
  const number = Number(cleaned); 
 
  return Number.isFinite(number) 
    ? number 
    : null; 
} 
 
function clamp( 
  value: number, 
  min: number, 
  max: number 
) { 
  return Math.min( 
    Math.max(value, min), 
    max 
  ); 
} 
 
function parseDate( 
  value: string 
): Date | null { 
  if (!value?.trim()) { 
    return null; 
  } 
 
  const date = new Date(value); 
 
  if ( 
    Number.isNaN(date.getTime()) 
  ) { 
    return null; 
  } 
 
  return date; 
} 
 
function differenceInDays( 
  start: Date, 
  end: Date 
) { 
  const diff = 
    end.getTime() - 
    start.getTime(); 
 
  return Math.ceil( 
    diff / 
      (1000 * 60 * 60 * 24) 
  ); 
} 
 
function formatNumber( 
  value: number 
) { 
  return new Intl.NumberFormat( 
    "en-IN" 
  ).format(value); 
} 
 
function formatPercent( 
  value: number 
) { 
  return `${Math.round(value)}%`; 
} 
 
function formatDate( 
  value: string 
) { 
  const date = parseDate(value); 
 
  if (!date) { 
    return value || "—"; 
  } 
 
  return date.toLocaleDateString( 
    "en-IN", 
    { 
      day: "2-digit", 
      month: "short", 
      year: "numeric", 
    } 
  ); 
} 
 
function normalizeStatus( 
  value: string 
): StatusKey { 
  const normalized = 
    value.toLowerCase().trim(); 
 
  if ( 
    STATUS_WORDS.delayed.some( 
      (word) => 
        normalized.includes(word) 
    ) 
  ) { 
    return "Delayed"; 
  } 
 
  if ( 
    STATUS_WORDS.risk.some( 
      (word) => 
        normalized.includes(word) 
    ) 
  ) { 
    return "At Risk"; 
  } 
 
  if ( 
    STATUS_WORDS.completed.some( 
      (word) => 
        normalized.includes(word) 
    ) 
  ) { 
    return "Completed"; 
  } 
 
  if ( 
    STATUS_WORDS.active.some( 
      (word) => 
        normalized.includes(word) 
    ) 
  ) { 
    return "In Progress"; 
  } 
 
  return "Not Started"; 
} 
 
/* ========================================================= 
   DERIVED STATUS 
========================================================= */ 
 
function deriveStatus( 
  rawStatus: string, 
  progress: number, 
  daysRemaining: number | null, 
  delayDays: number 
): StatusKey { 
  if (rawStatus.trim()) { 
    const status = 
      normalizeStatus(rawStatus); 
 
    if ( 
      status === "Completed" || 
      status === "Delayed" 
    ) { 
      return status; 
    } 
 
    if ( 
      status === "At Risk" 
    ) { 
      return "At Risk"; 
    } 
  } 
 
  if (progress >= 100) { 
    return "Completed"; 
  } 
 
  if ( 
    delayDays > 0 && 
    progress < 100 
  ) { 
    return "Delayed"; 
  } 
 
  if ( 
    daysRemaining !== null && 
    daysRemaining <= 3 && 
    progress < 80 
  ) { 
    return "At Risk"; 
  } 
 
  if (progress > 0) { 
    return "In Progress"; 
  } 
 
  return "Not Started"; 
} 
 
/* ========================================================= 
   RISK ENGINE 
========================================================= */ 
 
function calculateRisk( 
  progress: number, 
  daysRemaining: number | null, 
  delayDays: number, 
  status: StatusKey 
): "Low" | "Medium" | "High" { 
  if ( 
    status === "Delayed" || 
    delayDays >= 3 
  ) { 
    return "High"; 
  } 
 
  if ( 
    status === "At Risk" || 
    ( 
      daysRemaining !== null && 
      daysRemaining <= 3 && 
      progress < 70 
    ) 
  ) { 
    return "High"; 
  } 
 
  if ( 
    daysRemaining !== null && 
    daysRemaining <= 7 && 
    progress < 80 
  ) { 
    return "Medium"; 
  } 
 
  if ( 
    progress < 30 && 
    daysRemaining !== null && 
    daysRemaining <= 14 
  ) { 
    return "Medium"; 
  } 
 
  return "Low"; 
} 
 
/* ========================================================= 
   CSV RECORD NORMALIZATION 
========================================================= */ 
 
function normalizeRecords( 
  rows: CSVRow[] 
): ProjectRecord[] { 
  if (!rows.length) { 
    return []; 
  } 
 
  const projectColumn = 
    findProjectColumn(rows); 
 
  const memberColumn = 
    findMemberColumn(rows); 
 
  const taskColumn = 
    findTaskColumn(rows); 
 
  const targetColumn = 
    findTargetColumn(rows); 
 
  const statusColumn = 
    findStatusColumn(rows); 
 
  const progressColumn = 
    findProgressColumn(rows); 
 
  const startDateColumn = 
    findStartDateColumn(rows); 
 
  const endDateColumn = 
    findEndDateColumn(rows); 
 
  const categoryColumn = 
    findCategoryColumn(rows); 
 
  return rows.map( 
    (row, index) => { 
      const project = 
        row[projectColumn || ""]?.trim() || 
        "Unassigned Project"; 
 
      const member = 
        row[memberColumn || ""]?.trim() || 
        "Unassigned Member"; 
 
      const task = 
        row[taskColumn || ""]?.trim() || 
        `Task ${index + 1}`; 
 
      const target = 
        targetColumn 
          ? numberValue( 
              row[targetColumn] || "" 
            ) 
          : null; 
 
      const progressRaw = 
        progressColumn 
          ? numberValue( 
              row[progressColumn] || "" 
            ) 
          : null; 
 
      const progress = 
        clamp( 
          progressRaw ?? 0, 
          0, 
          100 
        ); 
 
      const startDate = 
        row[ 
          startDateColumn || "" 
        ]?.trim() || ""; 
 
      const endDate = 
        row[ 
          endDateColumn || "" 
        ]?.trim() || ""; 
 
      const start = 
        parseDate(startDate); 
 
      const end = 
        parseDate(endDate); 
 
      const today = new Date(); 
 
      const daysRequired = 
        start && end 
          ? Math.max( 
              differenceInDays( 
                start, 
                end 
              ), 
              0 
            ) 
          : null; 
 
      const daysRemaining = 
        end 
          ? differenceInDays( 
              today, 
              end 
            ) 
          : null; 
 
      const delayDays = 
        end && 
        progress < 100 && 
        today > end 
          ? Math.max( 
              differenceInDays( 
                end, 
                today 
              ), 
              0 
            ) 
          : 0; 
 
      const status = 
        deriveStatus( 
          statusColumn 
            ? row[ 
                statusColumn 
              ] || "" 
            : "", 
          progress, 
          daysRemaining, 
          delayDays 
        ); 
 
      const risk = 
        calculateRisk( 
          progress, 
          daysRemaining, 
          delayDays, 
          status 
        ); 
 
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
 
        category: 
          row[ 
            categoryColumn || "" 
          ]?.trim() || 
          "General", 
      }; 
    } 
  ); 
} 
 
/* ========================================================= 
   ICONS 
========================================================= */ 
 
function Icon({ 
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
  const common = 
    "h-5 w-5"; 
 
  const paths: Record< 
    typeof name, 
    React.ReactNode 
  > = { 
    folder: ( 
      <> 
        <path d="M3 7.5h6l2 2h10v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> 
        <path d="M3 7.5V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2.5" /> 
      </> 
    ), 
 
    users: ( 
      <> 
        <circle 
          cx="9" 
          cy="8" 
          r="3" 
        /> 
        <path d="M3 20a6 6 0 0 1 12 0" /> 
        <circle 
          cx="17" 
          cy="9" 
          r="2.5" 
        /> 
        <path d="M16 14a5 5 0 0 1 5 5" /> 
      </> 
    ), 
 
    chart: ( 
      <> 
        <path d="M4 19V5" /> 
        <path d="M4 19h17" /> 
        <path d="m7 15 4-5 3 3 5-7" /> 
      </> 
    ), 
 
    search: ( 
      <> 
        <circle 
          cx="11" 
          cy="11" 
          r="7" 
        /> 
        <path d="m20 20-4-4" /> 
      </> 
    ), 
 
    upload: ( 
      <> 
        <path d="M12 16V4" /> 
        <path d="m7 9 5-5 5 5" /> 
        <path d="M5 20h14" /> 
      </> 
    ), 
 
    download: ( 
      <> 
        <path d="M12 4v12" /> 
        <path d="m7 11 5 5 5-5" /> 
        <path d="M5 20h14" /> 
      </> 
    ), 
 
    filter: ( 
      <> 
        <path d="M4 6h16" /> 
        <path d="M7 12h10" /> 
        <path d="M10 18h4" /> 
      </> 
    ), 
 
    refresh: ( 
      <> 
        <path d="M20 11a8 8 0 0 0-14.8-4L3 10" /> 
        <path d="M3 5v5h5" /> 
        <path d="M4 13a8 8 0 0 0 14.8 4L21 14" /> 
        <path d="M21 19v-5h-5" /> 
      </> 
    ), 
 
    alert: ( 
      <> 
        <path d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /> 
        <path d="M12 9v4" /> 
        <path d="M12 16h.01" /> 
      </> 
    ), 
 
    clock: ( 
      <> 
        <circle 
          cx="12" 
          cy="12" 
          r="9" 
        /> 
        <path d="M12 7v5l3 2" /> 
      </> 
    ), 
 
    check: ( 
      <path d="m5 12 4 4L19 6" /> 
    ), 
 
    activity: ( 
      <> 
        <path d="M3 12h4l2-6 4 12 2-6h6" /> 
      </> 
    ), 
 
    calendar: ( 
      <> 
        <rect 
          x="3" 
          y="4" 
          width="18" 
          height="17" 
          rx="2" 
        /> 
        <path d="M16 2v4M8 2v4M3 10h18" /> 
      </> 
    ), 
 
    arrow: ( 
      <> 
        <path d="M5 12h14" /> 
        <path d="m13 6 6 6-6 6" /> 
      </> 
    ), 
 
    close: ( 
      <> 
        <path d="m6 6 12 12" /> 
        <path d="m18 6-12 12" /> 
      </> 
    ), 
  }; 
 
  return ( 
    <svg 
      className={common} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    > 
      {paths[name]} 
    </svg> 
  ); 
} 
 
/* ========================================================= 
   MAIN COMPONENT 
========================================================= */ 
 
export default function Home() { 
  const [rows, setRows] = 
    useState<CSVRow[]>([]); 
 
  const [fileName, setFileName] = 
    useState(""); 
 
  const [search, setSearch] = 
    useState(""); 
 
  const [error, setError] = 
    useState(""); 
 
  const [isImporting, setIsImporting] = 
    useState(false); 
 
  const [activeTab, setActiveTab] = 
    useState<Tab>("projects"); 
 
  const [projectFilter, setProjectFilter] = 
    useState("All"); 
 
  const [memberFilter, setMemberFilter] = 
    useState("All"); 
 
  const [statusFilter, setStatusFilter] = 
    useState("All"); 
 
  const [riskFilter, setRiskFilter] = 
    useState("All"); 
 
  const [selectedProject, setSelectedProject] = 
    useState<string | null>(null); 
 
  const [selectedMember, setSelectedMember] = 
    useState<string | null>(null); 
 
  const [drawer, setDrawer] = 
    useState<DetailDrawerData | null>( 
      null 
    ); 
 
  const [page, setPage] = 
    useState(1); 
 
  const PAGE_SIZE = 15; 
 
  /* ===================================================== 
     NORMALIZED DATA 
  ===================================================== */ 
 
  const records = useMemo( 
    () => normalizeRecords(rows), 
    [rows] 
  ); 
 
  /* ===================================================== 
     UNIQUE FILTER DATA 
  ===================================================== */ 
 
  const projects = useMemo( 
    () => 
      Array.from( 
        new Set( 
          records.map( 
            (record) => 
              record.project 
          ) 
        ) 
      ).sort(), 
    [records] 
  ); 
 
  const members = useMemo( 
    () => 
      Array.from( 
        new Set( 
          records.map( 
            (record) => 
              record.member 
          ) 
        ) 
      ).sort(), 
    [records] 
  ); 
 
  const statuses = useMemo( 
    () => 
      Array.from( 
        new Set( 
          records.map( 
            (record) => 
              record.status 
          ) 
        ) 
      ), 
    [records] 
  ); 
 
  /* ===================================================== 
     FILTERED DATA 
  ===================================================== */ 
 
  const filteredRecords = useMemo(() => { 
    const query = 
      search.trim().toLowerCase(); 
 
    return records.filter( 
      (record) => { 
        const matchesProject = 
          projectFilter === "All" || 
          record.project === 
            projectFilter; 
 
        const matchesMember = 
          memberFilter === "All" || 
          record.member === 
            memberFilter; 
 
        const matchesStatus = 
          statusFilter === "All" || 
          record.status === 
            statusFilter; 
 
        const matchesRisk = 
          riskFilter === "All" || 
          record.risk === 
            riskFilter; 
 
        const matchesSearch = 
          !query || 
          Object.values( 
            record.raw 
          ).some((value) => 
            value 
              .toLowerCase() 
              .includes(query) 
          ) || 
          record.project 
            .toLowerCase() 
            .includes(query) || 
          record.member 
            .toLowerCase() 
            .includes(query) || 
          record.task 
            .toLowerCase() 
            .includes(query); 
 
        return ( 
          matchesProject && 
          matchesMember && 
          matchesStatus && 
          matchesRisk && 
          matchesSearch 
        ); 
      } 
    ); 
  }, [ 
    records, 
    search, 
    projectFilter, 
    memberFilter, 
    statusFilter, 
    riskFilter, 
  ]); 
 
  /* ===================================================== 
     PAGINATION 
  ===================================================== */ 
 
  const totalPages = 
    Math.max( 
      1, 
      Math.ceil( 
        filteredRecords.length / 
          PAGE_SIZE 
      ) 
    ); 
 
  const paginatedRecords = 
    filteredRecords.slice( 
      (page - 1) * 
        PAGE_SIZE, 
      page * PAGE_SIZE 
    ); 
 
  /* ===================================================== 
     KPI 
  ===================================================== */ 
 
  const totalTasks = 
    filteredRecords.length; 
 
  const completed = 
    filteredRecords.filter( 
      (record) => 
        record.status === 
        "Completed" 
    ).length; 
 
  const inProgress = 
    filteredRecords.filter( 
      (record) => 
        record.status === 
        "In Progress" 
    ).length; 
 
  const notStarted = 
    filteredRecords.filter( 
      (record) => 
        record.status === 
        "Not Started" 
    ).length; 
 
  const atRisk = 
    filteredRecords.filter( 
      (record) => 
        record.status === 
          "At Risk" || 
        record.risk === "High" 
    ).length; 
 
  const delayed = 
    filteredRecords.filter( 
      (record) => 
        record.status === 
        "Delayed" 
    ).length; 
 
  const avgProgress = 
    filteredRecords.length 
      ? filteredRecords.reduce( 
          (sum, record) => 
            sum + 
            record.progress, 
          0 
        ) / 
        filteredRecords.length 
      : 0; 
 
  const avgDaysRequired = 
    filteredRecords.filter( 
      (record) => 
        record.daysRequired !== 
        null 
    ).length 
      ? filteredRecords 
          .filter( 
            (record) => 
              record.daysRequired !== 
              null 
          ) 
          .reduce( 
            (sum, record) => 
              sum + 
              (record.daysRequired || 
                0), 
            0 
          ) / 
        filteredRecords.filter( 
          (record) => 
            record.daysRequired !== 
            null 
        ).length 
      : 0; 
 
  /* ===================================================== 
     DATA QUALITY 
  ===================================================== */ 
 
  const dataQuality = useMemo(() => { 
    if (!rows.length) { 
      return { 
        columns: 0, 
        missing: 0, 
        duplicates: 0, 
        valid: 0, 
      }; 
    } 
 
    const columns = 
      Object.keys(rows[0]).length; 
 
    let missing = 0; 
 
    rows.forEach((row) => { 
      Object.values(row).forEach( 
        (value) => { 
          if (!value.trim()) { 
            missing++; 
          } 
        } 
      ); 
    }); 
 
    const signatures = 
      rows.map((row) => 
        Object.values(row).join("|") 
      ); 
 
    const duplicates = 
      signatures.length - 
      new Set(signatures).size; 
 
    return { 
      columns, 
      missing, 
      duplicates, 
      valid: 
        rows.length - 
        duplicates, 
    }; 
  }, [rows]); 
 
  /* ===================================================== 
     PROJECT ANALYTICS 
  ===================================================== */ 
 
  const projectAnalytics = 
    useMemo(() => { 
      return projects.map( 
        (project) => { 
          const projectRecords = 
            filteredRecords.filter( 
              (record) => 
                record.project === 
                project 
            ); 
 
          const progress = 
            projectRecords.length 
              ? projectRecords.reduce( 
                  (sum, record) => 
                    sum + 
                    record.progress, 
                  0 
                ) / 
                projectRecords.length 
              : 0; 
 
          const completed = 
            projectRecords.filter( 
              (record) => 
                record.status === 
                "Completed" 
            ).length; 
 
          const risk = 
            projectRecords.filter( 
              (record) => 
                record.risk === 
                "High" 
            ).length; 
 
          return { 
            project, 
            tasks: 
              projectRecords.length, 
            progress, 
            completed, 
            risk, 
          }; 
        } 
      ); 
    }, [ 
      projects, 
      filteredRecords, 
    ]); 
 
  /* ===================================================== 
     MEMBER ANALYTICS 
  ===================================================== */ 
 
  const memberAnalytics = 
    useMemo(() => { 
      return members.map( 
        (member) => { 
          const memberRecords = 
            filteredRecords.filter( 
              (record) => 
                record.member === 
                member 
            ); 
 
          const progress = 
            memberRecords.length 
              ? memberRecords.reduce( 
                  (sum, record) => 
                    sum + 
                    record.progress, 
                  0 
                ) / 
                memberRecords.length 
              : 0; 
 
          const completed = 
            memberRecords.filter( 
              (record) => 
                record.status === 
                "Completed" 
            ).length; 
 
          const delayed = 
            memberRecords.filter( 
              (record) => 
                record.status === 
                "Delayed" 
            ).length; 
 
          const highRisk = 
            memberRecords.filter( 
              (record) => 
                record.risk === 
                "High" 
            ).length; 
 
          return { 
            member, 
            tasks: 
              memberRecords.length, 
            progress, 
            completed, 
            delayed, 
            highRisk, 
          }; 
        } 
      ); 
    }, [ 
      members, 
      filteredRecords, 
    ]); 
 
  /* ===================================================== 
     STATUS ANALYTICS 
  ===================================================== */ 
 
  const statusAnalytics = 
    useMemo(() => { 
      const statusKeys: StatusKey[] = 
        [ 
          "Completed", 
          "In Progress", 
          "Not Started", 
          "At Risk", 
          "Delayed", 
        ]; 
 
      return statusKeys.map( 
        (status) => ({ 
          status, 
          value: 
            filteredRecords.filter( 
              (record) => 
                record.status === 
                status 
            ).length, 
        }) 
      ); 
    }, [filteredRecords]); 
 
  const statusTotal = 
    Math.max( 
      1, 
      statusAnalytics.reduce( 
        (sum, item) => 
          sum + item.value, 
        0 
      ) 
    ); 
 
  /* ===================================================== 
     MONTHLY ANALYTICS 
  ===================================================== */ 
 
  const monthlyAnalytics = 
    useMemo(() => { 
      const map = 
        new Map< 
          string, 
          ProjectRecord[] 
        >(); 
 
      filteredRecords.forEach( 
        (record) => { 
          const date = 
            parseDate( 
              record.endDate 
            ) || 
            parseDate( 
              record.startDate 
            ); 
 
          if (!date) { 
            return; 
          } 
 
          const label = 
            date.toLocaleDateString( 
              "en-US", 
              { 
                month: "short", 
                year: "numeric", 
              } 
            ); 
 
          const existing = 
            map.get(label) || 
            []; 
 
          existing.push(record); 
 
          map.set( 
            label, 
            existing 
          ); 
        } 
      ); 
 
      return Array.from( 
        map.entries() 
      ) 
        .slice(-12) 
        .map( 
          ([ 
            label, 
            items, 
          ]) => ({ 
            label, 
            tasks: items.length, 
            progress: 
              items.length 
                ? items.reduce( 
                    (sum, item) => 
                      sum + 
                      item.progress, 
                    0 
                  ) / 
                  items.length 
                : 0, 
            completed: 
              items.filter( 
                (item) => 
                  item.status === 
                  "Completed" 
              ).length, 
          }) 
        ); 
    }, [filteredRecords]); 
 
  /* ===================================================== 
     RISK ALERTS 
  ===================================================== */ 
 
  const riskAlerts = useMemo( 
    () => ({ 
      highRisk: 
        filteredRecords.filter( 
          (record) => 
            record.risk === 
            "High" 
        ), 
 
      delayed: 
        filteredRecords.filter( 
          (record) => 
            record.status === 
            "Delayed" 
        ), 
 
      approaching: 
        filteredRecords.filter( 
          (record) => 
            record.daysRemaining !== 
              null && 
            record.daysRemaining >= 
              0 && 
            record.daysRemaining <= 
              7 && 
            record.progress < 100 
        ), 
    }), 
    [filteredRecords] 
  ); 
 
  /* ===================================================== 
     DONUT GRADIENT 
  ===================================================== */ 
 
  let donutStart = 0; 
 
  const donutGradient = 
    statusAnalytics 
      .map((item) => { 
        const percentage = 
          (item.value / 
            statusTotal) * 
          100; 
 
        const start = 
          donutStart; 
 
        donutStart += 
          percentage; 
 
        return `${STATUS_COLORS[item.status]} ${start}% ${donutStart}%`; 
      }) 
      .join(", "); 
 
  /* ===================================================== 
     CSV IMPORT 
  ===================================================== */ 
 
  const handleImportCSV = ( 
    event: ChangeEvent<HTMLInputElement> 
  ) => { 
    const file = 
      event.target.files?.[0]; 
 
    if (!file) { 
      return; 
    } 
 
    setError(""); 
    setIsImporting(true); 
 
    if ( 
      !file.name 
        .toLowerCase() 
        .endsWith(".csv") 
    ) { 
      setError( 
        "Please select a valid CSV file." 
      ); 
 
      setIsImporting(false); 
 
      return; 
    } 
 
    const reader = 
      new FileReader(); 
 
    reader.onload = () => { 
      try { 
        const text = 
          String( 
            reader.result || "" 
          ); 
 
        const parsed = 
          parseCSV(text); 
 
        if (!parsed.length) { 
          setError( 
            "This CSV does not contain usable records." 
          ); 
 
          setIsImporting(false); 
 
          return; 
        } 
 
        setRows(parsed); 
        setFileName(file.name); 
 
        setSearch(""); 
 
        setProjectFilter("All"); 
        setMemberFilter("All"); 
        setStatusFilter("All"); 
        setRiskFilter("All"); 
 
        setPage(1); 
 
        setIsImporting(false); 
      } catch { 
        setError( 
          "Unable to process this CSV file." 
        ); 
 
        setIsImporting(false); 
      } 
    }; 
 
    reader.onerror = () => { 
      setError( 
        "Unable to read this CSV file." 
      ); 
 
      setIsImporting(false); 
    };
