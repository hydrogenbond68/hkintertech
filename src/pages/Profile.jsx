import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
    User, Mail, Phone, MapPin, Building, 
    Save, Camera, Edit2, 
    CheckCircle, AlertCircle, Store, Package, Heart, X
} from 'lucide-react';

const Profile = () => {
    const { user, updateProfile, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        company_name: '',
        profile_image: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            console.log('User data loaded:', user);
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                company_name: user.company_name || '',
                profile_image: user.profile_image || ''
            });
            setImagePreview(user.profile_image || null);
        }
    }, [user, refreshKey]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
                setFormData(prev => ({
                    ...prev,
                    profile_image: event.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            console.log('Submitting profile data:', formData);
            
            // Prepare data for submission - only include fields that have changed
            const submitData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone || '',
                address: formData.address || '',
                company_name: formData.company_name || '',
                profile_image: formData.profile_image || ''
            };

            const result = await updateProfile(submitData);
            console.log('Profile update result:', result);
            
            if (result.success) {
                setSuccess(true);
                setEditMode(false);
                // Refresh the page data
                setRefreshKey(prev => prev + 1);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(result.error || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Profile update error:', err);
            setError('An error occurred while updating profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                company_name: user.company_name || '',
                profile_image: user.profile_image || ''
            });
            setImagePreview(user.profile_image || null);
        }
        setEditMode(false);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getInitials = () => {
        if (user) {
            const first = (user.first_name || '')[0] || '';
            const last = (user.last_name || '')[0] || '';
            return `${first}${last}`.toUpperCase() || 'U';
        }
        return 'U';
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-harykims-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="container-custom py-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-harykims-600 to-harykims-700 px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div 
                                    className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden bg-harykims-500 border-4 border-white/30 ${
                                        editMode ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                                    }`}
                                    onClick={() => editMode && fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <img 
                                            src={imagePreview} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        getInitials()
                                    )}
                                </div>
                                {editMode && (
                                    <>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 bg-harykims-500 p-2 rounded-full hover:bg-harykims-600 transition-colors border-2 border-white"
                                        >
                                            <Camera className="w-4 h-4 text-white" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                    </>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    {user?.first_name} {user?.last_name}
                                </h1>
                                <p className="text-harykims-100">{user?.email}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user?.is_admin && (
                                        <span className="inline-block px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded">
                                            Administrator
                                        </span>
                                    )}
                                    {user?.is_verified && (
                                        <span className="inline-block px-2 py-0.5 bg-green-400 text-green-900 text-xs font-semibold rounded">
                                            Verified ✓
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {!editMode ? (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-700">Profile updated successfully!</span>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    )}

                    {!editMode ? (
                        // View Mode
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500">First Name</label>
                                    <p className="text-gray-800 font-medium">{user?.first_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Last Name</label>
                                    <p className="text-gray-800 font-medium">{user?.last_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Email Address</label>
                                    <p className="text-gray-800 font-medium">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Phone Number</label>
                                    <p className="text-gray-800 font-medium">{user?.phone || 'Not set'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500">Company Name</label>
                                    <p className="text-gray-800 font-medium">{user?.company_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Address</label>
                                    <p className="text-gray-800 font-medium">{user?.address || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Account Type</label>
                                    <p className="text-gray-800 font-medium">
                                        {user?.is_admin ? 'Administrator' : 'Customer'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Member Since</label>
                                    <p className="text-gray-800 font-medium">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-KE', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Edit Mode
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        className="input-field pl-10 bg-gray-100"
                                        disabled
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="e.g., 0712345678"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="Your company name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="input-field pl-10 min-h-[80px]"
                                        rows="3"
                                        placeholder="Your physical address"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                    onClick={() => navigate('/orders')}
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-3"
                >
                    <div className="bg-harykims-100 p-2 rounded-lg">
                        <Package className="w-5 h-5 text-harykims-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-medium">My Orders</p>
                        <p className="text-sm text-gray-500">View order history</p>
                    </div>
                </button>
                
                <button 
                    onClick={() => navigate('/wishlist')}
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-3"
                >
                    <div className="bg-red-50 p-2 rounded-lg">
                        <Heart className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-medium">Wishlist</p>
                        <p className="text-sm text-gray-500">Your saved items</p>
                    </div>
                </button>
                
                {!user?.is_admin && (
                    <button 
                        onClick={() => navigate('/become-seller')}
                        className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-3"
                    >
                        <div className="bg-green-50 p-2 rounded-lg">
                            <Store className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium">Become a Seller</p>
                            <p className="text-sm text-gray-500">Start selling today</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Profile;
