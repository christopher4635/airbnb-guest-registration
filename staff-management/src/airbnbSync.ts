import type { Env, Room } from "./types";

const AIRBNB_PORTAL_URL = "https://airbnb-management.elitehomes-portal.workers.dev";

export interface AirbnbBookingItem {
	id: string;
	property: string;
	guestName?: string;
	phone?: string;
	email?: string;
	checkInDate: string;
	checkOutDate: string;
	nights?: number;
	guestsCount?: number;
	platform?: string;
	reservationCode?: string;
	externalUid?: string;
	payout?: string | number;
	paymentStatus?: string;
	status?: string;
	notes?: string;
	createdAt?: string;
	updatedAt?: string;
}

export function findMatchingRoom(propertyNameOrRoom: string, rooms: Room[]): Room | null {
	const target = (propertyNameOrRoom || "").toLowerCase().trim();
	if (!target) return rooms[0] || null;

	// Exact matches
	for (const r of rooms) {
		const num = (r.room_number || "").toLowerCase().trim();
		const type = (r.room_type || "").toLowerCase().trim();
		if (num === target || type === target) return r;
	}

	// Substring matches for Elite Homes units
	if (target.includes("ripple") || (target.includes("1") && target.includes("bhk"))) {
		const r = rooms.find(rm => rm.room_number.toLowerCase().includes("1") || (rm.room_type || "").toLowerCase().includes("ripple"));
		if (r) return r;
	}
	if (target.includes("2") && target.includes("bhk")) {
		const r = rooms.find(rm => rm.room_number.toLowerCase().includes("2") || (rm.room_type || "").toLowerCase().includes("ethereum"));
		if (r) return r;
	}
	if (target.includes("luna") || (target.includes("studio") && target.includes("1"))) {
		const r = rooms.find(rm => (rm.room_type || "").toLowerCase().includes("luna") || rm.room_number.toLowerCase().includes("1"));
		if (r) return r;
	}
	if (target.includes("demilune") || (target.includes("studio") && target.includes("2"))) {
		const r = rooms.find(rm => (rm.room_type || "").toLowerCase().includes("demilune") || rm.room_number.toLowerCase().includes("2"));
		if (r) return r;
	}

	return rooms[0] || null;
}

export function parsePayout(payoutStr: any, nights: number, defaultRate = 2700): { total: number; daily: number } {
	let total = 0;
	if (typeof payoutStr === "number") {
		total = Math.max(0, payoutStr);
	} else if (typeof payoutStr === "string") {
		const clean = payoutStr.replace(/[^0-9.]/g, "");
		total = parseFloat(clean) || 0;
	}
	if (total <= 0 && nights > 0) {
		total = defaultRate * nights;
	}
	const daily = nights > 0 ? Math.round(total / nights) : total;
	return { total, daily };
}

export async function syncAirbnbBookingsToStaffSync(
	env: Env,
	syncDailyFinanceLodgingFn: (env: Env, propertyId: string, date: string, submittedBy?: string) => Promise<any>
) {
	try {
		// 1. Fetch all bookings from Airbnb Host Portal (Direct D1 or HTTP API)
		let airbnbBookings: AirbnbBookingItem[] = [];

		if (env.AIRBNB_DB) {
			const { results } = await env.AIRBNB_DB.prepare(`
				SELECT
					id, property, guest_name AS guestName, phone, email,
					check_in_date AS checkInDate, check_out_date AS checkOutDate,
					nights, guests_count AS guestsCount, platform,
					reservation_code AS reservationCode, external_uid AS externalUid,
					payout, payment_status AS paymentStatus, status, notes,
					created_at AS createdAt, updated_at AS updatedAt
				FROM bookings
			`).all<AirbnbBookingItem>();
			airbnbBookings = results || [];
		} else {
			const res = await fetch(`${AIRBNB_PORTAL_URL}/api/bookings`, {
				headers: { "User-Agent": "Mozilla/5.0 (Cloudflare-Worker-StaffSync)" }
			});
			if (!res.ok) {
				throw new Error(`Failed to fetch from Airbnb Portal: HTTP ${res.status}`);
			}
			const data = await res.json() as { success: boolean; data: AirbnbBookingItem[] };
			airbnbBookings = data.data || [];
		}

		// 2. Fetch rooms for property 'elite-homes'
		const { results: roomRows } = await env.DB.prepare(
			"SELECT * FROM rooms WHERE property_id = 'elite-homes' AND active = 1"
		).all<Room>();
		const rooms = roomRows || [];
		if (rooms.length === 0) {
			throw new Error("No rooms found in Elite Homes to map bookings to.");
		}

		let syncedCount = 0;
		const affectedDates = new Set<string>();

		// 3. Process each booking
		for (const ab of airbnbBookings) {
			const externalId = ab.id;
			if (!externalId) continue;

			// If status is Cancelled, remove from room_bookings
			if (ab.status === "Cancelled") {
				const existingRows = await env.DB.prepare(
					"SELECT date FROM room_bookings WHERE property_id = 'elite-homes' AND external_booking_id = ?"
				).bind(externalId).all<{ date: string }>();
				for (const r of (existingRows.results || [])) {
					affectedDates.add(r.date);
				}
				await env.DB.prepare(
					"DELETE FROM room_bookings WHERE property_id = 'elite-homes' AND external_booking_id = ?"
				).bind(externalId).run();
				continue;
			}

			const targetRoom = findMatchingRoom(ab.property, rooms);
			if (!targetRoom) continue;

			const checkIn = ab.checkInDate;
			const checkOut = ab.checkOutDate || checkIn;
			if (!checkIn || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) continue;

			// Compute stay dates (nights)
			const dates: string[] = [];
			const cur = new Date(checkIn + "T00:00:00Z");
			const end = new Date(checkOut + "T00:00:00Z");

			while (cur < end) {
				dates.push(cur.toISOString().split("T")[0]);
				cur.setUTCDate(cur.getUTCDate() + 1);
			}
			if (dates.length === 0) dates.push(checkIn);

			const nights = Math.max(1, ab.nights || dates.length);
			const { total, daily } = parsePayout(ab.payout, dates.length, targetRoom.base_price || 2700);

			// Determine payment mode
			let paymentMode: "online" | "cash" = "online";
			if (ab.platform === "Direct" && ab.paymentStatus === "Pay on Arrival") {
				paymentMode = "cash";
			} else if (ab.notes && ab.notes.toLowerCase().includes("cash")) {
				paymentMode = "cash";
			}

			// Clean existing rows for this external booking to ensure accurate date spans
			const existingRows = await env.DB.prepare(
				"SELECT date FROM room_bookings WHERE property_id = 'elite-homes' AND external_booking_id = ?"
			).bind(externalId).all<{ date: string }>();
			for (const r of (existingRows.results || [])) {
				affectedDates.add(r.date);
			}
			await env.DB.prepare(
				"DELETE FROM room_bookings WHERE property_id = 'elite-homes' AND external_booking_id = ?"
			).bind(externalId).run();

			const groupBookingId = dates.length > 1 ? `grp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}` : null;

			// Insert each day's record
			for (let i = 0; i < dates.length; i++) {
				const d = dates[i];
				affectedDates.add(d);
				const isLastDay = i === dates.length - 1;
				const dayAmount = isLastDay ? (total - (daily * (dates.length - 1))) : daily;

				const slotCount = await env.DB.prepare(
					"SELECT COUNT(*) AS cnt FROM room_bookings WHERE room_id = ? AND date = ?"
				).bind(targetRoom.id, d).first<{ cnt: number }>();
				const slotNumber = (slotCount?.cnt || 0) + 1;

				const id = `bk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}_${i + 1}`;
				const notesText = [
					ab.platform ? `[${ab.platform}]` : '',
					ab.reservationCode ? `Res: ${ab.reservationCode}` : '',
					ab.notes ? ab.notes : ''
				].filter(Boolean).join(" · ");

				await env.DB.prepare(`
					INSERT INTO room_bookings (
						id, property_id, room_id, date, amount, payment_mode, guest_name, notes, slot_number,
						group_booking_id, check_in_date, check_out_date, total_stay_amount, external_booking_id, platform,
						created_by, created_at, updated_at
					) VALUES (?, 'elite-homes', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Airbnb Sync', datetime('now'), datetime('now'))
				`).bind(
					id, targetRoom.id, d, Math.max(0, dayAmount), paymentMode, ab.guestName || "Guest", notesText || null, slotNumber,
					groupBookingId, checkIn, checkOut, total, externalId, ab.platform || "Direct"
				).run();
			}

			syncedCount++;
		}

		// 4. Re-sync daily finances for all affected dates
		for (const d of affectedDates) {
			await syncDailyFinanceLodgingFn(env, "elite-homes", d, "Airbnb Sync");
		}

		const timestamp = new Date().toISOString();
		await env.DB.prepare(`
			INSERT INTO app_settings (key, value, updated_at)
			VALUES ('last_airbnb_sync_at', ?, CURRENT_TIMESTAMP)
			ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
		`).bind(timestamp).run();

		return {
			success: true,
			totalFetched: airbnbBookings.length,
			syncedCount,
			datesAffected: affectedDates.size,
			lastSyncedAt: timestamp
		};
	} catch (err: any) {
		console.error("syncAirbnbBookings error:", err);
		return {
			success: false,
			error: err.message || "Failed to sync with Airbnb Host Portal",
			syncedCount: 0,
			datesAffected: 0
		};
	}
}

export async function pushBookingToAirbnbPortal(
	env: Env,
	booking: {
		roomName: string;
		guestName: string;
		phone?: string;
		checkInDate: string;
		checkOutDate: string;
		nights: number;
		totalAmount: number;
		paymentMode: string;
		notes?: string;
	}
) {
	try {
		// Ensure checkout date is at least 1 day after checkin for Airbnb portal stay convention
		const checkIn = booking.checkInDate;
		let checkOut = booking.checkOutDate;
		if (!checkOut || checkOut <= checkIn) {
			const d = new Date(checkIn + "T00:00:00Z");
			d.setUTCDate(d.getUTCDate() + 1);
			checkOut = d.toISOString().split("T")[0];
		}
		const nights = Math.max(1, booking.nights || 1);

		// Map room name to Airbnb property
		let airbnbProperty = "1 BHK";
		const r = (booking.roomName || "").toLowerCase();
		if (r.includes("2") && r.includes("bhk")) airbnbProperty = "2 BHK";
		else if (r.includes("luna") || r.includes("studio 1") || r.includes("studio room 1")) airbnbProperty = "Luna (Studio Room)";
		else if (r.includes("demilune") || r.includes("studio 2") || r.includes("studio room 2")) airbnbProperty = "Demilune";
		else if (r.includes("ripple") || (r.includes("1") && r.includes("bhk"))) airbnbProperty = "Ripple 1 BHK";

		const payoutStr = `₹${booking.totalAmount.toLocaleString("en-IN")}`;
		const paymentStatus = booking.paymentMode === "online" ? "Paid in Full" : "Pay on Arrival";
		const notesStr = booking.notes ? `[StaffSync] ${booking.notes}` : "Booked via StaffSync Portal";

		if (env.AIRBNB_DB) {
			const conflict = await env.AIRBNB_DB.prepare(`
				SELECT * FROM bookings
				WHERE property = ?
				  AND status != 'Cancelled'
				  AND check_in_date < ?
				  AND check_out_date > ?
			`).bind(airbnbProperty, checkOut, checkIn).first();

			if (!conflict) {
				const id = `bk_staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
				await env.AIRBNB_DB.prepare(`
					INSERT INTO bookings (
						id, property, guest_name, phone, email,
						check_in_date, check_out_date, nights, guests_count,
						platform, payout, payment_status, status, notes, created_at, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'Direct', ?, ?, 'Confirmed', ?, datetime('now'), datetime('now'))
				`).bind(
					id, airbnbProperty, booking.guestName || "Guest", booking.phone || "", "",
					checkIn, checkOut, nights,
					payoutStr, paymentStatus, notesStr
				).run();
			}
		} else {
			await fetch(`${AIRBNB_PORTAL_URL}/api/bookings`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Mozilla/5.0 (Cloudflare-Worker-StaffSync)"
				},
				body: JSON.stringify({
					property: airbnbProperty,
					guestName: booking.guestName || "Guest",
					phone: booking.phone || "",
					checkInDate: checkIn,
					checkOutDate: checkOut,
					nights,
					platform: "Direct",
					payout: payoutStr,
					paymentStatus,
					status: "Confirmed",
					notes: notesStr
				})
			});
		}
	} catch (e) {
		console.error("pushBookingToAirbnbPortal error:", e);
	}
}
