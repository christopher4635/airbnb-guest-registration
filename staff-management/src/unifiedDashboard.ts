import type { Env } from "./types";

export interface UnifiedDayRecord {
	date: string;
	dayOfWeek: string;
	formattedDate: string;
	// Combined
	totalRevenue: number;
	totalExpenses: number;
	netProfit: number;
	profitMargin: number;
	// Staff Management
	staffRevenue: number;
	staffExpenses: number;
	staffProfit: number;
	staffLodging: number;
	staffFooding: number;
	staffServices: number;
	staffOther: number;
	staffExpenseNotes: string[];
	// Airbnb Host Portal
	airbnbRevenue: number;
	airbnbExpenses: number;
	airbnbProfit: number;
	airbnbBookingsCount: number;
	airbnbBookings: {
		id: string;
		property: string;
		guestName: string;
		platform: string;
		checkInDate: string;
		checkOutDate: string;
		nights: number;
		payout: number;
	}[];
	airbnbExpenseItems: {
		id: string;
		title: string;
		amount: number;
		category: string;
		property: string;
	}[];
}

export interface UnifiedWeekRecord {
	weekNumber: number;
	weekLabel: string;
	startDate: string;
	endDate: string;
	totalRevenue: number;
	totalExpenses: number;
	netProfit: number;
	profitMargin: number;
	staffRevenue: number;
	staffExpenses: number;
	airbnbRevenue: number;
	airbnbExpenses: number;
	daysCount: number;
}

export interface UnifiedMonthRecord {
	month: string;
	monthLabel: string;
	totalRevenue: number;
	totalExpenses: number;
	netProfit: number;
	profitMargin: number;
	staffRevenue: number;
	staffExpenses: number;
	airbnbRevenue: number;
	airbnbExpenses: number;
	daysCount: number;
}

export interface UnifiedDashboardData {
	success: boolean;
	generatedAt: string;
	selectedMonth: string;
	availableMonths: string[];
	currentDate: string;
	kpis: {
		today: {
			revenue: number;
			expenses: number;
			profit: number;
			margin: number;
			staffRev: number;
			airbnbRev: number;
			staffExp: number;
			airbnbExp: number;
		};
		thisWeek: {
			revenue: number;
			expenses: number;
			profit: number;
			margin: number;
			staffRev: number;
			airbnbRev: number;
			staffExp: number;
			airbnbExp: number;
		};
		selectedMonth: {
			revenue: number;
			expenses: number;
			profit: number;
			margin: number;
			staffRev: number;
			airbnbRev: number;
			staffExp: number;
			airbnbExp: number;
		};
		allTime: {
			revenue: number;
			expenses: number;
			profit: number;
			margin: number;
			staffRev: number;
			airbnbRev: number;
			staffExp: number;
			airbnbExp: number;
		};
	};
	daily: UnifiedDayRecord[];
	weekly: UnifiedWeekRecord[];
	monthly: UnifiedMonthRecord[];
	breakdowns: {
		revenueByCategory: {
			lodging: number;
			fooding: number;
			services: number;
			airbnbHomestays: number;
			other: number;
		};
		expensesByCategory: {
			staffHotel: number;
			airbnbSupplies: number;
			airbnbUtilities: number;
			airbnbMaintenance: number;
			airbnbCleaning: number;
			airbnbOther: number;
		};
		properties: {
			staffHotel: {
				name: string;
				revenue: number;
				expenses: number;
				profit: number;
				margin: number;
			};
			airbnbHost: {
				name: string;
				revenue: number;
				expenses: number;
				profit: number;
				margin: number;
				bookingsCount: number;
			};
		};
	};
	recentTransactions: {
		id: string;
		source: "Staff Management" | "Airbnb Host Portal";
		date: string;
		title: string;
		details?: string;
		amount: number;
		flow: "income" | "expense";
		property: string;
	}[];
	error?: string;
}

function getWeekNumber(dateStr: string): number {
	const d = new Date(dateStr + "T00:00:00Z");
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekDateRange(year: number, week: number): { startDate: string; endDate: string } {
	const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
	const dow = simple.getUTCDay();
	const ISOweekStart = simple;
	if (dow <= 4) {
		ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
	} else {
		ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
	}
	const ISOweekEnd = new Date(ISOweekStart);
	ISOweekEnd.setUTCDate(ISOweekEnd.getUTCDate() + 6);

	const fmt = (dt: Date) => dt.toISOString().split("T")[0];
	return {
		startDate: fmt(ISOweekStart),
		endDate: fmt(ISOweekEnd)
	};
}

export async function fetchUnifiedEarningsData(
	env: Env,
	requestedMonth?: string
): Promise<UnifiedDashboardData> {
	const now = new Date();
	const todayStr = now.toISOString().split("T")[0];
	const currentMonth = todayStr.slice(0, 7);
	const targetMonth = requestedMonth || currentMonth;

	const staffDb = env.DB;
	const airbnbDb = env.AIRBNB_DB;

	const staffMonthsRes = await staffDb
		.prepare("SELECT DISTINCT substr(date, 1, 7) as month FROM daily_finances ORDER BY month DESC")
		.all<{ month: string }>();
	const airbnbMonthsRes = airbnbDb
		? await airbnbDb
				.prepare("SELECT DISTINCT substr(check_in_date, 1, 7) as month FROM bookings WHERE check_in_date IS NOT NULL ORDER BY month DESC")
				.all<{ month: string }>()
		: { results: [] as { month: string }[] };

	const monthSet = new Set<string>();
	monthSet.add(currentMonth);
	if (staffMonthsRes.results) {
		for (const row of staffMonthsRes.results) {
			if (row.month && row.month.length === 7) monthSet.add(row.month);
		}
	}
	if (airbnbMonthsRes.results) {
		for (const row of airbnbMonthsRes.results) {
			if (row.month && row.month.length === 7) monthSet.add(row.month);
		}
	}
	const availableMonths = Array.from(monthSet).sort().reverse();

	const staffDailyRes = await staffDb
		.prepare(
			`SELECT * FROM daily_finances 
       WHERE date LIKE ? 
       ORDER BY date DESC`
		)
		.bind(`${targetMonth}%`)
		.all<any>();

	const staffAllDailyRes = await staffDb
		.prepare("SELECT * FROM daily_finances ORDER BY date DESC")
		.all<any>();

	const airbnbBookingsRes = airbnbDb
		? await airbnbDb
				.prepare(
					`SELECT * FROM bookings 
       WHERE (check_in_date LIKE ? OR check_out_date LIKE ?)
         AND status NOT IN ('Cancelled', 'Blocked')
       ORDER BY check_in_date DESC`
				)
				.bind(`${targetMonth}%`, `${targetMonth}%`)
				.all<any>()
		: { results: [] as any[] };

	const airbnbAllBookingsRes = airbnbDb
		? await airbnbDb
				.prepare(
					`SELECT * FROM bookings 
       WHERE status NOT IN ('Cancelled', 'Blocked')
       ORDER BY check_in_date DESC`
				)
				.all<any>()
		: { results: [] as any[] };

	const airbnbExpensesRes = airbnbDb
		? await airbnbDb
				.prepare(
					`SELECT * FROM expenses 
       WHERE date LIKE ? 
       ORDER BY date DESC`
				)
				.bind(`${targetMonth}%`)
				.all<any>()
		: { results: [] as any[] };

	const airbnbAllExpensesRes = airbnbDb
		? await airbnbDb.prepare("SELECT * FROM expenses ORDER BY date DESC").all<any>()
		: { results: [] as any[] };

	const [yearStr, monthNumStr] = targetMonth.split("-");
	const year = parseInt(yearStr, 10);
	const monthNum = parseInt(monthNumStr, 10);
	const daysInMonth = new Date(year, monthNum, 0).getDate();

	const dailyMap = new Map<string, UnifiedDayRecord>();

	for (let d = daysInMonth; d >= 1; d--) {
		const dayStr = d < 10 ? `0${d}` : `${d}`;
		const date = `${targetMonth}-${dayStr}`;
		const dtObj = new Date(`${date}T00:00:00Z`);
		const dayOfWeek = dtObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
		const formattedDate = dtObj.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC"
		});

		dailyMap.set(date, {
			date,
			dayOfWeek,
			formattedDate,
			totalRevenue: 0,
			totalExpenses: 0,
			netProfit: 0,
			profitMargin: 0,
			staffRevenue: 0,
			staffExpenses: 0,
			staffProfit: 0,
			staffLodging: 0,
			staffFooding: 0,
			staffServices: 0,
			staffOther: 0,
			staffExpenseNotes: [],
			airbnbRevenue: 0,
			airbnbExpenses: 0,
			airbnbProfit: 0,
			airbnbBookingsCount: 0,
			airbnbBookings: [],
			airbnbExpenseItems: []
		});
	}

	if (staffDailyRes.results) {
		for (const row of staffDailyRes.results) {
			const date = row.date;
			let rec = dailyMap.get(date);
			if (!rec) {
				const dtObj = new Date(`${date}T00:00:00Z`);
				rec = {
					date,
					dayOfWeek: dtObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
					formattedDate: dtObj.toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
						timeZone: "UTC"
					}),
					totalRevenue: 0,
					totalExpenses: 0,
					netProfit: 0,
					profitMargin: 0,
					staffRevenue: 0,
					staffExpenses: 0,
					staffProfit: 0,
					staffLodging: 0,
					staffFooding: 0,
					staffServices: 0,
					staffOther: 0,
					staffExpenseNotes: [],
					airbnbRevenue: 0,
					airbnbExpenses: 0,
					airbnbProfit: 0,
					airbnbBookingsCount: 0,
					airbnbBookings: [],
					airbnbExpenseItems: []
				};
				dailyMap.set(date, rec);
			}

			const lodging = Number(row.lodging_sales || 0);
			const fooding = Number(row.fooding_sales || 0);
			const services = Number(row.services_sales || 0);
			const other = Number(row.other_sales || 0);
			const staffRev = lodging + fooding + services + other;
			const staffExp = Number(row.expenses || 0);

			rec.staffLodging += lodging;
			rec.staffFooding += fooding;
			rec.staffServices += services;
			rec.staffOther += other;
			rec.staffRevenue += staffRev;
			rec.staffExpenses += staffExp;
			rec.staffProfit = rec.staffRevenue - rec.staffExpenses;

			if (row.expense_notes) {
				rec.staffExpenseNotes.push(row.expense_notes);
			}
		}
	}

	if (airbnbBookingsRes.results) {
		for (const row of airbnbBookingsRes.results) {
			const checkIn = row.check_in_date;
			if (!checkIn) continue;
			let rec = dailyMap.get(checkIn);
			if (!rec && checkIn.startsWith(targetMonth)) {
				const dtObj = new Date(`${checkIn}T00:00:00Z`);
				rec = {
					date: checkIn,
					dayOfWeek: dtObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
					formattedDate: dtObj.toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
						timeZone: "UTC"
					}),
					totalRevenue: 0,
					totalExpenses: 0,
					netProfit: 0,
					profitMargin: 0,
					staffRevenue: 0,
					staffExpenses: 0,
					staffProfit: 0,
					staffLodging: 0,
					staffFooding: 0,
					staffServices: 0,
					staffOther: 0,
					staffExpenseNotes: [],
					airbnbRevenue: 0,
					airbnbExpenses: 0,
					airbnbProfit: 0,
					airbnbBookingsCount: 0,
					airbnbBookings: [],
					airbnbExpenseItems: []
				};
				dailyMap.set(checkIn, rec);
			}

			if (rec) {
				const payout = Number(row.total_payout || 0);
				rec.airbnbRevenue += payout;
				rec.airbnbBookingsCount += 1;
				rec.airbnbProfit = rec.airbnbRevenue - rec.airbnbExpenses;
				rec.airbnbBookings.push({
					id: row.id || "",
					property: row.property || "Airbnb Property",
					guestName: row.guest_name || "Guest",
					platform: row.platform || "Airbnb",
					checkInDate: row.check_in_date,
					checkOutDate: row.check_out_date,
					nights: Number(row.nights || 1),
					payout
				});
			}
		}
	}

	if (airbnbExpensesRes.results) {
		for (const row of airbnbExpensesRes.results) {
			const date = row.date;
			if (!date) continue;
			let rec = dailyMap.get(date);
			if (!rec && date.startsWith(targetMonth)) {
				const dtObj = new Date(`${date}T00:00:00Z`);
				rec = {
					date,
					dayOfWeek: dtObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
					formattedDate: dtObj.toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
						timeZone: "UTC"
					}),
					totalRevenue: 0,
					totalExpenses: 0,
					netProfit: 0,
					profitMargin: 0,
					staffRevenue: 0,
					staffExpenses: 0,
					staffProfit: 0,
					staffLodging: 0,
					staffFooding: 0,
					staffServices: 0,
					staffOther: 0,
					staffExpenseNotes: [],
					airbnbRevenue: 0,
					airbnbExpenses: 0,
					airbnbProfit: 0,
					airbnbBookingsCount: 0,
					airbnbBookings: [],
					airbnbExpenseItems: []
				};
				dailyMap.set(date, rec);
			}

			if (rec) {
				const amount = Number(row.amount || 0);
				rec.airbnbExpenses += amount;
				rec.airbnbProfit = rec.airbnbRevenue - rec.airbnbExpenses;
				rec.airbnbExpenseItems.push({
					id: row.id || "",
					title: row.title || "Expense",
					amount,
					category: row.category || "General",
					property: row.property || "Airbnb Property"
				});
			}
		}
	}

	for (const rec of dailyMap.values()) {
		rec.totalRevenue = rec.staffRevenue + rec.airbnbRevenue;
		rec.totalExpenses = rec.staffExpenses + rec.airbnbExpenses;
		rec.netProfit = rec.totalRevenue - rec.totalExpenses;
		rec.profitMargin =
			rec.totalRevenue > 0 ? Math.round((rec.netProfit / rec.totalRevenue) * 100) : 0;
	}

	const dailyRecords = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

	const weeklyMap = new Map<number, UnifiedWeekRecord>();
	for (const rec of dailyRecords) {
		const weekNum = getWeekNumber(rec.date);
		let wRec = weeklyMap.get(weekNum);
		if (!wRec) {
			const range = getWeekDateRange(year, weekNum);
			wRec = {
				weekNumber: weekNum,
				weekLabel: `Week ${weekNum}`,
				startDate: range.startDate,
				endDate: range.endDate,
				totalRevenue: 0,
				totalExpenses: 0,
				netProfit: 0,
				profitMargin: 0,
				staffRevenue: 0,
				staffExpenses: 0,
				airbnbRevenue: 0,
				airbnbExpenses: 0,
				daysCount: 0
			};
			weeklyMap.set(weekNum, wRec);
		}

		wRec.staffRevenue += rec.staffRevenue;
		wRec.staffExpenses += rec.staffExpenses;
		wRec.airbnbRevenue += rec.airbnbRevenue;
		wRec.airbnbExpenses += rec.airbnbExpenses;
		wRec.totalRevenue += rec.totalRevenue;
		wRec.totalExpenses += rec.totalExpenses;
		wRec.daysCount += 1;
	}

	for (const wRec of weeklyMap.values()) {
		wRec.netProfit = wRec.totalRevenue - wRec.totalExpenses;
		wRec.profitMargin =
			wRec.totalRevenue > 0 ? Math.round((wRec.netProfit / wRec.totalRevenue) * 100) : 0;
	}

	const weeklyRecords = Array.from(weeklyMap.values()).sort(
		(a, b) => b.weekNumber - a.weekNumber
	);

	const monthlyMap = new Map<string, UnifiedMonthRecord>();

	if (staffAllDailyRes.results) {
		for (const row of staffAllDailyRes.results) {
			const m = row.date ? row.date.slice(0, 7) : null;
			if (!m || m.length !== 7) continue;
			let mRec = monthlyMap.get(m);
			if (!mRec) {
				const [y, mm] = m.split("-");
				const dt = new Date(parseInt(y, 10), parseInt(mm, 10) - 1, 1);
				mRec = {
					month: m,
					monthLabel: dt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
					totalRevenue: 0,
					totalExpenses: 0,
					netProfit: 0,
					profitMargin: 0,
					staffRevenue: 0,
					staffExpenses: 0,
					airbnbRevenue: 0,
					airbnbExpenses: 0,
					daysCount: 0
				};
				monthlyMap.set(m, mRec);
			}

			const lodging = Number(row.lodging_sales || 0);
			const fooding = Number(row.fooding_sales || 0);
			const services = Number(row.services_sales || 0);
			const other = Number(row.other_sales || 0);
			const rev = lodging + fooding + services + other;
			const exp = Number(row.expenses || 0);

			mRec.staffRevenue += rev;
			mRec.staffExpenses += exp;
			mRec.daysCount += 1;
		}
	}

	if (airbnbAllBookingsRes.results) {
		for (const row of airbnbAllBookingsRes.results) {
			const m = row.check_in_date ? row.check_in_date.slice(0, 7) : null;
			if (!m || m.length !== 7) continue;
			let mRec = monthlyMap.get(m);
			if (!mRec) {
				const [y, mm] = m.split("-");
				const dt = new Date(parseInt(y, 10), parseInt(mm, 10) - 1, 1);
				mRec = {
					month: m,
					monthLabel: dt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
					totalRevenue: 0,
					totalExpenses: 0,
					netProfit: 0,
					profitMargin: 0,
					staffRevenue: 0,
					staffExpenses: 0,
					airbnbRevenue: 0,
					airbnbExpenses: 0,
					daysCount: 0
				};
				monthlyMap.set(m, mRec);
			}

			const payout = Number(row.total_payout || 0);
			mRec.airbnbRevenue += payout;
		}
	}

	if (airbnbAllExpensesRes.results) {
		for (const row of airbnbAllExpensesRes.results) {
			const m = row.date ? row.date.slice(0, 7) : null;
			if (!m || m.length !== 7) continue;
			let mRec = monthlyMap.get(m);
			if (!mRec) {
				const [y, mm] = m.split("-");
				const dt = new Date(parseInt(y, 10), parseInt(mm, 10) - 1, 1);
				mRec = {
					month: m,
					monthLabel: dt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
					totalRevenue: 0,
					totalExpenses: 0,
					netProfit: 0,
					profitMargin: 0,
					staffRevenue: 0,
					staffExpenses: 0,
					airbnbRevenue: 0,
					airbnbExpenses: 0,
					daysCount: 0
				};
				monthlyMap.set(m, mRec);
			}

			const amt = Number(row.amount || 0);
			mRec.airbnbExpenses += amt;
		}
	}

	for (const mRec of monthlyMap.values()) {
		mRec.totalRevenue = mRec.staffRevenue + mRec.airbnbRevenue;
		mRec.totalExpenses = mRec.staffExpenses + mRec.airbnbExpenses;
		mRec.netProfit = mRec.totalRevenue - mRec.totalExpenses;
		mRec.profitMargin =
			mRec.totalRevenue > 0 ? Math.round((mRec.netProfit / mRec.totalRevenue) * 100) : 0;
	}

	const monthlyRecords = Array.from(monthlyMap.values()).sort((a, b) =>
		b.month.localeCompare(a.month)
	);

	const todayRecord = dailyRecords.find((r) => r.date === todayStr);
	const todayKPI = {
		revenue: todayRecord ? todayRecord.totalRevenue : 0,
		expenses: todayRecord ? todayRecord.totalExpenses : 0,
		profit: todayRecord ? todayRecord.netProfit : 0,
		margin: todayRecord ? todayRecord.profitMargin : 0,
		staffRev: todayRecord ? todayRecord.staffRevenue : 0,
		airbnbRev: todayRecord ? todayRecord.airbnbRevenue : 0,
		staffExp: todayRecord ? todayRecord.staffExpenses : 0,
		airbnbExp: todayRecord ? todayRecord.airbnbExpenses : 0
	};

	const currentWeekNum = getWeekNumber(todayStr);
	const thisWeekRecord =
		weeklyRecords.find((w) => w.weekNumber === currentWeekNum) ||
		weeklyRecords.find((w) => todayStr >= w.startDate && todayStr <= w.endDate) ||
		weeklyRecords[0];

	const thisWeekKPI = {
		revenue: thisWeekRecord ? thisWeekRecord.totalRevenue : 0,
		expenses: thisWeekRecord ? thisWeekRecord.totalExpenses : 0,
		profit: thisWeekRecord ? thisWeekRecord.netProfit : 0,
		margin: thisWeekRecord ? thisWeekRecord.profitMargin : 0,
		staffRev: thisWeekRecord ? thisWeekRecord.staffRevenue : 0,
		airbnbRev: thisWeekRecord ? thisWeekRecord.airbnbRevenue : 0,
		staffExp: thisWeekRecord ? thisWeekRecord.staffExpenses : 0,
		airbnbExp: thisWeekRecord ? thisWeekRecord.airbnbExpenses : 0
	};

	const selectedMonthRecord = monthlyRecords.find((m) => m.month === targetMonth);
	let selMonthRev = 0;
	let selMonthExp = 0;
	let selStaffRev = 0;
	let selAirbnbRev = 0;
	let selStaffExp = 0;
	let selAirbnbExp = 0;

	for (const r of dailyRecords) {
		selStaffRev += r.staffRevenue;
		selAirbnbRev += r.airbnbRevenue;
		selStaffExp += r.staffExpenses;
		selAirbnbExp += r.airbnbExpenses;
		selMonthRev += r.totalRevenue;
		selMonthExp += r.totalExpenses;
	}

	const selMonthProfit = selMonthRev - selMonthExp;
	const selectedMonthKPI = {
		revenue: selMonthRev,
		expenses: selMonthExp,
		profit: selMonthProfit,
		margin: selMonthRev > 0 ? Math.round((selMonthProfit / selMonthRev) * 100) : 0,
		staffRev: selStaffRev,
		airbnbRev: selAirbnbRev,
		staffExp: selStaffExp,
		airbnbExp: selAirbnbExp
	};

	let allTimeRev = 0;
	let allTimeExp = 0;
	let allStaffRev = 0;
	let allAirbnbRev = 0;
	let allStaffExp = 0;
	let allAirbnbExp = 0;

	for (const m of monthlyRecords) {
		allTimeRev += m.totalRevenue;
		allTimeExp += m.totalExpenses;
		allStaffRev += m.staffRevenue;
		allAirbnbRev += m.airbnbRevenue;
		allStaffExp += m.staffExpenses;
		allAirbnbExp += m.airbnbExpenses;
	}
	const allTimeProfit = allTimeRev - allTimeExp;
	const allTimeKPI = {
		revenue: allTimeRev,
		expenses: allTimeExp,
		profit: allTimeProfit,
		margin: allTimeRev > 0 ? Math.round((allTimeProfit / allTimeRev) * 100) : 0,
		staffRev: allStaffRev,
		airbnbRev: allAirbnbRev,
		staffExp: allStaffExp,
		airbnbExp: allAirbnbExp
	};

	let catLodging = 0;
	let catFooding = 0;
	let catServices = 0;
	let catOther = 0;
	let catAirbnbHomestays = 0;
	let catStaffHotelExp = selStaffExp;

	let catAirbnbSupplies = 0;
	let catAirbnbUtilities = 0;
	let catAirbnbMaint = 0;
	let catAirbnbClean = 0;
	let catAirbnbOtherExp = 0;

	for (const r of dailyRecords) {
		catLodging += r.staffLodging;
		catFooding += r.staffFooding;
		catServices += r.staffServices;
		catOther += r.staffOther;
		catAirbnbHomestays += r.airbnbRevenue;

		for (const e of r.airbnbExpenseItems) {
			const c = (e.category || "").toLowerCase();
			if (c.includes("suppl") || c.includes("inventory")) catAirbnbSupplies += e.amount;
			else if (c.includes("util") || c.includes("bill") || c.includes("wifi") || c.includes("power"))
				catAirbnbUtilities += e.amount;
			else if (c.includes("maint") || c.includes("repair")) catAirbnbMaint += e.amount;
			else if (c.includes("clean") || c.includes("laundry")) catAirbnbClean += e.amount;
			else catAirbnbOtherExp += e.amount;
		}
	}

	const recentTx: UnifiedDashboardData["recentTransactions"] = [];

	if (airbnbBookingsRes.results) {
		for (const b of airbnbBookingsRes.results.slice(0, 20)) {
			if (b.check_in_date && b.total_payout) {
				recentTx.push({
					id: `ab-b-${b.id}`,
					source: "Airbnb Host Portal",
					date: b.check_in_date,
					title: `${b.guest_name || "Guest"} Check-in (${b.nights || 1} nights)`,
					details: `${b.property || "Airbnb"} &bull; ${b.platform || "Direct"}`,
					amount: Number(b.total_payout),
					flow: "income",
					property: b.property || "Airbnb Property"
				});
			}
		}
	}

	if (airbnbExpensesRes.results) {
		for (const e of airbnbExpensesRes.results.slice(0, 15)) {
			if (e.date && e.amount) {
				recentTx.push({
					id: `ab-e-${e.id}`,
					source: "Airbnb Host Portal",
					date: e.date,
					title: e.title || "Expense",
					details: `${e.category || "General"} &bull; ${e.property || "Property"}`,
					amount: Number(e.amount),
					flow: "expense",
					property: e.property || "Airbnb Property"
				});
			}
		}
	}

	if (staffDailyRes.results) {
		for (const s of staffDailyRes.results.slice(0, 15)) {
			const sRev =
				Number(s.lodging_sales || 0) +
				Number(s.fooding_sales || 0) +
				Number(s.services_sales || 0) +
				Number(s.other_sales || 0);
			if (sRev > 0) {
				recentTx.push({
					id: `st-r-${s.id || s.date}`,
					source: "Staff Management",
					date: s.date,
					title: "Daily Operations Revenue",
					details: `Hotel Lodging: ₹${s.lodging_sales || 0}, Food: ₹${s.fooding_sales || 0}`,
					amount: sRev,
					flow: "income",
					property: s.property_id || "Hotel"
				});
			}
			if (Number(s.expenses || 0) > 0) {
				recentTx.push({
					id: `st-e-${s.id || s.date}`,
					source: "Staff Management",
					date: s.date,
					title: "Operational Daily Expenses",
					details: s.expense_notes || "Daily running expense",
					amount: Number(s.expenses),
					flow: "expense",
					property: s.property_id || "Hotel"
				});
			}
		}
	}

	recentTx.sort((a, b) => b.date.localeCompare(a.date));

	return {
		success: true,
		generatedAt: new Date().toISOString(),
		selectedMonth: targetMonth,
		availableMonths,
		currentDate: todayStr,
		kpis: {
			today: todayKPI,
			thisWeek: thisWeekKPI,
			selectedMonth: selectedMonthKPI,
			allTime: allTimeKPI
		},
		daily: dailyRecords,
		weekly: weeklyRecords,
		monthly: monthlyRecords,
		breakdowns: {
			revenueByCategory: {
				lodging: catLodging,
				fooding: catFooding,
				services: catServices,
				airbnbHomestays: catAirbnbHomestays,
				other: catOther
			},
			expensesByCategory: {
				staffHotel: catStaffHotelExp,
				airbnbSupplies: catAirbnbSupplies,
				airbnbUtilities: catAirbnbUtilities,
				airbnbMaintenance: catAirbnbMaint,
				airbnbCleaning: catAirbnbClean,
				airbnbOther: catAirbnbOtherExp
			},
			properties: {
				staffHotel: {
					name: "Staff Management (Hotel Operations)",
					revenue: selStaffRev,
					expenses: selStaffExp,
					profit: selStaffRev - selStaffExp,
					margin:
						selStaffRev > 0 ? Math.round(((selStaffRev - selStaffExp) / selStaffRev) * 100) : 0
				},
				airbnbHost: {
					name: "Airbnb Host Portal (Short-term Homestays)",
					revenue: selAirbnbRev,
					expenses: selAirbnbExp,
					profit: selAirbnbRev - selAirbnbExp,
					margin:
						selAirbnbRev > 0
							? Math.round(((selAirbnbRev - selAirbnbExp) / selAirbnbRev) * 100)
							: 0,
					bookingsCount: airbnbBookingsRes.results ? airbnbBookingsRes.results.length : 0
				}
			}
		},
		recentTransactions: recentTx.slice(0, 30)
	};
}

export function getUnifiedDashboardHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Portfolio Financial Overview | Elite Homes & Hospitality</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
      font-feature-settings: "tnum" 1, "zero" 1;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @media print {
      body { background: white !important; color: black !important; }
      .no-print { display: none !important; }
      .print-expand { display: block !important; }
    }
  </style>
</head>
<body class="bg-[#090A0F] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-zinc-700 selection:text-white">

  <!-- Executive Top Bar -->
  <header class="sticky top-0 z-40 bg-[#090A0F]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-8 py-3.5">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
      
      <!-- Monogram & Title -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-200 shadow-inner shrink-0">
            <i data-lucide="building-2" class="w-4 h-4 text-zinc-300"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">Elite Homes & Hospitality</span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.08]">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                D1 Edge Active
              </span>
            </div>
            <h1 class="text-base sm:text-lg font-semibold tracking-tight text-white mt-0.5">
              Portfolio Earnings & Performance
            </h1>
          </div>
        </div>

        <!-- Mobile Sync Button -->
        <div class="flex md:hidden items-center gap-1.5">
          <button onclick="refreshData()" class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 transition" title="Refresh Data">
            <i data-lucide="refresh-cw" id="mobileRefreshIcon" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Action & Cross-Portal Links -->
      <div class="flex items-center flex-wrap gap-2 justify-between md:justify-end">
        
        <!-- Portal Quick Links -->
        <div class="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-white/[0.08]">
          <a href="/" target="_blank" class="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.05] transition flex items-center gap-1.5" title="Staff Management">
            <i data-lucide="hotel" class="w-3.5 h-3.5 text-zinc-400"></i>
            <span>Staff Sync</span>
          </a>
          <a href="https://airbnb-management.elitehomes-portal.workers.dev/admin.html" target="_blank" class="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.05] transition flex items-center gap-1.5" title="Airbnb Host Portal">
            <i data-lucide="home" class="w-3.5 h-3.5 text-zinc-400"></i>
            <span>Airbnb Portal</span>
          </a>
        </div>

        <!-- Refresh Button -->
        <button onclick="refreshData()" class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-white/10 flex items-center gap-1.5 transition">
          <i data-lucide="refresh-cw" id="desktopRefreshIcon" class="w-3.5 h-3.5 text-zinc-400"></i>
          <span class="hidden sm:inline">Live Refresh</span>
        </button>

        <!-- Print / PDF -->
        <button onclick="window.print()" class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-white/10 flex items-center gap-1.5 transition no-print" title="Export / Print">
          <i data-lucide="printer" class="w-3.5 h-3.5 text-zinc-400"></i>
          <span class="hidden sm:inline">Export</span>
        </button>

      </div>
    </div>
  </header>

  <!-- Filter & Granularity Control Bar -->
  <section class="bg-[#090A0F] border-b border-white/[0.06] px-4 sm:px-8 py-3">
    <div class="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      
      <!-- Scope Selector -->
      <div class="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-white/[0.08] overflow-x-auto no-scrollbar">
        <button id="scopeAll" onclick="setPropertyScope('all')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap bg-zinc-800 text-white shadow-xs border border-white/10">
          <i data-lucide="layers" class="w-3.5 h-3.5"></i>
          <span>Consolidated Portfolio</span>
        </button>
        <button id="scopeStaff" onclick="setPropertyScope('staff')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap text-zinc-400 hover:text-zinc-200">
          <i data-lucide="hotel" class="w-3.5 h-3.5"></i>
          <span>Staff Management (Hotel)</span>
        </button>
        <button id="scopeAirbnb" onclick="setPropertyScope('airbnb')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap text-zinc-400 hover:text-zinc-200">
          <i data-lucide="home" class="w-3.5 h-3.5"></i>
          <span>Airbnb Host Portal</span>
        </button>
      </div>

      <!-- Time Granularity Tabs & Month Navigator -->
      <div class="flex items-center flex-wrap gap-2 justify-between lg:justify-end">
        
        <!-- View Tabs -->
        <div class="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-white/[0.08]">
          <button id="tabDaily" onclick="setTimeView('daily')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-zinc-800 text-white shadow-xs border border-white/10">
            <i data-lucide="calendar-days" class="w-3.5 h-3.5"></i>
            <span>Daily</span>
          </button>
          <button id="tabWeekly" onclick="setTimeView('weekly')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200">
            <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>
            <span>Weekly</span>
          </button>
          <button id="tabMonthly" onclick="setTimeView('monthly')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200">
            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
            <span>Monthly</span>
          </button>
        </div>

        <!-- Month Dropdown -->
        <div class="flex items-center gap-1.5">
          <div class="flex items-center bg-zinc-900 rounded-xl px-2.5 py-1.5 border border-white/[0.08]">
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-zinc-400 mr-2"></i>
            <select id="monthSelect" onchange="onMonthSelectChange(this.value)" class="bg-transparent text-xs font-medium text-zinc-200 outline-none cursor-pointer">
              <!-- Rendered via JS -->
            </select>
          </div>
          <button onclick="goToCurrentMonth()" class="text-xs font-medium px-3 py-1.5 rounded-xl text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] transition">
            Current
          </button>
        </div>

      </div>

    </div>
  </section>

  <!-- Main Dashboard Content -->
  <main class="max-w-7xl w-full mx-auto px-4 sm:px-8 py-7 flex-1 flex flex-col gap-6">

    <!-- KPI Summary Overview Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- 1. Total Revenue Card -->
      <div class="bg-[#11141C] rounded-2xl p-5 border border-white/[0.07] flex flex-col justify-between hover:border-white/[0.12] transition">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              Gross Revenue
            </span>
            <span id="kpiRevPeriodBadge" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              This Month
            </span>
          </div>
          <div class="flex items-baseline gap-1.5 my-2">
            <span class="text-xs text-zinc-400 font-medium">₹</span>
            <span id="kpiTotalRevenue" class="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-mono">0</span>
          </div>
        </div>
        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <span class="flex items-center gap-1.5 truncate">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
            Hotel: <span id="kpiStaffRev" class="font-medium text-zinc-200 font-mono">₹0</span>
          </span>
          <span class="flex items-center gap-1.5 truncate">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
            Airbnb: <span id="kpiAirbnbRev" class="font-medium text-zinc-200 font-mono">₹0</span>
          </span>
        </div>
      </div>

      <!-- 2. Total Expenses Card -->
      <div class="bg-[#11141C] rounded-2xl p-5 border border-white/[0.07] flex flex-col justify-between hover:border-white/[0.12] transition">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              Operating Expenses
            </span>
            <span id="kpiExpPeriodBadge" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              This Month
            </span>
          </div>
          <div class="flex items-baseline gap-1.5 my-2">
            <span class="text-xs text-zinc-400 font-medium">₹</span>
            <span id="kpiTotalExpenses" class="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-200 font-mono">0</span>
          </div>
        </div>
        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <span class="flex items-center gap-1.5 truncate">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
            Hotel: <span id="kpiStaffExp" class="font-medium text-zinc-200 font-mono">₹0</span>
          </span>
          <span class="flex items-center gap-1.5 truncate">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
            Airbnb: <span id="kpiAirbnbExp" class="font-medium text-zinc-200 font-mono">₹0</span>
          </span>
        </div>
      </div>

      <!-- 3. Net Profit Card -->
      <div class="bg-[#11141C] rounded-2xl p-5 border border-white/[0.07] flex flex-col justify-between hover:border-white/[0.12] transition">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              Net Operating Profit
            </span>
            <span id="kpiProfitBadge" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Net Earning
            </span>
          </div>
          <div class="flex items-baseline gap-1.5 my-2">
            <span class="text-xs text-emerald-400/80 font-medium">₹</span>
            <span id="kpiNetProfit" class="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-400 font-mono">0</span>
          </div>
        </div>
        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <span>Operating Margin</span>
          <span id="kpiProfitMargin" class="font-medium text-emerald-400 font-mono">0%</span>
        </div>
      </div>

      <!-- 4. Today's Run Rate -->
      <div class="bg-[#11141C] rounded-2xl p-5 border border-white/[0.07] flex flex-col justify-between hover:border-white/[0.12] transition">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              Today's Performance
            </span>
            <span id="todayDateLabel" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              Today
            </span>
          </div>
          <div class="flex items-baseline gap-1.5 my-2">
            <span class="text-xs text-zinc-400 font-medium">₹</span>
            <span id="kpiTodayRevenue" class="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-mono">0</span>
          </div>
        </div>
        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <span>Today's Profit</span>
          <span id="kpiTodayProfit" class="font-medium text-emerald-400 font-mono">₹0</span>
        </div>
      </div>

    </section>

    <!-- Visual Performance Chart & Composition -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Performance Trajectory Chart -->
      <div class="lg:col-span-2 bg-[#11141C] rounded-2xl p-6 border border-white/[0.07] flex flex-col justify-between">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="chartTitle" class="text-sm font-semibold text-white flex items-center gap-2">
              Financial Performance
            </h2>
            <p id="chartSubtitle" class="text-xs text-zinc-400 mt-0.5">Chronological revenue, expenses, and net profit</p>
          </div>
          <div class="flex items-center gap-4 text-xs text-zinc-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-xs bg-zinc-300"></span> Revenue
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-xs bg-zinc-600"></span> Expenses
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> Net Profit
            </span>
          </div>
        </div>

        <!-- Chart Container -->
        <div id="chartContainer" class="w-full h-60 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 overflow-x-auto no-scrollbar border-b border-white/[0.06]">
          <!-- Rendered dynamically via JS -->
        </div>

        <div id="chartAxisLabels" class="flex justify-between items-center text-[10px] text-zinc-400 pt-3">
          <span>Oldest</span>
          <span id="chartRangeLabel" class="font-mono text-zinc-400">--</span>
          <span>Latest</span>
        </div>
      </div>

      <!-- Entity Mix & Categorical Composition -->
      <div class="bg-[#11141C] rounded-2xl p-6 border border-white/[0.07] flex flex-col justify-between">
        <div>
          <h2 class="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            Revenue Contribution
          </h2>
          <p class="text-xs text-zinc-400 mb-5">Portfolio split between hotel & homestays</p>

          <!-- Split Progress Bar -->
          <div class="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex mb-4">
            <div id="barStaffShare" class="h-full bg-zinc-300 transition-all duration-500" style="width: 50%" title="Staff Management"></div>
            <div id="barAirbnbShare" class="h-full bg-zinc-600 transition-all duration-500" style="width: 50%" title="Airbnb Host Portal"></div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="p-3.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
              <div class="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span> Hotel Sync
              </div>
              <div id="pctStaffShare" class="text-lg font-semibold text-white font-mono">50%</div>
              <div id="valStaffShare" class="text-xs text-zinc-400 font-mono mt-0.5">₹0</div>
            </div>
            <div class="p-3.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
              <div class="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Airbnb Portal
              </div>
              <div id="pctAirbnbShare" class="text-lg font-semibold text-white font-mono">50%</div>
              <div id="valAirbnbShare" class="text-xs text-zinc-400 font-mono mt-0.5">₹0</div>
            </div>
          </div>

          <!-- Category Breakdown List -->
          <h3 class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Category Highlights</h3>
          <div id="categoryBreakdownList" class="flex flex-col gap-1.5 text-xs">
            <!-- Rendered by JS -->
          </div>
        </div>

        <div class="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <span>Profitability Status</span>
          <span id="healthBadge" class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Healthy
          </span>
        </div>
      </div>

    </section>

    <!-- Main Data Table: Daily / Weekly / Monthly View -->
    <section class="bg-[#11141C] rounded-2xl border border-white/[0.07] overflow-hidden">
      
      <!-- Table Header Bar -->
      <div class="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="tableSectionTitle" class="text-sm font-semibold text-white flex items-center gap-2">
            Consolidated Financial Ledger
          </h2>
          <p id="tableSectionSubtitle" class="text-xs text-zinc-400 mt-0.5">Click any row to view itemized room nights, guest records, and expense items</p>
        </div>

        <!-- Search / Filter Input -->
        <div class="flex items-center gap-2">
          <div class="relative">
            <i data-lucide="search" class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="tableFilterInput" onkeyup="filterTable(this.value)" placeholder="Filter by date or note..." class="bg-[#0D1017] border border-white/[0.08] text-xs rounded-xl pl-8 pr-3 py-1.5 text-zinc-200 placeholder-zinc-500 outline-none focus:border-white/20 transition w-44 sm:w-60">
          </div>
        </div>
      </div>

      <!-- Responsive Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-zinc-300">
          <thead class="bg-[#0D1017] text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-white/[0.06] select-none">
            <tr>
              <th class="py-3 px-4">Period / Date</th>
              <th class="py-3 px-4 text-right">Hotel Rev</th>
              <th class="py-3 px-4 text-right">Airbnb Rev</th>
              <th class="py-3 px-4 text-right font-medium text-white">Gross Revenue</th>
              <th class="py-3 px-4 text-right">Operating Exp</th>
              <th class="py-3 px-4 text-right font-medium text-emerald-400">Net Profit</th>
              <th class="py-3 px-4 text-center">Margin</th>
              <th class="py-3 px-3 text-center no-print"></th>
            </tr>
          </thead>
          <tbody id="earningsTableBody" class="divide-y divide-white/[0.04] font-mono">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div id="tableEmptyState" class="hidden p-10 text-center text-zinc-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        <p class="font-medium text-sm text-zinc-300">No records found for this period</p>
        <p class="text-xs text-zinc-400 mt-1">Try selecting another month or clearing search filters.</p>
      </div>

    </section>

    <!-- Recent Activity Stream -->
    <section class="bg-[#11141C] rounded-2xl p-6 border border-white/[0.07]">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-semibold text-white flex items-center gap-2">
            Recent Activity Stream
          </h2>
          <p class="text-xs text-zinc-400">Latest guest bookings, room payouts, and operating expenses across Cloudflare D1</p>
        </div>
      </div>

      <div id="recentTxList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Rendered by JS -->
      </div>
    </section>

  </main>

  <!-- Clean Institutional Footer -->
  <footer class="mt-auto border-t border-white/[0.06] bg-[#090A0F] py-4 px-4 sm:px-8 text-center text-xs text-zinc-400">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>Elite Homes & Hospitality &bull; Cloudflare D1 Edge Infrastructure</p>
      <p class="font-mono text-[11px] text-zinc-400" id="lastUpdatedLabel">Connected to Cloudflare D1</p>
    </div>
  </footer>

  <!-- Detail Modal -->
  <div id="detailModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 hidden">
    <div class="bg-[#0D1017] rounded-2xl border border-white/[0.1] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <div class="p-5 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 id="modalTitle" class="text-base font-semibold text-white">Period Breakdown</h3>
          <p id="modalSubtitle" class="text-xs text-zinc-400 mt-0.5">Itemized line items</p>
        </div>
        <button onclick="closeModal()" class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
      <div id="modalContent" class="p-5 overflow-y-auto space-y-4 text-xs text-zinc-300">
        <!-- Rendered by JS -->
      </div>
      <div class="p-4 border-t border-white/[0.06] flex justify-end">
        <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition">
          Dismiss
        </button>
      </div>
    </div>
  </div>

  <!-- Dashboard JavaScript Logic -->
  <script>
    let rawPayload = null;
    let activeTimeView = 'daily'; // 'daily' | 'weekly' | 'monthly'
    let activePropertyScope = 'all'; // 'all' | 'staff' | 'airbnb'
    let activeMonth = '';

    function formatINR(num) {
      if (num === null || num === undefined || isNaN(num)) return '0';
      return Math.round(num).toLocaleString('en-IN');
    }

    async function loadData(monthParam) {
      setLoading(true);
      try {
        let url = '/api/dashboard/earnings';
        if (monthParam) {
          url += '?month=' + encodeURIComponent(monthParam);
        }
        
        let res = await fetch(url);
        if (!res.ok) {
          const fallbackUrl = 'https://staff-management.elitehomes-portal.workers.dev/api/dashboard/earnings' + (monthParam ? '?month=' + encodeURIComponent(monthParam) : '');
          res = await fetch(fallbackUrl);
        }

        if (!res.ok) {
          throw new Error('Failed to fetch data: HTTP ' + res.status);
        }

        rawPayload = await res.json();
        if (rawPayload && rawPayload.success) {
          activeMonth = rawPayload.selectedMonth;
          renderAll();
        } else {
          alert('Error loading dashboard: ' + (rawPayload.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Could not connect to Cloudflare D1. Please check connection.');
      } finally {
        setLoading(false);
      }
    }

    function setLoading(isLoading) {
      const dIcon = document.getElementById('desktopRefreshIcon');
      const mIcon = document.getElementById('mobileRefreshIcon');
      if (isLoading) {
        if (dIcon) dIcon.classList.add('animate-spin');
        if (mIcon) mIcon.classList.add('animate-spin');
      } else {
        if (dIcon) dIcon.classList.remove('animate-spin');
        if (mIcon) mIcon.classList.remove('animate-spin');
      }
    }

    function renderAll() {
      if (!rawPayload) return;
      renderMonthDropdown();
      renderKPIs();
      renderChart();
      renderComposition();
      renderTable();
      renderRecentTransactions();
      const updatedEl = document.getElementById('lastUpdatedLabel');
      if (updatedEl) {
        updatedEl.innerText = 'Synchronized at ' + new Date().toLocaleTimeString() + ' (Cloudflare Edge D1)';
      }
      lucide.createIcons();
    }

    function renderMonthDropdown() {
      const select = document.getElementById('monthSelect');
      if (!select) return;
      const months = rawPayload.availableMonths || [rawPayload.selectedMonth];
      select.innerHTML = months.map(m => {
        const [y, mm] = m.split('-');
        const date = new Date(parseInt(y, 10), parseInt(mm, 10) - 1, 1);
        const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return \`<option value="\${m}" \${m === activeMonth ? 'selected' : ''}>\${label}</option>\`;
      }).join('');
    }

    function onMonthSelectChange(newMonth) {
      activeMonth = newMonth;
      loadData(newMonth);
    }

    function goToCurrentMonth() {
      if (rawPayload && rawPayload.currentDate) {
        const curM = rawPayload.currentDate.slice(0, 7);
        activeMonth = curM;
        loadData(curM);
      }
    }

    function refreshData() {
      loadData(activeMonth);
    }

    function setPropertyScope(scope) {
      activePropertyScope = scope;
      ['scopeAll', 'scopeStaff', 'scopeAirbnb'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap text-zinc-400 hover:text-zinc-200';
      });

      const activeBtnId = scope === 'all' ? 'scopeAll' : (scope === 'staff' ? 'scopeStaff' : 'scopeAirbnb');
      const activeBtn = document.getElementById(activeBtnId);
      if (activeBtn) {
        activeBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap bg-zinc-800 text-white shadow-xs border border-white/10';
      }

      renderKPIs();
      renderChart();
      renderTable();
      lucide.createIcons();
    }

    function setTimeView(view) {
      activeTimeView = view;
      ['tabDaily', 'tabWeekly', 'tabMonthly'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200';
      });

      const activeTabId = view === 'daily' ? 'tabDaily' : (view === 'weekly' ? 'tabWeekly' : 'tabMonthly');
      const activeTab = document.getElementById(activeTabId);
      if (activeTab) {
        activeTab.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-zinc-800 text-white shadow-xs border border-white/10';
      }

      renderChart();
      renderTable();
      lucide.createIcons();
    }

    function renderKPIs() {
      if (!rawPayload) return;
      const kpis = rawPayload.kpis;
      const monthData = kpis.selectedMonth || { revenue: 0, expenses: 0, profit: 0, margin: 0, staffRev: 0, airbnbRev: 0, staffExp: 0, airbnbExp: 0 };
      const todayData = kpis.today || { revenue: 0, expenses: 0, profit: 0, margin: 0 };

      let rev = monthData.revenue;
      let exp = monthData.expenses;
      let sRev = monthData.staffRev;
      let aRev = monthData.airbnbRev;
      let sExp = monthData.staffExp;
      let aExp = monthData.airbnbExp;

      if (activePropertyScope === 'staff') {
        rev = sRev;
        exp = sExp;
      } else if (activePropertyScope === 'airbnb') {
        rev = aRev;
        exp = aExp;
      }

      const profit = rev - exp;
      const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;

      document.getElementById('kpiTotalRevenue').innerText = formatINR(rev);
      document.getElementById('kpiTotalExpenses').innerText = formatINR(exp);
      document.getElementById('kpiNetProfit').innerText = formatINR(profit);
      document.getElementById('kpiProfitMargin').innerText = margin + '%';

      document.getElementById('kpiStaffRev').innerText = '₹' + formatINR(sRev);
      document.getElementById('kpiAirbnbRev').innerText = '₹' + formatINR(aRev);
      document.getElementById('kpiStaffExp').innerText = '₹' + formatINR(sExp);
      document.getElementById('kpiAirbnbExp').innerText = '₹' + formatINR(aExp);

      let tRev = todayData.revenue;
      let tExp = todayData.expenses;
      if (activePropertyScope === 'staff') {
        tRev = todayData.staffRev || 0;
        tExp = todayData.staffExp || 0;
      } else if (activePropertyScope === 'airbnb') {
        tRev = todayData.airbnbRev || 0;
        tExp = todayData.airbnbExp || 0;
      }
      const tProfit = tRev - tExp;

      document.getElementById('kpiTodayRevenue').innerText = formatINR(tRev);
      document.getElementById('kpiTodayProfit').innerText = '₹' + formatINR(tProfit);
      if (rawPayload.currentDate) {
        document.getElementById('todayDateLabel').innerText = rawPayload.currentDate;
      }

      const netProfitEl = document.getElementById('kpiNetProfit');
      if (profit < 0) {
        netProfitEl.className = 'text-2xl sm:text-3xl font-semibold tracking-tight text-rose-400 font-mono';
      } else {
        netProfitEl.className = 'text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-400 font-mono';
      }
    }

    function renderComposition() {
      if (!rawPayload) return;
      const monthData = rawPayload.kpis.selectedMonth || { staffRev: 0, airbnbRev: 0, revenue: 0 };
      const sRev = monthData.staffRev || 0;
      const aRev = monthData.airbnbRev || 0;
      const tot = sRev + aRev;

      const sPct = tot > 0 ? Math.round((sRev / tot) * 100) : 50;
      const aPct = tot > 0 ? (100 - sPct) : 50;

      document.getElementById('barStaffShare').style.width = sPct + '%';
      document.getElementById('barAirbnbShare').style.width = aPct + '%';

      document.getElementById('pctStaffShare').innerText = sPct + '%';
      document.getElementById('valStaffShare').innerText = '₹' + formatINR(sRev);

      document.getElementById('pctAirbnbShare').innerText = aPct + '%';
      document.getElementById('valAirbnbShare').innerText = '₹' + formatINR(aRev);

      const catList = document.getElementById('categoryBreakdownList');
      if (catList && rawPayload.breakdowns) {
        const revCat = rawPayload.breakdowns.revenueByCategory || {};
        catList.innerHTML = \`
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.05]">
            <span class="text-zinc-300 flex items-center gap-2"><i data-lucide="bed" class="w-3.5 h-3.5 text-zinc-400"></i> Hotel Lodging</span>
            <span class="font-mono font-medium text-white">₹\${formatINR(revCat.lodging || 0)}</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.05]">
            <span class="text-zinc-300 flex items-center gap-2"><i data-lucide="utensils" class="w-3.5 h-3.5 text-zinc-400"></i> Food & Beverage</span>
            <span class="font-mono font-medium text-white">₹\${formatINR(revCat.fooding || 0)}</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.05]">
            <span class="text-zinc-300 flex items-center gap-2"><i data-lucide="home" class="w-3.5 h-3.5 text-zinc-400"></i> Airbnb Homestays</span>
            <span class="font-mono font-medium text-white">₹\${formatINR(revCat.airbnbHomestays || 0)}</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.05]">
            <span class="text-zinc-300 flex items-center gap-2"><i data-lucide="sparkles" class="w-3.5 h-3.5 text-zinc-400"></i> Services & Amenities</span>
            <span class="font-mono font-medium text-white">₹\${formatINR(revCat.services || 0)}</span>
          </div>
        \`;
      }
    }

    function renderChart() {
      if (!rawPayload) return;
      const container = document.getElementById('chartContainer');
      if (!container) return;

      let items = [];

      if (activeTimeView === 'daily') {
        items = [...rawPayload.daily].reverse();
        document.getElementById('chartTitle').innerText = 'Daily Trajectory (' + activeMonth + ')';
        document.getElementById('chartSubtitle').innerText = 'Chronological daily revenue, expenses, and net earnings';
      } else if (activeTimeView === 'weekly') {
        items = [...rawPayload.weekly].reverse();
        document.getElementById('chartTitle').innerText = 'Weekly Performance Overview';
        document.getElementById('chartSubtitle').innerText = 'Aggregated weekly performance progression';
      } else {
        items = [...rawPayload.monthly].reverse();
        document.getElementById('chartTitle').innerText = 'Monthly Performance Archive';
        document.getElementById('chartSubtitle').innerText = 'Historical monthly comparison across all properties';
      }

      if (items.length === 0) {
        container.innerHTML = '<div class="m-auto text-xs text-zinc-500">No chart data available for this selection</div>';
        return;
      }

      let maxVal = 1000;
      items.forEach(it => {
        let rev = it.totalRevenue;
        let exp = it.totalExpenses;
        if (activePropertyScope === 'staff') {
          rev = it.staffRevenue;
          exp = it.staffExpenses;
        } else if (activePropertyScope === 'airbnb') {
          rev = it.airbnbRevenue;
          exp = it.airbnbExpenses;
        }
        if (rev > maxVal) maxVal = rev;
        if (exp > maxVal) maxVal = exp;
      });

      const barsHtml = items.map((it) => {
        let rev = it.totalRevenue;
        let exp = it.totalExpenses;
        if (activePropertyScope === 'staff') {
          rev = it.staffRevenue;
          exp = it.staffExpenses;
        } else if (activePropertyScope === 'airbnb') {
          rev = it.airbnbRevenue;
          exp = it.airbnbExpenses;
        }
        const profit = rev - exp;

        const revHeight = Math.max(3, Math.round((rev / maxVal) * 190));
        const expHeight = Math.max(3, Math.round((exp / maxVal) * 190));
        const profitHeight = Math.max(3, Math.round((Math.max(0, profit) / maxVal) * 190));

        let shortLabel = '';
        if (activeTimeView === 'daily') {
          shortLabel = it.date.slice(8);
        } else if (activeTimeView === 'weekly') {
          shortLabel = 'W' + it.weekNumber;
        } else {
          shortLabel = it.month.slice(5);
        }

        const tooltip = (it.formattedDate || it.weekLabel || it.monthLabel) + ' | Rev: ₹' + formatINR(rev) + ' | Exp: ₹' + formatINR(exp) + ' | Net: ₹' + formatINR(profit);

        return \`
          <div class="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer min-w-[16px] max-w-[36px]" title="\${tooltip}">
            <div class="w-full flex items-end justify-center gap-0.5 sm:gap-1">
              <div class="w-1.5 sm:w-2 bg-zinc-300/90 group-hover:bg-white rounded-t-xs transition-all" style="height: \${revHeight}px"></div>
              <div class="w-1.5 sm:w-2 bg-zinc-600 group-hover:bg-zinc-500 rounded-t-xs transition-all" style="height: \${expHeight}px"></div>
              <div class="w-1.5 sm:w-2 \${profit >= 0 ? 'bg-emerald-500/80 group-hover:bg-emerald-400' : 'bg-rose-500/80 group-hover:bg-rose-400'} rounded-t-xs transition-all" style="height: \${profitHeight}px"></div>
            </div>
            <span class="text-[9px] font-mono text-zinc-400 mt-2 truncate group-hover:text-zinc-200 transition select-none">
              \${shortLabel}
            </span>
          </div>
        \`;
      }).join('');

      container.innerHTML = barsHtml;
      const rangeEl = document.getElementById('chartRangeLabel');
      if (rangeEl && items.length > 0) {
        rangeEl.innerText = (items[0].date || items[0].startDate || items[0].month) + '  →  ' + (items[items.length - 1].date || items[items.length - 1].endDate || items[items.length - 1].month);
      }
    }

    function renderTable() {
      if (!rawPayload) return;
      const tbody = document.getElementById('earningsTableBody');
      const emptyState = document.getElementById('tableEmptyState');
      if (!tbody) return;

      let records = [];
      const titleEl = document.getElementById('tableSectionTitle');
      const subEl = document.getElementById('tableSectionSubtitle');

      if (activeTimeView === 'daily') {
        records = rawPayload.daily;
        if (titleEl) titleEl.innerText = 'Consolidated Daily Ledger (' + activeMonth + ')';
        if (subEl) subEl.innerText = 'Itemized day-by-day record of sales, guest bookings, payouts and expenses';
      } else if (activeTimeView === 'weekly') {
        records = rawPayload.weekly;
        if (titleEl) titleEl.innerText = 'Weekly Performance Ledger';
        if (subEl) subEl.innerText = 'Consolidated weekly earnings progression and cumulative totals';
      } else {
        records = rawPayload.monthly;
        if (titleEl) titleEl.innerText = 'Monthly Performance Archive';
        if (subEl) subEl.innerText = 'Historical month-over-month ledger across all portfolio properties';
      }

      if (records.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }
      if (emptyState) emptyState.classList.add('hidden');

      const rowsHtml = records.map((r, idx) => {
        let periodLabel = '';
        let staffRev = r.staffRevenue;
        let airbnbRev = r.airbnbRevenue;
        let staffExp = r.staffExpenses;
        let airbnbExp = r.airbnbExpenses;
        let totRev = r.totalRevenue;
        let totExp = r.totalExpenses;

        if (activePropertyScope === 'staff') {
          totRev = staffRev;
          totExp = staffExp;
        } else if (activePropertyScope === 'airbnb') {
          totRev = airbnbRev;
          totExp = airbnbExp;
        }

        const netProfit = totRev - totExp;
        const margin = totRev > 0 ? Math.round((netProfit / totRev) * 100) : 0;

        if (activeTimeView === 'daily') {
          const isToday = r.date === rawPayload.currentDate;
          periodLabel = \`
            <div class="flex items-center gap-2">
              <span class="w-7 text-zinc-400 font-sans text-[10px] uppercase">\${r.dayOfWeek}</span>
              <span class="font-medium text-white">\${r.date}</span>
              \${isToday ? '<span class="px-1.5 py-0.2 rounded-md bg-white/[0.08] text-white text-[10px] font-sans font-medium border border-white/20">TODAY</span>' : ''}
            </div>
          \`;
        } else if (activeTimeView === 'weekly') {
          periodLabel = \`
            <div>
              <span class="font-medium text-white font-sans">\${r.weekLabel}</span>
              <span class="text-[10px] text-zinc-400 block font-mono">\${r.startDate} &rarr; \${r.endDate}</span>
            </div>
          \`;
        } else {
          periodLabel = \`
            <div class="flex items-center gap-2">
              <span class="font-medium text-white font-sans text-sm">\${r.monthLabel}</span>
              <span class="text-[10px] font-mono text-zinc-400">(\${r.month})</span>
            </div>
          \`;
        }

        const profitClass = netProfit >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium';

        return \`
          <tr class="hover:bg-white/[0.03] transition-colors group cursor-pointer" onclick="showDetailModal('\${activeTimeView}', \${idx})">
            <td class="py-3 px-4 whitespace-nowrap">\${periodLabel}</td>
            <td class="py-3 px-4 text-right text-zinc-300">₹\${formatINR(staffRev)}</td>
            <td class="py-3 px-4 text-right text-zinc-300">₹\${formatINR(airbnbRev)}</td>
            <td class="py-3 px-4 text-right font-medium text-white">₹\${formatINR(totRev)}</td>
            <td class="py-3 px-4 text-right text-zinc-400">₹\${formatINR(totExp)}</td>
            <td class="py-3 px-4 text-right \${profitClass}">₹\${formatINR(netProfit)}</td>
            <td class="py-3 px-4 text-center">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                \${margin}%
              </span>
            </td>
            <td class="py-3 px-3 text-center no-print">
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition mx-auto"></i>
            </td>
          </tr>
        \`;
      }).join('');

      tbody.innerHTML = rowsHtml;
    }

    function filterTable(keyword) {
      const q = (keyword || '').toLowerCase().trim();
      const rows = document.querySelectorAll('#earningsTableBody tr');
      rows.forEach(r => {
        const text = r.innerText.toLowerCase();
        if (!q || text.includes(q)) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    }

    function renderRecentTransactions() {
      if (!rawPayload) return;
      const container = document.getElementById('recentTxList');
      if (!container) return;

      const txs = rawPayload.recentTransactions || [];
      if (txs.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-xs text-zinc-500 py-4">No recent activity</div>';
        return;
      }

      container.innerHTML = txs.slice(0, 12).map(tx => {
        const isIncome = tx.flow === 'income';
        const isAirbnb = tx.source === 'Airbnb Host Portal';
        const icon = isIncome ? (isAirbnb ? 'home' : 'arrow-down-left') : 'arrow-up-right';
        const amountColor = isIncome ? 'text-emerald-400' : 'text-zinc-400';

        return \`
          <div class="p-3.5 rounded-xl bg-[#0D1017] border border-white/[0.06] flex items-start gap-3 hover:border-white/[0.12] transition">
            <div class="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="\${icon}" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-1">
                <span class="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.08] font-sans truncate">
                  \${tx.property}
                </span>
                <span class="text-[10px] text-zinc-400 font-mono shrink-0">\${tx.date}</span>
              </div>
              <p class="text-xs font-medium text-white truncate" title="\${tx.title}">\${tx.title}</p>
              \${tx.details ? \`<p class="text-[11px] text-zinc-400 truncate mt-0.5">\${tx.details}</p>\` : ''}
              <div class="mt-2 flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                <span class="text-[10px] text-zinc-400">\${tx.source}</span>
                <span class="text-xs font-semibold font-mono \${amountColor}">
                  \${isIncome ? '+' : '-'}₹\${formatINR(tx.amount)}
                </span>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function showDetailModal(viewType, index) {
      if (!rawPayload) return;
      const modal = document.getElementById('detailModal');
      const title = document.getElementById('modalTitle');
      const subtitle = document.getElementById('modalSubtitle');
      const content = document.getElementById('modalContent');
      if (!modal || !title || !content) return;

      let record = null;
      if (viewType === 'daily') record = rawPayload.daily[index];
      else if (viewType === 'weekly') record = rawPayload.weekly[index];
      else record = rawPayload.monthly[index];

      if (!record) return;

      if (viewType === 'daily') {
        title.innerText = 'Day Breakdown: ' + record.date + ' (' + record.dayOfWeek + ')';
        subtitle.innerText = 'Itemized details for Staff Management & Airbnb Bookings';

        let airbnbItemsHtml = '';
        if (record.airbnbBookings && record.airbnbBookings.length > 0) {
          airbnbItemsHtml = record.airbnbBookings.map(b => \`
            <div class="p-2.5 rounded-xl bg-[#11141C] border border-white/[0.06] flex items-center justify-between gap-2">
              <div>
                <span class="font-medium text-white text-xs block">\${b.guestName}</span>
                <span class="text-[11px] text-zinc-400">\${b.property} &bull; \${b.platform} &bull; \${b.nights} night(s)</span>
              </div>
              <span class="text-xs font-medium font-mono text-emerald-400">+₹\${formatINR(b.payout)}</span>
            </div>
          \`).join('');
        } else {
          airbnbItemsHtml = '<p class="text-xs text-zinc-500 italic">No Airbnb check-in bookings on this day.</p>';
        }

        let airbnbExpHtml = '';
        if (record.airbnbExpenseItems && record.airbnbExpenseItems.length > 0) {
          airbnbExpHtml = record.airbnbExpenseItems.map(e => \`
            <div class="p-2.5 rounded-xl bg-[#11141C] border border-white/[0.06] flex items-center justify-between gap-2">
              <div>
                <span class="font-medium text-white text-xs block">\${e.title}</span>
                <span class="text-[11px] text-zinc-400">\${e.category} &bull; \${e.property}</span>
              </div>
              <span class="text-xs font-medium font-mono text-zinc-300">-₹\${formatINR(e.amount)}</span>
            </div>
          \`).join('');
        } else {
          airbnbExpHtml = '<p class="text-xs text-zinc-500 italic">No Airbnb expenses on this day.</p>';
        }

        let staffNotesHtml = '';
        if (record.staffExpenseNotes && record.staffExpenseNotes.length > 0) {
          staffNotesHtml = record.staffExpenseNotes.map(n => \`
            <div class="p-2.5 rounded-lg bg-[#11141C] border border-white/[0.06] text-xs text-zinc-300">
              \${n}
            </div>
          \`).join('');
        }

        content.innerHTML = \`
          <!-- Financial Snapshot -->
          <div class="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-[#11141C] border border-white/[0.06]">
            <div>
              <span class="text-[10px] text-zinc-400 block uppercase">Total Revenue</span>
              <span class="text-sm font-semibold text-white font-mono">₹\${formatINR(record.totalRevenue)}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-400 block uppercase">Total Expenses</span>
              <span class="text-sm font-semibold text-zinc-300 font-mono">₹\${formatINR(record.totalExpenses)}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-400 block uppercase">Net Profit</span>
              <span class="text-sm font-semibold \${record.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono">₹\${formatINR(record.netProfit)}</span>
            </div>
          </div>

          <!-- Staff Management Section -->
          <div>
            <h4 class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i data-lucide="hotel" class="w-3.5 h-3.5"></i> Hotel Operations
            </h4>
            <div class="grid grid-cols-2 gap-2 text-xs mb-2">
              <div class="p-2.5 rounded-xl bg-[#11141C] border border-white/[0.06] flex justify-between">
                <span class="text-zinc-400">Lodging Sales:</span>
                <span class="font-medium text-zinc-200 font-mono">₹\${formatINR(record.staffLodging)}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-[#11141C] border border-white/[0.06] flex justify-between">
                <span class="text-zinc-400">Food & Beverage:</span>
                <span class="font-medium text-zinc-200 font-mono">₹\${formatINR(record.staffFooding)}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-[#11141C] border border-white/[0.06] flex justify-between">
                <span class="text-zinc-400">Services & Salon:</span>
                <span class="font-medium text-zinc-200 font-mono">₹\${formatINR(record.staffServices)}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-[#11141C] border border-white/[0.06] flex justify-between">
                <span class="text-zinc-400">Operational Exp:</span>
                <span class="font-medium text-zinc-300 font-mono">₹\${formatINR(record.staffExpenses)}</span>
              </div>
            </div>
            \${staffNotesHtml}
          </div>

          <!-- Airbnb Section -->
          <div>
            <h4 class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i data-lucide="home" class="w-3.5 h-3.5"></i> Airbnb Host Portal Bookings
            </h4>
            <div class="space-y-1.5 mb-3">
              \${airbnbItemsHtml}
            </div>

            <h4 class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i data-lucide="receipt" class="w-3.5 h-3.5"></i> Airbnb Property Expenses
            </h4>
            <div class="space-y-1.5">
              \${airbnbExpHtml}
            </div>
          </div>
        \`;
      } else {
        title.innerText = record.weekLabel || record.monthLabel;
        subtitle.innerText = 'Period aggregate breakdown';
        content.innerHTML = \`
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-[#11141C] border border-white/[0.06]">
              <span class="text-zinc-400 block mb-1">Hotel Operations Rev:</span>
              <span class="text-base font-semibold text-white font-mono">₹\${formatINR(record.staffRevenue)}</span>
            </div>
            <div class="p-3 rounded-xl bg-[#11141C] border border-white/[0.06]">
              <span class="text-zinc-400 block mb-1">Airbnb Host Rev:</span>
              <span class="text-base font-semibold text-white font-mono">₹\${formatINR(record.airbnbRevenue)}</span>
            </div>
            <div class="p-3 rounded-xl bg-[#11141C] border border-white/[0.06]">
              <span class="text-zinc-400 block mb-1">Hotel Expenses:</span>
              <span class="text-base font-semibold text-zinc-300 font-mono">₹\${formatINR(record.staffExpenses)}</span>
            </div>
            <div class="p-3 rounded-xl bg-[#11141C] border border-white/[0.06]">
              <span class="text-zinc-400 block mb-1">Airbnb Expenses:</span>
              <span class="text-base font-semibold text-zinc-300 font-mono">₹\${formatINR(record.airbnbExpenses)}</span>
            </div>
          </div>
          <div class="p-4 rounded-xl bg-[#11141C] border border-white/[0.1] text-center">
            <span class="text-xs text-zinc-400 block mb-1 uppercase tracking-wider">Total Net Profit</span>
            <span class="text-2xl font-semibold text-emerald-400 font-mono">₹\${formatINR(record.netProfit)}</span>
            <span class="text-xs text-zinc-300 block mt-1 font-mono">Operating Margin: \${record.profitMargin}%</span>
          </div>
        \`;
      }

      modal.classList.remove('hidden');
      lucide.createIcons();
    }

    function closeModal() {
      const modal = document.getElementById('detailModal');
      if (modal) modal.classList.add('hidden');
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadData();
    });
  </script>
</body>
</html>`;
}
