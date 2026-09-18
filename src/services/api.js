const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hk-backend-2.onrender.com/api';

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

        console.log(`[API] → ${config.method || 'GET'} ${url}`);
        const startTime = Date.now();

        try {
            const response = await fetch(url, config);
            const duration = Date.now() - startTime;
            console.log(`[API] ← ${response.status} ${url} (${duration}ms)`);

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.error(`[API] Invalid JSON response from ${url}:`, jsonErr);
                throw new Error(`Invalid response from server (${response.status})`);
            }

            if (!response.ok) {
                console.error(`[API] Error ${response.status} from ${url}:`, data);
                if (response.status === 401) {
                    this.setToken(null);
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                throw new Error(data.error || `API request failed (${response.status})`);
            }

            return data;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[API] ✗ Failed ${url} (${duration}ms):`, error.message);
            throw error;
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
}

export const apiService = new ApiService();
export default apiService;
