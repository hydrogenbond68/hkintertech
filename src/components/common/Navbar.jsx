import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import logoImage from '../../assets/logo.jpeg';
import { 
    Search, ShoppingCart, User, LogOut, LogIn, 
    UserPlus, Menu, X, ChevronDown, Package, 
    LayoutDashboard, Store, Heart, Leaf, UserCircle,
    Info, Mail, HelpCircle
} from 'lucide-react';

const Navbar = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { totalItems } = useCart();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            setIsMenuOpen(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-harykims-100">
            <div className="container-custom">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
                        <img 
                            src={logoImage} 
                            alt="Harykims Intertech" 
                            className="h-10 w-auto object-contain block"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.alt = '';
                                e.target.className = 'hidden';
                            }}
                        />
                        <span className="text-xl font-bold tracking-tight">
                            <span className="text-harykims-700">Harykims</span>
                            <span className="text-harykims-500">Intertech</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-2xl mx-8">
                        <form onSubmit={handleSearch} className="w-full flex">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-l-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-harykims-400 border border-gray-200"
                            />
                            <button
                                type="submit"
                                className="px-6 bg-harykims-600 hover:bg-harykims-700 rounded-r-lg transition-colors text-white"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to="/about" className="text-gray-600 hover:text-harykims-600 transition-colors text-sm">
                                
                            </Link>
                            <Link to="/contact" className="text-gray-600 hover:text-harykims-600 transition-colors text-sm">
                                
                            </Link>
                        </div>

                        {isAuthenticated && (
                            <Link to="/wishlist" className="hidden md:flex items-center text-gray-600 hover:text-harykims-600 transition-colors">
                                <Heart className="w-6 h-6" />
                            </Link>
                        )}

                        <Link to="/cart" className="relative text-gray-600 hover:text-harykims-600 transition-colors cursor-pointer">
                            <ShoppingCart className="w-6 h-6" />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-harykims-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                            <span className="text-xs hidden md:inline ml-1 text-gray-600">Cart</span>
                        </Link>

                        {isAuthenticated ? (
                            <div className="relative group">
                                <button className="flex items-center space-x-1 text-gray-600 hover:text-harykims-600 transition-colors">
                                    <User className="w-6 h-6" />
                                    <span className="hidden md:inline text-sm">{user?.first_name}</span>
                                    <ChevronDown className="w-4 h-4 hidden md:inline" />
                                </button>
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 hidden group-hover:block border border-gray-100">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                    </div>
                                    <Link to="/profile" className="flex items-center px-4 py-2 hover:bg-harykims-50 text-gray-700">
                                        <UserCircle className="w-4 h-4 mr-2 text-harykims-600" />
                                        My Profile
                                    </Link>
                                    {isAdmin && (
                                        <Link to="/admin" className="flex items-center px-4 py-2 hover:bg-harykims-50 text-gray-700">
                                            <LayoutDashboard className="w-4 h-4 mr-2 text-harykims-600" />
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <Link to="/become-seller" className="flex items-center px-4 py-2 hover:bg-harykims-50 text-gray-700">
                                        <Store className="w-4 h-4 mr-2 text-harykims-600" />
                                        Become a Seller
                                    </Link>
                                    <Link to="/orders" className="flex items-center px-4 py-2 hover:bg-harykims-50 text-gray-700">
                                        <Package className="w-4 h-4 mr-2 text-harykims-600" />
                                        My Orders
                                    </Link>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <Link to="/about" className="flex items-center px-4 py-2 hover:bg-harykims-50 text-gray-700">
                                        <Info className="w-4 h-4 mr-2 text-harykims-600" />
                                        About Us
                                    </Link>
                                    <Link to="/contact" className="flex items-center px-4 py-2 hover:bg-harykims-50 text-gray-700">
                                        <Mail className="w-4 h-4 mr-2 text-harykims-600" />
                                        
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-red-600"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link to="/login" className="hidden md:flex items-center px-4 py-2 text-gray-600 hover:text-harykims-600 rounded-lg transition-colors">
                                    <LogIn className="w-4 h-4 mr-1" />
                                    Login
                                </Link>
                                <Link to="/register" className="bg-harykims-600 hover:bg-harykims-700 text-white px-4 py-2 rounded-lg transition-colors">
                                    <UserPlus className="w-4 h-4 inline mr-1" />
                                    <span className="hidden md:inline">Sign Up</span>
                                </Link>
                            </div>
                        )}

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-harykims-600 rounded-lg"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                <div className="md:hidden pb-3">
                    <form onSubmit={handleSearch} className="flex">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-l-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none border border-gray-200"
                        />
                        <button
                            type="submit"
                            className="px-4 bg-harykims-600 hover:bg-harykims-700 rounded-r-lg transition-colors text-white"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100">
                    <div className="container-custom py-3 space-y-2">
                        <Link to="/about" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                            <Info className="w-5 h-5 mr-3 text-harykims-600" />
                            
                        </Link>
                        <Link to="/contact" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                            <Mail className="w-5 h-5 mr-3 text-harykims-600" />
                            
                        </Link>
                        
                        <div className="border-t border-gray-100 my-2"></div>
                        
                        {isAuthenticated ? (
                            <>
                                <div className="px-4 py-2">
                                    <p className="font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                                <Link to="/profile" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                    <UserCircle className="w-5 h-5 mr-3 text-harykims-600" />
                                    My Profile
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                        <LayoutDashboard className="w-5 h-5 mr-3 text-harykims-600" />
                                        Admin Dashboard
                                    </Link>
                                )}
                                <Link to="/become-seller" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                    <Store className="w-5 h-5 mr-3 text-harykims-600" />
                                    Become a Seller
                                </Link>
                                <Link to="/orders" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                    <Package className="w-5 h-5 mr-3 text-harykims-600" />
                                    My Orders
                                </Link>
                                <Link to="/wishlist" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                    <Heart className="w-5 h-5 mr-3 text-harykims-600" />
                                    Wishlist
                                </Link>
                                <Link to="/cart" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                    <ShoppingCart className="w-5 h-5 mr-3 text-harykims-600" />
                                    Cart ({totalItems})
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-2 hover:bg-red-50 rounded-lg text-red-600"
                                >
                                    <LogOut className="w-5 h-5 mr-3" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                    <LogIn className="w-5 h-5 mr-3 text-harykims-600" />
                                    Login
                                </Link>
                                <Link to="/register" className="flex items-center px-4 py-2 hover:bg-harykims-50 rounded-lg text-gray-700">
                                    <UserPlus className="w-5 h-5 mr-3 text-harykims-600" />
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
