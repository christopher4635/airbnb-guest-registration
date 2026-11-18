import type { BookingComSettings, Env, Room, RoomBooking } from "./types";

const XSQUARE_PROPERTY_ID = "xsquare-hotel";
const SETTINGS_KEY = "booking_com_settings";

type SyncLodgingFn = (env: Env, propertyId: string, date: string, submittedBy?: string) => Promise<any>;

export interface ParsedBookingComEvent {
	externalBookingId: string;
	reservationCode?: string;
	roomCategory: "suite" | "double" | "twin";
	preferredUnit?: 1 | 2;
	roomLabel?: string;
	checkInDate: string;
	checkOutDate: string;
	guestName: string;
	guestPhone?: string;
	guestCount: number;
	totalAmount?: number | null;
	paymentMode?: "online" | "cash";
	status: "confirmed" | "cancelled";
	notes?: string;
	sourceType: "ical" | "webhook" | "paste";
}

function generateWebhookSecret(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
	return `bcom_${hex}`;
}

export async function getBookingComSettings(env: Env): Promise<BookingComSettings> {
	const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key = ?")
		.bind(SETTINGS_KEY)
		.first<{ value: string }>();

	let parsed: Partial<BookingComSettings> = {};
	if (row?.value) {
		try {
			parsed = JSON.parse(row.value);
		} catch {
			parsed = {};
		}
	}

	let secret = (parsed.webhook_secret || "").trim();
	let needsSave = false;
	if (!secret) {
		secret = generateWebhookSecret();
		needsSave = true;
	}

	const settings: BookingComSettings = {
		enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
		suite_ical_url: (parsed.suite_ical_url || "").trim(),
		double_ical_url: (parsed.double_ical_url || "").trim(),
		double_2_ical_url: (parsed.double_2_ical_url || "").trim(),
		twin_ical_url: (parsed.twin_ical_url || "").trim(),
		webhook_secret: secret,
		auto_cancel_removed: parsed.auto_cancel_removed !== undefined ? Boolean(parsed.auto_cancel_removed) : true,
		default_payment_mode: parsed.default_payment_mode === "cash" ? "cash" : "online",
		last_synced_at: parsed.last_synced_at || "",
		last_sync_summary: parsed.last_sync_summary || "",
		last_sync_error: parsed.last_sync_error || "",
		updated_at: parsed.updated_at || "",
	};

	if (needsSave) {
		await saveBookingComSettings(env, settings);
	}

	return settings;
}

export async function saveBookingComSettings(
	env: Env,
	partial: Partial<BookingComSettings>
): Promise<BookingComSettings> {
	const existingRow = await env.DB.prepare("SELECT value FROM app_settings WHERE key = ?")
		.bind(SETTINGS_KEY)
		.first<{ value: string }>();
	let current: Partial<BookingComSettings> = {};
	if (existingRow?.value) {
		try {
			current = JSON.parse(existingRow.value);
		} catch {
			current = {};
		}
	}

	const merged: BookingComSettings = {
		enabled: partial.enabled !== undefined ? Boolean(partial.enabled) : (current.enabled !== undefined ? Boolean(current.enabled) : true),
		suite_ical_url: partial.suite_ical_url !== undefined ? String(partial.suite_ical_url).trim() : (current.suite_ical_url || ""),
		double_ical_url: partial.double_ical_url !== undefined ? String(partial.double_ical_url).trim() : (current.double_ical_url || ""),
		double_2_ical_url: partial.double_2_ical_url !== undefined ? String(partial.double_2_ical_url).trim() : (current.double_2_ical_url || ""),
		twin_ical_url: partial.twin_ical_url !== undefined ? String(partial.twin_ical_url).trim() : (current.twin_ical_url || ""),
		webhook_secret: (partial.webhook_secret || current.webhook_secret || generateWebhookSecret()).trim(),
		auto_cancel_removed: partial.auto_cancel_removed !== undefined ? Boolean(partial.auto_cancel_removed) : (current.auto_cancel_removed !== undefined ? Boolean(current.auto_cancel_removed) : true),
		default_payment_mode: partial.default_payment_mode === "cash"
			? "cash"
			: (partial.default_payment_mode === "online"
				? "online"
				: (current.default_payment_mode === "cash" ? "cash" : "online")),
		last_synced_at: partial.last_synced_at !== undefined ? partial.last_synced_at : (current.last_synced_at || ""),
		last_sync_summary: partial.last_sync_summary !== undefined ? partial.last_sync_summary : (current.last_sync_summary || ""),
		last_sync_error: partial.last_sync_error !== undefined ? partial.last_sync_error : (current.last_sync_error || ""),
		updated_at: new Date().toISOString(),
	};

	await env.DB.prepare(`
		INSERT INTO app_settings (key, value, updated_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
	`).bind(SETTINGS_KEY, JSON.stringify(merged)).run();

	return merged;
}

export async function regenerateBookingComSecret(env: Env): Promise<BookingComSettings> {
	return saveBookingComSettings(env, { webhook_secret: generateWebhookSecret() });
}

// =============================================================================
// ROOM MAPPING: Suite -> 101, Double -> 102/103 (Smart Auto), Twin -> 104
// =============================================================================

export function detectBookingComRoomCategory(rawRoomText: string): {
	category: "suite" | "double" | "twin" | null;
	preferredUnit?: 1 | 2;
} {
	const text = (rawRoomText || "").toLowerCase().trim();
	if (!text) return { category: null };

	if (text.includes("101") || /\bsuite\b/i.test(text)) {
		return { category: "suite" };
	}
	if (text.includes("104") || /\btwin\b/i.test(text)) {
		return { category: "twin" };
	}
	if (text.includes("103") || text.includes("double 2") || text.includes("double-2") || text.includes("double #2")) {
		return { category: "double", preferredUnit: 2 };
	}
	if (text.includes("102") || /\bdouble\b/i.test(text)) {
		return { category: "double", preferredUnit: 1 };
	}
	return { category: null };
}

export function enumerateStayDates(checkIn: string, checkOut: string): string[] {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) return [];
	const dates: string[] = [];
	const cur = new Date(checkIn + "T00:00:00Z");
	const end = /^\d{4}-\d{2}-\d{2}$/.test(checkOut) ? new Date(checkOut + "T00:00:00Z") : new Date(checkIn + "T00:00:00Z");

	let safety = 0;
	while (cur < end && safety < 90) {
		dates.push(cur.toISOString().split("T")[0]);
		cur.setUTCDate(cur.getUTCDate() + 1);
		safety++;
	}
	if (dates.length === 0) {
		dates.push(checkIn);
	}
	return dates;
}

export async function resolveXsquareRoomForBookingCom(
	env: Env,
	category: "suite" | "double" | "twin",
	stayDates: string[],
	externalBookingId?: string,
	preferredUnit?: 1 | 2
): Promise<Room | null> {
	const { results: roomRows } = await env.DB.prepare(
		"SELECT * FROM rooms WHERE property_id = ? AND active = 1 ORDER BY room_number ASC"
	).bind(XSQUARE_PROPERTY_ID).all<Room>();

	const rooms = roomRows || [];
	if (rooms.length === 0) return null;

	const findByNumberOrType = (num: string, typeKeyword: string) =>
		rooms.find((r) => String(r.room_number).trim() === num) ||
		rooms.find((r) => (r.room_type || "").toLowerCase().includes(typeKeyword));

	if (category === "suite") {
		return findByNumberOrType("101", "suite") || rooms[0];
	}

	if (category === "twin") {
		return findByNumberOrType("104", "twin") || rooms[rooms.length - 1];
	}

	// Category === "double" -> Room 102 or Room 103
	const room102 = rooms.find((r) => String(r.room_number).trim() === "102");
	const room103 = rooms.find((r) => String(r.room_number).trim() === "103");
	const doubleCandidates = [room102, room103].filter((r): r is Room => Boolean(r));
	if (doubleCandidates.length === 0) {
		const fallback = rooms.find((r) => (r.room_type || "").toLowerCase().includes("double"));
		return fallback || rooms[0];
	}
	if (doubleCandidates.length === 1) {
		return doubleCandidates[0];
	}

	// 1. If this externalBookingId is already assigned to 102 or 103, keep its existing room for stability
	if (externalBookingId) {
		const existing = await env.DB.prepare(
			"SELECT room_id FROM room_bookings WHERE property_id = ? AND external_booking_id = ? LIMIT 1"
		).bind(XSQUARE_PROPERTY_ID, externalBookingId).first<{ room_id: string }>();
		if (existing?.room_id) {
			const matched = doubleCandidates.find((r) => r.id === existing.room_id);
			if (matched) return matched;
		}
	}

	// 2. Check availability on stayDates for 102 vs 103 (excluding self)
	const orderedCandidates = preferredUnit === 2 && room103 && room102
		? [room103, room102]
		: [room102!, room103!];

	if (stayDates.length === 0) return orderedCandidates[0];

	const placeholders = stayDates.map(() => "?").join(", ");
	const conflictCounts: { room: Room; conflicts: number }[] = [];

	for (const candidate of orderedCandidates) {
		const query = externalBookingId
			? `SELECT COUNT(*) AS cnt FROM room_bookings WHERE property_id = ? AND room_id = ? AND date IN (${placeholders}) AND (external_booking_id IS NULL OR external_booking_id != ?)`
			: `SELECT COUNT(*) AS cnt FROM room_bookings WHERE property_id = ? AND room_id = ? AND date IN (${placeholders})`;
		const bindings = externalBookingId
			? [XSQUARE_PROPERTY_ID, candidate.id, ...stayDates, externalBookingId]
			: [XSQUARE_PROPERTY_ID, candidate.id, ...stayDates];
		const res = await env.DB.prepare(query).bind(...bindings).first<{ cnt: number }>();
		conflictCounts.push({ room: candidate, conflicts: Number(res?.cnt || 0) });
	}

	// Prefer completely free room first; otherwise pick room with fewer bookings
	const free = conflictCounts.find((c) => c.conflicts === 0);
	if (free) return free.room;

	conflictCounts.sort((a, b) => a.conflicts - b.conflicts);
	return conflictCounts[0].room;
}

// =============================================================================
// UPSERT RESERVATION INTO D1 room_bookings (Preserves Staff Edits!)
// =============================================================================

function isGenericPlaceholderName(name: string | null | undefined): boolean {
	const n = (name || "").trim().toLowerCase();
	if (!n) return true;
	return (
		n === "booking.com guest" ||
		n === "booking.com reservation" ||
		n === "closed - not available" ||
		n === "not available" ||
		n === "guest" ||
		n === "walk-in" ||
		n.startsWith("booking.com (")
	);
}

export async function upsertBookingComReservation(
	env: Env,
	evt: ParsedBookingComEvent,
	syncDailyFinanceLodgingFn: SyncLodgingFn
): Promise<{
	action: "created" | "updated" | "cancelled" | "skipped";
	roomNumber?: string;
	roomId?: string;
	datesAffected: string[];
	bookingIds: string[];
	totalAmount?: number;
}> {
	const affectedDates = new Set<string>();
	const externalId = evt.externalBookingId;

	// Fetch any existing rows for this external booking
	const { results: existingRows } = await env.DB.prepare(
		"SELECT * FROM room_bookings WHERE property_id = ? AND external_booking_id = ? ORDER BY date ASC"
	).bind(XSQUARE_PROPERTY_ID, externalId).all<RoomBooking>();
	const existing = existingRows || [];

	// Handle Cancellation
	if (evt.status === "cancelled") {
		if (existing.length === 0) {
			return { action: "skipped", datesAffected: [], bookingIds: [] };
		}
		for (const r of existing) affectedDates.add(r.date);
		await env.DB.prepare(
			"DELETE FROM room_bookings WHERE property_id = ? AND external_booking_id = ?"
		).bind(XSQUARE_PROPERTY_ID, externalId).run();

		for (const d of affectedDates) {
			await syncDailyFinanceLodgingFn(env, XSQUARE_PROPERTY_ID, d, "Booking.com Sync");
		}
		return {
			action: "cancelled",
			datesAffected: Array.from(affectedDates),
			bookingIds: [],
		};
	}

	const stayDates = enumerateStayDates(evt.checkInDate, evt.checkOutDate);
	if (stayDates.length === 0) {
		return { action: "skipped", datesAffected: [], bookingIds: [] };
	}

	const targetRoom = await resolveXsquareRoomForBookingCom(
		env,
		evt.roomCategory,
		stayDates,
		externalId,
		evt.preferredUnit
	);
	if (!targetRoom) {
		throw new Error(`Could not find an active Xsquare Hotel room for Booking.com category '${evt.roomCategory}'`);
	}

	const settings = await getBookingComSettings(env);
	const defaultNightlyRate = Number(targetRoom.base_price) || (
		evt.roomCategory === "suite" ? 3000 : evt.roomCategory === "twin" ? 2500 : 2000
	);

	// Preserve staff-enriched details when re-syncing an existing iCal record
	const firstExisting = existing[0];
	const existingDates = existing.map((r) => r.date).sort();
	const sameSpanAndRoom =
		existing.length === stayDates.length &&
		existing.every((r, idx) => r.date === stayDates[idx] && r.room_id === targetRoom.id);

	// If identical iCal record already exists and nothing changed, skip rewriting to preserve all staff edits!
	if (evt.sourceType === "ical" && sameSpanAndRoom) {
		return {
			action: "skipped",
			roomNumber: targetRoom.room_number,
			roomId: targetRoom.id,
			datesAffected: [],
			bookingIds: existing.map((r) => r.id),
			totalAmount: existing.reduce((s, r) => s + Number(r.amount || 0), 0),
		};
	}

	const preservedGuestName =
		firstExisting && !isGenericPlaceholderName(firstExisting.guest_name) && isGenericPlaceholderName(evt.guestName)
			? firstExisting.guest_name!
			: (evt.guestName || firstExisting?.guest_name || "Booking.com Guest");

	const preservedPhone = evt.guestPhone || firstExisting?.guest_phone || null;
	const preservedGuestCount = evt.guestCount > 1
		? evt.guestCount
		: Math.max(1, Number(firstExisting?.guest_count || evt.guestCount || 1));
	const preservedGuestsJson = firstExisting?.guests_json || (preservedGuestName ? JSON.stringify([preservedGuestName]) : null);
	const preservedIdImage = firstExisting?.guest_id_image || null;
	const preservedIsGst = firstExisting?.is_gst || 0;
	const preservedGstRate = firstExisting?.gst_rate ?? 5.0;
	const preservedGuestGstin = firstExisting?.guest_gstin || null;
	const preservedCompanyName = firstExisting?.company_name || null;
	const preservedInvoiceNo = firstExisting?.invoice_number || null;

	// Compute total stay amount
	const existingTotal = existing.reduce((s, r) => s + Number(r.amount || 0), 0);
	let totalAmount = 0;
	if (evt.totalAmount && evt.totalAmount > 0) {
		totalAmount = Math.round(evt.totalAmount);
	} else if (existingTotal > 0 && existing.length === stayDates.length) {
		totalAmount = existingTotal;
	} else {
		totalAmount = defaultNightlyRate * stayDates.length;
	}

	const paymentMode: "online" | "cash" | "split" =
		firstExisting?.payment_mode && evt.sourceType === "ical"
			? firstExisting.payment_mode
			: (evt.paymentMode || settings.default_payment_mode || "online");

	const dailyAmount = Math.round(totalAmount / stayDates.length);

	// Remove previous rows for this external booking (if updating dates or enriching from webhook)
	for (const r of existing) affectedDates.add(r.date);
	if (existing.length > 0) {
		await env.DB.prepare(
			"DELETE FROM room_bookings WHERE property_id = ? AND external_booking_id = ?"
		).bind(XSQUARE_PROPERTY_ID, externalId).run();
	}

	const groupBookingId = stayDates.length > 1
		? (firstExisting?.group_booking_id || `grp_bcom_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`)
		: null;

	const notesParts = [
		`[Booking.com · ${evt.roomCategory.charAt(0).toUpperCase() + evt.roomCategory.slice(1)}]`,
		evt.reservationCode ? `Conf #${evt.reservationCode}` : "",
		evt.notes || "",
	].filter(Boolean);
	const notesText = notesParts.join(" · ");

	const createdIds: string[] = [];
	const randSuffix = Math.random().toString(36).substring(2, 6);

	for (let i = 0; i < stayDates.length; i++) {
		const d = stayDates[i];
		affectedDates.add(d);
		const isLast = i === stayDates.length - 1;
		const dayAmt = Math.max(0, isLast ? totalAmount - dailyAmount * (stayDates.length - 1) : dailyAmount);
		const dayCash = paymentMode === "cash" ? dayAmt : 0;
		const dayOnline = paymentMode === "cash" ? 0 : dayAmt;
		const dayGstAmt = preservedIsGst ? Math.round(dayAmt * (preservedGstRate / 100) * 100) / 100 : 0;

		const slotRow = await env.DB.prepare(
			"SELECT COUNT(*) AS cnt FROM room_bookings WHERE room_id = ? AND date = ?"
		).bind(targetRoom.id, d).first<{ cnt: number }>();
		const slotNumber = (slotRow?.cnt || 0) + 1;

		const id = `bk_bcom_${Date.now().toString(36)}_${randSuffix}_${i + 1}`;
		createdIds.push(id);

		await env.DB.prepare(`
			INSERT INTO room_bookings (
				id, property_id, room_id, date, amount, payment_mode, cash_amount, online_amount,
				guest_name, guest_phone, guest_count, guests_json, guest_id_image, notes, slot_number,
				group_booking_id, check_in_date, check_out_date, total_stay_amount,
				external_booking_id, platform, is_gst, gst_rate, gst_amount,
				guest_gstin, company_name, invoice_number,
				created_by, created_at, updated_at
			) VALUES (
				?, ?, ?, ?, ?, ?, ?, ?,
				?, ?, ?, ?, ?, ?, ?,
				?, ?, ?, ?,
				?, 'Booking.com', ?, ?, ?,
				?, ?, ?,
				'Booking.com Sync', datetime('now'), datetime('now')
			)
		`).bind(
			id, XSQUARE_PROPERTY_ID, targetRoom.id, d, dayAmt, paymentMode, dayCash, dayOnline,
			preservedGuestName, preservedPhone, preservedGuestCount, preservedGuestsJson, preservedIdImage, notesText || null, slotNumber,
			groupBookingId, evt.checkInDate, evt.checkOutDate, totalAmount,
			externalId, preservedIsGst, preservedGstRate, dayGstAmt,
			preservedGuestGstin, preservedCompanyName, preservedInvoiceNo
		).run();
	}

	for (const d of affectedDates) {
		await syncDailyFinanceLodgingFn(env, XSQUARE_PROPERTY_ID, d, "Booking.com Sync");
	}

	return {
		action: existing.length > 0 ? "updated" : "created",
		roomNumber: targetRoom.room_number,
		roomId: targetRoom.id,
		datesAffected: Array.from(affectedDates),
		bookingIds: createdIds,
		totalAmount,
	};
}

// =============================================================================
// RFC 5545 iCAL PARSER & BOOKING.COM FEED SYNC
// =============================================================================

function parseIcsDate(rawVal: string | null): string | null {
	if (!rawVal) return null;
	const val = rawVal.split(":").pop() || rawVal;
	const m = val.trim().match(/^(\d{4})(\d{2})(\d{2})/);
	if (!m) return null;
	return `${m[1]}-${m[2]}-${m[3]}`;
}

function extractIcsProp(block: string, prop: string): string | null {
	const rx = new RegExp(`^${prop}(?:;[^:]*)?:(.*)$`, "im");
	const m = block.match(rx);
	if (!m) return null;
	return m[1]
		.trim()
		.replace(/\\n/gi, "\n")
		.replace(/\\,/g, ",")
		.replace(/\\;/g, ";")
		.replace(/\\\\/g, "\\");
}

function sanitizeUid(uid: string): string {
	return uid.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export function parseBookingComIcsFeed(
	icsText: string,
	roomCategory: "suite" | "double" | "twin",
	sourceTag: string,
	preferredUnit?: 1 | 2
): ParsedBookingComEvent[] {
	if (!icsText || !icsText.includes("BEGIN:VCALENDAR")) return [];

	// RFC 5545 line unfolding
	const unfolded = icsText.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
	const eventBlocks = unfolded.split("BEGIN:VEVENT").slice(1);
	const events: ParsedBookingComEvent[] = [];

	for (const rawBlock of eventBlocks) {
		const block = rawBlock.split("END:VEVENT")[0] || "";
		const uid = extractIcsProp(block, "UID");
		const dtStart = parseIcsDate(extractIcsProp(block, "DTSTART"));
		const dtEnd = parseIcsDate(extractIcsProp(block, "DTEND"));
		const summary = extractIcsProp(block, "SUMMARY") || "";
		const description = extractIcsProp(block, "DESCRIPTION") || "";
		const statusRaw = (extractIcsProp(block, "STATUS") || "").toUpperCase();

		if (!dtStart) continue;
		const effectiveCheckOut = dtEnd && dtEnd > dtStart ? dtEnd : dtStart;

		const isCancelled = statusRaw === "CANCELLED" || /cancel/i.test(summary);
		const safeUid = sanitizeUid(uid || `${dtStart}_${effectiveCheckOut}_${sourceTag}`);
		const externalBookingId = `bcom_ical_${sourceTag}_${safeUid}`;

		// Try to extract guest name, confirmation code, price, phone from summary/description if Booking.com included them
		let guestName = "Booking.com Guest";
		const sumClean = summary.replace(/^CLOSED\s*-\s*Not\s*available/i, "").trim();
		if (sumClean && !/^not\s*available$/i.test(sumClean) && !/^closed$/i.test(sumClean)) {
			const cleanedGuest = sumClean
				.replace(/^Booking\.com\s*[-:]?\s*/i, "")
				.replace(/^Reservation\s*[-:]?\s*/i, "")
				.trim();
			if (cleanedGuest && cleanedGuest.length >= 2) {
				guestName = cleanedGuest;
			}
		}

		const codeMatch =
			description.match(/(?:Reservation|Confirmation|Booking)\s*(?:Code|ID|Number|#)?[:#\s]+([A-Z0-9-]{5,20})/i) ||
			summary.match(/#([A-Z0-9-]{5,20})/i);
		const reservationCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;

		const phoneMatch = description.match(/Phone(?:\s*Number)?[^:]*:\s*([+\d][\d\s-]{7,16})/i);
		const guestPhone = phoneMatch ? phoneMatch[1].trim() : undefined;

		const guestsMatch = description.match(/(?:Guests?|Adults?|Persons?)[^:]*:\s*(\d+)/i);
		const guestCount = guestsMatch ? Math.max(1, parseInt(guestsMatch[1], 10) || 1) : 1;

		let totalAmount: number | null = null;
		const priceMatch = description.match(/(?:Total\s*Price|Price|Payout|Amount)[^:]*:\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
		if (priceMatch) {
			const parsed = parseFloat(priceMatch[1].replace(/,/g, ""));
			if (parsed > 0) totalAmount = parsed;
		}

		events.push({
			externalBookingId,
			reservationCode,
			roomCategory,
			preferredUnit,
			checkInDate: dtStart,
			checkOutDate: effectiveCheckOut,
			guestName,
			guestPhone,
			guestCount,
			totalAmount,
			status: isCancelled ? "cancelled" : "confirmed",
			notes: summary && !/^CLOSED/i.test(summary) ? summary.slice(0, 120) : undefined,
			sourceType: "ical",
		});
	}

	return events;
}

export async function syncBookingComIcals(
	env: Env,
	syncDailyFinanceLodgingFn: SyncLodgingFn
): Promise<{
	success: boolean;
	configuredFeeds: number;
	created: number;
	updated: number;
	cancelled: number;
	skipped: number;
	errors: string[];
	lastSyncedAt: string;
	summary: string;
}> {
	const settings = await getBookingComSettings(env);
	const nowIso = new Date().toISOString();
	const todayIso = nowIso.split("T")[0];

	if (!settings.enabled) {
		return {
			success: true,
			configuredFeeds: 0,
			created: 0,
			updated: 0,
			cancelled: 0,
			skipped: 0,
			errors: [],
			lastSyncedAt: nowIso,
			summary: "Booking.com sync is paused",
		};
	}

	const feeds: {
		label: string;
		url: string;
		category: "suite" | "double" | "twin";
		sourceTag: string;
		preferredUnit?: 1 | 2;
	}[] = [];

	if (settings.suite_ical_url) {
		feeds.push({ label: "Suite (Room 101)", url: settings.suite_ical_url, category: "suite", sourceTag: "suite" });
	}
	if (settings.double_ical_url) {
		feeds.push({ label: "Double (Room 102/103)", url: settings.double_ical_url, category: "double", sourceTag: "double", preferredUnit: 1 });
	}
	if (settings.double_2_ical_url) {
		feeds.push({ label: "Double #2 (Room 103)", url: settings.double_2_ical_url, category: "double", sourceTag: "double2", preferredUnit: 2 });
	}
	if (settings.twin_ical_url) {
		feeds.push({ label: "Twin (Room 104)", url: settings.twin_ical_url, category: "twin", sourceTag: "twin" });
	}

	if (feeds.length === 0) {
		return {
			success: true,
			configuredFeeds: 0,
			created: 0,
			updated: 0,
			cancelled: 0,
			skipped: 0,
			errors: [],
			lastSyncedAt: nowIso,
			summary: "No Booking.com iCal URLs configured yet",
		};
	}

	let created = 0;
	let updated = 0;
	let cancelled = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const feed of feeds) {
		try {
			const res = await fetch(feed.url, {
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; XsquareHotelSync/1.0)",
					Accept: "text/calendar, text/plain, */*",
				},
			});
			if (!res.ok) {
				errors.push(`${feed.label}: HTTP ${res.status}`);
				continue;
			}
			const icsText = await res.text();
			if (!icsText.includes("BEGIN:VCALENDAR")) {
				errors.push(`${feed.label}: Invalid iCal feed (missing VCALENDAR)`);
				continue;
			}

			const parsedEvents = parseBookingComIcsFeed(icsText, feed.category, feed.sourceTag, feed.preferredUnit);
			const activeExternalIds = new Set<string>();

			for (const evt of parsedEvents) {
				if (evt.status === "confirmed") {
					activeExternalIds.add(evt.externalBookingId);
				}
				const result = await upsertBookingComReservation(env, evt, syncDailyFinanceLodgingFn);
				if (result.action === "created") created++;
				else if (result.action === "updated") updated++;
				else if (result.action === "cancelled") cancelled++;
				else skipped++;
			}

			// Auto-cancel upcoming iCal bookings that disappeared from Booking.com feed
			if (settings.auto_cancel_removed) {
				const prefix = `bcom_ical_${feed.sourceTag}_%`;
				const { results: storedFuture } = await env.DB.prepare(`
					SELECT DISTINCT external_booking_id
					FROM room_bookings
					WHERE property_id = ? AND external_booking_id LIKE ? AND date >= ?
				`).bind(XSQUARE_PROPERTY_ID, prefix, todayIso).all<{ external_booking_id: string }>();

				for (const row of storedFuture || []) {
					const extId = row.external_booking_id;
					if (extId && !activeExternalIds.has(extId)) {
						const cancelRes = await upsertBookingComReservation(
							env,
							{
								externalBookingId: extId,
								roomCategory: feed.category,
								checkInDate: todayIso,
								checkOutDate: todayIso,
								guestName: "",
								guestCount: 1,
								status: "cancelled",
								sourceType: "ical",
							},
							syncDailyFinanceLodgingFn
						);
						if (cancelRes.action === "cancelled") cancelled++;
					}
				}
			}
		} catch (e: any) {
			errors.push(`${feed.label}: ${e?.message || "Fetch error"}`);
		}
	}

	const summary = `Synced ${feeds.length} feed(s): ${created} new, ${updated} updated, ${cancelled} cancelled${errors.length ? ` (${errors.length} error)` : ""}`;

	await saveBookingComSettings(env, {
		last_synced_at: nowIso,
		last_sync_summary: summary,
		last_sync_error: errors.join("; "),
	});

	return {
		success: errors.length < feeds.length,
		configuredFeeds: feeds.length,
		created,
		updated,
		cancelled,
		skipped,
		errors,
		lastSyncedAt: nowIso,
		summary,
	};
}

// =============================================================================
// BOOKING.COM WEBHOOK / EMAIL PARSER (Supports JSON + Raw Booking.com Emails!)
// =============================================================================

const MONTH_MAP: Record<string, string> = {
	jan: "01", january: "01",
	feb: "02", february: "02",
	mar: "03", march: "03",
	apr: "04", april: "04",
	may: "05",
	jun: "06", june: "06",
	jul: "07", july: "07",
	aug: "08", august: "08",
	sep: "09", sept: "09", september: "09",
	oct: "10", october: "10",
	nov: "11", november: "11",
	dec: "12", december: "12",
};

function parseFlexibleDate(raw: string): string | null {
	if (!raw) return null;
	const s = raw.trim();

	// 1. YYYY-MM-DD
	const iso = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (iso) {
		return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
	}

	// 2. DD Month YYYY (e.g. "18 November 2026" or "Wed, 18 Nov 2026")
	const dmyWord = s.match(/(\d{1,2})\s+([A-Za-z]{3,9})[.,]?\s+(\d{4})/);
	if (dmyWord) {
		const m = MONTH_MAP[dmyWord[2].toLowerCase()];
		if (m) return `${dmyWord[3]}-${m}-${dmyWord[1].padStart(2, "0")}`;
	}

	// 3. Month DD, YYYY (e.g. "November 18, 2026" or "Nov 18 2026")
	const mdyWord = s.match(/([A-Za-z]{3,9})[.,]?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/);
	if (mdyWord) {
		const m = MONTH_MAP[mdyWord[1].toLowerCase()];
		if (m) return `${mdyWord[3]}-${m}-${mdyWord[2].padStart(2, "0")}`;
	}

	// 4. DD/MM/YYYY or DD-MM-YYYY
	const dmyNum = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
	if (dmyNum) {
		const d = parseInt(dmyNum[1], 10);
		const mo = parseInt(dmyNum[2], 10);
		if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
			return `${dmyNum[3]}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
		}
	}

	return null;
}

export async function parseBookingComPayloadOrEmail(
	env: Env,
	payload: any,
	sourceType: "webhook" | "paste" = "webhook"
): Promise<ParsedBookingComEvent> {
	const rawText = [payload?.subject || "", payload?.body || "", payload?.text || "", payload?.raw_text || ""]
		.filter(Boolean)
		.join("\n")
		.trim();

	// 1. Check structured fields first
	let roomStr = String(payload?.room_name || payload?.room_type || payload?.room || "").trim();
	let checkIn = parseFlexibleDate(String(payload?.check_in || payload?.check_in_date || payload?.checkin || ""));
	let checkOut = parseFlexibleDate(String(payload?.check_out || payload?.check_out_date || payload?.checkout || ""));
	let guestName = String(payload?.guest_name || payload?.customer_name || payload?.guest || "").trim();
	let guestPhone = String(payload?.guest_phone || payload?.phone || "").trim();
	let guestCount = Number(payload?.guest_count || payload?.guests || payload?.adults || 0) || 0;
	let totalAmount: number | null = payload?.amount !== undefined && payload?.amount !== null && payload?.amount !== ""
		? Number(String(payload.amount).replace(/[^0-9.]/g, "")) || null
		: null;
	let reservationCode = String(payload?.reservation_id || payload?.booking_number || payload?.confirmation_number || "").trim();
	let status: "confirmed" | "cancelled" =
		String(payload?.status || "").toLowerCase().includes("cancel") ? "cancelled" : "confirmed";
	let paymentMode: "online" | "cash" | undefined =
		payload?.payment_mode === "cash" ? "cash" : payload?.payment_mode === "online" ? "online" : undefined;

	// 2. Deterministic extraction from raw email/text if present
	if (rawText) {
		if (/\b(?:cancelled|canceled|cancellation)\b/i.test(rawText)) {
			status = "cancelled";
		}

		if (!reservationCode) {
			const codeM = rawText.match(/(?:Booking|Reservation|Confirmation)\s*(?:number|no\.?|id|code|#)?\s*[:#-]?\s*([0-9A-Z-]{6,20})/i);
			if (codeM) reservationCode = codeM[1].toUpperCase();
		}

		if (!roomStr) {
			const roomLineM = rawText.match(/(?:Room\s*(?:type|name|booked|category)?|Unit|Accommodation)\s*[:\-]\s*([^\n\r]+)/i);
			if (roomLineM) {
				roomStr = roomLineM[1].trim();
			} else if (/\bsuite\b/i.test(rawText)) {
				roomStr = "Suite";
			} else if (/\btwin\b/i.test(rawText)) {
				roomStr = "Twin";
			} else if (/\bdouble\b/i.test(rawText)) {
				roomStr = "Double";
			}
		}

		if (!checkIn) {
			const ciM = rawText.match(/Check[\s-]*in(?:\s*date)?\s*[:\-]?\s*([^\n\r]+)/i) ||
				rawText.match(/Arrival(?:\s*date)?\s*[:\-]?\s*([^\n\r]+)/i);
			if (ciM) checkIn = parseFlexibleDate(ciM[1]);
		}

		if (!checkOut) {
			const coM = rawText.match(/Check[\s-]*out(?:\s*date)?\s*[:\-]?\s*([^\n\r]+)/i) ||
				rawText.match(/Departure(?:\s*date)?\s*[:\-]?\s*([^\n\r]+)/i);
			if (coM) checkOut = parseFlexibleDate(coM[1]);
		}

		if (!guestName) {
			const gnM = rawText.match(/(?:Guest\s*name|Booker\s*name|Customer\s*name|Booked\s*by|Guest)\s*[:\-]\s*([^\n\r(,]+)/i);
			if (gnM) guestName = gnM[1].trim();
		}

		if (!guestPhone) {
			const phM = rawText.match(/(?:Phone|Mobile|Tel(?:ephone)?|Contact)\s*(?:no\.?|number)?\s*[:\-]\s*([+\d][\d\s-]{7,16})/i);
			if (phM) guestPhone = phM[1].trim();
		}

		if (!guestCount) {
			const gcM = rawText.match(/(?:Guests?|Adults?|Persons?|Occupancy)\s*[:\-]?\s*(\d{1,2})/i) ||
				rawText.match(/(\d{1,2})\s*(?:adults?|guests?|persons?)/i);
			if (gcM) guestCount = Math.max(1, parseInt(gcM[1], 10) || 1);
		}

		if (!totalAmount) {
			const prM = rawText.match(/(?:Total\s*(?:price|amount|charge)|Price|Payout|Room\s*price)\s*[:\-]?\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
				rawText.match(/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
			if (prM) {
				const amt = parseFloat(prM[1].replace(/,/g, ""));
				if (amt > 0) totalAmount = amt;
			}
		}

		if (!paymentMode) {
			if (/pay\s+at\s+(?:the\s+)?property|cash\s+on\s+arrival/i.test(rawText)) {
				paymentMode = "cash";
			} else if (/prepaid|paid\s+online|payments\s+by\s+booking\.com|virtual\s+credit\s+card/i.test(rawText)) {
				paymentMode = "online";
			}
		}

		// 3. Cloudflare Workers AI fallback if still missing room or dates
		if ((!roomStr || !checkIn || !guestName) && env.AI) {
			try {
				const aiRes: any = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
					messages: [
						{
							role: "system",
							content: `Extract Booking.com hotel reservation details from the text and return ONLY valid JSON with keys:
{ "room_name": "Suite" | "Double" | "Twin", "check_in": "YYYY-MM-DD", "check_out": "YYYY-MM-DD", "guest_name": "string", "guest_phone": "string", "guest_count": number, "amount": number | null, "reservation_id": "string", "status": "confirmed" | "cancelled" }.
Room mapping: Suite=101, Double=102/103, Twin=104. Return ONLY JSON.`,
						},
						{ role: "user", content: rawText.slice(0, 3500) },
					],
					max_tokens: 260,
					temperature: 0.1,
				});
				const txt = String(aiRes?.response || "").trim();
				const jsonM = txt.match(/\{[\s\S]*\}/);
				if (jsonM) {
					const aiData = JSON.parse(jsonM[0]);
					if (!roomStr && aiData.room_name) roomStr = String(aiData.room_name);
					if (!checkIn && aiData.check_in) checkIn = parseFlexibleDate(String(aiData.check_in));
					if (!checkOut && aiData.check_out) checkOut = parseFlexibleDate(String(aiData.check_out));
					if (!guestName && aiData.guest_name) guestName = String(aiData.guest_name).trim();
					if (!guestPhone && aiData.guest_phone) guestPhone = String(aiData.guest_phone).trim();
					if (!guestCount && aiData.guest_count) guestCount = Math.max(1, Number(aiData.guest_count) || 1);
					if (!totalAmount && aiData.amount) totalAmount = Number(aiData.amount) || null;
					if (!reservationCode && aiData.reservation_id) reservationCode = String(aiData.reservation_id).trim();
					if (String(aiData.status || "").toLowerCase().includes("cancel")) status = "cancelled";
				}
			} catch (e) {
				console.error("Booking.com AI email parse fallback failed:", e);
			}
		}
	}

	const detected = detectBookingComRoomCategory(roomStr);
	if (!detected.category && status !== "cancelled") {
		throw new Error(
			`Could not identify Booking.com room type ('Suite', 'Double', or 'Twin') from '${roomStr || "message"}'.`
		);
	}

	if (!checkIn && status !== "cancelled") {
		throw new Error("Could not extract Check-in date (YYYY-MM-DD) from the Booking.com details.");
	}

	const finalCheckIn = checkIn || new Date().toISOString().split("T")[0];
	const finalCheckOut = checkOut && checkOut > finalCheckIn ? checkOut : finalCheckIn;

	const externalBookingId = reservationCode
		? `bcom_res_${sanitizeUid(reservationCode)}`
		: `bcom_wh_${detected.category || "room"}_${finalCheckIn}_${finalCheckOut}_${sanitizeUid(guestName || "guest")}`;

	return {
		externalBookingId,
		reservationCode: reservationCode || undefined,
		roomCategory: detected.category || "double",
		preferredUnit: detected.preferredUnit,
		roomLabel: roomStr || undefined,
		checkInDate: finalCheckIn,
		checkOutDate: finalCheckOut,
		guestName: guestName || "Booking.com Guest",
		guestPhone: guestPhone || undefined,
		guestCount: Math.max(1, guestCount || 1),
		totalAmount,
		paymentMode,
		status,
		notes: payload?.notes ? String(payload.notes).trim() : undefined,
		sourceType,
	};
}

// =============================================================================
// TWO-WAY iCAL EXPORT (Let Booking.com import Xsquare Hotel direct bookings!)
// =============================================================================

function toIcalDate(iso: string): string {
	return iso.replace(/[^0-9]/g, "").slice(0, 8);
}

function addOneDayIso(iso: string): string {
	const d = new Date(iso + "T00:00:00Z");
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().split("T")[0];
}

export async function generateXsquareIcalFeed(
	env: Env,
	roomKey: string
): Promise<{ ics: string; filename: string } | null> {
	const key = (roomKey || "").toLowerCase().replace(/\.ics$/i, "").trim();

	const { results: roomRows } = await env.DB.prepare(
		"SELECT * FROM rooms WHERE property_id = ? AND active = 1"
	).bind(XSQUARE_PROPERTY_ID).all<Room>();
	const rooms = roomRows || [];

	const room101 = rooms.find((r) => String(r.room_number) === "101");
	const room102 = rooms.find((r) => String(r.room_number) === "102");
	const room103 = rooms.find((r) => String(r.room_number) === "103");
	const room104 = rooms.find((r) => String(r.room_number) === "104");

	let targetRoomIds: string[] = [];
	let requireAllOccupied = false;
	let calName = "Xsquare Hotel";

	if (key === "suite" || key === "101") {
		if (room101) targetRoomIds = [room101.id];
		calName = "Xsquare Hotel - Suite (Room 101)";
	} else if (key === "double-102" || key === "102") {
		if (room102) targetRoomIds = [room102.id];
		calName = "Xsquare Hotel - Double (Room 102)";
	} else if (key === "double-103" || key === "103") {
		if (room103) targetRoomIds = [room103.id];
		calName = "Xsquare Hotel - Double (Room 103)";
	} else if (key === "double") {
		if (room102) targetRoomIds.push(room102.id);
		if (room103) targetRoomIds.push(room103.id);
		// For combined Double category, block a date on Booking.com only when BOTH 102 and 103 are occupied
		requireAllOccupied = targetRoomIds.length > 1;
		calName = "Xsquare Hotel - Double (Rooms 102 & 103)";
	} else if (key === "twin" || key === "104") {
		if (room104) targetRoomIds = [room104.id];
		calName = "Xsquare Hotel - Twin (Room 104)";
	} else {
		return null;
	}

	if (targetRoomIds.length === 0) return null;

	// Fetch bookings from 30 days ago onward (exclude Booking.com iCal echo-back)
	const cutoff = new Date();
	cutoff.setUTCDate(cutoff.getUTCDate() - 30);
	const cutoffIso = cutoff.toISOString().split("T")[0];

	const placeholders = targetRoomIds.map(() => "?").join(", ");
	const { results: bookings } = await env.DB.prepare(`
		SELECT id, room_id, date, guest_name, platform, external_booking_id
		FROM room_bookings
		WHERE property_id = ?
		  AND room_id IN (${placeholders})
		  AND date >= ?
		  AND (external_booking_id IS NULL OR external_booking_id NOT LIKE 'bcom_ical_%')
		ORDER BY date ASC
	`).bind(XSQUARE_PROPERTY_ID, ...targetRoomIds, cutoffIso).all<RoomBooking>();

	// Determine blocked dates
	const dateRoomMap = new Map<string, Set<string>>();
	for (const b of bookings || []) {
		if (!dateRoomMap.has(b.date)) dateRoomMap.set(b.date, new Set());
		dateRoomMap.get(b.date)!.add(b.room_id);
	}

	const blockedDates: string[] = [];
	for (const [dateStr, occupiedRooms] of dateRoomMap.entries()) {
		if (!requireAllOccupied || occupiedRooms.size >= targetRoomIds.length) {
			blockedDates.push(dateStr);
		}
	}
	blockedDates.sort();

	// Merge contiguous dates into clean multi-day VEVENT blocks
	const spans: { start: string; endExclusive: string }[] = [];
	for (const d of blockedDates) {
		const nextDay = addOneDayIso(d);
		const last = spans[spans.length - 1];
		if (last && last.endExclusive === d) {
			last.endExclusive = nextDay;
		} else {
			spans.push({ start: d, endExclusive: nextDay });
		}
	}

	const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
	const lines: string[] = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Xsquare Hotel//Booking.com Two-Way Sync//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${calName}`,
	];

	for (const sp of spans) {
		lines.push("BEGIN:VEVENT");
		lines.push(`UID:xsquare-${key}-${sp.start}-${sp.endExclusive}@staff-management.elitehomes-portal.workers.dev`);
		lines.push(`DTSTAMP:${dtStamp}`);
		lines.push(`DTSTART;VALUE=DATE:${toIcalDate(sp.start)}`);
		lines.push(`DTEND;VALUE=DATE:${toIcalDate(sp.endExclusive)}`);
		lines.push(`SUMMARY:Booked - ${calName}`);
		lines.push("STATUS:CONFIRMED");
		lines.push("END:VEVENT");
	}

	lines.push("END:VCALENDAR");
	return {
		ics: lines.join("\r\n") + "\r\n",
		filename: `xsquare-${key}.ics`,
	};
}
