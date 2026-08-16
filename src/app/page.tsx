"use client";

import { ChangeEvent, useMemo, useState } from "react";

type CSVRow = Record<string, string>;

type CategoryItem = {
  name: string;
  value: number;
};

type ChartItem = {
  label: string;
  value: number;
};

const GOOGLE_COLORS = [
  "#4285F4",
  "#34A853",
  "#FBBC04",
  "#EA4335",
  "#A142F4",
  "#00ACC1",
  "#FF7043",
  "#5F6368",
];

const STATUS_WORDS = {
  completed: [
    "completed",
    "complete",
    "done",
    "closed",
    "finished",
    "success",
  ],
  pending: [
    "pending",
    "todo",
    "to do",
    "not started",
    "waiting",
    "open",
  ],
  active: [
    "active",
    "in progress",
    "ongoing",
    "working",
    "started",
  ],
};

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

  return result.map((value) =>
    value.replace(/^"(.*)"$/, "$1").trim()
  );
}

function parseCSV(text: string): CSVRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]).map(
    normalizeColumnName
  );

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);

    const row: CSVRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function findColumn(
  rows: CSVRow[],
  possibleNames: string[]
): string | null {
  if (!rows.length) {
    return null;
  }

  const columns = Object.keys(rows[0]);

  // Exact match
  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);

    const exact = columns.find(
      (column) => column === normalized
    );

    if (exact) {
      return exact;
    }
  }

  // Partial match
  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);

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

function findStatusColumn(rows: CSVRow[]) {
  return findColumn(rows, [
    "status",
    "project_status",
    "task_status",
    "state",
    "project_state",
  ]);
}

function findCategoryColumn(rows: CSVRow[]) {
  return findColumn(rows, [
    "category",
    "project_category",
    "task_category",
    "type",
    "department",
    "team",
    "group",
  ]);
}

function findProgressColumn(rows: CSVRow[]) {
  return findColumn(rows, [
    "progress",
    "completion",
    "completion_percentage",
    "percent_complete",
    "percentage",
    "progress_percentage",
  ]);
}

function findDateColumn(rows: CSVRow[]) {
  return findColumn(rows, [
    "date",
    "created_at",
    "updated_at",
    "start_date",
    "end_date",
    "due_date",
    "month",
    "year_month",
  ]);
}

function findNameColumn(rows: CSVRow[]) {
  return findColumn(rows, [
    "name",
    "project_name",
    "task_name",
    "customer_name",
    "employee_name",
    "title",
    "project",
    "task",
  ]);
}

function isNumber(value: string) {
  if (!value.trim()) {
    return false;
  }

  const cleaned = value
    .replace(/[$₹€£,%\s]/g, "")
    .replace(/,/g, "");

  return !Number.isNaN(Number(cleaned));
}

function numberValue(value: string) {
  const cleaned = value
    .replace(/[$₹€£,%\s]/g, "")
    .replace(/,/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function getNumericColumns(rows: CSVRow[]) {
  if (!rows.length) {
    return [];
  }

  return Object.keys(rows[0]).filter((column) => {
    const values = rows
      .slice(0, 100)
      .map((row) => row[column])
      .filter((value) => value.trim() !== "");

    if (!values.length) {
      return false;
    }

    const numericValues = values.filter(isNumber);

    return (
      numericValues.length / values.length >= 0.7
    );
  });
}

function getFirstCategoricalColumn(
  rows: CSVRow[]
): string | null {
  if (!rows.length) {
    return null;
  }

  const columns = Object.keys(rows[0]);

  for (const column of columns) {
    const values = rows
      .map((row) => row[column]?.trim())
      .filter(Boolean);

    if (!values.length) {
      continue;
    }

    const uniqueValues = new Set(values);

    const numericRatio =
      values.filter(isNumber).length / values.length;

    if (
      numericRatio < 0.5 &&
      uniqueValues.size > 1 &&
      uniqueValues.size <= Math.max(20, rows.length * 0.5)
    ) {
      return column;
    }
  }

  return null;
}

function matchesStatus(
  value: string,
  words: string[]
) {
  const normalized = value
    .toLowerCase()
    .trim();

  return words.some(
    (word) =>
      normalized === word ||
      normalized.includes(word)
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  return value;
}

export default function Home() {
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  /*
   * ================================
   * AUTOMATIC COLUMN DETECTION
   * ================================
   */

  const statusColumn = useMemo(
    () => findStatusColumn(rows),
    [rows]
  );

  const categoryColumn = useMemo(
    () => findCategoryColumn(rows),
    [rows]
  );

  const progressColumn = useMemo(
    () => findProgressColumn(rows),
    [rows]
  );

  const dateColumn = useMemo(
    () => findDateColumn(rows),
    [rows]
  );

  const nameColumn = useMemo(
    () => findNameColumn(rows),
    [rows]
  );

  const numericColumns = useMemo(
    () => getNumericColumns(rows),
    [rows]
  );

  const automaticCategoryColumn = useMemo(
    () =>
      categoryColumn ||
      getFirstCategoricalColumn(rows),
    [categoryColumn, rows]
  );

  /*
   * ================================
   * SEARCH
   * ================================
   */

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return rows;
    }

    const query = search.toLowerCase().trim();

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [rows, search]);

  /*
   * ================================
   * KPI CALCULATIONS
   * ================================
   */

  const totalRecords = rows.length;

  const completedCount = useMemo(() => {
    if (!statusColumn) {
      return 0;
    }

    return rows.filter((row) =>
      matchesStatus(
        row[statusColumn] || "",
        STATUS_WORDS.completed
      )
    ).length;
  }, [rows, statusColumn]);

  const pendingCount = useMemo(() => {
    if (!statusColumn) {
      return 0;
    }

    return rows.filter((row) =>
      matchesStatus(
        row[statusColumn] || "",
        STATUS_WORDS.pending
      )
    ).length;
  }, [rows, statusColumn]);

  const activeCount = useMemo(() => {
    if (!statusColumn) {
      return 0;
    }

    return rows.filter((row) =>
      matchesStatus(
        row[statusColumn] || "",
        STATUS_WORDS.active
      )
    ).length;
  }, [rows, statusColumn]);

  const averageProgress = useMemo(() => {
    if (!progressColumn) {
      return 0;
    }

    const values = rows
      .map((row) =>
        numberValue(row[progressColumn] || "")
      )
      .filter(
        (value): value is number =>
          value !== null
      );

    if (!values.length) {
      return 0;
    }

    return Math.round(
      values.reduce(
        (sum, value) => sum + value,
        0
      ) / values.length
    );
  }, [rows, progressColumn]);

  /*
   * ================================
   * CATEGORY DATA
   * ================================
   */

  const categoryData = useMemo<CategoryItem[]>(() => {
    if (!automaticCategoryColumn) {
      return [];
    }

    const counts: Record<string, number> = {};

    rows.forEach((row) => {
      const value =
        row[automaticCategoryColumn]?.trim() ||
        "Unknown";

      counts[value] =
        (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [rows, automaticCategoryColumn]);

  const maxCategoryValue =
    categoryData.length > 0
      ? Math.max(
          ...categoryData.map(
            (item) => item.value
          )
        )
      : 1;

  /*
   * ================================
   * STATUS / DONUT DATA
   * ================================
   */

  const statusData = useMemo<CategoryItem[]>(() => {
    if (!statusColumn) {
      return [];
    }

    const counts: Record<string, number> = {};

    rows.forEach((row) => {
      const value =
        row[statusColumn]?.trim() ||
        "Unknown";

      counts[value] =
        (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [rows, statusColumn]);

  const statusTotal =
    statusData.reduce(
      (sum, item) => sum + item.value,
      0
    ) || 1;

  /*
   * ================================
   * DATE / MONTHLY DATA
   * ================================
   */

  const monthlyData = useMemo<ChartItem[]>(() => {
    if (!dateColumn) {
      return [];
    }

    const counts: Record<string, number> = {};

    rows.forEach((row) => {
      const rawValue =
        row[dateColumn]?.trim();

      if (!rawValue) {
        return;
      }

      const date = new Date(rawValue);

      let label = rawValue;

      if (!Number.isNaN(date.getTime())) {
        label = date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            year: "numeric",
          }
        );
      }

      counts[label] =
        (counts[label] || 0) + 1;
    });

    return Object.entries(counts)
      .slice(-12)
      .map(([label, value]) => ({
        label,
        value,
      }));
  }, [rows, dateColumn]);

  const maxMonthlyValue =
    monthlyData.length > 0
      ? Math.max(
          ...monthlyData.map(
            (item) => item.value
          )
        )
      : 1;

  /*
   * ================================
   * NUMERIC DATA
   * ================================
   */

  const mainNumericColumn =
    numericColumns.find(
      (column) =>
        column.includes("sales") ||
        column.includes("revenue") ||
        column.includes("amount") ||
        column.includes("price") ||
        column.includes("value") ||
        column.includes("profit")
    ) ||
    numericColumns[0] ||
    null;

  const numericSummary = useMemo(() => {
    if (!mainNumericColumn) {
      return null;
    }

    const values = rows
      .map((row) =>
        numberValue(
          row[mainNumericColumn] || ""
        )
      )
      .filter(
        (value): value is number =>
          value !== null
      );

    if (!values.length) {
      return null;
    }

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    const average = total / values.length;

    return {
      column: mainNumericColumn,
      total,
      average,
    };
  }, [rows, mainNumericColumn]);

  /*
   * ================================
   * CSV IMPORT
   * ================================
   */

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
        "Please select a CSV file."
      );
      setIsImporting(false);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(
          reader.result || ""
        );

        const parsed = parseCSV(text);

        if (!parsed.length) {
          setError(
            "This CSV file does not contain usable data."
          );
          setIsImporting(false);
          return;
        }

        setRows(parsed);
        setFileName(file.name);
        setSearch("");
        setIsImporting(false);
      } catch {
        setError(
          "Something went wrong while reading the CSV file."
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

    // Allow selecting the same file again later.
    event.target.value = "";
  };

  /*
   * ================================
   * DONUT GRADIENT
   * ================================
   */

  let donutStart = 0;

  const donutGradient = statusData
    .map((item, index) => {
      const percentage =
        (item.value / statusTotal) *
        100;

      const start = donutStart;

      donutStart += percentage;

      const color =
        GOOGLE_COLORS[
          index % GOOGLE_COLORS.length
        ];

      return `${color} ${start}% ${donutStart}%`;
    })
    .join(", ");

  /*
   * ================================
   * UI
   * ================================
   */

  return (
    <main className="min-h-screen bg-white text-[#202124]">

      {/* HEADER */}
      <header className="dashboard-header sticky top-0 z-50">

        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              DataStudio
            </h1>

            <p className="text-sm text-secondary">
              Analytics Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">

            <span className="hidden text-sm text-secondary md:block">
              Dashboard
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4285F4] font-semibold text-white">
              D
            </div>

          </div>

        </div>

      </header>

      {/* MAIN */}
      <section className="dashboard-content mx-auto max-w-[1400px] px-6 py-6">

        {/* TOOLBAR */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h2 className="text-2xl font-bold">
              Analytics Overview
            </h2>

            <p className="mt-1 text-sm text-secondary">

              {fileName
                ? `Dashboard generated from ${fileName}`
                : "Import your client's CSV file to generate the dashboard."}

            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              disabled={!rows.length}
              className="h-10 w-52 rounded-lg border border-[#dadce0] bg-white px-4 text-sm outline-none focus:border-[#4285F4] disabled:cursor-not-allowed disabled:bg-[#f8f9fa]"
            />

            {/* IMPORT CSV */}
            <label className="flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[#4285F4] px-5 text-sm font-medium text-white transition hover:opacity-90">

              {isImporting
                ? "Importing..."
                : "Import CSV"}

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportCSV}
                className="hidden"
              />

            </label>

          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-[#f5c2c7] bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
            {error}
          </div>
        )}

        {/* IMPORT MESSAGE */}
        {!rows.length && !error && (
          <div className="mb-6 rounded-xl border border-dashed border-[#dadce0] bg-[#f8f9fa] p-10 text-center">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0fe] text-2xl">
              ↑
            </div>

            <h3 className="text-lg font-semibold">
              Import Client CSV
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm text-secondary">
              Select your client's CSV file.
              DataStudio will automatically read
              the columns and generate the dashboard.
            </p>

            <label className="mt-5 inline-flex cursor-pointer rounded-lg bg-[#4285F4] px-6 py-3 text-sm font-medium text-white hover:opacity-90">

              Import CSV

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportCSV}
                className="hidden"
              />

            </label>

          </div>
        )}

        {/* KPI CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL */}
          <div className="glass-panel glass-panel-hover p-5">

            <p className="text-sm text-secondary">
              Total Records
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              {formatNumber(totalRecords)}
            </h3>

            <p className="mt-2 text-sm text-[#34A853]">
              {rows.length
                ? "Imported from CSV"
                : "Waiting for CSV"}
            </p>

          </div>

          {/* ACTIVE */}
          <div className="glass-panel glass-panel-hover p-5">

            <p className="text-sm text-secondary">
              Active
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              {formatNumber(activeCount)}
            </h3>

            <p className="mt-2 text-sm text-[#34A853]">
              Based on status
            </p>

          </div>

          {/* COMPLETED */}
          <div className="glass-panel glass-panel-hover p-5">

            <p className="text-sm text-secondary">
              Completed
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              {formatNumber(completedCount)}
            </h3>

            <p className="mt-2 text-sm text-[#4285F4]">

              {progressColumn
                ? `${averageProgress}% average progress`
                : "Based on status"}

            </p>

          </div>

          {/* PENDING */}
          <div className="glass-panel glass-panel-hover p-5">

            <p className="text-sm text-secondary">
              Pending
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              {formatNumber(pendingCount)}
            </h3>

            <p className="mt-2 text-sm text-[#EA4335]">
              Based on status
            </p>

          </div>

        </div>

        {/* NUMERIC SUMMARY */}
        {numericSummary && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="glass-panel p-5">

              <p className="text-sm text-secondary">
                Total {numericSummary.column.replace(
                  /_/g,
                  " "
                )}
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                {numericSummary.total.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>

            </div>

            <div className="glass-panel p-5">

              <p className="text-sm text-secondary">
                Average{" "}
                {numericSummary.column.replace(
                  /_/g,
                  " "
                )}
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                {numericSummary.average.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>

            </div>

          </div>
        )}

        {/* CHART AREA */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* MONTHLY BAR */}
          <div className="glass-panel p-6">

            <div className="mb-5">

              <h3 className="font-semibold">
                Monthly Performance
              </h3>

              <p className="text-sm text-secondary">

                {dateColumn
                  ? `Based on ${dateColumn.replace(
                      /_/g,
                      " "
                    )}`
                  : "Date column not detected"}

              </p>

            </div>

            {monthlyData.length > 0 ? (

              <div className="flex h-64 items-end gap-3 border-b border-[#e5e7eb] px-4 pb-2">

                {monthlyData.map(
                  (item, index) => (

                    <div
                      key={`${item.label}-${index}`}
                      className="group flex h-full flex-1 flex-col justify-end"
                    >

                      <div
                        className="w-full rounded-t-md bg-[#4285F4] transition-all hover:opacity-80"
                        style={{
                          height: `${Math.max(
                            5,
                            (item.value /
                              maxMonthlyValue) *
                              100
                          )}%`,
                        }}
                        title={`${item.label}: ${item.value}`}
                      />

                      <span className="mt-2 truncate text-center text-[10px] text-secondary">
                        {formatDateLabel(
                          item.label
                        )}
                      </span>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="flex h-64 items-center justify-center rounded-lg bg-[#f8f9fa] text-center text-sm text-secondary">

                {rows.length
                  ? "No date column detected in this CSV."
                  : "Import CSV to generate this chart."}

              </div>

            )}

          </div>

          {/* PERFORMANCE TREND */}
          <div className="glass-panel p-6">

            <div className="mb-5">

              <h3 className="font-semibold">
                Performance Trend
              </h3>

              <p className="text-sm text-secondary">
                Dynamic trend from imported data
              </p>

            </div>

            {monthlyData.length > 1 ? (

              <div className="relative h-64 overflow-hidden">

                <svg
                  viewBox="0 0 600 250"
                  className="h-full w-full"
                  preserveAspectRatio="none"
                >

                  <polyline
                    points={monthlyData
                      .map(
                        (item, index) => {

                          const x =
                            (index /
                              Math.max(
                                monthlyData.length -
                                  1,
                                1
                              )) *
                            580 +
                            10;

                          const y =
                            225 -
                            (item.value /
                              maxMonthlyValue) *
                              185;

                          return `${x},${y}`;
                        }
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#4285F4"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                </svg>

              </div>

            ) : (

              <div className="flex h-64 items-center justify-center rounded-lg bg-[#f8f9fa] text-center text-sm text-secondary">

                {rows.length
                  ? "Need at least two date groups for trend."
                  : "Import CSV to generate the trend."}

              </div>

            )}

          </div>

        </div>

        {/* LOWER CARDS */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* CATEGORY */}
          <div className="glass-panel p-6">

            <h3 className="mb-5 font-semibold">
              Category Overview
            </h3>

            {categoryData.length > 0 ? (

              <div className="space-y-4">

                {categoryData.map(
                  (item, index) => (

                    <div key={item.name}>

                      <div className="mb-1 flex justify-between text-sm">

                        <span>
                          {item.name}
                        </span>

                        <span className="text-secondary">
                          {item.value}
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#f1f3f4]">

                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              (item.value /
                                maxCategoryValue) *
                              100
                            }%`,
                            backgroundColor:
                              GOOGLE_COLORS[
                                index %
                                  GOOGLE_COLORS.length
                              ],
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="flex h-40 items-center justify-center text-center text-sm text-secondary">

                {rows.length
                  ? "No suitable category column detected."
                  : "Import CSV to generate categories."}

              </div>

            )}

          </div>

          {/* DONUT */}
          <div className="glass-panel p-6">

            <h3 className="mb-5 font-semibold">
              Status Distribution
            </h3>

            {statusData.length > 0 ? (

              <>

                <div className="flex items-center justify-center">

                  <div
                    className="relative flex h-40 w-40 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${donutGradient})`,
                    }}
                  >

                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white">

                      <div className="text-center">

                        <div className="text-2xl font-bold">
                          {rows.length}
                        </div>

                        <div className="text-xs text-secondary">
                          Records
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                <div className="mt-5 space-y-2">

                  {statusData.map(
                    (item, index) => (

                      <div
                        key={item.name}
                        className="flex items-center justify-between text-sm"
                      >

                        <div className="flex items-center gap-2">

                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                GOOGLE_COLORS[
                                  index %
                                    GOOGLE_COLORS.length
                                ],
                            }}
                          />

                          <span>
                            {item.name}
                          </span>

                        </div>

                        <span className="text-secondary">
                          {item.value}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </>

            ) : (

              <div className="flex h-56 items-center justify-center text-center text-sm text-secondary">

                {rows.length
                  ? "No status column detected."
                  : "Import CSV to generate the donut chart."}

              </div>

            )}

          </div>

          {/* DATA SUMMARY */}
          <div className="glass-panel p-6">

            <h3 className="mb-5 font-semibold">
              Data Summary
            </h3>

            <div className="space-y-5">

              <div>

                <div className="mb-1 flex justify-between text-sm">

                  <span>
                    Average Progress
                  </span>

                  <span>
                    {averageProgress}%
                  </span>

                </div>

                <div className="h-3 rounded-full bg-[#f1f3f4]">

                  <div
                    className="h-full rounded-full bg-[#4285F4]"
                    style={{
                      width: `${Math.min(
                        averageProgress,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

              <div>

                <p className="text-sm text-secondary">
                  Columns detected
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {rows.length
                    ? Object.keys(rows[0]).length
                    : 0}
                </p>

              </div>

              <div>

                <p className="text-sm text-secondary">
                  Records shown
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {filteredRows.length}
                </p>

              </div>

              <div>

                <p className="text-sm text-secondary">
                  Name column
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {nameColumn || "Not detected"}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* DATA TABLE */}
        <div className="glass-panel mt-6 overflow-hidden">

          <div className="border-b border-[#e5e7eb] px-6 py-4">

            <h3 className="font-semibold">
              Detailed Records
            </h3>

            <p className="mt-1 text-sm text-secondary">
              {filteredRows.length} records
            </p>

          </div>

          <div className="overflow-x-auto">

            {filteredRows.length > 0 ? (

              <table className="w-full min-w-max text-left text-sm">

                <thead className="bg-[#f8fafb]">

                  <tr>

                    {Object.keys(filteredRows[0]).map(
                      (column) => (

                        <th
                          key={column}
                          className="whitespace-nowrap px-6 py-4 font-semibold capitalize"
                        >
                          {column.replace(
                            /_/g,
                            " "
                          )}
                        </th>

                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  {filteredRows
                    .slice(0, 100)
                    .map(
                      (row, rowIndex) => (

                        <tr
                          key={rowIndex}
                          className="border-t border-[#e5e7eb] hover:bg-[#f8fafb]"
                        >

                          {Object.keys(row).map(
                            (column) => (

                              <td
                                key={column}
                                className="whitespace-nowrap px-6 py-4"
                              >
                                {row[column]}
                              </td>

                            )
                          )}

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            ) : (

              <div className="flex h-48 items-center justify-center text-center text-sm text-secondary">
                Import your client's CSV file to display the data.
              </div>

            )}

          </div>

        </div>

      </section>

    </main>
  );
}
