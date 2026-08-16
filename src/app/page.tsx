"use client";

import { useState } from "react";

export default function Home() {
  const [search, setSearch] = useState("");

  return (
    <main className="min-h-screen bg-white text-[#202124]">
      {/* Header */}
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

            <div className="h-9 w-9 rounded-full bg-[#4285F4] flex items-center justify-center text-white font-semibold">
              D
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="dashboard-content mx-auto max-w-[1400px] px-6 py-6">

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Analytics Overview
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Monitor your data and performance in one place.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-52 rounded-lg border border-[#dadce0] bg-white px-4 text-sm outline-none focus:border-[#4285F4]"
            />

            <button className="rounded-lg bg-[#4285F4] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
              Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="glass-panel glass-panel-hover p-5">
            <p className="text-sm text-secondary">
              Total Records
            </p>
            <h3 className="mt-2 text-3xl font-bold">
              526
            </h3>
            <p className="mt-2 text-sm text-[#34A853]">
              +12.5% from last month
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-5">
            <p className="text-sm text-secondary">
              Active Projects
            </p>
            <h3 className="mt-2 text-3xl font-bold">
              128
            </h3>
            <p className="mt-2 text-sm text-[#34A853]">
              +8.2% growth
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-5">
            <p className="text-sm text-secondary">
              Completed
            </p>
            <h3 className="mt-2 text-3xl font-bold">
              328
            </h3>
            <p className="mt-2 text-sm text-[#4285F4]">
              62.4% completion
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-5">
            <p className="text-sm text-secondary">
              Pending
            </p>
            <h3 className="mt-2 text-3xl font-bold">
              70
            </h3>
            <p className="mt-2 text-sm text-[#EA4335]">
              Requires attention
            </p>
          </div>

        </div>

        {/* Chart Area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div className="glass-panel p-6">
            <div className="mb-5">
              <h3 className="font-semibold">
                Monthly Performance
              </h3>
              <p className="text-sm text-secondary">
                Performance overview
              </p>
            </div>

            <div className="flex h-64 items-end gap-3 border-b border-[#e5e7eb] px-4 pb-2">
              {[35, 52, 44, 68, 58, 76, 64, 82, 72, 91, 78, 96].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-md bg-[#4285F4] transition-all hover:opacity-80"
                    style={{ height: `${height}%` }}
                  />
                )
              )}
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="mb-5">
              <h3 className="font-semibold">
                Performance Trend
              </h3>
              <p className="text-sm text-secondary">
                Monthly trend analysis
              </p>
            </div>

            <div className="relative h-64 overflow-hidden">
              <svg
                viewBox="0 0 600 250"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,190 60,165 120,175 180,120 240,145 300,95 360,115 420,70 480,90 540,45 600,65"
                  fill="none"
                  stroke="#4285F4"
                  strokeWidth="4"
                />

                <polyline
                  points="0,215 60,205 120,210 180,185 240,195 300,170 360,180 420,150 480,165 540,130 600,145"
                  fill="none"
                  stroke="#34A853"
                  strokeWidth="3"
                />
              </svg>
            </div>
          </div>

        </div>

        {/* Lower Cards */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

          <div className="glass-panel p-6">
            <h3 className="mb-5 font-semibold">
              Category Overview
            </h3>

            <div className="space-y-4">
              {[
  ["Category A", 78, "#4285F4"],
  ["Category B", 62, "#34A853"],
  ["Category C", 48, "#FBBC04"],
  ["Category D", 35, "#EA4335"],
].map(([name, value, color]) => (
                <div key={name as string}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="text-secondary">
                      {value}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#f1f3f4]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${value}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="mb-5 font-semibold">
              Summary
            </h3>

            <div className="flex items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#4285F4_0_45%,#34A853_45%_70%,#FBBC04_70%_88%,#EA4335_88%_100%)]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      72%
                    </div>
                    <div className="text-xs text-secondary">
                      Overall
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="mb-5 font-semibold">
              Recent Activity
            </h3>

            <div className="space-y-4">
              {[
                "New data uploaded",
                "Project completed",
                "Report generated",
                "Dataset updated",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      index === 0
                        ? "bg-[#4285F4]"
                        : index === 1
                        ? "bg-[#34A853]"
                        : index === 2
                        ? "bg-[#FBBC04]"
                        : "bg-[#EA4335]"
                    }`}
                  />

                  <span className="text-sm">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Table */}
        <div className="glass-panel mt-6 overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-6 py-4">
            <h3 className="font-semibold">
              Detailed Records
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafb]">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Category
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Progress
                  </th>
                </tr>
              </thead>

              <tbody>
                {[
                  ["Project Alpha", "Analytics", "Active", "82%"],
                  ["Project Beta", "Research", "Completed", "100%"],
                  ["Project Gamma", "Development", "Active", "64%"],
                  ["Project Delta", "Marketing", "Pending", "32%"],
                ].map((row) => (
                  <tr
                    key={row[0]}
                    className="border-t border-[#e5e7eb] hover:bg-[#f8fafb]"
                  >
                    <td className="px-6 py-4 font-medium">
                      {row[0]}
                    </td>

                    <td className="px-6 py-4 text-secondary">
                      {row[1]}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#1a73e8]">
                        {row[2]}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {row[3]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>
    </main>
  );
}
