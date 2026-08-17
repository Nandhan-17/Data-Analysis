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
  status: string;\\
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

    reader.readAsText(file);

    event.target.value = "";
  };

  /* =====================================================
     RESET
  ===================================================== */

  const resetFilters = () => {
    setSearch("");
    setProjectFilter("All");
    setMemberFilter("All");
    setStatusFilter("All");
    setRiskFilter("All");
    setSelectedProject(null);
    setSelectedMember(null);
    setPage(1);
  };

  /* =====================================================
     EXPORT
  ===================================================== */

  const exportCSV = () => {
    if (!filteredRecords.length) {
      return;
    }

    const headers =
      Object.keys(
        filteredRecords[0].raw
      );

    const escapeCSV = (
      value: string
    ) =>
      `"${value.replace(
        /"/g,
        '""'
      )}"`;

    const csv = [
      headers
        .map(escapeCSV)
        .join(","),

      ...filteredRecords.map(
        (record) =>
          headers
            .map(
              (header) =>
                escapeCSV(
                  record.raw[
                    header
                  ] || ""
                )
            )
            .join(",")
      ),
    ].join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `filtered-${fileName || "project-data"}`;

    link.click();

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     DRAWER HELPERS
  ===================================================== */

  const openProject =
    (project: string) => {
      const projectRecords =
        records.filter(
          (record) =>
            record.project ===
            project
        );

      setProjectFilter(project);
      setSelectedProject(
        project
      );

      setDrawer({
        title: project,
        subtitle: `${projectRecords.length} tasks`,
        items: [
          {
            title: "Tasks",
            value:
              formatNumber(
                projectRecords.length
              ),
          },
          {
            title: "Completed",
            value:
              formatNumber(
                projectRecords.filter(
                  (r) =>
                    r.status ===
                    "Completed"
                ).length
              ),
          },
          {
            title: "Average Progress",
            value:
              formatPercent(
                projectRecords.length
                  ? projectRecords.reduce(
                      (s, r) =>
                        s +
                        r.progress,
                      0
                    ) /
                      projectRecords.length
                  : 0
              ),
          },
          {
            title: "High Risk",
            value:
              formatNumber(
                projectRecords.filter(
                  (r) =>
                    r.risk ===
                    "High"
                ).length
              ),
          },
        ],
        records:
          projectRecords,
      });
    };

  const openMember =
    (member: string) => {
      const memberRecords =
        records.filter(
          (record) =>
            record.member ===
            member
        );

      setMemberFilter(member);
      setSelectedMember(
        member
      );

      setDrawer({
        title: member,
        subtitle: `${memberRecords.length} assigned tasks`,
        items: [
          {
            title: "Tasks",
            value:
              formatNumber(
                memberRecords.length
              ),
          },
          {
            title: "Completed",
            value:
              formatNumber(
                memberRecords.filter(
                  (r) =>
                    r.status ===
                    "Completed"
                ).length
              ),
          },
          {
            title: "Completion Rate",
            value:
              formatPercent(
                memberRecords.length
                  ? (memberRecords.filter(
                      (r) =>
                        r.status ===
                        "Completed"
                    ).length /
                      memberRecords.length) *
                      100
                  : 0
              ),
          },
          {
            title: "High Risk",
            value:
              formatNumber(
                memberRecords.filter(
                  (r) =>
                    r.risk ===
                    "High"
                ).length
              ),
          },
        ],
        records:
          memberRecords,
      });
    };

  const openStatus =
    (status: StatusKey) => {
      const statusRecords =
        records.filter(
          (record) =>
            record.status ===
            status
        );

      setStatusFilter(status);
      setPage(1);

      setDrawer({
        title: status,
        subtitle: `${statusRecords.length} matching tasks`,
        items: [
          {
            title: "Tasks",
            value:
              formatNumber(
                statusRecords.length
              ),
          },
          {
            title: "Average Progress",
            value:
              formatPercent(
                statusRecords.length
                  ? statusRecords.reduce(
                      (s, r) =>
                        s +
                        r.progress,
                      0
                    ) /
                      statusRecords.length
                  : 0
              ),
          },
          {
            title: "High Risk",
            value:
              formatNumber(
                statusRecords.filter(
                  (r) =>
                    r.risk ===
                    "High"
                ).length
              ),
          },
        ],
        records:
          statusRecords,
      });
    };

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  if (!rows.length) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f8fafc] text-[#172033]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 animate-pulse rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-purple-200/30 blur-3xl" />
        </div>

        <section className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
          <div className="w-full max-w-3xl animate-[fadeUp_.7s_ease-out] rounded-[32px] border border-white/70 bg-white/80 p-10 text-center shadow-2xl shadow-slate-200/70 backdrop-blur-xl md:p-16">
            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
              <Icon name="chart" />
            </div>

            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Project Intelligence Platform
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Turn CSV Data Into
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Project Intelligence
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 md:text-lg">
              Upload your client CSV and
              automatically transform
              projects, members, tasks,
              progress, deadlines and
              risks into an interactive
              analytics dashboard.
            </p>

            <label className="mx-auto mt-9 inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-[#172033] px-7 py-4 text-sm font-bold text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <Icon name="upload" />

              {isImporting
                ? "Processing CSV..."
                : "Import Client CSV"}

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={
                  handleImportCSV
                }
                className="hidden"
              />
            </label>

            {error && (
              <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {[
                [
                  "01",
                  "Upload",
                  "Import raw client CSV",
                ],
                [
                  "02",
                  "Analyze",
                  "Detect structure automatically",
                ],
                [
                  "03",
                  "Decide",
                  "Find risk and performance",
                ],
              ].map(
                ([number, title, text]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                  >
                    <span className="text-xs font-black text-blue-500">
                      {number}
                    </span>

                    <h3 className="mt-2 font-bold">
                      {title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {text}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <style jsx global>{`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(24px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </main>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172033]">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 top-20 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -right-48 top-[35%] h-[500px] w-[500px] rounded-full bg-purple-100/30 blur-3xl" />
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Icon name="chart" />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight">
                DataStudio
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Project Intelligence
                Platform
              </p>
            </div>
          </div>

          {/* TOP NAV */}

          <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 md:flex">
            {[
              {
                id: "projects" as Tab,
                label: "All Projects",
                icon: "folder" as const,
              },
              {
                id: "members" as Tab,
                label: "Team Members",
                icon: "users" as const,
              },
              {
                id: "analytics" as Tab,
                label: "Analytics / Status",
                icon: "chart" as const,
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  setActiveTab(
                    item.id
                  )
                }
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  activeTab ===
                  item.id
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon
                  name={
                    item.icon
                  }
                />

                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right lg:block">
              <p className="text-xs font-semibold text-slate-700">
                {fileName}
              </p>

              <p className="text-[11px] text-slate-400">
                {formatNumber(
                  rows.length
                )}{" "}
                source records
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
              D
            </div>
          </div>
        </div>

        {/* MOBILE NAV */}

        <div className="overflow-x-auto border-t border-slate-100 px-5 py-2 md:hidden">
          <div className="flex min-w-max gap-2">
            {[
              ["projects", "All Projects"],
              ["members", "Team Members"],
              ["analytics", "Analytics"],
            ].map(
              ([id, label]) => (
                <button
                  key={id}
                  onClick={() =>
                    setActiveTab(
                      id as Tab
                    )
                  }
                  className={`rounded-xl px-4 py-2 text-xs font-bold ${
                    activeTab ===
                    id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        {/* =================================================
            PAGE INTRO
        ================================================= */}

        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Live Dataset
              </span>

              <span className="text-xs text-slate-400">
                Last processed:{" "}
                {new Date().toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  }
                )}
              </span>
            </div>

            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              {activeTab ===
              "projects"
                ? "All Projects"
                : activeTab ===
                  "members"
                ? "Team Performance"
                : "Analytics & Status Intelligence"}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Dynamic analytics generated
              directly from{" "}
              <span className="font-semibold text-slate-700">
                {fileName}
              </span>
              . No hard-coded project
              metrics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700">
              <Icon name="upload" />
              Replace CSV

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={
                  handleImportCSV
                }
                className="hidden"
              />
            </label>

            <button
              onClick={exportCSV}
              disabled={
                !filteredRecords.length
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="download" />
              Export
            </button>

            <button
              onClick={
                resetFilters
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Icon name="refresh" />
              Reset
            </button>
          </div>
        </div>

        {/* =================================================
            GLOBAL FILTER BAR
        ================================================= */}

        <div className="mb-7 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Icon name="search" />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(1);
                }}
                placeholder="Search project, member, task..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <select
              value={
                projectFilter
              }
              onChange={(event) => {
                setProjectFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              <option value="All">
                All Projects
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={project}
                    value={project}
                  >
                    {project}
                  </option>
                )
              )}
            </select>

            <select
              value={
                memberFilter
              }
              onChange={(event) => {
                setMemberFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              <option value="All">
                All Members
              </option>

              {members.map(
                (member) => (
                  <option
                    key={member}
                    value={member}
                  >
                    {member}
                  </option>
                )
              )}
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(event) => {
                setStatusFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              <option value="All">
                All Status
              </option>

              {statuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>

            <select
              value={
                riskFilter
              }
              onChange={(event) => {
                setRiskFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              <option value="All">
                All Risk
              </option>
              <option value="Low">
                Low Risk
              </option>
              <option value="Medium">
                Medium Risk
              </option>
              <option value="High">
                High Risk
              </option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Icon name="filter" />

              <span>
                Active view:
              </span>

              <strong className="text-slate-800">
                {projectFilter !==
                "All"
                  ? projectFilter
                  : "All Projects"}
              </strong>

              <span>•</span>

              <strong className="text-blue-600">
                Showing{" "}
                {formatNumber(
                  filteredRecords.length
                )}{" "}
                of{" "}
                {formatNumber(
                  records.length
                )}{" "}
                Tasks
              </strong>
            </div>

            <div className="text-xs font-semibold text-slate-400">
              {dataQuality.columns}{" "}
              columns detected
            </div>
          </div>
        </div>

        {/* =================================================
            KPI GRID
        ================================================= */}

        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
          {[
            {
              label: "Total Tasks",
              value: totalTasks,
              icon: "activity" as const,
              className:
                "from-blue-500 to-indigo-600",
            },
            {
              label: "Completed",
              value: completed,
              icon: "check" as const,
              className:
                "from-emerald-500 to-green-600",
            },
            {
              label: "In Progress",
              value: inProgress,
              icon: "activity" as const,
              className:
                "from-blue-500 to-cyan-500",
            },
            {
              label: "Not Started",
              value: notStarted,
              icon: "clock" as const,
              className:
                "from-amber-400 to-orange-500",
            },
            {
              label: "At Risk",
              value: atRisk,
              icon: "alert" as const,
              className:
                "from-orange-500 to-red-500",
            },
            {
              label: "Delayed",
              value: delayed,
              icon: "alert" as const,
              className:
                "from-red-500 to-rose-600",
            },
            {
              label: "Avg Progress",
              value:
                formatPercent(
                  avgProgress
                ),
              icon: "chart" as const,
              className:
                "from-violet-500 to-purple-600",
            },
            {
              label: "Avg Days",
              value:
                avgDaysRequired
                  ? Math.round(
                      avgDaysRequired
                    )
                  : 0,
              icon: "calendar" as const,
              className:
                "from-slate-600 to-slate-800",
            },
          ].map(
            (item, index) => (
              <button
                key={item.label}
                onClick={() => {
                  if (
                    item.label ===
                    "Completed"
                  ) {
                    openStatus(
                      "Completed"
                    );
                  }

                  if (
                    item.label ===
                    "In Progress"
                  ) {
                    openStatus(
                      "In Progress"
                    );
                  }

                  if (
                    item.label ===
                    "Not Started"
                  ) {
                    openStatus(
                      "Not Started"
                    );
                  }

                  if (
                    item.label ===
                    "At Risk"
                  ) {
                    openStatus(
                      "At Risk"
                    );
                  }

                  if (
                    item.label ===
                    "Delayed"
                  ) {
                    openStatus(
                      "Delayed"
                    );
                  }
                }}
                className="group rounded-2xl border border-white/80 bg-white p-4 text-left shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                style={{
                  animationDelay: `${
                    index * 45
                  }ms`,
                }}
              >
                <div
                  className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.className} text-white shadow-lg`}
                >
                  <Icon
                    name={item.icon}
                  />
                </div>

                <p className="text-xs font-semibold text-slate-500">
                  {item.label}
                </p>

                <p className="mt-1 text-2xl font-black tracking-tight">
                  {typeof item.value ===
                  "number"
                    ? formatNumber(
                        item.value
                      )
                    : item.value}
                </p>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.className} transition-all duration-1000 group-hover:w-full`}
                    style={{
                      width:
                        item.label ===
                        "Avg Progress"
                          ? `${clamp(
                              avgProgress,
                              0,
                              100
                            )}%`
                          : "55%",
                    }}
                  />
                </div>
              </button>
            )
          )}
        </div>

        {/* =================================================
            PROJECTS TAB
        ================================================= */}

        {activeTab ===
          "projects" && (
          <>
            {/* PROJECT CARDS */}

            <div className="mb-7">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-black">
                    Project Portfolio
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Click any project
                    to drill into
                    project-level
                    intelligence.
                  </p>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {projects.length}{" "}
                  projects
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projectAnalytics.map(
                  (
                    item,
                    index
                  ) => (
                    <button
                      key={
                        item.project
                      }
                      onClick={() =>
                        openProject(
                          item.project
                        )
                      }
                      className={`group relative overflow-hidden rounded-3xl border bg-white p-6 text-left shadow-lg shadow-slate-200/40 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl ${
                        selectedProject ===
                        item.project
                          ? "border-blue-400 ring-4 ring-blue-50"
                          : "border-white"
                      }`}
                      style={{
                        animation:
                          "fadeUp .5s ease-out both",
                        animationDelay: `${index * 70}ms`,
                      }}
                    >
                      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-50 transition duration-500 group-hover:scale-150" />

                      <div className="relative">
                        <div className="mb-5 flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Icon name="folder" />
                          </div>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                            {item.tasks}{" "}
                            tasks
                          </span>
                        </div>

                        <h4 className="truncate text-lg font-black">
                          {
                            item.project
                          }
                        </h4>

                        <div className="mt-5">
                          <div className="mb-2 flex justify-between text-xs">
                            <span className="font-semibold text-slate-500">
                              Overall
                              progress
                            </span>

                            <span className="font-black text-blue-600">
                              {formatPercent(
                                item.progress
                              )}
                            </span>
                          </div>

                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                              style={{
                                width: `${clamp(
                                  item.progress,
                                  0,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-emerald-50 p-3">
                            <p className="text-[10px] font-bold text-emerald-600">
                              Done
                            </p>

                            <p className="mt-1 font-black text-emerald-700">
                              {
                                item.completed
                              }
                            </p>
                          </div>

                          <div className="rounded-xl bg-blue-50 p-3">
                            <p className="text-[10px] font-bold text-blue-600">
                              Progress
                            </p>

                            <p className="mt-1 font-black text-blue-700">
                              {Math.round(
                                item.progress
                              )}
                              %
                            </p>
                          </div>

                          <div className="rounded-xl bg-red-50 p-3">
                            <p className="text-[10px] font-bold text-red-600">
                              Risk
                            </p>

                            <p className="mt-1 font-black text-red-700">
                              {
                                item.risk
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between text-xs font-bold text-blue-600">
                          View project intelligence

                          <Icon name="arrow" />
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ANALYTICS ROW */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* PROGRESS */}

              <div className="rounded-3xl border border-white bg-white p-6 shadow-lg shadow-slate-200/40 xl:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-black">
                      Project Progress
                      Overview
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Current portfolio
                      completion
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {formatPercent(
                      avgProgress
                    )}{" "}
                    average
                  </span>
                </div>

                <div className="space-y-5">
                  {projectAnalytics
                    .slice(0, 6)
                    .map(
                      (item) => (
                        <button
                          key={
                            item.project
                          }
                          onClick={() =>
                            openProject(
                              item.project
                            )
                          }
                          className="group w-full text-left"
                        >
                          <div className="mb-2 flex justify-between text-xs">
                            <span className="font-bold text-slate-700">
                              {
                                item.project
                              }
                            </span>

                            <span className="font-black text-blue-600">
                              {Math.round(
                                item.progress
                              )}
                              %
                            </span>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 group-hover:brightness-110"
                              style={{
                                width: `${clamp(
                                  item.progress,
                                  0,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </button>
                      )
                    )}
                </div>
              </div>

              {/* DEADLINE INTELLIGENCE */}

              <div className="rounded-3xl border border-white bg-white p-6 shadow-lg shadow-slate-200/40">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <Icon name="alert" />
                  </div>

                  <div>
                    <h3 className="font-black">
                      Deadline
                      Intelligence
                    </h3>

                    <p className="text-xs text-slate-500">
                      Action required
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setRiskFilter(
                        "High"
                      );
                      setPage(1);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-red-50 p-4 text-left transition hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-red-500">
                        High Risk
                      </p>

                      <p className="mt-1 text-xl font-black text-red-700">
                        {
                          riskAlerts
                            .highRisk
                            .length
                        }
                      </p>
                    </div>

                    <Icon name="arrow" />
                  </button>

                  <button
                    onClick={() =>
                      openStatus(
                        "Delayed"
                      )
                    }
                    className="flex w-full items-center justify-between rounded-2xl bg-orange-50 p-4 text-left transition hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-orange-500">
                        Delayed
                      </p>

                      <p className="mt-1 text-xl font-black text-orange-700">
                        {
                          riskAlerts
                            .delayed
                            .length
                        }
                      </p>
                    </div>

                    <Icon name="arrow" />
                  </button>

                  <button
                    onClick={() =>
                      setRiskFilter(
                        "Medium"
                      )
                    }
                    className="flex w-full items-center justify-between rounded-2xl bg-amber-50 p-4 text-left transition hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-amber-600">
                        Due within
                        7 days
                      </p>

                      <p className="mt-1 text-xl font-black text-amber-700">
                        {
                          riskAlerts
                            .approaching
                            .length
                        }
                      </p>
                    </div>

                    <Icon name="arrow" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =================================================
            MEMBERS TAB
        ================================================= */}

        {activeTab ===
          "members" && (
          <div className="rounded-3xl border border-white bg-white p-6 shadow-lg shadow-slate-200/40">
            <div className="mb-7">
              <h3 className="text-xl font-black">
                Team Work
                Distribution
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Click a member to open
                their individual
                performance dashboard.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-4">
                      Member
                    </th>

                    <th className="px-4 py-4">
                      Tasks
                    </th>

                    <th className="px-4 py-4">
                      Completed
                    </th>

                    <th className="px-4 py-4">
                      Progress
                    </th>

                    <th className="px-4 py-4">
                      Delayed
                    </th>

                    <th className="px-4 py-4">
                      Risk
                    </th>

                    <th className="px-4 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {memberAnalytics.map(
                    (item) => (
                      <tr
                        key={
                          item.member
                        }
                        className="group border-b border-slate-50 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-5">
                          <button
                            onClick={() =>
                              openMember(
                                item.member
                              )
                            }
                            className="flex items-center gap-3 text-left"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white">
                              {item.member
                                .slice(
                                  0,
                                  2
                                )
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-bold">
                                {
                                  item.member
                                }
                              </p>

                              <p className="text-xs text-slate-400">
                                View
                                performance
                              </p>
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-5 font-bold">
                          {
                            item.tasks
                          }
                        </td>

                        <td className="px-4 py-5 font-bold text-emerald-600">
                          {
                            item.completed
                          }
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${clamp(
                                    item.progress,
                                    0,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>

                            <span className="text-xs font-bold">
                              {Math.round(
                                item.progress
                              )}
                              %
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-5 font-bold text-orange-600">
                          {
                            item.delayed
                          }
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.highRisk >
                              0
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {item.highRisk >
                            0
                              ? "High"
                              : "Low"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <button
                            onClick={() =>
                              openMember(
                                item.member
                              )
                            }
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-600 hover:text-white"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================
            ANALYTICS TAB
        ================================================= */}

        {activeTab ===
          "analytics" && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* STATUS DONUT */}

              <div className="rounded-3xl border border-white bg-white p-7 shadow-lg shadow-slate-200/40">
                <div className="mb-7">
                  <h3 className="text-lg font-black">
                    Status Distribution
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Click a status to
                    drill into
                    matching tasks.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
                  <div
                    className="relative flex h-56 w-56 shrink-0 items-center justify-center rounded-full shadow-inner"
                    style={{
                      background:
                        `conic-gradient(${donutGradient})`,
                    }}
                  >
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-xl">
                      <span className="text-3xl font-black">
                        {
                          filteredRecords.length
                        }
                      </span>

                      <span className="text-xs font-semibold text-slate-400">
                        Total Tasks
                      </span>
                    </div>
                  </div>

                  <div className="w-full space-y-3">
                    {statusAnalytics.map(
                      (item) => (
                        <button
                          key={
                            item.status
                          }
                          onClick={() =>
                            openStatus(
                              item.status
                            )
                          }
                          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor:
                                  STATUS_COLORS[
                                    item.status
                                  ],
                              }}
                            />

                            <span className="text-sm font-semibold">
                              {
                                item.status
                              }
                            </span>
                          </div>

                          <span className="text-sm font-black">
                            {item.value}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* PERFORMANCE */}

              <div className="rounded-3xl border border-white bg-white p-7 shadow-lg shadow-slate-200/40">
                <div className="mb-7">
                  <h3 className="text-lg font-black">
                    Performance Trend
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Monthly task volume
                    and completion
                    progress.
                  </p>
                </div>

                {monthlyAnalytics.length >
                0 ? (
                  <div className="flex h-64 items-end gap-3">
                    {monthlyAnalytics.map(
                      (
                        month,
                        index
                      ) => {
                        const maxTasks =
                          Math.max(
                            ...monthlyAnalytics.map(
                              (item) =>
                                item.tasks
                            ),
                            1
                          );

                        return (
                          <button
                            key={`${month.label}-${index}`}
                            onClick={() =>
                              setDrawer({
                                title:
                                  month.label,
                                subtitle:
                                  `${month.tasks} tasks in this period`,
                                items: [
                                  {
                                    title:
                                      "Tasks",
                                    value:
                                      String(
                                        month.tasks
                                      ),
                                  },
                                  {
                                    title:
                                      "Completed",
                                    value:
                                      String(
                                        month.completed
                                      ),
                                  },
                                  {
                                    title:
                                      "Average Progress",
                                    value:
                                      `${Math.round(
                                        month.progress
                                      )}%`,
                                  },
                                ],
                                records:
                                  filteredRecords.filter(
                                    (record) => {
                                      const date =
                                        parseDate(
                                          record.endDate
                                        ) ||
                                        parseDate(
                                          record.startDate
                                        );

                                      if (
                                        !date
                                      ) {
                                        return false;
                                      }

                                      return (
                                        date.toLocaleDateString(
                                          "en-US",
                                          {
                                            month:
                                              "short",
                                            year:
                                              "numeric",
                                          }
                                        ) ===
                                        month.label
                                      );
                                    }
                                  ),
                              })
                            }
                            className="group flex h-full flex-1 flex-col justify-end"
                          >
                            <div className="relative flex h-[85%] items-end justify-center">
                              <div
                                className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-500 group-hover:scale-x-110 group-hover:brightness-110"
                                style={{
                                  height: `${Math.max(
                                    8,
                                    (month.tasks /
                                      maxTasks) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>

                            <span className="mt-3 truncate text-[10px] font-bold text-slate-400">
                              {
                                month.label
                              }
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
                    Date information
                    unavailable.
                  </div>
                )}
              </div>
            </div>

            {/* RISK TABLE */}

            <div className="mt-6 rounded-3xl border border-white bg-white p-7 shadow-lg shadow-slate-200/40">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">
                    Risk & Delay
                    Intelligence
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Automatically detected
                    using progress,
                    deadlines and
                    delay signals.
                  </p>
                </div>

                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                  {
                    riskAlerts
                      .highRisk
                      .length
                  }{" "}
                  high risk
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    title:
                      "High Risk Tasks",
                    value:
                      riskAlerts
                        .highRisk
                        .length,
                    text:
                      "Immediate attention required",
                    icon: "alert" as const,
                    bg: "bg-red-50",
                    color:
                      "text-red-600",
                  },
                  {
                    title:
                      "Delayed Tasks",
                    value:
                      riskAlerts
                        .delayed
                        .length,
                    text:
                      "Past expected deadline",
                    icon: "clock" as const,
                    bg: "bg-orange-50",
                    color:
                      "text-orange-600",
                  },
                  {
                    title:
                      "Deadline Approaching",
                    value:
                      riskAlerts
                        .approaching
                        .length,
                    text:
                      "Due within 7 days",
                    icon: "calendar" as const,
                    bg: "bg-amber-50",
                    color:
                      "text-amber-600",
                  },
                ].map(
                  (item) => (
                    <button
                      key={
                        item.title
                      }
                      onClick={() =>
                        setRiskFilter(
                          item.title ===
                            "High Risk Tasks"
                            ? "High"
                            : item.title ===
                              "Delayed Tasks"
                            ? "High"
                            : "Medium"
                        )
                      }
                      className={`rounded-2xl ${item.bg} p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg`}
                    >
                      <div
                        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white ${item.color}`}
                      >
                        <Icon
                          name={
                            item.icon
                          }
                        />
                      </div>

                      <p
                        className={`text-xs font-bold ${item.color}`}
                      >
                        {
                          item.title
                        }
                      </p>

                      <p className="mt-1 text-3xl font-black">
                        {formatNumber(
                          item.value
                        )}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {item.text}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* DATA QUALITY */}

            <div className="mt-6 rounded-3xl border border-white bg-white p-7 shadow-lg shadow-slate-200/40">
              <div className="mb-6">
                <h3 className="text-lg font-black">
                  Data Quality
                  Intelligence
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Validation summary for
                  the imported dataset.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  [
                    "Columns Detected",
                    dataQuality.columns,
                    "blue",
                  ],
                  [
                    "Missing Values",
                    dataQuality.missing,
                    "amber",
                  ],
                  [
                    "Duplicate Records",
                    dataQuality.duplicates,
                    "red",
                  ],
                  [
                    "Valid Records",
                    dataQuality.valid,
                    "green",
                  ],
                ].map(
                  (item) => (
                    <div
                      key={item[0]}
                      className="rounded-2xl bg-slate-50 p-5"
                    >
                      <p className="text-xs font-semibold text-slate-500">
                        {
                          item[0]
                        }
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {
                          item[1]
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}

        {/* =================================================
            FULL TABLE
        ================================================= */}

        <div className="mt-7 overflow-hidden rounded-3xl border border-white bg-white shadow-lg shadow-slate-200/40">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-black">
                Full Project Overview
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Showing{" "}
                {paginatedRecords.length}{" "}
                of{" "}
                {filteredRecords.length}{" "}
                filtered tasks
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>
                Page
              </span>

              <strong className="text-slate-700">
                {page}
              </strong>

              <span>
                of
              </span>

              <strong className="text-slate-700">
                {totalPages}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            {paginatedRecords.length >
            0 ? (
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">
                      Project
                    </th>

                    <th className="px-6 py-4">
                      Task
                    </th>

                    <th className="px-6 py-4">
                      Member
                    </th>

                    <th className="px-6 py-4">
                      Target
                    </th>

                    <th className="px-6 py-4">
                      Timeline
                    </th>

                    <th className="px-6 py-4">
                      Progress
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Risk
                    </th>

                    <th className="px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                        className="border-t border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <button
                            onClick={() =>
                              openProject(
                                record.project
                              )
                            }
                            className="max-w-[180px] truncate font-bold text-blue-600 hover:underline"
                          >
                            {
                              record.project
                            }
                          </button>
                        </td>

                        <td className="max-w-[240px] truncate px-6 py-5 font-semibold text-slate-700">
                          {
                            record.task
                          }
                        </td>

                        <td className="px-6 py-5">
                          <button
                            onClick={() =>
                              openMember(
                                record.member
                              )
                            }
                            className="font-semibold hover:text-blue-600"
                          >
                            {
                              record.member
                            }
                          </button>
                        </td>

                        <td className="px-6 py-5">
                          {record.target !==
                          null
                            ? formatNumber(
                                record.target
                              )
                            : "—"}
                        </td>

                        <td className="px-6 py-5">
                          <div className="text-xs">
                            <p className="font-semibold">
                              {formatDate(
                                record.startDate
                              )}
                            </p>

                            <p className="mt-1 text-slate-400">
                              →
                            </p>

                            <p className="font-semibold">
                              {formatDate(
                                record.endDate
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex min-w-[130px] items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                style={{
                                  width: `${record.progress}%`,
                                }}
                              />
                            </div>

                            <span className="text-xs font-black">
                              {Math.round(
                                record.progress
                              )}
                              %
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <button
                            onClick={() =>
                              openStatus(
                                record.status
                              )
                            }
                            className="rounded-full px-3 py-1.5 text-xs font-bold"
                            style={{
                              backgroundColor: `${STATUS_COLORS[record.status]}18`,
                              color:
                                STATUS_COLORS[
                                  record.status
                                ],
                            }}
                          >
                            {
                              record.status
                            }
                          </button>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              record.risk ===
                              "High"
                                ? "bg-red-50 text-red-600"
                                : record.risk ===
                                  "Medium"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {
                              record.risk
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <button
                            onClick={() =>
                              setDrawer({
                                title:
                                  record.task,
                                subtitle:
                                  record.project,
                                items: [
                                  {
                                    title:
                                      "Member",
                                    value:
                                      record.member,
                                  },
                                  {
                                    title:
                                      "Progress",
                                    value:
                                      `${Math.round(
                                        record.progress
                                      )}%`,
                                  },
                                  {
                                    title:
                                      "Status",
                                    value:
                                      record.status,
                                  },
                                  {
                                    title:
                                      "Risk",
                                    value:
                                      record.risk,
                                  },
                                  {
                                    title:
                                      "Days Required",
                                    value:
                                      record.daysRequired !==
                                      null
                                        ? `${record.daysRequired} days`
                                        : "—",
                                  },
                                  {
                                    title:
                                      "Delay",
                                    value:
                                      record.delayDays >
                                      0
                                        ? `${record.delayDays} days`
                                        : "On schedule",
                                  },
                                ],
                                records: [
                                  record,
                                ],
                              })
                            }
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <div className="flex h-52 items-center justify-center text-sm text-slate-400">
                No records match the
                current filters.
              </div>
            )}
          </div>

          {/* PAGINATION */}

          {filteredRecords.length >
            PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-xs text-slate-400">
                {formatNumber(
                  filteredRecords.length
                )}{" "}
                records
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={
                    page === 1
                  }
                  onClick={() =>
                    setPage(
                      (value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                    )
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-30"
                >
                  Previous
                </button>

                <span className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                  {page}
                </span>

                <button
                  disabled={
                    page ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (value) =>
                        Math.min(
                          totalPages,
                          value + 1
                        )
                    )
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          DETAIL DRAWER
      ================================================= */}

      {drawer && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm"
            onClick={() =>
              setDrawer(null)
            }
          />

          <aside className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-xl animate-[slideIn_.35s_ease-out] flex-col bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                    Drill Down
                  </span>

                  <h2 className="mt-3 text-2xl font-black tracking-tight">
                    {
                      drawer.title
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      drawer.subtitle
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    setDrawer(null)
                  }
                  className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white"
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                {drawer.items.map(
                  (item) => (
                    <div
                      key={
                        item.title
                      }
                      className="rounded-2xl bg-slate-50 p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {
                          item.title
                        }
                      </p>

                      <p className="mt-2 truncate text-lg font-black">
                        {
                          item.value
                        }
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="mt-7">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-black">
                      Related Records
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {
                        drawer.records
                          .length
                      }{" "}
                      records
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {drawer.records
                    .slice(0, 30)
                    .map(
                      (record) => (
                        <button
                          key={
                            record.id
                          }
                          onClick={() =>
                            setDrawer({
                              title:
                                record.task,
                              subtitle:
                                record.project,
                              items: [
                                {
                                  title:
                                    "Member",
                                  value:
                                    record.member,
                                },
                                {
                                  title:
                                    "Progress",
                                  value:
                                    `${Math.round(
                                      record.progress
                                    )}%`,
                                },
                                {
                                  title:
                                    "Status",
                                  value:
                                    record.status,
                                },
                                {
                                  title:
                                    "Risk",
                                  value:
                                    record.risk,
                                },
                                {
                                  title:
                                    "Deadline",
                                  value:
                                    formatDate(
                                      record.endDate
                                    ),
                                },
                                {
                                  title:
                                    "Delay",
                                  value:
                                    record.delayDays >
                                    0
                                      ? `${record.delayDays} days`
                                      : "On schedule",
                                },
                              ],
                              records: [
                                record,
                              ],
                            })
                          }
                          className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate font-bold">
                                {
                                  record.task
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  record.member
                                }
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                record.risk ===
                                "High"
                                  ? "bg-red-50 text-red-600"
                                  : record.risk ===
                                    "Medium"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {
                                record.risk
                              }
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="mb-1 flex justify-between text-[10px]">
                              <span className="text-slate-400">
                                Progress
                              </span>

                              <span className="font-bold">
                                {Math.round(
                                  record.progress
                                )}
                                %
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${record.progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </button>
                      )
                    )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* =================================================
          GLOBAL ANIMATION
      ================================================= */}

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        ::selection {
          background: #dbeafe;
          color: #1d4ed8;
        }
      `}</style>
    </main>
  );
}
