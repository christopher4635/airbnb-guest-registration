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
	staffProfit: number;
	airbnbRevenue: number;
	airbnbExpenses: number;
	airbnbProfit: number;
	daysCount: number;
	days: UnifiedDayRecord[];
}

export interface UnifiedMonthRecord {
	month: string; // YYYY-MM
	monthLabel: string; // "November 2026"
	totalRevenue: number;
	totalExpenses: number;
	netProfit: number;
	profitMargin: number;
	staffRevenue: number;
	staffExpenses: number;
	staffProfit: number;
	airbnbRevenue: number;
	airbnbExpenses: number;
	airbnbProfit: number;
	bookingsCount: number;
	expensesCount: number;
}

export interface UnifiedEarningsPayload {
	success: boolean;
	generatedAt: string;
	currentDate: string;
	selectedMonth: string;
	availableMonths: string[];
	properties: {
		id: string;
		name: string;
		category: "staff" | "airbnb";
	}[];
	kpis: {
		today: { revenue: number; expenses: number; profit: number; margin: number; staffRev: number; airbnbRev: number; staffExp: number; airbnbExp: number };
		yesterday: { revenue: number; expenses: number; profit: number; margin: number };
		thisWeek: { revenue: number; expenses: number; profit: number; margin: number; staffRev: number; airbnbRev: number; staffExp: number; airbnbExp: number };
		selectedMonth: { revenue: number; expenses: number; profit: number; margin: number; staffRev: number; airbnbRev: number; staffExp: number; airbnbExp: number };
		allTime: { revenue: number; expenses: number; profit: number; margin: number };
	};
	daily: UnifiedDayRecord[];
	weekly: UnifiedWeekRecord[];
	monthly: UnifiedMonthRecord[];
	breakdowns: {
		revenueByProperty: Record<string, number>;
		revenueByCategory: {
			lodging: number;
			fooding: number;
			services: number;
			airbnbHomestays: number;
			other: number;
		};
		expensesByCategory: Record<string, number>;
	};
	recentTransactions: {
		id: string;
		type: "staff_sales" | "staff_expense" | "airbnb_booking" | "airbnb_expense";
		date: string;
		source: "Staff Management" | "Airbnb Host Portal";
		property: string;
		title: string;
		amount: number;
		flow: "income" | "expense";
		details?: string;
	}[];
}

// Payout parser consistent with Airbnb Host Portal & Staff Management logic
function parseAirbnbPayout(payoutStr: any, notes: string | null | undefined, nights: number): number {
	let amount = 0;
	if (payoutStr) {
		const clean = String(payoutStr).replace(/[^0-9.]/g, "");
		const num = parseFloat(clean);
		if (!isNaN(num) && num > 0) amount = num;
	}
	if (amount === 0 && notes) {
		const totMatch = String(notes).match(/Total:\s*₹?\s*([0-9,.]+)/i);
		if (totMatch) {
			const num = parseFloat(totMatch[1].replace(/,/g, ""));
			if (!isNaN(num) && num > 0) amount = num;
		} else {
			const m = String(notes).match(/(?:Booked Rate|Rate):\s*₹?\s*([0-9,.]+)/i);
			if (m) {
				const rate = parseFloat(m[1].replace(/,/g, ""));
				if (!isNaN(rate) && rate > 0) {
					amount = rate * (nights > 0 ? nights : 1);
				}
			}
		}
	}
	return Math.round(amount);
}

function getWeekNumber(d: Date): number {
	const target = new Date(d.valueOf());
	const dayNr = (d.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayNr + 3);
	const firstThursday = target.valueOf();
	target.setMonth(0, 1);
	if (target.getDay() !== 4) {
		target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
	}
	return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function formatMonthLabel(monthKey: string): string {
	const [yStr, mStr] = monthKey.split("-");
	const y = parseInt(yStr, 10);
	const m = parseInt(mStr, 10) - 1;
	const date = new Date(y, m, 1);
	return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export async function fetchUnifiedEarningsData(
	env: Env,
	selectedMonthInput?: string
): Promise<UnifiedEarningsPayload> {
	const now = new Date();
	const todayStr = now.toISOString().slice(0, 10);
	const currentMonthStr = todayStr.slice(0, 7);
	const selectedMonth = (selectedMonthInput && /^\d{4}-\d{2}$/.test(selectedMonthInput))
		? selectedMonthInput
		: currentMonthStr;

	// 1. Fetch active properties from Staff DB
	let staffProperties: { id: string; name: string }[] = [];
	try {
		const { results } = await env.DB.prepare(
			"SELECT id, name FROM properties WHERE active IS NULL OR active = 1"
		).all<{ id: string; name: string }>();
		staffProperties = results || [];
	} catch (e) {
		console.error("Error fetching staff properties:", e);
	}

	// 2. Fetch all daily finances from Staff DB
	let staffFinances: any[] = [];
	try {
		const { results } = await env.DB.prepare(`
			SELECT f.*, p.name AS property_name
			FROM daily_finances f
			JOIN properties p ON f.property_id = p.id
			WHERE (p.active IS NULL OR p.active = 1)
			ORDER BY f.date DESC
		`).all();
		staffFinances = results || [];
	} catch (e) {
		console.error("Error fetching staff daily finances:", e);
	}

	// 3. Fetch Airbnb Bookings & Expenses from AIRBNB_DB
	let airbnbBookings: any[] = [];
	let airbnbExpenses: any[] = [];
	let airbnbUnits: { id: string; name: string }[] = [];

	if (env.AIRBNB_DB) {
		try {
			const { results: bResults } = await env.AIRBNB_DB.prepare(`
				SELECT id, property, guest_name, check_in_date, check_out_date, nights, payout, notes, platform, status
				FROM bookings
				WHERE status NOT IN ('Cancelled', 'Blocked') AND platform != 'Blocked'
				ORDER BY check_in_date DESC
			`).all();
			airbnbBookings = bResults || [];
		} catch (e) {
			console.error("Error fetching airbnb bookings:", e);
		}

		try {
			const { results: eResults } = await env.AIRBNB_DB.prepare(`
				SELECT id, title, amount, category, date, property, notes
				FROM expenses
				ORDER BY date DESC
			`).all();
			airbnbExpenses = eResults || [];
		} catch (e) {
			console.error("Error fetching airbnb expenses:", e);
		}

		try {
			const { results: pResults } = await env.AIRBNB_DB.prepare(`
				SELECT id, name FROM properties ORDER BY name ASC
			`).all<{ id: string; name: string }>();
			airbnbUnits = pResults || [];
		} catch (e) {
			console.error("Error fetching airbnb properties:", e);
		}
	}

	// Build Property List
	const propertyList: { id: string; name: string; category: "staff" | "airbnb" }[] = [];
	staffProperties.forEach(p => propertyList.push({ id: p.id, name: p.name, category: "staff" }));
	if (airbnbUnits.length > 0) {
		airbnbUnits.forEach(p => propertyList.push({ id: p.id, name: p.name, category: "airbnb" }));
	} else {
		// Fallbacks from distinct bookings
		const distinctProps = Array.from(new Set(airbnbBookings.map(b => b.property || "Airbnb Unit")));
		distinctProps.forEach(pName => propertyList.push({ id: pName, name: pName, category: "airbnb" }));
	}

	// Determine all available months
	const allMonthKeys = new Set<string>();
	allMonthKeys.add(currentMonthStr);
	allMonthKeys.add(selectedMonth);

	staffFinances.forEach(f => {
		if (f.date && f.date.length >= 7) allMonthKeys.add(f.date.slice(0, 7));
	});
	airbnbBookings.forEach(b => {
		if (b.check_in_date && b.check_in_date.length >= 7) allMonthKeys.add(b.check_in_date.slice(0, 7));
	});
	airbnbExpenses.forEach(e => {
		if (e.date && e.date.length >= 7) allMonthKeys.add(e.date.slice(0, 7));
	});

	const availableMonths = Array.from(allMonthKeys).sort().reverse();

	// 4. Group data by Day (for selected month)
	// Build map of all dates in selected month
	const [selYear, selMonthNum] = selectedMonth.split("-").map(n => parseInt(n, 10));
	const daysInSelectedMonth = new Date(selYear, selMonthNum, 0).getDate();

	const dailyMap = new Map<string, UnifiedDayRecord>();

	for (let day = 1; day <= daysInSelectedMonth; day++) {
		const dayStr = String(day).padStart(2, "0");
		const dateKey = `${selectedMonth}-${dayStr}`;
		const dateObj = new Date(selYear, selMonthNum - 1, day);
		const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
		const formatted = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

		dailyMap.set(dateKey, {
			date: dateKey,
			dayOfWeek: dayName,
			formattedDate: formatted,
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

	// Populate Staff Data into Daily Map
	staffFinances.forEach(f => {
		const dKey = f.date;
		if (dailyMap.has(dKey)) {
			const entry = dailyMap.get(dKey)!;
			const lodging = (Number(f.lodging_online) || 0) + (Number(f.lodging_cash ?? f.lodging_offline) || 0);
			const fooding = (Number(f.fooding_online) || 0) + (Number(f.fooding_cash ?? f.fooding_offline) || 0);
			const services = (Number(f.services_online) || 0) + (Number(f.services_cash) || 0);
			const other = Number(f.other_sales) || 0;
			const totalSales = Number(f.total_sales) || (lodging + fooding + services + other);
			const expTotal = Number(f.expenses_total) || 0;

			entry.staffRevenue += totalSales;
			entry.staffExpenses += expTotal;
			entry.staffLodging += lodging;
			entry.staffFooding += fooding;
			entry.staffServices += services;
			entry.staffOther += other;
			if (f.expense_notes && f.expense_notes.trim()) {
				entry.staffExpenseNotes.push(`${f.property_name || "Hotel"}: ${f.expense_notes.trim()}`);
			}
		}
	});

	// Populate Airbnb Bookings into Daily Map (Recognized strictly by check-in date)
	airbnbBookings.forEach(b => {
		const dKey = b.check_in_date;
		const payout = parseAirbnbPayout(b.payout, b.notes, b.nights || 1);
		if (dailyMap.has(dKey)) {
			const entry = dailyMap.get(dKey)!;
			entry.airbnbRevenue += payout;
			entry.airbnbBookingsCount += 1;
			entry.airbnbBookings.push({
				id: b.id,
				property: b.property || "Homestay",
				guestName: b.guest_name || "Guest",
				platform: b.platform || "Airbnb",
				checkInDate: b.check_in_date,
				checkOutDate: b.check_out_date,
				nights: b.nights || 1,
				payout: payout
			});
		}
	});

	// Populate Airbnb Expenses into Daily Map
	airbnbExpenses.forEach(e => {
		const dKey = e.date;
		const amt = Number(e.amount) || 0;
		if (dailyMap.has(dKey)) {
			const entry = dailyMap.get(dKey)!;
			entry.airbnbExpenses += amt;
			entry.airbnbExpenseItems.push({
				id: e.id,
				title: e.title || "Expense",
				amount: amt,
				category: e.category || "General",
				property: e.property || "All Units"
			});
		}
	});

	// Calculate totals and profits for each day
	const dailyRecords: UnifiedDayRecord[] = Array.from(dailyMap.values()).map(d => {
		d.staffProfit = d.staffRevenue - d.staffExpenses;
		d.airbnbProfit = d.airbnbRevenue - d.airbnbExpenses;
		d.totalRevenue = d.staffRevenue + d.airbnbRevenue;
		d.totalExpenses = d.staffExpenses + d.airbnbExpenses;
		d.netProfit = d.totalRevenue - d.totalExpenses;
		d.profitMargin = d.totalRevenue > 0 ? Math.round((d.netProfit / d.totalRevenue) * 100) : 0;
		return d;
	});

	// Sort daily descending (newest first)
	dailyRecords.sort((a, b) => b.date.localeCompare(a.date));

	// 5. Aggregate into Weekly View (Group days by ISO week or Mon-Sun weeks)
	const weekMap = new Map<number, UnifiedWeekRecord>();

	dailyRecords.forEach(day => {
		const [y, m, d] = day.date.split("-").map(n => parseInt(n, 10));
		const dateObj = new Date(y, m - 1, d);
		const weekNum = getWeekNumber(dateObj);

		if (!weekMap.has(weekNum)) {
			// Find start (Monday) and end (Sunday) of this week
			const dayOfWeek = (dateObj.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
			const mon = new Date(dateObj);
			mon.setDate(dateObj.getDate() - dayOfWeek);
			const sun = new Date(mon);
			sun.setDate(mon.getDate() + 6);

			const startLabel = mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
			const endLabel = sun.toLocaleDateString("en-US", { month: "short", day: "numeric" });

			weekMap.set(weekNum, {
				weekNumber: weekNum,
				weekLabel: `Week ${weekNum} (${startLabel} – ${endLabel})`,
				startDate: mon.toISOString().slice(0, 10),
				endDate: sun.toISOString().slice(0, 10),
				totalRevenue: 0,
				totalExpenses: 0,
				netProfit: 0,
				profitMargin: 0,
				staffRevenue: 0,
				staffExpenses: 0,
				staffProfit: 0,
				airbnbRevenue: 0,
				airbnbExpenses: 0,
				airbnbProfit: 0,
				daysCount: 0,
				days: []
			});
		}

		const week = weekMap.get(weekNum)!;
		week.days.push(day);
		week.daysCount += 1;
		week.staffRevenue += day.staffRevenue;
		week.staffExpenses += day.staffExpenses;
		week.airbnbRevenue += day.airbnbRevenue;
		week.airbnbExpenses += day.airbnbExpenses;
		week.totalRevenue += day.totalRevenue;
		week.totalExpenses += day.totalExpenses;
	});

	const weeklyRecords: UnifiedWeekRecord[] = Array.from(weekMap.values()).map(w => {
		w.staffProfit = w.staffRevenue - w.staffExpenses;
		w.airbnbProfit = w.airbnbRevenue - w.airbnbExpenses;
		w.netProfit = w.totalRevenue - w.totalExpenses;
		w.profitMargin = w.totalRevenue > 0 ? Math.round((w.netProfit / w.totalRevenue) * 100) : 0;
		// Sort days in week ascending
		w.days.sort((a, b) => a.date.localeCompare(b.date));
		return w;
	});
	weeklyRecords.sort((a, b) => b.weekNumber - a.weekNumber);

	// 6. Aggregate into Monthly View (All Available Months)
	const monthMap = new Map<string, UnifiedMonthRecord>();

	availableMonths.forEach(mKey => {
		monthMap.set(mKey, {
			month: mKey,
			monthLabel: formatMonthLabel(mKey),
			totalRevenue: 0,
			totalExpenses: 0,
			netProfit: 0,
			profitMargin: 0,
			staffRevenue: 0,
			staffExpenses: 0,
			staffProfit: 0,
			airbnbRevenue: 0,
			airbnbExpenses: 0,
			airbnbProfit: 0,
			bookingsCount: 0,
			expensesCount: 0
		});
	});

	// All staff finances into monthly
	staffFinances.forEach(f => {
		if (f.date && f.date.length >= 7) {
			const mKey = f.date.slice(0, 7);
			if (monthMap.has(mKey)) {
				const mObj = monthMap.get(mKey)!;
				const lodging = (Number(f.lodging_online) || 0) + (Number(f.lodging_cash ?? f.lodging_offline) || 0);
				const fooding = (Number(f.fooding_online) || 0) + (Number(f.fooding_cash ?? f.fooding_offline) || 0);
				const services = (Number(f.services_online) || 0) + (Number(f.services_cash) || 0);
				const other = Number(f.other_sales) || 0;
				const totalSales = Number(f.total_sales) || (lodging + fooding + services + other);
				const expTotal = Number(f.expenses_total) || 0;

				mObj.staffRevenue += totalSales;
				mObj.staffExpenses += expTotal;
				if (expTotal > 0) mObj.expensesCount += 1;
			}
		}
	});

	// All airbnb bookings into monthly
	airbnbBookings.forEach(b => {
		if (b.check_in_date && b.check_in_date.length >= 7) {
			const mKey = b.check_in_date.slice(0, 7);
			if (monthMap.has(mKey)) {
				const mObj = monthMap.get(mKey)!;
				const payout = parseAirbnbPayout(b.payout, b.notes, b.nights || 1);
				mObj.airbnbRevenue += payout;
				mObj.bookingsCount += 1;
			}
		}
	});

	// All airbnb expenses into monthly
	airbnbExpenses.forEach(e => {
		if (e.date && e.date.length >= 7) {
			const mKey = e.date.slice(0, 7);
			if (monthMap.has(mKey)) {
				const mObj = monthMap.get(mKey)!;
				const amt = Number(e.amount) || 0;
				mObj.airbnbExpenses += amt;
				mObj.expensesCount += 1;
			}
		}
	});

	const monthlyRecords: UnifiedMonthRecord[] = Array.from(monthMap.values()).map(m => {
		m.staffProfit = m.staffRevenue - m.staffExpenses;
		m.airbnbProfit = m.airbnbRevenue - m.airbnbExpenses;
		m.totalRevenue = m.staffRevenue + m.airbnbRevenue;
		m.totalExpenses = m.staffExpenses + m.airbnbExpenses;
		m.netProfit = m.totalRevenue - m.totalExpenses;
		m.profitMargin = m.totalRevenue > 0 ? Math.round((m.netProfit / m.totalRevenue) * 100) : 0;
		return m;
	});
	monthlyRecords.sort((a, b) => b.month.localeCompare(a.month));

	// 7. Calculate Breakdown Totals for the Selected Month
	const revenueByProperty: Record<string, number> = {};
	const expensesByCategory: Record<string, number> = {};
	const revenueByCategory = {
		lodging: 0,
		fooding: 0,
		services: 0,
		airbnbHomestays: 0,
		other: 0
	};

	// Selected month daily records breakdown
	dailyRecords.forEach(d => {
		revenueByCategory.lodging += d.staffLodging;
		revenueByCategory.fooding += d.staffFooding;
		revenueByCategory.services += d.staffServices;
		revenueByCategory.other += d.staffOther;
		revenueByCategory.airbnbHomestays += d.airbnbRevenue;

		d.airbnbBookings.forEach(b => {
			const propName = b.property || "Airbnb Unit";
			revenueByProperty[propName] = (revenueByProperty[propName] || 0) + b.payout;
		});

		d.airbnbExpenseItems.forEach(exp => {
			const cat = exp.category || "General";
			expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
		});
	});

	// Add staff management property revenues
	staffProperties.forEach(p => {
		const propSales = staffFinances
			.filter(f => f.property_id === p.id && f.date.startsWith(selectedMonth))
			.reduce((sum, f) => sum + (Number(f.total_sales) || 0), 0);
		if (propSales > 0) {
			revenueByProperty[p.name] = (revenueByProperty[p.name] || 0) + propSales;
		}
	});

	// Add staff expenses category
	const staffExpSum = dailyRecords.reduce((sum, d) => sum + d.staffExpenses, 0);
	if (staffExpSum > 0) {
		expensesByCategory["Staff & Hotel Ops"] = (expensesByCategory["Staff & Hotel Ops"] || 0) + staffExpSum;
	}

	// 8. Calculate KPI Summary Numbers
	const todayRecord = dailyRecords.find(d => d.date === todayStr);
	const yesterdayObj = new Date(now);
	yesterdayObj.setDate(now.getDate() - 1);
	const yesterdayStr = yesterdayObj.toISOString().slice(0, 10);
	const yesterdayRecord = dailyRecords.find(d => d.date === yesterdayStr);

	const thisWeekRecord = weeklyRecords.find(w => todayStr >= w.startDate && todayStr <= w.endDate) || weeklyRecords[0] || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, staffRevenue: 0, airbnbRevenue: 0, staffExpenses: 0, airbnbExpenses: 0 };
	const selectedMonthRecord = monthlyRecords.find(m => m.month === selectedMonth) || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, staffRevenue: 0, airbnbRevenue: 0, staffExpenses: 0, airbnbExpenses: 0 };

	const allTimeRevenue = monthlyRecords.reduce((s, m) => s + m.totalRevenue, 0);
	const allTimeExpenses = monthlyRecords.reduce((s, m) => s + m.totalExpenses, 0);
	const allTimeProfit = allTimeRevenue - allTimeExpenses;
	const allTimeMargin = allTimeRevenue > 0 ? Math.round((allTimeProfit / allTimeRevenue) * 100) : 0;

	// 9. Build Unified Recent Transactions Stream (Latest 25)
	const recentTx: any[] = [];

	staffFinances.slice(0, 20).forEach(f => {
		const totalSales = Number(f.total_sales) || 0;
		const totalExp = Number(f.expenses_total) || 0;
		if (totalSales > 0) {
			recentTx.push({
				id: `sf_rev_${f.id}`,
				type: "staff_sales",
				date: f.date,
				source: "Staff Management",
				property: f.property_name || "Xsquare Hotel",
				title: `Daily Sales (Lodging: ₹${f.lodging_online || 0 + f.lodging_cash || 0}, Fooding: ₹${f.fooding_online || 0 + f.fooding_cash || 0})`,
				amount: totalSales,
				flow: "income",
				details: f.submitted_by ? `Logged by: ${f.submitted_by}` : undefined
			});
		}
		if (totalExp > 0) {
			recentTx.push({
				id: `sf_exp_${f.id}`,
				type: "staff_expense",
				date: f.date,
				source: "Staff Management",
				property: f.property_name || "Xsquare Hotel",
				title: f.expense_notes ? `Expenses: ${f.expense_notes}` : "Daily Operational Expenses",
				amount: totalExp,
				flow: "expense",
				details: f.submitted_by ? `Logged by: ${f.submitted_by}` : undefined
			});
		}
	});

	airbnbBookings.slice(0, 25).forEach(b => {
		const payout = parseAirbnbPayout(b.payout, b.notes, b.nights || 1);
		recentTx.push({
			id: `ab_bk_${b.id}`,
			type: "airbnb_booking",
			date: b.check_in_date,
			source: "Airbnb Host Portal",
			property: b.property || "Homestay",
			title: `Booking: ${b.guestName || b.guest_name || "Guest"} (${b.platform || "Airbnb"})`,
			amount: payout,
			flow: "income",
			details: `${b.nights || 1} night(s) | Check-in: ${b.check_in_date} → ${b.check_out_date}`
		});
	});

	airbnbExpenses.slice(0, 15).forEach(e => {
		recentTx.push({
			id: `ab_exp_${e.id}`,
			type: "airbnb_expense",
			date: e.date,
			source: "Airbnb Host Portal",
			property: e.property || "All Units",
			title: `${e.category || "Expense"}: ${e.title}`,
			amount: Number(e.amount) || 0,
			flow: "expense",
			details: e.notes || undefined
		});
	});

	recentTx.sort((a, b) => b.date.localeCompare(a.date));

	return {
		success: true,
		generatedAt: new Date().toISOString(),
		currentDate: todayStr,
		selectedMonth,
		availableMonths,
		properties: propertyList,
		kpis: {
			today: {
				revenue: todayRecord ? todayRecord.totalRevenue : 0,
				expenses: todayRecord ? todayRecord.totalExpenses : 0,
				profit: todayRecord ? todayRecord.netProfit : 0,
				margin: todayRecord ? todayRecord.profitMargin : 0,
				staffRev: todayRecord ? todayRecord.staffRevenue : 0,
				airbnbRev: todayRecord ? todayRecord.airbnbRevenue : 0,
				staffExp: todayRecord ? todayRecord.staffExpenses : 0,
				airbnbExp: todayRecord ? todayRecord.airbnbExpenses : 0
			},
			yesterday: {
				revenue: yesterdayRecord ? yesterdayRecord.totalRevenue : 0,
				expenses: yesterdayRecord ? yesterdayRecord.totalExpenses : 0,
				profit: yesterdayRecord ? yesterdayRecord.netProfit : 0,
				margin: yesterdayRecord ? yesterdayRecord.profitMargin : 0
			},
			thisWeek: {
				revenue: thisWeekRecord.totalRevenue,
				expenses: thisWeekRecord.totalExpenses,
				profit: thisWeekRecord.netProfit,
				margin: thisWeekRecord.profitMargin,
				staffRev: thisWeekRecord.staffRevenue,
				airbnbRev: thisWeekRecord.airbnbRevenue,
				staffExp: thisWeekRecord.staffExpenses,
				airbnbExp: thisWeekRecord.airbnbExpenses
			},
			selectedMonth: {
				revenue: selectedMonthRecord.totalRevenue,
				expenses: selectedMonthRecord.totalExpenses,
				profit: selectedMonthRecord.netProfit,
				margin: selectedMonthRecord.profitMargin,
				staffRev: selectedMonthRecord.staffRevenue,
				airbnbRev: selectedMonthRecord.airbnbRevenue,
				staffExp: selectedMonthRecord.staffExpenses,
				airbnbExp: selectedMonthRecord.airbnbExpenses
			},
			allTime: {
				revenue: allTimeRevenue,
				expenses: allTimeExpenses,
				profit: allTimeProfit,
				margin: allTimeMargin
			}
		},
		daily: dailyRecords,
		weekly: weeklyRecords,
		monthly: monthlyRecords,
		breakdowns: {
			revenueByProperty,
			revenueByCategory,
			expensesByCategory
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
  <title>Unified Earnings & Profit Dashboard | Staff Management & Airbnb Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    /* Hide scrollbars for clean UI */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @media print {
      body { background: white !important; color: black !important; }
      .no-print { display: none !important; }
      .print-expand { display: block !important; }
    }
    .badge-glow {
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
    }
  </style>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eef2ff',
              100: '#e0e7ff',
              500: '#6366f1',
              600: '#4f46e5',
              700: '#4338ca',
              900: '#1e1b4b',
            },
            airbnb: {
              50: '#fff1f2',
              500: '#ff385c',
              600: '#e00b41',
              700: '#be123c',
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">

  <!-- Top Executive Header -->
  <header class="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg px-4 sm:px-6 py-3.5">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
      
      <!-- Brand & Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <i data-lucide="layout-dashboard" class="w-5 h-5 text-white"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Executive Earnings Hub
              </h1>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE D1 EDGE
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium">
              Consolidated: <span class="text-indigo-300 font-semibold">Staff Management</span> &bull; <span class="text-rose-300 font-semibold">Airbnb Host Portal</span>
            </p>
          </div>
        </div>

        <!-- Mobile Quick Refresh -->
        <div class="flex md:hidden items-center gap-1.5">
          <button onclick="refreshData()" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Refresh Data">
            <i data-lucide="refresh-cw" id="mobileRefreshIcon" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Action & View Controls -->
      <div class="flex items-center flex-wrap gap-2.5 justify-between md:justify-end">
        
        <!-- Cross-Site Navigation Links -->
        <div class="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
          <a href="/" target="_blank" class="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition flex items-center gap-1.5" title="Open Staff Management Portal">
            <i data-lucide="users" class="w-3.5 h-3.5 text-indigo-400"></i>
            <span>Staff Sync</span>
          </a>
          <a href="https://airbnb-management.elitehomes-portal.workers.dev/admin.html" target="_blank" class="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition flex items-center gap-1.5" title="Open Airbnb Host Portal">
            <i data-lucide="home" class="w-3.5 h-3.5 text-rose-400"></i>
            <span>Airbnb Portal</span>
          </a>
        </div>

        <!-- Sync Button -->
        <button onclick="refreshData()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow-sm transition active:scale-95">
          <i data-lucide="refresh-cw" id="desktopRefreshIcon" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span class="hidden sm:inline">Live Refresh</span>
        </button>

        <!-- Print / PDF -->
        <button onclick="window.print()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow-sm transition active:scale-95 no-print" title="Print or Save PDF report">
          <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-400"></i>
          <span class="hidden sm:inline">Export / Print</span>
        </button>

      </div>
    </div>
  </header>

  <!-- Filter & Granularity Control Bar -->
  <section class="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
    <div class="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      
      <!-- Property Scope Filter (All vs Staff vs Airbnb) -->
      <div class="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 overflow-x-auto no-scrollbar">
        <button id="scopeAll" onclick="setPropertyScope('all')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap bg-indigo-600 text-white shadow-xs">
          <i data-lucide="layers" class="w-3.5 h-3.5"></i>
          <span>All Properties (Consolidated)</span>
        </button>
        <button id="scopeStaff" onclick="setPropertyScope('staff')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap text-slate-400 hover:text-white">
          <i data-lucide="building" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span>Staff Management (Hotel)</span>
        </button>
        <button id="scopeAirbnb" onclick="setPropertyScope('airbnb')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap text-slate-400 hover:text-white">
          <i data-lucide="home" class="w-3.5 h-3.5 text-rose-400"></i>
          <span>Airbnb Host Portal (Homestays)</span>
        </button>
      </div>

      <!-- Time Granularity Tabs (Daily, Weekly, Monthly) & Month Navigator -->
      <div class="flex items-center flex-wrap gap-2.5 justify-between lg:justify-end">
        
        <!-- View Tabs -->
        <div class="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/70">
          <button id="tabDaily" onclick="setTimeView('daily')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-indigo-600 text-white shadow-xs">
            <i data-lucide="calendar-days" class="w-3.5 h-3.5"></i>
            <span>Daily View</span>
          </button>
          <button id="tabWeekly" onclick="setTimeView('weekly')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white">
            <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>
            <span>Weekly View</span>
          </button>
          <button id="tabMonthly" onclick="setTimeView('monthly')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white">
            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
            <span>Monthly View</span>
          </button>
        </div>

        <!-- Month Selector Dropdown & Today Button -->
        <div class="flex items-center gap-1.5">
          <div class="flex items-center bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-700">
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400 mr-2"></i>
            <select id="monthSelect" onchange="onMonthSelectChange(this.value)" class="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer">
              <!-- Rendered via JS -->
            </select>
          </div>
          <button onclick="goToCurrentMonth()" class="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-indigo-400 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 transition">
            Current Month
          </button>
        </div>

      </div>

    </div>
  </section>

  <!-- Main Dashboard Content -->
  <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">

    <!-- KPI Summary Overview Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- 1. Total Revenue Card -->
      <div class="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 shadow-md relative overflow-hidden group hover:border-slate-600 transition">
        <div class="absolute -right-3 -top-3 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i data-lucide="arrow-down-left" class="w-3.5 h-3.5 text-indigo-400"></i>
            Total Revenue
          </span>
          <span id="kpiRevPeriodBadge" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300">
            This Month
          </span>
        </div>
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-xs text-indigo-400 font-bold">₹</span>
          <span id="kpiTotalRevenue" class="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">0</span>
        </div>
        <div class="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span class="flex items-center gap-1 truncate">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            Staff: <span id="kpiStaffRev" class="font-bold text-slate-200">₹0</span>
          </span>
          <span class="flex items-center gap-1 truncate">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            Airbnb: <span id="kpiAirbnbRev" class="font-bold text-slate-200">₹0</span>
          </span>
        </div>
      </div>

      <!-- 2. Total Expenses Card -->
      <div class="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 shadow-md relative overflow-hidden group hover:border-slate-600 transition">
        <div class="absolute -right-3 -top-3 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 text-amber-400"></i>
            Total Expenses
          </span>
          <span id="kpiExpPeriodBadge" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300">
            This Month
          </span>
        </div>
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-xs text-amber-400 font-bold">₹</span>
          <span id="kpiTotalExpenses" class="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">0</span>
        </div>
        <div class="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span class="flex items-center gap-1 truncate">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            Staff: <span id="kpiStaffExp" class="font-bold text-slate-200">₹0</span>
          </span>
          <span class="flex items-center gap-1 truncate">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            Airbnb: <span id="kpiAirbnbExp" class="font-bold text-slate-200">₹0</span>
          </span>
        </div>
      </div>

      <!-- 3. Net Profit Card -->
      <div class="bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-950/40 rounded-2xl p-5 border border-emerald-500/30 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition">
        <div class="absolute -right-3 -top-3 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <i data-lucide="trending-up" class="w-3.5 h-3.5 text-emerald-400"></i>
            Net Profit
          </span>
          <span id="kpiProfitBadge" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Earnings
          </span>
        </div>
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-xs text-emerald-400 font-bold">₹</span>
          <span id="kpiNetProfit" class="text-2xl sm:text-3xl font-black tracking-tight text-emerald-300 font-mono">0</span>
        </div>
        <div class="pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-xs text-slate-400">
          <span>Profit Margin</span>
          <span id="kpiProfitMargin" class="font-bold text-emerald-400 text-sm">0%</span>
        </div>
      </div>

      <!-- 4. Daily / Period Run Rate -->
      <div class="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 shadow-md relative overflow-hidden group hover:border-slate-600 transition">
        <div class="absolute -right-3 -top-3 w-20 h-20 bg-sky-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-sky-400"></i>
            Today's Snapshot
          </span>
          <span id="todayDateLabel" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/80 text-sky-300 font-mono">
            Today
          </span>
        </div>
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-xs text-sky-400 font-bold">₹</span>
          <span id="kpiTodayRevenue" class="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">0</span>
        </div>
        <div class="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>Today's Profit</span>
          <span id="kpiTodayProfit" class="font-bold text-emerald-400">₹0</span>
        </div>
      </div>

    </section>

    <!-- Visual Interactive Chart & Revenue Composition -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Main Visual Performance Chart (SVG/CSS High Performance) -->
      <div class="lg:col-span-2 bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 shadow-md flex flex-col justify-between">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="chartTitle" class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-400"></i>
              Revenue vs Expenses vs Profit
            </h2>
            <p id="chartSubtitle" class="text-xs text-slate-400 mt-0.5">Performance breakdown across periods</p>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="flex items-center gap-1.5 text-slate-300">
              <span class="w-3 h-3 rounded-sm bg-indigo-500"></span> Revenue
            </span>
            <span class="flex items-center gap-1.5 text-slate-300">
              <span class="w-3 h-3 rounded-sm bg-amber-500"></span> Expenses
            </span>
            <span class="flex items-center gap-1.5 text-slate-300">
              <span class="w-3 h-3 rounded-sm bg-emerald-500"></span> Profit
            </span>
          </div>
        </div>

        <!-- Chart Container -->
        <div id="chartContainer" class="w-full h-64 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 overflow-x-auto no-scrollbar">
          <!-- Rendered dynamically via JS -->
        </div>

        <div id="chartAxisLabels" class="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-700/70">
          <span>Oldest</span>
          <span id="chartRangeLabel" class="font-mono text-slate-300">--</span>
          <span>Newest</span>
        </div>
      </div>

      <!-- Property & Revenue Source Split -->
      <div class="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 shadow-md flex flex-col justify-between">
        <div>
          <h2 class="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <i data-lucide="pie-chart" class="w-4 h-4 text-rose-400"></i>
            Revenue Share by Entity
          </h2>
          <p class="text-xs text-slate-400 mb-4">Contribution ratio between both properties</p>

          <!-- Split Progress Bar -->
          <div class="w-full h-3 rounded-full bg-slate-700 overflow-hidden flex mb-3">
            <div id="barStaffShare" class="h-full bg-indigo-500 transition-all duration-500" style="width: 50%" title="Staff Management"></div>
            <div id="barAirbnbShare" class="h-full bg-rose-500 transition-all duration-500" style="width: 50%" title="Airbnb Host Portal"></div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="p-3 rounded-xl bg-slate-900/60 border border-indigo-900/40">
              <div class="flex items-center gap-1.5 text-xs text-indigo-400 font-bold mb-1">
                <span class="w-2 h-2 rounded-full bg-indigo-400"></span> Staff Sync
              </div>
              <div id="pctStaffShare" class="text-lg font-black text-white font-mono">50%</div>
              <div id="valStaffShare" class="text-xs text-slate-400 font-mono">₹0</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/60 border border-rose-900/40">
              <div class="flex items-center gap-1.5 text-xs text-rose-400 font-bold mb-1">
                <span class="w-2 h-2 rounded-full bg-rose-400"></span> Airbnb Portal
              </div>
              <div id="pctAirbnbShare" class="text-lg font-black text-white font-mono">50%</div>
              <div id="valAirbnbShare" class="text-xs text-slate-400 font-mono">₹0</div>
            </div>
          </div>

          <!-- Category Breakdown List -->
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category Highlights</h3>
          <div id="categoryBreakdownList" class="flex flex-col gap-2 text-xs">
            <!-- Rendered by JS -->
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>Profitability Health</span>
          <span id="healthBadge" class="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Healthy
          </span>
        </div>
      </div>

    </section>

    <!-- Main Data Table: Daily / Weekly / Monthly View -->
    <section class="bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-md overflow-hidden">
      
      <!-- Table Header Bar -->
      <div class="p-4 sm:p-5 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="tableSectionTitle" class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="table" class="w-4 h-4 text-indigo-400"></i>
            <span>Daily Ledger & Breakdown</span>
          </h2>
          <p id="tableSectionSubtitle" class="text-xs text-slate-400 mt-0.5">Click any row to expand full details and guest/expense line items</p>
        </div>

        <!-- Quick Search / Filter Input -->
        <div class="flex items-center gap-2">
          <div class="relative">
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="tableFilterInput" onkeyup="filterTable(this.value)" placeholder="Search date / note..." class="bg-slate-900 border border-slate-700 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition w-44 sm:w-56">
          </div>
        </div>
      </div>

      <!-- Responsive Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80 select-none">
            <tr>
              <th class="py-3 px-4">Period / Date</th>
              <th class="py-3 px-4 text-right">Staff Revenue</th>
              <th class="py-3 px-4 text-right">Airbnb Revenue</th>
              <th class="py-3 px-4 text-right font-black text-indigo-300">Total Revenue</th>
              <th class="py-3 px-4 text-right text-amber-300">Total Expenses</th>
              <th class="py-3 px-4 text-right font-black text-emerald-400">Net Profit</th>
              <th class="py-3 px-4 text-center">Margin</th>
              <th class="py-3 px-3 text-center no-print">Action</th>
            </tr>
          </thead>
          <tbody id="earningsTableBody" class="divide-y divide-slate-700/60 font-mono">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div id="tableEmptyState" class="hidden p-8 text-center text-slate-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
        <p class="font-bold text-sm">No records found for this period</p>
        <p class="text-xs text-slate-500">Try selecting another month or clearing search filters.</p>
      </div>

    </section>

    <!-- Recent Transactions & Logs Stream -->
    <section class="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 shadow-md">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="receipt" class="w-4 h-4 text-indigo-400"></i>
            Live Activity Stream (Latest Bookings & Expenses)
          </h2>
          <p class="text-xs text-slate-400">Recent revenue arrivals and expense records from both Cloudflare D1 databases</p>
        </div>
      </div>

      <div id="recentTxList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Rendered by JS -->
      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer class="mt-auto border-t border-slate-800 bg-slate-900/80 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>Cloudflare Edge Unified Dashboard &bull; Multi-Property Architecture</p>
      <p class="font-mono text-[11px] text-slate-400" id="lastUpdatedLabel">Connected to Cloudflare D1</p>
    </div>
  </footer>

  <!-- Detail Modal -->
  <div id="detailModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 hidden">
    <div class="bg-slate-800 rounded-2xl border border-slate-700 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div class="p-4 sm:p-5 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 id="modalTitle" class="text-base font-bold text-white">Period Breakdown</h3>
          <p id="modalSubtitle" class="text-xs text-slate-400">Itemized line items</p>
        </div>
        <button onclick="closeModal()" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <div id="modalContent" class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
        <!-- Rendered by JS -->
      </div>
      <div class="p-4 border-t border-slate-700 flex justify-end">
        <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition">
          Close
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

    // Currency Formatter
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
          // Fallback to cross-origin staff worker if hosted statically on airbnb domain
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
        // If local preview without backend, show mock or error
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
        updatedEl.innerText = 'Last updated: ' + new Date().toLocaleTimeString() + ' (Cloudflare Edge D1)';
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
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap text-slate-400 hover:text-white';
      });

      const activeBtnId = scope === 'all' ? 'scopeAll' : (scope === 'staff' ? 'scopeStaff' : 'scopeAirbnb');
      const activeBtn = document.getElementById(activeBtnId);
      if (activeBtn) {
        activeBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap bg-indigo-600 text-white shadow-xs';
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
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white';
      });

      const activeTabId = view === 'daily' ? 'tabDaily' : (view === 'weekly' ? 'tabWeekly' : 'tabMonthly');
      const activeTab = document.getElementById(activeTabId);
      if (activeTab) {
        activeTab.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-indigo-600 text-white shadow-xs';
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

      // Profit Styling
      const netProfitEl = document.getElementById('kpiNetProfit');
      if (profit < 0) {
        netProfitEl.className = 'text-2xl sm:text-3xl font-black tracking-tight text-rose-400 font-mono';
      } else {
        netProfitEl.className = 'text-2xl sm:text-3xl font-black tracking-tight text-emerald-300 font-mono';
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

      // Category breakdown list
      const catList = document.getElementById('categoryBreakdownList');
      if (catList && rawPayload.breakdowns) {
        const revCat = rawPayload.breakdowns.revenueByCategory || {};
        catList.innerHTML = \`
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/40">
            <span class="text-slate-300 flex items-center gap-1.5"><i data-lucide="bed" class="w-3.5 h-3.5 text-indigo-400"></i> Hotel Lodging</span>
            <span class="font-mono font-bold text-slate-200">₹\${formatINR(revCat.lodging || 0)}</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/40">
            <span class="text-slate-300 flex items-center gap-1.5"><i data-lucide="utensils" class="w-3.5 h-3.5 text-amber-400"></i> Food & Restaurant</span>
            <span class="font-mono font-bold text-slate-200">₹\${formatINR(revCat.fooding || 0)}</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/40">
            <span class="text-slate-300 flex items-center gap-1.5"><i data-lucide="home" class="w-3.5 h-3.5 text-rose-400"></i> Airbnb Homestays</span>
            <span class="font-mono font-bold text-slate-200">₹\${formatINR(revCat.airbnbHomestays || 0)}</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/40">
            <span class="text-slate-300 flex items-center gap-1.5"><i data-lucide="sparkles" class="w-3.5 h-3.5 text-emerald-400"></i> Services & Salon</span>
            <span class="font-mono font-bold text-slate-200">₹\${formatINR(revCat.services || 0)}</span>
          </div>
        \`;
      }
    }

    function renderChart() {
      if (!rawPayload) return;
      const container = document.getElementById('chartContainer');
      if (!container) return;

      let items = [];
      let labelPrefix = '';

      if (activeTimeView === 'daily') {
        // Daily records reversed to show chronological order (oldest to newest)
        items = [...rawPayload.daily].reverse();
        labelPrefix = 'Day ';
        document.getElementById('chartTitle').innerHTML = '<i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-400"></i> Daily Performance Trend (' + activeMonth + ')';
        document.getElementById('chartSubtitle').innerText = 'Day-by-day revenue, expenses, and net earnings';
      } else if (activeTimeView === 'weekly') {
        items = [...rawPayload.weekly].reverse();
        labelPrefix = 'W';
        document.getElementById('chartTitle').innerHTML = '<i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-400"></i> Weekly Performance Overview';
        document.getElementById('chartSubtitle').innerText = 'Aggregated performance week-over-week';
      } else {
        items = [...rawPayload.monthly].reverse();
        labelPrefix = '';
        document.getElementById('chartTitle').innerHTML = '<i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-400"></i> Monthly Financial Trajectory';
        document.getElementById('chartSubtitle').innerText = 'Historical monthly comparison across all available records';
      }

      if (items.length === 0) {
        container.innerHTML = '<div class="m-auto text-xs text-slate-500">No chart data available for this selection</div>';
        return;
      }

      // Find max value for scaling
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

      const barsHtml = items.map((it, idx) => {
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

        const revHeight = Math.max(4, Math.round((rev / maxVal) * 200));
        const expHeight = Math.max(4, Math.round((exp / maxVal) * 200));
        const profitHeight = Math.max(4, Math.round((Math.max(0, profit) / maxVal) * 200));

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
          <div class="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer min-w-[20px] max-w-[42px]" title="\${tooltip}">
            <!-- Bar Group -->
            <div class="w-full flex items-end justify-center gap-0.5">
              <div class="w-2 sm:w-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-t-sm transition-all" style="height: \${revHeight}px"></div>
              <div class="w-2 sm:w-2.5 bg-amber-500 hover:bg-amber-400 rounded-t-sm transition-all" style="height: \${expHeight}px"></div>
              <div class="w-2 sm:w-2.5 \${profit >= 0 ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'} rounded-t-sm transition-all" style="height: \${profitHeight}px"></div>
            </div>
            <!-- Axis Label -->
            <span class="text-[9px] font-mono text-slate-500 mt-1.5 truncate group-hover:text-slate-200 transition select-none">
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
        if (titleEl) titleEl.innerHTML = '<i data-lucide="calendar-days" class="w-4 h-4 text-indigo-400"></i> Daily Ledger (' + activeMonth + ')';
        if (subEl) subEl.innerText = 'Detailed day-by-day record of sales, room bookings, payouts and expenses';
      } else if (activeTimeView === 'weekly') {
        records = rawPayload.weekly;
        if (titleEl) titleEl.innerHTML = '<i data-lucide="calendar-range" class="w-4 h-4 text-indigo-400"></i> Weekly Summary';
        if (subEl) subEl.innerText = 'Consolidated weekly earnings progression and totals';
      } else {
        records = rawPayload.monthly;
        if (titleEl) titleEl.innerHTML = '<i data-lucide="calendar" class="w-4 h-4 text-indigo-400"></i> Month-by-Month Archive';
        if (subEl) subEl.innerText = 'Full historical monthly performance metrics across all properties';
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
              <span class="w-7 text-slate-400 font-sans font-bold text-[10px] uppercase">\${r.dayOfWeek}</span>
              <span class="font-bold text-white">\${r.date}</span>
              \${isToday ? '<span class="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-sans font-bold border border-emerald-500/30">TODAY</span>' : ''}
            </div>
          \`;
        } else if (activeTimeView === 'weekly') {
          periodLabel = \`
            <div>
              <span class="font-bold text-white font-sans">\${r.weekLabel}</span>
              <span class="text-[10px] text-slate-400 block font-mono">\${r.startDate} to \${r.endDate}</span>
            </div>
          \`;
        } else {
          periodLabel = \`
            <div class="flex items-center gap-2">
              <span class="font-bold text-white font-sans text-sm">\${r.monthLabel}</span>
              <span class="text-[10px] font-mono text-slate-400">(\${r.month})</span>
            </div>
          \`;
        }

        const profitClass = netProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
        const marginClass = margin >= 30 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : (margin >= 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30');

        return \`
          <tr class="hover:bg-slate-700/40 transition group cursor-pointer" onclick="showDetailModal('\${activeTimeView}', \${idx})">
            <td class="py-3 px-4 whitespace-nowrap">\${periodLabel}</td>
            <td class="py-3 px-4 text-right text-indigo-300">₹\${formatINR(staffRev)}</td>
            <td class="py-3 px-4 text-right text-rose-300">₹\${formatINR(airbnbRev)}</td>
            <td class="py-3 px-4 text-right font-black text-white">₹\${formatINR(totRev)}</td>
            <td class="py-3 px-4 text-right text-amber-300">₹\${formatINR(totExp)}</td>
            <td class="py-3 px-4 text-right \${profitClass}">₹\${formatINR(netProfit)}</td>
            <td class="py-3 px-4 text-center">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-sans \${marginClass}">
                \${margin}%
              </span>
            </td>
            <td class="py-3 px-3 text-center no-print">
              <button class="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 group-hover:text-white transition">
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
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
        container.innerHTML = '<div class="col-span-full text-center text-xs text-slate-500 py-4">No recent activity</div>';
        return;
      }

      container.innerHTML = txs.slice(0, 12).map(tx => {
        const isIncome = tx.flow === 'income';
        const isAirbnb = tx.source === 'Airbnb Host Portal';
        const icon = isIncome ? (isAirbnb ? 'home' : 'arrow-down-left') : 'arrow-up-right';
        const iconBg = isIncome ? (isAirbnb ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30') : 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
        const amountColor = isIncome ? 'text-emerald-400' : 'text-amber-400';

        return \`
          <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70 flex items-start gap-3 hover:border-slate-600 transition">
            <div class="w-8 h-8 rounded-lg \${iconBg} flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="\${icon}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <span class="text-[10px] font-bold px-1.5 py-0.2 rounded-md \${isAirbnb ? 'bg-rose-950/60 text-rose-300' : 'bg-indigo-950/60 text-indigo-300'} font-sans truncate">
                  \${tx.property}
                </span>
                <span class="text-[10px] text-slate-400 font-mono shrink-0">\${tx.date}</span>
              </div>
              <p class="text-xs font-semibold text-white truncate" title="\${tx.title}">\${tx.title}</p>
              \${tx.details ? \`<p class="text-[11px] text-slate-400 truncate">\${tx.details}</p>\` : ''}
              <div class="mt-1 flex items-center justify-between">
                <span class="text-[10px] text-slate-400">\${tx.source}</span>
                <span class="text-xs font-black font-mono \${amountColor}">
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
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-2">
              <div>
                <span class="font-bold text-white text-xs block">\${b.guestName}</span>
                <span class="text-[11px] text-slate-400">\${b.property} &bull; \${b.platform} &bull; \${b.nights} night(s)</span>
              </div>
              <span class="text-xs font-black font-mono text-emerald-400">+₹\${formatINR(b.payout)}</span>
            </div>
          \`).join('');
        } else {
          airbnbItemsHtml = '<p class="text-xs text-slate-500 italic">No Airbnb check-in bookings on this day.</p>';
        }

        let airbnbExpHtml = '';
        if (record.airbnbExpenseItems && record.airbnbExpenseItems.length > 0) {
          airbnbExpHtml = record.airbnbExpenseItems.map(e => \`
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-2">
              <div>
                <span class="font-bold text-white text-xs block">\${e.title}</span>
                <span class="text-[11px] text-slate-400">\${e.category} &bull; \${e.property}</span>
              </div>
              <span class="text-xs font-black font-mono text-amber-400">-₹\${formatINR(e.amount)}</span>
            </div>
          \`).join('');
        } else {
          airbnbExpHtml = '<p class="text-xs text-slate-500 italic">No Airbnb expenses on this day.</p>';
        }

        let staffNotesHtml = '';
        if (record.staffExpenseNotes && record.staffExpenseNotes.length > 0) {
          staffNotesHtml = record.staffExpenseNotes.map(n => \`
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-700 text-xs text-slate-300">
              \${n}
            </div>
          \`).join('');
        }

        content.innerHTML = \`
          <!-- Financial Snapshot -->
          <div class="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-slate-900 border border-slate-700">
            <div>
              <span class="text-[10px] text-slate-400 block uppercase">Total Revenue</span>
              <span class="text-sm font-black text-white font-mono">₹\${formatINR(record.totalRevenue)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block uppercase">Total Expenses</span>
              <span class="text-sm font-black text-amber-400 font-mono">₹\${formatINR(record.totalExpenses)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block uppercase">Net Profit</span>
              <span class="text-sm font-black \${record.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono">₹\${formatINR(record.netProfit)}</span>
            </div>
          </div>

          <!-- Staff Management Section -->
          <div>
            <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i data-lucide="building" class="w-3.5 h-3.5"></i> Staff Management Operations
            </h4>
            <div class="grid grid-cols-2 gap-2 text-xs mb-2">
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-700 flex justify-between">
                <span class="text-slate-400">Lodging Sales:</span>
                <span class="font-bold text-slate-200 font-mono">₹\${formatINR(record.staffLodging)}</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-700 flex justify-between">
                <span class="text-slate-400">Food & Restaurant:</span>
                <span class="font-bold text-slate-200 font-mono">₹\${formatINR(record.staffFooding)}</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-700 flex justify-between">
                <span class="text-slate-400">Services & Salon:</span>
                <span class="font-bold text-slate-200 font-mono">₹\${formatINR(record.staffServices)}</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-700 flex justify-between">
                <span class="text-slate-400">Operational Exp:</span>
                <span class="font-bold text-amber-400 font-mono">₹\${formatINR(record.staffExpenses)}</span>
              </div>
            </div>
            \${staffNotesHtml}
          </div>

          <!-- Airbnb Section -->
          <div>
            <h4 class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i data-lucide="home" class="w-3.5 h-3.5"></i> Airbnb Host Portal Bookings
            </h4>
            <div class="space-y-1.5 mb-3">
              \${airbnbItemsHtml}
            </div>

            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-700">
              <span class="text-slate-400 block mb-1">Staff Management Revenue:</span>
              <span class="text-base font-bold text-indigo-400 font-mono">₹\${formatINR(record.staffRevenue)}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-700">
              <span class="text-slate-400 block mb-1">Airbnb Host Revenue:</span>
              <span class="text-base font-bold text-rose-400 font-mono">₹\${formatINR(record.airbnbRevenue)}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-700">
              <span class="text-slate-400 block mb-1">Staff Management Expenses:</span>
              <span class="text-base font-bold text-amber-400 font-mono">₹\${formatINR(record.staffExpenses)}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-700">
              <span class="text-slate-400 block mb-1">Airbnb Host Expenses:</span>
              <span class="text-base font-bold text-amber-400 font-mono">₹\${formatINR(record.airbnbExpenses)}</span>
            </div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 text-center">
            <span class="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Total Net Profit</span>
            <span class="text-2xl font-black text-emerald-400 font-mono">₹\${formatINR(record.netProfit)}</span>
            <span class="text-xs text-emerald-300 block mt-1 font-bold">Profit Margin: \${record.profitMargin}%</span>
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

    // Initialize on window load
    window.addEventListener('DOMContentLoaded', () => {
      loadData();
    });
  </script>
</body>
</html>`;
}
