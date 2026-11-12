export function getDashboardHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#4f46e5">
  <meta name="format-detection" content="telephone=no">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
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
    :root {
      --sat: env(safe-area-inset-top, 0px);
      --sab: env(safe-area-inset-bottom, 0px);
      --sal: env(safe-area-inset-left, 0px);
      --sar: env(safe-area-inset-right, 0px);
    }
    html, body {
      overflow-x: hidden;
      max-width: 100vw;
      width: 100%;
      padding-top: var(--sat);
      padding-bottom: var(--sab);
      padding-left: var(--sal);
      padding-right: var(--sar);
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
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

      <!-- Android App Download link -->
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
        <a href="/app.apk" download="elite-havens-app.apk" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition shadow-2xs">
          <i data-lucide="smartphone" class="w-3.5 h-3.5 text-indigo-600"></i>
          <span>Download Android App (.apk)</span>
        </a>
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

            <!-- Download Android APK Button -->
            <a href="/app.apk" download="elite-havens-app.apk" title="Download Android App APK" class="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs active:scale-95 cursor-pointer">
              <i data-lucide="smartphone" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span class="hidden md:inline">Android App</span>
            </a>

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
            <span>Leave Allowance: <strong id="currentAllowanceText">3.0 days</strong></span>
          </div>
          
          <button id="btnMarkAllPresent" onclick="markAllTodayPresent()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition">
            <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
            <span>Mark All Present</span>
          </button>

          <button onclick="exportCurrentView()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition">
            <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Export</span>
          </button>

          <button type="button" onclick="toggleShowFormerStaff()" class="former-staff-toggle-btn hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer" title="Show or hide staff who left">
            <i data-lucide="history" class="w-3.5 h-3.5"></i>
            <span class="former-staff-toggle-label">Show Left Staff</span>
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
        <div class="flex items-center justify-between px-1 gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="sm:hidden text-xs font-bold text-slate-600">Daily Roll Call</span>
            <button type="button" onclick="toggleShowFormerStaff()" class="former-staff-toggle-btn hidden inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-xl transition cursor-pointer" title="Show or hide staff who left">
              <i data-lucide="history" class="w-3.5 h-3.5"></i>
              <span class="former-staff-toggle-label">Show Left Staff</span>
            </button>
          </div>
          <button onclick="markAllTodayPresent()" class="sm:hidden inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2.5 py-1 rounded-xl transition cursor-pointer">
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
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="toggleShowFormerStaff()" class="former-staff-toggle-btn hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer" title="Show or hide staff who left">
              <i data-lucide="history" class="w-3.5 h-3.5"></i>
              <span class="former-staff-toggle-label">Show Left Staff</span>
            </button>
            <button onclick="openStaffModal()" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span>Add New Staff</span>
            </button>
          </div>
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

        <!-- Former / Left Staff Banner (shown when viewing an archived/left staff profile) -->
        <div id="staffLeftBanner" class="hidden p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
          <div class="text-xs text-amber-900">
            <div class="font-bold flex items-center gap-1.5">
              <i data-lucide="archive" class="w-3.5 h-3.5 text-amber-600"></i>
              <span>Former Staff (History Preserved)</span>
            </div>
            <div id="staffLeftBannerText" class="text-[11px] text-amber-700 mt-0.5">Left on —</div>
          </div>
          <button type="button" onclick="handleRestoreStaff()" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer">
            Restore Active
          </button>
        </div>
        
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

        <div id="staffLeftDateContainer" class="hidden p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Leaving / Exit Date</label>
          <input type="date" id="staffLeftDate" class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
          <p class="text-[10px] text-slate-500 mt-1">All attendance, leaves, and salary history prior to this month stays visible automatically.</p>
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
          <button type="button" id="btnDeleteStaff" onclick="handleDeleteStaff()" class="hidden text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition cursor-pointer">
            Mark Left / Remove
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
  <!-- MODAL: MARK STAFF AS LEFT (PRESERVES FULL HISTORY)                        -->
  <!-- ========================================================================= -->
  <div id="markLeftModal" class="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
      <div class="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <i data-lucide="user-minus" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Mark Staff as Left</h3>
            <p id="markLeftStaffName" class="text-xs text-slate-500 font-semibold">Staff Name</p>
          </div>
        </div>
        <button onclick="closeMarkLeftModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
        <strong>History 100% Preserved:</strong> Past attendance, leave balances, salary slips, advances, and payment records will <strong>NOT</strong> be deleted. They stay visible automatically in prior months and via "Show Left Staff".
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Leaving / Exit Date *</label>
        <input type="date" id="markLeftDateInput" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500">
        <p class="text-[11px] text-slate-400 mt-1">Staff will be removed from Today's Roll Call and active payroll from this date onward.</p>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" onclick="closeMarkLeftModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
          Cancel
        </button>
        <button type="button" onclick="confirmMarkStaffLeft()" class="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer">
          Confirm Mark as Left
        </button>
      </div>
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

        <!-- Guest Names (Supports multiple guests) & Total Persons -->
        <div>
          <div class="flex items-center justify-between mb-1.5 gap-2">
            <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <i data-lucide="users" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Guests (<span id="modalGuestCountLabel">1</span>)</span>
            </label>
            <div class="flex items-center gap-2">
              <label class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <span>Persons:</span>
                <input type="number" id="modalBookingGuestCount" min="1" max="30" value="1" class="w-12 px-1.5 py-0.5 text-xs font-bold text-center rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500" />
              </label>
              <button
                type="button"
                onclick="addModalGuestNameRow()"
                class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition"
              >
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>+ Add Guest</span>
              </button>
            </div>
          </div>
          <div id="modalGuestNamesList" class="space-y-1.5">
            <!-- Dynamically populated rows -->
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Add all guests staying in this room (or type comma-separated names).</p>
        </div>

        <!-- Guest ID Documents Upload Section (Supports Multiple IDs) -->
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <i data-lucide="id-card" class="w-4 h-4 text-indigo-600"></i>
              <span>Guest ID Documents</span>
              <span id="modalIdCountBadge" class="hidden px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">0 IDs</span>
            </label>
            <span class="text-[10px] text-slate-400 font-medium">Aadhaar / Passport / DL</span>
          </div>

          <input type="hidden" id="modalBookingGuestIdData" />
          <input type="file" id="modalGuestIdCameraInput" accept="image/*" capture="environment" class="hidden" onchange="handleModalGuestIdCameraSelected(event)" />
          <input type="file" id="modalGuestIdFileInput" accept="image/*" multiple class="hidden" onchange="handleModalGuestIdFilesSelected(event)" />

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick="document.getElementById('modalGuestIdCameraInput').click()"
              class="py-2 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i data-lucide="camera" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>📷 Snap Photo (Camera)</span>
            </button>
            <button
              type="button"
              onclick="document.getElementById('modalGuestIdFileInput').click()"
              class="py-2 px-3 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i data-lucide="images" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>Upload Image(s)</span>
            </button>
          </div>

          <!-- Multiple IDs Gallery Grid -->
          <div id="modalGuestIdGallery" class="hidden grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-56 overflow-y-auto">
            <!-- Rendered thumbnail cards -->
          </div>

          <p id="modalGuestIdEmptyNotice" class="text-[10px] text-slate-400 text-center py-1">
            No IDs attached yet. Click Camera to snap photos or Upload to add guest IDs (multiple supported).
          </p>
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

  <!-- Hidden global inputs for quick camera / file ID uploads from cards -->
  <input type="file" id="globalGuestIdCameraInput" accept="image/*" capture="environment" class="hidden" onchange="handleGlobalGuestIdPicked(event)" />
  <input type="file" id="globalGuestIdFileInput" accept="image/*" multiple class="hidden" onchange="handleGlobalGuestIdPicked(event)" />

  <!-- Guest ID Lightbox Viewer Modal -->
  <div id="guestIdViewerModal" style="z-index: 99999;" onclick="if (event.target === this) closeGuestIdViewer()" class="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md hidden items-center justify-center p-2 sm:p-5 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
      <!-- Header -->
      <div class="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between text-white">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <i data-lucide="id-card" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="guestIdViewerTitle" class="text-sm font-bold text-white">Guest ID Photo</h3>
              <span id="guestIdViewerCounter" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">1 of 1</span>
            </div>
            <p id="guestIdViewerSubtitle" class="text-[11px] text-slate-400">Guest Identification Document</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            onclick="rotateGuestIdViewer()"
            title="Rotate 90°"
            class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <i data-lucide="rotate-cw" class="w-4 h-4"></i>
            <span class="hidden sm:inline">Rotate</span>
          </button>
          <button
            type="button"
            onclick="downloadGuestIdViewer()"
            title="Download Photo"
            class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <i data-lucide="download" class="w-4 h-4"></i>
            <span class="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onclick="closeGuestIdViewer()"
            class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
          >
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Viewer Body with Prev / Next Navigation -->
      <div class="relative p-3 sm:p-5 bg-slate-950 flex flex-col items-center justify-center min-h-[360px] max-h-[78vh] select-none">
        <button
          type="button"
          id="btnViewerPrev"
          onclick="prevViewerPhoto()"
          title="Previous Photo (Left Arrow)"
          class="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white flex items-center justify-center backdrop-blur-xs border border-slate-700 hover:border-indigo-500 transition cursor-pointer shadow-xl"
        >
          <i data-lucide="chevron-left" class="w-5 h-5"></i>
        </button>

        <img
          id="guestIdViewerImg"
          src=""
          alt="Guest ID Photo"
          class="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl transition-transform duration-200"
        />

        <button
          type="button"
          id="btnViewerNext"
          onclick="nextViewerPhoto()"
          title="Next Photo (Right Arrow)"
          class="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white flex items-center justify-center backdrop-blur-xs border border-slate-700 hover:border-indigo-500 transition cursor-pointer shadow-xl"
        >
          <i data-lucide="chevron-right" class="w-5 h-5"></i>
        </button>

        <!-- Thumbnail strip for multi-image switching -->
        <div id="guestIdViewerThumbs" class="hidden items-center justify-center gap-2 mt-3 pt-2 border-t border-slate-800/80 max-w-full overflow-x-auto px-2">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span class="text-[11px] flex items-center gap-1.5 text-slate-400">
          <i data-lucide="info" class="w-3.5 h-3.5 text-slate-500"></i>
          Rotate if sideways · Use arrows to browse multiple IDs
        </span>
        <button
          type="button"
          onclick="closeGuestIdViewer()"
          class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer"
        >
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

        <!-- Operational Status Toggle -->
        <label class="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/30 transition cursor-pointer">
          <div>
            <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <i data-lucide="power" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Business Operational Status</span>
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5">Activate or deactivate this business. Inactive businesses are hidden from staff and managers.</div>
          </div>
          <div class="flex items-center gap-2">
            <span id="modalConfigActiveLabel" class="text-xs font-bold text-emerald-700">Active</span>
            <input
              type="checkbox"
              id="modalConfigIsActive"
              onchange="document.getElementById('modalConfigActiveLabel').innerText = this.checked ? 'Active' : 'Inactive'; document.getElementById('modalConfigActiveLabel').className = this.checked ? 'text-xs font-bold text-emerald-700' : 'text-xs font-bold text-slate-400';"
              class="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
              checked
            />
          </div>
        </label>

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
  <div id="toast" class="fixed bottom-20 right-4 sm:right-5 z-[60] bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transform translate-y-16 opacity-0 transition-all duration-200 pointer-events-none">
    <i data-lucide="info" class="w-4 h-4 text-indigo-400"></i>
    <span id="toastMsg">Action completed</span>
  </div>

  <!-- AI Room Booking Chatbox Floating Launcher & Drawer -->
  <div id="aiBookingChatRoot" class="hidden">
    <!-- Floating Action Button -->
    <button
      type="button"
      id="aiChatFab"
      onclick="openAiBookingChat()"
      class="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-bold shadow-xl shadow-indigo-500/30 active:scale-95 transition cursor-pointer"
    >
      <i data-lucide="sparkles" class="w-4 h-4"></i>
      <span>AI Book Room</span>
    </button>

    <!-- Chat Drawer -->
    <div
      id="aiBookingChatDrawer"
      class="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[410px] z-40 hidden flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[84vh] sm:max-h-[600px]"
    >
      <!-- Header -->
      <div class="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <i data-lucide="sparkles" class="w-4 h-4 text-white"></i>
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold leading-tight truncate">AI Booking Assistant</h3>
            <p id="aiChatPropertySubtitle" class="text-[11px] text-indigo-100 truncate">Type name, room no. & persons to book</p>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onclick="fillAiBookingTemplate()"
            title="Insert 3-line booking template"
            class="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-semibold transition cursor-pointer"
          >
            Template
          </button>
          <button
            type="button"
            onclick="resetAiBookingChat()"
            title="Clear conversation"
            class="p-1.5 rounded-lg hover:bg-white/15 text-indigo-100 hover:text-white transition cursor-pointer"
          >
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          </button>
          <button
            type="button"
            onclick="closeAiBookingChat()"
            title="Close chatbox"
            class="p-1.5 rounded-lg hover:bg-white/15 text-indigo-100 hover:text-white transition cursor-pointer"
          >
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Quick Action Bar -->
      <div class="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
        <button
          type="button"
          onclick="fillAiBookingTemplate()"
          class="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer"
        >
          📝 Use Booking Format
        </button>
        <button
          type="button"
          onclick="sendQuickAiMessage('Which rooms are available today?')"
          class="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer"
        >
          🛏️ Available Rooms
        </button>
        <button
          type="button"
          onclick="sendQuickAiMessage('cancel')"
          class="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer"
        >
          Reset Draft
        </button>
      </div>

      <!-- Messages List -->
      <div id="aiChatMessages" class="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 min-h-[220px]">
        <!-- Rendered by JS -->
      </div>

      <!-- Input Composer -->
      <form onsubmit="handleAiChatSubmit(event)" class="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
        <textarea
          id="aiChatInput"
          rows="3"
          onkeydown="handleAiChatKeydown(event)"
          placeholder="Customer Name: Rahul Sharma&#10;Room No. 101&#10;Number of person: 2"
          class="w-full px-3 py-2 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50/40 font-medium text-slate-900 placeholder:text-slate-400"
        ></textarea>
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] text-slate-400">Optional: Cash/Online, Amount, Tomorrow, Nights</span>
          <button
            type="submit"
            id="aiChatSendBtn"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span id="aiChatSendLabel">Send &amp; Book</span>
          </button>
        </div>
      </form>
    </div>
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
    let showFormerStaff = false; // Toggle to include staff who left in current/future views
    let attendanceMap = {}; // { [staff_id_YYYY-MM-DD]: "present" | "absent" | "day_off" | "leave" }
    let priorLeavesMap = {}; // { [staff_id]: number } leaves taken before current month
    let priorLeavesByMonthMap = {}; // { [staff_id]: { [YYYY-MM]: number } } prior leaves grouped by month
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
      const chatRoot = document.getElementById("aiBookingChatRoot");
      if (chatRoot) chatRoot.classList.add("hidden");
      if (typeof closeAiBookingChat === "function") closeAiBookingChat();
      refreshIcons();
    }

    function lockApp() {
      currentSessionPin = "";
      try {
        document.cookie = "auth_pin=; path=/; max-age=0";
      } catch (e) {}
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

      const chatRoot = document.getElementById("aiBookingChatRoot");
      if (chatRoot) {
        if (currentSessionPin) {
          chatRoot.classList.remove("hidden");
          const sub = document.getElementById("aiChatPropertySubtitle");
          if (sub) {
            sub.innerText = currentUserRole === "manager" && currentManagerInfo?.property_name
              ? \`\${currentManagerInfo.property_name} · Quick Room Booking\`
              : "Type name, room no. & persons to book";
          }
        } else {
          chatRoot.classList.add("hidden");
        }
      }
      refreshIcons();
    }

    function getScopedStaffList() {
      const activePropIds = new Set(properties.filter(p => p.active !== 0).map(p => p.id));
      if (currentUserRole === "manager" && currentManagerInfo && currentManagerInfo.property_id) {
        return staffList.filter(s => s.property_id === currentManagerInfo.property_id && activePropIds.has(s.property_id));
      }
      if (activePropertyId === 'all') {
        return staffList.filter(s => activePropIds.has(s.property_id));
      }
      return staffList.filter(s => s.property_id === activePropertyId && activePropIds.has(s.property_id));
    }

    function getStaffJoinYM(staff) {
      const d = staff.joining_date || (staff.created_at ? staff.created_at.split(' ')[0] : '2026-10-01');
      return d.slice(0, 7);
    }

    function staffHasAttendanceInMonth(staffId, ym) {
      const prefix = staffId + "_" + ym + "-";
      return Object.keys(attendanceMap).some(k => k.startsWith(prefix));
    }

    function staffHasFinancialInMonth(staffId) {
      return paymentsList.some(p => p.staff_id === staffId) ||
             advancesList.some(a => a.staff_id === staffId) ||
             bonusesList.some(b => b.staff_id === staffId);
    }

    function isStaffVisibleForMonth(staff, year, month) {
      if (staff.active !== 0) return true;
      const viewYM = \`\${year}-\${String(month + 1).padStart(2, "0")}\`;
      const leftDate = staff.left_date || "";
      const leftYM = leftDate ? leftDate.slice(0, 7) : "";
      const joinYM = getStaffJoinYM(staff);
      const hasFinancial = staffHasFinancialInMonth(staff.id);
      const hasActivity = hasFinancial || staffHasAttendanceInMonth(staff.id, viewYM);

      // Automatically preserve full history for any past month strictly before their leaving month
      if (leftYM && viewYM < leftYM && (viewYM >= joinYM || hasActivity)) {
        return true;
      }
      // Keep visible if they had salary payments/advances/bonuses recorded in this viewed month
      if (hasFinancial) {
        return true;
      }
      // Otherwise show only when the "Show Left Staff" toggle is enabled
      if (showFormerStaff && (viewYM >= joinYM || hasActivity || viewYM === leftYM)) {
        return true;
      }
      return false;
    }

    function isStaffVisibleForDailyDate(staff, dateStr) {
      if (staff.active !== 0) return true;
      if (showFormerStaff) return true;
      const leftDate = staff.left_date || "";
      const joinYM = getStaffJoinYM(staff);
      const hasRecord = attendanceMap[\`\${staff.id}_\${dateStr}\`] !== undefined;
      if (leftDate && dateStr < leftDate && (dateStr.slice(0, 7) >= joinYM || hasRecord)) {
        return true;
      }
      return false;
    }

    function getVisibleStaffList(mode = "month", dateStrOverride = null) {
      const scoped = getScopedStaffList();
      if (mode === "active_only") {
        return scoped.filter(s => s.active !== 0);
      }
      if (mode === "daily") {
        const dStr = dateStrOverride || formatIsoDate(dailyDate);
        return scoped.filter(s => isStaffVisibleForDailyDate(s, dStr));
      }
      if (mode === "directory") {
        return showFormerStaff ? scoped : scoped.filter(s => s.active !== 0);
      }
      return scoped.filter(s => isStaffVisibleForMonth(s, currentYear, currentMonth));
    }

    function formatShortLeftDate(dateStr) {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length < 3) return dateStr;
      const mIdx = parseInt(parts[1], 10) - 1;
      const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const d = parseInt(parts[2], 10);
      return \`\${d} \${MONTHS_SHORT[mIdx] || parts[1]}\`;
    }

    function renderLeftBadge(staff) {
      if (!staff || staff.active !== 0) return "";
      const label = staff.left_date ? \`Left \${formatShortLeftDate(staff.left_date)}\` : "Left";
      return \`<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700 border border-slate-300" title="Former staff (History preserved)">\${label}</span>\`;
    }

    function toggleShowFormerStaff() {
      showFormerStaff = !showFormerStaff;
      renderActiveView();
    }

    function updateFormerStaffToggleUI() {
      const formerCount = getScopedStaffList().filter(s => s.active === 0).length;
      const btns = document.querySelectorAll(".former-staff-toggle-btn");
      btns.forEach(btn => {
        const labelEl = btn.querySelector(".former-staff-toggle-label");
        if (formerCount === 0 && !showFormerStaff) {
          btn.classList.add("hidden");
          return;
        }
        btn.classList.remove("hidden");
        if (showFormerStaff) {
          btn.className = "former-staff-toggle-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-800 rounded-xl transition cursor-pointer";
          if (labelEl) labelEl.innerText = \`Showing Left Staff (\${formerCount})\`;
        } else {
          btn.className = "former-staff-toggle-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer";
          if (labelEl) labelEl.innerText = \`Show Left Staff (\${formerCount})\`;
        }
      });
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
          try {
            document.cookie = "auth_pin=" + encodeURIComponent(pin) + "; path=/; max-age=2592000; SameSite=Lax";
          } catch (e) {}
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
      priorLeavesByMonthMap = (!Array.isArray(data) && data.prior_by_month) ? data.prior_by_month : {};
      records.forEach(item => {
        attendanceMap[\`\${item.staff_id}_\${item.date}\`] = item.status;
      });
    }

    // Carry-forward leave balance calculator:
    // Every employee renews by +3 (or custom/property allowance) each month.
    // Unused leave balance carries forward: Available This Month = Allowance (3) + Carry Forward Balance.
    // Leaves taken in current month are deducted from Available.
    function calculateStaffLeaveDetails(staff, year, month) {
      const prop = properties.find(p => p.id === staff.property_id) || { monthly_leave_allowance: 3 };
      const monthlyAllowance = (staff.custom_leave_allowance !== null && staff.custom_leave_allowance !== undefined)
        ? parseFloat(staff.custom_leave_allowance)
        : (parseFloat(prop.monthly_leave_allowance) || 3);

      const viewYear = year;
      const viewMonthNum = month + 1; // 1-12
      const currentYM = \`\${viewYear}-\${String(viewMonthNum).padStart(2, "0")}\`;

      // Determine joining year and month
      const effectiveJoinDate = staff.joining_date || (staff.created_at ? staff.created_at.split(' ')[0] : '2026-10-01');
      const parts = effectiveJoinDate.split('-');
      let jY = parseInt(parts[0], 10) || viewYear;
      let jM = parseInt(parts[1], 10) || viewMonthNum;

      // If staff has prior leaves recorded in an earlier month than jY-jM, adjust to the earliest month
      if (priorLeavesByMonthMap && priorLeavesByMonthMap[staff.id]) {
        Object.keys(priorLeavesByMonthMap[staff.id]).forEach(ym => {
          const pParts = ym.split('-');
          const pY = parseInt(pParts[0], 10);
          const pM = parseInt(pParts[1], 10);
          if (pY < jY || (pY === jY && pM < jM)) {
            jY = pY;
            jM = pM;
          }
        });
      }

      const joinYM = \`\${jY}-\${String(jM).padStart(2, "0")}\`;
      const openingBalance = parseFloat(staff.opening_leave_balance) || 0;

      // If the viewed month is strictly before the staff member joined:
      if (currentYM < joinYM) {
        return {
          monthlyAllowance: 0,
          monthsElapsed: 0,
          openingBalance: 0,
          carryForwardBalance: 0,
          availableThisMonth: 0,
          currentMonthLeaves: 0,
          priorTaken: 0,
          totalTaken: 0,
          totalAccrued: 0,
          leaveBalance: 0
        };
      }

      // Calculate carry-forward balance month by month from joining month up to prior month
      let carryForwardBalance = openingBalance;
      let mY = jY;
      let mM = jM;
      let monthsElapsed = 0;

      while (true) {
        const ymStr = \`\${mY}-\${String(mM).padStart(2, "0")}\`;
        if (ymStr >= currentYM) {
          // Reached current month: stop carrying forward
          monthsElapsed++;
          break;
        }

        monthsElapsed++;
        let takenInMonth = 0;
        if (priorLeavesByMonthMap && priorLeavesByMonthMap[staff.id] && priorLeavesByMonthMap[staff.id][ymStr] !== undefined) {
          takenInMonth = priorLeavesByMonthMap[staff.id][ymStr];
        }

        // Each prior month renewed by +monthlyAllowance
        // Unused leaves carry forward; if overdrawn, that month's salary was already deducted in payroll (min 0)
        carryForwardBalance = Math.max(0, carryForwardBalance + monthlyAllowance - takenInMonth);

        mM++;
        if (mM > 12) {
          mM = 1;
          mY++;
        }
        if (mY > viewYear + 5) break; // Infinite loop safety
      }

      // Fallback if priorLeavesByMonthMap had no data but total priorLeavesMap was provided
      if ((!priorLeavesByMonthMap || !priorLeavesByMonthMap[staff.id] || Object.keys(priorLeavesByMonthMap[staff.id]).length === 0) && priorLeavesMap && priorLeavesMap[staff.id]) {
        const priorMonths = Math.max(0, monthsElapsed - 1);
        const priorAccrued = openingBalance + (priorMonths * monthlyAllowance);
        const priorTakenTotal = priorLeavesMap[staff.id] || 0;
        carryForwardBalance = Math.max(0, priorAccrued - priorTakenTotal);
      }

      // Renewal for current month: Monthly Allowance (3) + Carry Forward Balance
      const availableThisMonth = monthlyAllowance + carryForwardBalance;

      // Count leaves taken in the current month directly from real-time attendanceMap
      const daysCount = getDaysInMonth(year, month);
      let currentMonthLeaves = 0;
      for (let day = 1; day <= daysCount; day++) {
        const dStr = \`\${year}-\${String(month + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
        if (attendanceMap[\`\${staff.id}_\${dStr}\`] === "leave") {
          currentMonthLeaves++;
        }
      }

      const priorTaken = (priorLeavesMap && priorLeavesMap[staff.id]) || 0;
      const totalTaken = priorTaken + currentMonthLeaves;
      const totalAccrued = openingBalance + (monthsElapsed * monthlyAllowance);

      // Remaining leave balance for current month: Available - Current Month Leaves
      const leaveBalance = availableThisMonth - currentMonthLeaves;

      return {
        monthlyAllowance,
        monthsElapsed,
        openingBalance,
        carryForwardBalance,
        availableThisMonth,
        currentMonthLeaves,
        priorTaken,
        totalTaken,
        totalAccrued,
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
        const count = staffList.filter(s => s.active !== 0 && s.property_id === assignedProp.id).length;
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

      let html = "";
      const activeProps = properties.filter(p => p.active !== 0);
      if (activePropertyId !== "all" && !activeProps.some(p => p.id === activePropertyId)) {
        activePropertyId = "all";
      }

      // 1. Individual active businesses rendered first
      activeProps.forEach(prop => {
        const isSelected = activePropertyId === prop.id;
        const count = staffList.filter(s => s.active !== 0 && s.property_id === prop.id).length;
        html += \`
          <button onclick="selectProperty('\${prop.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 \${isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer'}">
            <span>\${escapeHtml(prop.name)}</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] \${isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'}">\${count}</span>
          </button>
        \`;
      });

      // 2. "All Properties" MUST be at last in sequence
      const totalStaffCount = staffList.filter(s => {
        const p = properties.find(prop => prop.id === s.property_id);
        return s.active !== 0 && p && p.active !== 0;
      }).length;

      html += \`
        <button onclick="selectProperty('all')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 \${activePropertyId === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer'}">
          <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
          <span>All Properties (\${totalStaffCount})</span>
        </button>
      \`;

      container.innerHTML = html;
      updatePropertyAllowanceBanner();
      refreshIcons();
    }

    async function selectProperty(id) {
      if (currentUserRole === "manager" && currentManagerInfo) {
        activePropertyId = currentManagerInfo.property_id;
      } else {
        activePropertyId = id;
      }
      calendarSelectedProperty = (id !== "all") ? id : (properties.find(p => p.active !== 0 && p.has_lodging === 1)?.id || properties[0]?.id || "");
      financeFilterProperty = id;

      if (id === "elite-homes") {
        autoSyncEliteHomesCalendar();
      }

      renderPropertyTabs();
      if (currentView === "finances") {
        await Promise.all([fetchRoomBookings(), fetchFinances()]);
      }
      renderActiveView();
    }

    function updatePropertyAllowanceBanner() {
      const banner = document.getElementById("propertyAllowanceBanner");
      const text = document.getElementById("currentAllowanceText");
      if (activePropertyId === 'all') {
        text.innerText = "Configured separately per property";
      } else {
        const prop = properties.find(p => p.id === activePropertyId);
        text.innerText = (prop ? prop.monthly_leave_allowance : 3) + " days / month";
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
      await onMonthUpdated();
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

      const filteredStaff = getVisibleStaffList("month");
      updateFormerStaffToggleUI();

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
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || 'General', monthly_leave_allowance: 3 };

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
          <tr class="hover:bg-slate-50/60 transition group \${staff.active === 0 ? 'opacity-85' : ''}">
            <td class="sticky-col py-2.5 px-3.5 \${staff.active === 0 ? 'bg-slate-50/90' : 'bg-white'} group-hover:bg-slate-50 border-r border-slate-200">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 flex-wrap" onclick="handleStaffNameClick('\${staff.id}')">
                    <span>\${escapeHtml(staff.name)}</span>
                    \${renderLeftBadge(staff)}
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
              <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border \${balanceBadge}" title="Renewed: +\${leaveDetails.monthlyAllowance} | Carry Forward: +\${leaveDetails.carryForwardBalance.toFixed(1)} | Available: \${leaveDetails.availableThisMonth.toFixed(1)} | Taken: \${leaveDetails.currentMonthLeaves} | Remaining: \${leaveRemaining.toFixed(1)} Bal">
                \${balanceText}
              </span>
            </td>
          </tr>
        \`;

        // Mobile Card with 7-column Calendar Accordion
        const isOpen = openStaffCalendars.has(staff.id);
        mobileCardsHtml += \`
          <div class="bg-white rounded-2xl border \${staff.active === 0 ? 'border-slate-300 bg-slate-50/40' : 'border-slate-200/90'} p-3.5 sm:p-4 shadow-xs space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap cursor-pointer" onclick="handleStaffNameClick('\${staff.id}')">
                  <span>\${escapeHtml(staff.name)}</span>
                  \${renderLeftBadge(staff)}
                  \${staff.is_manager ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 text-violet-800">Manager</span>' : ''}
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <span class="text-indigo-600 font-semibold">\${escapeHtml(prop.name)}</span>
                  \${staff.role ? \`<span>•</span><span>\${escapeHtml(staff.role)}</span>\` : ''}
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold border \${balanceBadge}" title="Renewed: +\${leaveDetails.monthlyAllowance} | Carry Forward: +\${leaveDetails.carryForwardBalance.toFixed(1)} | Available: \${leaveDetails.availableThisMonth.toFixed(1)} | Taken: \${leaveDetails.currentMonthLeaves} | Remaining: \${leaveRemaining.toFixed(1)} Bal">
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
      const filteredStaff = getVisibleStaffList("active_only");

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
        await onMonthUpdated();
        return;
      }
      renderDailyView();
    }

    function renderDailyView() {
      const container = document.getElementById("dailyStaffList");
      const title = document.getElementById("dailyDateTitle");
      const dateStr = formatIsoDate(dailyDate);

      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      title.innerText = dailyDate.toLocaleDateString('en-US', options);

      const filteredStaff = getVisibleStaffList("daily");
      updateFormerStaffToggleUI();

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
          <div class="bg-white rounded-2xl p-4 border \${staff.active === 0 ? 'border-slate-300 bg-slate-50/50' : 'border-slate-200'} shadow-xs flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h4 class="font-bold text-slate-900 text-sm">\${escapeHtml(staff.name)}</h4>
                  \${renderLeftBadge(staff)}
                  \${staff.is_manager ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 text-violet-800">Manager</span>' : ''}
                </div>
                <div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="text-indigo-600 font-semibold">\${escapeHtml(prop.name)}</span>
                  \${staff.role ? \`<span>•</span><span>\${escapeHtml(staff.role)}</span>\` : ''}
                  <span>•</span>
                  <span class="px-1.5 py-0.2 rounded-md font-bold text-[10px] border \${balClass}" title="Renewed: +\${leaveDetails.monthlyAllowance} | Carry Forward: +\${leaveDetails.carryForwardBalance.toFixed(1)} | Available: \${leaveDetails.availableThisMonth.toFixed(1)} | Taken: \${leaveDetails.currentMonthLeaves} | Remaining: \${bal.toFixed(1)} Bal">
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

      const filteredStaff = getVisibleStaffList("month");
      updateFormerStaffToggleUI();

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
            <td class="sticky-col py-3 px-3.5 \${staff.active === 0 ? 'bg-slate-50/90' : 'bg-white'} border-r border-slate-200">
              <div class="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>\${escapeHtml(staff.name)}</span>
                \${renderLeftBadge(staff)}
              </div>
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
              <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border \${balance >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}" title="Renewed: +\${leaveDetails.monthlyAllowance} | Carry Forward: +\${leaveDetails.carryForwardBalance.toFixed(1)} | Available: \${leaveDetails.availableThisMonth.toFixed(1)} | Taken: \${leaveDetails.currentMonthLeaves} | Remaining: \${balance.toFixed(1)} Bal">
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
      const filteredStaff = getVisibleStaffList("directory");
      updateFormerStaffToggleUI();

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
          <div class="bg-white rounded-2xl p-5 border \${staff.active === 0 ? 'border-slate-300 bg-slate-50/40' : 'border-slate-200/90'} shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition">
            
            <div>
              <!-- Header -->
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="font-bold text-slate-900 text-base">\${escapeHtml(staff.name)}</h4>
                    \${renderLeftBadge(staff)}
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

            <!-- Documents & Restore Actions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div class="text-xs text-slate-500 flex items-center gap-1.5">
                <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>\${docCount} \${docCount === 1 ? 'Document' : 'Documents'}</span>
              </div>
              <div class="flex items-center gap-1.5">
                \${staff.active === 0 && currentUserRole === 'admin' ? \`
                  <button onclick="handleRestoreStaffById('\${staff.id}')" class="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1 cursor-pointer" title="Restore staff back to active roster">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                    <span>Restore</span>
                  </button>
                \` : ''}
                <button onclick="openDocumentsModal('\${staff.id}')" class="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1.5">
                  <i data-lucide="folder-open" class="w-3.5 h-3.5"></i>
                  <span>Manage Docs</span>
                </button>
              </div>
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
                  <td class="p-2.5 font-medium">Monthly Leave Allowance</td>
                  <td class="p-2.5 text-right text-slate-500">Renewed: +\${leaveDetails.monthlyAllowance} | Carry Forward: +\${leaveDetails.carryForwardBalance.toFixed(1)}</td>
                  <td class="p-2.5 text-right font-mono font-bold text-slate-700">\${leaveDetails.availableThisMonth.toFixed(1)} Days Available</td>
                </tr>
                <tr>
                  <td class="p-2.5 font-medium">Leaves Taken & Balance</td>
                  <td class="p-2.5 text-right text-slate-500">Taken this month: \${leaveDetails.currentMonthLeaves} day(s)</td>
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
      const filteredStaff = getVisibleStaffList("month");
      updateFormerStaffToggleUI();

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
      const filteredStaff = getVisibleStaffList("month");
      updateFormerStaffToggleUI();

      let csv = "Staff Name,Property,Role,";
      for (let day = 1; day <= daysCount; day++) {
        csv += \`Day \${day},\`;
      }
      csv += "Present,Day Off,Absent,Leave Taken,Leave Allowed,Leave Remaining\\n";

      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || '', monthly_leave_allowance: 3 };
        const leaveDetails = calculateStaffLeaveDetails(staff, currentYear, currentMonth);
        const allowedLeaves = leaveDetails.availableThisMonth;

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

        const rem = leaveDetails.leaveBalance;
        csv += \`"\${staff.name}","\${prop.name}","\${staff.role || ''}",\${dayVals}\${countP},\${countDO},\${countA},\${countL},\${allowedLeaves},\${rem.toFixed(1)}\\n\`;
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

      const staff = staffId ? staffList.find(s => s.id === staffId) : null;
      const leftBanner = document.getElementById("staffLeftBanner");
      const leftBannerText = document.getElementById("staffLeftBannerText");
      const leftDateContainer = document.getElementById("staffLeftDateContainer");
      const leftDateInput = document.getElementById("staffLeftDate");
      const allowedProps = properties.filter(p => p.active !== 0 || (staff && staff.property_id === p.id));
      propSelect.innerHTML = allowedProps.map(p => \`
        <option value="\${p.id}">\${escapeHtml(p.name)}\${p.active === 0 ? ' (Inactive)' : ''}</option>
      \`).join("");

      if (staffId) {
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

        if (staff.active === 0) {
          if (leftBanner) leftBanner.classList.remove("hidden");
          if (leftBannerText) leftBannerText.innerText = "Left on " + (staff.left_date || "archived date");
          if (leftDateContainer) leftDateContainer.classList.remove("hidden");
          if (leftDateInput) leftDateInput.value = staff.left_date || formatIsoDate(new Date());
          btnDelete.classList.add("hidden");
        } else {
          if (leftBanner) leftBanner.classList.add("hidden");
          if (leftDateContainer) leftDateContainer.classList.add("hidden");
          if (leftDateInput) leftDateInput.value = "";
          btnDelete.classList.remove("hidden");
        }
      } else {
        title.innerText = "Add Staff Member";
        if (leftBanner) leftBanner.classList.add("hidden");
        if (leftDateContainer) leftDateContainer.classList.add("hidden");
        if (leftDateInput) leftDateInput.value = "";
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
      const leftDateContainer = document.getElementById("staffLeftDateContainer");
      if (id && leftDateContainer && !leftDateContainer.classList.contains("hidden")) {
        const leftDateVal = document.getElementById("staffLeftDate").value;
        if (leftDateVal) payload.left_date = leftDateVal;
      }
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

    function handleDeleteStaff() {
      const id = document.getElementById("staffId").value;
      if (!id) return;
      const staff = staffList.find(s => s.id === id);
      const nameEl = document.getElementById("markLeftStaffName");
      const dateInput = document.getElementById("markLeftDateInput");
      if (nameEl) nameEl.innerText = staff ? staff.name : "Staff Member";
      if (dateInput) dateInput.value = formatIsoDate(new Date());
      const modal = document.getElementById("markLeftModal");
      if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        refreshIcons();
      }
    }

    function closeMarkLeftModal() {
      const modal = document.getElementById("markLeftModal");
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    }

    async function confirmMarkStaffLeft() {
      const id = document.getElementById("staffId").value;
      if (!id) return;
      const leftDate = document.getElementById("markLeftDateInput").value || formatIsoDate(new Date());

      try {
        const res = await fetch(\`/api/staff/\${id}?left_date=\${encodeURIComponent(leftDate)}\`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        closeMarkLeftModal();
        closeStaffModal();
        await fetchStaff();
        renderPropertyTabs();
        renderActiveView();
        showToast("Staff marked as left (past history preserved)");
      } catch (err) {
        showToast("Error marking staff left: " + err.message);
      }
    }

    function handleRestoreStaff() {
      const id = document.getElementById("staffId").value;
      if (id) handleRestoreStaffById(id, true);
    }

    async function handleRestoreStaffById(staffId, fromModal = false) {
      if (!staffId) return;
      const staff = staffList.find(s => s.id === staffId);
      const staffName = staff ? staff.name : "this staff member";
      if (!confirm(\`Restore \${staffName} back to the active staff list?\`)) return;

      try {
        const res = await fetch(\`/api/staff/\${staffId}/restore\`, {
          method: "POST",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Restore failed");
        if (fromModal) closeStaffModal();
        await fetchStaff();
        renderPropertyTabs();
        renderActiveView();
        showToast(staffName + " restored to active staff");
      } catch (err) {
        showToast("Error restoring staff: " + err.message);
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
      properties.filter(p => p.active !== 0).forEach(p => {
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
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="door-closed" class="w-5 h-5 text-indigo-600"></i>
                    <span>Room Bookings & Lodging Revenue</span>
                  </h3>
                  \${propId === 'elite-homes' ? \`
                    <button
                      type="button"
                      onclick="syncAirbnbCalendar()"
                      title="Fetch latest bookings from Airbnb Host Portal"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      <i data-lucide="refresh-cw" class="w-3.5 h-3.5 airbnb-sync-icon"></i>
                      <span class="airbnb-sync-text">Sync Airbnb</span>
                    </button>
                  \` : ''}
                </div>
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
                <span class="text-[11px] font-bold \${todayBookings.length > propRooms.length ? 'text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200' : (todayBookings.length > 0 ? 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200' : 'text-slate-500')}">\${todayBookings.length}/\${propRooms.length} rooms booked</span>
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
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onclick="openAiBookingChat()"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs transition cursor-pointer"
                  >
                    <i data-lucide="sparkles" class="w-3 h-3"></i>
                    <span>AI Chat Book</span>
                  </button>
                  <span class="text-[11px] text-indigo-600 font-medium hidden sm:inline">Click room above or select below</span>
                </div>
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
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Guest Name(s) / Ref (Optional)</label>
                    <input
                      type="text"
                      id="mgrBookGuest"
                      placeholder="e.g. Rahul Sharma, Priya Sharma"
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

                <!-- Quick ID Snap for Manager -->
                <div class="pt-2 border-t border-indigo-100 flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <input type="hidden" id="mgrGuestIdData" />
                    <input type="file" id="mgrGuestIdCameraInput" accept="image/*" capture="environment" class="hidden" onchange="handleMgrGuestIdSelected(event)" />
                    <input type="file" id="mgrGuestIdFileInput" accept="image/*" multiple class="hidden" onchange="handleMgrGuestIdSelected(event)" />
                    <button
                      type="button"
                      onclick="document.getElementById('mgrGuestIdCameraInput').click()"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      <i data-lucide="camera" class="w-3.5 h-3.5 text-indigo-600"></i>
                      <span id="mgrGuestIdButtonText">📷 Click / Snap Guest ID</span>
                    </button>
                    <button
                      type="button"
                      onclick="document.getElementById('mgrGuestIdFileInput').click()"
                      class="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Upload File(s)
                    </button>
                    <div id="mgrGuestIdBadge" class="hidden items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-bold">
                      <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span id="mgrGuestIdBadgeText" onclick="viewMgrGuestIds()" class="cursor-pointer hover:underline">ID Attached</span>
                      <button type="button" onclick="viewMgrGuestIds()" title="View Uploaded IDs" class="text-indigo-600 hover:text-indigo-800 cursor-pointer ml-1 text-xs">👁️ View</button>
                      <button type="button" onclick="clearMgrGuestId()" title="Remove All IDs" class="text-rose-500 hover:text-rose-700 ml-1 text-xs cursor-pointer font-bold">✕</button>
                    </div>
                  </div>
                  <span class="text-[10px] text-slate-400">Multiple guest IDs supported</span>
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
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-xs font-black text-slate-900">Room \${escapeHtml(b.room_number)}</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">Slot #\${b.slot_number || 1}</span>
                            \${b.platform ? \`
                              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold \${
                                (b.platform || '').toLowerCase().includes('airbnb') ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                (b.platform || '').toLowerCase().includes('booking') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }">
                                \${escapeHtml(b.platform)}
                              </span>
                            \` : ''}
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
                          <span class="text-slate-500 truncate max-w-[175px]">\${escapeHtml(b.guest_name || 'Guest')}\${(b.guest_count && b.guest_count > 1) ? \` · \${b.guest_count} persons\` : (b.guest_count === 1 ? ' · 1 person' : '')}</span>
                          <span class="text-sm font-black font-mono \${isOnline ? 'text-indigo-900' : 'text-amber-900'}">
                            ₹\${formatCurrency(b.amount)}
                          </span>
                        </div>

                        \${b.notes ? \`<div class="text-[10px] text-slate-400 italic truncate">\${escapeHtml(b.notes)}</div>\` : ''}

                        <!-- Guest ID indicator & quick upload -->
                        <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                          \${(() => {
                            const ids = parseGuestIdImages(b.guest_id_image);
                            if (ids.length > 0) {
                              return \`
                                <button
                                  type="button"
                                  onclick="openGuestIdViewer('\${b.id}')"
                                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition cursor-pointer border border-indigo-200"
                                >
                                  <i data-lucide="id-card" class="w-3.5 h-3.5 text-indigo-600"></i>
                                  <span>🪪 View IDs (\${ids.length})</span>
                                </button>
                                <button
                                  type="button"
                                  onclick="triggerQuickIdUpload('\${b.id}')"
                                  title="Snap & Add More ID Photos"
                                  class="text-[10px] text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                                >
                                  + Add ID
                                </button>
                              \`;
                            } else {
                              return \`
                                <button
                                  type="button"
                                  onclick="triggerQuickIdUpload('\${b.id}')"
                                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 text-slate-500 hover:text-indigo-700 text-[11px] font-semibold transition cursor-pointer"
                                >
                                  <i data-lucide="camera" class="w-3 h-3 text-slate-400"></i>
                                  <span>📷 Snap / Upload IDs</span>
                                </button>
                              \`;
                            }
                          })()}
                        </div>
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

    let mgrGuestIdList = []; // Array of { url, label }

    async function handleMgrGuestIdSelected(e) {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      try {
        showToast(\`Processing \${files.length} ID photo(s)...\`);
        for (let i = 0; i < files.length; i++) {
          const dataUrl = await compressImageToDataUrl(files[i]);
          const nextIdx = mgrGuestIdList.length + 1;
          const uploaded = await uploadGuestIdPhotoToR2(dataUrl, \`ID #\${nextIdx}\`);
          mgrGuestIdList.push(uploaded);
        }
        updateMgrGuestIdDisplay();
        showToast(\`\${mgrGuestIdList.length} ID photo(s) stored in R2!\`);
      } catch (err) {
        showToast("Failed to process ID photo: " + err.message);
      } finally {
        e.target.value = "";
      }
    }

    function updateMgrGuestIdDisplay() {
      const dataInput = document.getElementById("mgrGuestIdData");
      const badge = document.getElementById("mgrGuestIdBadge");
      const badgeText = document.getElementById("mgrGuestIdBadgeText");
      const btnText = document.getElementById("mgrGuestIdButtonText");

      if (dataInput) {
        dataInput.value = mgrGuestIdList.length > 0 ? JSON.stringify(mgrGuestIdList) : "";
      }
      if (badge && badgeText) {
        if (mgrGuestIdList.length > 0) {
          badge.classList.remove("hidden");
          badge.classList.add("inline-flex");
          badgeText.innerText = \`\${mgrGuestIdList.length} ID\${mgrGuestIdList.length > 1 ? 's' : ''} Attached\`;
        } else {
          badge.classList.add("hidden");
          badge.classList.remove("inline-flex");
        }
      }
      if (btnText) {
        btnText.innerText = mgrGuestIdList.length > 0 ? "+ Snap Another ID" : "📷 Click / Snap Guest ID";
      }
      refreshIcons();
    }

    function clearMgrGuestId() {
      mgrGuestIdList = [];
      updateMgrGuestIdDisplay();
      const cam = document.getElementById("mgrGuestIdCameraInput");
      const file = document.getElementById("mgrGuestIdFileInput");
      if (cam) cam.value = "";
      if (file) file.value = "";
    }

    function viewMgrGuestIds() {
      if (mgrGuestIdList.length === 0) return;
      const rawGuest = document.getElementById("mgrBookGuest")?.value?.trim() || "Guest";
      openMultiIdLightbox(mgrGuestIdList, 0, rawGuest, "Manager Quick Booking Preview");
    }

    async function submitManagerRoomBooking(e) {
      if (e) e.preventDefault();
      const propId = currentManagerInfo?.property_id || "";
      const roomId = document.getElementById("mgrBookRoomSelect")?.value;
      const rawGuest = document.getElementById("mgrBookGuest")?.value?.trim() || "";
      const names = rawGuest ? rawGuest.split(",").map(s => s.trim()).filter(Boolean) : [];
      const guestName = names.join(", ") || (rawGuest || null);
      const guestsJson = names.length > 0 ? JSON.stringify(names) : null;
      const notes = document.getElementById("mgrBookNotes")?.value?.trim() || "";
      const cleanMgrIds = mgrGuestIdList.map(item => ({ url: item.rawUrl || item.url, key: item.key, label: item.label }));
      const guestIdImage = cleanMgrIds.length > 0 ? JSON.stringify(cleanMgrIds) : (document.getElementById("mgrGuestIdData")?.value?.trim() || null);

      if (!propId) return showToast("Error: No property assigned");
      if (!roomId) return showToast("Please select a room");

      let payload = {
        property_id: propId,
        room_id: roomId,
        payment_mode: quickBookPaymentMode,
        guest_name: guestName,
        guests_json: guestsJson,
        guest_id_image: guestIdImage,
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
        clearMgrGuestId();

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
      if (subTab === "calendar" && calendarSelectedProperty === "elite-homes") {
        autoSyncEliteHomesCalendar();
      }
      renderFinancesView();
    }

    // -------------------------------------------------------------------------
    // SUBTAB 1: ADMIN FINANCIAL DASHBOARD
    // -------------------------------------------------------------------------
    function renderAdminFinancialDashboard(container) {
      const activePropIds = new Set(properties.filter(p => p.active !== 0).map(p => p.id));
      const records = activePropertyId === "all"
        ? financesList.filter(f => activePropIds.has(f.property_id))
        : financesList.filter(f => f.property_id === activePropertyId && activePropIds.has(f.property_id));

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

      const selectedProp = activePropertyId !== "all" ? properties.find(p => p.id === activePropertyId) : null;
      const showLodgingCard = !selectedProp || selectedProp.has_lodging === 1;
      const showFoodingCard = !selectedProp || selectedProp.has_fooding === 1;
      const showServicesCard = !selectedProp || selectedProp.has_services === 1;

      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Admin Filter & Action Bar -->
          <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Active Business Indicator (Unified top bar selection) -->
              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold \${selectedProp ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-800 border border-slate-200'}">
                  <i data-lucide="\${selectedProp ? 'building' : 'layout-grid'}" class="w-3.5 h-3.5 text-indigo-600"></i>
                  <span>\${selectedProp ? escapeHtml(selectedProp.name) : 'All Businesses Combined'}</span>
                  \${selectedProp ? \`<span class="text-[10px] px-1.5 py-0.2 rounded-full font-bold \${getBusinessTypeInfo(selectedProp).badgeClass}">\${escapeHtml(getBusinessTypeInfo(selectedProp).label)}</span>\` : ''}
                </span>
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

          <!-- Business Performance Comparison (when All Properties selected) -->
          \${activePropertyId === 'all' && properties.filter(p => p.active !== 0).length > 0 ? \`
            <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-600"></i>
                Business Performance Comparison (\${MONTH_NAMES[financeMonth]} \${financeYear})
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                \${properties.filter(p => p.active !== 0).map(p => {
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
      const isAll = (activePropertyId === "all");
      const activeLodgingProps = properties.filter(p => p.active !== 0 && p.has_lodging === 1);

      // Month info
      const mStr = String(financeMonth + 1).padStart(2, "0");
      const currentMonthPrefix = \`\${financeYear}-\${mStr}\`;
      const daysInMonth = new Date(financeYear, financeMonth + 1, 0).getDate();

      // Case 1: Specific Business Selected in Top Bar
      if (!isAll) {
        const prop = properties.find(p => p.id === activePropertyId);
        const propId = prop ? prop.id : "";
        const propName = prop ? prop.name : "Selected Business";
        const hasLodging = prop ? (prop.has_lodging === 1) : false;

        // If selected property has NO lodging, display a clean notice with a link to Business Offerings
        if (!hasLodging) {
          container.innerHTML = \`
            <div class="space-y-4">
              <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <i data-lucide="building" class="w-3.5 h-3.5 text-amber-600"></i>
                    <span>\${escapeHtml(propName)}</span>
                    <span class="text-[10px] opacity-75">(\${escapeHtml(getBusinessTypeInfo(prop).label)})</span>
                  </span>
                </div>
                <div class="text-xs text-slate-400">
                  Switch business using the top navigation bar
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
                <!-- Business Indicator (Single source of truth: top bar) -->
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <i data-lucide="hotel" class="w-3.5 h-3.5 text-indigo-600"></i>
                    <span>\${escapeHtml(propName)}</span>
                  </span>
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

                \${propId === 'elite-homes' ? \`
                  <button
                    type="button"
                    onclick="syncAirbnbCalendar()"
                    title="Synchronize confirmed bookings from Airbnb Host Portal"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5 airbnb-sync-icon"></i>
                    <span class="airbnb-sync-text">Sync Airbnb Portal</span>
                  </button>
                \` : ''}

                <button
                  type="button"
                  onclick="openAiBookingChat()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                  <span>AI Chat Book</span>
                </button>

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
              <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Airbnb Sync</span>
              <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Multiple Bookings (2x, 3x)</span>
              <span class="inline-flex items-center gap-1.5"><span>🪪</span> ID Attached</span>
              \${propId === 'elite-homes' ? \`
                <span class="ml-auto text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                  <i data-lucide="cloud-sync" class="w-3.5 h-3.5 text-rose-600"></i>
                  <span>Connected: Airbnb Host Portal</span>
                </span>
              \` : ''}
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
        return;
      }

      // Case 2: activePropertyId === 'all'
      if (activeLodgingProps.length === 0) {
        container.innerHTML = \`
          <div class="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center max-w-xl mx-auto">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
              <i data-lucide="hotel" class="w-7 h-7"></i>
            </div>
            <h4 class="text-base font-bold text-slate-900">No Lodging Businesses Active</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md">
              None of your active businesses currently have Lodging enabled. Go to Business Offerings to enable Lodging.
            </p>
            <button
              type="button"
              onclick="setAdminFinanceSubTab('business')"
              class="mt-5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              Configure Business Offerings
            </button>
          </div>
        \`;
        return;
      }

      const allLodgingRooms = roomsList.filter(r => activeLodgingProps.some(lp => lp.id === r.property_id));
      const allMonthBookings = roomBookingsList.filter(b => activeLodgingProps.some(lp => lp.id === b.property_id) && b.date && b.date.startsWith(currentMonthPrefix));

      const totalBookingsCount = allMonthBookings.length;
      const monthLodgingOnline = allMonthBookings.filter(b => b.payment_mode === "online").reduce((s, b) => s + (b.amount || 0), 0);
      const monthLodgingCash = allMonthBookings.filter(b => b.payment_mode === "cash").reduce((s, b) => s + (b.amount || 0), 0);
      const monthLodgingTotal = monthLodgingOnline + monthLodgingCash;
      const hasEliteHomes = activeLodgingProps.some(p => p.id === "elite-homes");

      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Calendar Controls Bar -->
          <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Business Indicator: All Properties -->
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope:</span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-indigo-600"></i>
                  <span>All Properties (\${activeLodgingProps.map(p => escapeHtml(p.name)).join(', ')})</span>
                </span>
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

              \${hasEliteHomes ? \`
                <button
                  type="button"
                  onclick="syncAirbnbCalendar()"
                  title="Synchronize confirmed bookings from Airbnb Host Portal"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 airbnb-sync-icon"></i>
                  <span class="airbnb-sync-text">Sync Airbnb Portal</span>
                </button>
              \` : ''}

              <button
                type="button"
                onclick="openAiBookingChat()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-xs transition cursor-pointer"
              >
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                <span>AI Chat Book</span>
              </button>

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
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rooms</span>
              <span class="text-base sm:text-lg font-black text-slate-900">\${allLodgingRooms.length} Rooms</span>
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
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Airbnb Sync</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Multiple Bookings (2x, 3x)</span>
            <span class="inline-flex items-center gap-1.5"><span>🪪</span> ID Attached</span>
            \${hasEliteHomes ? \`
              <span class="ml-auto text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                <i data-lucide="cloud-sync" class="w-3.5 h-3.5 text-rose-600"></i>
                <span>Connected: Airbnb Host Portal</span>
              </span>
            \` : ''}
          </div>

          <!-- RENDER MATRIX OR MONTHLY VIEW -->
          \${allLodgingRooms.length === 0 ? \`
            <div class="bg-white p-8 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <i data-lucide="door-closed" class="w-6 h-6"></i>
              </div>
              <h5 class="text-sm font-bold text-slate-900">No Rooms Added Yet</h5>
              <p class="text-xs text-slate-500 mt-1 max-w-sm">No rooms found across your lodging businesses.</p>
              <button
                type="button"
                onclick="setAdminFinanceSubTab('rooms')"
                class="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
              >
                Configure Rooms Now
              </button>
            </div>
          \` : (calendarViewMode === 'matrix' ? renderAdminMatrixGrid(allLodgingRooms, daysInMonth, currentMonthPrefix, allMonthBookings) : renderAdminMonthlyGrid(allLodgingRooms, daysInMonth, currentMonthPrefix, allMonthBookings))}
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
                        <div class="text-[10px] text-slate-400 font-normal">
                          \${activePropertyId === 'all' ? \`<span class="font-bold text-indigo-600 mr-1">\${escapeHtml(properties.find(p => p.id === rm.property_id)?.name || '')} ·</span>\` : ''}\${escapeHtml(rm.room_type || 'Standard')} · ₹\${formatCurrency(rm.base_price || 0)}
                        </div>
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
                          const idCount = parseGuestIdImages(bk.guest_id_image).length;
                          const hasId = idCount > 0;
                          const kAmt = Math.round(bk.amount / 1000 * 10) / 10;
                          const stayInfo = isMultiDay ? \` (Multi-day stay: \${bk.check_in_date || ''} to \${bk.check_out_date || ''})\` : '';
                          const isAirbnb = (bk.platform || '').toLowerCase().includes('airbnb');
                          const isBookingCom = (bk.platform || '').toLowerCase().includes('booking');
                          const platformTag = isAirbnb ? 'Airbnb' : (isBookingCom ? 'OTA' : (isOnline ? 'On' : 'Cs') + (isMultiDay ? '·Stay' : ''));
                          const cellStyle = isAirbnb
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : (isBookingCom
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : (isOnline ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' : 'bg-amber-100 text-amber-900 border border-amber-200'));

                          return \`
                            <td
                              onclick="openRoomDayDetail('\${rm.id}', '\${dateStr}')"
                              title="Booked: ₹\${formatCurrency(bk.amount)} [\${bk.platform || (isOnline ? 'Online' : 'Cash')}] - \${bk.guest_name || 'Guest'}\${hasId ? \` (🪪 \${idCount} ID\${idCount > 1 ? 's' : ''} Attached)\` : ''}\${stayInfo}"
                              class="py-1 px-1 text-center border-l border-slate-100 cursor-pointer transition \${isToday ? 'bg-indigo-50/40' : ''}"
                            >
                              <span class="relative inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded-lg text-[10px] font-bold font-mono shadow-2xs hover:scale-105 transition \${cellStyle}">
                                \${hasId ? \`<span class="absolute -top-1.5 -right-1 text-[8px] leading-none" title="\${idCount} Guest ID(s) Attached">🪪\${idCount > 1 ? \`<span class="text-[7px] font-black">\${idCount}</span>\` : ''}</span>\` : ''}
                                <span>₹\${kAmt}k</span>
                                <span class="text-[8px] uppercase tracking-tighter opacity-90">\${platformTag}</span>
                              </span>
                            </td>
                          \`;
                        } else {
                          const totalAmt = cellBookings.reduce((s, b) => s + (b.amount || 0), 0);
                          const kAmt = Math.round(totalAmt / 1000 * 10) / 10;
                          const totalIds = cellBookings.reduce((sum, b) => sum + parseGuestIdImages(b.guest_id_image).length, 0);
                          return \`
                            <td
                              onclick="openRoomDayDetail('\${rm.id}', '\${dateStr}')"
                              title="\${count} Bookings: ₹\${formatCurrency(totalAmt)}\${totalIds > 0 ? \` (🪪 \${totalIds} ID\${totalIds > 1 ? 's' : ''} Attached)\` : ''} - Click to view details"
                              class="py-1 px-1 text-center border-l border-slate-100 cursor-pointer transition \${isToday ? 'bg-indigo-50/40' : ''}"
                            >
                              <span class="relative inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs hover:scale-105 transition">
                                \${totalIds > 0 ? \`<span class="absolute -top-1.5 -right-1 text-[8px] leading-none" title="\${totalIds} Guest ID(s) Attached">🪪\${totalIds > 1 ? \`<span class="text-[7px] font-black">\${totalIds}</span>\` : ''}</span>\` : ''}
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
              const bookedRoomsCount = dateBookings.length;
              const totalRooms = propRooms.length;

              return \`
                <div
                  onclick="setManagerFinanceDate('\${dateStr}'); setAdminFinanceSubTab('dashboard');"
                  class="min-h-[90px] p-2 rounded-2xl border transition flex flex-col justify-between cursor-pointer \${isToday ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-slate-50/50 hover:bg-white border-slate-200'}"
                >
                  <div class="flex items-center justify-between gap-1 flex-wrap">
                    <span class="text-xs font-bold \${isToday ? 'text-indigo-600 font-black' : 'text-slate-800'}">\${d}</span>
                    \${dateBookings.length > 0 ? \`
                      <span class="text-[9px] px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap \${bookedRoomsCount > totalRooms ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}" title="\${bookedRoomsCount} booking\${bookedRoomsCount > 1 ? 's' : ''} across \${totalRooms} room\${totalRooms > 1 ? 's' : ''}">
                        \${bookedRoomsCount}/\${totalRooms} rooms
                      </span>
                    \` : ''}
                  </div>

                  <div class="space-y-1 my-1 overflow-hidden">
                    \${dateBookings.slice(0, 2).map(b => {
                      const isOnline = b.payment_mode === "online";
                      const pTag = b.platform ? (b.platform.toLowerCase().includes('airbnb') ? 'Ab·' : (b.platform.toLowerCase().includes('booking') ? 'OTA·' : '')) : '';
                      const itemBg = (b.platform || '').toLowerCase().includes('airbnb') ? 'bg-rose-100/90 text-rose-950 border border-rose-200' : (isOnline ? 'bg-indigo-100/80 text-indigo-900' : 'bg-amber-100/80 text-amber-900');
                      return \`
                        <div class="text-[9px] truncate font-medium px-1.5 py-0.5 rounded-md flex items-center justify-between gap-1 \${itemBg}">
                          <span class="truncate">\${pTag}Rm \${escapeHtml(b.room_number)} · ₹\${Math.round(b.amount/1000*10)/10}k</span>
                          \${(() => {
                            const c = parseGuestIdImages(b.guest_id_image).length;
                            return c > 0 ? \`<span title="\${c} ID(s) Attached" class="text-[8px] shrink-0">🪪\${c > 1 ? \`<span class="text-[7px] font-black">\${c}</span>\` : ''}</span>\` : '';
                          })()}
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
      if (propId === "elite-homes") {
        autoSyncEliteHomesCalendar();
      }
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
      const isAll = (activePropertyId === "all");
      const activeLodgingProps = properties.filter(p => p.active !== 0 && p.has_lodging === 1);

      // Case 1: Specific Business Selected in Top Bar
      if (!isAll) {
        const prop = properties.find(p => p.id === activePropertyId);
        const propId = prop ? prop.id : "";
        const propName = prop ? prop.name : "Selected Business";
        const hasLodging = prop ? (prop.has_lodging === 1) : false;
        const propRooms = roomsList.filter(r => r.property_id === propId);

        if (!hasLodging) {
          container.innerHTML = \`
            <div class="space-y-4">
              <!-- Business Indicator Bar -->
              <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <i data-lucide="building" class="w-3.5 h-3.5 text-amber-600"></i>
                    <span>\${escapeHtml(propName)}</span>
                    <span class="text-[10px] opacity-75">(\${escapeHtml(getBusinessTypeInfo(prop).label)})</span>
                  </span>
                </div>
                <div class="text-xs text-slate-400">
                  Switch business using the top navigation bar
                </div>
              </div>

              <div class="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center max-w-lg mx-auto">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                  <i data-lucide="door-closed" class="w-6 h-6"></i>
                </div>
                <h5 class="text-sm font-bold text-slate-900">\${escapeHtml(propName)} has no Lodging / Rooms</h5>
                <p class="text-xs text-slate-500 mt-1 max-w-sm">This business is configured as <strong>\${escapeHtml(getBusinessTypeInfo(prop).label)}</strong>. Room management is not active for this business.</p>
                <button
                  type="button"
                  onclick="openBusinessConfigModal('\${propId}')"
                  class="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
                >
                  Configure Offerings
                </button>
              </div>
            </div>
          \`;
          return;
        }

        container.innerHTML = \`
          <div class="space-y-4">
            <!-- Property Header Bar (Controlled by Top Bar) -->
            <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business:</span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <i data-lucide="hotel" class="w-3.5 h-3.5 text-indigo-600"></i>
                  <span>\${escapeHtml(propName)}</span>
                </span>
                <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                  \${propRooms.length} Rooms
                </span>
              </div>

              <button
                type="button"
                onclick="openManageRoomModal(null)"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>+ Add Single Room</span>
              </button>
            </div>

            <!-- Quick Bulk Add Rooms Card -->
            <div class="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-4 sm:p-5 rounded-3xl border border-indigo-100 space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <i data-lucide="layers" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-indigo-950 uppercase tracking-wider">Quick Bulk Add Rooms</h4>
                    <p class="text-[11px] text-indigo-700/80">Add multiple rooms in one go to \${escapeHtml(propName)} (e.g. 101, 102, 103, 104)</p>
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
                  <span>Bulk Add Rooms to \${escapeHtml(propName)}</span>
                </button>
              </div>
            </div>

            <!-- Rooms List Table -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="door-closed" class="w-4 h-4 text-indigo-600"></i>
                  Configured Rooms for \${escapeHtml(propName)}
                </h4>
                <span class="text-xs font-semibold text-slate-500">\${propRooms.length} Active</span>
              </div>

              \${propRooms.length === 0 ? \`
                <div class="p-8 text-center text-xs text-slate-400">
                  No rooms added for \${escapeHtml(propName)} yet. Use the Quick Bulk Add form above to add rooms (101, 102, 103, 104).
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
          </div>
        \`;
        return;
      }

      // Case 2: activePropertyId === 'all'
      const allLodgingRooms = roomsList.filter(r => activeLodgingProps.some(lp => lp.id === r.property_id));

      container.innerHTML = \`
        <div class="space-y-4">
          <!-- Property Header Bar (Scope: All Properties) -->
          <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope:</span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-indigo-600"></i>
                <span>All Lodging Businesses</span>
              </span>
              <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                \${allLodgingRooms.length} Rooms Total
              </span>
            </div>

            <button
              type="button"
              onclick="openManageRoomModal(null)"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Add Single Room</span>
            </button>
          </div>

          <!-- Quick Bulk Add Rooms Card (with property selection in all mode) -->
          <div class="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-4 sm:p-5 rounded-3xl border border-indigo-100 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <i data-lucide="layers" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-indigo-950 uppercase tracking-wider">Quick Bulk Add Rooms</h4>
                  <p class="text-[11px] text-indigo-700/80">Add multiple rooms in one go to any active lodging business</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div class="sm:col-span-1">
                <label class="block text-xs font-semibold text-indigo-950 mb-1">Target Business *</label>
                <select
                  id="adminBulkRoomProperty"
                  class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                >
                  \${activeLodgingProps.map(p => \`
                    <option value="\${p.id}">\${escapeHtml(p.name)}</option>
                  \`).join("")}
                </select>
              </div>
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
                <span>Bulk Add Rooms</span>
              </button>
            </div>
          </div>

          <!-- Rooms List Table -->
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <i data-lucide="door-closed" class="w-4 h-4 text-indigo-600"></i>
                Configured Rooms across All Lodging Businesses
              </h4>
              <span class="text-xs font-semibold text-slate-500">\${allLodgingRooms.length} Active</span>
            </div>

            \${allLodgingRooms.length === 0 ? \`
              <div class="p-8 text-center text-xs text-slate-400">
                No rooms added yet. Use the Quick Bulk Add form above to add rooms (101, 102, 103, 104).
              </div>
            \` : \`
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-700">
                  <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th class="py-3 px-4">Business</th>
                      <th class="py-3 px-4">Room Number</th>
                      <th class="py-3 px-4">Type</th>
                      <th class="py-3 px-4">Base Price</th>
                      <th class="py-3 px-4">Status</th>
                      <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    \${allLodgingRooms.map(rm => {
                      const rProp = properties.find(p => p.id === rm.property_id);
                      return \`
                        <tr class="hover:bg-slate-50/80 transition">
                          <td class="py-3 px-4 font-bold text-indigo-950 whitespace-nowrap">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800">
                              <i data-lucide="building" class="w-3 h-3 text-indigo-600"></i>
                              <span>\${escapeHtml(rProp ? rProp.name : rm.property_id)}</span>
                            </span>
                          </td>
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
                      \`;
                    }).join("")}
                  </tbody>
                </table>
              </div>
            \`}
          </div>
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
                Admin can configure revenue modules (Lodging, Fooding, Services) and activate or deactivate businesses anytime.
              </p>
            </div>
            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              \${properties.length} Total Businesses (\${properties.filter(p => p.active !== 0).length} Active)
            </span>
          </div>

          <!-- Business Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            \${properties.map(p => {
              const hasL = p.has_lodging === 1;
              const hasF = p.has_fooding === 1;
              const hasS = p.has_services === 1;
              const isActive = (p.active !== 0);
              const ti = getBusinessTypeInfo(p);

              return \`
                <div class="bg-white p-5 rounded-3xl border \${isActive ? 'border-slate-200' : 'border-slate-300/80 bg-slate-50/60 opacity-90'} shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition">
                  <div class="space-y-3">
                    <!-- Title and Status/Type -->
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <h4 class="text-sm font-black text-slate-900">\${escapeHtml(p.name)}</h4>
                          \${isActive ? \`
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          \` : \`
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                            </span>
                          \`}
                        </div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1.5 \${ti.badgeClass}">
                          \${escapeHtml(ti.label)}
                        </span>
                      </div>

                      <!-- Operational Toggle & Configure Buttons -->
                      <div class="flex items-center gap-1.5 shrink-0">
                        \${isActive ? \`
                          <button
                            type="button"
                            onclick="togglePropertyActive('\${p.id}', 0)"
                            class="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1"
                            title="Deactivate this business"
                          >
                            <i data-lucide="power" class="w-3.5 h-3.5 text-rose-600"></i>
                            <span>Deactivate</span>
                          </button>
                        \` : \`
                          <button
                            type="button"
                            onclick="togglePropertyActive('\${p.id}', 1)"
                            class="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer flex items-center gap-1"
                            title="Activate this business"
                          >
                            <i data-lucide="power" class="w-3.5 h-3.5 text-emerald-600"></i>
                            <span>Activate</span>
                          </button>
                        \`}
                        <button
                          type="button"
                          onclick="openBusinessConfigModal('\${p.id}')"
                          class="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-indigo-200"
                        >
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          <span>Configure</span>
                        </button>
                      </div>
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
                    <span>Leave Allowance: \${p.monthly_leave_allowance || 3} days/mo</span>
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
      const chkActive = document.getElementById("modalConfigIsActive");
      const lblActive = document.getElementById("modalConfigActiveLabel");
      const chkL = document.getElementById("modalConfigHasLodging");
      const chkF = document.getElementById("modalConfigHasFooding");
      const chkS = document.getElementById("modalConfigHasServices");
      const lblInput = document.getElementById("modalConfigServicesLabel");
      const lblRow = document.getElementById("modalConfigServicesLabelRow");

      if (idInput) idInput.value = prop.id;
      if (title) title.innerText = \`Configure: \${prop.name}\`;
      if (subtitle) subtitle.innerText = \`Select active revenue modules and operational status\`;

      const isActive = (prop.active !== 0);
      if (chkActive) chkActive.checked = isActive;
      if (lblActive) {
        lblActive.innerText = isActive ? "Active" : "Inactive";
        lblActive.className = isActive ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-slate-400";
      }

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

      const isActive = document.getElementById("modalConfigIsActive")?.checked ? 1 : 0;
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
            active: isActive,
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

        if (isActive === 0 && activePropertyId === propId) {
          activePropertyId = "all";
        }

        closeBusinessConfigModal();
        showToast("Business settings updated successfully!");
        await Promise.all([fetchProperties(), fetchRooms(), fetchRoomBookings(), fetchFinances()]);
        renderPropertyTabs();
        renderFinancesView();
      } catch (err) {
        showToast("Error updating business: " + err.message);
      }
    }

    async function togglePropertyActive(propId, targetActive) {
      const prop = properties.find(p => p.id === propId);
      const actionName = targetActive === 1 ? "activate" : "deactivate";
      if (!confirm(\`Are you sure you want to \${actionName} "\${prop ? prop.name : propId}"?\`)) {
        return;
      }

      try {
        const res = await fetch(\`/api/properties/\${propId}\`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ active: targetActive })
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || \`Failed to \${actionName} business\`);
        }

        showToast(\`Business "\${prop ? prop.name : propId}" \${targetActive === 1 ? 'activated' : 'deactivated'} successfully!\`);
        if (activePropertyId === propId && targetActive === 0) {
          activePropertyId = "all";
        }
        await Promise.all([fetchProperties(), fetchRooms(), fetchRoomBookings(), fetchFinances()]);
        renderPropertyTabs();
        renderFinancesView();
      } catch (err) {
        showToast("Error updating business status: " + err.message);
      }
    }

    // Bulk Add Rooms Action
    async function bulkAddAdminRooms() {
      let propId = (activePropertyId !== "all" && activePropertyId) ? activePropertyId : document.getElementById("adminBulkRoomProperty")?.value;
      if (!propId) {
        const activeLodgingProps = properties.filter(p => p.active !== 0 && p.has_lodging === 1);
        propId = activeLodgingProps[0]?.id || "";
      }
      const roomNumbersStr = document.getElementById("adminBulkRoomNumbers")?.value?.trim() || "";
      const roomType = document.getElementById("adminBulkRoomType")?.value?.trim() || "Standard";
      const basePrice = Math.max(0, parseFloat(document.getElementById("adminBulkBasePrice")?.value || "0") || 0);

      if (!propId) return showToast("Please select a lodging business first");
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
      const optProp = opt?.getAttribute("data-prop");
      const propInput = document.getElementById("modalBookingProperty");
      if (optProp && propInput) {
        propInput.value = optProp;
      }

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

    // Guest ID Photo Compression & Handlers
    function compressImageToDataUrl(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("No file selected"));
        if (!file.type || !file.type.startsWith("image/")) return reject(new Error("Selected file is not an image"));

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            try {
              const dataUrl = canvas.toDataURL("image/jpeg", quality);
              resolve(dataUrl);
            } catch (err) {
              reject(err);
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function resolveGuestIdUrl(url) {
      if (!url) return "";
      if (url.startsWith("/api/guest-ids/file") && !url.includes("&pin=") && !url.includes("?pin=")) {
        const pin = currentSessionPin || localStorage.getItem(AUTH_PIN_KEY) || "";
        if (pin) {
          return url + (url.includes("?") ? "&pin=" : "?pin=") + encodeURIComponent(pin);
        }
      }
      return url;
    }

    async function uploadGuestIdPhotoToR2(dataUrl, label = "ID") {
      try {
        const res = await fetch("/api/guest-ids/upload", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ dataUrl, label })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            return {
              url: resolveGuestIdUrl(data.url),
              rawUrl: data.url,
              key: data.key,
              label: data.label || label
            };
          }
        }
      } catch (err) {
        console.warn("Direct R2 upload error, falling back to local buffer:", err);
      }
      return { url: dataUrl, rawUrl: dataUrl, label };
    }

    // Helper: Parse guest ID images from DB (supports JSON array or single legacy data URL string)
    function parseGuestIdImages(raw) {
      if (!raw) return [];
      if (Array.isArray(raw)) {
        return raw.map((item, idx) => {
          if (typeof item === "string") return { url: resolveGuestIdUrl(item), rawUrl: item, label: \`ID #\${idx + 1}\` };
          if (item && item.url) return { url: resolveGuestIdUrl(item.url), rawUrl: item.rawUrl || item.url, key: item.key, label: item.label || \`ID #\${idx + 1}\` };
          return null;
        }).filter(Boolean);
      }
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed.map((item, idx) => {
                if (typeof item === "string") return { url: resolveGuestIdUrl(item), rawUrl: item, label: \`ID #\${idx + 1}\` };
                if (item && item.url) return { url: resolveGuestIdUrl(item.url), rawUrl: item.rawUrl || item.url, key: item.key, label: item.label || \`ID #\${idx + 1}\` };
                return null;
              }).filter(Boolean);
            } else if (parsed && parsed.url) {
              return [{ url: resolveGuestIdUrl(parsed.url), rawUrl: parsed.rawUrl || parsed.url, key: parsed.key, label: parsed.label || "ID #1" }];
            }
          } catch (e) {}
        }
        if (trimmed.startsWith("data:image/") || trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/api/")) {
          return [{ url: resolveGuestIdUrl(trimmed), rawUrl: trimmed, label: "ID #1" }];
        }
      }
      return [];
    }

    // Helper: Parse guest names from DB
    function parseGuestNames(guestName, guestsJson) {
      if (guestsJson) {
        try {
          const parsed = typeof guestsJson === "string" ? JSON.parse(guestsJson) : guestsJson;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const list = parsed.map(n => typeof n === "string" ? n.trim() : (n?.name || "")).filter(Boolean);
            if (list.length > 0) return list;
          }
        } catch (e) {}
      }
      if (guestName && typeof guestName === "string") {
        const split = guestName.split(",").map(s => s.trim()).filter(Boolean);
        if (split.length > 0) return split;
      }
      return [];
    }

    // Modal Multiple Guest Names
    let modalGuestNameRows = [""];

    function renderModalGuestNameRows() {
      const container = document.getElementById("modalGuestNamesList");
      const countLabel = document.getElementById("modalGuestCountLabel");
      if (!container) return;

      if (modalGuestNameRows.length === 0) {
        modalGuestNameRows = [""];
      }

      if (countLabel) {
        countLabel.innerText = modalGuestNameRows.length;
      }

      container.innerHTML = modalGuestNameRows.map((val, idx) => \`
        <div class="flex items-center gap-2 modal-guest-row">
          <span class="text-[10px] font-bold text-slate-400 w-14 shrink-0">\${idx === 0 ? 'Guest 1:' : \`Guest \${idx + 1}:\`}</span>
          <input
            type="text"
            value="\${escapeHtml(val)}"
            placeholder="\${idx === 0 ? 'e.g. Rahul Sharma (Primary Guest)' : \`e.g. Guest \${idx + 1} Name\`}"
            oninput="modalGuestNameRows[\${idx}] = this.value"
            class="modal-guest-name-input flex-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          \${idx > 0 ? \`
            <button
              type="button"
              onclick="removeModalGuestNameRow(\${idx})"
              title="Remove Guest"
              class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          \` : '<div class="w-6 shrink-0"></div>'}
        </div>
      \`).join("");

      refreshIcons();
    }

    function addModalGuestNameRow(val = "") {
      modalGuestNameRows.push(val);
      renderModalGuestNameRows();
      setTimeout(() => {
        const inputs = document.querySelectorAll(".modal-guest-name-input");
        if (inputs && inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      }, 50);
    }

    function removeModalGuestNameRow(idx) {
      if (modalGuestNameRows.length > 1) {
        modalGuestNameRows.splice(idx, 1);
        renderModalGuestNameRows();
      }
    }

    // Modal Multiple Guest IDs
    let modalGuestIdList = []; // Array of { url: string, label: string }

    function renderModalGuestIdGallery() {
      const gallery = document.getElementById("modalGuestIdGallery");
      const emptyNotice = document.getElementById("modalGuestIdEmptyNotice");
      const countBadge = document.getElementById("modalIdCountBadge");
      const hiddenInput = document.getElementById("modalBookingGuestIdData");

      if (hiddenInput) {
        hiddenInput.value = modalGuestIdList.length > 0 ? JSON.stringify(modalGuestIdList.map(item => ({ url: item.rawUrl || item.url, key: item.key, label: item.label }))) : "";
      }

      if (countBadge) {
        if (modalGuestIdList.length > 0) {
          countBadge.innerText = \`\${modalGuestIdList.length} ID\${modalGuestIdList.length > 1 ? 's' : ''}\`;
          countBadge.classList.remove("hidden");
        } else {
          countBadge.classList.add("hidden");
        }
      }

      if (!gallery) return;

      if (modalGuestIdList.length === 0) {
        gallery.classList.add("hidden");
        if (emptyNotice) emptyNotice.classList.remove("hidden");
        return;
      }

      gallery.classList.remove("hidden");
      if (emptyNotice) emptyNotice.classList.add("hidden");

      gallery.innerHTML = modalGuestIdList.map((item, idx) => \`
        <div class="relative group p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-1">
          <div class="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 cursor-pointer" onclick="openLightboxFromModal(\${idx})">
            <img src="\${item.url}" alt="\${escapeHtml(item.label || \`ID #\${idx + 1}\`)}" class="w-full h-full object-cover group-hover:scale-105 transition" />
            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>View</span>
            </div>
            <span class="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-900/70 text-white">#\${idx + 1}</span>
          </div>
          <div class="flex items-center justify-between px-0.5 gap-1">
            <input
              type="text"
              value="\${escapeHtml(item.label || \`ID #\${idx + 1}\`)}"
              placeholder="e.g. Rahul Aadhaar"
              title="Click to edit label"
              onchange="updateModalGuestIdLabel(\${idx}, this.value)"
              class="text-[10px] font-semibold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 p-0 focus:ring-0 truncate flex-1"
            />
            <button
              type="button"
              onclick="removeModalGuestId(\${idx})"
              title="Delete this ID photo"
              class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
            >
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
      \`).join("");

      refreshIcons();
    }

    function updateModalGuestIdLabel(idx, label) {
      if (modalGuestIdList[idx]) {
        modalGuestIdList[idx].label = label || \`ID #\${idx + 1}\`;
        const hiddenInput = document.getElementById("modalBookingGuestIdData");
        if (hiddenInput) {
          hiddenInput.value = JSON.stringify(modalGuestIdList.map(item => ({ url: item.rawUrl || item.url, key: item.key, label: item.label })));
        }
      }
    }

    function removeModalGuestId(idx) {
      if (idx >= 0 && idx < modalGuestIdList.length) {
        modalGuestIdList.splice(idx, 1);
        renderModalGuestIdGallery();
      }
    }

    function clearModalGuestIds() {
      modalGuestIdList = [];
      renderModalGuestIdGallery();
      const cam = document.getElementById("modalGuestIdCameraInput");
      const file = document.getElementById("modalGuestIdFileInput");
      if (cam) cam.value = "";
      if (file) file.value = "";
    }

    async function handleModalGuestIdCameraSelected(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast("Processing photo from camera...");
        const dataUrl = await compressImageToDataUrl(file);
        showToast("Uploading ID photo to R2 storage...");
        const nextIdx = modalGuestIdList.length + 1;
        const uploaded = await uploadGuestIdPhotoToR2(dataUrl, \`ID #\${nextIdx}\`);
        modalGuestIdList.push(uploaded);
        renderModalGuestIdGallery();
        showToast(\`ID #\${nextIdx} stored in R2! Tap camera to snap next ID.\`);
      } catch (err) {
        showToast("Failed to snap photo: " + err.message);
      } finally {
        e.target.value = "";
      }
    }

    async function handleModalGuestIdFilesSelected(e) {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      showToast(\`Processing & uploading \${files.length} photo(s) to R2...\`);
      try {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const dataUrl = await compressImageToDataUrl(f);
          const nextIdx = modalGuestIdList.length + 1;
          const uploaded = await uploadGuestIdPhotoToR2(dataUrl, \`ID #\${nextIdx}\`);
          modalGuestIdList.push(uploaded);
        }
        renderModalGuestIdGallery();
        showToast(\`\${files.length} ID photo(s) uploaded to R2!\`);
      } catch (err) {
        showToast("Error processing photo: " + err.message);
      } finally {
        e.target.value = "";
      }
    }

    function openLightboxFromModal(idx = 0) {
      if (modalGuestIdList.length === 0) return;
      const guestName = modalGuestNameRows.filter(Boolean).join(", ") || "Guest";
      openMultiIdLightbox(modalGuestIdList, idx, guestName, "Booking Modal Preview");
    }

    // Lightbox Viewer State & Functions (Multi-photo support)
    let viewerGallery = []; // Array of { url, label }
    let viewerCurrentIndex = 0;
    let viewerRotation = 0;
    let viewerGuestName = "";
    let viewerSubtitle = "";
    let viewerPreviousModalIds = []; // Stores IDs of background modals hidden when viewer opens

    function openGuestIdViewer(bookingId, startIndex = 0) {
      const bk = roomBookingsList.find(b => b.id === bookingId);
      if (!bk) return showToast("Booking not found");
      const ids = parseGuestIdImages(bk.guest_id_image);
      if (ids.length === 0) {
        return showToast("No ID photos attached to this booking");
      }
      const room = roomsList.find(r => r.id === bk.room_id);
      const roomNum = room ? room.room_number : (bk.room_number || "Room");
      const guestName = bk.guest_name || "Guest";
      const infoText = \`Room \${roomNum} · \${bk.date} · \${bk.payment_mode === 'cash' ? 'Cash' : 'Online'}\`;
      openMultiIdLightbox(ids, startIndex, guestName, infoText);
    }

    function openMultiIdLightbox(gallery, startIndex = 0, guestName = "Guest", infoText = "") {
      viewerGallery = gallery || [];
      viewerCurrentIndex = Math.max(0, Math.min(startIndex, viewerGallery.length - 1));
      viewerRotation = 0;
      viewerGuestName = guestName;
      viewerSubtitle = infoText;

      // Identify any currently open background modals (bookings, day details, forms) and temporarily hide them
      const backgroundModalIds = [
        "roomDayDetailModal",
        "roomBookingModal",
        "manageRoomModal",
        "financeModal",
        "businessConfigModal",
        "staffModal",
        "documentsModal"
      ];
      viewerPreviousModalIds = backgroundModalIds.filter(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains("hidden");
      });
      viewerPreviousModalIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add("hidden");
          el.classList.remove("flex");
        }
      });

      const modal = document.getElementById("guestIdViewerModal");
      if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
      }
      updateViewerDisplay();
      refreshIcons();
    }

    function updateViewerDisplay() {
      if (viewerGallery.length === 0) return;
      const current = viewerGallery[viewerCurrentIndex];
      const title = document.getElementById("guestIdViewerTitle");
      const subtitle = document.getElementById("guestIdViewerSubtitle");
      const img = document.getElementById("guestIdViewerImg");
      const counter = document.getElementById("guestIdViewerCounter");
      const prevBtn = document.getElementById("btnViewerPrev");
      const nextBtn = document.getElementById("btnViewerNext");
      const thumbStrip = document.getElementById("guestIdViewerThumbs");

      if (title) {
        title.innerText = \`\${viewerGuestName} - \${current.label || \`ID #\${viewerCurrentIndex + 1}\`}\`;
      }
      if (subtitle) {
        subtitle.innerText = viewerSubtitle || "Guest Identification Document";
      }
      if (counter) {
        counter.innerText = \`\${viewerCurrentIndex + 1} of \${viewerGallery.length}\`;
      }

      if (img) {
        img.src = current.url;
        img.style.transform = \`rotate(\${viewerRotation}deg)\`;
      }

      if (prevBtn) {
        prevBtn.disabled = viewerCurrentIndex === 0;
        prevBtn.classList.toggle("opacity-30", viewerCurrentIndex === 0);
        prevBtn.classList.toggle("pointer-events-none", viewerCurrentIndex === 0);
      }
      if (nextBtn) {
        nextBtn.disabled = viewerCurrentIndex === viewerGallery.length - 1;
        nextBtn.classList.toggle("opacity-30", viewerCurrentIndex === viewerGallery.length - 1);
        nextBtn.classList.toggle("pointer-events-none", viewerCurrentIndex === viewerGallery.length - 1);
      }

      if (thumbStrip) {
        if (viewerGallery.length > 1) {
          thumbStrip.classList.remove("hidden");
          thumbStrip.classList.add("flex");
          thumbStrip.innerHTML = viewerGallery.map((item, idx) => \`
            <button
              type="button"
              onclick="setViewerIndex(\${idx})"
              class="w-12 h-9 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 \${idx === viewerCurrentIndex ? 'border-indigo-500 scale-105 shadow-md' : 'border-slate-700 opacity-60 hover:opacity-100'}"
            >
              <img src="\${item.url}" alt="" class="w-full h-full object-cover" />
            </button>
          \`).join("");
        } else {
          thumbStrip.classList.add("hidden");
          thumbStrip.classList.remove("flex");
        }
      }
    }

    function setViewerIndex(idx) {
      if (idx >= 0 && idx < viewerGallery.length) {
        viewerCurrentIndex = idx;
        viewerRotation = 0;
        updateViewerDisplay();
      }
    }

    function nextViewerPhoto() {
      if (viewerCurrentIndex < viewerGallery.length - 1) {
        setViewerIndex(viewerCurrentIndex + 1);
      }
    }

    function prevViewerPhoto() {
      if (viewerCurrentIndex > 0) {
        setViewerIndex(viewerCurrentIndex - 1);
      }
    }

    function rotateGuestIdViewer() {
      viewerRotation = (viewerRotation + 90) % 360;
      const img = document.getElementById("guestIdViewerImg");
      if (img) {
        img.style.transform = \`rotate(\${viewerRotation}deg)\`;
      }
    }

    async function downloadGuestIdViewer() {
      if (viewerGallery.length === 0) return;
      const current = viewerGallery[viewerCurrentIndex];
      const cleanName = (viewerGuestName || "Guest").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = \`ID-\${cleanName}-Photo\${viewerCurrentIndex + 1}-\${new Date().toISOString().split("T")[0]}.jpg\`;
      try {
        const resp = await fetch(current.url);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (e) {
        const a = document.createElement("a");
        a.href = current.url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }

    function closeGuestIdViewer() {
      const modal = document.getElementById("guestIdViewerModal");
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }

      // Restore previously open modals so user returns right back to their bookings page seamlessly
      if (viewerPreviousModalIds && viewerPreviousModalIds.length > 0) {
        viewerPreviousModalIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.classList.remove("hidden");
            el.classList.add("flex");
          }
        });
        viewerPreviousModalIds = [];
      }

      viewerGallery = [];
      viewerCurrentIndex = 0;
      viewerRotation = 0;
      refreshIcons();
    }

    // Keyboard navigation for ID viewer (ESC to close, Left/Right arrow to browse photos)
    window.addEventListener("keydown", function(e) {
      const modal = document.getElementById("guestIdViewerModal");
      if (modal && !modal.classList.contains("hidden")) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeGuestIdViewer();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          prevViewerPhoto();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          nextViewerPhoto();
        }
      }
    });

    // Quick ID Upload directly from card rows (appends to existing)
    let pendingQuickUploadBookingId = null;

    function triggerQuickIdUpload(bookingId) {
      pendingQuickUploadBookingId = bookingId;
      const input = document.getElementById("globalGuestIdCameraInput");
      if (input) {
        input.value = "";
        input.click();
      }
    }

    function triggerQuickIdFiles(bookingId) {
      pendingQuickUploadBookingId = bookingId;
      const input = document.getElementById("globalGuestIdFileInput");
      if (input) {
        input.value = "";
        input.click();
      }
    }

    async function handleGlobalGuestIdPicked(e) {
      const files = Array.from(e.target.files || []);
      const bookingId = pendingQuickUploadBookingId;
      if (files.length === 0 || !bookingId) return;

      const bk = roomBookingsList.find(b => b.id === bookingId);
      const existingIds = parseGuestIdImages(bk?.guest_id_image);

      try {
        showToast(\`Processing & uploading \${files.length} photo(s) to R2...\`);
        for (let i = 0; i < files.length; i++) {
          const compressed = await compressImageToDataUrl(files[i]);
          const nextIdx = existingIds.length + 1;
          const uploaded = await uploadGuestIdPhotoToR2(compressed, \`ID #\${nextIdx}\`);
          existingIds.push(uploaded);
        }

        showToast("Saving booking with R2 references...");
        const cleanList = existingIds.map(item => ({ url: item.rawUrl || item.url, key: item.key, label: item.label }));
        const res = await fetch(\`/api/room-bookings/\${bookingId}\`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            guest_id_image: JSON.stringify(cleanList),
            update_entire_group: true
          })
        });

        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || data.error) {
          return showToast(data.error || "Failed to upload ID photos");
        }

        showToast(\`\${files.length} ID photo(s) attached successfully!\`);
        await fetchRoomBookings();
        if (currentDetailRoomId && currentDetailDate) {
          openRoomDayDetail(currentDetailRoomId, currentDetailDate);
        }
        renderFinancesView();
      } catch (err) {
        showToast("Error uploading ID: " + err.message);
      } finally {
        pendingQuickUploadBookingId = null;
        e.target.value = "";
      }
    }

    function openRoomBookingModal(roomId = null, date = null, bookingId = null) {
      const select = document.getElementById("modalBookingRoomSelect");
      let propId = "";
      if (currentUserRole === "manager") {
        propId = currentManagerInfo?.property_id || "";
      } else if (roomId) {
        const found = roomsList.find(r => r.id === roomId);
        if (found) propId = found.property_id;
      } else if (activePropertyId !== "all" && activePropertyId) {
        propId = activePropertyId;
      }

      const activeLodgingProps = properties.filter(p => p.active !== 0 && p.has_lodging === 1);
      if (propId && !activeLodgingProps.some(p => p.id === propId)) {
        propId = "";
      }
      const eligibleRooms = propId
        ? roomsList.filter(r => r.property_id === propId)
        : roomsList.filter(r => activeLodgingProps.some(p => p.id === r.property_id));

      if (select) {
        select.innerHTML = eligibleRooms.map(r => {
          const rProp = properties.find(p => p.id === r.property_id);
          const propPrefix = (!propId || activePropertyId === "all") && rProp ? \`[\${rProp.name}] \` : "";
          return \`
            <option value="\${r.id}" data-prop="\${r.property_id}" data-price="\${r.base_price || 0}">\${propPrefix}Room \${escapeHtml(r.room_number)} (\${escapeHtml(r.room_type || 'Standard')}) - ₹\${formatCurrency(r.base_price || 0)}</option>
          \`;
        }).join("");
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

      if (select && (!propId || activePropertyId === "all")) {
        const opt = select.selectedOptions[0];
        if (opt) propId = opt.getAttribute("data-prop") || propId;
      }
      if (propInput) propInput.value = propId || (activeLodgingProps[0]?.id || "");

      if (bookingId) {
        const bk = roomBookingsList.find(b => b.id === bookingId);
        if (bk) {
          if (title) title.innerText = "Edit Room Booking";
          if (idInput) idInput.value = bk.id;
          if (select) select.value = bk.room_id;
          if (dateInput) dateInput.value = bk.date;
          if (amountInput) amountInput.value = bk.amount;
          if (notesInput) notesInput.value = bk.notes || "";

          const names = parseGuestNames(bk.guest_name, bk.guests_json);
          modalGuestNameRows = names.length > 0 ? names : [""];
          renderModalGuestNameRows();
          const guestCountInput = document.getElementById("modalBookingGuestCount");
          if (guestCountInput) guestCountInput.value = Math.max(1, Number(bk.guest_count) || names.length || 1);

          modalGuestIdList = parseGuestIdImages(bk.guest_id_image);
          renderModalGuestIdGallery();
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

        if (notesInput) notesInput.value = "";
        modalGuestNameRows = [""];
        renderModalGuestNameRows();
        const guestCountInput = document.getElementById("modalBookingGuestCount");
        if (guestCountInput) guestCountInput.value = 1;
        clearModalGuestIds();
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
      clearModalGuestIds();
      modalGuestNameRows = [""];
      renderModalGuestNameRows();
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

      const guestInputs = Array.from(document.querySelectorAll(".modal-guest-name-input"));
      let names = [];
      guestInputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) {
          val.split(",").map(s => s.trim()).filter(Boolean).forEach(part => names.push(part));
        }
      });
      const guest_name = names.join(", ") || "";
      const guests_json = names.length > 0 ? JSON.stringify(names) : null;
      const guestCountEl = document.getElementById("modalBookingGuestCount");
      const guest_count = Math.max(1, parseInt(guestCountEl?.value || "1", 10) || names.length || 1);
      const cleanModalIds = modalGuestIdList.map(item => ({ url: item.rawUrl || item.url, key: item.key, label: item.label }));
      const guest_id_image = cleanModalIds.length > 0 ? JSON.stringify(cleanModalIds) : (document.getElementById("modalBookingGuestIdData")?.value?.trim() || null);
      const notes = document.getElementById("modalBookingNotes")?.value?.trim() || "";

      if (!property_id || !room_id) {
        return showToast("Please select a room");
      }

      let payload = {
        property_id,
        room_id,
        payment_mode,
        guest_name,
        guest_count,
        guests_json,
        guest_id_image,
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
                    \${b.platform ? \`
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-bold \${
                        (b.platform || '').toLowerCase().includes('airbnb') ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        (b.platform || '').toLowerCase().includes('booking') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }">
                        \${escapeHtml(b.platform)}
                      </span>
                    \` : ''}
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold \${isOnline ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}">
                      \${isOnline ? 'Online' : 'Cash'}
                    </span>
                    \${b.external_booking_id ? \`
                      <span class="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1" title="External Booking Synced from Airbnb Host Portal">
                        <i data-lucide="cloud-check" class="w-2.5 h-2.5"></i>
                        <span>Airbnb Portal</span>
                      </span>
                    \` : ''}
                    \${isMultiDay ? \`
                      <span class="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-purple-100 text-purple-800 flex items-center gap-1" title="Stay: \${b.check_in_date || ''} to \${b.check_out_date || ''}">
                        <i data-lucide="layers" class="w-2.5 h-2.5"></i>
                        <span>Stay: \${b.check_in_date || ''} → \${b.check_out_date || ''}</span>
                      </span>
                    \` : ''}
                  </div>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    Guest: \${escapeHtml(b.guest_name || 'Walk-in')}\${b.guest_count ? \` · \${b.guest_count} person\${b.guest_count > 1 ? 's' : ''}\` : ''}
                    \${b.notes ? \` · \${escapeHtml(b.notes)}\` : ''}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    Created: \${escapeHtml(b.created_by || 'Staff')}
                    \${b.external_booking_id ? \` · External ID: \${escapeHtml(b.external_booking_id)}\` : ''}
                  </div>

                  <div class="mt-2 flex items-center gap-2">
                    \${(() => {
                      const ids = parseGuestIdImages(b.guest_id_image);
                      if (ids.length > 0) {
                        return \`
                          <button
                            type="button"
                            onclick="openGuestIdViewer('\${b.id}')"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition cursor-pointer border border-indigo-200 shadow-2xs"
                          >
                            <i data-lucide="id-card" class="w-3.5 h-3.5 text-indigo-600"></i>
                            <span>🪪 View ID\${ids.length > 1 ? \`s (\${ids.length})\` : ''}</span>
                          </button>
                          <button
                            type="button"
                            onclick="triggerQuickIdUpload('\${b.id}')"
                            title="Add more ID photos"
                            class="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                          >
                            + Add ID
                          </button>
                        \`;
                      } else {
                        return \`
                          <button
                            type="button"
                            onclick="triggerQuickIdUpload('\${b.id}')"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                          >
                            <i data-lucide="camera" class="w-3.5 h-3.5 text-slate-400"></i>
                            <span>📷 Snap / Upload IDs</span>
                          </button>
                        \`;
                      }
                    })()}
                  </div>
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

    let isSyncingAirbnb = false;
    async function syncAirbnbCalendar() {
      if (isSyncingAirbnb) return;
      isSyncingAirbnb = true;
      const icons = document.querySelectorAll(".airbnb-sync-icon");
      const texts = document.querySelectorAll(".airbnb-sync-text");
      icons.forEach(i => i.classList.add("animate-spin"));
      texts.forEach(t => t.innerText = "Syncing...");

      try {
        showToast("Connecting to Airbnb Host Portal...");
        const res = await fetch("/api/sync/airbnb", {
          method: "POST",
          headers: getAuthHeaders()
        });
        if (res.status === 401) return lockApp();
        const data = await res.json();
        if (!res.ok || !data.success) {
          showToast(data.error || "Failed to sync Airbnb bookings");
        } else {
          showToast(\`Synced \${data.syncedCount} bookings across \${data.datesAffected} dates from Airbnb Portal!\`);
          await Promise.all([fetchRoomBookings(), fetchFinances()]);
          renderFinancesView();
        }
      } catch (err) {
        showToast("Sync error: " + err.message);
      } finally {
        isSyncingAirbnb = false;
        icons.forEach(i => i.classList.remove("animate-spin"));
        texts.forEach(t => t.innerText = "Sync Airbnb");
        refreshIcons();
      }
    }

    let lastAutoSyncAt = 0;
    async function autoSyncEliteHomesCalendar() {
      const now = Date.now();
      // Throttle automatic background synchronization to once every 60 seconds
      if (now - lastAutoSyncAt < 60000) return;
      lastAutoSyncAt = now;
      try {
        const res = await fetch("/api/sync/airbnb", {
          method: "POST",
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.datesAffected > 0) {
            await Promise.all([fetchRoomBookings(), fetchFinances()]);
            renderFinancesView();
          }
        }
      } catch (e) {
        console.warn("Auto-sync error:", e);
      }
    }

    function openAddBookingForCurrentDetail() {
      const roomId = currentDetailRoomId;
      const date = currentDetailDate;
      closeRoomDayDetailModal();
      openRoomBookingModal(roomId, date, null);
    }

    function openManageRoomModal(roomId = null) {
      const propSelect = document.getElementById("modalRoomProperty");
      const activeLodgingProps = properties.filter(p => p.active !== 0 && p.has_lodging === 1);
      const defaultPropId = (activePropertyId !== "all" && activePropertyId) ? activePropertyId : (calendarSelectedProperty || activeLodgingProps[0]?.id || "");
      if (propSelect) {
        propSelect.innerHTML = activeLodgingProps.map(p => \`
          <option value="\${p.id}" \${p.id === defaultPropId ? 'selected' : ''}>\${escapeHtml(p.name)}</option>
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
      const activeProps = properties.filter(p => p.active !== 0);
      if (select) {
        select.innerHTML = activeProps.map(p => \`
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
          if (activePropertyId !== "all" && activePropertyId) {
            select.value = activePropertyId;
          } else if (activeProps.length > 0) {
            select.value = activeProps[0].id;
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
      const activePropIds = new Set(properties.filter(p => p.active !== 0).map(p => p.id));
      const records = (activePropertyId === "all" || !activePropertyId)
        ? financesList.filter(f => activePropIds.has(f.property_id))
        : financesList.filter(f => f.property_id === activePropertyId && activePropIds.has(f.property_id));

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

    // -------------------------------------------------------------------------
    // AI ROOM BOOKING CHATBOX
    // -------------------------------------------------------------------------
    let aiChatMessages = [];
    let aiChatPendingDraft = null;
    let aiChatIsSending = false;

    function getDefaultAiChatMessages() {
      return [
        {
          role: "assistant",
          text: "Hi! Type booking details below to create a room booking instantly:\\n\\nCustomer Name: Rahul Sharma\\nRoom No. 101\\nNumber of person: 2\\n\\nYou can also add optional details like Cash/Online, ₹2500, Tomorrow, or 2 nights.",
          booking: null
        }
      ];
    }

    function openAiBookingChat() {
      const fab = document.getElementById("aiChatFab");
      const drawer = document.getElementById("aiBookingChatDrawer");
      if (fab) fab.classList.add("hidden");
      if (drawer) {
        drawer.classList.remove("hidden");
        drawer.classList.add("flex");
      }
      if (aiChatMessages.length === 0) {
        aiChatMessages = getDefaultAiChatMessages();
      }
      renderAiChatMessages();
      refreshIcons();
      setTimeout(() => {
        const inp = document.getElementById("aiChatInput");
        if (inp) inp.focus();
      }, 80);
    }

    function closeAiBookingChat() {
      const fab = document.getElementById("aiChatFab");
      const drawer = document.getElementById("aiBookingChatDrawer");
      if (drawer) {
        drawer.classList.add("hidden");
        drawer.classList.remove("flex");
      }
      if (fab) fab.classList.remove("hidden");
    }

    function resetAiBookingChat() {
      aiChatPendingDraft = null;
      aiChatMessages = getDefaultAiChatMessages();
      renderAiChatMessages();
      refreshIcons();
    }

    function fillAiBookingTemplate() {
      const inp = document.getElementById("aiChatInput");
      if (!inp) return;
      const sampleRoom = (roomsList.find(r => activePropertyId === "all" || !activePropertyId || r.property_id === activePropertyId)?.room_number) || "";
      inp.value = "Customer Name: \\nRoom No. " + sampleRoom + "\\nNumber of person: ";
      inp.focus();
      const firstLineEnd = "Customer Name: ".length;
      try {
        inp.setSelectionRange(firstLineEnd, firstLineEnd);
      } catch (e) {}
    }

    function sendQuickAiMessage(msg) {
      const inp = document.getElementById("aiChatInput");
      if (inp) inp.value = msg;
      submitAiChatMessage(msg);
    }

    function handleAiChatKeydown(e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAiChatSubmit(e);
      }
    }

    function renderAiChatMessages() {
      const container = document.getElementById("aiChatMessages");
      if (!container) return;

      container.innerHTML = aiChatMessages.map(m => {
        const isUser = m.role === "user";
        const formattedText = escapeHtml(m.text || "").replace(/\\n/g, "<br>");
        const bk = m.booking || null;
        const bkCard = bk ? \`
          <div class="mt-2 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i>
                Room \${escapeHtml(bk.room_number || "")} Confirmed
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                \${(bk.guest_count || 1)} person\${(bk.guest_count || 1) > 1 ? "s" : ""}
              </span>
            </div>
            <div class="text-xs font-bold text-slate-900">\${escapeHtml(bk.guest_name || "Guest")}</div>
            <div class="text-[11px] text-slate-600 flex items-center justify-between">
              <span>\${escapeHtml(bk.check_in_date || bk.date || "")}\${bk.check_out_date && bk.check_out_date !== (bk.check_in_date || bk.date) ? \` → \${escapeHtml(bk.check_out_date)}\` : ""}</span>
              <span class="font-mono font-bold text-slate-900">₹\${formatCurrency(bk.total_stay_amount || bk.amount || 0)} (\${escapeHtml((bk.payment_mode || "online").toUpperCase())})</span>
            </div>
            <div class="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onclick="triggerQuickIdUpload('\${bk.id}')"
                class="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <i data-lucide="camera" class="w-3 h-3"></i>
                <span>Attach ID Photo</span>
              </button>
              <button
                type="button"
                onclick="openEditBookingModal('\${bk.id}')"
                class="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>
        \` : "";

        return \`
          <div class="flex \${isUser ? "justify-end" : "justify-start"}">
            <div class="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs \${isUser ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"}">
              <div>\${formattedText}</div>
              \${bkCard}
            </div>
          </div>
        \`;
      }).join("") + (aiChatIsSending ? \`
        <div class="flex justify-start">
          <div class="rounded-2xl rounded-bl-sm px-3.5 py-2 bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
            <span>Checking room &amp; creating booking...</span>
          </div>
        </div>
      \` : "");

      container.scrollTop = container.scrollHeight;
      refreshIcons();
    }

    async function handleAiChatSubmit(e) {
      if (e) e.preventDefault();
      const inp = document.getElementById("aiChatInput");
      if (!inp) return;
      const text = inp.value.trim();
      if (!text || aiChatIsSending) return;
      inp.value = "";
      await submitAiChatMessage(text);
    }

    async function submitAiChatMessage(text) {
      const clean = (text || "").trim();
      if (!clean || aiChatIsSending) return;

      const historySnapshot = aiChatMessages
        .filter(m => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map(m => ({ role: m.role, content: m.text || "" }));

      aiChatMessages.push({ role: "user", text: clean, booking: null });
      aiChatIsSending = true;
      const sendBtn = document.getElementById("aiChatSendBtn");
      if (sendBtn) sendBtn.disabled = true;
      renderAiChatMessages();

      try {
        const propertyId = currentUserRole === "manager"
          ? (currentManagerInfo?.property_id || "")
          : (activePropertyId !== "all" ? activePropertyId : "");
        const defaultDate = managerFinanceDate || formatIsoDate(new Date());

        const res = await fetch("/api/room-bookings/ai-chat", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message: clean,
            messages: historySnapshot,
            pendingDraft: aiChatPendingDraft,
            property_id: propertyId,
            default_date: defaultDate
          })
        });

        if (res.status === 401) {
          aiChatIsSending = false;
          if (sendBtn) sendBtn.disabled = false;
          return lockApp();
        }

        const data = await res.json();
        if (!res.ok || data.error) {
          aiChatMessages.push({
            role: "assistant",
            text: data.error || "Sorry, I couldn't process that booking request. Please try again.",
            booking: null
          });
        } else {
          aiChatPendingDraft = data.pendingDraft || null;
          aiChatMessages.push({
            role: "assistant",
            text: data.reply || "Done.",
            booking: data.status === "created" ? data.booking : null
          });

          if (data.status === "created") {
            showToast("Room " + (data.booking?.room_number || "") + " booked for " + (data.booking?.guest_name || "Guest") + "!");
            await Promise.all([fetchRoomBookings(), fetchFinances()]);
            if (currentView === "finances") {
              renderFinancesView();
            }
          }
        }
      } catch (err) {
        aiChatMessages.push({
          role: "assistant",
          text: "Network error while booking room: " + err.message,
          booking: null
        });
      } finally {
        aiChatIsSending = false;
        if (sendBtn) sendBtn.disabled = false;
        renderAiChatMessages();
      }
    }

    window.addEventListener("DOMContentLoaded", () => {
      document.getElementById("currentMonthLabel").innerText = \`\${MONTH_NAMES[currentMonth]} \${currentYear}\`;
      initAuth();
    });
  </script>
</body>
</html>`;
}
