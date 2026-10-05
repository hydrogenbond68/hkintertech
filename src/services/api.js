const REQUEST_TIMEOUT_MS = 15000;

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();

const API_BASE_URL = (() => {
    if (RAW_API_URL) return RAW_API_URL.replace(/\/+$/, '');

    // No explicit API host. In dev, talk to the local backend; in a built
    // bundle, default to same-origin, which is what nginx.conf and the k8s
    // ingress provide.
    if (import.meta.env.DEV) return 'http://localhost:5000/api';
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
        'If this app is served as static files (e.g. Vercel), requests will 404 ' +
        'unless a proxy rewrites /api to the backend.'
    );
}

/**
 * Builds a human-readable error for the failures that otherwise surface as an
 * opaque "Failed to fetch": a blocked CORS preflight, a suspended/dead host,
 * and an HTML error page from a proxy are all indistinguishable otherwise.
 */
const describeTransportFailure = async (error, url) => {
    if (error?.name === 'AbortError') {
        return `Request to ${url} timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The server may be slow or unreachable.`;
    }
    // A network-level failure throws a TypeError. The exact wording differs by
    // runtime ("Failed to fetch" in browsers, "fetch failed" in Node), and a
    // CORS rejection is indistinguishable from an offline host here.
    const isNetworkFailure =
        error instanceof TypeError ||
        error?.name === 'TypeError' ||
        /failed to fetch|fetch failed|networkerror|load failed/i.test(error?.message || '');
    if (isNetworkFailure) {
        return `Could not reach the API at ${url}. The server may be down or suspended, or it may be rejecting this site's requests via CORS. Check that the backend is running and that its CORS_ORIGINS allows this origin.`;
    }
    return error?.message || `Request to ${url} failed.`;
};

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('access_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    getHeaders(options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const headers = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        };
        if (method !== 'GET') {
            headers['Cache-Control'] = 'no-store';
        }
        if (options.headers) {
            Object.assign(headers, options.headers);
        }
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        };

        // Without an abort signal a dead host leaves the request pending until
        // the browser gives up, which surfaces as an indefinite spinner.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        config.signal = config.signal || controller.signal;

        console.log(`[API] → ${config.method || 'GET'} ${url}`);
        const startTime = Date.now();

        try {
            const response = await fetch(url, config);
            const duration = Date.now() - startTime;
            console.log(`[API] ← ${response.status} ${url} (${duration}ms)`);

            const contentType = response.headers.get('content-type') || '';

            // A proxy or a suspended host returns HTML, not JSON. Parsing it
            // used to throw "Invalid response from server", hiding the status.
            if (!contentType.includes('application/json')) {
                const body = await response.text().catch(() => '');
                const detail = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
                throw new Error(
                    `API returned ${response.status} ${response.statusText || ''} with a non-JSON response. ` +
                    `Check that the API host is correct and running.${detail ? ` Server said: ${detail}` : ''}`
                );
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.error(`[API] Malformed JSON from ${url}:`, jsonErr);
                throw new Error(`API returned a malformed response from ${url} (HTTP ${response.status}).`);
            }

            if (!response.ok) {
                console.error(`[API] Error ${response.status} from ${url}:`, data);
                if (response.status === 401) {
                    this.setToken(null);
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                if (response.status === 503) {
                    throw new Error(
                        `The API is unavailable (HTTP 503)${data?.error ? `: ${data.error}` : ''}. ` +
                        'The backend service is suspended, asleep, or not deployed.'
                    );
                }
                throw new Error(data.error || data.message || `API request failed (${response.status})`);
            }

            return data;
        } catch (error) {
            const duration = Date.now() - startTime;
            const message = await describeTransportFailure(error, url);
            console.error(`[API] ✗ ${config.method || 'GET'} ${url} failed after ${duration}ms: ${message}`);
            const wrapped = new Error(message);
            wrapped.cause = error;
            wrapped.status = error?.status;
            throw wrapped;
        } finally {
            clearTimeout(timer);
        }
    }

    // ============= AUTH ENDPOINTS =============
    
    async register(data) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        return response;
    }

    async login(data) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (response.access_token) {
            this.setToken(response.access_token);
        }
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
        const response = await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response;
    }

    async updateProduct(id, data) {
        const response = await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response;
    }

    async deleteProduct(id) {
        const response = await this.request(`/products/${id}`, {
            method: 'DELETE',
        });
        return response;
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
                update_data: updateData 
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
