export function getDashboardHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Staff Attendance & Leave Hub</title>
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
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Staff Attendance</h2>
      <p class="text-xs text-slate-500 mt-1 mb-6">Enter your 4-digit PIN to access</p>

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
              <i data-lucide="users" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 text-lg leading-tight tracking-tight">StaffSync</span>
                <span class="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">Cloud</span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium">Multi-Property Staff & Leave Hub</p>
            </div>
          </div>

          <!-- Quick Top Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <button onclick="openLeavePolicyModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">
              <i data-lucide="sliders" class="w-3.5 h-3.5 text-slate-600"></i>
              <span class="hidden md:inline">Leave Rules</span>
            </button>
            <button onclick="openStaffModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Add Staff</span>
            </button>
            <button onclick="lockApp()" title="Lock App" class="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- Properties Tabs -->
      <div class="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2 gap-2 scrollbar-none">
          <div id="propertyTabs" class="flex items-center gap-1.5 flex-nowrap shrink-0">
            <!-- Rendered by JS -->
          </div>
          
          <!-- View Toggle: Monthly Table vs Daily Roll Call -->
          <div class="flex items-center bg-slate-200/70 p-0.5 rounded-lg shrink-0">
            <button id="viewTabMonthly" onclick="switchView('monthly')" class="px-3 py-1 text-xs font-semibold rounded-md transition shadow-xs bg-white text-indigo-600">
              <i data-lucide="calendar" class="w-3.5 h-3.5 inline mr-1"></i>Monthly View
            </button>
            <button id="viewTabDaily" onclick="switchView('daily')" class="px-3 py-1 text-xs font-semibold rounded-md transition text-slate-600 hover:text-slate-900">
              <i data-lucide="check-square" class="w-3.5 h-3.5 inline mr-1"></i>Daily Roll Call
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col">
      
      <!-- Month & Action Controls Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
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
            <span>Monthly Leave Allowance: <strong id="currentAllowanceText">2.0 days</strong></span>
          </div>
          
          <button onclick="markAllTodayPresent()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition">
            <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
            <span>Mark All Present Today</span>
          </button>

          <button onclick="exportToCSV()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition">
            <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Export</span>
          </button>
        </div>

      </div>

      <!-- Quick Legend Bar -->
      <div class="flex items-center gap-3 sm:gap-6 text-xs text-slate-600 mb-3 px-1 flex-wrap">
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
          <span>Day Off (Weekly)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] border border-amber-300">L</span>
          <span>Leave (Deducts quota)</span>
        </div>
      </div>

      <!-- VIEW 1: MONTHLY MATRIX TABLE -->
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

      <!-- VIEW 2: DAILY ROLL CALL VIEW (Mobile-Optimized) -->
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

    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-400">
      StaffSync Cloud · Connected to Cloudflare D1 · PIN: 4635 Protected
    </footer>

  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: ADD / EDIT STAFF                                                   -->
  <!-- ========================================================================= -->
  <div id="staffModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
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

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Property *</label>
          <select id="staffProperty" required class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <!-- Populated by JS -->
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Role / Job Title</label>
            <input type="text" id="staffRole" placeholder="e.g. Front Desk, Cook" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
            <input type="tel" id="staffPhone" placeholder="e.g. 9876543210" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Custom Leave Allowance (Optional)</label>
          <input type="number" step="0.5" id="staffCustomLeave" placeholder="Leave empty to use property default" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <p class="text-[11px] text-slate-400 mt-1">If blank, staff receives the property's monthly allowance.</p>
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
    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1" id="pickerTitle">Change Status</div>
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
    let enteredPin = "";
    let activePropertyId = "all"; // 'all' or property.id
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0-indexed
    let dailyDate = new Date();
    let currentView = "monthly"; // 'monthly' or 'daily'

    let properties = [];
    let staffList = [];
    let attendanceMap = {}; // { [staff_id_YYYY-MM-DD]: "present" | "absent" | "day_off" | "leave" }

    let currentPickerTarget = null; // { staffId, date, el }

    // Init Lucide
    function refreshIcons() {
      if (window.lucide) lucide.createIcons();
    }

    // -------------------------------------------------------------------------
    // PIN & AUTHENTICATION
    // -------------------------------------------------------------------------
    function initAuth() {
      const saved = localStorage.getItem(AUTH_PIN_KEY);
      if (saved) {
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
      showLockScreen();
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

    // Native keyboard support
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
          if (document.getElementById("rememberMe").checked || isAuto) {
            localStorage.setItem(AUTH_PIN_KEY, pin);
          }
          document.getElementById("lockScreen").classList.add("hidden");
          document.getElementById("lockScreen").classList.remove("flex");
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
        await Promise.all([
          fetchProperties(),
          fetchStaff(),
          fetchAttendance()
        ]);
        renderPropertyTabs();
        renderMonthlyView();
        renderDailyView();
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
      data.forEach(item => {
        attendanceMap[\`\${item.staff_id}_\${item.date}\`] = item.status;
      });
    }

    // -------------------------------------------------------------------------
    // PROPERTY TABS & SELECTION
    // -------------------------------------------------------------------------
    function renderPropertyTabs() {
      const container = document.getElementById("propertyTabs");
      let html = \`
        <button onclick="selectProperty('all')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 \${activePropertyId === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
          <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
          <span>All Properties (\${staffList.length})</span>
        </button>
      \`;

      properties.forEach(prop => {
        const isSelected = activePropertyId === prop.id;
        const count = staffList.filter(s => s.property_id === prop.id).length;
        html += \`
          <button onclick="selectProperty('\${prop.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 \${isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
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
      renderMonthlyView();
      renderDailyView();
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
    // MONTH & VIEW NAVIGATION
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
      await fetchAttendance();
      renderMonthlyView();
    }

    function switchView(view) {
      currentView = view;
      const btnM = document.getElementById("viewTabMonthly");
      const btnD = document.getElementById("viewTabDaily");
      const secM = document.getElementById("monthlyViewSection");
      const secD = document.getElementById("dailyViewSection");

      if (view === "monthly") {
        btnM.classList.add("bg-white", "text-indigo-600", "shadow-xs");
        btnM.classList.remove("text-slate-600");
        btnD.classList.remove("bg-white", "text-indigo-600", "shadow-xs");
        btnD.classList.add("text-slate-600");

        secM.classList.remove("hidden");
        secD.classList.add("hidden");
        renderMonthlyView();
      } else {
        btnD.classList.add("bg-white", "text-indigo-600", "shadow-xs");
        btnD.classList.remove("text-slate-600");
        btnM.classList.remove("bg-white", "text-indigo-600", "shadow-xs");
        btnM.classList.add("text-slate-600");

        secD.classList.remove("hidden");
        secM.classList.add("hidden");
        renderDailyView();
      }
      refreshIcons();
    }

    // -------------------------------------------------------------------------
    // VIEW 1: MONTHLY MATRIX TABLE
    // -------------------------------------------------------------------------
    function getDaysInMonth(year, month) {
      return new Date(year, month + 1, 0).getDate();
    }

    function renderMonthlyView() {
      const thead = document.getElementById("monthlyTableHead");
      const tbody = document.getElementById("monthlyTableBody");
      const emptyState = document.getElementById("tableEmptyState");

      const daysCount = getDaysInMonth(currentYear, currentMonth);
      const todayStr = formatIsoDate(new Date());

      // Filter staff
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

      // Generate Table Header
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

      // Summary columns
      headHtml += \`
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[50px] bg-emerald-50/60 text-emerald-800 border-l border-slate-200">P</th>
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[50px] bg-sky-50/60 text-sky-800 border-l border-slate-200">DO</th>
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[50px] bg-rose-50/60 text-rose-800 border-l border-slate-200">A</th>
        <th class="sticky-summary-header py-3 px-2 text-center min-w-[55px] bg-amber-50/60 text-amber-800 border-l border-slate-200">Leave</th>
        <th class="sticky-summary-header py-3 px-3 text-center min-w-[95px] bg-indigo-50/70 text-indigo-900 border-l border-slate-200">Balance</th>
      </tr>\`;
      thead.innerHTML = headHtml;

      // Generate Table Body
      let bodyHtml = "";
      filteredStaff.forEach(staff => {
        const prop = properties.find(p => p.id === staff.property_id) || { name: staff.property_name || 'General', monthly_leave_allowance: 2 };
        const allowedLeaves = (staff.custom_leave_allowance !== null && staff.custom_leave_allowance !== undefined)
          ? staff.custom_leave_allowance
          : prop.monthly_leave_allowance;

        let countP = 0;
        let countDO = 0;
        let countA = 0;
        let countL = 0;

        let rowCells = "";
        for (let day = 1; day <= daysCount; day++) {
          const dateStr = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, "0")}-\${String(day).padStart(2, "0")}\`;
          const isToday = dateStr === todayStr;
          
          // Present by default if unmarked
          const record = attendanceMap[\`\${staff.id}_\${dateStr}\`];
          const status = record || "present";

          if (status === "present") countP++;
          else if (status === "day_off") countDO++;
          else if (status === "absent") countA++;
          else if (status === "leave") countL++;

          // Badge style
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

        const leaveRemaining = (allowedLeaves - countL);
        let balanceBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (leaveRemaining < 0) {
          balanceBadge = "bg-rose-50 text-rose-700 border-rose-200";
        } else if (leaveRemaining === 0) {
          balanceBadge = "bg-amber-50 text-amber-700 border-amber-200";
        }

        bodyHtml += \`
          <tr class="hover:bg-slate-50/60 transition group">
            <td class="sticky-col py-2.5 px-3.5 bg-white group-hover:bg-slate-50 border-r border-slate-200">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5" onclick="openStaffModal('\${staff.id}')">
                    <span>\${escapeHtml(staff.name)}</span>
                    <i data-lucide="edit-2" class="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition"></i>
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
              <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border \${balanceBadge}">
                \${leaveRemaining} / \${allowedLeaves} left
              </span>
            </td>
          </tr>
        \`;
      });

      tbody.innerHTML = bodyHtml;
      refreshIcons();
    }

    // -------------------------------------------------------------------------
    // ATTENDANCE INTERACTIONS (CYCLE & PICKER)
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

    // Close picker when clicking outside
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
      // Optimistic update
      attendanceMap[\`\${staffId}_\${date}\`] = status;
      renderMonthlyView();
      if (currentView === "daily") renderDailyView();

      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            staff_id: staffId,
            date,
            status
          })
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
      renderMonthlyView();
      if (currentView === "daily") renderDailyView();

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
    // VIEW 2: DAILY ROLL CALL VIEW (Mobile-Friendly)
    // -------------------------------------------------------------------------
    function changeDailyDate(delta) {
      dailyDate.setDate(dailyDate.getDate() + delta);
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

        html += \`
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-slate-900 text-sm">\${escapeHtml(staff.name)}</h4>
                <div class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <span class="text-indigo-600 font-semibold">\${escapeHtml(prop.name)}</span>
                  \${staff.role ? \`<span>•</span><span>\${escapeHtml(staff.role)}</span>\` : ''}
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

    // -------------------------------------------------------------------------
    // MODAL: ADD / EDIT STAFF
    // -------------------------------------------------------------------------
    function openStaffModal(staffId = null) {
      const modal = document.getElementById("staffModal");
      const title = document.getElementById("staffModalTitle");
      const btnDelete = document.getElementById("btnDeleteStaff");
      const propSelect = document.getElementById("staffProperty");

      propSelect.innerHTML = properties.map(p => \`
        <option value="\${p.id}">\${escapeHtml(p.name)} (Allowance: \${p.monthly_leave_allowance} leaves/mo)</option>
      \`).join("");

      if (staffId) {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return;
        title.innerText = "Edit Staff Member";
        document.getElementById("staffId").value = staff.id;
        document.getElementById("staffName").value = staff.name;
        document.getElementById("staffProperty").value = staff.property_id;
        document.getElementById("staffRole").value = staff.role || "";
        document.getElementById("staffPhone").value = staff.phone || "";
        document.getElementById("staffCustomLeave").value = (staff.custom_leave_allowance !== null && staff.custom_leave_allowance !== undefined) ? staff.custom_leave_allowance : "";
        btnDelete.classList.remove("hidden");
      } else {
        title.innerText = "Add Staff Member";
        document.getElementById("staffId").value = "";
        document.getElementById("staffName").value = "";
        document.getElementById("staffProperty").value = activePropertyId !== 'all' ? activePropertyId : (properties[0] ? properties[0].id : "");
        document.getElementById("staffRole").value = "";
        document.getElementById("staffPhone").value = "";
        document.getElementById("staffCustomLeave").value = "";
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
      const role = document.getElementById("staffRole").value.trim() || null;
      const phone = document.getElementById("staffPhone").value.trim() || null;
      const customVal = document.getElementById("staffCustomLeave").value;
      const custom_leave_allowance = customVal !== "" ? parseFloat(customVal) : null;

      const payload = { property_id, name, role, phone, custom_leave_allowance };
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
        renderMonthlyView();
        if (currentView === "daily") renderDailyView();
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
        renderMonthlyView();
        if (currentView === "daily") renderDailyView();
        showToast("Staff member removed");
      } catch (err) {
        showToast("Error deleting staff: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // MODAL: LEAVE POLICY RULES
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
        renderMonthlyView();
        showToast("Leave policies saved successfully!");
      } catch (err) {
        showToast("Error updating allowances: " + err.message);
      }
    }

    // -------------------------------------------------------------------------
    // EXPORT TO CSV
    // -------------------------------------------------------------------------
    function exportToCSV() {
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

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = \`Staff_Attendance_\${MONTH_NAMES[currentMonth]}_\${currentYear}.csv\`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Attendance exported to CSV");
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

    // Run on start
    window.addEventListener("DOMContentLoaded", () => {
      document.getElementById("currentMonthLabel").innerText = \`\${MONTH_NAMES[currentMonth]} \${currentYear}\`;
      initAuth();
    });
  </script>
</body>
</html>`;
}
