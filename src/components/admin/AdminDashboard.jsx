import React, { useState, useEffect, useCallback } from 'react';
import logoImage from '../../assets/logo.jpeg';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { useRealtimeOrders } from '../../hooks/useRealtimeOrders';
import { AVATAR_PLACEHOLDER } from '../../utils/image';
import MapView from '../common/MapView';
import apiService from '../../services/api';
import {
    Package, ShoppingBag, Users, Star,
    Plus, Edit, Trash2, DollarSign, X, Upload, RefreshCw,
    User, Search,
    UserCog, UserX, UserCheck, MapIcon,
    BarChart2, TrendingUp, Eye, Activity
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { invalidateProducts, invalidateOrders } = useCache();
    const [activeTab, setActiveTab] = useState('overview');
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageUrls, setImageUrls] = useState([]);
    const [imageInput, setImageInput] = useState('');
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [trafficData, setTrafficData] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [analyticsTimeRange, setAnalyticsTimeRange] = useState('30d');
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        sub_category: '',
        stock_quantity: '',
        min_order_quantity: '1',
        specifications: {},
        is_featured: false
    });

    const { orders: realtimeOrders, setOrders: setRealtimeOrders, realtimeConnected } = useRealtimeOrders([]);

    // Load data function
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [productsData, ordersData, usersData] = await Promise.all([
                apiService.getProducts({ per_page: 1000 }),
                apiService.getOrders().catch(() => ({ orders: [] })),
                apiService.getAllUsers().catch(() => ({ users: [] }))
            ]);

            setProducts(productsData.products || []);
            setRealtimeOrders(ordersData.orders || []);
            setUsers(usersData.users || []);
            setLastUpdated(new Date());

            if (productsData.products) {
                const uniqueCategories = [...new Set(productsData.products.map(p => p.category).filter(Boolean))];
                setCategories(uniqueCategories);
            }

            try {
                const reviewsData = await apiService.getProductReviews(1);
                setReviews(reviewsData.reviews || []);
            } catch {
                setReviews([]);
            }

            try {
                const inquiriesData = await apiService.getUserInquiries();
                setInquiries(inquiriesData.inquiries || []);
            } catch {
                setInquiries([]);
            }

        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    }, [setRealtimeOrders]);

    // Load analytics data
    const loadAnalytics = useCallback(async () => {
        try {
            setAnalyticsLoading(true);
            const [overviewData, trafficDataRes, salesDataRes] = await Promise.all([
                apiService.getAnalyticsOverview().catch(() => null),
                apiService.getTrafficData({ range: analyticsTimeRange }).catch(() => ({ data: [] })),
                apiService.getSalesAnalytics({ range: analyticsTimeRange }).catch(() => ({ data: [] }))
            ]);

            if (overviewData) setAnalytics(overviewData);
            setTrafficData(trafficDataRes.data || []);
            setSalesData(salesDataRes.data || []);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    }, [analyticsTimeRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (activeTab === 'analytics') {
            loadAnalytics();
        }
    }, [activeTab, loadAnalytics]);


    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await apiService.deleteProduct(id);
                await loadData();
                invalidateProducts();
                alert('Product deleted successfully!');
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product. Please try again.');
            }
        }
    };

    // --- NEW: Handle local image upload ---
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            e.target.value = '';
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result; // This is a data URL
            setImageUrls(prev => [...prev, base64Data]);
            e.target.value = ''; // Reset input
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Failed to read image file');
        };
        reader.readAsDataURL(file);
    };

    const handleAddImage = () => {
        if (imageInput.trim()) {
            setImageUrls([...imageUrls, imageInput.trim()]);
            setImageInput('');
        }
    };

    const handleRemoveImage = (index) => {
        setImageUrls(imageUrls.filter((_, i) => i !== index));
    };

    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...productForm,
                price: parseFloat(productForm.price),
                stock_quantity: parseInt(productForm.stock_quantity),
                min_order_quantity: parseInt(productForm.min_order_quantity),
                image_urls: imageUrls,
                specifications: productForm.specifications || {}
            };
            
            if (editingProduct) {
                await apiService.updateProduct(editingProduct.id, data);
                await loadData();
                invalidateProducts();
                alert('Product updated successfully!');
            } else {
                await apiService.createProduct(data);
                await loadData();
                invalidateProducts();
                alert('Product created successfully!');
            }
            resetForm();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product: ' + (error.message || 'Please try again.'));
        }
    };

    const resetForm = () => {
        setShowProductForm(false);
        setEditingProduct(null);
        setImageUrls([]);
        setImageInput('');
        setProductForm({
            name: '',
            description: '',
            price: '',
            category: '',
            sub_category: '',
            stock_quantity: '',
            min_order_quantity: '1',
            specifications: {},
            is_featured: false
        });
    };

    const editProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price ? product.price.toString() : '',
            category: product.category || '',
            sub_category: product.sub_category || '',
            stock_quantity: product.stock_quantity ? product.stock_quantity.toString() : '',
            min_order_quantity: (product.min_order_quantity || 1).toString(),
            specifications: product.specifications || {},
            is_featured: product.is_featured || false
        });
        
        let images = [];
        if (product.image_urls) {
            try {
                if (typeof product.image_urls === 'string') {
                    images = JSON.parse(product.image_urls);
                } else if (Array.isArray(product.image_urls)) {
                    images = product.image_urls;
                }
            } catch {
                images = [];
            }
        }
        setImageUrls(Array.isArray(images) ? images : []);
        setShowProductForm(true);
    };

    const [statusSaving, setStatusSaving] = useState(false);
    const [statusError, setStatusError] = useState('');

    const handleUpdateOrderStatus = async (orderId, status) => {
        const previous = realtimeOrders.find((o) => o.id === orderId)?.status;
        // Optimistic update so the select does not snap back while the request
        // is in flight; reverted if the API rejects the transition.
        setStatusSaving(true);
        setStatusError('');
        setRealtimeOrders(realtimeOrders.map((o) => (o.id === orderId ? { ...o, status } : o)));
        setSelectedOrder((current) => (current && current.id === orderId ? { ...current, status } : current));
        try {
            await apiService.updateOrderStatus(orderId, status);
            invalidateOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            setRealtimeOrders(realtimeOrders.map((o) => (o.id === orderId ? { ...o, status: previous } : o)));
            setSelectedOrder((current) => (current && current.id === orderId ? { ...current, status: previous } : current));
            setStatusError(`Could not update order #${orderId}: ${error.message}`);
        } finally {
            setStatusSaving(false);
        }
    };

    const handleReplyToInquiry = async (inquiryId, reply) => {
        try {
            await apiService.replyToInquiry(inquiryId, { reply });
            await loadData();
        } catch (error) {
            console.error('Error replying to inquiry:', error);
        }
    };

    const handleUpdateUserRole = async (userId, isAdmin) => {
        try {
            await apiService.updateUserRole(userId, isAdmin);
            await loadData();
            invalidateProducts();
            setShowUserModal(false);
            alert(`User role updated successfully!`);
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role. Please try again.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await apiService.deleteUser(userId);
                await loadData();
                invalidateProducts();
                alert('User deleted successfully!');
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user. Please try again.');
            }
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const getProductImage = (product) => {
        if (product.image_urls) {
            try {
                const images = typeof product.image_urls === 'string' 
                    ? JSON.parse(product.image_urls) 
                    : product.image_urls;
                if (Array.isArray(images) && images.length > 0) {
                    return images[0];
                }
            } catch {
                return AVATAR_PLACEHOLDER;
            }
        }
        return AVATAR_PLACEHOLDER;
    };

    // Filter products based on search and category
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Filter users based on search
    const filteredUsers = users.filter(u => {
        const search = searchTerm.toLowerCase();
        return u.email.toLowerCase().includes(search) ||
               u.first_name.toLowerCase().includes(search) ||
               u.last_name.toLowerCase().includes(search) ||
               (u.company_name && u.company_name.toLowerCase().includes(search));
    });

    const totalRevenue = realtimeOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const orderItemCount = (order) =>
        (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const orderLabel = (order) => order.order_number || order.id;

    const filteredOrders = realtimeOrders.filter((order) => {
        if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
        const search = orderSearch.trim().toLowerCase();
        if (!search) return true;
        return (
            String(order.order_number || '').toLowerCase().includes(search) ||
            String(order.user_name || '').toLowerCase().includes(search) ||
            String(order.user_email || '').toLowerCase().includes(search) ||
            (order.items || []).some((item) => String(item.product_name || '').toLowerCase().includes(search))
        );
    });
    const pendingOrders = realtimeOrders.filter(o => o.status === 'pending').length;
    const totalProducts = products.length;

    if (loading && realtimeOrders.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-harykims-600"></div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
<img 
                            src={logoImage} 
                            alt="Harykims Intertech" 
                            className="h-12 w-auto object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                            }}
                        />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user?.first_name} {user?.last_name}</p>
                        <p className="text-sm text-harykims-600">Total Products: {totalProducts} | Total Users: {users.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadData} 
                        className="px-4 py-2 bg-harykims-600 text-white rounded-lg hover:bg-harykims-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Data
                    </button>
                    <span className="text-sm text-gray-600">
                        Last updated: {lastUpdated.toLocaleTimeString()} · Realtime: {realtimeConnected ? 'connected' : 'reconnecting'}
                    </span>
                </div>
            </div>

            {/* Stats Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-harykims-600">{formatPrice(totalRevenue)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold">{realtimeOrders.length}</p>
                            </div>
                            <ShoppingBag className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="mt-2 text-xs text-yellow-600">{pendingOrders} pending</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold">{totalProducts}</p>
                            </div>
                            <Package className="w-8 h-8 text-harykims-600" />
                        </div>
                        <div className="mt-2 text-xs text-gray-600">{products.filter(p => p.is_featured).length} featured</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Users</p>
                                <p className="text-2xl font-bold">{users.length}</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="border-b overflow-x-auto">
                    <div className="flex">
                        {['overview', 'products', 'orders', 'map', 'reviews', 'inquiries', 'users', 'analytics'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeTab === tab
                                        ? 'border-b-2 border-harykims-600 text-harykims-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Quick Overview</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">Recent Orders</h3>
                                    {realtimeOrders.slice(0, 5).map((order) => (
                                        <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium">Order #{order.order_number || order.id}</p>
                                                <p className="text-sm text-gray-600">{formatPrice(order.total_amount)}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {order.status || 'pending'}
                                            </span>
                                        </div>
                                    ))}
                                    {realtimeOrders.length === 0 && (
                                        <p className="text-gray-500 text-sm">No orders yet</p>
                                    )}
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">Recent Reviews</h3>
                                    {reviews.slice(0, 5).map((review) => (
                                        <div key={review.id} className="py-2 border-b last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{review.user_name || 'User'}</span>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${
                                                            i < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                        }`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-gray-600 truncate">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                    {reviews.length === 0 && (
                                        <p className="text-gray-500 text-sm">No reviews yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Manage Products ({filteredProducts.length})</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={loadData}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setShowProductForm(true);
                                        }}
                                        className="btn-primary flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Product
                                    </button>
                                </div>
                            </div>

                            {/* Search and Filter */}
                            <div className="flex flex-wrap gap-4 mb-4">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harykims-500 focus:border-harykims-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harykims-500 focus:border-harykims-500 outline-none"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {showProductForm && (
                                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                                    <h3 className="font-semibold mb-4">
                                        {editingProduct ? 'Edit Product' : 'New Product'}
                                    </h3>
                                    <form onSubmit={handleSubmitProduct} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                                <input 
                                                    type="text" 
                                                    value={productForm.name} 
                                                    onChange={(e) => setProductForm({...productForm, name: e.target.value})} 
                                                    className="input-field" 
                                                    required 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                                <input 
                                                    type="text" 
                                                    value={productForm.category} 
                                                    onChange={(e) => setProductForm({...productForm, category: e.target.value})} 
                                                    className="input-field" 
                                                    required 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={productForm.price} 
                                                    onChange={(e) => setProductForm({...productForm, price: e.target.value})} 
                                                    className="input-field" 
                                                    required 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                                                <input 
                                                    type="number" 
                                                    value={productForm.stock_quantity} 
                                                    onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})} 
                                                    className="input-field" 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                            <textarea 
                                                value={productForm.description} 
                                                onChange={(e) => setProductForm({...productForm, description: e.target.value})} 
                                                className="input-field" 
                                                rows="3" 
                                                required 
                                            />
                                        </div>

                                        {/* Image Management with Local Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                                            
                                            {/* File upload from local computer */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="flex-1 cursor-pointer">
                                                    <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-harykims-300 rounded-lg hover:border-harykims-500 transition-colors">
                                                        <Upload className="w-5 h-5 text-harykims-600" />
                                                        <span className="text-sm text-gray-600">Choose images from computer</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                        />
                                                    </div>
                                                </label>
                                                <span className="text-xs text-gray-500">or</span>
                                                <input
                                                    type="url"
                                                    placeholder="Enter image URL"
                                                    value={imageInput}
                                                    onChange={(e) => setImageInput(e.target.value)}
                                                    className="flex-1 input-field"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddImage}
                                                    className="btn-primary flex items-center"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add URL
                                                </button>
                                            </div>
                                            
                                            {imageUrls.length > 0 && (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                                                    {imageUrls.map((url, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={url}
                                                                alt={`Product ${index + 1}`}
                                                                className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                                                onError={(e) => {
                                                                    e.target.src = AVATAR_PLACEHOLDER;
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(index)}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Upload images from your computer or add image URLs (3-5 images recommended)</p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={productForm.is_featured} 
                                                    onChange={(e) => setProductForm({...productForm, is_featured: e.target.checked})} 
                                                />
                                                <span className="text-sm">Featured Product</span>
                                            </label>
                                        </div>

                                        <div className="flex gap-3">
                                            <button type="submit" className="btn-primary">
                                                {editingProduct ? 'Update' : 'Create'} Product
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={resetForm} 
                                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <img 
                                                        src={getProductImage(product)} 
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                        onError={(e) => {
                                                            e.target.src = AVATAR_PLACEHOLDER;
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                                <td className="px-6 py-4">{product.category}</td>
                                                <td className="px-6 py-4 text-harykims-600 font-semibold">{formatPrice(product.price)}</td>
                                                <td className="px-6 py-4">{product.stock_quantity}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        product.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {product.is_active !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button 
                                                        onClick={() => editProduct(product)} 
                                                        className="text-harykims-600 hover:text-harykims-800"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteProduct(product.id)} 
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No products found. Click "Add Product" to create one.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <h2 className="text-xl font-semibold">Orders Management</h2>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={orderSearch}
                                            onChange={(e) => setOrderSearch(e.target.value)}
                                            placeholder="Search orders"
                                            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full sm:w-56"
                                        />
                                    </div>
                                    <select
                                        value={orderStatusFilter}
                                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                                        className="px-3 py-2 border rounded-lg text-sm"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {statusError && (
                                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                                    {statusError}
                                </div>
                            )}

                            <div className="space-y-4">
                                {filteredOrders.map((order) => (
                                    <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold">Order #{orderLabel(order)}</p>
                                                <p className="text-sm text-gray-600">
                                                    {order.user_name || 'Customer'}
                                                    {order.user_email ? ` · ${order.user_email}` : ''}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {orderItemCount(order)} item(s) · Total: {formatPrice(order.total_amount)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {order.createdAt || order.created_at
                                                        ? new Date(order.createdAt || order.created_at).toLocaleString()
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                                <select
                                                    value={order.status || 'pending'}
                                                    disabled={statusSaving}
                                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                    className="px-3 py-1 border rounded-lg text-sm disabled:opacity-60"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {order.status || 'pending'}
                                                </span>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="text-sm text-harykims-600 hover:text-harykims-700"
                                                >
                                                    View details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">
                                        {realtimeOrders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Map Tab */}
                    {activeTab === 'map' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <MapIcon className="w-5 h-5 mr-2 text-harykims-600" />
                                Active Order Locations
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Live map of delivery-agent order positions. Orders without GPS coordinates are shown in the fallback list.
                            </p>
                            <MapView
                                orders={realtimeOrders}
                                center={[-1.286389, 36.817223]}
                                zoom={12}
                                height="520px"
                            />
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Reviews Management</h2>
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="border-b pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{review.user_name || 'User'}</span>
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-4 h-4 ${
                                                                i < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                            }`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.comment && <p className="mt-1 text-gray-700">{review.comment}</p>}
                                                <p className="text-xs text-gray-500 mt-1">Product ID: {review.product_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm text-gray-500">{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {reviews.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">No reviews found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inquiries Tab */}
                    {activeTab === 'inquiries' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Customer Inquiries</h2>
                            <div className="space-y-4">
                                {inquiries.map((inquiry) => (
                                    <div key={inquiry.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold">{inquiry.subject}</h3>
                                                <p className="text-sm text-gray-600">
                                                    From: {inquiry.user_name || 'User'} • Product: {inquiry.product_name || 'N/A'}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                inquiry.status === 'replied' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {inquiry.status || 'pending'}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 mb-3">{inquiry.message}</p>
                                        {inquiry.reply ? (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Reply:</p>
                                                <p>{inquiry.reply}</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const form = e.target;
                                                const reply = form.reply.value;
                                                if (reply) {
                                                    handleReplyToInquiry(inquiry.id, reply);
                                                    form.reset();
                                                }
                                            }} className="flex gap-2">
                                                <input type="text" name="reply" placeholder="Write a reply..." className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harykims-500" required />
                                                <button type="submit" className="btn-primary">Send</button>
                                            </form>
                                        )}
                                    </div>
                                ))}
                                {inquiries.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">No inquiries found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Users Management ({filteredUsers.length})</h2>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harykims-500 focus:border-harykims-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={loadData}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-harykims-100 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-harykims-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                                                            <p className="text-xs text-gray-500">ID: #{u.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                                <td className="px-6 py-4 text-gray-600">{u.company_name || '-'}</td>
                                                <td className="px-6 py-4 text-gray-600">{u.phone || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        u.is_admin ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {u.is_admin ? 'Administrator' : 'Customer'}
                                                    </span>
                                                    {u.is_verified && (
                                                        <span className="ml-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">
                                                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setShowUserModal(true);
                                                            }}
                                                            className="text-harykims-600 hover:text-harykims-800"
                                                            title="Edit User"
                                                        >
                                                            <UserCog className="w-4 h-4" />
                                                        </button>
                                                        {u.id !== user?.id && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateUserRole(u.id, !u.is_admin)}
                                                                    className={`${
                                                                        u.is_admin ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                                                                    }`}
                                                                    title={u.is_admin ? 'Remove Admin' : 'Make Admin'}
                                                                >
                                                                    {u.is_admin ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No users found.</p>
                                    </div>
                                )}
                            </div>

                            {/* Order Detail Modal */}
                            {selectedOrder && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    Order #{orderLabel(selectedOrder)}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {selectedOrder.createdAt || selectedOrder.created_at
                                                        ? new Date(selectedOrder.createdAt || selectedOrder.created_at).toLocaleString()
                                                        : 'Date unavailable'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedOrder(null)}
                                                className="text-gray-400 hover:text-gray-600"
                                                aria-label="Close order details"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="text-sm text-gray-500">Customer</label>
                                                <p className="font-medium">{selectedOrder.user_name || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Email</label>
                                                <p className="font-medium">{selectedOrder.user_email || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Payment</label>
                                                <p className="font-medium capitalize">
                                                    {selectedOrder.payment_method || 'n/a'} · {selectedOrder.payment_status || 'pending'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Delivery status</label>
                                                <p className="font-medium capitalize">{selectedOrder.delivery_status || 'pending'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-sm text-gray-500">Shipping address</label>
                                                <p className="font-medium">
                                                    {[selectedOrder.shipping_address, selectedOrder.shipping_city, selectedOrder.shipping_country]
                                                        .filter(Boolean)
                                                        .join(', ') || 'Not provided'}
                                                </p>
                                            </div>
                                            {selectedOrder.notes && (
                                                <div className="col-span-2">
                                                    <label className="text-sm text-gray-500">Notes</label>
                                                    <p className="font-medium">{selectedOrder.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="font-semibold mb-2">Items</h4>
                                        <div className="space-y-2 mb-6">
                                            {(selectedOrder.items || []).map((item, index) => (
                                                <div
                                                    key={item.product || index}
                                                    className="flex items-center justify-between gap-4 border rounded-lg p-3"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {item.product_image ? (
                                                            <img
                                                                src={item.product_image}
                                                                alt={item.product_name}
                                                                className="w-10 h-10 rounded object-cover"
                                                                onError={(e) => { e.target.src = AVATAR_PLACEHOLDER; }}
                                                            />
                                                        ) : null}
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{item.product_name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {item.quantity} × {formatPrice(item.price)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold shrink-0">{formatPrice(item.subtotal)}</span>
                                                </div>
                                            ))}
                                            {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                                                <p className="text-sm text-gray-500">No items recorded</p>
                                            )}
                                        </div>

                                        <div className="border-t pt-4 mb-6 space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span>{formatPrice(selectedOrder.total_amount - (selectedOrder.shipping_fee || 0) - (selectedOrder.tax_amount || 0))}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Shipping</span>
                                                <span>{formatPrice(selectedOrder.shipping_fee || 0)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Tax</span>
                                                <span>{formatPrice(selectedOrder.tax_amount || 0)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-base">
                                                <span>Total</span>
                                                <span>{formatPrice(selectedOrder.total_amount)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <label htmlFor="order-status-select" className="text-sm font-medium text-gray-700">
                                                Update status
                                            </label>
                                            <select
                                                id="order-status-select"
                                                value={selectedOrder.status || 'pending'}
                                                disabled={statusSaving}
                                                onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                                                className="px-3 py-2 border rounded-lg text-sm disabled:opacity-60"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <span className="text-sm text-gray-500">
                                                {statusSaving ? 'Saving…' : 'Saved automatically'}
                                            </span>
                                        </div>

                                        {(selectedOrder.status_history || []).length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="font-semibold mb-2">Status history</h4>
                                                <ul className="space-y-1 text-sm text-gray-600">
                                                    {selectedOrder.status_history.map((entry, index) => (
                                                        <li key={index} className="capitalize">
                                                            {entry.status}
                                                            {entry.updated_at ? ` · ${new Date(entry.updated_at).toLocaleString()}` : ''}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* User Detail Modal */}
                            {showUserModal && selectedUser && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4">
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
                                            <button
                                                onClick={() => setShowUserModal(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="text-sm text-gray-500">Full Name</label>
                                                <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Email</label>
                                                <p className="font-medium">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Company</label>
                                                <p className="font-medium">{selectedUser.company_name || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Phone</label>
                                                <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Address</label>
                                                <p className="font-medium">{selectedUser.address || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Member Since</label>
                                                <p className="font-medium">
                                                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Role</label>
                                                <p className="font-medium">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        selectedUser.is_admin ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {selectedUser.is_admin ? 'Administrator' : 'Customer'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Status</label>
                                                <p className="font-medium">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        selectedUser.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {selectedUser.is_verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 border-t pt-6">
                                            {selectedUser.id !== user?.id && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            handleUpdateUserRole(selectedUser.id, !selectedUser.is_admin);
                                                        }}
                                                        className={`flex-1 py-2 rounded-lg font-medium ${
                                                            selectedUser.is_admin 
                                                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                                : 'bg-harykims-600 hover:bg-harykims-700 text-white'
                                                        }`}
                                                    >
                                                        {selectedUser.is_admin ? 'Remove Admin' : 'Make Admin'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to delete user ${selectedUser.first_name} ${selectedUser.last_name}?`)) {
                                                                handleDeleteUser(selectedUser.id);
                                                            }
                                                        }}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium"
                                                    >
                                                        Delete User
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setShowUserModal(false)}
                                                className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg font-medium"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-harykims-600" />
                                    Analytics & Traffic
                                </h2>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={analyticsTimeRange}
                                        onChange={(e) => setAnalyticsTimeRange(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-harykims-500"
                                    >
                                        <option value="7d">Last 7 Days</option>
                                        <option value="30d">Last 30 Days</option>
                                        <option value="90d">Last 90 Days</option>
                                    </select>
                                    <button
                                        onClick={loadAnalytics}
                                        disabled={analyticsLoading}
                                        className="px-4 py-2 bg-harykims-600 text-white rounded-lg hover:bg-harykims-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            {/* Overview Stats */}
                            {analytics && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Total Visitors</p>
                                                <p className="text-2xl font-bold text-harykims-600">{analytics.total_visitors?.toLocaleString() || '0'}</p>
                                            </div>
                                            <Eye className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <div className="mt-2 text-xs text-green-600">
                                            +{analytics.visitor_change || 0}% from last period
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Page Views</p>
                                                <p className="text-2xl font-bold">{analytics.total_pageviews?.toLocaleString() || '0'}</p>
                                            </div>
                                            <Activity className="w-8 h-8 text-green-500" />
                                        </div>
                                        <div className="mt-2 text-xs text-green-600">
                                            +{analytics.pageview_change || 0}% from last period
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Avg. Session Duration</p>
                                                <p className="text-2xl font-bold">{analytics.avg_session_duration || '0m 0s'}</p>
                                            </div>
                                            <TrendingUp className="w-8 h-8 text-purple-500" />
                                        </div>
                                        <div className="mt-2 text-xs text-gray-600">
                                            {analytics.session_duration_change || 0}% change
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Bounce Rate</p>
                                                <p className="text-2xl font-bold">{analytics.bounce_rate || '0'}%</p>
                                            </div>
                                            <BarChart2 className="w-8 h-8 text-orange-500" />
                                        </div>
                                        <div className="mt-2 text-xs text-gray-600">
                                            {analytics.bounce_rate_change || 0}% change
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Traffic Chart */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="font-semibold text-lg">Traffic Overview</h3>
                                    <p className="text-sm text-gray-500 mt-1">Daily visitors over the selected time period</p>
                                </div>
                                <div className="p-6">
                                    {analyticsLoading ? (
                                        <div className="flex justify-center items-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-harykims-600"></div>
                                        </div>
                                    ) : trafficData.length > 0 ? (
                                        <div className="space-y-4">
                                            {trafficData.slice(0, 30).map((day, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <span className="w-24 text-sm text-gray-500 font-mono">{day.date}</span>
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-harykims-600 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min((day.visitors / (Math.max(...trafficData.map(d => d.visitors), 1))) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="w-16 text-sm font-medium text-gray-900 text-right">{day.visitors}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No traffic data available for the selected period.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sales Analytics */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="font-semibold text-lg">Sales Performance</h3>
                                    <p className="text-sm text-gray-500 mt-1">Revenue and orders over time</p>
                                </div>
                                <div className="p-6">
                                    {salesData.length > 0 ? (
                                        <div className="space-y-4">
                                            {salesData.slice(0, 30).map((day, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <span className="w-24 text-sm text-gray-500 font-mono">{day.date}</span>
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min((day.revenue / (Math.max(...salesData.map(d => d.revenue), 1))) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="w-24 text-sm font-medium text-gray-900 text-right">{formatPrice(day.revenue)}</span>
                                                    <span className="w-16 text-sm text-gray-500 text-right">{day.orders} orders</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No sales data available for the selected period.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Pages / Referrers */}
                            {analytics && (analytics.top_pages || analytics.top_referrers) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {analytics.top_pages && analytics.top_pages.length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="p-6 border-b border-gray-100">
                                                <h3 className="font-semibold">Top Pages</h3>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {analytics.top_pages.slice(0, 10).map((page, index) => (
                                                    <div key={index} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-8 text-center text-sm font-medium text-gray-500">#{index + 1}</span>
                                                            <div>
                                                                <p className="font-medium text-gray-900 truncate max-w-xs">{page.path}</p>
                                                                <p className="text-xs text-gray-500">{page.views} views</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">{page.views.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {analytics.top_referrers && analytics.top_referrers.length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="p-6 border-b border-gray-100">
                                                <h3 className="font-semibold">Top Referrers</h3>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {analytics.top_referrers.slice(0, 10).map((ref, index) => (
                                                    <div key={index} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-8 text-center text-sm font-medium text-gray-500">#{index + 1}</span>
                                                            <div>
                                                                <p className="font-medium text-gray-900 truncate max-w-xs">{ref.source}</p>
                                                                <p className="text-xs text-gray-500">{ref.visits} visits</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">{ref.visits.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!analytics && !analyticsLoading && (
                                <div className="text-center py-12 text-gray-500">
                                    <BarChart2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Analytics data not available. Please ensure the backend analytics endpoints are configured.</p>
                                    <button
                                        onClick={loadAnalytics}
                                        className="mt-4 btn-primary"
                                    >
                                        Try Loading Analytics
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
