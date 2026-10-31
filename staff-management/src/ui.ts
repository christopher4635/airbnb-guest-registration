export function getDashboardHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
    /* Sticky table column styling */
    .sticky-col {
      position: sticky;
      left: 0;
      z-index: 20;
      background: inherit;
    }
    .sticky-col-header {
      position: sticky;
      left: 0;
      z-index: 30;
      background: #f8fafc;
    }
    .sticky-summary {
      position: sticky;
      right: 0;
      z-index: 20;
      background: inherit;
    }
    .sticky-summary-header {
      position: sticky;
      right: 0;
      z-index: 30;
      background: #f8fafc;
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
    <div id="lockCard" class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center flex flex-col items-center">
      <div class="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <i data-lucide="shield-check" class="w-8 h-8"></i>
      </div>
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">StaffSync Hub</h2>
      <p class="text-xs text-slate-500 mt-1 mb-6">Enter 4-digit Admin or Manager PIN to access</p>

      <!-- PIN Dots -->
      <div id="pinDots" class="flex gap-3 justify-center mb-6">
        <div class="pin-dot w-4 h-4 rounded-full border-2 border-slate-300 transition-all duration-200"></div>
        <div class="pin-dot w-4 h-4 rounded-full border-2 border-slate-300 transition-all duration-200"></div>
        <div class="pin-dot w-4 h-4 rounded-full border-2 border-slate-300 transition-all duration-200"></div>
        <div class="pin-dot w-4 h-4 rounded-full border-2 border-slate-300 transition-all duration-200"></div>
      </div>
      <div id="pinError" class="text-xs text-rose-500 font-medium h-4 mb-2"></div>

      <!-- Keypad -->
      <div class="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
        <button onclick="handleKeypad('1')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">1</button>
        <button onclick="handleKeypad('2')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">2</button>
        <button onclick="handleKeypad('3')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">3</button>
        <button onclick="handleKeypad('4')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">4</button>
        <button onclick="handleKeypad('5')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">5</button>
        <button onclick="handleKeypad('6')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">6</button>
        <button onclick="handleKeypad('7')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">7</button>
        <button onclick="handleKeypad('8')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">8</button>
        <button onclick="handleKeypad('9')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">9</button>
        <button onclick="handleKeypad('clear')" class="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-semibold text-slate-600 transition">CLEAR</button>
        <button onclick="handleKeypad('0')" class="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:scale-95 text-xl font-bold text-slate-800 transition shadow-sm border border-slate-200/80">0</button>
        <button onclick="handleKeypad('back')" class="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition">
          <i data-lucide="delete" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="flex items-center gap-2 mt-2">
        <input type="checkbox" id="rememberMe" checked class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4">
        <label for="rememberMe" class="text-xs text-slate-500 select-none cursor-pointer">Stay signed in on this device</label>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MAIN APP CONTAINER                                                        -->
  <!-- ========================================================================= -->
  <div id="appContainer" class="flex-1 flex flex-col min-w-0">

    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <i data-lucide="building-2" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 text-lg leading-tight tracking-tight">StaffSync</span>
                <span class="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">Cloud D1</span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium">Hotel · Homes · Salon · House Help</p>
            </div>
          </div>

          <!-- Quick Top Actions & Role Badge -->
          <div class="flex items-center gap-2 sm:gap-3">
            <div id="userRoleBadge" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Admin Access</span>
            </div>
            <button id="btnLeaveRules" onclick="openLeavePolicyModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">
              <i data-lucide="sliders" class="w-3.5 h-3.5 text-slate-600"></i>
              <span class="hidden md:inline">Leave Rules</span>
            </button>
            <button id="btnHeaderAddStaff" onclick="openStaffModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Add Staff</span>
            </button>
            <button onclick="lockApp()" title="Lock / Switch User" class="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition">
              <i data-lucide="log-out" class="w-4 h-4"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- Properties & Primary View Tabs -->
      <div class="bg-slate-50/90 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-2 gap-2">
          
          <!-- Properties Selector -->
          <div id="propertyTabs" class="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <!-- Rendered by JS -->
          </div>
          
          <!-- View Switcher Tabs -->
          <div class="flex items-center bg-slate-200/80 p-1 rounded-xl shrink-0 overflow-x-auto scrollbar-none">
            <button id="viewTabMonthly" onclick="switchView('monthly')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition shadow-xs bg-white text-indigo-600 flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
              <span>Monthly Sheet</span>
            </button>
            <button id="viewTabDaily" onclick="switchView('daily')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
              <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
              <span>Daily Roll Call</span>
            </button>
            <button id="viewTabPayroll" onclick="switchView('payroll')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
              <i data-lucide="wallet" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Salary & Payroll</span>
            </button>
            <button id="viewTabDirectory" onclick="switchView('directory')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
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

      <!-- Quick Legend Bar (shown for monthly view) -->
      <div id="legendBar" class="flex items-center gap-3 sm:gap-6 text-xs text-slate-600 mb-3 px-1 flex-wrap">
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
      <!-- VIEW 1: MONTHLY MATRIX TABLE                                          -->
      <!-- ===================================================================== -->
      <div id="monthlyViewSection" class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex-1 flex flex-col">
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
        <div id="tableEmptyState" class="hidden p-12 text-center text-slate-400">
          <i data-lucide="user-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
          <p class="font-medium text-sm text-slate-600">No staff members found for this property.</p>
          <button onclick="openStaffModal()" class="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline">Add your first staff member</button>
        </div>
      </div>

      <!-- ===================================================================== -->
      <!-- VIEW 2: DAILY ROLL CALL VIEW (Mobile-Optimized)                       -->
      <!-- ===================================================================== -->
      <div id="dailyViewSection" class="hidden flex-1 flex flex-col gap-3">
        <!-- Day Selector -->
        <div class="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
          <button onclick="changeDailyDate(-1)" class="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
            <i data-lucide="chevron-left" class="w-5 h-5"></i>
          </button>
          <div class="text-center">
            <div id="dailyDateTitle" class="text-base font-bold text-slate-900">Today, 31 Oct 2026</div>
            <div class="text-xs text-slate-500 font-medium">Click buttons to instantly mark attendance</div>
          </div>
          <button onclick="changeDailyDate(1)" class="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
            <i data-lucide="chevron-right" class="w-5 h-5"></i>
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
        
        <!-- Payroll Summary Stat Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Base Payroll</div>
            <div id="statBaseSalary" class="text-lg font-bold text-slate-900 mt-1">₹0</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Total monthly base</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Advances & Deduc</div>
            <div id="statDeductions" class="text-lg font-bold text-slate-700 mt-1">₹0</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Advances + Unpaid</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Total Net Due</div>
            <div id="statNetPayout" class="text-lg font-bold text-indigo-700 mt-1">₹0</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Total month payout</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
            <div class="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Paid Amount</div>
            <div id="statPaidAmount" class="text-lg font-bold text-emerald-700 mt-1">₹0</div>
            <div id="statPaidCount" class="text-[10px] text-emerald-600 font-medium mt-0.5">0 staff paid</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
            <div class="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending Payout</div>
            <div id="statPendingAmount" class="text-lg font-bold text-amber-700 mt-1">₹0</div>
            <div id="statPendingCount" class="text-[10px] text-amber-600 font-medium mt-0.5">0 staff unpaid</div>
          </div>
        </div>

        <!-- Formula Explanation Card -->
        <div class="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-indigo-900">
          <div class="flex items-center gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            <span><strong>Leave Carry-Forward Protection:</strong> Salary is <strong>NEVER deducted</strong> as long as employee has carried-forward leave balance. Deductions apply only to unpaid excess days.</span>
          </div>
          <span class="text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded-md text-indigo-700 border border-indigo-200">Daily Rate = Base Salary ÷ Total Month Days</span>
        </div>

        <!-- Payroll Table -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="text-slate-500 uppercase font-semibold text-[10px] tracking-wider bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="py-3 px-3.5">Staff & Property</th>
                  <th class="py-3 px-3 text-right">Base Salary</th>
                  <th class="py-3 px-2 text-center">Days</th>
                  <th class="py-3 px-3 text-right">Daily Rate</th>
                  <th class="py-3 px-3 text-center">Attendance (P/DO/L/A)</th>
                  <th class="py-3 px-3 text-center" title="Accumulated leave balance carried forward">Total Leave Bal</th>
                  <th class="py-3 px-3 text-right" title="Deductions for days exceeding available leave balance">Unpaid Deduction</th>
                  <th class="py-3 px-3 text-right">Advance Paid</th>
                  <th class="py-3 px-3.5 text-right font-bold text-emerald-800 bg-emerald-50/50">Net Payout</th>
                  <th class="py-3 px-3 text-center">Bank / QR</th>
                  <th class="py-3 px-3 text-center">Payment Status</th>
                  <th class="py-3 px-2 text-center">Slip</th>
                </tr>
              </thead>
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

    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-400">
      StaffSync Cloud · Connected to Cloudflare D1 · PIN: 4635 Protected
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
              <input type="password" maxlength="4" pattern="[0-9]*" inputmode="numeric" id="staffManagerPin" placeholder="e.g. 1234" class="w-full text-center tracking-widest font-mono font-bold text-base px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800">
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
    let currentUserRole = "admin"; // 'admin' or 'manager'
    let currentManagerInfo = null; // { staff_id, name, property_id, property_name }
    let enteredPin = "";
    let activePropertyId = "all"; // 'all' or property.id
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0-indexed
    let dailyDate = new Date();
    let currentView = "monthly"; // 'monthly', 'daily', 'payroll', 'directory'

    let properties = [];
    let staffList = [];
    let attendanceMap = {}; // { [staff_id_YYYY-MM-DD]: "present" | "absent" | "day_off" | "leave" }
    let priorLeavesMap = {}; // { [staff_id]: number } leaves taken before current month
    let advancesList = []; // Array of advance records for current month
    let paymentsList = []; // Array of salary payment records for current month
    let currentDocStaffId = null;
    let currentPaymentStaffId = null;
    let currentPaymentAmount = 0;

    let currentPickerTarget = null; // { staffId, date }

    // Init Lucide
    function refreshIcons() {
      if (window.lucide) lucide.createIcons();
    }

    // -------------------------------------------------------------------------
    // PIN & AUTHENTICATION (ADMIN & MANAGER)
    // -------------------------------------------------------------------------
    function initAuth() {
      const saved = localStorage.getItem(AUTH_PIN_KEY);
      const savedRole = localStorage.getItem(AUTH_ROLE_KEY);
      const savedManager = localStorage.getItem(AUTH_MANAGER_KEY);
      if (saved) {
        if (savedRole) currentUserRole = savedRole;
        if (savedManager) {
          try { currentManagerInfo = JSON.parse(savedManager); } catch (e) {}
        }
        verifyPin(saved, true);
      } else {
        showLockScreen();
      }
    }

    function showLockScreen() {
      enteredPin = "";
      updatePinDots();
      document.getElementById("lockScreen").classList.remove("hidden");
      document.getElementById("lockScreen").classList.add("flex");
      refreshIcons();
    }

    function lockApp() {
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
      const tabPayroll = document.getElementById("viewTabPayroll");
      const tabDirectory = document.getElementById("viewTabDirectory");

      if (currentUserRole === "manager" && currentManagerInfo) {
        badge.innerHTML = \`
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Manager: \${escapeHtml(currentManagerInfo.name)} (\${escapeHtml(currentManagerInfo.property_name || 'Property')})</span>
        \`;
        badge.classList.remove("hidden");
        badge.classList.add("inline-flex");

        if (btnLeaveRules) btnLeaveRules.classList.add("hidden");
        if (btnAddStaff) btnAddStaff.classList.add("hidden");
        if (tabPayroll) tabPayroll.classList.add("hidden");
        if (tabDirectory) tabDirectory.classList.add("hidden");

        if (currentView === "payroll" || currentView === "directory") {
          switchView("monthly");
        }

        if (currentManagerInfo.property_id && (activePropertyId === "all" || !activePropertyId)) {
          activePropertyId = currentManagerInfo.property_id;
        }
      } else {
        badge.innerHTML = \`
          <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
          <span>Admin Access</span>
        \`;
        badge.classList.remove("hidden");
        badge.classList.add("inline-flex");

        if (btnLeaveRules) btnLeaveRules.classList.remove("hidden");
        if (btnAddStaff) btnAddStaff.classList.remove("hidden");
        if (tabPayroll) tabPayroll.classList.remove("hidden");
        if (tabDirectory) tabDirectory.classList.remove("hidden");
      }
      refreshIcons();
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

    function handleKeypad(val) {
      if (val === 'clear') {
        enteredPin = "";
      } else if (val === 'back') {
        enteredPin = enteredPin.slice(0, -1);
      } else if (enteredPin.length < 4) {
        enteredPin += val;
      }
      updatePinDots();

      if (enteredPin.length === 4) {
        verifyPin(enteredPin);
      }
    }

    window.addEventListener("keydown", (e) => {
      const lockScreen = document.getElementById("lockScreen");
      if (lockScreen && !lockScreen.classList.contains("hidden")) {
        if (e.key >= "0" && e.key <= "9") {
          handleKeypad(e.key);
        } else if (e.key === "Backspace") {
          handleKeypad("back");
        } else if (e.key === "Escape") {
          handleKeypad("clear");
        }
      }
    });

    function updatePinDots() {
      const dots = document.querySelectorAll("#pinDots .pin-dot");
      dots.forEach((dot, idx) => {
        if (idx < enteredPin.length) {
          dot.classList.add("bg-indigo-600", "border-indigo-600", "scale-110");
          dot.classList.remove("border-slate-300");
        } else {
          dot.classList.remove("bg-indigo-600", "border-indigo-600", "scale-110");
          dot.classList.add("border-slate-300");
        }
      });
      document.getElementById("pinError").innerText = "";
    }

    async function verifyPin(pin, isAuto = false) {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin })
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

          if (document.getElementById("rememberMe").checked || isAuto) {
            localStorage.setItem(AUTH_PIN_KEY, pin);
            localStorage.setItem(AUTH_ROLE_KEY, currentUserRole);
            if (currentManagerInfo) {
              localStorage.setItem(AUTH_MANAGER_KEY, JSON.stringify(currentManagerInfo));
            } else {
              localStorage.removeItem(AUTH_MANAGER_KEY);
            }
          }
          document.getElementById("lockScreen").classList.add("hidden");
          document.getElementById("lockScreen").classList.remove("flex");
          applyRolePermissions();
          loadDashboardData();
        } else {
          throw new Error("Invalid PIN");
        }
      } catch (err) {
        if (isAuto) {
          localStorage.removeItem(AUTH_PIN_KEY);
          showLockScreen();
          return;
        }
        const card = document.getElementById("lockCard");
        card.classList.add("shake");
        document.getElementById("pinError").innerText = "Incorrect PIN. Please try again.";
        setTimeout(() => {
          card.classList.remove("shake");
          enteredPin = "";
          updatePinDots();
        }, 500);
      }
    }

    function getAuthHeaders() {
      const pin = localStorage.getItem(AUTH_PIN_KEY) || enteredPin || "4635";
      return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + pin
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
          fetchAttendance()
        ];
        if (currentUserRole === "admin") {
          promises.push(fetchAdvances(), fetchPayments());
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
      activePropertyId = id;
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
    function switchView(view) {
      currentView = view;
      const tabs = ["Monthly", "Daily", "Payroll", "Directory"];
      tabs.forEach(t => {
        const btn = document.getElementById("viewTab" + t);
        if (t.toLowerCase() === view) {
          btn.classList.add("bg-white", "text-indigo-600", "shadow-xs");
          btn.classList.remove("text-slate-600");
        } else {
          btn.classList.remove("bg-white", "text-indigo-600", "shadow-xs");
          btn.classList.add("text-slate-600");
        }
      });

      // Show/Hide sections
      document.getElementById("monthlyViewSection").classList.toggle("hidden", view !== "monthly");
      document.getElementById("dailyViewSection").classList.toggle("hidden", view !== "daily");
      document.getElementById("payrollViewSection").classList.toggle("hidden", view !== "payroll");
      document.getElementById("directoryViewSection").classList.toggle("hidden", view !== "directory");

      // Controls visibility
      document.getElementById("monthControlBar").classList.toggle("hidden", view === "directory");
      document.getElementById("legendBar").classList.toggle("hidden", view !== "monthly");
      document.getElementById("btnMarkAllPresent").classList.toggle("hidden", view === "payroll");

      renderActiveView();
      refreshIcons();
    }

    function renderActiveView() {
      if (currentView === "monthly") renderMonthlyView();
      else if (currentView === "daily") renderDailyView();
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
        promises.push(fetchAdvances(), fetchPayments());
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
      const emptyState = document.getElementById("tableEmptyState");

      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const todayStr = formatIsoDate(new Date());

      const filteredStaff = activePropertyId === 'all'
        ? staffList
        : staffList.filter(s => s.property_id === activePropertyId);

      if (filteredStaff.length === 0) {
        thead.innerHTML = "";
        tbody.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
      }
      emptyState.classList.add("hidden");

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
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[50px] bg-emerald-50/60 text-emerald-800 border-l border-slate-200">P</th>
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[50px] bg-sky-50/60 text-sky-800 border-l border-slate-200">DO</th>
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[50px] bg-rose-50/60 text-rose-800 border-l border-slate-200">A</th>
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[55px] bg-amber-50/60 text-amber-800 border-l border-slate-200">Leave</th>
        <th class="sticky-summary-header py-3 px-3 text-center min-w-[105px] bg-indigo-50/70 text-indigo-900 border-l border-slate-200" title="Accrued leaves carried forward minus leaves taken">Total Leave Bal</th>
      </tr>\`;
      thead.innerHTML = headHtml;

      let bodyHtml = "";
      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || 'General', monthly_leave_allowance: 2 };
        const allowedLeaves = (staff.custom_leave_allowance !== null && staff.custom_leave_allowance !== undefined)
          ? staff.custom_leave_allowance
          : prop.monthly_leave_allowance;

        let countP = 0, countDO = 0, countA = 0, countL = 0;
        let rowCells = "";

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

          rowCells += \`
            <td class="p-1 text-center border-r border-slate-200/80 \${isToday ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-200' : ''}">
              <button onclick="cycleCellStatus('\${staff.id}', '\${dateStr}', event)" oncontextmenu="openStatusPicker('\${staff.id}', '\${dateStr}', event)" title="Click to cycle status, Right click to choose" class="w-7 h-7 rounded-lg text-[11px] font-bold border transition active:scale-90 flex items-center justify-center mx-auto \${badgeClass}">
                \${label}
              </button>
            </td>
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
            <td class="sticky-summary py-2 px-1 text-center font-bold text-emerald-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countP}</td>
            <td class="sticky-summary py-2 px-1 text-center font-bold text-sky-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countDO}</td>
            <td class="sticky-summary py-2 px-1 text-center font-bold text-rose-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countA}</td>
            <td class="sticky-summary py-2 px-1 text-center font-bold text-amber-700 bg-white group-hover:bg-slate-50 border-l border-slate-200">\${countL}</td>
            <td class="sticky-summary py-2 px-2 text-center bg-white group-hover:bg-slate-50 border-l border-slate-200">
              <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border \${balanceBadge}" title="Carried Leave Balance: \${leaveRemaining.toFixed(1)} days | Accrued: \${leaveDetails.totalAccrued} | Used: \${leaveDetails.totalTaken}">
                \${balanceText}
              </span>
            </td>
          </tr>
        \`;
      });

      tbody.innerHTML = bodyHtml;
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
      const filteredStaff = activePropertyId === 'all'
        ? staffList
        : staffList.filter(s => s.property_id === activePropertyId);

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

      const filteredStaff = activePropertyId === 'all'
        ? staffList
        : staffList.filter(s => s.property_id === activePropertyId);

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

            <!-- Action Buttons -->
            <div class="grid grid-cols-4 gap-2 pt-1">
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'present')" class="py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1 \${status === 'present' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border-slate-200'}">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Present</span>
              </button>
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'absent')" class="py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1 \${status === 'absent' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-rose-50 border-slate-200'}">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                <span>Absent</span>
              </button>
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'day_off')" class="py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1 \${status === 'day_off' ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-sky-50 border-slate-200'}">
                <i data-lucide="coffee" class="w-3.5 h-3.5"></i>
                <span>Day Off</span>
              </button>
              <button onclick="updateAttendance('\${staff.id}', '\${dateStr}', 'leave')" class="py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1 \${status === 'leave' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-amber-50 border-slate-200'}">
                <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                <span>Leave</span>
              </button>
            </div>
          </div>
        \`;
      });

      container.innerHTML = html;
      refreshIcons();
    }

      container.innerHTML = html;
      refreshIcons();
    }

    // -------------------------------------------------------------------------
    // VIEW 3: SALARY & PAYROLL CALCULATION
    // -------------------------------------------------------------------------
    function renderPayrollView() {
      const tbody = document.getElementById("payrollTableBody");
      const daysCount = getDaysInMonth(currentYear, currentMonth);

      const filteredStaff = activePropertyId === 'all'
        ? staffList
        : staffList.filter(s => s.property_id === activePropertyId);

      let totalBase = 0;
      let totalDeductions = 0;
      let totalAdvances = 0;
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

        // Gross earned = Base Salary - Unpaid Deductions
        const grossEarned = Math.max(0, baseSalary - absentDeduction);
        const netPayout = Math.max(0, grossEarned - advanceAmount);

        totalBase += baseSalary;
        totalDeductions += absentDeduction;
        totalAdvances += advanceAmount;
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
            <td class="py-3 px-3.5">
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
              <button onclick="openAdvanceModal('\${staff.id}')" title="Click to record or view advances" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-amber-50 transition border border-transparent hover:border-amber-200">
                <span class="\${advanceAmount > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}">
                  ₹\${advanceAmount.toLocaleString('en-IN')}
                </span>
                <span class="w-5 h-5 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-600 flex items-center justify-center">
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
      const filteredStaff = activePropertyId === 'all'
        ? staffList
        : staffList.filter(s => s.property_id === activePropertyId);

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
                    \${staff.is_manager ? \`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200"><i data-lucide="shield-check" class="w-3 h-3 text-violet-600"></i> Manager (PIN: \${escapeHtml(staff.manager_pin || 'Set')})</span>\` : ''}
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
      const grossEarned = Math.max(0, baseSalary - absentDeduction);
      const netPayout = Math.max(0, grossEarned - advanceAmount);

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
      } else {
        exportAttendanceCSV();
      }
    }

    function exportPayrollCSV() {
      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const filteredStaff = activePropertyId === 'all'
        ? staffList
        : staffList.filter(s => s.property_id === activePropertyId);

      let csv = "Staff Name,Property,Role,Phone,Base Salary,Total Days,Daily Rate,Present,Day Off,Leaves,Absent,Total Leave Balance,Unpaid Deduction,Gross Earned,Advance Deducted,Net Payout,Bank Name,Account Number,IFSC,UPI ID,Payment Status,Paid Amount,Payment Date,Payment Mode,Reference No\\n";

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
        const net = Math.max(0, gross - adv);

        const payment = paymentsList.find(p => p.staff_id === staff.id);
        const pStatus = (payment && payment.status === 'paid') ? 'Paid' : 'Unpaid';
        const pAmt = (payment && payment.status === 'paid') ? (payment.amount || net) : 0;
        const pDate = (payment && payment.payment_date) || '';
        const pMode = (payment && payment.payment_mode) || '';
        const pRef = (payment && payment.reference_no) || '';

        csv += \`"\${staff.name}","\${prop.name}","\${staff.role || ''}","\${staff.phone || ''}",\${base},\${daysCount},\${dailyRate},\${countP},\${countDO},\${countL},\${countA},\${balance.toFixed(1)},\${absentDeduction},\${gross},\${adv},\${net},"\${staff.bank_name || ''}","\${staff.bank_account_number || ''}","\${staff.bank_ifsc || ''}","\${staff.bank_upi_id || ''}","\${pStatus}",\${pAmt},"\${pDate}","\${pMode}","\${pRef}"\\n\`;
      });

      downloadCsvFile(csv, \`Salary_Payroll_\${MONTH_NAMES[currentMonth]}_\${currentYear}.csv\`);
    }

    function exportAttendanceCSV() {
      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const filteredStaff = activePropertyId === 'all'
        ? staffList
        : staffList.filter(s => s.property_id === activePropertyId);

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
