import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building, Phone, Mail, MapPin, Store, User, CheckCircle } from 'lucide-react';

const BecomeSeller = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        business_name: '',
        business_type: '',
        business_phone: '',
        business_email: user?.email || '',
        business_address: '',
        business_description: '',
        product_categories: '',
        website: '',
        registration_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Redirect if not logged in
    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Here you would send the seller application to your backend
            console.log('Seller application submitted:', formData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            setError('Failed to submit application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    if (success) {
        return (
            <div className="container-custom py-12 text-center">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted! 🎉</h2>
                    <p className="text-gray-600 mb-4">Thank you for applying to become a seller on HKIntertech.</p>
                    <p className="text-sm text-gray-500">We will review your application and get back to you within 24-48 hours.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 btn-primary"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Store className="w-8 h-8 text-harykims-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Become a Seller</h1>
                </div>

                <p className="text-gray-600 mb-6">
                    Fill in your business details to start selling on HKIntertech.
                    All fields marked with * are required.
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Business Name *
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="business_name"
                                    value={formData.business_name}
                                    onChange={handleChange}
                                    className="input-field pl-10"
                                    required
                                    placeholder="e.g., Tech Solutions Ltd"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Business Type *
                            </label>
                            <select
                                name="business_type"
                                value={formData.business_type}
                                onChange={handleChange}
                                className="input-field"
                                required
                            >
                                <option value="">Select business type</option>
                                <option value="sole_proprietorship">Sole Proprietorship</option>
                                <option value="partnership">Partnership</option>
                                <option value="limited_company">Limited Company</option>
                                <option value="cooperative">Cooperative</option>
                                <option value="ngo">NGO/Social Enterprise</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Business Phone *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    name="business_phone"
                                    value={formData.business_phone}
                                    onChange={handleChange}
                                    className="input-field pl-10"
                                    required
                                    placeholder="e.g., 0712345678"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Business Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    name="business_email"
                                    value={formData.business_email}
                                    onChange={handleChange}
                                    className="input-field pl-10"
                                    required
                                    placeholder="business@email.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Address *
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <textarea
                                name="business_address"
                                value={formData.business_address}
                                onChange={handleChange}
                                className="input-field pl-10 min-h-[60px]"
                                rows="2"
                                required
                                placeholder="Physical address of your business"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Description *
                        </label>
                        <textarea
                            name="business_description"
                            value={formData.business_description}
                            onChange={handleChange}
                            className="input-field min-h-[100px]"
                            rows="4"
                            required
                            placeholder="Describe your business, products, and what makes you unique..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Categories *
                            </label>
                            <input
                                type="text"
                                name="product_categories"
                                value={formData.product_categories}
                                onChange={handleChange}
                                className="input-field"
                                required
                                placeholder="e.g., Electronics, Fashion, Home & Living"
                            />
                            <p className="text-xs text-gray-500 mt-1">List categories separated by commas</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Registration/Business Number
                            </label>
                            <input
                                type="text"
                                name="registration_number"
                                value={formData.registration_number}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., CR12, PIN, or Registration Number"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website (Optional)
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> By submitting this application, you agree to our seller terms and conditions.
                            Your application will be reviewed by our team within 24-48 hours.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Store className="w-5 h-5 mr-2" />
                                    Submit Application
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-harykims-50 rounded-lg">
                    <h3 className="font-semibold text-harykims-700 mb-2">Benefits of Selling on HKIntertech:</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Reach thousands of customers across Kenya</li>
                        <li>No monthly subscription fees</li>
                        <li>Secure payment processing with M-Pesa</li>
                        <li>Dedicated seller support</li>
                        <li>Marketing and promotion opportunities</li>
                        <li>Real-time analytics and reporting</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BecomeSeller;
