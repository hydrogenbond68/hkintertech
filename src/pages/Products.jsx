import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiService from '../services/api';
import { useCache } from '../contexts/CacheContext';
import ProductCard from '../components/products/ProductCard';
import { Filter, ChevronDown } from 'lucide-react';

const Products = () => {
    const [searchParams] = useSearchParams();
    const { productVersion } = useCache();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        search: searchParams.get('search') || '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [filters, productVersion]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                ...filters,
                min_price: filters.minPrice || undefined,
                max_price: filters.maxPrice || undefined,
                per_page: 20
            };
            const data = await apiService.getProducts(params);
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await apiService.getCategories();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            search: '',
            minPrice: '',
            maxPrice: '',
            sortBy: 'created_at',
            sortOrder: 'desc'
        });
    };

    return (
        <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Filters - Desktop */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                        <h3 className="font-semibold text-lg mb-4">Filters</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harykims-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price Range
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                        className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harykims-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                        className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harykims-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sort By
                                </label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harykims-500"
                                >
                                    <option value="created_at">Newest</option>
                                    <option value="price">Price</option>
                                    <option value="name">Name</option>
                                </select>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="w-full btn-outline text-sm"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Products</h1>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Mobile Filters */}
                    {showFilters && (
                        <div className="md:hidden bg-white rounded-xl shadow-sm p-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price Range
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.minPrice}
                                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                            className="w-1/2 px-3 py-2 border rounded-lg"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.maxPrice}
                                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                            className="w-1/2 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="w-full btn-outline text-sm"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-600 text-lg mb-2">{error}</p>
                            <button
                                onClick={fetchProducts}
                                className="btn-primary inline-flex items-center"
                            >
                                Retry
                            </button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No products found</p>
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-harykims-600 hover:text-harykims-700"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Products;
