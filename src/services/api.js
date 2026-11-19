const REQUEST_TIMEOUT_MS = 15000;

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();

const API_BASE_URL = (() => {
    if (RAW_API_URL) return RAW_API_URL.replace(/\/+$/, '');

    // FIX: use 127.0.0.1 in dev, not "localhost".
    // The Vite dev server typically serves at 127.0.0.1:5173, so the browser's
    // Origin header is http://127.0.0.1:5173. Calling "http://localhost:5000"
    // can resolve to ::1 (IPv6) on some systems, and if the backend only
    // listens on IPv4 you get an opaque "Failed to fetch" — not a CORS error,
    // a connection-refused error the browser can't distinguish.
    // Using the same host family (127.0.0.1) removes that failure mode.
    if (import.meta.env.DEV) return 'http://127.0.0.1:5000/api';
    return '/api';
})();

const isPlaceholderHost = (url) =>
    /your-backend-host|example\.com|your-frontend-domain/.test(url);

if (RAW_API_URL && isPlaceholderHost(RAW_API_URL)) {
    console.warn(
        `[API] VITE_API_URL still points at a placeholder ("${RAW_API_URL}"). ` +
        'Set a real backend URL or every request will fail.'
    );
} else if (!RAW_API_URL && !import.meta.env.DEV) {
    console.warn(
        '[API] VITE_API_URL is not set. Falling back to same-origin "/api". ' +
        'If this app is served as static files (e.g., Vercel), requests will 404 ' +
        'unless a proxy rewrites /api to the backend.'
    );
}

/**
 * FIX: this function is now only ever called for TRANSPORT failures (fetch
 * threw, timeout, etc.). HTTP errors with a response status are handled
 * separately in request() — they must NOT be branded as "unreachable".
 */
const describeTransportFailure = (error, url) => {
    if (error?.name === 'AbortError') {
        return `Request to ${url} timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The server may be slow or unreachable.`;
    }
    const isNetworkFailure =
        error instanceof TypeError ||
        error?.name === 'TypeError' ||
        /failed to fetch|fetch failed|networkerror|load failed/i.test(error?.message || '');
    if (isNetworkFailure) {
        return (
            `Could not reach the API at ${url}. ` +
            `The backend may be down, bound to a different interface, or ` +
            `its CORS_ORIGINS may not include this site's origin. ` +
            `Original error: ${error?.message || 'unknown'}.`
        );
    }
    return error?.message || `Request to ${url} failed.`;
};

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        // No longer cached here — read fresh from localStorage on every request.
        // This was the root cause of 401 "Missing Authorization Header" after login.
    }

    setToken(token) {
        // The single source of truth is localStorage. Methods below read from it.
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    /** Debug helper — call from the browser console:  apiService.debugAuthState() */
    debugAuthState() {
        const token = localStorage.getItem('access_token');
        const state = {
            baseURL: this.baseURL,
            token: token ? `${token.slice(0, 20)}… (${token.length} chars)` : '<MISSING>',
            origin: typeof window !== 'undefined' ? window.location.origin : '(server)',
        };
        console.log('[API] auth state:', state);
        return state;
    }

    getHeaders(options = {}) {
        // FIX: this function now receives options from request(), so method-aware
        // headers (Cache-Control on non-GET) actually work.
        const method = (options.method || 'GET').toUpperCase();
        const headers = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
        };
        if (method !== 'GET') {
            headers['Cache-Control'] = 'no-store';
        }
        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        // FIX: read the token fresh from localStorage every single request.
        // Caching `this.token` at construction meant that a login performed
        // after page load never updated it, so requests went out unauthenticated.
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else if (import.meta.env.DEV) {
            console.warn(`[API] No access_token in localStorage for ${method} ${options.method ? '(non-GET)' : '(GET)'} — request will be unauthenticated`);
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // FIX: pass `options` into getHeaders() so it can compute the correct
        // headers for the actual method.
        const config = {
            ...options,
            headers: this.getHeaders(options),
        };

        // AbortSignal handling: combine caller signal + timeout.
        let timeoutSignal;
        if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
            timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
        } else {
            const tc = new AbortController();
            setTimeout(() => tc.abort(), REQUEST_TIMEOUT_MS);
            timeoutSignal = tc.signal;
        }
        if (options.signal) {
            config.signal = typeof AbortSignal.any === 'function'
                ? AbortSignal.any([options.signal, timeoutSignal])
                : options.signal;
        } else {
            config.signal = timeoutSignal;
        }

        if (import.meta.env.DEV) {
            const hasToken = !!localStorage.getItem('access_token');
            console.log(
                `[API] → ${config.method || 'GET'} ${url}` +
                ` [auth=${hasToken ? 'Bearer' : 'none'}]`
            );
        }
        const startTime = Date.now();

        let response;
        try {
            response = await fetch(url, config);
        } catch (transportErr) {
            // Genuine transport failure — network, CORS, timeout, aborted.
            const duration = Date.now() - startTime;
            const message = describeTransportFailure(transportErr, url);
            console.error(`[API] ✗ ${config.method || 'GET'} ${url} failed after ${duration}ms: ${message}`);
            const wrapped = new Error(message);
            wrapped.cause = transportErr;
            throw wrapped;
        }

        const duration = Date.now() - startTime;
        if (import.meta.env.DEV) {
            console.log(`[API] ← ${response.status} ${url} (${duration}ms)`);
        }

        const contentType = response.headers.get('content-type') || '';

        // Non-JSON response: usually a proxy/HTML error page or wrong host.
        if (!contentType.includes('application/json')) {
            const body = await response.text().catch(() => '');
            const detail = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
            const err = new Error(
                `API returned ${response.status} ${response.statusText || ''} ` +
                `with a non-JSON response from ${url}. ` +
                `Check the API host is correct and running.` +
                (detail ? ` Server said: ${detail}` : '')
            );
            err.status = response.status;
            console.error(`[API] ✗ non-JSON ${response.status} from ${url}:`, detail);
            throw err;
        }

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error(`[API] Malformed JSON from ${url}:`, jsonErr);
            const err = new Error(`API returned malformed JSON from ${url} (HTTP ${response.status}).`);
            err.status = response.status;
            throw err;
        }

        if (!response.ok) {
            // FIX: backend returns {"msg": "..."} — handle msg/error/message.
            const serverMsg = data?.msg || data?.error || data?.message;
            const err = new Error(serverMsg || `API request failed (${response.status})`);
            err.status = response.status;
            err.body = data;

            if (response.status === 401) {
                const hadToken = !!config.headers.Authorization;
                if (hadToken) {
                    // The token we SENT was rejected → it's expired/invalid.
                    console.warn(`[API] 401 with a token on ${endpoint} — clearing session`);
                    this.setToken(null);
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                } else {
                    // We didn't send a token → not an auth problem, a client bug.
                    // Don't nuke the session; just surface the error.
                    console.warn(`[API] 401 without a token on ${endpoint} — NOT clearing session`);
                }
            }

            if (response.status === 503) {
                const e2 = new Error(
                    `The API is unavailable (HTTP 503)${data?.error ? `: ${data.error}` : ''}. ` +
                    'The backend service is suspended, asleep, or not deployed.'
                );
                e2.status = 503;
                e2.body = data;
                throw e2;
            }

            console.error(`[API] ✗ HTTP ${response.status} from ${url}:`, data);
            throw err;
        }

        return data;
    }

    // ============= AUTH ENDPOINTS =============

    async register(data) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (response.access_token) this.setToken(response.access_token);
        return response;
    }

    async login(data) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (response.access_token) this.setToken(response.access_token);
        return response;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateProfile(data) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async requestPasswordReset(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword }),
        });
    }

    async getAllUsers() {
        return this.request('/auth/users');
    }

    async updateUserRole(userId, isAdmin) {
        return this.request(`/auth/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ is_admin: isAdmin }),
        });
    }

    async deleteUser(userId) {
        return this.request(`/auth/users/${userId}`, {
            method: 'DELETE',
        });
    }

    // ============= PRODUCT ENDPOINTS =============

    async getProducts(params = {}) {
        const cleanParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
                cleanParams[key] = value;
            }
        }
        const query = new URLSearchParams(cleanParams).toString();
        const endpoint = `/products${query ? '?' + query : ''}`;
        return this.request(endpoint);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(data) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProduct(id, data) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE',
        });
    }

    async getRelatedProducts(id, limit = 6) {
        return this.request(`/products/${id}/related?limit=${limit}`);
    }

    async getCategories() {
        return this.request('/products/categories');
    }

    async bulkUpdateProducts(productIds, updateData) {
        return this.request('/products/bulk-update', {
            method: 'POST',
            body: JSON.stringify({
                product_ids: productIds,
                update_data: updateData,
            }),
        });
    }

    // ============= ORDER ENDPOINTS =============

    async createOrder(data, idempotencyKey) {
        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
            headers,
        });
    }

    async getOrders() {
        return this.request('/orders');
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    async updateOrderStatus(id, status) {
        return this.request(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // ============= REVIEW ENDPOINTS =============

    async getProductReviews(productId) {
        return this.request(`/reviews/product/${productId}`);
    }

    async createReview(data) {
        return this.request('/reviews', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteReview(id) {
        return this.request(`/reviews/${id}`, {
            method: 'DELETE',
        });
    }

    async getAllReviews() {
        return this.request('/reviews/all');
    }

    // ============= INQUIRY ENDPOINTS =============

    async createInquiry(data) {
        return this.request('/inquiries', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getUserInquiries() {
        return this.request('/inquiries/user');
    }

    async getAllInquiries() {
        return this.request('/inquiries/all');
    }

    async replyToInquiry(id, reply) {
        return this.request(`/inquiries/${id}/reply`, {
            method: 'POST',
            body: JSON.stringify({ reply }),
        });
    }

    // ============= WISHLIST ENDPOINTS =============

    async getWishlist() {
        return this.request('/wishlist');
    }

    async addToWishlist(productId) {
        return this.request(`/wishlist/${productId}`, {
            method: 'POST',
        });
    }

    async removeFromWishlist(productId) {
        return this.request(`/wishlist/${productId}`, {
            method: 'DELETE',
        });
    }

    async updateOrderLocation(id, location) {
        return this.request(`/orders/${id}/location`, {
            method: 'PUT',
            body: JSON.stringify(location),
        });
    }

    async initiateMpesa(orderId, phone, amount) {
        return this.request('/payments/mpesa/stk', {
            method: 'POST',
            body: JSON.stringify({ order_id: orderId, phone, amount }),
        });
    }

    async getMpesaStatus(orderId) {
        return this.request(`/payments/mpesa/status/${orderId}`);
    }

    // ============= ANALYTICS ENDPOINTS =============

    async getAnalyticsOverview() {
        return this.request('/analytics/overview');
    }

    async getTrafficData(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/analytics/traffic${query ? '?' + query : ''}`);
    }

    async getSalesAnalytics(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/analytics/sales${query ? '?' + query : ''}`);
    }

    async getUserAnalytics(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/analytics/users${query ? '?' + query : ''}`);
    }
}

export const apiService = new ApiService();
export default apiService;