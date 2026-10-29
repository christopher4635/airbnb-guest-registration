/**
 * ==============================================================================
 * Cloudflare Edge API Client: Hono Backend, D1 Database & R2 Storage
 * ==============================================================================
 */

(function (window) {
  'use strict';

  // Determine API base URL
  function getApiBaseUrl() {
    // 1. Explicit override saved by host
    const custom = localStorage.getItem('airbnb_api_base_url');
    if (custom) return custom.replace(/\/+$/, '');

    // 2. If running on Cloudflare (same origin) or local wrangler dev
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // In local dev, backend usually runs on 8787 or same port
      return window.location.port === '8787' ? '' : 'http://127.0.0.1:8787';
    }

    // 3. Same origin for Cloudflare Pages / Workers with Assets
    return '';
  }

  const apiClient = {
    getBaseUrl: getApiBaseUrl,

    setBaseUrl: function(url) {
      if (url) {
        localStorage.setItem('airbnb_api_base_url', url.replace(/\/+$/, ''));
      } else {
        localStorage.removeItem('airbnb_api_base_url');
      }
    },

    // Generic request helper with timeout and fallback
    request: async function(endpoint, options = {}) {
      const base = getApiBaseUrl();
      const url = `${base}${endpoint}`;

      const headers = Object.assign({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }, options.headers || {});

      const adminPin = localStorage.getItem('airbnb_admin_pin') || '4635';
      if (adminPin) {
        headers['X-Admin-Pin'] = adminPin;
      }

      const fetchOptions = Object.assign({}, options, { headers });

      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((data && data.error) || `HTTP error ${response.status}`);
        }
        return data;
      } catch (err) {
        console.warn(`[Cloudflare API] Call to ${endpoint} failed:`, err);
        throw err;
      }
    },

    // --------------------------------------------------------------------------
    // Bookings (D1 Database)
    // --------------------------------------------------------------------------
    getBookings: async function() {
      try {
        const res = await this.request('/api/bookings');
        if (res && res.data) {
          // Keep local cache synced
          localStorage.setItem('airbnb_bookings', JSON.stringify(res.data));
          return res.data;
        }
      } catch (e) {
        // Fallback to local storage or fallback JSON
        const local = localStorage.getItem('airbnb_bookings');
        if (local) return JSON.parse(local);
      }
      return [];
    },

    createBooking: async function(bookingData) {
      try {
        const res = await this.request('/api/bookings', {
          method: 'POST',
          body: JSON.stringify(bookingData)
        });
        return res;
      } catch (e) {
        // Offline / fallback save
        const local = JSON.parse(localStorage.getItem('airbnb_bookings') || '[]');
        bookingData.id = bookingData.id || `bk_${Date.now()}`;
        local.push(bookingData);
        localStorage.setItem('airbnb_bookings', JSON.stringify(local));
        return { success: true, data: bookingData, offline: true };
      }
    },

    updateBooking: async function(id, bookingData) {
      try {
        const res = await this.request(`/api/bookings/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(bookingData)
        });
        return res;
      } catch (e) {
        const local = JSON.parse(localStorage.getItem('airbnb_bookings') || '[]');
        const idx = local.findIndex(b => b.id === id);
        if (idx !== -1) {
          local[idx] = Object.assign(local[idx], bookingData);
          localStorage.setItem('airbnb_bookings', JSON.stringify(local));
        }
        return { success: true, data: bookingData, offline: true };
      }
    },

    deleteBooking: async function(id) {
      try {
        return await this.request(`/api/bookings/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (e) {
        const local = JSON.parse(localStorage.getItem('airbnb_bookings') || '[]');
        const filtered = local.filter(b => b.id !== id);
        localStorage.setItem('airbnb_bookings', JSON.stringify(filtered));
        return { success: true, offline: true };
      }
    },

    // --------------------------------------------------------------------------
    // Submissions & Check-ins (D1 Database + Cloudflare R2 Image Storage)
    // --------------------------------------------------------------------------
    getSubmissions: async function() {
      try {
        const res = await this.request('/api/submissions');
        if (res && res.data) {
          localStorage.setItem('airbnb_demo_submissions', JSON.stringify(res.data));
          return res.data;
        }
      } catch (e) {
        const local = localStorage.getItem('airbnb_demo_submissions');
        if (local) return JSON.parse(local);
      }
      return [];
    },

    submitCheckIn: async function(checkInData) {
      // Submits full guest registration to Hono backend:
      // Backend automatically parses base64 ID photos/signatures, uploads to Cloudflare R2,
      // and records rows in D1 database!
      try {
        return await this.request('/api/submissions', {
          method: 'POST',
          body: JSON.stringify(checkInData)
        });
      } catch (e) {
        console.warn('Backend submission failed, saving locally:', e);
        const local = JSON.parse(localStorage.getItem('airbnb_demo_submissions') || '[]');
        local.unshift({
          'Timestamp': new Date().toISOString().replace('T', ' ').substring(0, 19),
          'Reservation Code': checkInData.reservationCode || 'DIRECT',
          'Property Option': checkInData.propertyOption || '1 BHK',
          'Check-in Date': checkInData.checkInDate || '',
          'Check-out Date': checkInData.checkOutDate || '',
          'Arrival Time': checkInData.arrivalTime || '',
          'Total Guests': checkInData.totalGuests || 1,
          'Guest Legal Name': (checkInData.guests && checkInData.guests[0] && checkInData.guests[0].name) || 'Guest',
          'Phone / WhatsApp': (checkInData.guests && checkInData.guests[0] && checkInData.guests[0].phone) || '',
          'ID Type': (checkInData.guests && checkInData.guests[0] && checkInData.guests[0].idType) || 'Aadhaar Card'
        });
        localStorage.setItem('airbnb_demo_submissions', JSON.stringify(local));
        return { success: true, offline: true, message: 'Saved locally in browser' };
      }
    },

    // --------------------------------------------------------------------------
    // Cloudflare R2 Image Uploads
    // --------------------------------------------------------------------------
    uploadImageToR2: async function(base64Data, metadata = {}) {
      try {
        return await this.request('/api/uploads', {
          method: 'POST',
          body: JSON.stringify({
            data: base64Data,
            name: metadata.name || 'image',
            folder: metadata.folder || metadata.reservationCode || 'guests'
          })
        });
      } catch (e) {
        console.warn('R2 direct upload failed:', e);
        return { success: false, error: e.message };
      }
    },

    // --------------------------------------------------------------------------
    // Properties & Rooms (D1 Database)
    // --------------------------------------------------------------------------
    getProperties: async function() {
      try {
        const res = await this.request('/api/properties');
        if (res && res.data) {
          localStorage.setItem('airbnb_properties_cache', JSON.stringify(res.data));
          return res.data;
        }
      } catch (e) {
        const cached = localStorage.getItem('airbnb_properties_cache');
        if (cached) return JSON.parse(cached);
      }
      return [];
    },

    addProperty: async function(propertyData) {
      return await this.request('/api/properties', {
        method: 'POST',
        body: JSON.stringify(propertyData)
      });
    },

    updateProperty: async function(oldName, propertyData) {
      return await this.request(`/api/properties/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        body: JSON.stringify(propertyData)
      });
    },

    deleteProperty: async function(name, force = false) {
      return await this.request(`/api/properties/${encodeURIComponent(name)}${force ? '?force=true' : ''}`, {
        method: 'DELETE'
      });
    },

    // --------------------------------------------------------------------------
    // iCal Calendar Sync (Outbound & Inbound Sync)
    // --------------------------------------------------------------------------
    getIcalFeeds: async function() {
      return await this.request('/api/ical/feeds');
    },

    updateIcalFeeds: async function(name, feedsData) {
      return await this.request(`/api/ical/feeds/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(feedsData)
      });
    },

    syncIcalChannels: async function(property = null) {
      return await this.request('/api/ical/sync', {
        method: 'POST',
        body: JSON.stringify(property ? { property } : {})
      });
    },

    getIcalExportUrl: function(propertyName) {
      const base = getApiBaseUrl() || window.location.origin;
      return `${base}/api/ical/export/${encodeURIComponent(propertyName)}.ics`;
    },

    // --------------------------------------------------------------------------
    // Configuration (D1 Database)
    // --------------------------------------------------------------------------
    getConfig: async function() {
      try {
        const res = await this.request('/api/config');
        if (res && res.data) {
          localStorage.setItem('airbnb_form_config', JSON.stringify(res.data));
          return res.data;
        }
      } catch (e) {
        const local = localStorage.getItem('airbnb_form_config');
        if (local) return JSON.parse(local);
      }
      return null;
    },

    saveConfig: async function(newConfig, pin) {
      try {
        return await this.request('/api/config', {
          method: 'POST',
          headers: pin ? { 'X-Admin-Pin': pin } : {},
          body: JSON.stringify(newConfig)
        });
      } catch (e) {
        localStorage.setItem('airbnb_form_config', JSON.stringify(newConfig));
        return { success: true, offline: true };
      }
    }
  };

  window.AirbnbAPI = apiClient;
})(window);
