export function getDashboardHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Staff Attendance, Salary & Documents Hub</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            brand: {
              50: '#eef2ff',
              100: '#e0e7ff',
              500: '#6366f1',
              600: '#4f46e5',
              700: '#4338ca',
              900: '#312e81',
            }
          }
        }
      }
    }
  </script>
  <style>
    html, body {
      overflow-x: hidden;
      max-width: 100vw;
      width: 100%;
    }
    /* Custom scrollbars */
    ::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    /* Sticky table column styling with mobile-solid background */
    .sticky-col {
      position: sticky;
      left: 0;
      z-index: 20;
      background-color: #ffffff;
      box-shadow: 2px 0 6px rgba(0, 0, 0, 0.06);
    }
    .sticky-col-header {
      position: sticky;
      left: 0;
      z-index: 30;
      background-color: #f8fafc;
      box-shadow: 2px 0 6px rgba(0, 0, 0, 0.06);
    }
    .sticky-summary {
      background-color: #ffffff;
    }
    .sticky-summary-header {
      background-color: #f8fafc;
    }
    /* Mobile-first improvements to prevent iOS auto-zoom on input focus */
    @media screen and (max-width: 640px) {
      input, select, textarea {
        font-size: 16px !important;
      }
    }
    /* PIN dots animation */
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }
    .shake {
      animation: shake 0.4s ease-in-out;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #salarySlipModal, #salarySlipModal * {
        visibility: visible;
      }
      #salarySlipModal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: white !important;
        padding: 0;
      }
      #salarySlipModal .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">

  <!-- ========================================================================= -->
  <!-- PIN LOCK SCREEN OVERLAY                                                    -->
  <!-- ========================================================================= -->
  <div id="lockScreen" class="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300">
    <div id="lockCard" class="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center flex flex-col items-center">
      
      <!-- Hub Badge -->
      <div class="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
        <i data-lucide="shield-check" class="w-7 h-7"></i>
      </div>
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">StaffSync Hub</h2>
      <p class="text-xs text-slate-500 mt-1 mb-5">Select user & enter 4-digit PIN</p>

      <!-- 1. USER SELECT DROPDOWN -->
      <div class="w-full text-left mb-4">
        <label for="loginRoleSelect" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          Select User
        </label>
        <div class="relative">
          <select id="loginRoleSelect" onchange="onLoginRoleChange()" class="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs appearance-none cursor-pointer transition">
            <option value="admin" data-role="admin">Admin (Owner / Full Access)</option>
            <option value="manager" data-role="manager">Manager (Roll Call & Attendance)</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
            <i data-lucide="chevron-down" class="w-4 h-4"></i>
          </div>
        </div>
        
        <!-- Helpful Hint -->
        <div id="loginRoleHint" class="text-[11px] text-indigo-600 font-medium mt-1.5 flex items-center gap-1.5">
          <i data-lucide="key-round" class="w-3.5 h-3.5 shrink-0"></i>
          <span id="loginRoleHintText">Admin: enter your 4-digit PIN for full management</span>
        </div>
      </div>

      <!-- 2. PIN INPUT FIELD WITH SHOW/HIDE TOGGLE -->
      <div class="w-full mb-2 text-left">
        <label for="pinInputField" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          Enter 4-Digit PIN
        </label>
        <div class="relative w-full">
          <input
            id="pinInputField"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            placeholder="••••"
            autocomplete="off"
            oninput="handlePinInput(this)"
            onkeydown="handlePinKeydown(event)"
            class="w-full text-center tracking-[0.6em] text-2xl font-bold py-2.5 pl-10 pr-10 rounded-xl border-2 border-indigo-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none text-slate-900 bg-slate-50/50 transition shadow-inner font-mono"
          />
          <button
            type="button"
            onclick="toggleLoginPinEye()"
            title="Show / Hide PIN"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none transition cursor-pointer"
          >
            <i data-lucide="eye" id="loginPinEyeIcon" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div id="pinError" class="text-xs text-rose-500 font-medium min-h-[1.25rem] mb-2 text-center w-full"></div>

      <!-- 3. NUMERIC KEYPAD -->
      <div class="grid grid-cols-3 gap-2 w-full max-w-[260px] mb-3">
        <button type="button" onclick="handleKeypad('1')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">1</button>
        <button type="button" onclick="handleKeypad('2')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">2</button>
        <button type="button" onclick="handleKeypad('3')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">3</button>
        <button type="button" onclick="handleKeypad('4')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">4</button>
        <button type="button" onclick="handleKeypad('5')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">5</button>
        <button type="button" onclick="handleKeypad('6')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">6</button>
        <button type="button" onclick="handleKeypad('7')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">7</button>
        <button type="button" onclick="handleKeypad('8')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">8</button>
        <button type="button" onclick="handleKeypad('9')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">9</button>
        <button type="button" onclick="handleKeypad('clear')" class="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-semibold text-slate-600 transition cursor-pointer">CLEAR</button>
        <button type="button" onclick="handleKeypad('0')" class="h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-lg font-bold text-slate-800 transition shadow-xs border border-slate-200 cursor-pointer">0</button>
        <button type="button" onclick="handleKeypad('back')" class="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition cursor-pointer">
          <i data-lucide="delete" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- 4. SIGN IN / UNLOCK BUTTON -->
      <button type="button" id="btnPinSubmit" onclick="submitPinLogin()" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mb-3 cursor-pointer">
        <span id="btnPinSubmitText">Sign In</span>
        <i data-lucide="arrow-right" id="btnPinSubmitIcon" class="w-4 h-4"></i>
      </button>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="rememberMe" checked class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4">
        <label for="rememberMe" class="text-xs text-slate-500 select-none cursor-pointer">Stay signed in on this device</label>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MAIN APP CONTAINER                                                        -->
  <!-- ========================================================================= -->
  <div id="appContainer" class="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-hidden">

    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full max-w-full overflow-hidden">
      <div class="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full min-w-0 max-w-full">
        <div class="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2 w-full min-w-0">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-1.5 sm:gap-3 shrink min-w-0">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <i data-lucide="building-2" class="w-4 h-4 sm:w-5 sm:h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1 sm:gap-2">
                <span class="font-bold text-slate-900 text-sm sm:text-lg leading-tight tracking-tight truncate">StaffSync</span>
                <span class="hidden sm:inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full items-center gap-1 shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Cloud D1</span>
                </span>
              </div>
              <p class="hidden sm:block text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Hotel · Homes · Salon · Help</p>
            </div>
          </div>

          <!-- Quick Top Actions & Role Badge -->
          <div class="flex items-center gap-1 sm:gap-2 shrink-0">
            <!-- Sync Cloud Button -->
            <button id="btnSyncNow" onclick="syncAllDataNow()" title="Sync and refresh all records from Cloud D1" class="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition shadow-2xs active:scale-95 cursor-pointer">
              <i data-lucide="refresh-cw" id="syncNowIcon" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span class="hidden sm:inline">Sync</span>
            </button>

            <div id="userRoleBadge" class="hidden sm:inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Admin Access</span>
            </div>
            <button id="btnAdminSecurity" onclick="openAdminSecurityModal()" title="Change PIN" class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer">
              <i data-lucide="key-round" class="w-3.5 h-3.5 text-slate-600"></i>
              <span>Change PIN</span>
            </button>
            <button id="btnLeaveRules" onclick="openLeavePolicyModal()" title="Leave Policy" class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer">
              <i data-lucide="sliders" class="w-3.5 h-3.5 text-slate-600"></i>
              <span>Leave Rules</span>
            </button>
            <button id="btnHeaderAddStaff" onclick="openStaffModal()" title="Add Staff" class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Add Staff</span>
            </button>
            <button onclick="lockApp()" title="Lock / Switch User" class="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 border border-slate-200 transition cursor-pointer">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Switch</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Properties & Primary View Tabs (Touch friendly scroll on mobile) -->
      <div class="bg-slate-50/95 border-t border-slate-200 px-2.5 sm:px-6 lg:px-8 w-full max-w-full overflow-hidden">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-1.5 gap-1.5 sm:gap-2 w-full min-w-0 max-w-full">
          
          <!-- Properties Selector -->
          <div id="propertyTabs" class="w-full md:w-auto min-w-0 max-w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 flex-nowrap">
            <!-- Rendered by JS -->
          </div>
          
          <!-- View Switcher Tabs -->
          <div class="w-full md:w-auto min-w-0 max-w-full flex items-center bg-slate-200/80 p-0.5 sm:p-1 rounded-xl overflow-x-auto no-scrollbar scrollbar-none flex-nowrap">
            <button id="viewTabDaily" onclick="switchView('daily')" class="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition shadow-xs bg-white text-indigo-600 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0">
              <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
              <span>Daily Roll Call</span>
            </button>
            <button id="viewTabMonthly" onclick="switchView('monthly')" class="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
              <span>Monthly Sheet</span>
            </button>
            <button id="viewTabFinances" onclick="switchView('finances')" class="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0">
              <i data-lucide="trending-up" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Sales & Expenses</span>
            </button>
            <button id="viewTabPayroll" onclick="switchView('payroll')" class="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0">
              <i data-lucide="wallet" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Salary & Payroll</span>
            </button>
            <button id="viewTabDirectory" onclick="switchView('directory')" class="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0">
              <i data-lucide="users" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Staff & Docs</span>
            </button>
          </div>

        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col">
      
      <!-- Month & Action Controls Bar (shown for Attendance & Payroll) -->
      <div id="monthControlBar" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
        <!-- Month Selector -->
        <div class="flex items-center gap-2">
          <div class="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button onclick="changeMonth(-1)" class="w-8 h-8 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <span id="currentMonthLabel" class="px-3 text-sm font-bold text-slate-800 min-w-[130px] text-center select-none">
              October 2026
            </span>
            <button onclick="changeMonth(1)" class="w-8 h-8 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
          <button onclick="goToCurrentMonth()" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Today
          </button>
        </div>

        <!-- Property Allowance Indicator & Quick Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <div id="propertyAllowanceBanner" class="text-xs font-medium px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <i data-lucide="info" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Leave Allowance: <strong id="currentAllowanceText">2.0 days</strong></span>
          </div>
          
          <button id="btnMarkAllPresent" onclick="markAllTodayPresent()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition">
            <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
            <span>Mark All Present</span>
          </button>

          <button onclick="exportCurrentView()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition">
            <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Export</span>
          </button>
        </div>

      </div>

      <!-- Quick Legend Bar (shown on desktop for monthly view) -->
      <div id="legendBar" class="hidden sm:flex items-center gap-3 sm:gap-6 text-xs text-slate-600 mb-3 px-1 flex-wrap">
        <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Legend:</span>
        <div class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] border border-emerald-300">P</span>
          <span>Present (Default)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px] border border-rose-300">A</span>
          <span>Absent</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-[10px] border border-sky-300">DO</span>
          <span>Day Off</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] border border-amber-300">L</span>
          <span>Leave (Deducts quota)</span>
        </div>
      </div>

      <!-- ===================================================================== -->
      <!-- VIEW 1: MONTHLY SHEET (Responsive Cards on Mobile, Table on Desktop) -->
      <!-- ===================================================================== -->
      <div id="monthlyViewSection" class="hidden flex-1 flex flex-col gap-3">
        
        <!-- Mobile Monthly Overview Section (Phone screens < md) -->
        <div id="monthlyMobileSection" class="md:hidden flex flex-col gap-3">
          <!-- Suggestion Banner to use Daily Roll Call -->
          <div class="bg-gradient-to-r from-indigo-50 to-indigo-100/60 p-3 rounded-2xl border border-indigo-200/80 flex items-center justify-between gap-2 shadow-2xs">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <i data-lucide="check-square" class="w-4 h-4"></i>
              </div>
              <div>
                <div class="text-xs font-bold text-indigo-950">Daily Roll Call Recommended</div>
                <div class="text-[10px] text-indigo-700">Faster single-tap marking on phone</div>
              </div>
            </div>
            <button onclick="switchView('daily')" class="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition active:scale-95 shadow-xs cursor-pointer">
              Open Roll Call
            </button>
          </div>

          <!-- Mode Toggle: Cards vs Desktop Table -->
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">Monthly Overview</span>
            <div class="inline-flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button id="btnMobileCardsMode" onclick="toggleMobileMonthlyMode('cards')" class="px-2.5 py-1 rounded-lg bg-white text-indigo-700 shadow-2xs font-bold cursor-pointer">
                Cards
              </button>
              <button id="btnMobileTableMode" onclick="toggleMobileMonthlyMode('table')" class="px-2.5 py-1 rounded-lg text-slate-600 font-medium cursor-pointer">
                Desktop Table
              </button>
            </div>
          </div>

          <!-- Mobile Cards Container -->
          <div id="monthlyMobileCardsList" class="flex flex-col gap-3">
            <!-- Rendered by JS -->
          </div>
        </div>

        <!-- Desktop Matrix Table (Default on md:flex, or when Table Mode toggled on mobile) -->
        <div id="monthlyTableContainer" class="hidden md:flex bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex-1 flex-col">
          <!-- Scroll helper for medium screens -->
          <div class="lg:hidden px-3 py-2 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
            <span class="flex items-center gap-1 font-medium">
              <i data-lucide="move-horizontal" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Scroll horizontally to view dates</span>
            </span>
            <span class="font-bold text-indigo-700">Click cell to mark</span>
          </div>
          <div class="overflow-x-auto overflow-y-auto flex-1 relative max-h-[70vh]">
            <table class="w-full text-left border-collapse text-xs">
              <thead id="monthlyTableHead" class="text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 select-none">
                <!-- Rendered by JS -->
              </thead>
              <tbody id="monthlyTableBody" class="divide-y divide-slate-100">
                <!-- Rendered by JS -->
              </tbody>
            </table>
          </div>
        </div>

        <div id="tableEmptyState" class="hidden p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <i data-lucide="user-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
          <p class="font-medium text-sm text-slate-600">No staff members found for this property.</p>
          <button onclick="openStaffModal()" class="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline">Add your first staff member</button>
        </div>

      </div>

      <!-- ===================================================================== -->
      <!-- VIEW 2: DAILY ROLL CALL VIEW (Mobile-Optimized)                       -->
      <!-- ===================================================================== -->
      <div id="dailyViewSection" class="flex-1 flex flex-col gap-3">
        <!-- Day Selector -->
        <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs gap-2">
          <div class="flex items-center gap-1">
            <button onclick="changeDailyDate(-1)" class="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition active:scale-95 cursor-pointer" title="Previous Day">
              <i data-lucide="chevron-left" class="w-5 h-5"></i>
            </button>
            <button onclick="goToTodayDaily()" class="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition active:scale-95 cursor-pointer">
              Today
            </button>
          </div>
          <div class="text-center">
            <div id="dailyDateTitle" class="text-sm sm:text-base font-bold text-slate-900">Today, 31 Oct 2026</div>
            <div class="text-[11px] text-slate-500 font-medium">Single-tap marking · Live cloud sync</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="markAllTodayPresent()" class="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer" title="Mark all staff present for this day">
              <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
              <span>All Present</span>
            </button>
            <button onclick="changeDailyDate(1)" class="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition active:scale-95 cursor-pointer" title="Next Day">
              <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Quick All Present Bar -->
        <div class="sm:hidden flex items-center justify-between px-1">
          <span class="text-xs font-bold text-slate-600">Daily Roll Call</span>
          <button onclick="markAllTodayPresent()" class="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2.5 py-1 rounded-xl transition cursor-pointer">
            <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
            <span>Mark All Present</span>
          </button>
        </div>

        <!-- Staff Daily Cards -->
        <div id="dailyStaffList" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Rendered by JS -->
        </div>
      </div>

      <!-- ===================================================================== -->
      <!-- VIEW 3: SALARY & PAYROLL PORTAL                                       -->
      <!-- ===================================================================== -->
      <div id="payrollViewSection" class="hidden flex-1 flex flex-col gap-4">
        
        <!-- Payroll Summary Stat Cards (Includes Total Bonuses!) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div class="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Base Payroll</div>
            <div id="statBaseSalary" class="text-base sm:text-lg font-bold text-slate-900 mt-1">₹0</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Total monthly base</div>
          </div>
          <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div class="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Advances & Deduc</div>
            <div id="statDeductions" class="text-base sm:text-lg font-bold text-rose-600 mt-1">₹0</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Advances + Unpaid</div>
          </div>
          <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <div class="text-[10px] sm:text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <i data-lucide="gift" class="w-3 h-3 text-emerald-600"></i>
              <span>Total Bonus</span>
            </div>
            <div id="statBonuses" class="text-base sm:text-lg font-bold text-emerald-700 mt-1">₹0</div>
            <div class="text-[10px] text-emerald-600 mt-0.5">Bonuses added</div>
          </div>
          <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
            <div class="text-[10px] sm:text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Total Net Due</div>
            <div id="statNetPayout" class="text-base sm:text-lg font-bold text-indigo-700 mt-1">₹0</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Net month payout</div>
          </div>
          <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
            <div class="text-[10px] sm:text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Paid Amount</div>
            <div id="statPaidAmount" class="text-base sm:text-lg font-bold text-emerald-700 mt-1">₹0</div>
            <div id="statPaidCount" class="text-[10px] text-emerald-600 font-medium mt-0.5">0 staff paid</div>
          </div>
          <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
            <div class="text-[10px] sm:text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending Payout</div>
            <div id="statPendingAmount" class="text-base sm:text-lg font-bold text-amber-700 mt-1">₹0</div>
            <div id="statPendingCount" class="text-[10px] text-amber-600 font-medium mt-0.5">0 staff unpaid</div>
          </div>
        </div>

        <!-- Formula Explanation Card -->
        <div class="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-indigo-900">
          <div class="flex items-center gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            <span><strong>Leave Protection & Bonus:</strong> Salary is protected by leave balance. Net Payout = <strong>Base − Unpaid Deduc + Bonus − Advance</strong>.</span>
          </div>
          <span class="text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded-md text-indigo-700 border border-indigo-200">Daily Rate = Base Salary ÷ Total Month Days</span>
        </div>

        <!-- Payroll Table -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex-1 flex flex-col">
          <!-- Mobile Scroll Indicator -->
          <div class="sm:hidden px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span class="flex items-center gap-1">
              <i data-lucide="move-horizontal" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>Swipe left / right to view full payroll</span>
            </span>
            <span class="font-bold text-emerald-600">Name is locked</span>
          </div>
          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="text-slate-500 uppercase font-semibold text-[10px] tracking-wider bg-slate-50 border-b border-slate-200 select-none">
                <tr>
                  <th class="sticky-col-header py-3 px-3.5 min-w-[190px] border-r border-slate-200">Staff & Property</th>
                  <th class="py-3 px-3 text-right min-w-[90px]">Base Salary</th>
                  <th class="py-3 px-2 text-center min-w-[50px]">Days</th>
                  <th class="py-3 px-3 text-right min-w-[85px]">Daily Rate</th>
                  <th class="py-3 px-3 text-center min-w-[110px]">Attendance</th>
                  <th class="py-3 px-3 text-center min-w-[90px]" title="Accumulated leave balance carried forward">Leave Bal</th>
                  <th class="py-3 px-3 text-right min-w-[100px]" title="Deductions for days exceeding available leave balance">Unpaid Deduc</th>
                  <th class="py-3 px-3 text-right min-w-[95px]">Gross Earned</th>
                  <th class="py-3 px-3 text-right min-w-[100px]">Advance (Deduc)</th>
                  <th class="py-3 px-3 text-right min-w-[125px] bg-emerald-50/50 text-emerald-900 border-x border-emerald-100">Bonus (Add)</th>
                  <th class="py-3 px-3.5 text-right font-bold text-emerald-800 bg-emerald-50/70 min-w-[100px]">Net Payout</th>
                  <th class="py-3 px-3 text-center min-w-[95px]">Bank / QR</th>
                  <th class="py-3 px-3 text-center min-w-[100px]">Payment Status</th>
                  <th class="py-3 px-2 text-center min-w-[50px]">Slip</th>
                </tr>
              </thead>
              <tbody id="payrollTableBody" class="divide-y divide-slate-100">
                <!-- Rendered by JS -->
              </tbody>
            </table>
          </div>
        </div>
              <tbody id="payrollTableBody" class="divide-y divide-slate-100">
                <!-- Rendered by JS -->
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ===================================================================== -->
      <!-- VIEW 4: STAFF DIRECTORY & DOCUMENTS                                   -->
      <!-- ===================================================================== -->
      <div id="directoryViewSection" class="hidden flex-1 flex flex-col gap-4">
        
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 class="text-base font-bold text-slate-900">Staff Directory & Documents</h3>
            <p class="text-xs text-slate-500">Contact numbers, addresses, salaries and uploaded identity documents</p>
          </div>
          <button onclick="openStaffModal()" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>Add New Staff</span>
          </button>
        </div>

        <!-- Staff Cards Grid -->
        <div id="directoryStaffGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Rendered by JS -->
        </div>

      </div>

      <!-- ===================================================================== -->
      <!-- VIEW 5: SALES & EXPENSES (Manager Daily Entry & Admin Revenue Hub)    -->
      <!-- ===================================================================== -->
      <div id="financesViewSection" class="hidden flex-1 flex flex-col gap-4">
        <div id="financesViewContent" class="flex-1 flex flex-col gap-4">
          <!-- Dynamically populated by renderFinancesView() -->
        </div>
      </div>

    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-400">
      StaffSync Cloud · Connected to Cloudflare D1 · Secure Access
    </footer>

  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: ADD / EDIT STAFF PROFILE                                           -->
  <!-- ========================================================================= -->
  <div id="staffModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 id="staffModalTitle" class="text-lg font-bold text-slate-900">Add Staff Member</h3>
        <button onclick="closeStaffModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form id="staffForm" onsubmit="handleSaveStaff(event)" class="mt-4 space-y-3.5">
        <input type="hidden" id="staffId">
        
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
          <input type="text" id="staffName" required placeholder="e.g. Rahul Sharma" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Property *</label>
            <select id="staffProperty" required class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
              <!-- Populated by JS -->
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Base Salary (₹) *</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input type="text" inputmode="decimal" id="staffSalary" placeholder="e.g. 15000, 25000" class="w-full text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800">
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Role / Job Title</label>
            <input type="text" id="staffRole" placeholder="e.g. Front Desk, Cook" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
            <input type="tel" id="staffPhone" placeholder="e.g. 9876543210" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address</label>
          <textarea id="staffAddress" rows="2" placeholder="e.g. House No. 24, Near City Center, Guwahati" class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Custom Monthly Leave Allowance (Optional)</label>
          <input type="number" step="0.5" id="staffCustomLeave" placeholder="Leave empty to use property default" class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
          <p class="text-[11px] text-slate-400 mt-1">If blank, staff inherits the property's monthly allowance.</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Joining Date *</label>
            <input type="date" id="staffJoiningDate" required class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            <p class="text-[10px] text-slate-400 mt-0.5">Leaves accumulate monthly from joining</p>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Opening Leave Balance</label>
            <input type="number" step="0.5" id="staffOpeningLeave" placeholder="0" class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            <p class="text-[10px] text-slate-400 mt-0.5">Initial carried-over leaves on onboarding</p>
          </div>
        </div>

        <!-- Bank & UPI Payment Details -->
        <div class="border-t border-slate-200/80 pt-3">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase mb-2.5">
            <i data-lucide="credit-card" class="w-3.5 h-3.5 text-indigo-600"></i>
            <span>Bank & Payment Details</span>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Account Holder Name</label>
              <input type="text" id="staffBankAccountName" placeholder="e.g. Rahul Sharma" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Bank Name</label>
              <input type="text" id="staffBankName" placeholder="e.g. SBI, HDFC Bank" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Account Number</label>
              <input type="text" id="staffBankAccountNumber" placeholder="e.g. 30291823901" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">IFSC Code</label>
              <input type="text" id="staffBankIfsc" placeholder="e.g. SBIN0001234" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono uppercase">
            </div>
          </div>

          <div class="mb-2.5">
            <label class="block text-[11px] font-bold text-slate-600 mb-1">UPI ID (Google Pay / PhonePe / Paytm)</label>
            <input type="text" id="staffBankUpi" placeholder="e.g. 9876543210@ybl, rahul@oksbi" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono">
          </div>

          <!-- Payment QR Code Photo Upload -->
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-bold text-slate-700">Payment QR Code Photo (GPay/PhonePe)</span>
              <button type="button" id="btnRemoveQr" onclick="removeQrCodePhoto()" class="hidden text-[10px] text-rose-500 hover:text-rose-700 font-bold">Remove QR</button>
            </div>
            <div class="flex items-center gap-3">
              <div id="qrPreviewContainer" class="w-14 h-14 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                <i data-lucide="qr-code" class="w-7 h-7 text-slate-300" id="qrPlaceholderIcon"></i>
                <img id="qrPreviewImg" class="w-full h-full object-contain hidden" alt="QR Code">
              </div>
              <div class="flex-1">
                <input type="file" id="staffQrFileInput" accept="image/*" class="hidden" onchange="handleQrUpload(event)">
                <button type="button" onclick="document.getElementById('staffQrFileInput').click()" class="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-xl shadow-xs hover:bg-indigo-50 transition">
                  Upload QR Photo
                </button>
                <div class="text-[10px] text-slate-400 mt-1">Screenshot or photo of staff's UPI QR</div>
              </div>
            </div>
            <input type="hidden" id="staffBankQrCode">
          </div>
        </div>

        <!-- Manager Login Access Section -->
        <div class="border-t border-slate-200/80 pt-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <i data-lucide="shield-check" class="w-4 h-4"></i>
              </div>
              <div>
                <div class="text-xs font-bold text-slate-800">Manager Login Access</div>
                <div class="text-[11px] text-slate-500">Allow this employee to log in and mark attendance</div>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="staffIsManager" class="sr-only peer" onchange="toggleManagerPinField()">
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div id="managerPinContainer" class="hidden mt-2.5 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div>
              <label class="block text-[11px] font-bold text-indigo-950 mb-1">Manager Login PIN (4 Digits) *</label>
              <div class="relative">
                <input type="password" maxlength="4" pattern="[0-9]*" inputmode="numeric" id="staffManagerPin" placeholder="4-digit PIN" class="w-full text-center tracking-widest font-mono font-bold text-base px-3 py-2 pr-10 rounded-xl border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800">
                <button type="button" onclick="togglePinVisibility('staffManagerPin', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition" title="Show/Hide PIN">
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
              </div>
              <p class="text-[10px] text-indigo-700 mt-1">This manager can enter this PIN on the lock screen to access Monthly Sheet & Daily Roll Call only.</p>
            </div>
          </div>
        </div>

        <div class="pt-3 flex items-center justify-between border-t border-slate-100">
          <button type="button" id="btnDeleteStaff" onclick="handleDeleteStaff()" class="hidden text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition">
            Delete Staff
          </button>
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" onclick="closeStaffModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition">
              Save Staff
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: STAFF DOCUMENTS MANAGER                                            -->
  <!-- ========================================================================= -->
  <div id="documentsModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 id="docModalStaffName" class="text-base font-bold text-slate-900">Staff Documents</h3>
          <p class="text-xs text-slate-500">Aadhaar, ID Proof, Photo, Employment Contract</p>
        </div>
        <button onclick="closeDocumentsModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Upload Section -->
      <div class="mt-4 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center">
        <i data-lucide="upload-cloud" class="w-8 h-8 mx-auto text-indigo-500 mb-2"></i>
        <div class="text-xs font-semibold text-slate-700">Upload a new document</div>
        <div class="text-[11px] text-slate-400 mb-3">Images (PNG, JPG) or PDF files up to 5MB</div>
        <input type="file" id="docFileInput" accept="image/*,application/pdf" class="hidden" onchange="handleFileUpload(event)">
        <button type="button" onclick="document.getElementById('docFileInput').click()" class="px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-xl shadow-xs hover:bg-indigo-50 transition">
          Choose File
        </button>
        <div id="uploadProgress" class="hidden text-xs text-indigo-600 font-medium mt-2">Uploading to Cloudflare D1...</div>
      </div>

      <!-- Uploaded Documents List -->
      <div class="mt-4 flex-1 overflow-y-auto">
        <div class="text-xs font-bold text-slate-600 uppercase mb-2">Attached Documents</div>
        <div id="documentsList" class="space-y-2">
          <!-- Rendered by JS -->
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 mt-3 text-right">
        <button onclick="closeDocumentsModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: SALARY ADVANCE MANAGER                                             -->
  <!-- ========================================================================= -->
  <div id="advanceModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 id="advanceModalStaffName" class="text-base font-bold text-slate-900">Salary Advance</h3>
          <p class="text-xs text-slate-500">Record or view advance payments</p>
        </div>
        <button onclick="closeAdvanceModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form id="advanceForm" onsubmit="handleSaveAdvance(event)" class="mt-4 space-y-3.5">
        <input type="hidden" id="advanceStaffId">
        
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Advance Amount (₹) *</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input type="text" inputmode="decimal" id="advanceAmount" required placeholder="e.g. 2500, 6000" class="w-full text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Date Given *</label>
            <input type="date" id="advanceDate" required class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>

        <!-- Quick Amount Presets -->
        <div>
          <div class="text-[10px] text-slate-400 uppercase font-bold mb-1.5">Quick Select Amount:</div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="setAdvancePreset(500)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">₹500</button>
            <button type="button" onclick="setAdvancePreset(1000)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">₹1,000</button>
            <button type="button" onclick="setAdvancePreset(2000)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">₹2,000</button>
            <button type="button" onclick="setAdvancePreset(2500)" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shadow-xs">₹2,500</button>
            <button type="button" onclick="setAdvancePreset(3000)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">₹3,000</button>
            <button type="button" onclick="setAdvancePreset(5000)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition">₹5,000</button>
            <button type="button" onclick="setAdvancePreset(6000)" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shadow-xs">₹6,000</button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Reason</label>
          <input type="text" id="advanceNotes" placeholder="e.g. Festival advance, Emergency" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
        </div>

        <button type="submit" class="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition">
          + Record Advance
        </button>
      </form>

      <!-- Existing Advances for this Month -->
      <div class="mt-5 pt-3 border-t border-slate-100">
        <div class="text-xs font-bold text-slate-700 uppercase mb-2">Advances for This Month</div>
        <div id="advanceList" class="space-y-2 max-h-48 overflow-y-auto">
          <!-- Rendered by JS -->
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: SALARY BONUS & INCENTIVES MANAGER (WITH COMMENTS)                  -->
  <!-- ========================================================================= -->
  <div id="bonusModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <i data-lucide="gift" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 id="bonusModalStaffName" class="text-base font-bold text-slate-900">Salary Bonus</h3>
            <p class="text-xs text-slate-500">Add bonus with comments for staff</p>
          </div>
        </div>
        <button onclick="closeBonusModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form id="bonusForm" onsubmit="handleSaveBonus(event)" class="mt-4 space-y-3.5">
        <input type="hidden" id="bonusStaffId">
        
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Bonus Amount (₹) *</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input type="text" inputmode="decimal" id="bonusAmount" required placeholder="e.g. 2500, 5000" class="w-full text-base sm:text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Date *</label>
            <input type="date" id="bonusDate" required class="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500">
          </div>
        </div>

        <!-- Quick Amount Presets -->
        <div>
          <div class="text-[10px] text-slate-400 uppercase font-bold mb-1.5">Quick Select Amount:</div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="setBonusPreset(500)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition cursor-pointer">₹500</button>
            <button type="button" onclick="setBonusPreset(1000)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition cursor-pointer">₹1,000</button>
            <button type="button" onclick="setBonusPreset(2000)" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition cursor-pointer">₹2,000</button>
            <button type="button" onclick="setBonusPreset(2500)" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs cursor-pointer">₹2,500</button>
            <button type="button" onclick="setBonusPreset(5000)" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs cursor-pointer">₹5,000</button>
            <button type="button" onclick="setBonusPreset(10000)" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition shadow-2xs cursor-pointer">₹10,000</button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Bonus Comments / Purpose *</label>
          <input type="text" id="bonusComments" required placeholder="e.g. Diwali Bonus, Outstanding Performance, Guest Tips" class="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500">
        </div>

        <button type="submit" class="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Add Bonus with Comments</span>
        </button>
      </form>

      <!-- Existing Bonuses for this Month -->
      <div class="mt-5 pt-3 border-t border-slate-100">
        <div class="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center justify-between">
          <span>Bonuses for This Month</span>
          <span id="bonusTotalBadge" class="text-emerald-700 font-mono font-bold text-xs"></span>
        </div>
        <div id="bonusList" class="space-y-2 max-h-48 overflow-y-auto">
          <!-- Rendered by JS -->
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: SALARY SLIP (PRINTABLE VOUCHER)                                    -->
  <!-- ========================================================================= -->
  <div id="salarySlipModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      
      <div class="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
        <div class="flex items-center gap-2 text-slate-900 font-bold">
          <i data-lucide="receipt" class="w-5 h-5 text-indigo-600"></i>
          <span>Salary Voucher</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition flex items-center gap-1.5">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>Print Slip</span>
          </button>
          <button onclick="closeSalarySlipModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Printable Slip Area -->
      <div id="salarySlipContent" class="mt-4 font-sans text-slate-800">
        <!-- Rendered by JS -->
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: VIEW PAYMENT QR CODE & BANK DETAILS                               -->
  <!-- ========================================================================= -->
  <div id="paymentQrModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between w-full pb-3 border-b border-slate-100">
        <div class="text-left">
          <h3 id="payModalStaffName" class="text-base font-bold text-slate-900">Pay Staff</h3>
          <p id="payModalAmountText" class="text-xs text-emerald-600 font-bold font-mono">Net Payout: ₹0</p>
        </div>
        <button onclick="closePaymentQrModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- QR Code Display -->
      <div id="qrCodeCard" class="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center w-full">
        <div id="qrImageWrap" class="w-56 h-56 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shadow-xs">
          <img id="payQrImage" src="" class="w-full h-full object-contain" alt="Payment QR Code">
          <div id="noQrText" class="hidden text-xs text-slate-400 p-4 text-center">No QR code photo uploaded yet.<br><span class="text-indigo-600 font-semibold cursor-pointer underline" onclick="openStaffModalFromPay()">Click here to upload QR</span></div>
        </div>
        <div id="qrScanPrompt" class="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1">
          <i data-lucide="scan" class="w-3.5 h-3.5 text-indigo-500"></i>
          <span>Scan with Google Pay, PhonePe, or Paytm</span>
        </div>
      </div>

      <!-- UPI & Bank Details Card -->
      <div class="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
        <div id="payUpiRow" class="flex items-center justify-between">
          <span class="text-slate-500 font-medium">UPI ID:</span>
          <div class="flex items-center gap-1.5 font-mono font-bold text-slate-800">
            <span id="payUpiText">-</span>
            <button onclick="copyToClipboard('payUpiText', 'UPI ID copied!')" class="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Copy UPI">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <div id="payBankRow" class="border-t border-slate-200/80 pt-2 space-y-1">
          <div class="flex justify-between"><span class="text-slate-500">Bank:</span><strong id="payBankName" class="text-slate-800">-</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">A/C No:</span><strong id="payAccountNo" class="font-mono text-slate-800">-</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">IFSC:</span><strong id="payIfsc" class="font-mono text-slate-800">-</strong></div>
          <button onclick="copyBankDetails()" class="w-full mt-1.5 py-1 text-[11px] font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition">
            Copy Bank Details
          </button>
        </div>
      </div>

      <!-- Action: Mark as Paid -->
      <div class="w-full pt-4 flex gap-2">
        <button onclick="closePaymentQrModal()" class="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
          Close
        </button>
        <button onclick="openRecordPaymentFromQr()" class="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center justify-center gap-1">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>Mark as Paid</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: RECORD SALARY PAYMENT STATUS                                       -->
  <!-- ========================================================================= -->
  <div id="recordPaymentModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 id="paymentModalStaffName" class="text-base font-bold text-slate-900">Record Salary Payment</h3>
          <p id="paymentModalMonthText" class="text-xs text-slate-500">October 2026</p>
        </div>
        <button onclick="closeRecordPaymentModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form id="paymentForm" onsubmit="handleSavePayment(event)" class="mt-4 space-y-3.5">
        <input type="hidden" id="paymentStaffId">
        
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Amount Paid (₹) *</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input type="text" inputmode="decimal" id="paymentAmount" required class="w-full text-sm pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Date *</label>
            <input type="date" id="paymentDate" required class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Mode *</label>
          <select id="paymentMode" required class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            <option value="UPI / QR Code">UPI / QR Code (GPay, PhonePe, Paytm)</option>
            <option value="Bank Transfer / NEFT">Bank Transfer / NEFT / IMPS</option>
            <option value="Cash">Cash in Hand</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Ref / UTR / Note</label>
          <input type="text" id="paymentRef" placeholder="e.g. UTR1928301928, Paid by cash" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
        </div>

        <div class="pt-3 flex items-center justify-between border-t border-slate-100">
          <button type="button" id="btnRevertPayment" onclick="handleRevertPayment()" class="hidden text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition">
            Revert to Unpaid
          </button>
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" onclick="closeRecordPaymentModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition">
              Confirm as Paid
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: LEAVE RULES PER PROPERTY                                           -->
  <!-- ========================================================================= -->
  <div id="leaveModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Property Leave Allowances</h3>
          <p class="text-xs text-slate-500">Configure monthly leaves allocated for each property</p>
        </div>
        <button onclick="closeLeavePolicyModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <div id="propertyAllowanceList" class="mt-4 space-y-3">
        <!-- Rendered by JS -->
      </div>

      <div class="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
        <button onclick="closeLeavePolicyModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
          Close
        </button>
        <button onclick="saveAllLeaveAllowances()" class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition">
          Save Changes
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- ADMIN SECURITY & PIN MANAGEMENT MODAL                                    -->
  <!-- ========================================================================= -->
  <div id="adminSecurityModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col">
      <div class="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
            <i data-lucide="key-round" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Security & PINs</h3>
            <p class="text-xs text-slate-500">Change Admin Master PIN & Manager Keys</p>
          </div>
        </div>
        <button onclick="closeAdminSecurityModal()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Security Tabs -->
      <div class="flex border-b border-slate-200 mb-4 text-xs font-semibold">
        <button type="button" id="secTabAdmin" onclick="switchSecurityTab('admin')" class="py-2 px-3 border-b-2 border-indigo-600 text-indigo-600 transition">Admin Master PIN</button>
        <button type="button" id="secTabManagers" onclick="switchSecurityTab('managers')" class="py-2 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition">Manager Keys</button>
      </div>

      <!-- Tab 1: Admin Master PIN Form -->
      <form id="adminPinChangeForm" onsubmit="handleChangeAdminPin(event)" class="space-y-3.5">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Current Admin PIN *</label>
          <div class="relative">
            <input type="password" id="currentAdminPin" maxlength="4" pattern="[0-9]*" inputmode="numeric" required placeholder="••••" class="w-full text-center tracking-widest font-mono font-bold text-base px-3 py-2 pr-10 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            <button type="button" onclick="togglePinVisibility('currentAdminPin', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">New 4-Digit Admin PIN *</label>
          <div class="relative">
            <input type="password" id="newAdminPin" maxlength="4" pattern="[0-9]*" inputmode="numeric" required placeholder="••••" class="w-full text-center tracking-widest font-mono font-bold text-base px-3 py-2 pr-10 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            <button type="button" onclick="togglePinVisibility('newAdminPin', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Confirm New Admin PIN *</label>
          <div class="relative">
            <input type="password" id="confirmAdminPin" maxlength="4" pattern="[0-9]*" inputmode="numeric" required placeholder="••••" class="w-full text-center tracking-widest font-mono font-bold text-base px-3 py-2 pr-10 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
            <button type="button" onclick="togglePinVisibility('confirmAdminPin', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div id="adminPinError" class="text-xs text-rose-500 font-medium min-h-[1rem]"></div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeAdminSecurityModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            Cancel
          </button>
          <button type="submit" class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition">
            Save Admin PIN
          </button>
        </div>
      </form>

      <!-- Tab 2: Manager PINs List -->
      <div id="managerPinsContainer" class="hidden space-y-3">
        <p class="text-xs text-slate-500">Managers can mark roll call and attendance. Update their 4-digit PIN below:</p>
        <div id="managerPinsList" class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          <!-- Rendered dynamically -->
        </div>
        <div class="flex items-center justify-end pt-2 border-t border-slate-100">
          <button type="button" onclick="closeAdminSecurityModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- FLOATING QUICK CELL PICKER (POPOVER)                                       -->
  <!-- ========================================================================= -->
  <div id="statusPickerPopover" class="fixed z-40 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 hidden flex-col gap-1 w-44 animate-in fade-in zoom-in-95 duration-100">
    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Change Status</div>
    <button onclick="selectStatus('present')" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-emerald-800 transition">
      <span class="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">P</span>
      <span>Present</span>
    </button>
    <button onclick="selectStatus('absent')" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-xs font-semibold text-rose-800 transition">
      <span class="w-5 h-5 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-bold">A</span>
      <span>Absent</span>
    </button>
    <button onclick="selectStatus('day_off')" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-sky-50 text-xs font-semibold text-sky-800 transition">
      <span class="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center text-[10px] font-bold">DO</span>
      <span>Day Off</span>
    </button>
    <button onclick="selectStatus('leave')" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-xs font-semibold text-amber-800 transition">
      <span class="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">L</span>
      <span>Leave (Quota)</span>
    </button>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: ADD / EDIT DAILY SALES & EXPENSES                                  -->
  <!-- ========================================================================= -->
  <div id="financeModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 id="financeModalTitle" class="text-base font-bold text-slate-900">Record Sales & Expenses</h3>
          <p class="text-xs text-slate-500">Enter lodging, fooding and daily operating expenses</p>
        </div>
        <button onclick="closeFinanceModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form id="financeModalForm" onsubmit="handleSaveFinance(event)" class="space-y-4 pt-4">
        <input type="hidden" id="modalFinanceId" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Property *</label>
            <select id="modalFinanceProperty" onchange="onModalFinancePropertyChange(this.value)" required class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white">
              <!-- Rendered options -->
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
            <input type="date" id="modalFinanceDate" required class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium" />
          </div>
        </div>

        <!-- Lodging Group (Derived from Room Bookings) -->
        <div id="modalLodgingGroup" class="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <i data-lucide="hotel" class="w-3.5 h-3.5 text-indigo-600"></i>
              Lodging Revenue (Room Bookings)
            </span>
            <span class="text-xs font-black text-indigo-900 font-mono">₹<span id="modalLodgingSubtotal">0</span></span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-indigo-800 bg-white/80 px-2.5 py-1.5 rounded-xl border border-indigo-100">
            <span>Online: ₹<strong id="modalLodgingOnlineDisplay" class="font-mono">0</strong> · Cash: ₹<strong id="modalLodgingCashDisplay" class="font-mono">0</strong></span>
            <button type="button" onclick="openRoomBookingsFromModal()" class="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer text-[10px]">
              Manage Rooms & Bookings →
            </button>
          </div>
          <input type="hidden" id="modalLodgingOnline" value="0" />
          <input type="hidden" id="modalLodgingCash" value="0" />
        </div>

        <!-- Fooding Group -->
        <div id="modalFoodingGroup" class="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <i data-lucide="utensils" class="w-3.5 h-3.5 text-amber-600"></i>
              Fooding Revenue (Restaurant / F&B)
            </span>
            <span class="text-[11px] font-bold text-amber-800">Subtotal: ₹<span id="modalFoodingSubtotal">0</span></span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">Online Payment (UPI/QR)</label>
              <input type="number" id="modalFoodingOnline" min="0" placeholder="0" oninput="calculateModalFinanceLiveTotals()" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-amber-200 bg-white font-mono focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">Cash Payment (Cash)</label>
              <input type="number" id="modalFoodingCash" min="0" placeholder="0" oninput="calculateModalFinanceLiveTotals()" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-amber-200 bg-white font-mono focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
        </div>

        <!-- Services Group (for Salon / Services) -->
        <div id="modalServicesGroup" class="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-600"></i>
              <span id="modalServicesTitleLabel">Services Revenue</span>
            </span>
            <span class="text-xs font-black text-purple-900 font-mono">₹<span id="modalServicesSubtotal">0</span></span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-0.5">Online Payment (UPI/Card/QR)</label>
              <input type="number" id="modalServicesOnline" min="0" placeholder="0" oninput="calculateModalFinanceLiveTotals()" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-purple-200 bg-white font-mono focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-0.5">Cash Payment (Cash at Counter)</label>
              <input type="number" id="modalServicesCash" min="0" placeholder="0" oninput="calculateModalFinanceLiveTotals()" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-purple-200 bg-white font-mono focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        <!-- Other Sales & Total Sales Live Card -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Other / Misc Sales (₹)</label>
            <input type="number" id="modalOtherSales" min="0" placeholder="0" oninput="calculateModalFinanceLiveTotals()" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
          <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-2.5 rounded-2xl border border-emerald-200 flex flex-col justify-center">
            <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Gross Total Sales</span>
            <span class="text-lg font-black text-emerald-700 font-mono">₹<span id="modalTotalSales">0</span></span>
          </div>
        </div>

        <!-- Expenses Group -->
        <div class="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-rose-950 flex items-center gap-1.5">
              <i data-lucide="receipt" class="w-3.5 h-3.5 text-rose-600"></i>
              Daily Operating Expenses (₹) *
            </span>
          </div>
          <input type="number" id="modalExpensesTotal" min="0" placeholder="0" oninput="calculateModalFinanceLiveTotals()" class="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white font-mono font-bold text-rose-700 focus:ring-2 focus:ring-rose-500" />
          <div>
            <label class="block text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1">Expense Breakdown / Notes</label>
            <textarea id="modalExpenseNotes" rows="2" placeholder="Itemize e.g. Vegetables ₹1200, Diesel ₹1500, Grocery ₹800..." class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-rose-200 bg-white focus:ring-2 focus:ring-rose-500"></textarea>
          </div>
        </div>

        <!-- Net Operating Profit Live Banner -->
        <div class="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
          <div>
            <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Net Operating Profit</div>
            <div class="text-xs text-slate-300">Gross Sales minus Total Expenses</div>
          </div>
          <div class="text-xl font-black font-mono text-emerald-400">
            ₹<span id="modalNetProfit">0</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Remarks / Shift Notes (Optional)</label>
          <input type="text" id="modalNotes" placeholder="Additional details..." class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeFinanceModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
            Cancel
          </button>
          <button type="submit" id="btnSaveFinanceModal" class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
            <i data-lucide="save" class="w-3.5 h-3.5"></i>
            <span>Save Record</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Room Booking Modal (Add / Edit individual booking) -->
  <div id="roomBookingModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 id="roomBookingModalTitle" class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <i data-lucide="door-closed" class="w-4 h-4 text-indigo-600"></i>
          Record Room Booking
        </h3>
        <button type="button" onclick="closeRoomBookingModal()" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Stay Duration Type Segmented Control -->
      <div id="modalStayTypeSegment" class="flex items-center justify-between p-1 bg-slate-100 rounded-xl mb-3">
        <button type="button" id="btnModalStaySingle" onclick="setModalStayMode('single')" class="flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 bg-white text-indigo-600 shadow-2xs">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
          <span>Single Day</span>
        </button>
        <button type="button" id="btnModalStayRange" onclick="setModalStayMode('range')" class="flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900">
          <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>
          <span>Multi-Day Date Range</span>
        </button>
      </div>

      <!-- Notice when editing a multi-day stay -->
      <div id="modalGroupStayNotice" class="hidden p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs mb-3">
        <div class="font-bold flex items-center gap-1.5">
          <i data-lucide="layers" class="w-3.5 h-3.5 text-purple-600"></i>
          <span>Part of Multi-Day Stay</span>
        </div>
        <p class="text-[11px] text-purple-700 mt-0.5">Stay Period: <span id="modalGroupStayDates" class="font-semibold"></span></p>
        <label class="mt-2 flex items-center gap-2 cursor-pointer font-semibold text-purple-950 select-none">
          <input type="checkbox" id="modalUpdateEntireGroup" checked class="rounded text-purple-600 focus:ring-purple-500 w-4 h-4">
          <span>Apply guest & payment mode changes to all days of this stay</span>
        </label>
      </div>

      <form id="roomBookingForm" onsubmit="handleSaveRoomBookingModal(event)" class="space-y-3.5">
        <input type="hidden" id="modalBookingId" />
        <input type="hidden" id="modalBookingProperty" />

        <!-- Room Selector -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Select Room *</label>
          <select id="modalBookingRoomSelect" required onchange="onModalRoomSelectChange(this.value)" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500">
            <!-- Rendered options -->
          </select>
        </div>

        <!-- 1. Single Day Date Input -->
        <div id="modalSingleDateContainer">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
          <input type="date" id="modalBookingDate" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white" />
        </div>

        <!-- 2. Date Range Input (Multi-Day Stay) -->
        <div id="modalDateRangeContainer" class="hidden space-y-2.5">
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Check-in Date *</label>
              <input type="date" id="modalBookingCheckInDate" onchange="onModalRangeDateChange()" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Check-out Date *</label>
              <input type="date" id="modalBookingCheckOutDate" onchange="onModalRangeDateChange()" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white" />
            </div>
          </div>

          <!-- Range Summary Pill -->
          <div id="modalRangeSummaryCard" class="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <i data-lucide="moon" class="w-3.5 h-3.5"></i>
              </span>
              <div>
                <div id="modalRangeNightsLabel" class="font-bold">1 Night Stay</div>
                <div id="modalRangeDatesLabel" class="text-[11px] text-indigo-700 font-medium">Nov 05 → Nov 06</div>
              </div>
            </div>
            <label class="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-950 cursor-pointer select-none">
              <input type="checkbox" id="modalIncludeCheckoutDay" onchange="onModalRangeDateChange()" class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5">
              <span>Include checkout day</span>
            </label>
          </div>
        </div>

        <!-- 3. Amount Inputs -->
        <!-- Single Day Amount -->
        <div id="modalSingleAmountContainer">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Booking Amount (₹) *</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
            <input type="number" id="modalBookingAmount" min="0" step="1" placeholder="2000" class="w-full pl-7 pr-3 py-2 text-sm font-black font-mono text-slate-900 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <!-- Multi-Day Amount (Rate per night + Total stay amount) -->
        <div id="modalRangeAmountContainer" class="hidden space-y-1">
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Rate / Night (₹) *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                <input type="number" id="modalRatePerNight" min="0" step="1" placeholder="2000" oninput="onModalRateChange(this.value)" class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Total Stay Amount (₹) *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                <input type="number" id="modalTotalStayAmount" min="0" step="1" placeholder="6000" oninput="onModalTotalAmountChange(this.value)" class="w-full pl-7 pr-3 py-2 text-sm font-black font-mono text-indigo-900 rounded-xl border border-indigo-300 bg-indigo-50/40 focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
          <p class="text-[10px] text-slate-400">
            Records <span id="modalDailyRatePreview" class="font-bold text-indigo-700 font-mono">₹2,000</span>/day across the selected stay dates.
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method *</label>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 cursor-pointer hover:bg-indigo-50 transition">
              <input type="radio" name="modalBookingPaymentMode" value="online" id="modalBookingModeOnline" checked class="text-indigo-600 focus:ring-indigo-500" />
              <div>
                <div class="text-xs font-bold text-indigo-950">Online Payment</div>
                <div class="text-[10px] text-indigo-700/80">UPI / Card / OTA</div>
              </div>
            </label>
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer hover:bg-amber-50 transition">
              <input type="radio" name="modalBookingPaymentMode" value="cash" id="modalBookingModeCash" class="text-amber-600 focus:ring-amber-500" />
              <div>
                <div class="text-xs font-bold text-amber-950">Cash Payment</div>
                <div class="text-[10px] text-amber-700/80">Cash at Counter</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Guest Name / Reference (Optional)</label>
          <input type="text" id="modalBookingGuestName" placeholder="e.g. Rahul Sharma, Booking.com, Walk-in" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks (Optional)</label>
          <input type="text" id="modalBookingNotes" placeholder="e.g. Day use, Checked out early, Extra bed" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
        </div>

        <p class="text-[11px] text-slate-400 italic">
          <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
          Multiple bookings for the same room on the same day are supported and automatically summed into lodging revenue.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeRoomBookingModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
            Cancel
          </button>
          <button type="submit" id="btnSubmitModalBooking" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span id="btnSubmitModalBookingText">Save Booking</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Room Day Detail Modal (View / Add multiple bookings for a room on a date) -->
  <div id="roomDayDetailModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 id="roomDayDetailTitle" class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="door-closed" class="w-4 h-4 text-indigo-600"></i>
            Room Bookings
          </h3>
          <p id="roomDayDetailSubtitle" class="text-xs text-slate-500 mt-0.5">Date & Room info</p>
        </div>
        <button type="button" onclick="closeRoomDayDetailModal()" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <div id="roomDayDetailList" class="space-y-2.5 max-h-72 overflow-y-auto">
        <!-- Rendered by JS -->
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
        <button type="button" id="btnBookAgainRoomDay" onclick="openAddBookingForCurrentDetail()" class="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer flex items-center gap-1.5">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          <span>Book This Room Again</span>
        </button>
        <button type="button" onclick="closeRoomDayDetailModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Manage Rooms Modal (Admin Add/Edit Room) -->
  <div id="manageRoomModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 id="manageRoomModalTitle" class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <i data-lucide="door-closed" class="w-4 h-4 text-indigo-600"></i>
          Configure Room
        </h3>
        <button type="button" onclick="closeManageRoomModal()" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form id="manageRoomForm" onsubmit="handleSaveRoomModal(event)" class="space-y-3.5">
        <input type="hidden" id="modalRoomId" />

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Property *</label>
          <select id="modalRoomProperty" required class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500">
            <!-- Rendered by JS -->
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
            <input type="text" id="modalRoomNumber" required placeholder="e.g. 101, 102" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
            <input type="text" id="modalRoomType" placeholder="Standard, Deluxe, etc." value="Standard" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Base Price / Default Rate (₹)</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
            <input type="number" id="modalRoomBasePrice" min="0" step="1" placeholder="2000" class="w-full pl-7 pr-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeManageRoomModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
            Cancel
          </button>
          <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span>Save Room</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Business Offerings Configuration Modal (Admin) -->
  <div id="businessConfigModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 id="businessConfigModalTitle" class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="sliders" class="w-4 h-4 text-indigo-600"></i>
            Configure Business Offerings
          </h3>
          <p id="businessConfigModalSubtitle" class="text-xs text-slate-500 mt-0.5">Select active offerings and revenue modules</p>
        </div>
        <button type="button" onclick="closeBusinessConfigModal()" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form id="businessConfigForm" onsubmit="handleSaveBusinessConfig(event)" class="space-y-4">
        <input type="hidden" id="modalConfigPropId" />

        <!-- Quick Template Presets -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Business Template / Preset</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onclick="applyBusinessPreset('hotel')"
              class="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition cursor-pointer"
            >
              <div class="text-xs font-bold text-indigo-950 flex items-center gap-1">🏨 Hotel</div>
              <div class="text-[10px] text-indigo-700/80 mt-0.5">Lodging + Fooding</div>
            </button>
            <button
              type="button"
              onclick="applyBusinessPreset('restaurant')"
              class="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition cursor-pointer"
            >
              <div class="text-xs font-bold text-amber-950 flex items-center gap-1">🍽️ Fooding</div>
              <div class="text-[10px] text-amber-700/80 mt-0.5">Restaurant only</div>
            </button>
            <button
              type="button"
              onclick="applyBusinessPreset('salon')"
              class="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-left transition cursor-pointer"
            >
              <div class="text-xs font-bold text-purple-950 flex items-center gap-1">✂️ Salon</div>
              <div class="text-[10px] text-purple-700/80 mt-0.5">Services only</div>
            </button>
            <button
              type="button"
              onclick="applyBusinessPreset('services')"
              class="p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-left transition cursor-pointer"
            >
              <div class="text-xs font-bold text-teal-950 flex items-center gap-1">🛎️ Services</div>
              <div class="text-[10px] text-teal-700/80 mt-0.5">Custom services</div>
            </button>
          </div>
        </div>

        <!-- Capability Toggles -->
        <div class="space-y-2.5 pt-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Active Offerings / Revenue Modules</label>

          <!-- Lodging Toggle -->
          <label class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/30 transition cursor-pointer">
            <input type="checkbox" id="modalConfigHasLodging" class="mt-0.5 w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer" />
            <div class="flex-1">
              <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <i data-lucide="hotel" class="w-3.5 h-3.5 text-indigo-600"></i>
                <span>Lodging & Rooms</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">Enables Room status chips, room booking manager, room matrix calendar, and automated lodging revenue.</div>
            </div>
          </label>

          <!-- Fooding Toggle -->
          <label class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-amber-50/30 transition cursor-pointer">
            <input type="checkbox" id="modalConfigHasFooding" class="mt-0.5 w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer" />
            <div class="flex-1">
              <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <i data-lucide="utensils" class="w-3.5 h-3.5 text-amber-600"></i>
                <span>Fooding & Restaurant</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">Enables daily Fooding revenue entry with Online payment vs Cash payment breakdown.</div>
            </div>
          </label>

          <!-- Services Toggle -->
          <label class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-purple-50/30 transition cursor-pointer">
            <input type="checkbox" id="modalConfigHasServices" onchange="toggleServicesLabelInput(this.checked)" class="mt-0.5 w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 cursor-pointer" />
            <div class="flex-1">
              <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-600"></i>
                <span>Services (Salon, Spa, Agency, Domestic)</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">Enables daily Services revenue entry with Online payment vs Cash payment breakdown.</div>
            </div>
          </label>
        </div>

        <!-- Services Label -->
        <div id="modalConfigServicesLabelRow" class="hidden">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Custom Services Label</label>
          <input
            type="text"
            id="modalConfigServicesLabel"
            placeholder="e.g. Salon Services, Spa Treatments, Professional Services"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeBusinessConfigModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
            Cancel
          </button>
          <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transform translate-y-16 opacity-0 transition-all duration-200">
    <i data-lucide="info" class="w-4 h-4 text-indigo-400"></i>
    <span id="toastMsg">Action completed</span>
  </div>

  <!-- ========================================================================= -->
  <!-- JAVASCRIPT APPLICATION LOGIC                                              -->
  <!-- ========================================================================= -->
  <script>
    // State
    const AUTH_PIN_KEY = "staff_auth_pin";
    const AUTH_ROLE_KEY = "staff_auth_role";
    const AUTH_MANAGER_KEY = "staff_manager_info";
    let currentSessionPin = localStorage.getItem(AUTH_PIN_KEY) || "";
    let currentUserRole = "admin"; // 'admin' or 'manager'
    let currentManagerInfo = null; // { staff_id, name, property_id, property_name }
    let isSubmittingLogin = false;
    let activePropertyId = "all"; // 'all' or property.id
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0-indexed
    let dailyDate = new Date();
    let currentView = "daily"; // Default to Daily Roll Call for best mobile & daily experience ('daily', 'monthly', 'payroll', 'directory')
    let mobileMonthlyMode = "cards"; // 'cards' or 'table'
    const openStaffCalendars = new Set();

    let properties = [];
    let staffList = [];
    let attendanceMap = {}; // { [staff_id_YYYY-MM-DD]: "present" | "absent" | "day_off" | "leave" }
    let priorLeavesMap = {}; // { [staff_id]: number } leaves taken before current month
    let advancesList = []; // Array of advance records for current month
    let bonusesList = []; // Array of salary bonus records for current month
    let paymentsList = []; // Array of salary payment records for current month
    let financesList = []; // Array of daily_finances records
    let managerFinanceDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let financeYear = new Date().getFullYear();
    let financeMonth = new Date().getMonth(); // 0-indexed
    let financeFilterProperty = "all";
    let roomsList = []; // Array of room records
    let roomBookingsList = []; // Array of room_bookings records
    let adminFinanceSubTab = "dashboard"; // 'dashboard' | 'calendar' | 'rooms'
    let calendarSelectedProperty = "xsquare-hotel";
    let calendarViewMode = "matrix"; // 'matrix' | 'calendar'
    let quickBookPaymentMode = "online";
    let currentDetailRoomId = null;
    let currentDetailDate = null;
    let currentDocStaffId = null;
    let currentPaymentStaffId = null;
    let currentPaymentAmount = 0;

    let currentPickerTarget = null; // { staffId, date }

    // Init Lucide
    function refreshIcons() {
      if (window.lucide) lucide.createIcons();
    }

    // Manual / Auto-Sync with Cloudflare D1
    async function syncAllDataNow() {
      const syncIcon = document.getElementById("syncNowIcon");
      if (syncIcon) syncIcon.classList.add("animate-spin");
      try {
        const promises = [
          fetchProperties(),
          fetchStaff(),
          fetchAttendance(),
          fetchFinances(),
          fetchRooms(),
          fetchRoomBookings()
        ];
        if (currentUserRole === "admin") {
          promises.push(fetchAdvances(), fetchBonuses(), fetchPayments());
        }
        await Promise.all(promises);
        renderPropertyTabs();
        renderActiveView();
        showToast("All records synced with Cloud D1");
      } catch (err) {
        showToast("Sync error: " + err.message);
      } finally {
        if (syncIcon) syncIcon.classList.remove("animate-spin");
      }
    }

    // -------------------------------------------------------------------------
    // PIN & AUTHENTICATION (ADMIN & MANAGER WITH DROPDOWN SELECTOR)
    // -------------------------------------------------------------------------
    async function initAuth() {
      await fetchLoginRoles();
      const saved = localStorage.getItem(AUTH_PIN_KEY);
      const savedRole = localStorage.getItem(AUTH_ROLE_KEY);
      const savedManager = localStorage.getItem(AUTH_MANAGER_KEY);
      if (saved) {
        if (savedRole) currentUserRole = savedRole;
        if (savedManager) {
          try { currentManagerInfo = JSON.parse(savedManager); } catch (e) {}
        }
        verifyPin(saved, true, currentUserRole, currentManagerInfo ? currentManagerInfo.staff_id : null);
      } else {
        showLockScreen();
      }
    }

    async function fetchLoginRoles() {
      try {
        const res = await fetch("/api/auth/roles");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.roles)) {
          const select = document.getElementById("loginRoleSelect");
          if (!select) return;
          const currentVal = select.value;
          select.innerHTML = "";
          data.roles.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.staff_id || r.role;
            opt.dataset.role = r.role;
            if (r.staff_id) opt.dataset.staffId = r.staff_id;
            opt.textContent = r.name;
            select.appendChild(opt);
          });
          if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
            select.value = currentVal;
          }
          onLoginRoleChange(false);
        }
      } catch (e) {
        // Fallback to default options in HTML
      }
    }

    function onLoginRoleChange(clearInput = false) {
      const select = document.getElementById("loginRoleSelect");
      const hint = document.getElementById("loginRoleHintText");
      if (!select || !hint) return;
      const opt = select.options[select.selectedIndex];
      const role = opt ? (opt.dataset.role || select.value) : "admin";

      if (role === "admin") {
        hint.innerText = "Admin: enter your 4-digit PIN for full management";
      } else {
        hint.innerText = "Manager: enter your 4-digit PIN for roll call & attendance";
      }

      const err = document.getElementById("pinError");
      if (err) err.innerText = "";

      if (clearInput) {
        const input = document.getElementById("pinInputField");
        if (input) {
          input.value = "";
          input.focus();
        }
      }
    }

    function showLockScreen() {
      const lock = document.getElementById("lockScreen");
      if (lock) {
        lock.style.display = "flex";
        lock.classList.remove("hidden");
        lock.classList.add("flex");
      }
      isSubmittingLogin = false;
      const input = document.getElementById("pinInputField");
      if (input) {
        input.value = "";
        input.type = "password";
        setTimeout(() => input.focus(), 150);
      }
      const eyeIcon = document.getElementById("loginPinEyeIcon");
      if (eyeIcon) eyeIcon.setAttribute("data-lucide", "eye");
      const err = document.getElementById("pinError");
      if (err) err.innerText = "";
      refreshIcons();
    }

    function lockApp() {
      currentSessionPin = "";
      localStorage.removeItem(AUTH_PIN_KEY);
      localStorage.removeItem(AUTH_ROLE_KEY);
      localStorage.removeItem(AUTH_MANAGER_KEY);
      currentUserRole = "admin";
      currentManagerInfo = null;
      applyRolePermissions();
      showLockScreen();
    }

    function applyRolePermissions() {
      const badge = document.getElementById("userRoleBadge");
      const btnLeaveRules = document.getElementById("btnLeaveRules");
      const btnAddStaff = document.getElementById("btnHeaderAddStaff");
      const btnAdminSecurity = document.getElementById("btnAdminSecurity");
      const tabPayroll = document.getElementById("viewTabPayroll");
      const tabDirectory = document.getElementById("viewTabDirectory");

      if (currentUserRole === "manager" && currentManagerInfo) {
        badge.innerHTML = \`
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="sm:hidden">Manager</span>
          <span class="hidden sm:inline">Manager: \${escapeHtml(currentManagerInfo.name)} (\${escapeHtml(currentManagerInfo.property_name || 'Property')})</span>
        \`;
        badge.className = "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0";

        if (btnAdminSecurity) btnAdminSecurity.style.display = "none";
        if (btnLeaveRules) btnLeaveRules.style.display = "none";
        if (btnAddStaff) btnAddStaff.style.display = "none";
        if (tabPayroll) tabPayroll.style.display = "none";
        if (tabDirectory) tabDirectory.style.display = "none";

        if (currentView === "payroll" || currentView === "directory") {
          switchView("daily");
        }

        activePropertyId = currentManagerInfo.property_id || "all";
      } else {
        badge.innerHTML = \`
          <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
          <span class="sm:hidden">Admin</span>
          <span class="hidden sm:inline">Admin Access</span>
        \`;
        badge.className = "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0";

        if (btnAdminSecurity) btnAdminSecurity.style.display = "";
        if (btnLeaveRules) btnLeaveRules.style.display = "";
        if (btnAddStaff) btnAddStaff.style.display = "";
        if (tabPayroll) tabPayroll.style.display = "";
        if (tabDirectory) tabDirectory.style.display = "";
      }
      refreshIcons();
    }

    function getVisibleStaffList() {
      if (currentUserRole === "manager" && currentManagerInfo && currentManagerInfo.property_id) {
        return staffList.filter(s => s.property_id === currentManagerInfo.property_id);
      }
      if (activePropertyId === 'all') {
        return staffList;
      }
      return staffList.filter(s => s.property_id === activePropertyId);
    }

    function toggleManagerPinField() {
      const isManager = document.getElementById("staffIsManager").checked;
      const container = document.getElementById("managerPinContainer");
      if (isManager) {
        container.classList.remove("hidden");
      } else {
        container.classList.add("hidden");
      }
    }

    function toggleLoginPinEye() {
      const input = document.getElementById("pinInputField");
      const icon = document.getElementById("loginPinEyeIcon");
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        if (icon) icon.setAttribute("data-lucide", "eye-off");
      } else {
        input.type = "password";
        if (icon) icon.setAttribute("data-lucide", "eye");
      }
      refreshIcons();
    }

    function handlePinInput(el) {
      const clean = (el.value || "").replace(/\\D/g, '').slice(0, 4);
      if (el.value !== clean) el.value = clean;
      const err = document.getElementById("pinError");
      if (err) err.innerText = "";
      if (clean.length === 4) {
        submitPinLogin();
      }
    }

    function handlePinKeydown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitPinLogin();
      }
    }

    function handleKeypad(val) {
      const input = document.getElementById("pinInputField");
      if (!input) return;
      const err = document.getElementById("pinError");
      if (err) err.innerText = "";
      let current = (input.value || "").replace(/\\D/g, '').slice(0, 4);
      if (val === 'clear') {
        current = "";
      } else if (val === 'back') {
        current = current.slice(0, -1);
      } else if (current.length < 4) {
        current += val;
      }
      input.value = current;
      if (current.length === 4) {
        submitPinLogin();
      }
    }

    window.addEventListener("keydown", (e) => {
      const lockScreen = document.getElementById("lockScreen");
      const pinInput = document.getElementById("pinInputField");
      if (lockScreen && lockScreen.style.display !== "none" && !lockScreen.classList.contains("hidden")) {
        if (document.activeElement !== pinInput) {
          if (e.key >= "0" && e.key <= "9") {
            handleKeypad(e.key);
          } else if (e.key === "Backspace") {
            handleKeypad("back");
          } else if (e.key === "Escape") {
            handleKeypad("clear");
          } else if (e.key === "Enter") {
            submitPinLogin();
          }
        }
      }
    });

    async function submitPinLogin() {
      if (isSubmittingLogin) return;

      const input = document.getElementById("pinInputField");
      const cleanPin = (input ? input.value : "").replace(/\\D/g, '').slice(0, 4);

      if (!cleanPin || cleanPin.length < 4) {
        const err = document.getElementById("pinError");
        if (err) err.innerText = "Please enter your 4-digit PIN.";
        if (input) input.focus();
        return;
      }

      const select = document.getElementById("loginRoleSelect");
      const opt = select ? select.options[select.selectedIndex] : null;
      const role = opt ? (opt.dataset.role || select.value) : "admin";
      const staffId = opt ? opt.dataset.staffId : null;

      await verifyPin(cleanPin, false, role, staffId);
    }

    async function verifyPin(pin, isAuto = false, role = null, staffId = null) {
      if (isSubmittingLogin) return;
      isSubmittingLogin = true;

      const btn = document.getElementById("btnPinSubmit");
      const btnText = document.getElementById("btnPinSubmitText");
      const btnIcon = document.getElementById("btnPinSubmitIcon");
      const errorDiv = document.getElementById("pinError");
      if (errorDiv) errorDiv.innerText = "";

      if (btn && !isAuto) {
        btn.disabled = true;
        if (btnText) btnText.innerText = "Signing in...";
        if (btnIcon) btnIcon.classList.add("hidden");
      }

      const select = document.getElementById("loginRoleSelect");
      const opt = select ? select.options[select.selectedIndex] : null;
      const currentSelectedRole = role || (opt ? (opt.dataset.role || select.value) : "admin");
      const currentStaffId = staffId || (opt ? opt.dataset.staffId : null);

      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pin,
            role: currentSelectedRole,
            staff_id: currentStaffId
          })
        });
        const data = await res.json();
        if (data.success) {
          currentUserRole = data.role || "admin";
          currentManagerInfo = data.role === "manager" ? {
            staff_id: data.staff_id,
            name: data.name,
            property_id: data.property_id,
            property_name: data.property_name
          } : null;

          currentSessionPin = pin;
          const remember = document.getElementById("rememberMe");
          if (!remember || remember.checked) {
            localStorage.setItem(AUTH_PIN_KEY, pin);
            localStorage.setItem(AUTH_ROLE_KEY, currentUserRole);
            if (currentManagerInfo) {
              localStorage.setItem(AUTH_MANAGER_KEY, JSON.stringify(currentManagerInfo));
            } else {
              localStorage.removeItem(AUTH_MANAGER_KEY);
            }
          }

          // Unconditionally hide lock screen
          const lockScreen = document.getElementById("lockScreen");
          if (lockScreen) {
            lockScreen.style.display = "none";
            lockScreen.classList.add("hidden");
            lockScreen.classList.remove("flex");
          }

          applyRolePermissions();
          try {
            await loadDashboardData();
          } catch (dataErr) {
            console.error("Dashboard initial load error:", dataErr);
          }
          showToast("Signed in as " + (currentUserRole === "admin" ? "Administrator" : data.name + " (Manager)"));
        } else {
          throw new Error(data.error || "Incorrect PIN. Please check and try again.");
        }
      } catch (err) {
        if (isAuto) {
          localStorage.removeItem(AUTH_PIN_KEY);
          showLockScreen();
          return;
        }
        const card = document.getElementById("lockCard");
        if (card) {
          card.classList.add("shake");
          setTimeout(() => card.classList.remove("shake"), 500);
        }
        if (errorDiv) {
          errorDiv.innerText = err.message || "Incorrect PIN. Please check and try again.";
        }
        const input = document.getElementById("pinInputField");
        if (input) {
          input.focus();
          input.select();
        }
      } finally {
        isSubmittingLogin = false;
        if (btn && !isAuto) {
          btn.disabled = false;
          if (btnText) btnText.innerText = "Sign In";
          if (btnIcon) btnIcon.classList.remove("hidden");
        }
        refreshIcons();
      }
    }

    function getAuthHeaders() {
      const pin = currentSessionPin || localStorage.getItem(AUTH_PIN_KEY) || "";
      return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + pin,
        "X-PIN": pin,
        "X-Auth-PIN": pin
      };
    }

    // -------------------------------------------------------------------------
    // DATA FETCHING & STATE
    // -------------------------------------------------------------------------
    async function loadDashboardData() {
      try {
        const promises = [
          fetchProperties(),
          fetchStaff(),
          fetchAttendance(),
          fetchFinances(),
          fetchRooms(),
          fetchRoomBookings()
        ];
        if (currentUserRole === "admin") {
          promises.push(fetchAdvances(), fetchBonuses(), fetchPayments());
        }
        await Promise.all(promises);
        renderPropertyTabs();
        renderActiveView();
        refreshIcons();
      } catch (err) {
        showToast("Error loading data: " + err.message);
      }
    }

    async function fetchProperties() {
      const res = await fetch("/api/properties", { headers: getAuthHeaders() });
      if (res.status === 401) return lockApp();
      properties = await res.json();
    }

    async function fetchStaff() {
      const res = await fetch("/api/staff", { headers: getAuthHeaders() });
      if (res.status === 401) return lockApp();
      staffList = await res.json();
    }

    function getMonthQueryString() {
      const m = String(currentMonth + 1).padStart(2, "0");
      return \`\${currentYear}-\${m}\`;
    }

    async function fetchAttendance() {
      const monthStr = getMonthQueryString();
      const res = await fetch(\`/api/attendance?month=\${monthStr}\`, { headers: getAuthHeaders() });
      if (res.status === 401) return lockApp();
      const data = await res.json();
      attendanceMap = {};
      const records = Array.isArray(data) ? data : (data.records || []);
      priorLeavesMap = (!Array.isArray(data) && data.prior_taken) ? data.prior_taken : {};
      records.forEach(item => {
        attendanceMap[\`\${item.staff_id}_\${item.date}\`] = item.status;
      });
    }

    // Carry-forward leave balance calculator (updates dynamically on every leave mark)
    function calculateStaffLeaveDetails(staff, year, month) {
      const prop = properties.find(p => p.id === staff.property_id) || { monthly_leave_allowance: 2 };
      const monthlyAllowance = (staff.custom_leave_allowance !== null && staff.custom_leave_allowance !== undefined)
        ? staff.custom_leave_allowance
        : prop.monthly_leave_allowance;

      // Months elapsed from joining date up to current viewed month
      let monthsElapsed = 1;
      if (staff.joining_date) {
        const parts = staff.joining_date.split('-');
        const jY = parseInt(parts[0], 10);
        const jM = parseInt(parts[1], 10);
        if (!isNaN(jY) && !isNaN(jM)) {
          monthsElapsed = (year - jY) * 12 + (month + 1 - jM);
          if (monthsElapsed < 1) monthsElapsed = 1;
        }
      }

      const openingBalance = parseFloat(staff.opening_leave_balance) || 0;
      const totalAccrued = openingBalance + (monthsElapsed * monthlyAllowance);

      // Count leaves taken in the current month directly from real-time attendanceMap
      const daysCount = getDaysInMonth(year, month);
      let currentMonthLeaves = 0;
      for (let day = 1; day <= daysCount; day++) {
        const dStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
        if (attendanceMap[\`\${staff.id}_\${dStr}\`] === "leave") {
          currentMonthLeaves++;
        }
      }

      const priorTaken = priorLeavesMap[staff.id] || 0;
      const totalTaken = priorTaken + currentMonthLeaves;
      const leaveBalance = totalAccrued - totalTaken; // Deducted dynamically!

      return {
        monthlyAllowance,
        monthsElapsed,
        openingBalance,
        totalAccrued,
        totalTaken,
        leaveBalance
      };
    }

    async function fetchAdvances() {
      const monthStr = getMonthQueryString();
      const res = await fetch(\`/api/advances?month=\${monthStr}\`, { headers: getAuthHeaders() });
      if (res.status === 401) return lockApp();
      advancesList = await res.json();
    }

    async function fetchBonuses() {
      const monthStr = getMonthQueryString();
      const res = await fetch(\`/api/bonuses?month=\${monthStr}\`, { headers: getAuthHeaders() });
      if (res.status === 401) return lockApp();
      bonusesList = await res.json();
    }

    async function fetchPayments() {
      const monthStr = getMonthQueryString();
      const res = await fetch(\`/api/payments?month=\${monthStr}\`, { headers: getAuthHeaders() });
      if (res.status === 401) return lockApp();
      paymentsList = await res.json();
    }

    // -------------------------------------------------------------------------
    // PROPERTY TABS & SELECTION
    // -------------------------------------------------------------------------
    function renderPropertyTabs() {
      const container = document.getElementById("propertyTabs");

      if (currentUserRole === "manager" && currentManagerInfo) {
        const assignedProp = properties.find(p => p.id === currentManagerInfo.property_id) || {
          id: currentManagerInfo.property_id,
          name: currentManagerInfo.property_name || "Assigned Property"
        };
        const count = staffList.filter(s => s.property_id === assignedProp.id).length;
        container.innerHTML = \`
          <div class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs flex items-center gap-2 shrink-0">
            <i data-lucide="building" class="w-4 h-4"></i>
            <span>\${escapeHtml(assignedProp.name)}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-800 text-white font-semibold">\${count} Staff</span>
          </div>
        \`;
        activePropertyId = assignedProp.id;
        updatePropertyAllowanceBanner();
        refreshIcons();
        return;
      }

      let html = \`
        <button onclick="selectProperty('all')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 \${activePropertyId === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
          <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
          <span>All Properties (\${staffList.length})</span>
        </button>
      \`;

      properties.forEach(prop => {
        const isSelected = activePropertyId === prop.id;
        const count = staffList.filter(s => s.property_id === prop.id).length;
        html += \`
          <button onclick="selectProperty('\${prop.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 \${isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <span>\${escapeHtml(prop.name)}</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] \${isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'}">\${count}</span>
          </button>
        \`;
      });

      container.innerHTML = html;
      updatePropertyAllowanceBanner();
      refreshIcons();
    }

    function selectProperty(id) {
      if (currentUserRole === "manager" && currentManagerInfo) {
        activePropertyId = currentManagerInfo.property_id;
      } else {
        activePropertyId = id;
      }
      renderPropertyTabs();
      renderActiveView();
    }

    function updatePropertyAllowanceBanner() {
      const banner = document.getElementById("propertyAllowanceBanner");
      const text = document.getElementById("currentAllowanceText");
      if (activePropertyId === 'all') {
        text.innerText = "Configured separately per property";
      } else {
        const prop = properties.find(p => p.id === activePropertyId);
        text.innerText = (prop ? prop.monthly_leave_allowance : 2) + " days / month";
      }
    }

    // -------------------------------------------------------------------------
    // VIEW SWITCHER
    // -------------------------------------------------------------------------
    function toggleMobileMonthlyMode(mode) {
      mobileMonthlyMode = mode;
      const cardsBtn = document.getElementById("btnMobileCardsMode");
      const tableBtn = document.getElementById("btnMobileTableMode");
      const cardsSection = document.getElementById("monthlyMobileCardsList");
      const tableContainer = document.getElementById("monthlyTableContainer");

      if (mode === "cards") {
        if (cardsBtn) cardsBtn.className = "px-2.5 py-1 rounded-lg bg-white text-indigo-700 shadow-2xs font-bold cursor-pointer";
        if (tableBtn) tableBtn.className = "px-2.5 py-1 rounded-lg text-slate-600 font-medium cursor-pointer";
        if (cardsSection) cardsSection.classList.remove("hidden");
        if (tableContainer) {
          tableContainer.classList.add("hidden");
          tableContainer.classList.remove("flex");
        }
      } else {
        if (tableBtn) tableBtn.className = "px-2.5 py-1 rounded-lg bg-white text-indigo-700 shadow-2xs font-bold cursor-pointer";
        if (cardsBtn) cardsBtn.className = "px-2.5 py-1 rounded-lg text-slate-600 font-medium cursor-pointer";
        if (cardsSection) cardsSection.classList.add("hidden");
        if (tableContainer) {
          tableContainer.classList.remove("hidden");
          tableContainer.classList.add("flex");
        }
      }
    }

    function toggleStaffCalendar(staffId) {
      if (openStaffCalendars.has(staffId)) {
        openStaffCalendars.delete(staffId);
      } else {
        openStaffCalendars.add(staffId);
      }
      const el = document.getElementById("staffCal_" + staffId);
      const icon = document.getElementById("calIcon_" + staffId);
      const isOpen = openStaffCalendars.has(staffId);
      if (el) el.classList.toggle("hidden", !isOpen);
      if (icon) icon.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
    }

    async function goToTodayDaily() {
      dailyDate = new Date();
      currentMonth = dailyDate.getMonth();
      currentYear = dailyDate.getFullYear();
      document.getElementById("currentMonthLabel").innerText = \`\${MONTH_NAMES[currentMonth]} \${currentYear}\`;
      await fetchAttendance();
      renderDailyView();
    }

    function switchView(view) {
      currentView = view;
      const tabs = ["Daily", "Monthly", "Finances", "Payroll", "Directory"];
      tabs.forEach(t => {
        const btn = document.getElementById("viewTab" + t);
        if (!btn) return;
        if (t.toLowerCase() === view) {
          btn.classList.add("bg-white", "text-indigo-600", "shadow-xs");
          btn.classList.remove("text-slate-600");
        } else {
          btn.classList.remove("bg-white", "text-indigo-600", "shadow-xs");
          btn.classList.add("text-slate-600");
        }
      });

      // Show/Hide sections
      document.getElementById("dailyViewSection").classList.toggle("hidden", view !== "daily");
      document.getElementById("monthlyViewSection").classList.toggle("hidden", view !== "monthly");
      document.getElementById("financesViewSection").classList.toggle("hidden", view !== "finances");
      document.getElementById("payrollViewSection").classList.toggle("hidden", view !== "payroll");
      document.getElementById("directoryViewSection").classList.toggle("hidden", view !== "directory");

      // Controls visibility
      document.getElementById("monthControlBar").classList.toggle("hidden", view === "directory" || view === "daily" || view === "finances");
      document.getElementById("legendBar").classList.toggle("hidden", view !== "monthly");
      document.getElementById("btnMarkAllPresent").classList.toggle("hidden", view === "payroll" || view === "finances");

      renderActiveView();
      refreshIcons();
    }

    function renderActiveView() {
      if (currentView === "monthly") renderMonthlyView();
      else if (currentView === "daily") renderDailyView();
      else if (currentView === "finances") renderFinancesView();
      else if (currentView === "payroll") renderPayrollView();
      else if (currentView === "directory") renderDirectoryView();
    }

    // -------------------------------------------------------------------------
    // MONTH & NAVIGATION
    // -------------------------------------------------------------------------
    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    function changeMonth(delta) {
      currentMonth += delta;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      onMonthUpdated();
    }

    function goToCurrentMonth() {
      currentYear = new Date().getFullYear();
      currentMonth = new Date().getMonth();
      onMonthUpdated();
    }

    async function onMonthUpdated() {
      document.getElementById("currentMonthLabel").innerText = \`\${MONTH_NAMES[currentMonth]} \${currentYear}\`;
      const promises = [fetchAttendance()];
      if (currentUserRole === "admin") {
        promises.push(fetchAdvances(), fetchBonuses(), fetchPayments());
      }
      await Promise.all(promises);
      renderActiveView();
    }

    function getDaysInMonth(year, month) {
      return new Date(year, month + 1, 0).getDate();
    }

    // -------------------------------------------------------------------------
    // VIEW 1: MONTHLY MATRIX TABLE
    // -------------------------------------------------------------------------
    function renderMonthlyView() {
      const thead = document.getElementById("monthlyTableHead");
      const tbody = document.getElementById("monthlyTableBody");
      const mobileList = document.getElementById("monthlyMobileCardsList");
      const emptyState = document.getElementById("tableEmptyState");

      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const todayStr = formatIsoDate(new Date());

      const filteredStaff = getVisibleStaffList();

      if (filteredStaff.length === 0) {
        if (thead) thead.innerHTML = "";
        if (tbody) tbody.innerHTML = "";
        if (mobileList) mobileList.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }
      if (emptyState) emptyState.classList.add("hidden");

      // 1. Desktop Matrix Table Header
      const DAY_LETTERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      let headHtml = "<tr>";
      headHtml += \`<th class="sticky-col-header py-3 px-3.5 min-w-[210px] bg-slate-50 border-r border-slate-200">Staff Member & Property</th>\`;

      for (let day = 1; day <= daysCount; day++) {
        const dObj = new Date(currentYear, currentMonth, day);
        const dayLetter = DAY_LETTERS[dObj.getDay()];
        const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
        const curDateStr = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
        const isToday = curDateStr === todayStr;

        headHtml += \`
          <th class="py-2 px-1 text-center min-w-[34px] border-r border-slate-200 \${isToday ? 'bg-indigo-50/80 text-indigo-700 font-bold ring-1 ring-inset ring-indigo-200' : isWeekend ? 'bg-slate-100/70 text-slate-500' : 'bg-slate-50'}">
            <div class="text-[9px] font-medium leading-tight">\${dayLetter}</div>
            <div class="text-xs leading-tight mt-0.5">\${day}</div>
          </th>
        \`;
      }

      headHtml += \`
        <th class="py-3 px-2 text-center min-w-[50px] bg-emerald-50/60 text-emerald-800 border-l border-slate-200">P</th>
        <th class="py-3 px-2 text-center min-w-[50px] bg-sky-50/60 text-sky-800 border-l border-slate-200">DO</th>
        <th class="py-3 px-2 text-center min-w-[50px] bg-rose-50/60 text-rose-800 border-l border-slate-200">A</th>
        <th class="py-3 px-2 text-center min-w-[55px] bg-amber-50/60 text-amber-800 border-l border-slate-200">Leave</th>
        <th class="py-3 px-3 text-center min-w-[105px] bg-indigo-50/70 text-indigo-900 border-l border-slate-200" title="Accrued leaves carried forward minus leaves taken">Total Leave Bal</th>
      </tr>\`;
      if (thead) thead.innerHTML = headHtml;

      let bodyHtml = "";
      let mobileCardsHtml = "";
      const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun

      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || 'General', monthly_leave_allowance: 2 };

        let countP = 0, countDO = 0, countA = 0, countL = 0;
        let rowCells = "";
        let calDaysHtml = "";

        // Blank padding for days before 1st of month in mobile mini calendar
        for (let i = 0; i < firstDayOfWeek; i++) {
          calDaysHtml += '<div class="h-9"></div>';
        }

        for (let day = 1; day <= daysCount; day++) {
          const dateStr = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
          const isToday = dateStr === todayStr;
          
          const record = attendanceMap[\`\${staff.id}_\${dateStr}\`];
          const status = record || "present"; // Present by default

          if (status === "present") countP++;
          else if (status === "day_off") countDO++;
          else if (status === "absent") countA++;
          else if (status === "leave") countL++;

          let badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
          let label = "P";
          if (status === "absent") {
            badgeClass = "bg-rose-100 text-rose-800 border-rose-300";
            label = "A";
          } else if (status === "day_off") {
            badgeClass = "bg-sky-100 text-sky-800 border-sky-300";
            label = "DO";
          } else if (status === "leave") {
            badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
            label = "L";
          }

          // Desktop Table Cell
          rowCells += \`
            <td class="p-1 text-center border-r border-slate-200/80 \${isToday ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-200' : ''}">
              <button onclick="cycleCellStatus('\${staff.id}', '\${dateStr}', event)" oncontextmenu="openStatusPicker('\${staff.id}', '\${dateStr}', event)" title="Click to cycle status, Right click to choose" class="w-7 h-7 rounded-lg text-[11px] font-bold border transition active:scale-90 flex items-center justify-center mx-auto cursor-pointer \${badgeClass}">
                \${label}
              </button>
            </td>
          \`;

          // Mobile Calendar Button
          calDaysHtml += \`
            <button onclick="cycleCellStatus('\${staff.id}', '\${dateStr}', event)" oncontextmenu="openStatusPicker('\${staff.id}', '\${dateStr}', event)" class="h-9 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition active:scale-90 cursor-pointer \${badgeClass} \${isToday ? 'ring-2 ring-indigo-500 font-extrabold' : ''}" title="Day \${day}: \${status.toUpperCase()} (Tap to change)">
              <span class="text-[10px] opacity-75 leading-none">\${day}</span>
              <span class="text-[9px] font-extrabold uppercase leading-none mt-0.5">\${label}</span>
            </button>
          \`;
        }

        const leaveDetails = calculateStaffLeaveDetails(staff, currentYear, currentMonth);
        const leaveRemaining = leaveDetails.leaveBalance;
        let balanceBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
        let balanceText = \`\${leaveRemaining > 0 ? '+' : ''}\${leaveRemaining.toFixed(1)} Bal\`;
        if (leaveRemaining < 0) {
          balanceBadge = "bg-rose-50 text-rose-700 border-rose-200";
          balanceText = \`\${leaveRemaining.toFixed(1)} Unpaid\`;
        } else if (leaveRemaining === 0) {
          balanceBadge = "bg-amber-50 text-amber-700 border-amber-200";
          balanceText = "0.0 Bal";
        }

        // Desktop Table Row (Summary columns without sticky-summary overlap bug)
        bodyHtml += \`
          <tr class="hover:bg-slate-50/60 transition group">
            <td class="sticky-col py-2.5 px-3.5 bg-white group-hover:bg-slate-50 border-r border-slate-200">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5" onclick="handleStaffNameClick('\${staff.id}')">
                    <span>\${escapeHtml(staff.name)}</span>
                    \${staff.is_manager ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 text-violet-800">Manager</span>' : ''}
                    \${currentUserRole === 'admin' ? '<i data-lucide="edit-2" class="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition"></i>' : ''}
                  </div>
                  <div class="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <span class="text-indigo-600 font-semibold">\${escapeHtml(prop.name)}</span>
                    \${staff.role ? \`<span>•</span><span>\${escapeHtml(staff.role)}</span>\` : ''}
                  </div>
                </div>
              </div>
            </td>
            \${rowCells}
            <td class="py-2 px-1 text-center font-bold text-emerald-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countP}</td>
            <td class="py-2 px-1 text-center font-bold text-sky-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countDO}</td>
            <td class="py-2 px-1 text-center font-bold text-rose-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countA}</td>
            <td class="py-2 px-1 text-center font-bold text-amber-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countL}</td>
            <td class="py-2 px-2 text-center bg-white group-hover:bg-slate-50 border-l border-slate-200">
              <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border \${balanceBadge}" title="Carried Leave Balance: \${leaveRemaining.toFixed(1)} days | Accrued: \${leaveDetails.totalAccrued} | Used: \${leaveDetails.totalTaken}">
                \${balanceText}
              </span>
            </td>
          </tr>
        \`;

        // Mobile Card with 7-column Calendar Accordion
        const isOpen = openStaffCalendars.has(staff.id);
        mobileCardsHtml += \`
          <div class="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-bold text-slate-900 text-sm flex items-center gap-1.5 cursor-pointer" onclick="handleStaffNameClick('\${staff.id}')">
                  <span>\${escapeHtml(staff.name)}</span>
                  \${staff.is_manager ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 text-violet-800">Manager</span>' : ''}
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <span class="text-indigo-600 font-semibold">\${escapeHtml(prop.name)}</span>
                  \${staff.role ? \`<span>•</span><span>\${escapeHtml(staff.role)}</span>\` : ''}
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold border \${balanceBadge}" title="Carried Leave Balance: Accrued \${leaveDetails.totalAccrued} - Taken \${leaveDetails.totalTaken}">
                \${balanceText}
              </span>
            </div>

            <!-- 4 Summary Pills -->
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
                <div class="font-bold text-emerald-800 text-base font-mono">\${countP}</div>
                <div class="text-[10px] text-emerald-600 font-semibold">Present</div>
              </div>
              <div class="p-2 rounded-xl bg-sky-50 border border-sky-200/80">
                <div class="font-bold text-sky-800 text-base font-mono">\${countDO}</div>
                <div class="text-[10px] text-sky-600 font-semibold">Day Off</div>
              </div>
              <div class="p-2 rounded-xl bg-amber-50 border border-amber-200/80">
                <div class="font-bold text-amber-800 text-base font-mono">\${countL}</div>
                <div class="text-[10px] text-amber-600 font-semibold">Leave</div>
              </div>
              <div class="p-2 rounded-xl bg-rose-50 border border-rose-200/80">
                <div class="font-bold text-rose-800 text-base font-mono">\${countA}</div>
                <div class="text-[10px] text-rose-600 font-semibold">Absent</div>
              </div>
            </div>

            <!-- Expandable Month Calendar Toggle -->
            <button onclick="toggleStaffCalendar('\${staff.id}')" class="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between transition cursor-pointer">
              <span class="flex items-center gap-1.5">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-600"></i>
                <span>View / Edit Month Dates (\${MONTH_NAMES[currentMonth]})</span>
              </span>
              <i data-lucide="chevron-down" id="calIcon_\${staff.id}" class="w-4 h-4 text-slate-400 transition-transform" style="\${isOpen ? 'transform: rotate(180deg)' : ''}"></i>
            </button>

            <!-- 7-Column Calendar Grid -->
            <div id="staffCal_\${staff.id}" class="\${isOpen ? '' : 'hidden'} pt-2 border-t border-slate-100 space-y-2">
              <div class="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 pb-1">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>
              <div class="grid grid-cols-7 gap-1">
                \${calDaysHtml}
              </div>
              <div class="text-[10px] text-slate-400 text-center pt-1">
                <span>Tap any day to cycle status (P → A → DO → L)</span>
              </div>
            </div>
          </div>
        \`;
      });

      if (tbody) tbody.innerHTML = bodyHtml;
      if (mobileList) mobileList.innerHTML = mobileCardsHtml;
      refreshIcons();
    }

    // -------------------------------------------------------------------------
    // ATTENDANCE INTERACTIONS
    // -------------------------------------------------------------------------
    const STATUS_CYCLE = ["present", "absent", "day_off", "leave"];

    async function cycleCellStatus(staffId, dateStr, event) {
      if (event) event.preventDefault();
      const current = attendanceMap[\`\${staffId}_\${dateStr}\`] || "present";
      const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
      const nextStatus = STATUS_CYCLE[nextIdx];
      await updateAttendance(staffId, dateStr, nextStatus);
    }

    function openStatusPicker(staffId, dateStr, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      currentPickerTarget = { staffId, date: dateStr };
      const popover = document.getElementById("statusPickerPopover");
      
      const x = event.clientX || (event.touches ? event.touches[0].clientX : 200);
      const y = event.clientY || (event.touches ? event.touches[0].clientY : 200);

      popover.style.left = Math.min(x, window.innerWidth - 190) + "px";
      popover.style.top = Math.min(y, window.innerHeight - 200) + "px";
      popover.classList.remove("hidden");
      popover.classList.add("flex");
    }

    window.addEventListener("click", (e) => {
      const popover = document.getElementById("statusPickerPopover");
      if (popover && !popover.contains(e.target)) {
        popover.classList.add("hidden");
        popover.classList.remove("flex");
      }
    });

    async function selectStatus(status) {
      if (!currentPickerTarget) return;
      const { staffId, date } = currentPickerTarget;
      document.getElementById("statusPickerPopover").classList.add("hidden");
      await updateAttendance(staffId, date, status);
    }

    async function updateAttendance(staffId, date, status) {
      attendanceMap[\`\${staffId}_\${date}\`] = status;
      if (currentView === "monthly") renderMonthlyView();
      else if (currentView === "daily") renderDailyView();
      else if (currentView === "payroll") renderPayrollView();

      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ staff_id: staffId, date, status })
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } catch (err) {
        showToast("Error updating status: " + err.message);
      }
    }

    async function markAllTodayPresent() {
      const todayStr = formatIsoDate(new Date());
      const filteredStaff = getVisibleStaffList();

      if (filteredStaff.length === 0) return;

      const staffIds = filteredStaff.map(s => s.id);
      staffIds.forEach(id => {
        attendanceMap[\`\${id}_\${todayStr}\`] = "present";
      });
      renderActiveView();

      try {
        const res = await fetch("/api/attendance/bulk", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            staff_ids: staffIds,
            date: todayStr,
            status: "present"
          })
        });
        if (res.status === 401) return lockApp();
        showToast("Marked all staff present for today!");
      } catch (err) {
        showToast("Error marking all present: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // VIEW 2: DAILY ROLL CALL
    // -------------------------------------------------------------------------
    async function changeDailyDate(delta) {
      const prevM = dailyDate.getMonth();
      const prevY = dailyDate.getFullYear();
      dailyDate.setDate(dailyDate.getDate() + delta);
      if (dailyDate.getMonth() !== prevM || dailyDate.getFullYear() !== prevY) {
        currentMonth = dailyDate.getMonth();
        currentYear = dailyDate.getFullYear();
        document.getElementById("currentMonthLabel").innerText = \`\${MONTH_NAMES[currentMonth]} \${currentYear}\`;
        await fetchAttendance();
      }
      renderDailyView();
    }

    function renderDailyView() {
      const container = document.getElementById("dailyStaffList");
      const title = document.getElementById("dailyDateTitle");
      const dateStr = formatIsoDate(dailyDate);

      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      title.innerText = dailyDate.toLocaleDateString('en-US', options);

      const filteredStaff = getVisibleStaffList();

      if (filteredStaff.length === 0) {
        container.innerHTML = \`<div class="col-span-full p-8 text-center text-slate-400">No staff found for this property.</div>\`;
        return;
      }

      let html = "";
      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '' };
        const status = attendanceMap[\`\${staff.id}_\${dateStr}\`] || "present";
        
        // Dynamic live leave balance calculation
        const leaveDetails = calculateStaffLeaveDetails(staff, dailyDate.getFullYear(), dailyDate.getMonth());
        const bal = leaveDetails.leaveBalance;
        let balClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (bal < 0) balClass = "bg-rose-50 text-rose-700 border-rose-200";
        else if (bal === 0) balClass = "bg-amber-50 text-amber-700 border-amber-200";

        html += \`
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5">
                  <h4 class="font-bold text-slate-900 text-sm">\${escapeHtml(staff.name)}</h4>
                  \${staff.is_manager ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 text-violet-800">Manager</span>' : ''}
                </div>
                <div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="text-indigo-600 font-semibold">\${escapeHtml(prop.name)}</span>
                  \${staff.role ? \`<span>•</span><span>\${escapeHtml(staff.role)}</span>\` : ''}
                  <span>•</span>
                  <span class="px-1.5 py-0.2 rounded-md font-bold text-[10px] border \${balClass}" title="Total Carried Leave Balance: Accrued \${leaveDetails.totalAccrued} - Taken \${leaveDetails.totalTaken}">
                    \${bal > 0 ? '+' : ''}\${bal.toFixed(1)} Bal
                  </span>
                </div>
              </div>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase \${status === 'present' ? 'bg-emerald-100 text-emerald-800' : status === 'absent' ? 'bg-rose-100 text-rose-800' : status === 'day_off' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}">
                \${status.replace('_', ' ')}
              </span>
            </div>

            <!-- Action Buttons (Mobile-friendly 2x2 grid on small screens, 4 across on desktop) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'present')" class="py-2.5 sm:py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1.5 \${status === 'present' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border-slate-200'}">
                <i data-lucide="check" class="w-4 h-4 sm:w-3.5 sm:h-3.5"></i>
                <span>Present</span>
              </button>
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'absent')" class="py-2.5 sm:py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1.5 \${status === 'absent' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-rose-50 border-slate-200'}">
                <i data-lucide="x" class="w-4 h-4 sm:w-3.5 sm:h-3.5"></i>
                <span>Absent</span>
              </button>
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'day_off')" class="py-2.5 sm:py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1.5 \${status === 'day_off' ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-sky-50 border-slate-200'}">
                <i data-lucide="coffee" class="w-4 h-4 sm:w-3.5 sm:h-3.5"></i>
                <span>Day Off</span>
              </button>
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'leave')" class="py-2.5 sm:py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1.5 \${status === 'leave' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-amber-50 border-slate-200'}">
                <i data-lucide="calendar" class="w-4 h-4 sm:w-3.5 sm:h-3.5"></i>
                <span>Leave</span>
              </button>
            </div>
          </div>
        \`;
      });

      container.innerHTML = html;
      refreshIcons();
    }

    // -------------------------------------------------------------------------
    // VIEW 3: SALARY & PAYROLL CALCULATION (WITH BONUS & COMMENTS)
    // -------------------------------------------------------------------------
    function renderPayrollView() {
      const tbody = document.getElementById("payrollTableBody");
      const daysCount = getDaysInMonth(currentYear, currentMonth);

      const filteredStaff = getVisibleStaffList();

      let totalBase = 0;
      let totalDeductions = 0;
      let totalAdvances = 0;
      let totalBonuses = 0;
      let totalNet = 0;
      let paidCount = 0;
      let paidAmount = 0;

      let html = "";
      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '' };
        const baseSalary = staff.salary || 0;
        const dailyRate = daysCount > 0 ? (baseSalary / daysCount) : 0;

        let countP = 0, countDO = 0, countA = 0, countL = 0;
        for (let day = 1; day <= daysCount; day++) {
          const dateStr = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
          const status = attendanceMap[\`\${staff.id}_\${dateStr}\`] || "present";
          if (status === "present") countP++;
          else if (status === "day_off") countDO++;
          else if (status === "absent") countA++;
          else if (status === "leave") countL++;
        }

        // Carry-forward leave balance check
        const leaveDetails = calculateStaffLeaveDetails(staff, currentYear, currentMonth);
        const balance = leaveDetails.leaveBalance;

        // Total absences + leaves taken this month
        const totalOffsThisMonth = countA + countL;

        // Amount is NOT deducted as long as staff has a positive/zero leave balance!
        // Only if balance < 0 (overdrawn), we deduct the excess unpaid days
        const unpaidDays = balance < 0 ? Math.min(totalOffsThisMonth, Math.abs(balance)) : 0;
        const absentDeduction = Math.round(unpaidDays * dailyRate);

        // Sum of advances for this staff for this month
        const staffAdvances = advancesList.filter(a => a.staff_id === staff.id);
        const advanceAmount = staffAdvances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

        // Sum of bonuses for this staff for this month (with comments)
        const staffBonuses = bonusesList.filter(b => b.staff_id === staff.id);
        const bonusAmount = staffBonuses.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
        const bonusComments = staffBonuses.map(b => b.comments || 'Bonus').filter(Boolean).join('; ');

        // Gross earned = Base Salary - Unpaid Deductions
        const grossEarned = Math.max(0, baseSalary - absentDeduction);
        // Net payout = Gross Earned + Bonus - Advance
        const netPayout = Math.max(0, grossEarned + bonusAmount - advanceAmount);

        totalBase += baseSalary;
        totalDeductions += absentDeduction;
        totalAdvances += advanceAmount;
        totalBonuses += bonusAmount;
        totalNet += netPayout;

        // Payment status for this staff
        const payment = paymentsList.find(p => p.staff_id === staff.id);
        const isPaid = payment && payment.status === "paid";
        if (isPaid) {
          paidCount++;
          paidAmount += (parseFloat(payment.amount) || netPayout);
        }

        // Bank / QR Button
        let bankQrBtn = "";
        if (staff.bank_qr_code) {
          bankQrBtn = \`
            <button onclick="openPaymentQrModal('\${staff.id}', \${netPayout})" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-2xs" title="Scan Payment QR">
              <i data-lucide="qr-code" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>QR Code</span>
            </button>
          \`;
        } else if (staff.bank_upi_id || staff.bank_account_number) {
          bankQrBtn = \`
            <button onclick="openPaymentQrModal('\${staff.id}', \${netPayout})" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition" title="View Bank & UPI details">
              <i data-lucide="credit-card" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>Bank/UPI</span>
            </button>
          \`;
        } else {
          bankQrBtn = \`
            <button onclick="openStaffModal('\${staff.id}')" class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-300 rounded-xl transition" title="Add Bank or QR Code">
              <i data-lucide="plus" class="w-3 h-3"></i>
              <span>Add Bank</span>
            </button>
          \`;
        }

        // Payment Status Button
        let paymentBtn = "";
        if (isPaid) {
          paymentBtn = \`
            <div class="flex flex-col items-center">
              <button onclick="openRecordPaymentModal('\${staff.id}', \${netPayout})" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition shadow-2xs" title="Click to view or edit payment details">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>Paid</span>
              </button>
              <span class="text-[10px] text-emerald-600 mt-0.5 font-medium">\${escapeHtml(payment.payment_mode || 'Paid')}\${payment.payment_date ? ' · ' + payment.payment_date.slice(5) : ''}</span>
            </div>
          \`;
        } else {
          paymentBtn = \`
            <button onclick="openRecordPaymentModal('\${staff.id}', \${netPayout})" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition shadow-2xs" title="Click to record as Paid">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-rose-500"></i>
              <span>Mark Paid</span>
            </button>
          \`;
        }

        html += \`
          <tr class="hover:bg-slate-50/70 transition">
            <td class="sticky-col py-3 px-3.5 bg-white border-r border-slate-200">
              <div class="font-bold text-slate-900">\${escapeHtml(staff.name)}</div>
              <div class="text-[11px] text-slate-400">
                <span class="text-indigo-600 font-semibold">\${escapeHtml(prop.name)}</span>
                \${staff.role ? \`<span>•</span><span>\${escapeHtml(staff.role)}</span>\` : ''}
              </div>
            </td>
            <td class="py-3 px-3 text-right font-mono font-bold text-slate-800">
              ₹\${baseSalary.toLocaleString('en-IN')}
            </td>
            <td class="py-3 px-2 text-center text-slate-500 font-mono text-[11px]">
              \${daysCount}
            </td>
            <td class="py-3 px-3 text-right font-mono text-slate-600">
              ₹\${Math.round(dailyRate).toLocaleString('en-IN')}
            </td>
            <td class="py-3 px-3 text-center">
              <div class="inline-flex items-center gap-1.5 text-[11px] font-mono">
                <span class="text-emerald-700 font-bold">\${countP}P</span>
                <span class="text-slate-300">/</span>
                <span class="text-sky-700 font-bold">\${countDO}DO</span>
                <span class="text-slate-300">/</span>
                <span class="text-amber-700 font-bold">\${countL}L</span>
                <span class="text-slate-300">/</span>
                <span class="text-rose-700 font-bold">\${countA}A</span>
              </div>
            </td>
            <td class="py-3 px-3 text-center">
              <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border \${balance >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}" title="Total Accrued: \${leaveDetails.totalAccrued} | Used: \${leaveDetails.totalTaken}">
                \${balance > 0 ? '+' : ''}\${balance.toFixed(1)} Bal
              </span>
            </td>
            <td class="py-3 px-3 text-right font-mono">
              \${absentDeduction > 0 ? \`
                <span class="text-rose-600 font-bold">-₹\${absentDeduction.toLocaleString('en-IN')}</span>
                <span class="text-[10px] text-rose-400 block font-normal">(\${unpaidDays}d unpaid)</span>
              \` : \`
                <span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200/80">₹0 (Covered)</span>
              \`}
            </td>
            <td class="py-3 px-3 text-right font-mono font-semibold text-slate-700">
              ₹\${grossEarned.toLocaleString('en-IN')}
            </td>
            <td class="py-3 px-3 text-right font-mono">
              <button onclick="openAdvanceModal('\${staff.id}')" title="Click to record or view advances" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-amber-50 transition border border-transparent hover:border-amber-200 cursor-pointer">
                <span class="\${advanceAmount > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}">
                  ₹\${advanceAmount.toLocaleString('en-IN')}
                </span>
                <span class="w-5 h-5 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-600 flex items-center justify-center">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                </span>
              </button>
            </td>
            <td class="py-3 px-3 text-right font-mono bg-emerald-50/20 border-x border-emerald-100/60">
              <button onclick="openBonusModal('\${staff.id}')" title="Click to add or view bonuses with comments" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200 cursor-pointer">
                <div class="text-right">
                  <span class="\${bonusAmount > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}">
                    \${bonusAmount > 0 ? '+' : ''}₹\${bonusAmount.toLocaleString('en-IN')}
                  </span>
                  \${bonusAmount > 0 && bonusComments ? \`<span class="block text-[9px] text-emerald-600 font-semibold truncate max-w-[110px]" title="\${escapeHtml(bonusComments)}">\${escapeHtml(bonusComments)}</span>\` : ''}
                </div>
                <span class="w-5 h-5 rounded-md \${bonusAmount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} hover:bg-emerald-200 flex items-center justify-center">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                </span>
              </button>
            </td>
            <td class="py-3 px-3.5 text-right font-mono font-bold text-sm text-emerald-700 bg-emerald-50/40">
              ₹\${netPayout.toLocaleString('en-IN')}
            </td>
            <td class="py-3 px-3 text-center">
              \${bankQrBtn}
            </td>
            <td class="py-3 px-3 text-center">
              \${paymentBtn}
            </td>
            <td class="py-3 px-2 text-center">
              <button onclick="openSalarySlipModal('\${staff.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition" title="View Salary Slip">
                <i data-lucide="receipt" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>
        \`;
      });

      tbody.innerHTML = html;

      // Update summary stat cards
      const unpaidCount = filteredStaff.length - paidCount;
      const unpaidAmount = Math.max(0, totalNet - paidAmount);

      document.getElementById("statBaseSalary").innerText = "₹" + totalBase.toLocaleString('en-IN');
      document.getElementById("statDeductions").innerText = "₹" + (totalDeductions + totalAdvances).toLocaleString('en-IN');
      const statBonusesEl = document.getElementById("statBonuses");
      if (statBonusesEl) statBonusesEl.innerText = "₹" + totalBonuses.toLocaleString('en-IN');
      document.getElementById("statNetPayout").innerText = "₹" + totalNet.toLocaleString('en-IN');
      document.getElementById("statPaidAmount").innerText = "₹" + paidAmount.toLocaleString('en-IN');
      document.getElementById("statPaidCount").innerText = paidCount + " staff paid";
      document.getElementById("statPendingAmount").innerText = "₹" + unpaidAmount.toLocaleString('en-IN');
      document.getElementById("statPendingCount").innerText = unpaidCount + " staff unpaid";
      refreshIcons();
    }

    // -------------------------------------------------------------------------
    // VIEW 4: STAFF DIRECTORY & DOCUMENTS
    // -------------------------------------------------------------------------
    function renderDirectoryView() {
      const grid = document.getElementById("directoryStaffGrid");
      const filteredStaff = getVisibleStaffList();

      if (filteredStaff.length === 0) {
        grid.innerHTML = \`<div class="col-span-full p-12 text-center text-slate-400">No staff members found for this property.</div>\`;
        return;
      }

      let html = "";
      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '' };
        const cleanPhone = (staff.phone || "").replace(/[^0-9]/g, '');
        const docCount = staff.document_count || 0;

        html += \`
          <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition">
            
            <div>
              <!-- Header -->
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-slate-900 text-base">\${escapeHtml(staff.name)}</h4>
                    \${staff.is_manager ? \`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200"><i data-lucide="shield-check" class="w-3 h-3 text-violet-600"></i> Manager</span>\` : ''}
                  </div>
                  <div class="text-xs text-indigo-600 font-semibold mt-0.5">\${escapeHtml(prop.name)}</div>
                  \${staff.role ? \`<div class="text-[11px] text-slate-400 font-medium">\${escapeHtml(staff.role)}</div>\` : ''}
                </div>
                <button onclick="openStaffModal('\${staff.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Edit Profile">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
              </div>

              <!-- Contact & Address Details -->
              <div class="mt-4 space-y-2 text-xs text-slate-600">
                <div class="flex items-center gap-2">
                  <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                  \${staff.phone ? \`
                    <div class="flex items-center gap-2">
                      <a href="tel:\${cleanPhone}" class="font-medium hover:text-indigo-600 hover:underline">\${escapeHtml(staff.phone)}</a>
                      <a href="https://wa.me/\${cleanPhone}" target="_blank" class="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                        <i data-lucide="message-circle" class="w-3 h-3"></i> WhatsApp
                      </a>
                    </div>
                  \` : '<span class="text-slate-400 italic">No phone number</span>'}
                </div>

                <div class="flex items-start gap-2">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"></i>
                  <span class="\${staff.address ? 'text-slate-700' : 'text-slate-400 italic'}">\${escapeHtml(staff.address || 'No address on file')}</span>
                </div>

                <div class="flex items-center gap-2">
                  <i data-lucide="banknote" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                  <span>Salary: <strong class="text-slate-900 font-mono">₹\${(staff.salary || 0).toLocaleString('en-IN')}</strong> / month</span>
                </div>
              </div>

              <!-- Bank & Payment QR Badge -->
              \${(staff.bank_account_number || staff.bank_upi_id || staff.bank_qr_code) ? \`
                <div class="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  \${staff.bank_account_number ? \`
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-slate-400 font-medium">Bank A/C:</span>
                      <span class="font-mono text-slate-700 font-semibold">\${escapeHtml(staff.bank_name || 'Bank')} ••••\${escapeHtml(staff.bank_account_number.slice(-4))}</span>
                    </div>
                  \` : ''}
                  \${staff.bank_upi_id ? \`
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-slate-400 font-medium">UPI ID:</span>
                      <span class="font-mono text-slate-700 font-semibold">\${escapeHtml(staff.bank_upi_id)}</span>
                    </div>
                  \` : ''}
                  <div class="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                    <span class="\${staff.bank_qr_code ? 'text-emerald-700 font-semibold flex items-center gap-1' : 'text-slate-400 italic'}">
                      \${staff.bank_qr_code ? '<i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> QR Uploaded' : 'No QR uploaded'}
                    </span>
                    <button onclick="openPaymentQrModal('\${staff.id}', \${staff.salary || 0})" class="text-indigo-600 hover:text-indigo-700 font-bold hover:underline">
                      View Payment Card
                    </button>
                  </div>
                </div>
              \` : \`
                <button onclick="openStaffModal('\${staff.id}')" class="mt-3 w-full py-1.5 px-2 rounded-xl border border-dashed border-slate-300 text-[11px] text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition flex items-center justify-center gap-1 font-medium">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                  <span>Add Bank Details or QR</span>
                </button>
              \`}
            </div>

            <!-- Documents Button -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div class="text-xs text-slate-500 flex items-center gap-1.5">
                <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>\${docCount} \${docCount === 1 ? 'Document' : 'Documents'}</span>
              </div>
              <button onclick="openDocumentsModal('\${staff.id}')" class="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1.5">
                <i data-lucide="folder-open" class="w-3.5 h-3.5"></i>
                <span>Manage Docs</span>
              </button>
            </div>

          </div>
        \`;
      });

      grid.innerHTML = html;
      refreshIcons();
    }

    // -------------------------------------------------------------------------
    // DOCUMENTS MANAGER
    // -------------------------------------------------------------------------
    async function openDocumentsModal(staffId) {
      currentDocStaffId = staffId;
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;

      document.getElementById("docModalStaffName").innerText = \`\${staff.name} · Documents\`;
      document.getElementById("documentsModal").classList.remove("hidden");
      document.getElementById("documentsModal").classList.add("flex");
      await loadStaffDocuments(staffId);
      refreshIcons();
    }

    function closeDocumentsModal() {
      document.getElementById("documentsModal").classList.add("hidden");
      document.getElementById("documentsModal").classList.remove("flex");
      currentDocStaffId = null;
    }

    async function loadStaffDocuments(staffId) {
      const list = document.getElementById("documentsList");
      list.innerHTML = '<div class="text-xs text-slate-400 p-2">Loading documents...</div>';

      try {
        const res = await fetch(\`/api/staff/\${staffId}/documents\`, { headers: getAuthHeaders() });
        if (res.status === 401) return lockApp();
        const docs = await res.json();

        if (docs.length === 0) {
          list.innerHTML = '<div class="text-xs text-slate-400 p-3 text-center bg-slate-50 rounded-xl">No documents uploaded yet.</div>';
          return;
        }

        let html = "";
        docs.forEach(doc => {
          const sizeKb = Math.round(doc.file_size / 1024);
          html += \`
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex items-center gap-2.5 overflow-hidden">
                <i data-lucide="file" class="w-4 h-4 text-indigo-500 shrink-0"></i>
                <div class="overflow-hidden">
                  <div class="text-xs font-semibold text-slate-800 truncate" title="\${escapeHtml(doc.file_name)}">\${escapeHtml(doc.file_name)}</div>
                  <div class="text-[10px] text-slate-400">\${sizeKb} KB · \${doc.created_at ? doc.created_at.slice(0, 10) : ''}</div>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button onclick="downloadDocument('\${doc.id}', '\${escapeHtml(doc.file_name)}')" class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition" title="Download / View">
                  <i data-lucide="download" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteDocument('\${doc.id}')" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition" title="Delete">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          \`;
        });
        list.innerHTML = html;
        refreshIcons();
      } catch (err) {
        list.innerHTML = \`<div class="text-xs text-rose-500 p-2">Error loading docs: \${err.message}</div>\`;
      }
    }

    async function handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file || !currentDocStaffId) return;

      const progress = document.getElementById("uploadProgress");
      progress.classList.remove("hidden");

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        try {
          const res = await fetch(\`/api/staff/\${currentDocStaffId}/documents\`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              file_name: file.name,
              file_type: file.type || "application/octet-stream",
              file_size: file.size,
              file_data: base64Data
            })
          });
          if (res.status === 401) return lockApp();
          const data = await res.json();
          if (!data.success) throw new Error(data.error);

          showToast("Document uploaded successfully");
          document.getElementById("docFileInput").value = "";
          await loadStaffDocuments(currentDocStaffId);
          await fetchStaff(); // update doc count
          if (currentView === "directory") renderDirectoryView();
        } catch (err) {
          showToast("Error uploading file: " + err.message);
        } finally {
          progress.classList.add("hidden");
        }
      };
      reader.readAsDataURL(file);
    }

    async function downloadDocument(docId, fileName) {
      try {
        const res = await fetch(\`/api/documents/\${docId}\`, { headers: getAuthHeaders() });
        if (res.status === 401) return lockApp();
        const doc = await res.json();
        if (!doc.file_data) throw new Error("No file data");

        const a = document.createElement("a");
        a.href = doc.file_data;
        a.download = fileName;
        a.target = "_blank";
        a.click();
      } catch (err) {
        showToast("Error downloading file: " + err.message);
      }
    }

    async function deleteDocument(docId) {
      if (!confirm("Are you sure you want to delete this document?")) return;
      try {
        const res = await fetch(\`/api/documents/\${docId}\`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        showToast("Document deleted");
        await loadStaffDocuments(currentDocStaffId);
        await fetchStaff();
        if (currentView === "directory") renderDirectoryView();
      } catch (err) {
        showToast("Error deleting document: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // SALARY ADVANCE MODAL
    // -------------------------------------------------------------------------
    function openAdvanceModal(staffId) {
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;

      document.getElementById("advanceStaffId").value = staff.id;
      document.getElementById("advanceModalStaffName").innerText = \`Advance for \${staff.name}\`;
      document.getElementById("advanceAmount").value = "";
      document.getElementById("advanceDate").value = formatIsoDate(new Date());
      document.getElementById("advanceNotes").value = "";

      renderStaffAdvancesList(staffId);

      document.getElementById("advanceModal").classList.remove("hidden");
      document.getElementById("advanceModal").classList.add("flex");
      refreshIcons();
    }

    function closeAdvanceModal() {
      document.getElementById("advanceModal").classList.add("hidden");
      document.getElementById("advanceModal").classList.remove("flex");
    }

    function renderStaffAdvancesList(staffId) {
      const list = document.getElementById("advanceList");
      const staffAdvances = advancesList.filter(a => a.staff_id === staffId);

      if (staffAdvances.length === 0) {
        list.innerHTML = '<div class="text-xs text-slate-400 p-2 text-center bg-slate-50 rounded-xl">No advances recorded this month.</div>';
        return;
      }

      let html = "";
      staffAdvances.forEach(adv => {
        html += \`
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div class="font-bold text-slate-800">₹\${(parseFloat(adv.amount) || 0).toLocaleString('en-IN')}</div>
              <div class="text-[11px] text-slate-400">\${adv.date} \${adv.notes ? '• ' + escapeHtml(adv.notes) : ''}</div>
            </div>
            <button onclick="handleDeleteAdvance('\${adv.id}', '\${staffId}')" class="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition" title="Delete Advance">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        \`;
      });
      list.innerHTML = html;
      refreshIcons();
    }

    function setAdvancePreset(val) {
      document.getElementById("advanceAmount").value = val;
    }

    async function handleSaveAdvance(e) {
      e.preventDefault();
      const staff_id = document.getElementById("advanceStaffId").value;
      const rawVal = document.getElementById("advanceAmount").value || "";
      const cleanVal = rawVal.replace(/[^0-9.]/g, '');
      const amount = parseFloat(cleanVal);
      
      if (!amount || isNaN(amount) || amount <= 0) {
        showToast("Please enter an advance amount greater than 0");
        return;
      }

      const date = document.getElementById("advanceDate").value || formatIsoDate(new Date());
      const notes = document.getElementById("advanceNotes").value.trim() || null;
      // Derive month directly from date (e.g. "2026-10")
      const month = date.slice(0, 7);

      try {
        const res = await fetch("/api/advances", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ staff_id, month, amount, date, notes })
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        showToast("Advance of ₹" + amount.toLocaleString('en-IN') + " recorded!");
        document.getElementById("advanceAmount").value = "";
        document.getElementById("advanceNotes").value = "";
        await fetchAdvances();
        renderStaffAdvancesList(staff_id);
        if (currentView === "payroll") renderPayrollView();
      } catch (err) {
        showToast("Error saving advance: " + err.message);
      }
    }

    async function handleDeleteAdvance(advanceId, staffId) {
      if (!confirm("Are you sure you want to remove this advance entry?")) return;
      try {
        const res = await fetch(\`/api/advances/\${advanceId}\`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        showToast("Advance entry removed");
        await fetchAdvances();
        renderStaffAdvancesList(staffId);
        if (currentView === "payroll") renderPayrollView();
      } catch (err) {
        showToast("Error deleting advance: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // SALARY BONUS & INCENTIVES MODAL (WITH COMMENTS)
    // -------------------------------------------------------------------------
    function openBonusModal(staffId) {
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;

      document.getElementById("bonusStaffId").value = staff.id;
      document.getElementById("bonusModalStaffName").innerText = \`Bonus for \${staff.name}\`;
      document.getElementById("bonusAmount").value = "";
      document.getElementById("bonusDate").value = formatIsoDate(new Date());
      document.getElementById("bonusComments").value = "";

      renderStaffBonusesList(staffId);

      document.getElementById("bonusModal").classList.remove("hidden");
      document.getElementById("bonusModal").classList.add("flex");
      refreshIcons();
    }

    function closeBonusModal() {
      document.getElementById("bonusModal").classList.add("hidden");
      document.getElementById("bonusModal").classList.remove("flex");
    }

    function setBonusPreset(val) {
      document.getElementById("bonusAmount").value = val;
    }

    function renderStaffBonusesList(staffId) {
      const list = document.getElementById("bonusList");
      const badge = document.getElementById("bonusTotalBadge");
      const staffBonuses = bonusesList.filter(b => b.staff_id === staffId);

      const totalBonus = staffBonuses.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
      if (badge) {
        badge.innerText = totalBonus > 0 ? \`Total: +₹\${totalBonus.toLocaleString('en-IN')}\` : '';
      }

      if (staffBonuses.length === 0) {
        list.innerHTML = '<div class="text-xs text-slate-400 p-3 text-center bg-slate-50 rounded-xl">No bonus recorded for this month.</div>';
        return;
      }

      let html = "";
      staffBonuses.forEach(b => {
        html += \`
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs">
            <div>
              <div class="font-bold text-emerald-800 font-mono">+₹\${(parseFloat(b.amount) || 0).toLocaleString('en-IN')}</div>
              <div class="text-[11px] text-slate-600 mt-0.5">
                <span class="font-semibold text-emerald-700">\${escapeHtml(b.comments || 'Bonus')}</span>
                <span class="text-slate-400 ml-1">· \${b.date}</span>
              </div>
            </div>
            <button onclick="handleDeleteBonus('\${b.id}', '\${staffId}')" class="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-md transition cursor-pointer" title="Delete Bonus">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        \`;
      });
      list.innerHTML = html;
      refreshIcons();
    }

    async function handleSaveBonus(e) {
      e.preventDefault();
      const staff_id = document.getElementById("bonusStaffId").value;
      const rawVal = document.getElementById("bonusAmount").value || "";
      const cleanVal = rawVal.replace(/[^0-9.]/g, '');
      const amount = parseFloat(cleanVal);
      
      if (!amount || isNaN(amount) || amount <= 0) {
        showToast("Please enter a bonus amount greater than 0");
        return;
      }

      const date = document.getElementById("bonusDate").value || formatIsoDate(new Date());
      const comments = document.getElementById("bonusComments").value.trim() || "Performance / Festival Bonus";
      const month = date.slice(0, 7);

      try {
        const res = await fetch("/api/bonuses", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ staff_id, month, amount, date, comments })
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        showToast("Bonus of ₹" + amount.toLocaleString('en-IN') + " added with comments!");
        document.getElementById("bonusAmount").value = "";
        document.getElementById("bonusComments").value = "";
        await fetchBonuses();
        renderStaffBonusesList(staff_id);
        if (currentView === "payroll") renderPayrollView();
      } catch (err) {
        showToast("Error saving bonus: " + err.message);
      }
    }

    async function handleDeleteBonus(bonusId, staffId) {
      if (!confirm("Are you sure you want to remove this bonus entry?")) return;
      try {
        const res = await fetch(\`/api/bonuses/\${bonusId}\`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        showToast("Bonus entry removed");
        await fetchBonuses();
        renderStaffBonusesList(staffId);
        if (currentView === "payroll") renderPayrollView();
      } catch (err) {
        showToast("Error deleting bonus: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // SALARY SLIP MODAL (VOUCHER)
    // -------------------------------------------------------------------------
    function openSalarySlipModal(staffId) {
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;

      const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '' };
      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const baseSalary = staff.salary || 0;
      const dailyRate = daysCount > 0 ? (baseSalary / daysCount) : 0;

      let countP = 0, countDO = 0, countA = 0, countL = 0;
      for (let day = 1; day <= daysCount; day++) {
        const dateStr = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
        const status = attendanceMap[\`\${staff.id}_\${dateStr}\`] || "present";
        if (status === "present") countP++;
        else if (status === "day_off") countDO++;
        else if (status === "absent") countA++;
        else if (status === "leave") countL++;
      }

      const leaveDetails = calculateStaffLeaveDetails(staff, currentYear, currentMonth);
      const balance = leaveDetails.leaveBalance;
      const totalOffs = countA + countL;
      const unpaidDays = balance < 0 ? Math.min(totalOffs, Math.abs(balance)) : 0;
      const absentDeduction = Math.round(unpaidDays * dailyRate);

      const staffAdvances = advancesList.filter(a => a.staff_id === staff.id);
      const advanceAmount = staffAdvances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
      const staffBonuses = bonusesList.filter(b => b.staff_id === staff.id);
      const bonusAmount = staffBonuses.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
      const bonusComments = staffBonuses.map(b => b.comments || 'Bonus').filter(Boolean).join('; ');
      const grossEarned = Math.max(0, baseSalary - absentDeduction);
      const netPayout = Math.max(0, grossEarned + bonusAmount - advanceAmount);

      const payment = paymentsList.find(p => p.staff_id === staff.id);
      const isPaid = payment && payment.status === "paid";

      const content = document.getElementById("salarySlipContent");
      content.innerHTML = \`
        <div class="border-2 border-slate-800 p-6 rounded-2xl bg-white space-y-5">
          
          <!-- Slip Header -->
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-xl font-extrabold uppercase tracking-wide text-slate-900">\${escapeHtml(prop.name)}</h2>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Staff Salary Voucher</div>
            <div class="text-sm font-bold text-indigo-700 mt-1">\${MONTH_NAMES[currentMonth]} \${currentYear}</div>
          </div>

          <!-- Staff Details Grid -->
          <div class="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-4">
            <div>
              <span class="text-slate-500">Employee Name:</span>
              <div class="font-bold text-slate-900 text-sm">\${escapeHtml(staff.name)}</div>
            </div>
            <div>
              <span class="text-slate-500">Designation / Role:</span>
              <div class="font-bold text-slate-900">\${escapeHtml(staff.role || 'Staff')}</div>
            </div>
            <div>
              <span class="text-slate-500">Contact Number:</span>
              <div class="font-medium text-slate-800">\${escapeHtml(staff.phone || 'N/A')}</div>
            </div>
            <div>
              <span class="text-slate-500">Total Month Days:</span>
              <div class="font-medium text-slate-800">\${daysCount} Days</div>
            </div>
          </div>

          <!-- Attendance Breakdown -->
          <div class="text-xs">
            <div class="font-bold text-slate-700 uppercase tracking-wider mb-2">Attendance Summary</div>
            <div class="grid grid-cols-4 gap-2 text-center">
              <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <div class="font-bold text-emerald-800 text-sm">\${countP}</div>
                <div class="text-[10px] text-emerald-600 font-semibold">Present</div>
              </div>
              <div class="p-2 rounded-xl bg-sky-50 border border-sky-200">
                <div class="font-bold text-sky-800 text-sm">\${countDO}</div>
                <div class="text-[10px] text-sky-600 font-semibold">Day Off</div>
              </div>
              <div class="p-2 rounded-xl bg-amber-50 border border-amber-200">
                <div class="font-bold text-amber-800 text-sm">\${countL}</div>
                <div class="text-[10px] text-amber-600 font-semibold">Leaves</div>
              </div>
              <div class="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <div class="font-bold text-rose-800 text-sm">\${countA}</div>
                <div class="text-[10px] text-rose-600 font-semibold">Absent</div>
              </div>
            </div>
          </div>

          <!-- Earnings & Deductions Table -->
          <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table class="w-full">
              <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th class="p-2.5 text-left">Description</th>
                  <th class="p-2.5 text-right">Calculation</th>
                  <th class="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="p-2.5 font-medium">Monthly Base Salary</td>
                  <td class="p-2.5 text-right text-slate-500">Full Month Rate</td>
                  <td class="p-2.5 text-right font-mono font-bold">₹\${baseSalary.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td class="p-2.5 font-medium">Daily Salary Rate</td>
                  <td class="p-2.5 text-right text-slate-500">₹\${baseSalary.toLocaleString('en-IN')} ÷ \${daysCount} days</td>
                  <td class="p-2.5 text-right font-mono text-slate-600">₹\${Math.round(dailyRate).toLocaleString('en-IN')}/day</td>
                </tr>
                <tr>
                  <td class="p-2.5 font-medium">Carried Leave Balance</td>
                  <td class="p-2.5 text-right text-slate-500">Total Accrued: \${leaveDetails.totalAccrued} | Used: \${leaveDetails.totalTaken}</td>
                  <td class="p-2.5 text-right font-mono font-bold \${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}">\${balance > 0 ? '+' : ''}\${balance.toFixed(1)} Days</td>
                </tr>
                <tr>
                  <td class="p-2.5 font-medium text-emerald-800">Gross Salary Earned</td>
                  <td class="p-2.5 text-right text-slate-500">\${absentDeduction === 0 ? 'Protected by leave balance (No deduction)' : \`Base Salary − \${unpaidDays} Unpaid Days\`}</td>
                  <td class="p-2.5 text-right font-mono font-bold text-emerald-700">₹\${grossEarned.toLocaleString('en-IN')}</td>
                </tr>
                \${absentDeduction > 0 ? \`
                  <tr class="text-rose-700">
                    <td class="p-2.5 font-medium">Unpaid Leave Deduction</td>
                    <td class="p-2.5 text-right text-slate-500">\${unpaidDays} Days exceeding leave balance × ₹\${Math.round(dailyRate)}</td>
                    <td class="p-2.5 text-right font-mono font-bold">-₹\${absentDeduction.toLocaleString('en-IN')}</td>
                  </tr>
                \` : ''}
                \${bonusAmount > 0 ? \`
                  <tr class="text-emerald-800 bg-emerald-50/60 font-medium">
                    <td class="p-2.5 font-bold flex items-center gap-1.5 text-emerald-800">
                      <i data-lucide="gift" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Bonus / Incentive Added</span>
                    </td>
                    <td class="p-2.5 text-right text-emerald-700">\${escapeHtml(bonusComments || 'Special Bonus')}</td>
                    <td class="p-2.5 text-right font-mono font-bold text-emerald-700">+₹\${bonusAmount.toLocaleString('en-IN')}</td>
                  </tr>
                \` : ''}
                \${advanceAmount > 0 ? \`
                  <tr class="text-amber-700">
                    <td class="p-2.5 font-medium">Advance Salary Deducted</td>
                    <td class="p-2.5 text-right text-slate-500">Advance Given in Month</td>
                    <td class="p-2.5 text-right font-mono font-bold">-₹\${advanceAmount.toLocaleString('en-IN')}</td>
                  </tr>
                \` : ''}
                <tr class="bg-emerald-50 text-emerald-950 font-bold text-sm">
                  <td class="p-3" colspan="2">Net Payable Salary</td>
                  <td class="p-3 text-right font-mono text-emerald-700 text-base">₹\${netPayout.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Payment Status & Mode Banner -->
          \${isPaid ? \`
            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs">
              <div>
                <div class="font-bold flex items-center gap-1.5 text-emerald-800">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                  <span>STATUS: PAID IN FULL</span>
                </div>
                <div class="text-[11px] text-emerald-700 mt-0.5">
                  Paid via \${escapeHtml(payment.payment_mode || 'Direct Transfer')}\${payment.payment_date ? ' on ' + payment.payment_date : ''}\${payment.reference_no ? ' · Ref: ' + escapeHtml(payment.reference_no) : ''}
                </div>
              </div>
              <span class="font-mono font-bold text-sm text-emerald-800">₹\${(payment.amount || netPayout).toLocaleString('en-IN')}</span>
            </div>
          \` : \`
            <div class="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between text-xs">
              <div>
                <div class="font-bold flex items-center gap-1.5 text-amber-800">
                  <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
                  <span>STATUS: PAYMENT PENDING</span>
                </div>
                <div class="text-[11px] text-amber-700 mt-0.5">
                  Payout of ₹\${netPayout.toLocaleString('en-IN')} has not been marked as paid yet.
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200/60 text-amber-900 uppercase">Pending</span>
            </div>
          \`}

          <!-- Employee Bank & Payment Details -->
          \${(staff.bank_account_number || staff.bank_upi_id) ? \`
            <div class="border border-slate-200 rounded-xl p-3 bg-slate-50/70 text-xs space-y-1">
              <div class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Payment Account Details</div>
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                \${staff.bank_account_number ? \`
                  <div><span class="text-slate-500">Bank:</span> <strong class="text-slate-800">\${escapeHtml(staff.bank_name || '-')}</strong></div>
                  <div><span class="text-slate-500">A/C No:</span> <strong class="font-mono text-slate-800">\${escapeHtml(staff.bank_account_number)}</strong></div>
                  <div><span class="text-slate-500">IFSC:</span> <strong class="font-mono text-slate-800 uppercase">\${escapeHtml(staff.bank_ifsc || '-')}</strong></div>
                \` : ''}
                \${staff.bank_upi_id ? \`
                  <div><span class="text-slate-500">UPI ID:</span> <strong class="font-mono text-slate-800">\${escapeHtml(staff.bank_upi_id)}</strong></div>
                \` : ''}
              </div>
            </div>
          \` : ''}

          <!-- Signatures -->
          <div class="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-500">
            <div>
              <div class="border-t border-slate-300 pt-2 font-medium">Staff Signature</div>
            </div>
            <div>
              <div class="border-t border-slate-300 pt-2 font-medium">Authorized Signature</div>
            </div>
          </div>

        </div>
      \`;

      document.getElementById("salarySlipModal").classList.remove("hidden");
      document.getElementById("salarySlipModal").classList.add("flex");
      refreshIcons();
    }

    function closeSalarySlipModal() {
      document.getElementById("salarySlipModal").classList.add("hidden");
      document.getElementById("salarySlipModal").classList.remove("flex");
    }

    // -------------------------------------------------------------------------
    // EXPORT
    // -------------------------------------------------------------------------
    function exportCurrentView() {
      if (currentView === "payroll") {
        exportPayrollCSV();
      } else if (currentView === "finances") {
        exportFinancesCSV();
      } else {
        exportAttendanceCSV();
      }
    }

    function exportPayrollCSV() {
      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const filteredStaff = getVisibleStaffList();

      let csv = "Staff Name,Property,Role,Phone,Base Salary,Total Days,Daily Rate,Present,Day Off,Leaves,Absent,Total Leave Balance,Unpaid Deduction,Gross Earned,Advance Deducted,Bonus Amount,Bonus Comments,Net Payout,Bank Name,Account Number,IFSC,UPI ID,Payment Status,Paid Amount,Payment Date,Payment Mode,Reference No\\n";

      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '' };
        const base = staff.salary || 0;
        const dailyRate = Math.round(daysCount > 0 ? (base / daysCount) : 0);

        let countP = 0, countDO = 0, countA = 0, countL = 0;
        for (let day = 1; day <= daysCount; day++) {
          const dateStr = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
          const status = attendanceMap[\`\${staff.id}_\${dateStr}\`] || "present";
          if (status === "present") countP++;
          else if (status === "day_off") countDO++;
          else if (status === "absent") countA++;
          else if (status === "leave") countL++;
        }

        const leaveDetails = calculateStaffLeaveDetails(staff, currentYear, currentMonth);
        const balance = leaveDetails.leaveBalance;
        const totalOffs = countA + countL;
        const unpaidDays = balance < 0 ? Math.min(totalOffs, Math.abs(balance)) : 0;
        const absentDeduction = Math.round(unpaidDays * dailyRate);

        const gross = Math.max(0, base - absentDeduction);
        const staffAdvances = advancesList.filter(a => a.staff_id === staff.id);
        const adv = staffAdvances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
        const staffBonuses = bonusesList.filter(b => b.staff_id === staff.id);
        const bonus = staffBonuses.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
        const bonusComments = staffBonuses.map(b => b.comments || '').filter(Boolean).join('; ');
        const net = Math.max(0, gross + bonus - adv);

        const payment = paymentsList.find(p => p.staff_id === staff.id);
        const pStatus = (payment && payment.status === 'paid') ? 'Paid' : 'Unpaid';
        const pAmt = (payment && payment.status === 'paid') ? (payment.amount || net) : 0;
        const pDate = (payment && payment.payment_date) || '';
        const pMode = (payment && payment.payment_mode) || '';
        const pRef = (payment && payment.reference_no) || '';

        csv += \`"\${staff.name}","\${prop.name}","\${staff.role || ''}","\${staff.phone || ''}",\${base},\${daysCount},\${dailyRate},\${countP},\${countDO},\${countL},\${countA},\${balance.toFixed(1)},\${absentDeduction},\${gross},\${adv},\${bonus},"\${bonusComments.replace(/"/g, '""')}",\${net},"\${staff.bank_name || ''}","\${staff.bank_account_number || ''}","\${staff.bank_ifsc || ''}","\${staff.bank_upi_id || ''}","\${pStatus}",\${pAmt},"\${pDate}","\${pMode}","\${pRef}"\\n\`;
      });

      downloadCsvFile(csv, \`Salary_Payroll_\${MONTH_NAMES[currentMonth]}_\${currentYear}.csv\`);
    }

    function exportAttendanceCSV() {
      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const filteredStaff = getVisibleStaffList();

      let csv = "Staff Name,Property,Role,";
      for (let day = 1; day <= daysCount; day++) {
        csv += \`Day \${day},\`;
      }
      csv += "Present,Day Off,Absent,Leave Taken,Leave Allowed,Leave Remaining\\n";

      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '', monthly_leave_allowance: 2 };
        const allowedLeaves = (staff.custom_leave_allowance !== null && staff.custom_leave_allowance !== undefined)
          ? staff.custom_leave_allowance
          : prop.monthly_leave_allowance;

        let countP = 0, countDO = 0, countA = 0, countL = 0;
        let dayVals = "";

        for (let day = 1; day <= daysCount; day++) {
          const dateStr = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
          const status = attendanceMap[\`\${staff.id}_\${dateStr}\`] || "present";
          if (status === "present") countP++;
          else if (status === "day_off") countDO++;
          else if (status === "absent") countA++;
          else if (status === "leave") countL++;

          const shortCode = status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'day_off' ? 'DO' : 'L';
          dayVals += \`\${shortCode},\`;
        }

        const rem = allowedLeaves - countL;
        csv += \`"\${staff.name}","\${prop.name}","\${staff.role || ''}",\${dayVals}\${countP},\${countDO},\${countA},\${countL},\${allowedLeaves},\${rem}\\n\`;
      });

      downloadCsvFile(csv, \`Staff_Attendance_\${MONTH_NAMES[currentMonth]}_\${currentYear}.csv\`);
    }

    function downloadCsvFile(content, fileName) {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported to " + fileName);
    }

    // -------------------------------------------------------------------------
    // MODAL: ADD / EDIT STAFF
    // -------------------------------------------------------------------------
    function handleStaffNameClick(staffId) {
      if (currentUserRole === "admin") {
        openStaffModal(staffId);
      } else {
        showToast("Logged in as Manager: only Admin can edit staff profiles");
      }
    }

    function openStaffModal(staffId = null) {
      if (currentUserRole !== "admin") {
        showToast("Access restricted: Staff profiles are managed by Administrator");
        return;
      }
      const modal = document.getElementById("staffModal");
      const title = document.getElementById("staffModalTitle");
      const btnDelete = document.getElementById("btnDeleteStaff");
      const propSelect = document.getElementById("staffProperty");

      propSelect.innerHTML = properties.map(p => \`
        <option value="\${p.id}">\${escapeHtml(p.name)}</option>
      \`).join("");

      if (staffId) {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return;
        title.innerText = "Edit Staff Member";
        document.getElementById("staffId").value = staff.id;
        document.getElementById("staffName").value = staff.name;
        document.getElementById("staffProperty").value = staff.property_id;
        document.getElementById("staffSalary").value = staff.salary || "";
        document.getElementById("staffRole").value = staff.role || "";
        document.getElementById("staffPhone").value = staff.phone || "";
        document.getElementById("staffAddress").value = staff.address || "";
        document.getElementById("staffCustomLeave").value = (staff.custom_leave_allowance !== null && staff.custom_leave_allowance !== undefined) ? staff.custom_leave_allowance : "";
        document.getElementById("staffJoiningDate").value = staff.joining_date || formatIsoDate(new Date());
        document.getElementById("staffOpeningLeave").value = (staff.opening_leave_balance !== null && staff.opening_leave_balance !== undefined) ? staff.opening_leave_balance : "0";
        
        // Bank details & QR
        document.getElementById("staffBankAccountName").value = staff.bank_account_name || "";
        document.getElementById("staffBankName").value = staff.bank_name || "";
        document.getElementById("staffBankAccountNumber").value = staff.bank_account_number || "";
        document.getElementById("staffBankIfsc").value = staff.bank_ifsc || "";
        document.getElementById("staffBankUpi").value = staff.bank_upi_id || "";
        document.getElementById("staffBankQrCode").value = staff.bank_qr_code || "";

        // Manager Access
        document.getElementById("staffIsManager").checked = staff.is_manager === 1;
        document.getElementById("staffManagerPin").value = staff.manager_pin || "";
        toggleManagerPinField();

        const qrImg = document.getElementById("qrPreviewImg");
        const qrIcon = document.getElementById("qrPlaceholderIcon");
        const btnRemove = document.getElementById("btnRemoveQr");
        if (staff.bank_qr_code) {
          qrImg.src = staff.bank_qr_code;
          qrImg.classList.remove("hidden");
          qrIcon.classList.add("hidden");
          btnRemove.classList.remove("hidden");
        } else {
          qrImg.src = "";
          qrImg.classList.add("hidden");
          qrIcon.classList.remove("hidden");
          btnRemove.classList.add("hidden");
        }

        btnDelete.classList.remove("hidden");
      } else {
        title.innerText = "Add Staff Member";
        document.getElementById("staffId").value = "";
        document.getElementById("staffName").value = "";
        document.getElementById("staffProperty").value = activePropertyId !== 'all' ? activePropertyId : (properties[0] ? properties[0].id : "");
        document.getElementById("staffSalary").value = "15000";
        document.getElementById("staffRole").value = "";
        document.getElementById("staffPhone").value = "";
        document.getElementById("staffAddress").value = "";
        document.getElementById("staffCustomLeave").value = "";
        document.getElementById("staffJoiningDate").value = formatIsoDate(new Date());
        document.getElementById("staffOpeningLeave").value = "0";

        // Reset bank details & QR
        document.getElementById("staffBankAccountName").value = "";
        document.getElementById("staffBankName").value = "";
        document.getElementById("staffBankAccountNumber").value = "";
        document.getElementById("staffBankIfsc").value = "";
        document.getElementById("staffBankUpi").value = "";
        document.getElementById("staffBankQrCode").value = "";

        // Manager Access
        document.getElementById("staffIsManager").checked = false;
        document.getElementById("staffManagerPin").value = "";
        toggleManagerPinField();

        const qrImg = document.getElementById("qrPreviewImg");
        const qrIcon = document.getElementById("qrPlaceholderIcon");
        const btnRemove = document.getElementById("btnRemoveQr");
        qrImg.src = "";
        qrImg.classList.add("hidden");
        qrIcon.classList.remove("hidden");
        btnRemove.classList.add("hidden");

        btnDelete.classList.add("hidden");
      }

      modal.classList.remove("hidden");
      modal.classList.add("flex");
      refreshIcons();
    }

    function closeStaffModal() {
      const modal = document.getElementById("staffModal");
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }

    async function handleSaveStaff(e) {
      e.preventDefault();
      const id = document.getElementById("staffId").value;
      const name = document.getElementById("staffName").value.trim();
      const property_id = document.getElementById("staffProperty").value;
      const rawSalary = document.getElementById("staffSalary").value || "0";
      const salary = parseFloat(rawSalary.replace(/[^0-9.]/g, '')) || 0;
      const role = document.getElementById("staffRole").value.trim() || null;
      const phone = document.getElementById("staffPhone").value.trim() || null;
      const address = document.getElementById("staffAddress").value.trim() || null;
      const customVal = document.getElementById("staffCustomLeave").value;
      const custom_leave_allowance = customVal !== "" ? parseFloat(customVal) : null;
      const joining_date = document.getElementById("staffJoiningDate").value || formatIsoDate(new Date());
      const openingLeaveVal = document.getElementById("staffOpeningLeave").value;
      const opening_leave_balance = openingLeaveVal !== "" ? parseFloat(openingLeaveVal) : 0.0;

      // Bank Details & Payment QR
      const bank_account_name = document.getElementById("staffBankAccountName").value.trim() || null;
      const bank_name = document.getElementById("staffBankName").value.trim() || null;
      const bank_account_number = document.getElementById("staffBankAccountNumber").value.trim() || null;
      const bank_ifsc = document.getElementById("staffBankIfsc").value.trim().toUpperCase() || null;
      const bank_upi_id = document.getElementById("staffBankUpi").value.trim() || null;
      const bank_qr_code = document.getElementById("staffBankQrCode").value || null;

      // Manager Access
      const is_manager = document.getElementById("staffIsManager").checked ? 1 : 0;
      const manager_pin = document.getElementById("staffManagerPin").value.trim() || null;
      if (is_manager && (!manager_pin || manager_pin.length !== 4)) {
        showToast("Please enter a 4-digit PIN for manager access");
        return;
      }

      const payload = {
        property_id,
        name,
        salary,
        role,
        phone,
        address,
        custom_leave_allowance,
        joining_date,
        opening_leave_balance,
        bank_account_name,
        bank_name,
        bank_account_number,
        bank_ifsc,
        bank_upi_id,
        bank_qr_code,
        is_manager,
        manager_pin
      };
      const url = id ? \`/api/staff/\${id}\` : "/api/staff";
      const method = id ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        closeStaffModal();
        await fetchStaff();
        renderPropertyTabs();
        renderActiveView();
        showToast(id ? "Staff updated successfully" : "Staff added successfully");
      } catch (err) {
        showToast("Error saving staff: " + err.message);
      }
    }

    async function handleDeleteStaff() {
      const id = document.getElementById("staffId").value;
      if (!id || !confirm("Are you sure you want to remove this staff member?")) return;

      try {
        const res = await fetch(\`/api/staff/\${id}\`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        closeStaffModal();
        await fetchStaff();
        renderPropertyTabs();
        renderActiveView();
        showToast("Staff member removed");
      } catch (err) {
        showToast("Error deleting staff: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // PAYMENT QR & BANK DETAILS HANDLERS
    // -------------------------------------------------------------------------
    function handleQrUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result;
        document.getElementById("staffBankQrCode").value = base64Data;
        const preview = document.getElementById("qrPreviewImg");
        const placeholder = document.getElementById("qrPlaceholderIcon");
        const btnRemove = document.getElementById("btnRemoveQr");

        preview.src = base64Data;
        preview.classList.remove("hidden");
        placeholder.classList.add("hidden");
        btnRemove.classList.remove("hidden");
        showToast("QR code photo attached!");
      };
      reader.readAsDataURL(file);
    }

    function removeQrCodePhoto() {
      document.getElementById("staffBankQrCode").value = "";
      document.getElementById("staffQrFileInput").value = "";
      const preview = document.getElementById("qrPreviewImg");
      const placeholder = document.getElementById("qrPlaceholderIcon");
      const btnRemove = document.getElementById("btnRemoveQr");

      preview.src = "";
      preview.classList.add("hidden");
      placeholder.classList.remove("hidden");
      btnRemove.classList.add("hidden");
      showToast("QR code removed");
    }

    function openPaymentQrModal(staffId, amount) {
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;
      currentPaymentStaffId = staffId;
      currentPaymentAmount = amount || 0;

      const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '' };
      document.getElementById("payModalStaffName").innerText = \`\${staff.name} · \${prop.name}\`;
      document.getElementById("payModalAmountText").innerText = \`Net Payout: ₹\${(amount || 0).toLocaleString('en-IN')}\`;

      const img = document.getElementById("payQrImage");
      const noQr = document.getElementById("noQrText");
      const scanPrompt = document.getElementById("qrScanPrompt");

      if (staff.bank_qr_code) {
        img.src = staff.bank_qr_code;
        img.classList.remove("hidden");
        noQr.classList.add("hidden");
        scanPrompt.classList.remove("hidden");
      } else {
        img.src = "";
        img.classList.add("hidden");
        noQr.classList.remove("hidden");
        scanPrompt.classList.add("hidden");
      }

      const upiRow = document.getElementById("payUpiRow");
      if (staff.bank_upi_id) {
        document.getElementById("payUpiText").innerText = staff.bank_upi_id;
        upiRow.classList.remove("hidden");
      } else {
        upiRow.classList.add("hidden");
      }

      const bankRow = document.getElementById("payBankRow");
      if (staff.bank_account_number || staff.bank_name || staff.bank_ifsc) {
        document.getElementById("payBankName").innerText = staff.bank_name || "N/A";
        document.getElementById("payAccountNo").innerText = staff.bank_account_number || "N/A";
        document.getElementById("payIfsc").innerText = staff.bank_ifsc || "N/A";
        bankRow.classList.remove("hidden");
      } else {
        bankRow.classList.add("hidden");
      }

      document.getElementById("paymentQrModal").classList.remove("hidden");
      document.getElementById("paymentQrModal").classList.add("flex");
      refreshIcons();
    }

    function closePaymentQrModal() {
      document.getElementById("paymentQrModal").classList.add("hidden");
      document.getElementById("paymentQrModal").classList.remove("flex");
      currentPaymentStaffId = null;
    }

    function openStaffModalFromPay() {
      const staffId = currentPaymentStaffId;
      closePaymentQrModal();
      if (staffId) openStaffModal(staffId);
    }

    function openRecordPaymentFromQr() {
      if (!currentPaymentStaffId) return;
      const staffId = currentPaymentStaffId;
      const amt = currentPaymentAmount;
      closePaymentQrModal();
      openRecordPaymentModal(staffId, amt);
    }

    function copyToClipboard(elementId, msg) {
      const el = document.getElementById(elementId);
      if (!el) return;
      const text = el.innerText || el.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(msg || "Copied to clipboard!");
        }).catch(() => {
          showToast("Copied: " + text);
        });
      } else {
        showToast("Copied: " + text);
      }
    }

    function copyBankDetails() {
      if (!currentPaymentStaffId) return;
      const staff = staffList.find(s => s.id === currentPaymentStaffId);
      if (!staff) return;
      const text = \`A/C Holder: \${staff.bank_account_name || staff.name}\\nBank: \${staff.bank_name || ''}\\nA/C No: \${staff.bank_account_number || ''}\\nIFSC: \${staff.bank_ifsc || ''}\\nUPI ID: \${staff.bank_upi_id || ''}\`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Bank details copied to clipboard!");
        }).catch(() => {
          showToast("Bank details copied!");
        });
      } else {
        showToast("Bank details copied!");
      }
    }

    // -------------------------------------------------------------------------
    // RECORD PAYMENT STATUS MODAL
    // -------------------------------------------------------------------------
    function openRecordPaymentModal(staffId, defaultAmount) {
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;
      currentPaymentStaffId = staffId;

      document.getElementById("paymentStaffId").value = staffId;
      document.getElementById("paymentModalStaffName").innerText = \`Record Salary Payment: \${staff.name}\`;
      document.getElementById("paymentModalMonthText").innerText = \`\${MONTH_NAMES[currentMonth]} \${currentYear}\`;

      const payment = paymentsList.find(p => p.staff_id === staffId);
      const isPaid = payment && payment.status === "paid";
      const btnRevert = document.getElementById("btnRevertPayment");

      if (isPaid) {
        btnRevert.classList.remove("hidden");
        document.getElementById("paymentAmount").value = payment.amount || (defaultAmount || 0);
        document.getElementById("paymentDate").value = payment.payment_date || formatIsoDate(new Date());
        document.getElementById("paymentMode").value = payment.payment_mode || "UPI / QR Code";
        document.getElementById("paymentRef").value = payment.reference_no || "";
      } else {
        btnRevert.classList.add("hidden");
        document.getElementById("paymentAmount").value = defaultAmount !== undefined ? defaultAmount : 0;
        document.getElementById("paymentDate").value = formatIsoDate(new Date());
        document.getElementById("paymentMode").value = "UPI / QR Code";
        document.getElementById("paymentRef").value = "";
      }

      document.getElementById("recordPaymentModal").classList.remove("hidden");
      document.getElementById("recordPaymentModal").classList.add("flex");
      refreshIcons();
    }

    function closeRecordPaymentModal() {
      document.getElementById("recordPaymentModal").classList.add("hidden");
      document.getElementById("recordPaymentModal").classList.remove("flex");
      currentPaymentStaffId = null;
    }

    async function handleSavePayment(e) {
      e.preventDefault();
      const staff_id = document.getElementById("paymentStaffId").value;
      const rawAmt = document.getElementById("paymentAmount").value || "0";
      const amount = parseFloat(rawAmt.replace(/[^0-9.]/g, '')) || 0;
      const payment_date = document.getElementById("paymentDate").value || formatIsoDate(new Date());
      const payment_mode = document.getElementById("paymentMode").value;
      const reference_no = document.getElementById("paymentRef").value.trim() || null;
      const month = getMonthQueryString();

      try {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            staff_id,
            month,
            amount,
            status: "paid",
            payment_date,
            payment_mode,
            reference_no
          })
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        closeRecordPaymentModal();
        await fetchPayments();
        if (currentView === "payroll") renderPayrollView();
        showToast("Salary marked as PAID (₹" + amount.toLocaleString('en-IN') + ")");
      } catch (err) {
        showToast("Error recording payment: " + err.message);
      }
    }

    async function handleRevertPayment() {
      const staff_id = document.getElementById("paymentStaffId").value;
      if (!staff_id) return;
      if (!confirm("Are you sure you want to revert this payment to UNPAID?")) return;

      const month = getMonthQueryString();
      try {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            staff_id,
            month,
            amount: 0,
            status: "unpaid"
          })
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        closeRecordPaymentModal();
        await fetchPayments();
        if (currentView === "payroll") renderPayrollView();
        showToast("Salary status reverted to UNPAID");
      } catch (err) {
        showToast("Error reverting payment: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // LEAVE POLICY RULES
    // -------------------------------------------------------------------------
    function openLeavePolicyModal() {
      const container = document.getElementById("propertyAllowanceList");
      let html = "";
      properties.forEach(p => {
        html += \`
          <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div class="font-bold text-slate-800 text-sm">\${escapeHtml(p.name)}</div>
              <div class="text-[11px] text-slate-500">Allocated leaves per month</div>
            </div>
            <div class="flex items-center gap-1.5">
              <input type="number" step="0.5" min="0" max="31" id="allowance_\${p.id}" value="\${p.monthly_leave_allowance}" class="w-20 text-center font-bold text-sm px-2 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
              <span class="text-xs text-slate-500 font-semibold">days</span>
            </div>
          </div>
        \`;
      });
      container.innerHTML = html;
      document.getElementById("leaveModal").classList.remove("hidden");
      document.getElementById("leaveModal").classList.add("flex");
      refreshIcons();
    }

    function closeLeavePolicyModal() {
      document.getElementById("leaveModal").classList.add("hidden");
      document.getElementById("leaveModal").classList.remove("flex");
    }

    async function saveAllLeaveAllowances() {
      try {
        for (const p of properties) {
          const input = document.getElementById(\`allowance_\${p.id}\`);
          if (input) {
            const val = parseFloat(input.value) || 0;
            if (val !== p.monthly_leave_allowance) {
              await fetch(\`/api/properties/\${p.id}\`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ monthly_leave_allowance: val })
              });
            }
          }
        }
        closeLeavePolicyModal();
        await fetchProperties();
        renderPropertyTabs();
        renderActiveView();
        showToast("Leave policies saved successfully!");
      } catch (err) {
        showToast("Error updating allowances: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // ADMIN SECURITY & PIN MANAGEMENT
    // -------------------------------------------------------------------------
    function togglePinVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      if (btn) {
        btn.innerHTML = isPassword
          ? '<i data-lucide="eye-off" class="w-4 h-4 text-indigo-600"></i>'
          : '<i data-lucide="eye" class="w-4 h-4 text-slate-400"></i>';
        refreshIcons();
      }
    }

    function openAdminSecurityModal() {
      document.getElementById("currentAdminPin").value = "";
      document.getElementById("newAdminPin").value = "";
      document.getElementById("confirmAdminPin").value = "";
      document.getElementById("adminPinError").innerText = "";
      switchSecurityTab('admin');
      document.getElementById("adminSecurityModal").classList.remove("hidden");
      document.getElementById("adminSecurityModal").classList.add("flex");
      setTimeout(() => {
        const inp = document.getElementById("currentAdminPin");
        if (inp) inp.focus();
      }, 100);
      refreshIcons();
    }

    function closeAdminSecurityModal() {
      document.getElementById("adminSecurityModal").classList.add("hidden");
      document.getElementById("adminSecurityModal").classList.remove("flex");
    }

    function switchSecurityTab(tab) {
      const tabAdmin = document.getElementById("secTabAdmin");
      const tabManagers = document.getElementById("secTabManagers");
      const formAdmin = document.getElementById("adminPinChangeForm");
      const boxManagers = document.getElementById("managerPinsContainer");

      if (tab === 'admin') {
        tabAdmin.className = "py-2 px-3 border-b-2 border-indigo-600 text-indigo-600 font-bold transition";
        tabManagers.className = "py-2 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-semibold transition";
        formAdmin.classList.remove("hidden");
        boxManagers.classList.add("hidden");
      } else {
        tabManagers.className = "py-2 px-3 border-b-2 border-indigo-600 text-indigo-600 font-bold transition";
        tabAdmin.className = "py-2 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-semibold transition";
        formAdmin.classList.add("hidden");
        boxManagers.classList.remove("hidden");
        loadSecurityManagers();
      }
      refreshIcons();
    }

    async function handleChangeAdminPin(e) {
      e.preventDefault();
      const currentPin = document.getElementById("currentAdminPin").value.trim();
      const newPin = document.getElementById("newAdminPin").value.trim();
      const confirmPin = document.getElementById("confirmAdminPin").value.trim();
      const errorDiv = document.getElementById("adminPinError");

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        errorDiv.innerText = "New PIN must be exactly 4 numeric digits.";
        return;
      }
      if (newPin !== confirmPin) {
        errorDiv.innerText = "New PIN and confirmation do not match.";
        return;
      }

      try {
        const res = await fetch("/api/admin/change-pin", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ current_pin: currentPin, new_pin: newPin })
        });
        const data = await res.json();
        if (data.success) {
          currentSessionPin = newPin;
          localStorage.setItem(AUTH_PIN_KEY, newPin);
          closeAdminSecurityModal();
          showToast("Admin Master PIN changed successfully!");
        } else {
          errorDiv.innerText = data.error || "Failed to update Admin PIN.";
        }
      } catch (err) {
        errorDiv.innerText = "Network error: " + err.message;
      }
    }

    async function loadSecurityManagers() {
      const container = document.getElementById("managerPinsList");
      container.innerHTML = '<div class="text-xs text-slate-400 p-2">Loading managers...</div>';

      try {
        const res = await fetch("/api/admin/security", { headers: getAuthHeaders() });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.managers) || data.managers.length === 0) {
          container.innerHTML = '<div class="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">No staff members have been appointed as managers yet.<br>You can appoint a manager in the Staff Directory edit modal.</div>';
          return;
        }

        let html = "";
        data.managers.forEach(m => {
          html += '<div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 gap-2">' +
            '<div class="min-w-0 flex-1">' +
              '<div class="font-bold text-slate-800 text-sm truncate">' + escapeHtml(m.name) + '</div>' +
              '<div class="text-[11px] text-indigo-600 font-semibold truncate">' + escapeHtml(m.property_name || "Property") + '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2 shrink-0">' +
              '<div class="relative w-28">' +
                '<input type="password" id="mgrPin_' + m.id + '" maxlength="4" pattern="[0-9]*" inputmode="numeric" value="' + escapeHtml(m.manager_pin || "") + '" class="w-full text-center font-mono font-bold text-sm py-1.5 px-2 pr-7 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">' +
                '<button type="button" onclick="togglePinVisibility(&apos;mgrPin_' + m.id + '&apos;, this)" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">' +
                  '<i data-lucide="eye" class="w-3.5 h-3.5"></i>' +
                '</button>' +
              '</div>' +
              '<button type="button" onclick="saveSecurityManagerPin(&apos;' + m.id + '&apos;)" class="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs">' +
                'Save' +
              '</button>' +
            '</div>' +
          '</div>';
        });
        container.innerHTML = html;
        refreshIcons();
      } catch (err) {
        container.innerHTML = '<div class="text-xs text-rose-500 p-2">Error loading managers: ' + escapeHtml(err.message) + '</div>';
      }
    }

    async function saveSecurityManagerPin(staffId) {
      const input = document.getElementById("mgrPin_" + staffId);
      if (!input) return;
      const newPin = input.value.trim();
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        showToast("Manager PIN must be exactly 4 digits.");
        return;
      }

      try {
        const res = await fetch("/api/admin/change-manager-pin", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ staff_id: staffId, new_pin: newPin })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Manager PIN updated successfully!");
          fetchLoginRoles();
        } else {
          showToast("Error: " + (data.error || "Failed to update PIN"));
        }
      } catch (err) {
        showToast("Network error: " + err.message);
      }
    }


    // -------------------------------------------------------------------------
    // DAILY SALES & EXPENSES (MANAGER ENTRY & ADMIN REVENUE DASHBOARD)
    // -------------------------------------------------------------------------
    function formatCurrency(num) {
      return (Number(num) || 0).toLocaleString('en-IN');
    }

    async function fetchFinances() {
      try {
        let url = "/api/finances";
        if (currentUserRole === "manager") {
          url = "/api/finances";
        } else {
          const m = String(financeMonth + 1).padStart(2, "0");
          url = \`/api/finances?month=\${financeYear}-\${m}\`;
          if (financeFilterProperty && financeFilterProperty !== "all") {
            url += \`&property_id=\${encodeURIComponent(financeFilterProperty)}\`;
          }
        }
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (res.status === 401) return lockApp();
        if (res.ok) {
          financesList = await res.json();
        }
      } catch (e) {
        console.error("fetchFinances error:", e);
      }
    }

    async function fetchRooms(propertyId = null) {
      try {
        let url = "/api/rooms";
        if (propertyId && propertyId !== "all") {
          url += \`?property_id=\${encodeURIComponent(propertyId)}\`;
        } else if (currentUserRole === "manager" && currentManagerInfo?.property_id) {
          url += \`?property_id=\${encodeURIComponent(currentManagerInfo.property_id)}\`;
        }
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (res.status === 401) return lockApp();
        if (res.ok) {
          roomsList = await res.json();
        }
      } catch (e) {
        console.error("fetchRooms error:", e);
      }
    }

    async function fetchRoomBookings(filter = {}) {
      try {
        let url = "/api/room-bookings";
        const params = new URLSearchParams();
        if (currentUserRole === "manager") {
          if (currentManagerInfo?.property_id) {
            params.append("property_id", currentManagerInfo.property_id);
          }
          if (filter.date) {
            params.append("date", filter.date);
          } else if (managerFinanceDate) {
            const m = managerFinanceDate.substring(0, 7);
            params.append("month", m);
          }
        } else {
          const prop = filter.property_id || calendarSelectedProperty || financeFilterProperty;
          if (prop && prop !== "all") {
            params.append("property_id", prop);
          }
          const m = String(financeMonth + 1).padStart(2, "0");
          const monthStr = filter.month || \`\${financeYear}-\${m}\`;
          params.append("month", monthStr);
        }
        const qs = params.toString();
        if (qs) url += \`?\${qs}\`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (res.status === 401) return lockApp();
        if (res.ok) {
          roomBookingsList = await res.json();
        }
      } catch (e) {
        console.error("fetchRoomBookings error:", e);
      }
    }

    function renderFinancesView() {
      const container = document.getElementById("financesViewContent");
      if (!container) return;
      if (currentUserRole === "manager") {
        renderManagerFinancesView(container);
      } else {
        renderAdminFinancesView(container);
      }
      refreshIcons();
    }

    // Helper: Business Type Label and Color
    function getBusinessTypeInfo(prop) {
      if (!prop) return { label: "General", badgeClass: "bg-slate-100 text-slate-700" };
      const hasL = prop.has_lodging === 1;
      const hasF = prop.has_fooding === 1;
      const hasS = prop.has_services === 1;

      if (hasL && hasF) {
        return { label: "Hotel & Restaurant", badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-200" };
      }
      if (hasL && !hasF) {
        return { label: "Lodging Only", badgeClass: "bg-blue-100 text-blue-800 border border-blue-200" };
      }
      if (!hasL && hasF) {
        return { label: "Fooding Only", badgeClass: "bg-amber-100 text-amber-800 border border-amber-200" };
      }
      if (hasS) {
        return { label: prop.services_label || "Services", badgeClass: "bg-purple-100 text-purple-800 border border-purple-200" };
      }
      return { label: "Custom Business", badgeClass: "bg-slate-100 text-slate-700" };
    }

    // -------------------------------------------------------------------------
    // MANAGER VIEW (DYNAMIC BASED ON PROPERTY CAPABILITIES)
    // -------------------------------------------------------------------------
    function renderManagerFinancesView(container) {
      const propId = currentManagerInfo?.property_id || "";
      const currentProp = properties.find(p => p.id === propId) || {};
      const propName = currentManagerInfo?.property_name || currentProp.name || "Assigned Property";
      
      const hasLodging = currentProp.has_lodging === 1;
      const hasFooding = currentProp.has_fooding === 1;
      const hasServices = currentProp.has_services === 1;
      const servicesLabel = currentProp.services_label || "Services";
      const typeInfo = getBusinessTypeInfo(currentProp);

      const currentRecord = financesList.find(f => f.property_id === propId && f.date === managerFinanceDate);
      
      // Filter rooms and bookings if lodging is active
      const propRooms = hasLodging ? roomsList.filter(r => r.property_id === propId) : [];
      const todayBookings = hasLodging ? roomBookingsList.filter(b => b.property_id === propId && b.date === managerFinanceDate) : [];

      // Lodging calculations (automated from bookings)
      const lo = hasLodging ? todayBookings.filter(b => b.payment_mode === "online").reduce((sum, b) => sum + (b.amount || 0), 0) : 0;
      const lc = hasLodging ? todayBookings.filter(b => b.payment_mode === "cash").reduce((sum, b) => sum + (b.amount || 0), 0) : 0;
      const lodgingSub = lo + lc;

      // Fooding calculations
      const fo = hasFooding && currentRecord ? (currentRecord.fooding_online || 0) : 0;
      const fc = hasFooding && currentRecord ? (currentRecord.fooding_cash ?? currentRecord.fooding_offline ?? 0) : 0;
      const foodingSub = fo + fc;

      // Services calculations
      const so = hasServices && currentRecord ? (currentRecord.services_online || 0) : 0;
      const sc = hasServices && currentRecord ? (currentRecord.services_cash || 0) : 0;
      const servicesSub = so + sc;

      // Other & Expenses
      const os = currentRecord ? (currentRecord.other_sales || 0) : 0;
      const exp = currentRecord ? (currentRecord.expenses_total || 0) : 0;
      const expNotes = currentRecord ? (currentRecord.expense_notes || "") : "";
      const notes = currentRecord ? (currentRecord.notes || "") : "";

      const totSales = lodgingSub + foodingSub + servicesSub + os;
      const netProf = totSales - exp;

      // Active streams descriptor for banner
      const streamNames = [];
      if (hasLodging) streamNames.push(\`Lodging (\${todayBookings.length} bookings)\`);
      if (hasFooding) streamNames.push("Fooding");
      if (hasServices) streamNames.push(servicesLabel);
      if (os > 0 || streamNames.length === 0) streamNames.push("Other");
      const streamsDescriptor = streamNames.join(" + ");

      const isSaved = !!currentRecord;
      const statusBadge = isSaved
        ? \`<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i> Saved Record</span>\`
        : \`<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"><i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i> Not Yet Entered</span>\`;

      const recentRecords = financesList
        .filter(f => f.property_id === propId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);

      container.innerHTML = \`
        <!-- Manager Header & Date Navigation -->
        <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <i data-lucide="building" class="w-4 h-4 text-indigo-600"></i>
              \${escapeHtml(propName)}
            </span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold \${typeInfo.badgeClass}">
              \${escapeHtml(typeInfo.label)}
            </span>
            \${statusBadge}
          </div>

          <!-- Date Control -->
          <div class="flex items-center gap-1.5 self-start sm:self-auto">
            <button type="button" onclick="changeFinanceDate(-1)" title="Previous Day" class="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition active:scale-95 cursor-pointer">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <input
              type="date"
              id="mgrFinanceDate"
              value="\${managerFinanceDate}"
              onchange="onManagerFinanceDateChange(this.value)"
              class="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-slate-800 cursor-pointer"
            />
            <button type="button" onclick="changeFinanceDate(1)" title="Next Day" class="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition active:scale-95 cursor-pointer">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="goToFinanceToday()" class="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
              Today
            </button>
          </div>
        </div>

        <!-- CONDITIONAL MODULE 1: ROOM BOOKINGS & AUTOMATED LODGING -->
        \${hasLodging ? \`
          <div class="bg-white p-4 sm:p-6 rounded-3xl border border-indigo-100/90 shadow-sm flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-indigo-50 pb-3 flex-wrap gap-2">
              <div>
                <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                  <i data-lucide="door-closed" class="w-5 h-5 text-indigo-600"></i>
                  Room Bookings & Lodging Revenue
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">Select a room and record the booking. Lodging online & cash amounts are calculated automatically.</p>
              </div>
              <div class="text-right">
                <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">Lodging Total</span>
                <span class="text-xl sm:text-2xl font-black font-mono text-indigo-950">₹<span id="mgrLodgingSubtotal">\${formatCurrency(lodgingSub)}</span></span>
              </div>
            </div>

            <!-- Room Status Chips -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-indigo-600"></i>
                  Rooms Status for \${managerFinanceDate}
                </label>
                <span class="text-[11px] text-slate-400">\${propRooms.length} Active Rooms</span>
              </div>

              \${propRooms.length === 0 ? \`
                <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-amber-600"></i>
                  <span>No rooms configured for this property yet. Admin can add rooms in Manage Rooms.</span>
                </div>
              \` : \`
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  \${propRooms.map(rm => {
                    const rmBookings = todayBookings.filter(b => b.room_id === rm.id);
                    const count = rmBookings.length;
                    const totalRm = rmBookings.reduce((s, b) => s + (b.amount || 0), 0);
                    const isBooked = count > 0;
                    return \`
                      <div
                        onclick="quickBookSelectRoom('\${rm.id}')"
                        class="p-3 rounded-2xl border transition cursor-pointer select-none \${isBooked ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200' : 'bg-slate-50/70 hover:bg-white border-slate-200'}"
                      >
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-black text-slate-900 flex items-center gap-1">
                            <i data-lucide="door-closed" class="w-3.5 h-3.5 \${isBooked ? 'text-indigo-600' : 'text-slate-400'}"></i>
                            Room \${escapeHtml(rm.room_number)}
                          </span>
                          <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold \${isBooked ? (count > 1 ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800') : 'bg-emerald-100 text-emerald-800'}">
                            \${isBooked ? (count > 1 ? \`\${count}x Booked\` : 'Booked') : 'Vacant'}
                          </span>
                        </div>
                        <div class="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>\${escapeHtml(rm.room_type || 'Standard')}</span>
                          <span class="font-mono font-bold \${isBooked ? 'text-indigo-900' : 'text-slate-600'}">
                            \${isBooked ? \`₹\${formatCurrency(totalRm)}\` : \`₹\${formatCurrency(rm.base_price || 0)}\`}
                          </span>
                        </div>
                      </div>
                    \`;
                  }).join("")}
                </div>
              \`}
            </div>

            <!-- Quick Booking Input Card -->
            <div class="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-3.5">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <h4 class="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="plus-circle" class="w-4 h-4 text-indigo-600"></i>
                  Quick Room Booking (Supports Multiple Bookings per Room / Day)
                </h4>
                <span class="text-[11px] text-indigo-600 font-medium">Click room above or select below</span>
              </div>

              <!-- Stay Duration Type Segment -->
              <div class="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="btnMgrStaySingle"
                  onclick="setMgrStayMode('single')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 \${mgrStayMode === 'single' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}"
                >
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                  <span>Single Day (\${managerFinanceDate})</span>
                </button>
                <button
                  type="button"
                  id="btnMgrStayRange"
                  onclick="setMgrStayMode('range')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 \${mgrStayMode === 'range' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}"
                >
                  <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>
                  <span>Date Range (Multi-Day Stay)</span>
                </button>
              </div>

              <!-- Multi-day date range section for manager -->
              <div id="mgrStayRangeSection" class="\${mgrStayMode === 'range' ? '' : 'hidden'} p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-2.5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label class="block text-xs font-semibold text-indigo-950 mb-1">Check-in Date *</label>
                    <input
                      type="date"
                      id="mgrBookCheckIn"
                      value="\${managerFinanceDate}"
                      onchange="onMgrRangeChange()"
                      class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-indigo-950 mb-1">Check-out Date *</label>
                    <input
                      type="date"
                      id="mgrBookCheckOut"
                      value="\${getTomorrowIso(managerFinanceDate)}"
                      onchange="onMgrRangeChange()"
                      class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs text-indigo-900 bg-white p-2 rounded-xl border border-indigo-100 flex-wrap gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span id="mgrRangeSummaryText" class="font-bold">1 Night Stay</span>
                  </div>
                  <label class="flex items-center gap-1 text-[11px] text-indigo-950 cursor-pointer select-none">
                    <input type="checkbox" id="mgrIncludeCheckoutDay" onchange="onMgrRangeChange()" class="rounded text-indigo-600 w-3.5 h-3.5">
                    <span>Include checkout day</span>
                  </label>
                </div>
              </div>

              <form id="mgrQuickBookForm" onsubmit="submitManagerRoomBooking(event)" class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- Room Select -->
                  <div>
                    <label class="block text-xs font-semibold text-indigo-950 mb-1">Room *</label>
                    <select
                      id="mgrBookRoomSelect"
                      required
                      onchange="onMgrBookRoomSelectChange(this.value)"
                      class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    >
                      <option value="">-- Choose Room --</option>
                      \${propRooms.map(rm => \`
                        <option value="\${rm.id}" data-price="\${rm.base_price || 0}">Room \${escapeHtml(rm.room_number)} (\${escapeHtml(rm.room_type)}) - ₹\${formatCurrency(rm.base_price || 0)}</option>
                      \`).join("")}
                    </select>
                  </div>

                  <!-- Amount -->
                  <div>
                    <label id="mgrAmountLabel" class="block text-xs font-semibold text-indigo-950 mb-1">
                      \${mgrStayMode === 'range' ? 'Rate / Night (₹) *' : 'Booking Amount (₹) *'}
                    </label>
                    <div class="relative">
                      <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                      <input
                        type="number"
                        id="mgrBookAmount"
                        min="0"
                        step="1"
                        required
                        placeholder="2000"
                        oninput="onMgrRateInput(this.value)"
                        class="w-full pl-7 pr-3 py-2 text-xs font-bold font-mono text-slate-900 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <!-- Payment Method Toggle -->
                  <div>
                    <label class="block text-xs font-semibold text-indigo-950 mb-1">Payment Method *</label>
                    <div class="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-indigo-200 shadow-2xs">
                      <button
                        type="button"
                        id="btnModeOnline"
                        onclick="setQuickBookPaymentMode('online')"
                        class="py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 bg-indigo-600 text-white shadow-xs"
                      >
                        <i data-lucide="globe" class="w-3.5 h-3.5"></i>
                        <span>Online</span>
                      </button>
                      <button
                        type="button"
                        id="btnModeCash"
                        onclick="setQuickBookPaymentMode('cash')"
                        class="py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100"
                      >
                        <i data-lucide="banknote" class="w-3.5 h-3.5"></i>
                        <span>Cash</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Guest / Notes Row -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Guest Name / Ref (Optional)</label>
                    <input
                      type="text"
                      id="mgrBookGuest"
                      placeholder="e.g. Rahul Sharma, Walk-in"
                      class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                  <div class="sm:col-span-1">
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Remarks / Slot (Optional)</label>
                    <input
                      type="text"
                      id="mgrBookNotes"
                      placeholder="e.g. Day use, Slot 2, Extra bed"
                      class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                  <div class="sm:col-span-1">
                    <button
                      type="submit"
                      class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i data-lucide="check" class="w-4 h-4"></i>
                      <span>+ Book Room</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <!-- Itemized Today's Bookings List -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="list" class="w-3.5 h-3.5 text-indigo-600"></i>
                  Today's Bookings (\${todayBookings.length})
                </h4>
                <div class="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>Online: <strong class="text-indigo-900 font-mono">₹\${formatCurrency(lo)}</strong></span>
                  <span>Cash: <strong class="text-amber-900 font-mono">₹\${formatCurrency(lc)}</strong></span>
                </div>
              </div>

              \${todayBookings.length === 0 ? \`
                <div class="text-center py-6 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                  No room bookings recorded yet for \${managerFinanceDate}. Select a room above to record lodging.
                </div>
              \` : \`
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  \${todayBookings.map(b => {
                    const isOnline = b.payment_mode === "online";
                    return \`
                      <div class="p-3 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-2xs flex flex-col justify-between gap-2">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-slate-900">Room \${escapeHtml(b.room_number)}</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">Slot #\${b.slot_number || 1}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold \${isOnline ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}">
                              \${isOnline ? 'Online' : 'Cash'}
                            </span>
                          </div>
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              onclick="openEditBookingModal('\${b.id}')"
                              title="Edit Booking"
                              class="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                            >
                              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            </button>
                            <button
                              type="button"
                              onclick="deleteRoomBooking('\${b.id}')"
                              title="Delete Booking"
                              class="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                        </div>

                        <div class="flex items-center justify-between text-xs">
                          <span class="text-slate-500 truncate max-w-[150px]">\${escapeHtml(b.guest_name || 'Guest')}</span>
                          <span class="text-sm font-black font-mono \${isOnline ? 'text-indigo-900' : 'text-amber-900'}">
                            ₹\${formatCurrency(b.amount)}
                          </span>
                        </div>

                        \${b.notes ? \`<div class="text-[10px] text-slate-400 italic truncate">\${escapeHtml(b.notes)}</div>\` : ''}
                      </div>
                    \`;
                  }).join("")}
                </div>
              \`}
            </div>
          </div>
        \` : ''}

        <!-- CONDITIONAL MODULE 2: FOODING REVENUE -->
        \${hasFooding ? \`
          <div class="bg-white p-4 sm:p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-amber-50 pb-3 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                  <i data-lucide="utensils" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-amber-950 uppercase tracking-wider">Fooding Revenue (Restaurant / Dining)</h4>
                  <p class="text-[11px] text-amber-700/80">Online payment revenue vs Cash payment revenue</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-[10px] font-bold text-amber-700 uppercase">Fooding Subtotal</div>
                <div class="text-base font-black text-amber-950 font-mono">₹<span id="mgrFoodingSubtotal">\${formatCurrency(foodingSub)}</span></div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block text-xs font-semibold text-amber-950 mb-1">
                  Online Payment (UPI / QR / Delivery) ₹
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                  <input
                    type="number"
                    id="mgrFoodingOnline"
                    min="0"
                    step="1"
                    placeholder="0"
                    value="\${fo || ''}"
                    oninput="calculateMgrFinanceLiveTotals()"
                    class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-amber-950 mb-1">
                  Cash Payment (Cash at Counter / Dine-in) ₹
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                  <input
                    type="number"
                    id="mgrFoodingCash"
                    min="0"
                    step="1"
                    placeholder="0"
                    value="\${fc || ''}"
                    oninput="calculateMgrFinanceLiveTotals()"
                    class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        \` : ''}

        <!-- CONDITIONAL MODULE 3: SERVICES REVENUE (SALON / SERVICES) -->
        \${hasServices ? \`
          <div class="bg-white p-4 sm:p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-purple-50 pb-3 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                  <i data-lucide="sparkles" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-purple-950 uppercase tracking-wider">\${escapeHtml(servicesLabel)} Revenue</h4>
                  <p class="text-[11px] text-purple-700/80">Online payment revenue vs Cash payment revenue</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-[10px] font-bold text-purple-700 uppercase">\${escapeHtml(servicesLabel)} Subtotal</div>
                <div class="text-base font-black text-purple-950 font-mono">₹<span id="mgrServicesSubtotal">\${formatCurrency(servicesSub)}</span></div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block text-xs font-semibold text-purple-950 mb-1">
                  Online Payment (UPI / QR / Card) ₹
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                  <input
                    type="number"
                    id="mgrServicesOnline"
                    min="0"
                    step="1"
                    placeholder="0"
                    value="\${so || ''}"
                    oninput="calculateMgrFinanceLiveTotals()"
                    class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-purple-950 mb-1">
                  Cash Payment (Cash at Counter) ₹
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                  <input
                    type="number"
                    id="mgrServicesCash"
                    min="0"
                    step="1"
                    placeholder="0"
                    value="\${sc || ''}"
                    oninput="calculateMgrFinanceLiveTotals()"
                    class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        \` : ''}

        <!-- SECTION: OTHER SALES & GROSS TOTAL -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="md:col-span-1 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Other / Misc Sales (₹)
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold text-xs pointer-events-none">₹</span>
              <input
                type="number"
                id="mgrOtherSales"
                min="0"
                step="1"
                placeholder="0"
                value="\${os || ''}"
                oninput="calculateMgrFinanceLiveTotals()"
                class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Laundry, transport, extras, etc.</p>
          </div>

          <!-- Gross Sales Live Banner -->
          <div class="md:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">Total Gross Sales</span>
              <span class="text-xs text-emerald-200">\${streamsDescriptor}</span>
            </div>
            <div class="text-right">
              <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                ₹<span id="mgrTotalSalesDisplay">\${formatCurrency(totSales)}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- SECTION: OPERATING EXPENSES -->
        <div class="bg-white p-4 sm:p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-rose-50 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-2xs">
                <i data-lucide="receipt" class="w-4 h-4"></i>
              </div>
              <div>
                <h4 class="text-xs font-bold text-rose-950 uppercase tracking-wider">Total Daily Expenses (₹)</h4>
                <p class="text-[11px] text-rose-700/80">Supplies, vegetables, products, diesel, local purchases, maintenance</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div class="sm:col-span-1">
              <label class="block text-xs font-semibold text-rose-950 mb-1">
                Expenses Total (₹) *
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-rose-400 font-mono font-bold text-xs pointer-events-none">₹</span>
                <input
                  type="number"
                  id="mgrExpensesTotal"
                  min="0"
                  step="1"
                  placeholder="0"
                  value="\${exp || ''}"
                  oninput="calculateMgrFinanceLiveTotals()"
                  class="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono text-rose-700 rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-rose-950 mb-1">
                Expense Itemization / Notes
              </label>
              <textarea
                id="mgrExpenseNotes"
                rows="2"
                placeholder="e.g. Products ₹1200, Grocery ₹1800, Diesel ₹1000"
                class="w-full px-3 py-1.5 text-xs text-slate-800 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
              >\${escapeHtml(expNotes)}</textarea>
            </div>
          </div>
        </div>

        <!-- SECTION: NET OPERATING PROFIT BANNER -->
        <div class="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div>
            <div class="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Estimated Net Profit for the Day</div>
            <div class="text-xs text-slate-300">Gross Sales minus Total Expenses</div>
          </div>
          <div class="text-right">
            <span class="text-2xl sm:text-3xl font-black font-mono \${netProf < 0 ? 'text-rose-400' : 'text-emerald-400'}">
              ₹<span id="mgrNetRevenueDisplay">\${formatCurrency(netProf)}</span>
            </span>
          </div>
        </div>

        <!-- SECTION: REMARKS & SAVE FORM -->
        <div class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">General Notes / Remarks (Optional)</label>
            <input
              type="text"
              id="mgrNotes"
              value="\${escapeHtml(notes)}"
              placeholder="Shift comments, occupancy highlights, weather impact, etc."
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onclick="saveManagerDailyFinance()"
            class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Save Today's Sales & Expenses</span>
          </button>
        </div>

        <!-- Recent Records for this Property -->
        <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <i data-lucide="history" class="w-4 h-4 text-slate-500"></i>
              Recent Entries for \${escapeHtml(propName)}
            </h4>
            <span class="text-[11px] text-slate-400">\${recentRecords.length} records</span>
          </div>

          \${recentRecords.length === 0 ? \`
            <div class="text-center py-6 text-xs text-slate-400">
              No previous financial records entered yet for this business.
            </div>
          \` : \`
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              \${recentRecords.map(r => {
                const rLodgingCash = r.lodging_cash ?? r.lodging_offline ?? 0;
                const rFoodingCash = r.fooding_cash ?? r.fooding_offline ?? 0;
                const rLodging = (r.lodging_online || 0) + rLodgingCash;
                const rFooding = (r.fooding_online || 0) + rFoodingCash;
                const rServices = (r.services_online || 0) + (r.services_cash || 0);
                const isSelected = r.date === managerFinanceDate;
                return \`
                  <div class="p-3.5 rounded-2xl border \${isSelected ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-200' : 'border-slate-200 bg-slate-50/50 hover:bg-white'} transition flex flex-col justify-between gap-2 shadow-2xs">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-800">\${r.date}</span>
                      <button type="button" onclick="setManagerFinanceDate('\${r.date}')" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-100/60 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition cursor-pointer">
                        \${isSelected ? 'Editing' : 'Load / Edit'}
                      </button>
                    </div>
                    <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                      \${hasLodging ? \`<div>Lodging: <strong class="text-indigo-900">₹\${formatCurrency(rLodging)}</strong></div>\` : ''}
                      \${hasFooding ? \`<div>Fooding: <strong class="text-amber-900">₹\${formatCurrency(rFooding)}</strong></div>\` : ''}
                      \${hasServices ? \`<div>\${escapeHtml(servicesLabel)}: <strong class="text-purple-900">₹\${formatCurrency(rServices)}</strong></div>\` : ''}
                      <div>Expenses: <strong class="text-rose-700">₹\${formatCurrency(r.expenses_total)}</strong></div>
                      <div>Net: <strong class="\${(r.net_revenue || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'}">₹\${formatCurrency(r.net_revenue)}</strong></div>
                    </div>
                    \${r.expense_notes ? \`<div class="text-[10px] text-slate-500 italic truncate" title="\${escapeHtml(r.expense_notes)}">Notes: \${escapeHtml(r.expense_notes)}</div>\` : ''}
                  </div>
                \`;
              }).join("")}
            </div>
          \`}
        </div>
      \`;
    }

    // -------------------------------------------------------------------------
    // ROOM BOOKING & MULTI-DAY STAY HELPERS
    // -------------------------------------------------------------------------
    let mgrStayMode = 'single';
    let modalStayMode = 'single';

    function getTomorrowIso(dateStr) {
      if (!dateStr) dateStr = new Date().toISOString().split("T")[0];
      const d = new Date(dateStr + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().split("T")[0];
    }

    function calculateStayNights(startDateStr, endDateStr, includeCheckout = false) {
      if (!startDateStr || !endDateStr) return 1;
      const s = new Date(startDateStr + "T00:00:00Z");
      const e = new Date(endDateStr + "T00:00:00Z");
      const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
      if (includeCheckout) {
        return Math.max(1, diffDays + 1);
      }
      return Math.max(1, diffDays);
    }

    function setMgrStayMode(mode) {
      mgrStayMode = mode;
      const btnSingle = document.getElementById("btnMgrStaySingle");
      const btnRange = document.getElementById("btnMgrStayRange");
      const rangeSec = document.getElementById("mgrStayRangeSection");
      const amtLabel = document.getElementById("mgrAmountLabel");
      const btnText = document.getElementById("btnMgrSubmitBookText");

      if (mode === 'single') {
        if (btnSingle) {
          btnSingle.className = "px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 bg-indigo-600 text-white shadow-xs";
        }
        if (btnRange) {
          btnRange.className = "px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200";
        }
        if (rangeSec) rangeSec.classList.add("hidden");
        if (amtLabel) amtLabel.innerText = "Booking Amount (₹) *";
        if (btnText) btnText.innerText = "+ Book Room";
      } else {
        if (btnSingle) {
          btnSingle.className = "px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200";
        }
        if (btnRange) {
          btnRange.className = "px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 bg-indigo-600 text-white shadow-xs";
        }
        if (rangeSec) rangeSec.classList.remove("hidden");
        if (amtLabel) amtLabel.innerText = "Rate / Night (₹) *";

        const inInput = document.getElementById("mgrBookCheckIn");
        const outInput = document.getElementById("mgrBookCheckOut");
        if (inInput && !inInput.value) inInput.value = managerFinanceDate;
        if (outInput && !outInput.value) outInput.value = getTomorrowIso(inInput.value || managerFinanceDate);
        onMgrRangeChange();
      }
      refreshIcons();
    }

    function onMgrRangeChange() {
      const checkIn = document.getElementById("mgrBookCheckIn")?.value;
      let checkOut = document.getElementById("mgrBookCheckOut")?.value;
      const includeCheckout = document.getElementById("mgrIncludeCheckoutDay")?.checked || false;

      if (!checkIn) return;
      if (!checkOut || checkOut <= checkIn) {
        checkOut = getTomorrowIso(checkIn);
        const outInput = document.getElementById("mgrBookCheckOut");
        if (outInput) outInput.value = checkOut;
      }

      const nights = calculateStayNights(checkIn, checkOut, includeCheckout);
      const summaryText = document.getElementById("mgrRangeSummaryText");
      if (summaryText) {
        summaryText.innerText = includeCheckout
          ? \`\${nights} Days Stay (\${checkIn} to \${checkOut})\`
          : \`\${nights} Night\${nights > 1 ? 's' : ''} Stay (\${checkIn} → \${checkOut})\`;
      }

      const rateInput = document.getElementById("mgrBookAmount");
      const rate = parseFloat(rateInput?.value || "0") || 0;
      const total = rate * nights;
      const btnText = document.getElementById("btnMgrSubmitBookText");
      if (btnText) {
        btnText.innerText = total > 0
          ? \`+ Book \${nights} Night\${nights > 1 ? 's' : ''} (₹\${formatCurrency(total)})\`
          : \`+ Book \${nights} Night\${nights > 1 ? 's' : ''}\`;
      }
    }

    function onMgrRateInput(val) {
      if (mgrStayMode === 'range') {
        onMgrRangeChange();
      }
    }

    // Quick Book Room Chip Selection
    function quickBookSelectRoom(roomId) {
      const select = document.getElementById("mgrBookRoomSelect");
      if (select) {
        select.value = roomId;
        onMgrBookRoomSelectChange(roomId);
      }
    }

    function onMgrBookRoomSelectChange(roomId) {
      const select = document.getElementById("mgrBookRoomSelect");
      const opt = select?.selectedOptions[0];
      const amountInput = document.getElementById("mgrBookAmount");
      if (opt && amountInput) {
        const price = opt.getAttribute("data-price");
        if (price && (!amountInput.value || parseFloat(amountInput.value) === 0)) {
          amountInput.value = price;
        }
      }
      if (mgrStayMode === 'range') {
        onMgrRangeChange();
      }
    }

    function setQuickBookPaymentMode(mode) {
      quickBookPaymentMode = mode;
      const btnOnline = document.getElementById("btnModeOnline");
      const btnCash = document.getElementById("btnModeCash");
      if (mode === "online") {
        if (btnOnline) {
          btnOnline.className = "py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 bg-indigo-600 text-white shadow-xs";
        }
        if (btnCash) {
          btnCash.className = "py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100";
        }
      } else {
        if (btnOnline) {
          btnOnline.className = "py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100";
        }
        if (btnCash) {
          btnCash.className = "py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 bg-amber-600 text-white shadow-xs";
        }
      }
    }

    async function submitManagerRoomBooking(e) {
      if (e) e.preventDefault();
      const propId = currentManagerInfo?.property_id || "";
      const roomId = document.getElementById("mgrBookRoomSelect")?.value;
      const guestName = document.getElementById("mgrBookGuest")?.value?.trim() || "";
      const notes = document.getElementById("mgrBookNotes")?.value?.trim() || "";

      if (!propId) return showToast("Error: No property assigned");
      if (!roomId) return showToast("Please select a room");

      let payload = {
        property_id: propId,
        room_id: roomId,
        payment_mode: quickBookPaymentMode,
        guest_name: guestName,
        notes
      };

      if (mgrStayMode === 'range') {
        const check_in_date = document.getElementById("mgrBookCheckIn")?.value;
        const check_out_date = document.getElementById("mgrBookCheckOut")?.value;
        const include_checkout_day = document.getElementById("mgrIncludeCheckoutDay")?.checked || false;
        const rate_per_day = Math.max(0, parseFloat(document.getElementById("mgrBookAmount")?.value || "0") || 0);

        if (!check_in_date || !check_out_date) {
          return showToast("Please select check-in and check-out dates");
        }
        if (check_in_date > check_out_date) {
          return showToast("Check-out date must be after check-in date");
        }
        if (rate_per_day <= 0) {
          return showToast("Please enter a valid rate per night");
        }

        const nights = calculateStayNights(check_in_date, check_out_date, include_checkout_day);
        payload.is_range = true;
        payload.check_in_date = check_in_date;
        payload.check_out_date = check_out_date;
        payload.include_checkout_day = include_checkout_day;
        payload.rate_per_day = rate_per_day;
        payload.amount = rate_per_day * nights;
      } else {
        const amount = Math.max(0, parseFloat(document.getElementById("mgrBookAmount")?.value || "0") || 0);
        if (amount <= 0) return showToast("Please enter a valid booking amount");
        payload.date = managerFinanceDate;
        payload.amount = amount;
      }

      try {
        const res = await fetch("/api/room-bookings", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to record booking");
        }

        if (data.isMultiDay) {
          showToast(\`Multi-day stay booked! \${data.nights} nights (₹\${formatCurrency(data.total_stay_amount)}). Lodging totals updated.\`);
        } else {
          showToast("Room booked successfully! Lodging total updated.");
        }

        const amountInput = document.getElementById("mgrBookAmount");
        const guestInput = document.getElementById("mgrBookGuest");
        const notesInput = document.getElementById("mgrBookNotes");
        if (amountInput) amountInput.value = "";
        if (guestInput) guestInput.value = "";
        if (notesInput) notesInput.value = "";

        await Promise.all([fetchRoomBookings(), fetchFinances()]);
        renderFinancesView();
      } catch (err) {
        showToast("Error saving booking: " + err.message);
      }
    }

    async function deleteRoomBooking(bookingId) {
      if (!bookingId) return;
      const bk = roomBookingsList.find(b => b.id === bookingId);
      let deleteGroup = false;

      if (bk && bk.group_booking_id) {
        const stayDesc = (bk.check_in_date && bk.check_out_date) ? \` (\${bk.check_in_date} to \${bk.check_out_date})\` : '';
        const msg = \`This booking is part of a multi-day stay\${stayDesc}.\\n\\nClick OK to cancel the ENTIRE multi-day stay.\\nClick Cancel if you only want to delete THIS SINGLE DAY's booking.\`;
        if (confirm(msg)) {
          deleteGroup = true;
        } else {
          if (!confirm("Confirm deleting ONLY this single day's booking? Lodging revenue will adjust accordingly.")) {
            return;
          }
          deleteGroup = false;
        }
      } else {
        if (!confirm("Are you sure you want to remove this room booking? Lodging revenue will adjust automatically.")) {
          return;
        }
      }

      try {
        let url = "/api/room-bookings/" + bookingId;
        if (deleteGroup) url += "?delete_group=true";
        const res = await fetch(url, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to delete booking");
        }
        showToast(deleteGroup ? "Entire multi-day stay deleted. Lodging revenue re-calculated." : "Booking deleted. Lodging revenue re-calculated.");
        await Promise.all([fetchRoomBookings(), fetchFinances()]);
        renderFinancesView();
      } catch (err) {
        showToast("Error deleting booking: " + err.message);
      }
    }

    function calculateMgrFinanceLiveTotals() {
      const propId = currentManagerInfo?.property_id || "";
      const currentProp = properties.find(p => p.id === propId) || {};
      const hasLodging = currentProp.has_lodging === 1;
      const hasFooding = currentProp.has_fooding === 1;
      const hasServices = currentProp.has_services === 1;

      let lodgingSub = 0;
      if (hasLodging) {
        const todayBookings = roomBookingsList.filter(b => b.property_id === propId && b.date === managerFinanceDate);
        const lo = todayBookings.filter(b => b.payment_mode === "online").reduce((sum, b) => sum + (b.amount || 0), 0);
        const lc = todayBookings.filter(b => b.payment_mode === "cash").reduce((sum, b) => sum + (b.amount || 0), 0);
        lodgingSub = lo + lc;
        const elLodging = document.getElementById("mgrLodgingSubtotal");
        if (elLodging) elLodging.innerText = formatCurrency(lodgingSub);
      }

      let foodingSub = 0;
      if (hasFooding) {
        const fo = Math.max(0, parseFloat(document.getElementById("mgrFoodingOnline")?.value || "0") || 0);
        const fc = Math.max(0, parseFloat(document.getElementById("mgrFoodingCash")?.value || "0") || 0);
        foodingSub = fo + fc;
        const elFooding = document.getElementById("mgrFoodingSubtotal");
        if (elFooding) elFooding.innerText = formatCurrency(foodingSub);
      }

      let servicesSub = 0;
      if (hasServices) {
        const so = Math.max(0, parseFloat(document.getElementById("mgrServicesOnline")?.value || "0") || 0);
        const sc = Math.max(0, parseFloat(document.getElementById("mgrServicesCash")?.value || "0") || 0);
        servicesSub = so + sc;
        const elServices = document.getElementById("mgrServicesSubtotal");
        if (elServices) elServices.innerText = formatCurrency(servicesSub);
      }

      const os = Math.max(0, parseFloat(document.getElementById("mgrOtherSales")?.value || "0") || 0);
      const exp = Math.max(0, parseFloat(document.getElementById("mgrExpensesTotal")?.value || "0") || 0);

      const totalSales = lodgingSub + foodingSub + servicesSub + os;
      const netProfit = totalSales - exp;

      const elSales = document.getElementById("mgrTotalSalesDisplay");
      if (elSales) elSales.innerText = formatCurrency(totalSales);

      const elNet = document.getElementById("mgrNetRevenueDisplay");
      if (elNet) {
        elNet.innerText = formatCurrency(netProfit);
        if (netProfit < 0) {
          elNet.parentElement.className = "text-2xl sm:text-3xl font-black font-mono text-rose-400";
        } else {
          elNet.parentElement.className = "text-2xl sm:text-3xl font-black font-mono text-emerald-400";
        }
      }
    }

    async function saveManagerDailyFinance() {
      if (!currentManagerInfo || !currentManagerInfo.property_id) {
        return showToast("Error: Manager assigned property not found");
      }
      const propId = currentManagerInfo.property_id;
      const currentProp = properties.find(p => p.id === propId) || {};
      const hasLodging = currentProp.has_lodging === 1;
      const hasFooding = currentProp.has_fooding === 1;
      const hasServices = currentProp.has_services === 1;
      const date = managerFinanceDate;

      // Lodging is automatically computed from room bookings if lodging is active
      let lodgingOnline = 0;
      let lodgingCash = 0;
      if (hasLodging) {
        const todayBookings = roomBookingsList.filter(b => b.property_id === propId && b.date === date);
        lodgingOnline = todayBookings.filter(b => b.payment_mode === "online").reduce((sum, b) => sum + (b.amount || 0), 0);
        lodgingCash = todayBookings.filter(b => b.payment_mode === "cash").reduce((sum, b) => sum + (b.amount || 0), 0);
      }

      const foodingOnline = hasFooding ? Math.max(0, parseFloat(document.getElementById("mgrFoodingOnline")?.value || "0") || 0) : 0;
      const foodingCash = hasFooding ? Math.max(0, parseFloat(document.getElementById("mgrFoodingCash")?.value || "0") || 0) : 0;
      const servicesOnline = hasServices ? Math.max(0, parseFloat(document.getElementById("mgrServicesOnline")?.value || "0") || 0) : 0;
      const servicesCash = hasServices ? Math.max(0, parseFloat(document.getElementById("mgrServicesCash")?.value || "0") || 0) : 0;

      const otherSales = Math.max(0, parseFloat(document.getElementById("mgrOtherSales")?.value || "0") || 0);
      const expensesTotal = Math.max(0, parseFloat(document.getElementById("mgrExpensesTotal")?.value || "0") || 0);
      const expenseNotes = document.getElementById("mgrExpenseNotes")?.value?.trim() || "";
      const notes = document.getElementById("mgrNotes")?.value?.trim() || "";

      try {
        const res = await fetch("/api/finances", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            property_id: propId,
            date,
            lodging_online: lodgingOnline,
            lodging_cash: lodgingCash,
            lodging_offline: lodgingCash,
            fooding_online: foodingOnline,
            fooding_cash: foodingCash,
            fooding_offline: foodingCash,
            services_online: servicesOnline,
            services_cash: servicesCash,
            other_sales: otherSales,
            expenses_total: expensesTotal,
            expense_notes: expenseNotes,
            notes
          })
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          showToast(data.error || "Failed to save daily record");
          return;
        }

        showToast("Daily Sales & Expenses saved for " + date);
        await fetchFinances();
        renderFinancesView();
      } catch (err) {
        showToast("Error saving record: " + err.message);
      }
    }

    async function changeFinanceDate(delta) {
      const parts = managerFinanceDate.split("-");
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      d.setDate(d.getDate() + delta);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      managerFinanceDate = \`\${year}-\${month}-\${day}\`;
      await fetchRoomBookings({ month: managerFinanceDate.substring(0, 7) });
      renderFinancesView();
    }

    async function goToFinanceToday() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      managerFinanceDate = \`\${year}-\${month}-\${day}\`;
      await fetchRoomBookings({ month: managerFinanceDate.substring(0, 7) });
      renderFinancesView();
    }

    async function onManagerFinanceDateChange(val) {
      if (val) {
        managerFinanceDate = val;
        await fetchRoomBookings({ month: managerFinanceDate.substring(0, 7) });
        renderFinancesView();
      }
    }

    async function setManagerFinanceDate(dateStr) {
      if (dateStr) {
        managerFinanceDate = dateStr;
        await fetchRoomBookings({ month: managerFinanceDate.substring(0, 7) });
        renderFinancesView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // -------------------------------------------------------------------------
    // ADMIN FINANCES, ROOM BOOKINGS CALENDAR, ROOMS & BUSINESS OFFERINGS
    // -------------------------------------------------------------------------
    function renderAdminFinancesView(container) {
      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Admin Subnavigation Tabs -->
          <div class="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-full sm:w-auto self-start overflow-x-auto">
            <button
              type="button"
              onclick="setAdminFinanceSubTab('dashboard')"
              class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 \${adminFinanceSubTab === 'dashboard' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
              <span>Financial Performance</span>
            </button>
            <button
              type="button"
              onclick="setAdminFinanceSubTab('calendar')"
              class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 \${adminFinanceSubTab === 'calendar' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              <i data-lucide="calendar" class="w-4 h-4"></i>
              <span>Room Bookings Calendar</span>
            </button>
            <button
              type="button"
              onclick="setAdminFinanceSubTab('rooms')"
              class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 \${adminFinanceSubTab === 'rooms' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              <i data-lucide="door-closed" class="w-4 h-4"></i>
              <span>Manage Rooms</span>
            </button>
            <button
              type="button"
              onclick="setAdminFinanceSubTab('business')"
              class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 \${adminFinanceSubTab === 'business' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              <i data-lucide="sliders" class="w-4 h-4"></i>
              <span>Business Offerings</span>
            </button>
          </div>

          <!-- Subtab Content Container -->
          <div id="adminFinanceSubTabContent"></div>
        </div>
      \`;

      const subContainer = document.getElementById("adminFinanceSubTabContent");
      if (!subContainer) return;

      if (adminFinanceSubTab === "dashboard") {
        renderAdminFinancialDashboard(subContainer);
      } else if (adminFinanceSubTab === "calendar") {
        renderAdminRoomCalendarView(subContainer);
      } else if (adminFinanceSubTab === "rooms") {
        renderAdminRoomsManagement(subContainer);
      } else if (adminFinanceSubTab === "business") {
        renderAdminBusinessSetup(subContainer);
      }
    }

    function setAdminFinanceSubTab(subTab) {
      adminFinanceSubTab = subTab;
      renderFinancesView();
    }

    // -------------------------------------------------------------------------
    // SUBTAB 1: ADMIN FINANCIAL DASHBOARD
    // -------------------------------------------------------------------------
    function renderAdminFinancialDashboard(container) {
      const records = financeFilterProperty === "all"
        ? financesList
        : financesList.filter(f => f.property_id === financeFilterProperty);

      let totalLodgingOnline = 0;
      let totalLodgingCash = 0;
      let totalFoodingOnline = 0;
      let totalFoodingCash = 0;
      let totalServicesOnline = 0;
      let totalServicesCash = 0;
      let totalOtherSales = 0;
      let totalExpenses = 0;

      records.forEach(r => {
        totalLodgingOnline += (r.lodging_online || 0);
        const rLodgingCash = r.lodging_cash ?? r.lodging_offline ?? 0;
        const rFoodingCash = r.fooding_cash ?? r.fooding_offline ?? 0;
        totalLodgingCash += rLodgingCash;
        totalFoodingOnline += (r.fooding_online || 0);
        totalFoodingCash += rFoodingCash;
        totalServicesOnline += (r.services_online || 0);
        totalServicesCash += (r.services_cash || 0);
        totalOtherSales += (r.other_sales || 0);
        totalExpenses += (r.expenses_total || 0);
      });

      const totalLodging = totalLodgingOnline + totalLodgingCash;
      const totalFooding = totalFoodingOnline + totalFoodingCash;
      const totalServices = totalServicesOnline + totalServicesCash;
      const grossRevenue = totalLodging + totalFooding + totalServices + totalOtherSales;
      const netOperatingProfit = grossRevenue - totalExpenses;
      const profitMarginPct = grossRevenue > 0 ? Math.round((netOperatingProfit / grossRevenue) * 100) : 0;

      const selectedProp = financeFilterProperty !== "all" ? properties.find(p => p.id === financeFilterProperty) : null;
      const showLodgingCard = !selectedProp || selectedProp.has_lodging === 1;
      const showFoodingCard = !selectedProp || selectedProp.has_fooding === 1;
      const showServicesCard = !selectedProp || selectedProp.has_services === 1;

      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Admin Filter & Action Bar -->
          <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Property Filter -->
              <div class="flex items-center gap-1.5">
                <label for="adminFinancePropertySelect" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</label>
                <select
                  id="adminFinancePropertySelect"
                  onchange="onAdminFinanceFilterChange(this.value)"
                  class="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-slate-800 cursor-pointer"
                >
                  <option value="all" \${financeFilterProperty === 'all' ? 'selected' : ''}>All Businesses (\${properties.length})</option>
                  \${properties.map(p => {
                    const ti = getBusinessTypeInfo(p);
                    return \`
                      <option value="\${p.id}" \${financeFilterProperty === p.id ? 'selected' : ''}>\${escapeHtml(p.name)} (\${escapeHtml(ti.label)})</option>
                    \`;
                  }).join("")}
                </select>
              </div>

              <!-- Month Selector -->
              <div class="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button onclick="changeFinanceMonth(-1)" title="Previous Month" class="w-7 h-7 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition cursor-pointer">
                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                </button>
                <span id="adminFinanceMonthLabel" class="px-2.5 text-xs font-bold text-slate-800 min-w-[110px] text-center select-none">
                  \${MONTH_NAMES[financeMonth]} \${financeYear}
                </span>
                <button onclick="changeFinanceMonth(1)" title="Next Month" class="w-7 h-7 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition cursor-pointer">
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
              <button onclick="goToFinanceCurrentMonth()" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                Current
              </button>
            </div>

            <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onclick="openFinanceModal()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Add Record</span>
              </button>
              <button
                type="button"
                onclick="exportFinancesCSV()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Executive Summary Cards -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <!-- Card 1: Gross Revenue -->
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Gross Revenue</span>
                  <i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-indigo-500"></i>
                </div>
                <div class="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1">₹\${formatCurrency(grossRevenue)}</div>
              </div>
              <div class="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
                \${records.length} daily entries
              </div>
            </div>

            <!-- Card 2: Lodging Sales -->
            <div class="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col justify-between \${showLodgingCard ? '' : 'opacity-50'}">
              <div>
                <div class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Lodging Sales</span>
                  <i data-lucide="hotel" class="w-3.5 h-3.5 text-indigo-500"></i>
                </div>
                <div class="text-lg sm:text-xl font-black text-indigo-950 font-mono mt-1">
                  \${showLodgingCard ? \`₹\${formatCurrency(totalLodging)}\` : 'N/A'}
                </div>
              </div>
              <div class="text-[10px] text-indigo-800 mt-2 pt-2 border-t border-indigo-50 font-medium truncate">
                \${showLodgingCard ? \`On: ₹\${formatCurrency(totalLodgingOnline)} · Cash: ₹\${formatCurrency(totalLodgingCash)}\` : 'Non-lodging business'}
              </div>
            </div>

            <!-- Card 3: Fooding Sales -->
            <div class="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between \${showFoodingCard ? '' : 'opacity-50'}">
              <div>
                <div class="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Fooding Sales</span>
                  <i data-lucide="utensils" class="w-3.5 h-3.5 text-amber-500"></i>
                </div>
                <div class="text-lg sm:text-xl font-black text-amber-950 font-mono mt-1">
                  \${showFoodingCard ? \`₹\${formatCurrency(totalFooding)}\` : 'N/A'}
                </div>
              </div>
              <div class="text-[10px] text-amber-800 mt-2 pt-2 border-t border-amber-50 font-medium truncate">
                \${showFoodingCard ? \`On: ₹\${formatCurrency(totalFoodingOnline)} · Cash: ₹\${formatCurrency(totalFoodingCash)}\` : 'No fooding module'}
              </div>
            </div>

            <!-- Card 4: Services Sales -->
            <div class="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-xs flex flex-col justify-between \${showServicesCard ? '' : 'opacity-50'}">
              <div>
                <div class="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Services Sales</span>
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-500"></i>
                </div>
                <div class="text-lg sm:text-xl font-black text-purple-950 font-mono mt-1">
                  \${showServicesCard ? \`₹\${formatCurrency(totalServices)}\` : 'N/A'}
                </div>
              </div>
              <div class="text-[10px] text-purple-800 mt-2 pt-2 border-t border-purple-50 font-medium truncate">
                \${showServicesCard ? \`On: ₹\${formatCurrency(totalServicesOnline)} · Cash: ₹\${formatCurrency(totalServicesCash)}\` : 'No services module'}
              </div>
            </div>

            <!-- Card 5: Operating Expenses -->
            <div class="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Total Expenses</span>
                  <i data-lucide="receipt" class="w-3.5 h-3.5 text-rose-500"></i>
                </div>
                <div class="text-lg sm:text-xl font-black text-rose-700 font-mono mt-1">₹\${formatCurrency(totalExpenses)}</div>
              </div>
              <div class="text-[11px] text-rose-700 mt-2 pt-2 border-t border-rose-50 font-medium">
                \${grossRevenue > 0 ? Math.round((totalExpenses / grossRevenue) * 100) : 0}% expense ratio
              </div>
            </div>

            <!-- Card 6: Net Operating Profit -->
            <div class="bg-white p-3.5 rounded-2xl border \${netOperatingProfit < 0 ? 'border-rose-200' : 'border-emerald-200'} shadow-xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold \${netOperatingProfit < 0 ? 'text-rose-600' : 'text-emerald-700'} uppercase tracking-wider flex items-center justify-between">
                  <span>Net Profit</span>
                  <i data-lucide="trending-up" class="w-3.5 h-3.5 \${netOperatingProfit < 0 ? 'text-rose-500' : 'text-emerald-600'}"></i>
                </div>
                <div class="text-lg sm:text-xl font-black font-mono mt-1 \${netOperatingProfit < 0 ? 'text-rose-600' : 'text-emerald-700'}">
                  ₹\${formatCurrency(netOperatingProfit)}
                </div>
              </div>
              <div class="text-[11px] mt-2 pt-2 border-t \${netOperatingProfit < 0 ? 'border-rose-50 text-rose-600' : 'border-emerald-50 text-emerald-800'} font-medium">
                Margin: \${profitMarginPct}%
              </div>
            </div>
          </div>

          <!-- Business Performance Comparison (when All Businesses selected) -->
          \${financeFilterProperty === 'all' && properties.length > 0 ? \`
            <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-600"></i>
                Business Performance Comparison (\${MONTH_NAMES[financeMonth]} \${financeYear})
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                \${properties.map(p => {
                  const propRecords = records.filter(r => r.property_id === p.id);
                  let pSales = 0, pExp = 0;
                  let pLodgingOn = 0, pLodgingCash = 0, pFoodingOn = 0, pFoodingCash = 0, pServicesOn = 0, pServicesCash = 0;
                  propRecords.forEach(r => {
                    pSales += (r.total_sales || 0);
                    pExp += (r.expenses_total || 0);
                    const rLodgingCash = r.lodging_cash ?? r.lodging_offline ?? 0;
                    const rFoodingCash = r.fooding_cash ?? r.fooding_offline ?? 0;
                    pLodgingOn += (r.lodging_online || 0);
                    pLodgingCash += rLodgingCash;
                    pFoodingOn += (r.fooding_online || 0);
                    pFoodingCash += rFoodingCash;
                    pServicesOn += (r.services_online || 0);
                    pServicesCash += (r.services_cash || 0);
                  });
                  const pLodging = pLodgingOn + pLodgingCash;
                  const pFooding = pFoodingOn + pFoodingCash;
                  const pServices = pServicesOn + pServicesCash;
                  const pNet = pSales - pExp;
                  const ti = getBusinessTypeInfo(p);

                  return \`
                    <div class="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between gap-2 shadow-2xs">
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-black text-slate-900">\${escapeHtml(p.name)}</span>
                          <span class="text-[10px] px-2 py-0.5 rounded-md font-bold \${ti.badgeClass}">\${escapeHtml(ti.label)}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-medium">\${propRecords.length} entries recorded</div>
                      </div>

                      <div class="grid grid-cols-2 gap-1.5 text-xs py-1">
                        <div>
                          <span class="text-[10px] text-slate-400 uppercase font-semibold">Gross Sales</span>
                          <div class="font-bold font-mono text-emerald-700">₹\${formatCurrency(pSales)}</div>
                        </div>
                        <div>
                          <span class="text-[10px] text-slate-400 uppercase font-semibold">Expenses</span>
                          <div class="font-bold font-mono text-rose-700">₹\${formatCurrency(pExp)}</div>
                        </div>
                      </div>

                      <div class="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span class="text-slate-500">Net Profit:</span>
                        <span class="font-bold font-mono \${pNet < 0 ? 'text-rose-600' : 'text-emerald-700'}">₹\${formatCurrency(pNet)}</span>
                      </div>

                      <!-- Itemized Active Offerings Only -->
                      <div class="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                        \${p.has_lodging === 1 ? \`<div>Lodging: <strong class="text-indigo-900 font-mono">₹\${formatCurrency(pLodging)}</strong> <span class="text-slate-400">(On ₹\${formatCurrency(pLodgingOn)} · Cs ₹\${formatCurrency(pLodgingCash)})</span></div>\` : ''}
                        \${p.has_fooding === 1 ? \`<div>Fooding: <strong class="text-amber-900 font-mono">₹\${formatCurrency(pFooding)}</strong> <span class="text-slate-400">(On ₹\${formatCurrency(pFoodingOn)} · Cs ₹\${formatCurrency(pFoodingCash)})</span></div>\` : ''}
                        \${p.has_services === 1 ? \`<div>\${escapeHtml(p.services_label || 'Services')}: <strong class="text-purple-900 font-mono">₹\${formatCurrency(pServices)}</strong> <span class="text-slate-400">(On ₹\${formatCurrency(pServicesOn)} · Cs ₹\${formatCurrency(pServicesCash)})</span></div>\` : ''}
                      </div>
                    </div>
                  \`;
                }).join("")}
              </div>
            </div>
          \` : ''}

          <!-- Itemized Daily Records Table (Desktop) & Cards (Mobile) -->
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="table" class="w-4 h-4 text-slate-500"></i>
                  Daily Breakdown Records
                </h4>
                <p class="text-[11px] text-slate-400">Detailed logs submitted by property managers and admin</p>
              </div>
              <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                \${records.length} Records
              </span>
            </div>

            \${records.length === 0 ? \`
              <div class="text-center py-12 px-4 flex flex-col items-center justify-center">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                  <i data-lucide="receipt" class="w-6 h-6"></i>
                </div>
                <h5 class="text-sm font-bold text-slate-700">No Financial Records Found</h5>
                <p class="text-xs text-slate-400 mt-1 max-w-sm">No daily sales or expenses entered for this month / business yet.</p>
                <button type="button" onclick="openFinanceModal()" class="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer">
                  + Record Daily Sales
                </button>
              </div>
            \` : \`
              <!-- Desktop Table View (md and above) -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-700">
                  <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th class="py-3 px-3.5">Date</th>
                      <th class="py-3 px-3.5">Business</th>
                      <th class="py-3 px-3.5">Revenue Breakdown</th>
                      <th class="py-3 px-3.5">Other</th>
                      <th class="py-3 px-3.5 font-bold text-slate-900">Total Sales</th>
                      <th class="py-3 px-3.5 font-bold text-rose-700">Expenses</th>
                      <th class="py-3 px-3.5 font-bold text-slate-900">Net Profit</th>
                      <th class="py-3 px-3.5">Submitted By</th>
                      <th class="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    \${records.map(r => {
                      const rProp = properties.find(p => p.id === r.property_id);
                      const rLodgingCash = r.lodging_cash ?? r.lodging_offline ?? 0;
                      const rFoodingCash = r.fooding_cash ?? r.fooding_offline ?? 0;
                      const rLodging = (r.lodging_online || 0) + rLodgingCash;
                      const rFooding = (r.fooding_online || 0) + rFoodingCash;
                      const rServices = (r.services_online || 0) + (r.services_cash || 0);
                      const ti = getBusinessTypeInfo(rProp);

                      return \`
                        <tr class="hover:bg-slate-50/80 transition">
                          <td class="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">\${r.date}</td>
                          <td class="py-3 px-3.5 whitespace-nowrap">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                              \${escapeHtml(r.property_name || 'Business')}
                            </span>
                          </td>
                          <td class="py-3 px-3.5 whitespace-nowrap">
                            <div class="space-y-1">
                              \${rLodging > 0 || rProp?.has_lodging === 1 ? \`
                                <div>
                                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">Lodging: ₹\${formatCurrency(rLodging)}</span>
                                  <span class="text-[9px] text-slate-400">(On ₹\${formatCurrency(r.lodging_online)} · Cs ₹\${formatCurrency(rLodgingCash)})</span>
                                </div>
                              \` : ''}
                              \${rFooding > 0 || rProp?.has_fooding === 1 ? \`
                                <div>
                                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700">Fooding: ₹\${formatCurrency(rFooding)}</span>
                                  <span class="text-[9px] text-slate-400">(On ₹\${formatCurrency(r.fooding_online)} · Cs ₹\${formatCurrency(rFoodingCash)})</span>
                                </div>
                              \` : ''}
                              \${rServices > 0 || rProp?.has_services === 1 ? \`
                                <div>
                                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700">\${escapeHtml(rProp?.services_label || 'Services')}: ₹\${formatCurrency(rServices)}</span>
                                  <span class="text-[9px] text-slate-400">(On ₹\${formatCurrency(r.services_online)} · Cs ₹\${formatCurrency(r.services_cash)})</span>
                                </div>
                              \` : ''}
                            </div>
                          </td>
                          <td class="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">₹\${formatCurrency(r.other_sales)}</td>
                          <td class="py-3 px-3.5 font-black text-emerald-700 font-mono whitespace-nowrap">₹\${formatCurrency(r.total_sales)}</td>
                          <td class="py-3 px-3.5 whitespace-nowrap">
                            <div class="font-bold text-rose-700 font-mono">₹\${formatCurrency(r.expenses_total)}</div>
                            \${r.expense_notes ? \`<div class="text-[10px] text-slate-500 italic max-w-[150px] truncate" title="\${escapeHtml(r.expense_notes)}">\${escapeHtml(r.expense_notes)}</div>\` : ''}
                          </td>
                          <td class="py-3 px-3.5 font-black font-mono whitespace-nowrap \${(r.net_revenue || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'}">
                            ₹\${formatCurrency(r.net_revenue)}
                          </td>
                          <td class="py-3 px-3.5 text-[11px] text-slate-500 whitespace-nowrap">\${escapeHtml(r.submitted_by || 'Staff')}</td>
                          <td class="py-3 px-3.5 text-right whitespace-nowrap">
                            <div class="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onclick="openFinanceModal('\${r.id}')"
                                title="Edit Record"
                                class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                              >
                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                              </button>
                              <button
                                type="button"
                                onclick="handleDeleteFinance('\${r.id}')"
                                title="Delete Record"
                                class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      \`;
                    }).join("")}
                  </tbody>
                </table>
              </div>

              <!-- Mobile Cards View (< md) -->
              <div class="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                \${records.map(r => {
                  const rProp = properties.find(p => p.id === r.property_id);
                  const rLodgingCash = r.lodging_cash ?? r.lodging_offline ?? 0;
                  const rFoodingCash = r.fooding_cash ?? r.fooding_offline ?? 0;
                  const rLodging = (r.lodging_online || 0) + rLodgingCash;
                  const rFooding = (r.fooding_online || 0) + rFoodingCash;
                  const rServices = (r.services_online || 0) + (r.services_cash || 0);

                  return \`
                    <div class="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-2.5 shadow-2xs">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-slate-900">\${r.date}</span>
                          <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                            \${escapeHtml(r.property_name || 'Business')}
                          </span>
                        </div>
                        <div class="flex items-center gap-1">
                          <button type="button" onclick="openFinanceModal('\${r.id}')" class="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 cursor-pointer">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          </button>
                          <button type="button" onclick="handleDeleteFinance('\${r.id}')" class="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 cursor-pointer">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                        \${rProp?.has_lodging === 1 ? \`
                          <div>
                            <span class="text-[10px] font-bold text-indigo-700 uppercase">Lodging</span>
                            <div class="font-mono font-bold text-indigo-950">₹\${formatCurrency(rLodging)}</div>
                            <div class="text-[9px] text-slate-400">On ₹\${formatCurrency(r.lodging_online)} · Cs ₹\${formatCurrency(rLodgingCash)}</div>
                          </div>
                        \` : ''}
                        \${rProp?.has_fooding === 1 ? \`
                          <div>
                            <span class="text-[10px] font-bold text-amber-700 uppercase">Fooding</span>
                            <div class="font-mono font-bold text-amber-950">₹\${formatCurrency(rFooding)}</div>
                            <div class="text-[9px] text-slate-400">On ₹\${formatCurrency(r.fooding_online)} · Cs ₹\${formatCurrency(rFoodingCash)}</div>
                          </div>
                        \` : ''}
                        \${rProp?.has_services === 1 ? \`
                          <div>
                            <span class="text-[10px] font-bold text-purple-700 uppercase">\${escapeHtml(rProp?.services_label || 'Services')}</span>
                            <div class="font-mono font-bold text-purple-950">₹\${formatCurrency(rServices)}</div>
                            <div class="text-[9px] text-slate-400">On ₹\${formatCurrency(r.services_online)} · Cs ₹\${formatCurrency(r.services_cash)}</div>
                          </div>
                        \` : ''}
                        <div>
                          <span class="text-[10px] font-bold text-slate-500 uppercase">Other Sales</span>
                          <div class="font-mono font-bold text-slate-700">₹\${formatCurrency(r.other_sales)}</div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span class="text-[10px] text-slate-400 uppercase font-semibold">Total Sales</span>
                          <div class="font-black text-emerald-700 font-mono">₹\${formatCurrency(r.total_sales)}</div>
                        </div>
                        <div class="text-center">
                          <span class="text-[10px] text-slate-400 uppercase font-semibold">Expenses</span>
                          <div class="font-bold text-rose-700 font-mono">₹\${formatCurrency(r.expenses_total)}</div>
                        </div>
                        <div class="text-right">
                          <span class="text-[10px] text-slate-400 uppercase font-semibold">Net Profit</span>
                          <div class="font-black font-mono \${(r.net_revenue || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'}">
                            ₹\${formatCurrency(r.net_revenue)}
                          </div>
                        </div>
                      </div>

                      \${r.expense_notes ? \`
                        <div class="text-[10px] text-slate-600 bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                          <strong class="text-rose-800">Expense Notes:</strong> \${escapeHtml(r.expense_notes)}
                        </div>
                      \` : ''}
                    </div>
                  \`;
                }).join("")}
              </div>
            \`}
          </div>
        </div>
      \`;
    }

    // -------------------------------------------------------------------------
    // SUBTAB 2: ADMIN ROOM BOOKINGS CALENDAR (MATRIX & MONTHLY VIEWS)
    // -------------------------------------------------------------------------
    function renderAdminRoomCalendarView(container) {
      if (!calendarSelectedProperty && properties.length > 0) {
        // Prefer a property that has lodging
        const lodgingProp = properties.find(p => p.has_lodging === 1);
        calendarSelectedProperty = lodgingProp ? lodgingProp.id : properties[0].id;
      }
      const prop = properties.find(p => p.id === calendarSelectedProperty) || properties[0];
      const propId = prop ? prop.id : "";
      const propName = prop ? prop.name : "Selected Property";
      const hasLodging = prop ? (prop.has_lodging === 1) : false;

      // If selected property has NO lodging, display a clean notice with a link to Business Offerings
      if (!hasLodging) {
        container.innerHTML = \`
          <div class="space-y-4">
            <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <label for="adminCalPropSelect" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</label>
                <select
                  id="adminCalPropSelect"
                  onchange="setCalendarProperty(this.value)"
                  class="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-slate-800 cursor-pointer"
                >
                  \${properties.map(p => {
                    const ti = getBusinessTypeInfo(p);
                    return \`
                      <option value="\${p.id}" \${p.id === propId ? 'selected' : ''}>\${escapeHtml(p.name)} (\${escapeHtml(ti.label)})</option>
                    \`;
                  }).join("")}
                </select>
              </div>
            </div>

            <div class="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center max-w-xl mx-auto">
              <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <i data-lucide="hotel" class="w-7 h-7"></i>
              </div>
              <h4 class="text-base font-bold text-slate-900">\${escapeHtml(propName)} has no Lodging / Rooms</h4>
              <p class="text-xs text-slate-500 mt-1 max-w-md">
                This business is currently configured as <strong>\${escapeHtml(getBusinessTypeInfo(prop).label)}</strong>. Room bookings and calendar are disabled.
              </p>
              <div class="flex items-center gap-3 mt-5">
                <button
                  type="button"
                  onclick="openBusinessConfigModal('\${propId}')"
                  class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                  <span>Enable Lodging for this Business</span>
                </button>
                <button
                  type="button"
                  onclick="setAdminFinanceSubTab('business')"
                  class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  View Business Offerings
                </button>
              </div>
            </div>
          </div>
        \`;
        return;
      }

      // Rooms for this property
      const propRooms = roomsList.filter(r => r.property_id === propId);

      // Month info
      const mStr = String(financeMonth + 1).padStart(2, "0");
      const currentMonthPrefix = \`\${financeYear}-\${mStr}\`;
      const daysInMonth = new Date(financeYear, financeMonth + 1, 0).getDate();

      // Filter bookings for this property & month
      const monthBookings = roomBookingsList.filter(b => b.property_id === propId && b.date && b.date.startsWith(currentMonthPrefix));

      const totalBookingsCount = monthBookings.length;
      const monthLodgingOnline = monthBookings.filter(b => b.payment_mode === "online").reduce((s, b) => s + (b.amount || 0), 0);
      const monthLodgingCash = monthBookings.filter(b => b.payment_mode === "cash").reduce((s, b) => s + (b.amount || 0), 0);
      const monthLodgingTotal = monthLodgingOnline + monthLodgingCash;

      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Calendar Controls Bar -->
          <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Property Selector -->
              <div class="flex items-center gap-1.5">
                <label for="adminCalPropSelect" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</label>
                <select
                  id="adminCalPropSelect"
                  onchange="setCalendarProperty(this.value)"
                  class="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-slate-800 cursor-pointer"
                >
                  \${properties.map(p => {
                    const ti = getBusinessTypeInfo(p);
                    return \`
                      <option value="\${p.id}" \${p.id === propId ? 'selected' : ''}>\${escapeHtml(p.name)} (\${escapeHtml(ti.label)})</option>
                    \`;
                  }).join("")}
                </select>
              </div>

              <!-- Month Navigation -->
              <div class="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button onclick="changeCalendarMonth(-1)" title="Previous Month" class="w-7 h-7 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition cursor-pointer">
                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                </button>
                <span class="px-2.5 text-xs font-bold text-slate-800 min-w-[110px] text-center select-none">
                  \${MONTH_NAMES[financeMonth]} \${financeYear}
                </span>
                <button onclick="changeCalendarMonth(1)" title="Next Month" class="w-7 h-7 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition cursor-pointer">
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              <button onclick="goToCalendarCurrentMonth()" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                Today
              </button>
            </div>

            <!-- View Switcher & Actions -->
            <div class="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <div class="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onclick="setCalendarViewMode('matrix')"
                  class="px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 \${calendarViewMode === 'matrix' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  <i data-lucide="grid" class="w-3.5 h-3.5"></i>
                  <span>Matrix (Rooms × Days)</span>
                </button>
                <button
                  type="button"
                  onclick="setCalendarViewMode('calendar')"
                  class="px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 \${calendarViewMode === 'calendar' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                  <span>Monthly Grid</span>
                </button>
              </div>

              <button
                type="button"
                onclick="openRoomBookingModal(null, null, null)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>+ Book Room</span>
              </button>
            </div>
          </div>

          <!-- Calendar Summary Stats Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Configured Rooms</span>
              <span class="text-base sm:text-lg font-black text-slate-900">\${propRooms.length} Rooms</span>
            </div>
            <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Month Bookings</span>
              <span class="text-base sm:text-lg font-black text-indigo-600">\${totalBookingsCount} Bookings</span>
            </div>
            <div class="bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs">
              <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Lodging Total</span>
              <span class="text-base sm:text-lg font-black font-mono text-indigo-950">₹\${formatCurrency(monthLodgingTotal)}</span>
            </div>
            <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-[11px] text-slate-600 flex flex-col justify-center">
              <div>Online: <strong class="text-indigo-700 font-mono">₹\${formatCurrency(monthLodgingOnline)}</strong></div>
              <div>Cash: <strong class="text-amber-700 font-mono">₹\${formatCurrency(monthLodgingCash)}</strong></div>
            </div>
          </div>

          <!-- Legend Bar -->
          <div class="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap px-2">
            <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Legend:</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300"></span> Vacant</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Online Booking</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cash Booking</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Multiple Bookings (2x, 3x)</span>
          </div>

          <!-- RENDER MATRIX OR MONTHLY VIEW -->
          \${propRooms.length === 0 ? \`
            <div class="bg-white p-8 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <i data-lucide="door-closed" class="w-6 h-6"></i>
              </div>
              <h5 class="text-sm font-bold text-slate-900">No Rooms Found for \${escapeHtml(propName)}</h5>
              <p class="text-xs text-slate-500 mt-1 max-w-sm">Add rooms (e.g. 101, 102, 103, 104) to enable the room booking calendar.</p>
              <button
                type="button"
                onclick="setAdminFinanceSubTab('rooms')"
                class="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
              >
                Configure Rooms Now
              </button>
            </div>
          \` : (calendarViewMode === 'matrix' ? renderAdminMatrixGrid(propRooms, daysInMonth, currentMonthPrefix, monthBookings) : renderAdminMonthlyGrid(propRooms, daysInMonth, currentMonthPrefix, monthBookings))}
        </div>
      \`;
    }

    // Helper: Matrix Grid (Rooms x Days)
    function renderAdminMatrixGrid(propRooms, daysInMonth, currentMonthPrefix, monthBookings) {
      const todayIso = new Date().toISOString().split("T")[0];
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      return \`
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                  <th class="py-3 px-3.5 sticky left-0 z-20 bg-slate-100 min-w-[130px] shadow-xs">Room</th>
                  \${days.map(d => {
                    const dayStr = String(d).padStart(2, "0");
                    const dateStr = \`\${currentMonthPrefix}-\${dayStr}\`;
                    const isToday = dateStr === todayIso;
                    const dateObj = new Date(financeYear, financeMonth, d);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                    return \`
                      <th class="py-2.5 px-2 text-center min-w-[48px] border-l border-slate-200/60 \${isToday ? 'bg-indigo-100/70 text-indigo-900 font-black' : ''}">
                        <div>\${d}</div>
                        <div class="text-[9px] font-normal text-slate-400">\${dayName}</div>
                      </th>
                    \`;
                  }).join("")}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                \${propRooms.map(rm => {
                  return \`
                    <tr class="hover:bg-slate-50/70 transition">
                      <td class="py-2.5 px-3.5 sticky left-0 z-10 bg-white shadow-xs font-bold text-slate-900 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <i data-lucide="door-closed" class="w-3.5 h-3.5 text-indigo-600"></i>
                          <span>Room \${escapeHtml(rm.room_number)}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-normal">\${escapeHtml(rm.room_type || 'Standard')} · ₹\${formatCurrency(rm.base_price || 0)}</div>
                      </td>

                      \${days.map(d => {
                        const dayStr = String(d).padStart(2, "0");
                        const dateStr = \`\${currentMonthPrefix}-\${dayStr}\`;
                        const isToday = dateStr === todayIso;
                        const cellBookings = monthBookings.filter(b => b.room_id === rm.id && b.date === dateStr);
                        const count = cellBookings.length;

                        if (count === 0) {
                          return \`
                            <td
                              onclick="openRoomBookingModal('\${rm.id}', '\${dateStr}', null)"
                              title="Vacant - Click to book"
                              class="py-2 px-1 text-center border-l border-slate-100 hover:bg-indigo-50/50 cursor-pointer transition select-none \${isToday ? 'bg-indigo-50/20' : ''}"
                            >
                              <span class="inline-block w-2 h-2 rounded-full bg-slate-200 hover:bg-indigo-400 transition"></span>
                            </td>
                          \`;
                        } else if (count === 1) {
                          const bk = cellBookings[0];
                          const isOnline = bk.payment_mode === "online";
                          const isMultiDay = !!bk.group_booking_id;
                          const kAmt = Math.round(bk.amount / 1000 * 10) / 10;
                          const stayInfo = isMultiDay ? \` (Multi-day stay: \${bk.check_in_date || ''} to \${bk.check_out_date || ''})\` : '';
                          return \`
                            <td
                              onclick="openRoomDayDetail('\${rm.id}', '\${dateStr}')"
                              title="Booked: ₹\${formatCurrency(bk.amount)} (\${isOnline ? 'Online' : 'Cash'}) - \${bk.guest_name || 'Guest'}\${stayInfo}"
                              class="py-1 px-1 text-center border-l border-slate-100 cursor-pointer transition \${isToday ? 'bg-indigo-50/40' : ''}"
                            >
                              <span class="inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded-lg text-[10px] font-bold font-mono shadow-2xs hover:scale-105 transition \${isOnline ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' : 'bg-amber-100 text-amber-900 border border-amber-200'}">
                                <span>₹\${kAmt}k</span>
                                <span class="text-[8px] uppercase tracking-tighter opacity-80">\${isOnline ? 'On' : 'Cs'}\${isMultiDay ? '·Stay' : ''}</span>
                              </span>
                            </td>
                          \`;
                        } else {
                          const totalAmt = cellBookings.reduce((s, b) => s + (b.amount || 0), 0);
                          const kAmt = Math.round(totalAmt / 1000 * 10) / 10;
                          return \`
                            <td
                              onclick="openRoomDayDetail('\${rm.id}', '\${dateStr}')"
                              title="\${count} Bookings: ₹\${formatCurrency(totalAmt)} - Click to view details"
                              class="py-1 px-1 text-center border-l border-slate-100 cursor-pointer transition \${isToday ? 'bg-indigo-50/40' : ''}"
                            >
                              <span class="inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs hover:scale-105 transition">
                                <span>\${count}x</span>
                                <span class="text-[8px]">₹\${kAmt}k</span>
                              </span>
                            </td>
                          \`;
                        }
                      }).join("")}
                    </tr>
                  \`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      \`;
    }

    // Helper: Monthly 7-Day Grid Calendar View
    function renderAdminMonthlyGrid(propRooms, daysInMonth, currentMonthPrefix, monthBookings) {
      const todayIso = new Date().toISOString().split("T")[0];
      const firstDayOfWeek = new Date(financeYear, financeMonth, 1).getDay();
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      return \`
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
          <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase py-1 border-b border-slate-100">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div class="grid grid-cols-7 gap-1.5">
            \${Array.from({ length: firstDayOfWeek }).map(() => \`
              <div class="min-h-[85px] bg-slate-50/40 rounded-xl border border-dashed border-slate-100"></div>
            \`).join("")}

            \${days.map(d => {
              const dayStr = String(d).padStart(2, "0");
              const dateStr = \`\${currentMonthPrefix}-\${dayStr}\`;
              const isToday = dateStr === todayIso;
              const dateBookings = monthBookings.filter(b => b.date === dateStr);
              const totalDay = dateBookings.reduce((s, b) => s + (b.amount || 0), 0);
              const bookedRoomsCount = new Set(dateBookings.map(b => b.room_id)).size;

              return \`
                <div
                  onclick="setManagerFinanceDate('\${dateStr}'); setAdminFinanceSubTab('dashboard');"
                  class="min-h-[90px] p-2 rounded-2xl border transition flex flex-col justify-between cursor-pointer \${isToday ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-slate-50/50 hover:bg-white border-slate-200'}"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold \${isToday ? 'text-indigo-600 font-black' : 'text-slate-800'}">\${d}</span>
                    \${dateBookings.length > 0 ? \`
                      <span class="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-indigo-100 text-indigo-800">
                        \${bookedRoomsCount}/\${propRooms.length}
                      </span>
                    \` : ''}
                  </div>

                  <div class="space-y-1 my-1 overflow-hidden">
                    \${dateBookings.slice(0, 2).map(b => {
                      const isOnline = b.payment_mode === "online";
                      return \`
                        <div class="text-[9px] truncate font-medium px-1.5 py-0.5 rounded-md \${isOnline ? 'bg-indigo-100/80 text-indigo-900' : 'bg-amber-100/80 text-amber-900'}">
                          Rm \${escapeHtml(b.room_number)} · ₹\${Math.round(b.amount/1000*10)/10}k
                        </div>
                      \`;
                    }).join("")}
                    \${dateBookings.length > 2 ? \`
                      <div class="text-[8px] text-slate-400 font-bold text-center">+\${dateBookings.length - 2} more</div>
                    \` : ''}
                  </div>

                  <div class="pt-1 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                    <span class="text-slate-400 font-medium">\${dateBookings.length ? 'Total:' : 'Vacant'}</span>
                    <span class="font-mono font-bold \${totalDay > 0 ? 'text-indigo-950' : 'text-slate-400'}">
                      \${totalDay > 0 ? \`₹\${formatCurrency(totalDay)}\` : '—'}
                    </span>
                  </div>
                </div>
              \`;
            }).join("")}
          </div>
        </div>
      \`;
    }

    async function setCalendarProperty(propId) {
      calendarSelectedProperty = propId;
      await fetchRoomBookings({ property_id: propId });
      renderFinancesView();
    }

    function setCalendarViewMode(mode) {
      calendarViewMode = mode;
      renderFinancesView();
    }

    async function changeCalendarMonth(delta) {
      financeMonth += delta;
      if (financeMonth < 0) {
        financeMonth = 11;
        financeYear--;
      } else if (financeMonth > 11) {
        financeMonth = 0;
        financeYear++;
      }
      await fetchRoomBookings();
      renderFinancesView();
    }

    async function goToCalendarCurrentMonth() {
      financeMonth = new Date().getMonth();
      financeYear = new Date().getFullYear();
      await fetchRoomBookings();
      renderFinancesView();
    }

    // -------------------------------------------------------------------------
    // SUBTAB 3: ADMIN ROOM MANAGEMENT (ADD, BULK ADD, EDIT, DELETE ROOMS)
    // -------------------------------------------------------------------------
    function renderAdminRoomsManagement(container) {
      if (!calendarSelectedProperty && properties.length > 0) {
        const lodgingProp = properties.find(p => p.has_lodging === 1);
        calendarSelectedProperty = lodgingProp ? lodgingProp.id : properties[0].id;
      }
      const propId = calendarSelectedProperty || (properties[0] ? properties[0].id : "");
      const prop = properties.find(p => p.id === propId) || properties[0];
      const hasLodging = prop ? (prop.has_lodging === 1) : false;
      const propRooms = roomsList.filter(r => r.property_id === propId);

      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Property Filter Bar -->
          <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <label for="adminManageRoomsProp" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</label>
              <select
                id="adminManageRoomsProp"
                onchange="calendarSelectedProperty = this.value; renderFinancesView();"
                class="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-slate-800 cursor-pointer"
              >
                \${properties.map(p => {
                  const ti = getBusinessTypeInfo(p);
                  return \`
                    <option value="\${p.id}" \${p.id === propId ? 'selected' : ''}>\${escapeHtml(p.name)} (\${escapeHtml(ti.label)})</option>
                  \`;
                }).join("")}
              </select>
              \${hasLodging ? \`
                <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                  \${propRooms.length} Rooms
                </span>
              \` : ''}
            </div>

            \${hasLodging ? \`
              <button
                type="button"
                onclick="openManageRoomModal(null)"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>+ Add Single Room</span>
              </button>
            \` : \`
              <button
                type="button"
                onclick="openBusinessConfigModal('\${propId}')"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer self-start sm:self-auto"
              >
                <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                <span>Enable Lodging</span>
              </button>
            \`}
          </div>

          \${!hasLodging ? \`
            <div class="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center max-w-lg mx-auto">
              <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                <i data-lucide="door-closed" class="w-6 h-6"></i>
              </div>
              <h5 class="text-sm font-bold text-slate-900">\${escapeHtml(prop ? prop.name : 'Business')} has no Lodging / Rooms</h5>
              <p class="text-xs text-slate-500 mt-1 max-w-sm">This business is configured as <strong>\${escapeHtml(getBusinessTypeInfo(prop).label)}</strong>. Room management is not active for this business.</p>
              <button
                type="button"
                onclick="openBusinessConfigModal('\${propId}')"
                class="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
              >
                Configure Offerings
              </button>
            </div>
          \` : \`
            <!-- Quick Bulk Add Rooms Card -->
            <div class="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-4 sm:p-5 rounded-3xl border border-indigo-100 space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <i data-lucide="layers" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-indigo-950 uppercase tracking-wider">Quick Bulk Add Rooms</h4>
                    <p class="text-[11px] text-indigo-700/80">Add multiple rooms in one go (e.g. 101, 102, 103, 104)</p>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-indigo-950 mb-1">Room Numbers (Comma Separated) *</label>
                  <input
                    type="text"
                    id="adminBulkRoomNumbers"
                    placeholder="101, 102, 103, 104, 201, 202"
                    class="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-indigo-950 mb-1">Room Type</label>
                  <input
                    type="text"
                    id="adminBulkRoomType"
                    value="Standard"
                    placeholder="Standard, Deluxe"
                    class="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-indigo-950 mb-1">Base Price ₹</label>
                  <input
                    type="number"
                    id="adminBulkBasePrice"
                    value="2000"
                    step="1"
                    min="0"
                    placeholder="2000"
                    class="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="button"
                  onclick="bulkAddAdminRooms()"
                  class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                  <span>Bulk Add Rooms to \${escapeHtml(prop ? prop.name : 'Property')}</span>
                </button>
              </div>
            </div>

            <!-- Rooms List Table -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="door-closed" class="w-4 h-4 text-indigo-600"></i>
                  Configured Rooms for \${escapeHtml(prop ? prop.name : 'Property')}
                </h4>
                <span class="text-xs font-semibold text-slate-500">\${propRooms.length} Active</span>
              </div>

              \${propRooms.length === 0 ? \`
                <div class="p-8 text-center text-xs text-slate-400">
                  No rooms added for this business yet. Use the Quick Bulk Add form above to add rooms (101, 102, 103, 104).
                </div>
              \` : \`
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs text-slate-700">
                    <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th class="py-3 px-4">Room Number</th>
                        <th class="py-3 px-4">Type</th>
                        <th class="py-3 px-4">Base Price</th>
                        <th class="py-3 px-4">Status</th>
                        <th class="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      \${propRooms.map(rm => \`
                        <tr class="hover:bg-slate-50/80 transition">
                          <td class="py-3 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                            Room \${escapeHtml(rm.room_number)}
                          </td>
                          <td class="py-3 px-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                              \${escapeHtml(rm.room_type || 'Standard')}
                            </span>
                          </td>
                          <td class="py-3 px-4 font-mono font-bold text-indigo-900 whitespace-nowrap">
                            ₹\${formatCurrency(rm.base_price || 0)}
                          </td>
                          <td class="py-3 px-4 whitespace-nowrap">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </td>
                          <td class="py-3 px-4 text-right whitespace-nowrap">
                            <div class="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onclick="openManageRoomModal('\${rm.id}')"
                                title="Edit Room"
                                class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                              >
                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                              </button>
                              <button
                                type="button"
                                onclick="deleteAdminRoom('\${rm.id}')"
                                title="Delete Room"
                                class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      \`).join("")}
                    </tbody>
                  </table>
                </div>
              \`}
            </div>
          \`}
        </div>
      \`;
    }

    // -------------------------------------------------------------------------
    // SUBTAB 4: ADMIN BUSINESS OFFERINGS SETUP (HOTEL, FOODING, SALON, SERVICES)
    // -------------------------------------------------------------------------
    function renderAdminBusinessSetup(container) {
      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Setup Header -->
          <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="sliders" class="w-5 h-5 text-indigo-600"></i>
                Business Offerings & Modules Configuration
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Admin decides whether each business has Lodging (rooms), Fooding (restaurant/dining), or Services (salon, domestic, spa).
              </p>
            </div>
            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              \${properties.length} Configured Businesses
            </span>
          </div>

          <!-- Business Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            \${properties.map(p => {
              const hasL = p.has_lodging === 1;
              const hasF = p.has_fooding === 1;
              const hasS = p.has_services === 1;
              const ti = getBusinessTypeInfo(p);

              return \`
                <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition">
                  <div class="space-y-3">
                    <!-- Title and Type -->
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="text-sm font-black text-slate-900">\${escapeHtml(p.name)}</h4>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 \${ti.badgeClass}">
                          \${escapeHtml(ti.label)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onclick="openBusinessConfigModal('\${p.id}')"
                        class="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-indigo-200"
                      >
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        <span>Configure</span>
                      </button>
                    </div>

                    <!-- Active Capability Status Badges -->
                    <div class="space-y-2 pt-1 border-t border-slate-100 text-xs">
                      <!-- Lodging -->
                      <div class="flex items-center justify-between p-2 rounded-xl \${hasL ? 'bg-indigo-50/70 border border-indigo-100' : 'bg-slate-50 text-slate-400'}">
                        <span class="flex items-center gap-2 font-medium">
                          <i data-lucide="hotel" class="w-4 h-4 \${hasL ? 'text-indigo-600' : 'text-slate-300'}"></i>
                          <span>Lodging & Rooms</span>
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full \${hasL ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-200 text-slate-600'}">
                          \${hasL ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <!-- Fooding -->
                      <div class="flex items-center justify-between p-2 rounded-xl \${hasF ? 'bg-amber-50/70 border border-amber-100' : 'bg-slate-50 text-slate-400'}">
                        <span class="flex items-center gap-2 font-medium">
                          <i data-lucide="utensils" class="w-4 h-4 \${hasF ? 'text-amber-600' : 'text-slate-300'}"></i>
                          <span>Fooding & Restaurant</span>
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full \${hasF ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'}">
                          \${hasF ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <!-- Services -->
                      <div class="flex items-center justify-between p-2 rounded-xl \${hasS ? 'bg-purple-50/70 border border-purple-100' : 'bg-slate-50 text-slate-400'}">
                        <span class="flex items-center gap-2 font-medium">
                          <i data-lucide="sparkles" class="w-4 h-4 \${hasS ? 'text-purple-600' : 'text-slate-300'}"></i>
                          <span>Services (\${escapeHtml(p.services_label || 'Services')})</span>
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full \${hasS ? 'bg-purple-200 text-purple-900' : 'bg-slate-200 text-slate-600'}">
                          \${hasS ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Leave Allowance: \${p.monthly_leave_allowance || 2} days/mo</span>
                    <button
                      type="button"
                      onclick="openBusinessConfigModal('\${p.id}')"
                      class="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] cursor-pointer"
                    >
                      Change Offerings →
                    </button>
                  </div>
                </div>
              \`;
            }).join("")}
          </div>
        </div>
      \`;
    }

    // Business Config Modal Handlers
    function openBusinessConfigModal(propId) {
      const prop = properties.find(p => p.id === propId);
      if (!prop) return;

      const idInput = document.getElementById("modalConfigPropId");
      const title = document.getElementById("businessConfigModalTitle");
      const subtitle = document.getElementById("businessConfigModalSubtitle");
      const chkL = document.getElementById("modalConfigHasLodging");
      const chkF = document.getElementById("modalConfigHasFooding");
      const chkS = document.getElementById("modalConfigHasServices");
      const lblInput = document.getElementById("modalConfigServicesLabel");
      const lblRow = document.getElementById("modalConfigServicesLabelRow");

      if (idInput) idInput.value = prop.id;
      if (title) title.innerText = \`Configure: \${prop.name}\`;
      if (subtitle) subtitle.innerText = \`Select active revenue modules and business type\`;

      if (chkL) chkL.checked = (prop.has_lodging === 1);
      if (chkF) chkF.checked = (prop.has_fooding === 1);
      if (chkS) chkS.checked = (prop.has_services === 1);

      if (lblInput) lblInput.value = prop.services_label || "Services";
      if (lblRow) {
        if (prop.has_services === 1) {
          lblRow.classList.remove("hidden");
        } else {
          lblRow.classList.add("hidden");
        }
      }

      document.getElementById("businessConfigModal").classList.remove("hidden");
      document.getElementById("businessConfigModal").classList.add("flex");
      refreshIcons();
    }

    function closeBusinessConfigModal() {
      document.getElementById("businessConfigModal").classList.add("hidden");
      document.getElementById("businessConfigModal").classList.remove("flex");
    }

    function applyBusinessPreset(presetKey) {
      const chkL = document.getElementById("modalConfigHasLodging");
      const chkF = document.getElementById("modalConfigHasFooding");
      const chkS = document.getElementById("modalConfigHasServices");
      const lblInput = document.getElementById("modalConfigServicesLabel");
      const lblRow = document.getElementById("modalConfigServicesLabelRow");

      if (presetKey === "hotel") {
        if (chkL) chkL.checked = true;
        if (chkF) chkF.checked = true;
        if (chkS) chkS.checked = false;
        if (lblRow) lblRow.classList.add("hidden");
      } else if (presetKey === "restaurant") {
        if (chkL) chkL.checked = false;
        if (chkF) chkF.checked = true;
        if (chkS) chkS.checked = false;
        if (lblRow) lblRow.classList.add("hidden");
      } else if (presetKey === "salon") {
        if (chkL) chkL.checked = false;
        if (chkF) chkF.checked = false;
        if (chkS) chkS.checked = true;
        if (lblInput) lblInput.value = "Salon Services";
        if (lblRow) lblRow.classList.remove("hidden");
      } else if (presetKey === "services") {
        if (chkL) chkL.checked = false;
        if (chkF) chkF.checked = false;
        if (chkS) chkS.checked = true;
        if (lblInput) lblInput.value = "Services";
        if (lblRow) lblRow.classList.remove("hidden");
      }
    }

    function toggleServicesLabelInput(checked) {
      const row = document.getElementById("modalConfigServicesLabelRow");
      if (row) {
        if (checked) {
          row.classList.remove("hidden");
        } else {
          row.classList.add("hidden");
        }
      }
    }

    async function handleSaveBusinessConfig(e) {
      if (e) e.preventDefault();
      const propId = document.getElementById("modalConfigPropId")?.value;
      if (!propId) return;

      const hasLodging = document.getElementById("modalConfigHasLodging")?.checked ? 1 : 0;
      const hasFooding = document.getElementById("modalConfigHasFooding")?.checked ? 1 : 0;
      const hasServices = document.getElementById("modalConfigHasServices")?.checked ? 1 : 0;
      const servicesLabel = document.getElementById("modalConfigServicesLabel")?.value?.trim() || "Services";

      let businessType = "general";
      if (hasLodging && hasFooding) businessType = "hotel";
      else if (hasLodging) businessType = "hotel";
      else if (hasFooding) businessType = "restaurant";
      else if (hasServices) businessType = "salon";

      try {
        const res = await fetch(\`/api/properties/\${propId}\`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            has_lodging: hasLodging,
            has_fooding: hasFooding,
            has_services: hasServices,
            services_label: servicesLabel,
            business_type: businessType
          })
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to save business settings");
        }

        closeBusinessConfigModal();
        showToast("Business offerings updated successfully!");
        await Promise.all([fetchProperties(), fetchFinances()]);
        renderFinancesView();
      } catch (err) {
        showToast("Error updating business: " + err.message);
      }
    }

    // Bulk Add Rooms Action
    async function bulkAddAdminRooms() {
      const propId = calendarSelectedProperty || (properties[0] ? properties[0].id : "");
      const roomNumbersStr = document.getElementById("adminBulkRoomNumbers")?.value?.trim() || "";
      const roomType = document.getElementById("adminBulkRoomType")?.value?.trim() || "Standard";
      const basePrice = Math.max(0, parseFloat(document.getElementById("adminBulkBasePrice")?.value || "0") || 0);

      if (!propId) return showToast("Please select a property first");
      if (!roomNumbersStr) return showToast("Please enter at least one room number");

      try {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            property_id: propId,
            room_numbers: roomNumbersStr,
            room_type: roomType,
            base_price: basePrice
          })
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to add rooms");
        }

        showToast(\`Successfully added \${data.count || ''} rooms!\`);
        const input = document.getElementById("adminBulkRoomNumbers");
        if (input) input.value = "";
        await fetchRooms();
        renderFinancesView();
      } catch (err) {
        showToast("Error adding rooms: " + err.message);
      }
    }

    async function deleteAdminRoom(roomId) {
      if (!roomId) return;
      if (!confirm("Are you sure you want to permanently delete this room?")) return;

      try {
        const res = await fetch("/api/rooms/" + roomId, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to delete room");
        }

        showToast("Room deleted successfully");
        await fetchRooms();
        renderFinancesView();
      } catch (err) {
        showToast("Error deleting room: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // MODALS: ROOM BOOKING, ROOM DAY DETAIL & MANAGE ROOM
    // -------------------------------------------------------------------------
    function setModalStayMode(mode) {
      modalStayMode = mode;
      const btnSingle = document.getElementById("btnModalStaySingle");
      const btnRange = document.getElementById("btnModalStayRange");
      const singleDateSec = document.getElementById("modalSingleDateContainer");
      const rangeDateSec = document.getElementById("modalDateRangeContainer");
      const singleAmtSec = document.getElementById("modalSingleAmountContainer");
      const rangeAmtSec = document.getElementById("modalRangeAmountContainer");

      if (mode === 'single') {
        if (btnSingle) {
          btnSingle.className = "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 bg-white text-indigo-600 shadow-2xs";
        }
        if (btnRange) {
          btnRange.className = "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900";
        }
        if (singleDateSec) singleDateSec.classList.remove("hidden");
        if (rangeDateSec) rangeDateSec.classList.add("hidden");
        if (singleAmtSec) singleAmtSec.classList.remove("hidden");
        if (rangeAmtSec) rangeAmtSec.classList.add("hidden");
      } else {
        if (btnSingle) {
          btnSingle.className = "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900";
        }
        if (btnRange) {
          btnRange.className = "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 bg-white text-indigo-600 shadow-2xs";
        }
        if (singleDateSec) singleDateSec.classList.add("hidden");
        if (rangeDateSec) rangeDateSec.classList.remove("hidden");
        if (singleAmtSec) singleAmtSec.classList.add("hidden");
        if (rangeAmtSec) rangeAmtSec.classList.remove("hidden");
        onModalRangeDateChange();
      }
      refreshIcons();
    }

    function onModalRangeDateChange() {
      const checkIn = document.getElementById("modalBookingCheckInDate")?.value;
      let checkOut = document.getElementById("modalBookingCheckOutDate")?.value;
      const includeCheckout = document.getElementById("modalIncludeCheckoutDay")?.checked || false;

      if (!checkIn) return;
      if (!checkOut || checkOut <= checkIn) {
        checkOut = getTomorrowIso(checkIn);
        const outInput = document.getElementById("modalBookingCheckOutDate");
        if (outInput) outInput.value = checkOut;
      }

      const nights = calculateStayNights(checkIn, checkOut, includeCheckout);
      const nightsLabel = document.getElementById("modalRangeNightsLabel");
      const datesLabel = document.getElementById("modalRangeDatesLabel");

      if (nightsLabel) {
        nightsLabel.innerText = includeCheckout
          ? \`\${nights} Days Stay\`
          : \`\${nights} Night\${nights > 1 ? 's' : ''} Stay\`;
      }
      if (datesLabel) {
        datesLabel.innerText = \`\${checkIn} → \${checkOut} (\${includeCheckout ? 'Full checkout day included' : 'Checkout ' + checkOut})\`;
      }

      // Sync amounts
      const rateInput = document.getElementById("modalRatePerNight");
      const totalInput = document.getElementById("modalTotalStayAmount");
      const preview = document.getElementById("modalDailyRatePreview");

      const rate = parseFloat(rateInput?.value || "0") || 0;
      const total = rate * nights;
      if (totalInput) totalInput.value = total > 0 ? total : "";
      if (preview) preview.innerText = \`₹\${formatCurrency(rate)}\`;
    }

    function onModalRateChange(val) {
      const checkIn = document.getElementById("modalBookingCheckInDate")?.value;
      const checkOut = document.getElementById("modalBookingCheckOutDate")?.value;
      const includeCheckout = document.getElementById("modalIncludeCheckoutDay")?.checked || false;
      const nights = calculateStayNights(checkIn, checkOut, includeCheckout);

      const rate = Math.max(0, parseFloat(val || "0") || 0);
      const total = rate * nights;
      const totalInput = document.getElementById("modalTotalStayAmount");
      if (totalInput) totalInput.value = total > 0 ? total : "";
      const preview = document.getElementById("modalDailyRatePreview");
      if (preview) preview.innerText = \`₹\${formatCurrency(rate)}\`;
    }

    function onModalTotalAmountChange(val) {
      const checkIn = document.getElementById("modalBookingCheckInDate")?.value;
      const checkOut = document.getElementById("modalBookingCheckOutDate")?.value;
      const includeCheckout = document.getElementById("modalIncludeCheckoutDay")?.checked || false;
      const nights = calculateStayNights(checkIn, checkOut, includeCheckout);

      const total = Math.max(0, parseFloat(val || "0") || 0);
      const rate = nights > 0 ? Math.round(total / nights) : total;
      const rateInput = document.getElementById("modalRatePerNight");
      if (rateInput) rateInput.value = rate > 0 ? rate : "";
      const preview = document.getElementById("modalDailyRatePreview");
      if (preview) preview.innerText = \`₹\${formatCurrency(rate)}\`;
    }

    function onModalRoomSelectChange(roomId) {
      const select = document.getElementById("modalBookingRoomSelect");
      const opt = select?.selectedOptions[0];
      const basePrice = parseFloat(opt?.getAttribute("data-price") || "0") || 2000;

      const singleAmt = document.getElementById("modalBookingAmount");
      if (singleAmt && (!singleAmt.value || parseFloat(singleAmt.value) === 0)) {
        singleAmt.value = basePrice;
      }

      const rateInput = document.getElementById("modalRatePerNight");
      if (rateInput && (!rateInput.value || parseFloat(rateInput.value) === 0)) {
        rateInput.value = basePrice;
      }
      onModalRangeDateChange();
    }

    function openRoomBookingModal(roomId = null, date = null, bookingId = null) {
      const select = document.getElementById("modalBookingRoomSelect");
      const propId = (currentUserRole === "manager" ? currentManagerInfo?.property_id : calendarSelectedProperty) || (properties[0] ? properties[0].id : "");
      
      const propRooms = roomsList.filter(r => r.property_id === propId);

      if (select) {
        select.innerHTML = propRooms.map(r => \`
          <option value="\${r.id}" data-price="\${r.base_price || 0}">Room \${escapeHtml(r.room_number)} (\${escapeHtml(r.room_type || 'Standard')}) - ₹\${formatCurrency(r.base_price || 0)}</option>
        \`).join("");
      }

      const idInput = document.getElementById("modalBookingId");
      const propInput = document.getElementById("modalBookingProperty");
      const dateInput = document.getElementById("modalBookingDate");
      const amountInput = document.getElementById("modalBookingAmount");
      const guestInput = document.getElementById("modalBookingGuestName");
      const notesInput = document.getElementById("modalBookingNotes");
      const title = document.getElementById("roomBookingModalTitle");
      const staySegment = document.getElementById("modalStayTypeSegment");
      const groupNotice = document.getElementById("modalGroupStayNotice");
      const groupDates = document.getElementById("modalGroupStayDates");

      if (propInput) propInput.value = propId;

      if (bookingId) {
        const bk = roomBookingsList.find(b => b.id === bookingId);
        if (bk) {
          if (title) title.innerText = "Edit Room Booking";
          if (idInput) idInput.value = bk.id;
          if (select) select.value = bk.room_id;
          if (dateInput) dateInput.value = bk.date;
          if (amountInput) amountInput.value = bk.amount;
          if (guestInput) guestInput.value = bk.guest_name || "";
          if (notesInput) notesInput.value = bk.notes || "";
          if (bk.payment_mode === "cash") {
            const r = document.getElementById("modalBookingModeCash");
            if (r) r.checked = true;
          } else {
            const r = document.getElementById("modalBookingModeOnline");
            if (r) r.checked = true;
          }

          if (bk.group_booking_id) {
            if (groupNotice) groupNotice.classList.remove("hidden");
            if (groupDates) {
              groupDates.innerText = \`\${bk.check_in_date || bk.date} to \${bk.check_out_date || bk.date} (Total: ₹\${formatCurrency(bk.total_stay_amount || bk.amount)})\`;
            }
          } else {
            if (groupNotice) groupNotice.classList.add("hidden");
          }

          if (staySegment) staySegment.classList.add("hidden");
          setModalStayMode('single');
        }
      } else {
        if (title) title.innerText = "Record Room Booking";
        if (idInput) idInput.value = "";
        const defaultDate = date || managerFinanceDate || new Date().toISOString().split("T")[0];
        if (dateInput) dateInput.value = defaultDate;

        const inInput = document.getElementById("modalBookingCheckInDate");
        const outInput = document.getElementById("modalBookingCheckOutDate");
        if (inInput) inInput.value = defaultDate;
        if (outInput) outInput.value = getTomorrowIso(defaultDate);

        if (select && roomId) {
          select.value = roomId;
        }
        const selectedOpt = select?.selectedOptions[0];
        const basePrice = selectedOpt ? (parseFloat(selectedOpt.getAttribute("data-price") || "0") || 2000) : 2000;

        if (amountInput) amountInput.value = basePrice;
        const rateInput = document.getElementById("modalRatePerNight");
        if (rateInput) rateInput.value = basePrice;

        if (guestInput) guestInput.value = "";
        if (notesInput) notesInput.value = "";
        const r = document.getElementById("modalBookingModeOnline");
        if (r) r.checked = true;

        if (staySegment) staySegment.classList.remove("hidden");
        if (groupNotice) groupNotice.classList.add("hidden");
        setModalStayMode('single');
        onModalRangeDateChange();
      }

      document.getElementById("roomBookingModal").classList.remove("hidden");
      document.getElementById("roomBookingModal").classList.add("flex");
      refreshIcons();
    }

    function closeRoomBookingModal() {
      document.getElementById("roomBookingModal").classList.add("hidden");
      document.getElementById("roomBookingModal").classList.remove("flex");
    }

    function openEditBookingModal(bookingId) {
      openRoomBookingModal(null, null, bookingId);
    }

    async function handleSaveRoomBookingModal(e) {
      if (e) e.preventDefault();
      const bookingId = document.getElementById("modalBookingId")?.value?.trim() || null;
      const property_id = document.getElementById("modalBookingProperty")?.value;
      const room_id = document.getElementById("modalBookingRoomSelect")?.value;
      const isCash = document.getElementById("modalBookingModeCash")?.checked;
      const payment_mode = isCash ? "cash" : "online";
      const guest_name = document.getElementById("modalBookingGuestName")?.value?.trim() || "";
      const notes = document.getElementById("modalBookingNotes")?.value?.trim() || "";

      if (!property_id || !room_id) {
        return showToast("Please select a room");
      }

      let payload = {
        property_id,
        room_id,
        payment_mode,
        guest_name,
        notes
      };

      if (bookingId) {
        const date = document.getElementById("modalBookingDate")?.value;
        const amount = Math.max(0, parseFloat(document.getElementById("modalBookingAmount")?.value || "0") || 0);
        if (!date) return showToast("Booking date is required");
        payload.date = date;
        payload.amount = amount;
        payload.update_entire_group = document.getElementById("modalUpdateEntireGroup")?.checked || false;
      } else if (modalStayMode === 'range') {
        const check_in_date = document.getElementById("modalBookingCheckInDate")?.value;
        const check_out_date = document.getElementById("modalBookingCheckOutDate")?.value;
        const include_checkout_day = document.getElementById("modalIncludeCheckoutDay")?.checked || false;
        const rate_per_day = Math.max(0, parseFloat(document.getElementById("modalRatePerNight")?.value || "0") || 0);
        const amount = Math.max(0, parseFloat(document.getElementById("modalTotalStayAmount")?.value || "0") || 0);

        if (!check_in_date || !check_out_date) {
          return showToast("Check-in and check-out dates are required");
        }
        if (check_in_date > check_out_date) {
          return showToast("Check-out date must be after check-in date");
        }
        if (rate_per_day <= 0 && amount <= 0) {
          return showToast("Please enter a valid rate or total stay amount");
        }

        const nights = calculateStayNights(check_in_date, check_out_date, include_checkout_day);
        payload.is_range = true;
        payload.check_in_date = check_in_date;
        payload.check_out_date = check_out_date;
        payload.include_checkout_day = include_checkout_day;
        payload.rate_per_day = rate_per_day;
        payload.amount = amount > 0 ? amount : (rate_per_day * nights);
      } else {
        const date = document.getElementById("modalBookingDate")?.value;
        const amount = Math.max(0, parseFloat(document.getElementById("modalBookingAmount")?.value || "0") || 0);
        if (!date) return showToast("Booking date is required");
        payload.date = date;
        payload.amount = amount;
      }

      try {
        let url = "/api/room-bookings";
        let method = "POST";
        if (bookingId) {
          url += "/" + bookingId;
          method = "PUT";
        }

        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to save booking");
        }

        closeRoomBookingModal();
        if (data.isMultiDay) {
          showToast(\`Multi-day stay booked! \${data.nights} nights (₹\${formatCurrency(data.total_stay_amount)}) saved.\`);
        } else {
          showToast("Room booking saved successfully!");
        }
        await Promise.all([fetchRoomBookings(), fetchFinances()]);
        renderFinancesView();
      } catch (err) {
        showToast("Error saving booking: " + err.message);
      }
    }

    function openRoomDayDetail(roomId, date) {
      currentDetailRoomId = roomId;
      currentDetailDate = date;

      const room = roomsList.find(r => r.id === roomId);
      const roomNum = room ? room.room_number : "Unknown";
      const roomType = room ? room.room_type : "Standard";

      const title = document.getElementById("roomDayDetailTitle");
      const subtitle = document.getElementById("roomDayDetailSubtitle");
      const list = document.getElementById("roomDayDetailList");

      if (title) title.innerText = \`Room \${roomNum} Bookings\`;
      if (subtitle) subtitle.innerText = \`\${date} · \${roomType}\`;

      const bookings = roomBookingsList.filter(b => b.room_id === roomId && b.date === date);

      if (list) {
        if (bookings.length === 0) {
          list.innerHTML = \`
            <div class="text-center py-6 text-xs text-slate-400">
              No bookings recorded for this room on \${date}.
            </div>
          \`;
        } else {
          list.innerHTML = bookings.map(b => {
            const isOnline = b.payment_mode === "online";
            const isMultiDay = !!b.group_booking_id;
            return \`
              <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-slate-900">Booking Slot #\${b.slot_number || 1}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold \${isOnline ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}">
                      \${isOnline ? 'Online' : 'Cash'}
                    </span>
                    \${isMultiDay ? \`
                      <span class="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-purple-100 text-purple-800 flex items-center gap-1" title="Stay: \${b.check_in_date || ''} to \${b.check_out_date || ''}">
                        <i data-lucide="layers" class="w-2.5 h-2.5"></i>
                        <span>Stay: \${b.check_in_date || ''} → \${b.check_out_date || ''}</span>
                      </span>
                    \` : ''}
                  </div>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    Guest: \${escapeHtml(b.guest_name || 'Walk-in')}
                    \${b.notes ? \` · \${escapeHtml(b.notes)}\` : ''}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Created: \${escapeHtml(b.created_by || 'Staff')}</div>
                </div>

                <div class="text-right flex items-center gap-2">
                  <div class="text-sm font-black font-mono \${isOnline ? 'text-indigo-900' : 'text-amber-900'}">
                    ₹\${formatCurrency(b.amount)}
                  </div>
                  <button
                    type="button"
                    onclick="closeRoomDayDetailModal(); openEditBookingModal('\${b.id}')"
                    title="Edit Booking"
                    class="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 cursor-pointer shadow-2xs"
                  >
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  </button>
                  <button
                    type="button"
                    onclick="closeRoomDayDetailModal(); deleteRoomBooking('\${b.id}')"
                    title="Delete Booking"
                    class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            \`;
          }).join("");
        }
      }

      document.getElementById("roomDayDetailModal").classList.remove("hidden");
      document.getElementById("roomDayDetailModal").classList.add("flex");
      refreshIcons();
    }

    function closeRoomDayDetailModal() {
      document.getElementById("roomDayDetailModal").classList.add("hidden");
      document.getElementById("roomDayDetailModal").classList.remove("flex");
    }

    function openAddBookingForCurrentDetail() {
      const roomId = currentDetailRoomId;
      const date = currentDetailDate;
      closeRoomDayDetailModal();
      openRoomBookingModal(roomId, date, null);
    }

    function openManageRoomModal(roomId = null) {
      const propSelect = document.getElementById("modalRoomProperty");
      if (propSelect) {
        propSelect.innerHTML = properties.filter(p => p.has_lodging === 1).map(p => \`
          <option value="\${p.id}" \${p.id === calendarSelectedProperty ? 'selected' : ''}>\${escapeHtml(p.name)}</option>
        \`).join("");
      }

      const title = document.getElementById("manageRoomModalTitle");
      const idInput = document.getElementById("modalRoomId");
      const numInput = document.getElementById("modalRoomNumber");
      const typeInput = document.getElementById("modalRoomType");
      const priceInput = document.getElementById("modalRoomBasePrice");

      if (roomId) {
        const room = roomsList.find(r => r.id === roomId);
        if (room) {
          if (title) title.innerText = "Edit Room";
          if (idInput) idInput.value = room.id;
          if (propSelect) propSelect.value = room.property_id;
          if (numInput) numInput.value = room.room_number;
          if (typeInput) typeInput.value = room.room_type || "Standard";
          if (priceInput) priceInput.value = room.base_price || 2000;
        }
      } else {
        if (title) title.innerText = "Add New Room";
        if (idInput) idInput.value = "";
        if (numInput) numInput.value = "";
        if (typeInput) typeInput.value = "Standard";
        if (priceInput) priceInput.value = 2000;
      }

      document.getElementById("manageRoomModal").classList.remove("hidden");
      document.getElementById("manageRoomModal").classList.add("flex");
      refreshIcons();
    }

    function closeManageRoomModal() {
      document.getElementById("manageRoomModal").classList.add("hidden");
      document.getElementById("manageRoomModal").classList.remove("flex");
    }

    async function handleSaveRoomModal(e) {
      if (e) e.preventDefault();
      const roomId = document.getElementById("modalRoomId")?.value?.trim() || null;
      const property_id = document.getElementById("modalRoomProperty")?.value;
      const room_number = document.getElementById("modalRoomNumber")?.value?.trim();
      const room_type = document.getElementById("modalRoomType")?.value?.trim() || "Standard";
      const base_price = Math.max(0, parseFloat(document.getElementById("modalRoomBasePrice")?.value || "0") || 0);

      if (!property_id || !room_number) {
        return showToast("Property and room number are required");
      }

      try {
        let url = "/api/rooms";
        let method = "POST";
        if (roomId) {
          url += "/" + roomId;
          method = "PUT";
        }

        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify({
            property_id,
            room_number,
            room_type,
            base_price
          })
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to save room");
        }

        closeManageRoomModal();
        showToast("Room saved successfully!");
        await fetchRooms();
        renderFinancesView();
      } catch (err) {
        showToast("Error saving room: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // FINANCE MODAL & EXPORT HELPERS (DYNAMIC OFFERINGS SUPPORT)
    // -------------------------------------------------------------------------
    async function changeFinanceMonth(delta) {
      financeMonth += delta;
      if (financeMonth < 0) {
        financeMonth = 11;
        financeYear--;
      } else if (financeMonth > 11) {
        financeMonth = 0;
        financeYear++;
      }
      await Promise.all([fetchFinances(), fetchRoomBookings()]);
      renderFinancesView();
    }

    async function goToFinanceCurrentMonth() {
      financeMonth = new Date().getMonth();
      financeYear = new Date().getFullYear();
      await Promise.all([fetchFinances(), fetchRoomBookings()]);
      renderFinancesView();
    }

    async function onAdminFinanceFilterChange(val) {
      financeFilterProperty = val || "all";
      await fetchFinances();
      renderFinancesView();
    }

    function onModalFinancePropertyChange(propId) {
      const prop = properties.find(p => p.id === propId);
      const grpLodging = document.getElementById("modalLodgingGroup");
      const grpFooding = document.getElementById("modalFoodingGroup");
      const grpServices = document.getElementById("modalServicesGroup");
      const lblServices = document.getElementById("modalServicesTitleLabel");

      if (prop) {
        if (grpLodging) grpLodging.style.display = prop.has_lodging === 1 ? "block" : "none";
        if (grpFooding) grpFooding.style.display = prop.has_fooding === 1 ? "block" : "none";
        if (grpServices) grpServices.style.display = prop.has_services === 1 ? "block" : "none";
        if (lblServices) lblServices.innerText = \`\${prop.services_label || 'Services'} Revenue\`;
      }
      calculateModalFinanceLiveTotals();
    }

    function openFinanceModal(recordId = null) {
      const select = document.getElementById("modalFinanceProperty");
      if (select) {
        select.innerHTML = properties.map(p => \`
          <option value="\${p.id}">\${escapeHtml(p.name)} (\${escapeHtml(getBusinessTypeInfo(p).label)})</option>
        \`).join("");
      }

      const title = document.getElementById("financeModalTitle");
      const idInput = document.getElementById("modalFinanceId");
      const dateInput = document.getElementById("modalFinanceDate");
      const loInput = document.getElementById("modalLodgingOnline");
      const lcInput = document.getElementById("modalLodgingCash");
      const foInput = document.getElementById("modalFoodingOnline");
      const fcInput = document.getElementById("modalFoodingCash");
      const soInput = document.getElementById("modalServicesOnline");
      const scInput = document.getElementById("modalServicesCash");
      const osInput = document.getElementById("modalOtherSales");
      const expInput = document.getElementById("modalExpensesTotal");
      const expNotesInput = document.getElementById("modalExpenseNotes");
      const notesInput = document.getElementById("modalNotes");

      if (recordId) {
        const record = financesList.find(f => f.id === recordId);
        if (record) {
          if (title) title.innerText = "Edit Sales & Expenses";
          if (idInput) idInput.value = record.id;
          if (select) select.value = record.property_id;
          if (dateInput) dateInput.value = record.date;
          if (loInput) loInput.value = record.lodging_online || 0;
          if (lcInput) lcInput.value = record.lodging_cash ?? record.lodging_offline ?? 0;
          if (foInput) foInput.value = record.fooding_online || 0;
          if (fcInput) fcInput.value = record.fooding_cash ?? record.fooding_offline ?? 0;
          if (soInput) soInput.value = record.services_online || 0;
          if (scInput) scInput.value = record.services_cash || 0;
          if (osInput) osInput.value = record.other_sales || 0;
          if (expInput) expInput.value = record.expenses_total || 0;
          if (expNotesInput) expNotesInput.value = record.expense_notes || "";
          if (notesInput) notesInput.value = record.notes || "";
        }
      } else {
        if (title) title.innerText = "Record Sales & Expenses";
        if (idInput) idInput.value = "";
        if (select) {
          if (financeFilterProperty !== "all") {
            select.value = financeFilterProperty;
          } else if (properties.length > 0) {
            select.value = properties[0].id;
          }
        }
        if (dateInput) {
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          dateInput.value = \`\${year}-\${month}-\${day}\`;
        }
        if (loInput) loInput.value = "";
        if (lcInput) lcInput.value = "";
        if (foInput) foInput.value = "";
        if (fcInput) fcInput.value = "";
        if (soInput) soInput.value = "";
        if (scInput) scInput.value = "";
        if (osInput) osInput.value = "";
        if (expInput) expInput.value = "";
        if (expNotesInput) expNotesInput.value = "";
        if (notesInput) notesInput.value = "";
      }

      if (select) {
        onModalFinancePropertyChange(select.value);
      } else {
        calculateModalFinanceLiveTotals();
      }

      document.getElementById("financeModal").classList.remove("hidden");
      document.getElementById("financeModal").classList.add("flex");
      refreshIcons();
    }

    function closeFinanceModal() {
      document.getElementById("financeModal").classList.add("hidden");
      document.getElementById("financeModal").classList.remove("flex");
    }

    function calculateModalFinanceLiveTotals() {
      const propId = document.getElementById("modalFinanceProperty")?.value;
      const prop = properties.find(p => p.id === propId);
      const hasL = prop ? prop.has_lodging === 1 : true;
      const hasF = prop ? prop.has_fooding === 1 : true;
      const hasS = prop ? prop.has_services === 1 : false;

      const lo = hasL ? Math.max(0, parseFloat(document.getElementById("modalLodgingOnline")?.value || "0") || 0) : 0;
      const lc = hasL ? Math.max(0, parseFloat(document.getElementById("modalLodgingCash")?.value || "0") || 0) : 0;
      const fo = hasF ? Math.max(0, parseFloat(document.getElementById("modalFoodingOnline")?.value || "0") || 0) : 0;
      const fc = hasF ? Math.max(0, parseFloat(document.getElementById("modalFoodingCash")?.value || "0") || 0) : 0;
      const so = hasS ? Math.max(0, parseFloat(document.getElementById("modalServicesOnline")?.value || "0") || 0) : 0;
      const sc = hasS ? Math.max(0, parseFloat(document.getElementById("modalServicesCash")?.value || "0") || 0) : 0;
      const os = Math.max(0, parseFloat(document.getElementById("modalOtherSales")?.value || "0") || 0);
      const exp = Math.max(0, parseFloat(document.getElementById("modalExpensesTotal")?.value || "0") || 0);

      const lodgingSub = lo + lc;
      const foodingSub = fo + fc;
      const servicesSub = so + sc;
      const totalSales = lodgingSub + foodingSub + servicesSub + os;
      const netProfit = totalSales - exp;

      const elLodging = document.getElementById("modalLodgingSubtotal");
      if (elLodging) elLodging.innerText = formatCurrency(lodgingSub);

      const elFooding = document.getElementById("modalFoodingSubtotal");
      if (elFooding) elFooding.innerText = formatCurrency(foodingSub);

      const elServices = document.getElementById("modalServicesSubtotal");
      if (elServices) elServices.innerText = formatCurrency(servicesSub);

      const elSales = document.getElementById("modalTotalSales");
      if (elSales) elSales.innerText = formatCurrency(totalSales);

      const elNet = document.getElementById("modalNetProfit");
      if (elNet) {
        elNet.innerText = formatCurrency(netProfit);
        if (netProfit < 0) {
          elNet.parentElement.className = "text-xl font-black font-mono text-rose-400";
        } else {
          elNet.parentElement.className = "text-xl font-black font-mono text-emerald-400";
        }
      }
    }

    async function handleSaveFinance(e) {
      if (e) e.preventDefault();
      const id = document.getElementById("modalFinanceId")?.value?.trim() || null;
      const property_id = document.getElementById("modalFinanceProperty")?.value;
      const date = document.getElementById("modalFinanceDate")?.value;

      const prop = properties.find(p => p.id === property_id);
      const hasL = prop ? prop.has_lodging === 1 : true;
      const hasF = prop ? prop.has_fooding === 1 : true;
      const hasS = prop ? prop.has_services === 1 : false;

      const lodging_online = hasL ? Math.max(0, parseFloat(document.getElementById("modalLodgingOnline")?.value || "0") || 0) : 0;
      const lodging_cash = hasL ? Math.max(0, parseFloat(document.getElementById("modalLodgingCash")?.value || "0") || 0) : 0;
      const fooding_online = hasF ? Math.max(0, parseFloat(document.getElementById("modalFoodingOnline")?.value || "0") || 0) : 0;
      const fooding_cash = hasF ? Math.max(0, parseFloat(document.getElementById("modalFoodingCash")?.value || "0") || 0) : 0;
      const services_online = hasS ? Math.max(0, parseFloat(document.getElementById("modalServicesOnline")?.value || "0") || 0) : 0;
      const services_cash = hasS ? Math.max(0, parseFloat(document.getElementById("modalServicesCash")?.value || "0") || 0) : 0;

      const other_sales = Math.max(0, parseFloat(document.getElementById("modalOtherSales")?.value || "0") || 0);
      const expenses_total = Math.max(0, parseFloat(document.getElementById("modalExpensesTotal")?.value || "0") || 0);
      const expense_notes = document.getElementById("modalExpenseNotes")?.value?.trim() || "";
      const notes = document.getElementById("modalNotes")?.value?.trim() || "";

      if (!property_id || !date) {
        showToast("Please select a business and date");
        return;
      }

      try {
        const payload = {
          property_id,
          date,
          lodging_online,
          lodging_cash,
          lodging_offline: lodging_cash,
          fooding_online,
          fooding_cash,
          fooding_offline: fooding_cash,
          services_online,
          services_cash,
          other_sales,
          expenses_total,
          expense_notes,
          notes
        };
        if (id) payload.id = id;

        const res = await fetch("/api/finances", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          showToast(data.error || "Failed to save financial record");
          return;
        }

        closeFinanceModal();
        showToast("Daily Sales & Expenses saved successfully");
        await fetchFinances();
        renderFinancesView();
      } catch (err) {
        showToast("Error saving: " + err.message);
      }
    }

    async function handleDeleteFinance(recordId) {
      if (!recordId) return;
      if (!confirm("Are you sure you want to permanently delete this financial record?")) {
        return;
      }

      try {
        const res = await fetch("/api/finances/" + recordId, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          showToast(data.error || "Failed to delete record");
          return;
        }

        showToast("Record deleted successfully");
        await fetchFinances();
        renderFinancesView();
      } catch (err) {
        showToast("Error deleting: " + err.message);
      }
    }

    function exportFinancesCSV() {
      const records = financeFilterProperty === "all"
        ? financesList
        : financesList.filter(f => f.property_id === financeFilterProperty);

      if (records.length === 0) {
        showToast("No financial records to export");
        return;
      }

      let csv = "Date,Business,Business Type,Lodging Online,Lodging Cash,Lodging Total,Fooding Online,Fooding Cash,Fooding Total,Services Online,Services Cash,Services Total,Other Sales,Gross Total Sales,Total Expenses,Expense Breakdown,Net Operating Profit,Shift Notes,Submitted By\\n";

      records.forEach(r => {
        const prop = properties.find(p => p.id === r.property_id);
        const ti = getBusinessTypeInfo(prop);
        const lodgingCash = r.lodging_cash ?? r.lodging_offline ?? 0;
        const foodingCash = r.fooding_cash ?? r.fooding_offline ?? 0;
        const lodgingTot = (r.lodging_online || 0) + lodgingCash;
        const foodingTot = (r.fooding_online || 0) + foodingCash;
        const servicesOnline = r.services_online || 0;
        const servicesCash = r.services_cash || 0;
        const servicesTot = servicesOnline + servicesCash;

        const row = [
          r.date,
          r.property_name || "",
          ti.label,
          r.lodging_online || 0,
          lodgingCash,
          lodgingTot,
          r.fooding_online || 0,
          foodingCash,
          foodingTot,
          servicesOnline,
          servicesCash,
          servicesTot,
          r.other_sales || 0,
          r.total_sales || 0,
          r.expenses_total || 0,
          r.expense_notes || "",
          r.net_revenue || 0,
          r.notes || "",
          r.submitted_by || ""
        ];
        csv += row.map(v => \`"\${String(v || '').replace(/"/g, '""')}"\`).join(",") + "\\n";
      });

      const m = String(financeMonth + 1).padStart(2, "0");
      const filename = \`sales_expenses_\${financeYear}_\${m}.csv\`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Financial CSV downloaded: " + filename);
    }

    // -------------------------------------------------------------------------
    // HELPERS & TOAST
    // -------------------------------------------------------------------------
    function formatIsoDate(d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return \`\${year}-\${month}-\${day}\`;
    }

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    let toastTimer = null;
    function showToast(msg) {
      const t = document.getElementById("toast");
      document.getElementById("toastMsg").innerText = msg;
      t.classList.remove("translate-y-16", "opacity-0");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        t.classList.add("translate-y-16", "opacity-0");
      }, 3000);
      refreshIcons();
    }

    window.addEventListener("DOMContentLoaded", () => {
      document.getElementById("currentMonthLabel").innerText = \`\${MONTH_NAMES[currentMonth]} \${currentYear}\`;
      initAuth();
    });
  </script>
</body>
</html>`;
}
