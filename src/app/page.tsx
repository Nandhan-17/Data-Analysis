<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DataStudio — Analytics Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js"></script>
<style>
  :root{
    --g-blue:#4285F4;
    --g-red:#EA4335;
    --g-yellow:#FBBC05;
    --g-green:#34A853;
    --g-blue-tint:#E8F0FE;
    --g-green-tint:#E6F4EA;
    --g-red-tint:#FCE8E6;
    --g-yellow-tint:#FEF7E0;
    --ink-900:#202124;
    --ink-700:#3C4043;
    --ink-500:#5F6368;
    --ink-300:#9AA0A6;
    --line:#E8EAED;
    --bg:#FFFFFF;
    --surface:#FFFFFF;
    --radius:12px;
    --shadow-sm:0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.06);
    --shadow-md:0 1px 3px 0 rgba(60,64,67,.10), 0 4px 8px 3px rgba(60,64,67,.06);
    font-family:'Roboto', sans-serif;
  }

  *{box-sizing:border-box; margin:0; padding:0;}
  body{
    background:var(--bg);
    color:var(--ink-900);
    -webkit-font-smoothing:antialiased;
  }
  h1,h2,h3,.brand,.gsans{font-family:'Google Sans','Roboto', sans-serif;}

  a{text-decoration:none; color:inherit;}

  /* ---------- Layout Shell ---------- */
  .shell{
    display:grid;
    grid-template-columns:248px 1fr;
    grid-template-rows:64px 1fr;
    grid-template-areas:
      "header header"
      "sidebar main";
    min-height:100vh;
  }

  /* ---------- Header ---------- */
  header.topbar{
    grid-area:header;
    display:flex;
    align-items:center;
    gap:24px;
    padding:0 20px 0 16px;
    border-bottom:1px solid var(--line);
    background:var(--surface);
    position:sticky;
    top:0;
    z-index:20;
  }
  .brand{
    display:flex;
    align-items:center;
    gap:10px;
    font-size:20px;
    font-weight:500;
    color:var(--ink-700);
    min-width:210px;
  }
  .brand svg{flex-shrink:0;}
  .brand .studio{font-weight:400; color:var(--ink-500);}

  .search-wrap{
    flex:1;
    max-width:640px;
    display:flex;
    align-items:center;
    gap:10px;
    background:#F1F3F4;
    border-radius:24px;
    padding:0 16px;
    height:44px;
    transition:background .15s ease, box-shadow .15s ease;
  }
  .search-wrap:focus-within{
    background:#fff;
    box-shadow:0 1px 6px rgba(32,33,36,.18);
  }
  .search-wrap input{
    border:0; outline:0; background:transparent;
    flex:1; font-size:14px; color:var(--ink-900); height:100%;
  }
  .search-wrap input::placeholder{color:var(--ink-500);}

  .topbar-right{
    margin-left:auto;
    display:flex;
    align-items:center;
    gap:16px;
  }
  .icon-btn{
    width:40px;height:40px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    color:var(--ink-500);
    cursor:pointer;
  }
  .icon-btn:hover{background:#F1F3F4;}
  .avatar{
    width:32px;height:32px;border-radius:50%;
    background:var(--g-blue);
    color:#fff;
    display:flex;align-items:center;justify-content:center;
    font-family:'Google Sans';
    font-size:14px;font-weight:500;
    cursor:pointer;
  }

  /* ---------- Sidebar ---------- */
  aside.sidebar{
    grid-area:sidebar;
    border-right:1px solid var(--line);
    background:var(--surface);
    padding:16px 12px;
    position:sticky;
    top:64px;
    height:calc(100vh - 64px);
  }
  .nav-item{
    display:flex;
    align-items:center;
    gap:16px;
    padding:0 20px;
    height:44px;
    border-radius:0 22px 22px 0;
    font-size:14px;
    color:var(--ink-700);
    cursor:pointer;
    margin-bottom:2px;
  }
  .nav-item svg{flex-shrink:0;}
  .nav-item:hover{background:#F1F3F4;}
  .nav-item.active{
    background:var(--g-blue-tint);
    color:var(--g-blue);
    font-weight:500;
  }
  .nav-item.active svg{stroke:var(--g-blue);}
  .nav-section-label{
    font-size:11px;
    letter-spacing:.6px;
    color:var(--ink-300);
    text-transform:uppercase;
    padding:20px 20px 8px;
    font-family:'Google Sans';
  }

  /* ---------- Main ---------- */
  main{
    grid-area:main;
    padding:28px 32px 60px;
    max-width:1400px;
  }
  .page-head{
    display:flex;
    align-items:baseline;
    justify-content:space-between;
    margin-bottom:24px;
    flex-wrap:wrap;
    gap:12px;
  }
  .page-head h1{font-size:22px; font-weight:500; color:var(--ink-900);}
  .page-head p{font-size:13px; color:var(--ink-500); margin-top:4px;}
  .date-range{
    font-size:13px;
    color:var(--ink-700);
    border:1px solid var(--line);
    border-radius:8px;
    padding:8px 14px;
    display:flex;
    align-items:center;
    gap:8px;
    cursor:pointer;
  }
  .date-range:hover{background:#F8F9FA;}

  /* ---------- KPI cards ---------- */
  .kpi-grid{
    display:grid;
    grid-template-columns:repeat(4, 1fr);
    gap:16px;
    margin-bottom:20px;
  }
  .card{
    background:var(--surface);
    border:1px solid var(--line);
    border-radius:var(--radius);
    box-shadow:var(--shadow-sm);
  }
  .kpi{
    padding:20px 20px 18px;
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .kpi-top{
    display:flex;
    align-items:center;
    justify-content:space-between;
  }
  .kpi-title{
    font-size:13px;
    color:var(--ink-500);
    font-weight:500;
  }
  .kpi-icon{
    width:32px;height:32px;border-radius:8px;
    display:flex;align-items:center;justify-content:center;
  }
  .kpi-value{
    font-family:'Google Sans';
    font-size:28px;
    font-weight:500;
    color:var(--ink-900);
  }
  .kpi-trend{
    display:flex;
    align-items:center;
    gap:4px;
    font-size:12.5px;
    font-weight:500;
  }
  .kpi-trend.up{color:var(--g-green);}
  .kpi-trend.down{color:var(--g-red);}
  .kpi-trend span.muted{color:var(--ink-300); font-weight:400;}

  /* ---------- Chart Grid ---------- */
  .chart-grid{
    display:grid;
    grid-template-columns:1.6fr 1fr;
    gap:16px;
    margin-bottom:16px;
  }
  .chart-card{padding:22px 22px 12px;}
  .chart-card-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:6px;
  }
  .chart-card-head h3{font-size:15px; font-weight:500; color:var(--ink-900);}
  .chart-card-head .sub{font-size:12px; color:var(--ink-500); margin-top:2px;}
  .legend-row{display:flex; gap:16px; margin-top:4px;}
  .legend-item{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink-500);}
  .legend-dot{width:8px; height:8px; border-radius:50%;}
  .chart-canvas-wrap{position:relative; height:280px; margin-top:8px;}
  .chart-canvas-wrap.small{height:230px;}

  .donut-center{
    position:absolute;
    top:50%; left:50%;
    transform:translate(-50%,-52%);
    text-align:center;
    pointer-events:none;
  }
  .donut-center .num{font-family:'Google Sans'; font-size:22px; font-weight:500; color:var(--ink-900);}
  .donut-center .lbl{font-size:11px; color:var(--ink-500);}

  .row-2{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:16px;
    margin-bottom:16px;
  }

  /* ---------- Table ---------- */
  .table-card{padding:22px 22px 6px;}
  table{width:100%; border-collapse:collapse; font-size:13.5px;}
  thead th{
    text-align:left;
    font-family:'Google Sans';
    font-weight:500;
    font-size:12px;
    color:var(--ink-500);
    text-transform:uppercase;
    letter-spacing:.3px;
    padding:10px 12px;
    border-bottom:1px solid var(--line);
  }
  tbody td{
    padding:13px 12px;
    border-bottom:1px solid #F1F3F4;
    color:var(--ink-700);
  }
  tbody tr:hover{background:#F8F9FA;}
  tbody tr:last-child td{border-bottom:none;}
  .page-link{color:var(--g-blue); font-weight:500;}
  .num-cell{font-variant-numeric:tabular-nums;}
  .badge{
    display:inline-flex;
    align-items:center;
    gap:5px;
    font-size:12px;
    font-weight:500;
    padding:3px 9px;
    border-radius:20px;
  }
  .badge.up{background:var(--g-green-tint); color:var(--g-green);}
  .badge.down{background:var(--g-red-tint); color:var(--g-red);}
  .device-dot{width:8px;height:8px;border-radius:50%; display:inline-block; margin-right:8px;}

  .bar-track{
    width:100%;
    height:6px;
    background:#F1F3F4;
    border-radius:4px;
    overflow:hidden;
    margin-top:6px;
  }
  .bar-fill{height:100%; border-radius:4px;}

  ::-webkit-scrollbar{width:10px; height:10px;}
  ::-webkit-scrollbar-thumb{background:#DADCE0; border-radius:6px;}

  @media (max-width: 1100px){
    .chart-grid, .row-2{grid-template-columns:1fr;}
    .kpi-grid{grid-template-columns:repeat(2,1fr);}
  }
  @media (max-width: 760px){
    .shell{grid-template-columns:1fr;}
    aside.sidebar{display:none;}
    .kpi-grid{grid-template-columns:1fr;}
  }
</style>
</head>
<body>

<div class="shell">

  <!-- HEADER -->
  <header class="topbar">
    <div class="brand">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" fill="none" stroke="#E8EAED" stroke-width="2"/>
        <path d="M14 14 L14 4 A10 10 0 0 1 22.5 19.4 Z" fill="#4285F4"/>
        <path d="M14 14 L22.5 19.4 A10 10 0 0 1 6.7 21.9 Z" fill="#34A853"/>
        <path d="M14 14 L6.7 21.9 A10 10 0 0 1 6.7 6.1 Z" fill="#FBBC05"/>
        <path d="M14 14 L6.7 6.1 A10 10 0 0 1 14 4 Z" fill="#EA4335"/>
        <circle cx="14" cy="14" r="5" fill="#fff"/>
      </svg>
      <span>Data<span class="studio">Studio</span></span>
    </div>

    <div class="search-wrap">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" placeholder="Search reports, metrics, or data sources">
    </div>

    <div class="topbar-right">
      <div class="icon-btn" title="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      </div>
      <div class="icon-btn" title="Help">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div class="avatar">N</div>
    </div>
  </header>

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="nav-item active">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
      Dashboard
    </div>
    <div class="nav-item">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      Reports
    </div>
    <div class="nav-item">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
      Sources
    </div>
    <div class="nav-item">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      Explorations
    </div>
    <div class="nav-section-label">Workspace</div>
    <div class="nav-item">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      Settings
    </div>
  </aside>

  <!-- MAIN -->
  <main>
    <div class="page-head">
      <div>
        <h1 class="gsans">Overview dashboard</h1>
        <p>All properties · Last updated 2 minutes ago</p>
      </div>
      <div class="date-range">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Aug 1 – Aug 14, 2026
      </div>
    </div>

    <!-- KPI CARDS -->
    <section class="kpi-grid">
      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-title">Total sessions</span>
          <div class="kpi-icon" style="background:var(--g-blue-tint);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
        </div>
        <div class="kpi-value">248,930</div>
        <div class="kpi-trend up">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34A853" stroke-width="3" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          12.4% <span class="muted">vs prev. period</span>
        </div>
      </div>

      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-title">New users</span>
          <div class="kpi-icon" style="background:var(--g-green-tint);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34A853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
          </div>
        </div>
        <div class="kpi-value">62,184</div>
        <div class="kpi-trend up">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34A853" stroke-width="3" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          8.1% <span class="muted">vs prev. period</span>
        </div>
      </div>

      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-title">Bounce rate</span>
          <div class="kpi-icon" style="background:var(--g-yellow-tint);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBC05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        </div>
        <div class="kpi-value">41.2%</div>
        <div class="kpi-trend down">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="3" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          3.6% <span class="muted">vs prev. period</span>
        </div>
      </div>

      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-title">Conversion rate</span>
          <div class="kpi-icon" style="background:var(--g-red-tint);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
        <div class="kpi-value">4.87%</div>
        <div class="kpi-trend up">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34A853" stroke-width="3" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          0.9% <span class="muted">vs prev. period</span>
        </div>
      </div>
    </section>

    <!-- LINE + DONUT -->
    <section class="chart-grid">
      <div class="card chart-card">
        <div class="chart-card-head">
          <div>
            <h3 class="gsans">Traffic trend</h3>
            <div class="sub">Sessions over the last 14 days</div>
          </div>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="lineChart"></canvas>
        </div>
      </div>

      <div class="card chart-card">
        <div class="chart-card-head">
          <div>
            <h3 class="gsans">Device type</h3>
            <div class="sub">Share of total sessions</div>
          </div>
        </div>
        <div class="chart-canvas-wrap small">
          <canvas id="donutChart"></canvas>
          <div class="donut-center">
            <div class="num">248.9K</div>
            <div class="lbl">Sessions</div>
          </div>
        </div>
        <div class="legend-row" id="donutLegend"></div>
      </div>
    </section>

    <!-- BAR + Extra -->
    <section class="row-2">
      <div class="card chart-card">
        <div class="chart-card-head">
          <div>
            <h3 class="gsans">Top referral sources</h3>
            <div class="sub">Sessions by channel</div>
          </div>
        </div>
        <div class="chart-canvas-wrap small">
          <canvas id="barChart"></canvas>
        </div>
      </div>

      <div class="card chart-card">
        <div class="chart-card-head">
          <div>
            <h3 class="gsans">Goal completions</h3>
            <div class="sub">By category, this period</div>
          </div>
        </div>
        <div style="margin-top:14px;">
          <div style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--ink-700); margin-bottom:6px;"><span>Sign-ups</span><span class="num-cell">3,214</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:82%; background:var(--g-blue);"></div></div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--ink-700); margin-bottom:6px;"><span>Purchases</span><span class="num-cell">1,908</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:56%; background:var(--g-green);"></div></div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--ink-700); margin-bottom:6px;"><span>Downloads</span><span class="num-cell">1,332</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:41%; background:var(--g-yellow);"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--ink-700); margin-bottom:6px;"><span>Form abandons</span><span class="num-cell">742</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:24%; background:var(--g-red);"></div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- TABLE -->
    <section class="card table-card">
      <div class="chart-card-head">
        <div>
          <h3 class="gsans">Top pages</h3>
          <div class="sub">Ranked by sessions this period</div>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Sessions</th>
              <th>Users</th>
              <th>Avg. time</th>
              <th>Bounce rate</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
    </section>

  </main>
</div>

<script>
Chart.defaults.font.family = "'Roboto', sans-serif";
Chart.defaults.color = '#5F6368';

const GBLUE = '#4285F4', GRED = '#EA4335', GYELLOW = '#FBBC05', GGREEN = '#34A853';

/* ---------------- Line chart ---------------- */
const lineLabels = ['Aug 1','Aug 2','Aug 3','Aug 4','Aug 5','Aug 6','Aug 7','Aug 8','Aug 9','Aug 10','Aug 11','Aug 12','Aug 13','Aug 14'];
const lineData = [14200,15800,15100,17400,19200,18500,21100,20400,22800,24600,23900,26200,25100,27800];

const lineCtx = document.getElementById('lineChart').getContext('2d');
const gradient = lineCtx.createLinearGradient(0,0,0,280);
gradient.addColorStop(0, 'rgba(66,133,244,0.28)');
gradient.addColorStop(1, 'rgba(66,133,244,0.02)');

new Chart(lineCtx, {
  type: 'line',
  data: {
    labels: lineLabels,
    datasets: [{
      label: 'Sessions',
      data: lineData,
      borderColor: GBLUE,
      backgroundColor: gradient,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: GBLUE,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
      borderWidth: 2.5
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#202124',
        bodyColor: '#3C4043',
        borderColor: '#E8EAED',
        borderWidth: 1,
        padding: 10,
        titleFont: { family: 'Google Sans', size: 12, weight: '500' },
        bodyFont: { size: 12.5 },
        displayColors: false
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#F1F3F4' }, ticks: { font: { size: 11 }, callback: v => (v/1000)+'K' }, border: { display: false } }
    }
  }
});

/* ---------------- Donut chart ---------------- */
const donutLabels = ['Mobile','Desktop','Tablet','Other'];
const donutData = [118500, 92400, 28900, 9130];
const donutColors = [GBLUE, GGREEN, GRED, GYELLOW];

new Chart(document.getElementById('donutChart'), {
  type: 'doughnut',
  data: {
    labels: donutLabels,
    datasets: [{
      data: donutData,
      backgroundColor: donutColors,
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 6
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#202124',
        bodyColor: '#3C4043',
        borderColor: '#E8EAED',
        borderWidth: 1,
        padding: 10,
        displayColors: true
      }
    }
  }
});

const legendWrap = document.getElementById('donutLegend');
donutLabels.forEach((label, i) => {
  const pct = ((donutData[i] / donutData.reduce((a,b)=>a+b,0)) * 100).toFixed(0);
  const item = document.createElement('div');
  item.className = 'legend-item';
  item.innerHTML = `<span class="legend-dot" style="background:${donutColors[i]}"></span>${label} · ${pct}%`;
  legendWrap.appendChild(item);
});

/* ---------------- Bar chart ---------------- */
const barLabels = ['Organic Search','Direct','Social','Referral','Email'];
const barData = [42300, 31900, 24800, 18200, 11400];
const barColors = [GBLUE, GBLUE, GGREEN, GBLUE, GRED];

new Chart(document.getElementById('barChart'), {
  type: 'bar',
  data: {
    labels: barLabels,
    datasets: [{
      data: barData,
      backgroundColor: barColors,
      borderRadius: 6,
      maxBarThickness: 34
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#202124',
        bodyColor: '#3C4043',
        borderColor: '#E8EAED',
        borderWidth: 1,
        padding: 10,
        displayColors: false
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
      y: { grid: { color: '#F1F3F4' }, ticks: { font: { size: 11 }, callback: v => (v/1000)+'K' }, border: { display: false } }
    }
  }
});

/* ---------------- Table ---------------- */
const pages = [
  { path: '/home', sessions: 48210, users: 39120, time: '2m 14s', bounce: 34.2, trend: 8.1, up: true },
  { path: '/pricing', sessions: 31890, users: 24380, time: '1m 48s', bounce: 45.7, trend: 3.4, up: true },
  { path: '/blog/data-analytics-guide', sessions: 24610, users: 20990, time: '4m 02s', bounce: 28.9, trend: 12.6, up: true },
  { path: '/product/dashboard', sessions: 19340, users: 15720, time: '3m 11s', bounce: 31.5, trend: 1.2, up: false },
  { path: '/signup', sessions: 15220, users: 13980, time: '1m 05s', bounce: 52.3, trend: 4.8, up: false },
  { path: '/docs/getting-started', sessions: 12870, users: 10440, time: '5m 30s', bounce: 22.1, trend: 6.7, up: true },
];

const tbody = document.getElementById('tableBody');
pages.forEach(p => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><a href="#" class="page-link">${p.path}</a></td>
    <td class="num-cell">${p.sessions.toLocaleString()}</td>
    <td class="num-cell">${p.users.toLocaleString()}</td>
    <td class="num-cell">${p.time}</td>
    <td class="num-cell">${p.bounce}%</td>
    <td><span class="badge ${p.up ? 'up' : 'down'}">${p.up ? '▲' : '▼'} ${p.trend}%</span></td>
  `;
  tbody.appendChild(tr);
});
</script>

</body>
</html>
