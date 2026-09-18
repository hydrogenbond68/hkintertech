import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import logoImage from '../assets/logo.jpeg';
import heroImage from '../assets/hero-earbuds.jpg';
import { useCache } from '../contexts/CacheContext';
import ProductCard from '../components/products/ProductCard';
import ProductGridSkeleton from '../components/common/ProductGridSkeleton';
import { 
    ArrowRight, Award, Truck, Shield, Headphones, 
    TrendingUp, Clock, Star, ChevronRight, 
    Laptop, Smartphone, Watch, Speaker, Camera, 
    Home as HomeIcon, Shirt, Car, Book, Dumbbell, 
    Coffee, Gift, Package, Users, Globe, BarChart3,
    ShoppingBag, Sparkles, Zap, CheckCircle,
    Heart, Gamepad, HelpCircle, Leaf, RefreshCw,
    MessageCircle, Instagram, Facebook, Twitter, 
    Youtube, Linkedin, Send, Music2, Share2
} from 'lucide-react';

// Custom TikTok icon component (since it might not be available in all versions)
const TikTokIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

const Home = () => {
    const { productVersion } = useCache();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [featuredData, newData, trendingData, categoriesData] = await Promise.all([
                apiService.getProducts({ featured: true, per_page: 12 }),
                apiService.getProducts({ sortBy: 'created_at', sortOrder: 'desc', per_page: 8 }),
                apiService.getProducts({ sortBy: 'popularity', sortOrder: 'desc', per_page: 8 }),
                apiService.getCategories()
            ]);
            
            setFeaturedProducts(featuredData.products || []);
            setNewProducts(newData.products || []);
            setTrendingProducts(trendingData.products || []);
            setCategories(categoriesData.categories || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message || 'Failed to load some products');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const refresh = async () => {
        setIsRefreshing(true);
        await fetchData();
    };

    useEffect(() => {
        fetchData();
        
        const interval = setInterval(() => {
            fetchData();
        }, 60000);
        
        return () => clearInterval(interval);
    }, [productVersion]);

    // Category icons mapping
    const categoryIcons = {
        'Electronics': <Laptop className="w-8 h-8" />,
        'Fashion': <Shirt className="w-8 h-8" />,
        'Home & Living': <HomeIcon className="w-8 h-8" />,
        'Sports & Outdoors': <Dumbbell className="w-8 h-8" />,
        'Office & Stationery': <Book className="w-8 h-8" />,
        'Automotive': <Car className="w-8 h-8" />,
        'Beauty & Grooming': <Sparkles className="w-8 h-8" />,
        'Travel Accessories': <Globe className="w-8 h-8" />,
        'Gaming Accessories': <Gamepad className="w-8 h-8" />,
        'Pet Accessories': <Heart className="w-8 h-8" />,
        'Smart Home': <Smartphone className="w-8 h-8" />,
        'Kitchen Accessories': <Coffee className="w-8 h-8" />,
    };

    const features = [
        { icon: Shield, title: 'Quality Assurance', description: 'Verified suppliers and products' },
        { icon: Truck, title: 'Fast Delivery', description: 'Quick shipping across Kenya' },
        { icon: Headphones, title: '24/7 Support', description: 'Dedicated customer service' },
        { icon: Leaf, title: 'Eco-Friendly', description: 'Sustainable business practices' },
    ];

    // Social Media Links
    const socialLinks = [
        { 
            icon: TikTokIcon, 
            name: 'TikTok', 
            url: 'https://www.tiktok.com/@harykimsintertech/',
            color: 'hover:text-gray-300'
        },
        { 
            icon: Instagram, 
            name: 'Instagram', 
            url: 'https://www.instagram.com/harykimsintertech/',
            color: 'hover:text-pink-400'
        },
        { 
            icon: Facebook, 
            name: 'Facebook', 
            url: 'https://www.facebook.com/harykimsintertech/',
            color: 'hover:text-blue-400'
        },
        { 
            icon: Twitter, 
            name: 'Twitter (X)', 
            url: 'https://x.com/harykimsint',
            color: 'hover:text-gray-300'
        },

    ];

    const getCategoryIcon = (category) => {
        return categoryIcons[category] || <Package className="w-8 h-8" />;
    };

    return (
        <div className="bg-white">
            {/* Top Bar - Green Theme */}
            <div className="bg-harykims-600 text-white border-b border-harykims-700 hidden md:block">
                <div className="container-custom py-1.5">
                    <div className="flex justify-between text-xs">
                        <div className="flex items-center space-x-6">
                            <span>Welcome to Harykims Intertech</span>
                            <span className="font-semibold">Kenya's Premier B2B Marketplace</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/become-seller" className="hover:text-harykims-100">Sell on Harykims</Link>
                            <Link to="/about" className="hover:text-harykims-100">About</Link>
                            <Link to="/contact" className="hover:text-harykims-100">Contact</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section - Oraimo Earbuds with Gradient Overlays */}
            <div className="relative min-h-[640px] md:min-h-[720px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url(${heroImage})`,
                        backgroundPosition: 'center 30%'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-harykims-900/95 via-harykims-800/85 to-harykims-700/55" />
                <div className="absolute inset-0 bg-gradient-to-t from-harykims-950/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(46,163,46,0.25),_transparent_60%)]" />

                <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
                    <span className="inline-flex items-center gap-2 bg-green-500/95 backdrop-blur-sm text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                        </span>
                        24-Hour Availability
                    </span>
                </div>

                <div className="relative container-custom py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="mb-6">
                                <img
                                    src={logoImage}
                                    alt="Harykims Intertech"
                                    className="h-16 w-auto object-contain drop-shadow-lg"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-md">
                                Premium Oraimo <br />
                                <span className="text-harykims-200">Wireless Earbuds</span>
                            </h1>
                            <p className="text-lg text-white/90 mb-6 max-w-lg drop-shadow">
                                Stock Kenya's favourite Oraimo earbuds in bulk. Wholesale pricing, verified quality, and fast delivery to your shop or warehouse. Ideal for resellers, offices, and growing businesses.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/products" className="bg-white text-harykims-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center shadow-lg">
                                    Source Earbuds Now <ArrowRight className="w-5 h-5 ml-2" />
                                </Link>
                                <Link to="/become-seller" className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-semibold transition-colors border border-white/30 flex items-center backdrop-blur-sm">
                                    <Package className="w-5 h-5 mr-2" />
                                    Sell on Harykims
                                </Link>
                            </div>

                            <div className="mt-8 flex items-center space-x-4">
                                <span className="text-white/70 text-sm">Follow us:</span>
                                {socialLinks.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-white/70 hover:text-white transition-all duration-300 hover:scale-110 ${social.color}`}
                                        aria-label={social.name}
                                    >
                                        <social.icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div className="hidden lg:grid grid-cols-2 gap-4">
                            <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                                <div className="text-3xl font-bold text-white">500+</div>
                                <div className="text-sm text-harykims-100">Products Available</div>
                            </div>
                            <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                                <div className="text-3xl font-bold text-white">50+</div>
                                <div className="text-sm text-harykims-100">Verified Suppliers</div>
                            </div>
                            <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                                <div className="text-3xl font-bold text-white">1000+</div>
                                <div className="text-sm text-harykims-100">Happy Customers</div>
                            </div>
                            <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                                <div className="text-3xl font-bold text-white">24/7</div>
                                <div className="text-sm text-harykims-100">Customer Support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories - Green & White Theme */}
            <div className="container-custom py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-harykims-800">Shop by Category</h2>
                        <p className="text-gray-600 text-sm mt-1">Find products in your preferred category</p>
                    </div>
                    <Link to="/products" className="text-harykims-600 hover:text-harykims-700 flex items-center text-sm font-medium">
                        View All Categories <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
                
                {categories.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories.slice(0, 12).map((category, index) => (
                            <Link
                                key={index}
                                to={`/products?category=${encodeURIComponent(category)}`}
                                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-center border border-gray-100 hover:border-harykims-300 group"
                            >
                                <div className="text-harykims-500 mb-2 group-hover:scale-110 transition-transform">
                                    {getCategoryIcon(category)}
                                </div>
                                <h3 className="font-medium text-gray-800 text-sm">{category}</h3>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Features Bar - White with Green Accents */}
            <div className="bg-harykims-50 border-y border-harykims-100 py-8">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-3">
                                <div className="bg-harykims-100 p-3 rounded-full">
                                    <feature.icon className="w-5 h-5 text-harykims-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-800">{feature.title}</h4>
                                    <p className="text-xs text-gray-500">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Products */}
            <div className="container-custom py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-harykims-800 flex items-center">
                            <Sparkles className="w-6 h-6 text-harykims-500 mr-2" />
                            Featured Products
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">Handpicked quality products from trusted suppliers</p>
                    </div>
                    <Link to="/products?featured=true" className="text-harykims-600 hover:text-harykims-700 flex items-center text-sm font-medium">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
                
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                        <button onClick={refresh} className="text-harykims-600 hover:text-harykims-700 text-sm font-medium mt-2">
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <ProductGridSkeleton count={8} />
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>

            {/* Trending Products */}
            <div className="container-custom py-12 border-t border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-harykims-800 flex items-center">
                            <TrendingUp className="w-6 h-6 text-harykims-500 mr-2" />
                            Trending Now
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">Most popular products this month</p>
                    </div>
                    <Link to="/products?sortBy=popularity" className="text-harykims-600 hover:text-harykims-700 flex items-center text-sm font-medium">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
                
                {loading ? (
                    <ProductGridSkeleton count={8} />
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                        {trendingProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>

            {/* New Arrivals */}
            <div className="container-custom py-12 border-t border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-harykims-800 flex items-center">
                            <Clock className="w-6 h-6 text-harykims-500 mr-2" />
                            New Arrivals
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">Latest products added to our marketplace</p>
                    </div>
                    <Link to="/products?sortBy=created_at" className="text-harykims-600 hover:text-harykims-700 flex items-center text-sm font-medium">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
                
                {loading ? (
                    <ProductGridSkeleton count={8} />
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                        {newProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>

            {/* Call to Action - Green Theme */}
            <div className="bg-gradient-to-r from-harykims-700 to-harykims-500 text-white py-16 mt-8">
                <div className="container-custom text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
                    <p className="text-lg text-harykims-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of businesses already sourcing and selling on Harykims Intertech.
                        Start your journey today.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/register" className="bg-white text-harykims-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
                            Get Started Free
                        </Link>
                        <Link to="/products" className="bg-transparent hover:bg-white/10 text-white px-8 py-3 rounded-lg font-semibold border border-white/30 transition-colors">
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer - Green Theme with Social Media Icons */}
            <footer className="bg-harykims-900 text-gray-300 py-12">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <img 
                                    src={logoImage} 
                                    alt="Harykims Intertech" 
                                    className="h-12 w-auto object-contain"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <span className="text-white font-bold text-lg">
                                    <span className="text-harykims-400">Harykims</span>
                                    <span className="text-gray-300">Intertech</span>
                                </span>
                            </div>
                            <p className="text-sm">Kenya’s premier B2B technology marketplace, delivering quality accessories, 
                                innovative tech products, and dependable solutions designed to power modern businesses.</p>
                            
                            {/* Social Media Icons in Footer */}
                            <div className="mt-4 flex space-x-3">
                                <a 
                                    href="https://www.tiktok.com/@harykimsintertech/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
                                    aria-label="TikTok"
                                >
                                    <TikTokIcon className="w-5 h-5" />
                                </a>
                                <a 
                                    href="https://www.instagram.com/harykimsintertech/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a 
                                    href="https://www.facebook.com/harykimsintertech/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
                                    aria-label="Facebook"
                                >
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a 
                                    href="https://x.com/harykimsint" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
                                    aria-label="Twitter (X)"
                                >
                                    <Twitter className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/products" className="hover:text-white">Products</Link></li>
                                <li><Link to="/become-seller" className="hover:text-white">Become a Seller</Link></li>
                                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Customer Service</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                                <li><Link to="/returns" className="hover:text-white">Returns Policy</Link></li>
                                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Contact Info</h4>
                            <ul className="space-y-2 text-sm">
                                <li>📞 +254714818100 / +254118477340</li>
                                <li>📧 harykimsintertech@gmail.com</li>
                                <li>📍 Nairobi, Kenya</li>
                                <li className="flex items-center space-x-2 mt-2">
                                    <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                                        <MessageCircle className="w-3 h-3" />
                                        WhatsApp: 0118 477 340
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-harykims-800 mt-8 pt-8 text-sm text-center text-gray-400">
                        <p>© 2024 Harykims Intertech. All rights reserved. Made with ❤️ in Kenya.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
