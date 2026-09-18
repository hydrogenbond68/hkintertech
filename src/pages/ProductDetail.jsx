import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCache } from '../contexts/CacheContext';
import apiService from '../services/api';
import { 
    Star, ShoppingCart, MessageCircle, ChevronLeft, 
    Heart, Truck, Shield, Award, Plus, Minus, X, Trash2,
    Check, Info
} from 'lucide-react';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { productVersion } = useCache();
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('details');
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [inquiry, setInquiry] = useState({ subject: '', message: '' });
    const [showInquiryForm, setShowInquiryForm] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        fetchProductData();
        if (isAuthenticated) {
            checkWishlist();
        }
    }, [id, productVersion]);

    const fetchProductData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [productData, reviewsData] = await Promise.all([
                apiService.getProduct(id),
                apiService.getProductReviews(id)
            ]);
            setProduct(productData.product);
            setReviews(reviewsData.reviews || []);
        } catch (error) {
            console.error('Error fetching product:', error);
            setError(error.message || 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const checkWishlist = async () => {
        try {
            const data = await apiService.getWishlist();
            setInWishlist(data.wishlist.some(item => item.product_id === parseInt(id)));
        } catch (error) {
            console.error('Error checking wishlist:', error);
        }
    };

    const getImages = () => {
        if (product && product.image_urls) {
            try {
                const images = typeof product.image_urls === 'string' 
                    ? JSON.parse(product.image_urls) 
                    : product.image_urls;
                return Array.isArray(images) ? images : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity);
        }
    };

    const handleToggleWishlist = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            if (inWishlist) {
                await apiService.removeFromWishlist(id);
                setInWishlist(false);
            } else {
                await apiService.addToWishlist(id);
                setInWishlist(true);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            const data = await apiService.createReview({
                product_id: parseInt(id),
                rating: newReview.rating,
                comment: newReview.comment
            });
            setReviews([data.review, ...reviews]);
            setNewReview({ rating: 5, comment: '' });
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await apiService.deleteReview(reviewId);
            setReviews(reviews.filter(r => (r._id || r.id) !== reviewId));
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const handleSubmitInquiry = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await apiService.createInquiry({
                product_id: parseInt(id),
                subject: inquiry.subject,
                message: inquiry.message
            });
            setInquiry({ subject: '', message: '' });
            setShowInquiryForm(false);
        } catch (error) {
            console.error('Error submitting inquiry:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-harykims-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-custom py-12 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => fetchProductData()} className="btn-primary">
                        Try Again
                    </button>
                    <button 
                        onClick={() => navigate('/products')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container-custom py-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
                <button onClick={() => navigate('/products')} className="mt-4 text-harykims-600 hover:text-harykims-700">
                    Back to Products
                </button>
            </div>
        );
    }

    const images = getImages();
    const mainImage = images.length > 0 ? images[selectedImage] : '/api/placeholder/600/400';

    return (
        <div className="container-custom py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images Gallery */}
                <div className="space-y-4">
                    <div className="bg-gray-100 rounded-xl overflow-hidden">
                        <img
                            src={mainImage}
                            alt={product.name}
                            className="w-full h-96 object-cover"
                            onError={(e) => {
                                e.target.src = '/api/placeholder/600/400';
                            }}
                        />
                    </div>
                    
                    {/* Thumbnail Gallery */}
                    {images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {images.map((url, index) => (
                                <div
                                    key={index}
                                    className={`cursor-pointer rounded-lg overflow-hidden border-2 ${
                                        selectedImage === index 
                                            ? 'border-harykims-600' 
                                            : 'border-transparent hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <img
                                        src={url}
                                        alt={`${product.name} view ${index + 1}`}
                                        className="w-full h-20 object-cover"
                                        onError={(e) => {
                                            e.target.src = '/api/placeholder/100/100';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <div className="flex justify-between items-start">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        <button
                            onClick={handleToggleWishlist}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Heart className={`w-6 h-6 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </button>
                    </div>

                    <div className="flex items-center mb-4">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                        i < Math.round(product.average_rating || 0)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="ml-2 text-gray-600">
                            ({reviews.length} reviews)
                        </span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-600">{product.category}</span>
                    </div>

                    <div className="text-3xl font-bold text-harykims-600 mb-4">
                        {formatPrice(product.price)}
                    </div>

                    <p className="text-gray-700 mb-6">{product.description}</p>

                    {/* Stock & MOQ */}
                    <div className="flex items-center gap-6 mb-6">
                        <div>
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className={`ml-2 font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {product.stock_quantity > 0 ? `${product.stock_quantity} units` : 'Out of Stock'}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">MOQ:</span>
                            <span className="ml-2 font-medium">{product.min_order_quantity || 1}</span>
                        </div>
                    </div>

                    {/* Add to Cart */}
                    {product.stock_quantity > 0 && (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center border rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-3 py-2 hover:bg-gray-50"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                    className="px-3 py-2 hover:bg-gray-50"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 btn-primary flex items-center justify-center"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Add to Cart
                            </button>
                            <button
                                onClick={() => setShowInquiryForm(!showInquiryForm)}
                                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Inquiry Form */}
                    {showInquiryForm && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h3 className="font-semibold mb-3">Ask a Question</h3>
                            <form onSubmit={handleSubmitInquiry}>
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        placeholder="Subject"
                                        value={inquiry.subject}
                                        onChange={(e) => setInquiry({ ...inquiry, subject: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harykims-500"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <textarea
                                        placeholder="Your message..."
                                        value={inquiry.message}
                                        onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harykims-500"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn-primary">
                                    Send Inquiry
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Trust Badges */}
                    <div className="flex items-center gap-6 text-sm text-gray-600 border-t pt-4">
                        <div className="flex items-center">
                            <Truck className="w-4 h-4 mr-1" />
                            Fast Shipping
                        </div>
                        <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            Secure Payment
                        </div>
                        <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            Quality Guarantee
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-12 border-t border-gray-200 pt-8">
                <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
                    {[
                        { key: 'details', label: 'Details' },
                        { key: 'specs', label: 'Specifications' },
                        { key: 'reviews', label: `Reviews (${reviews.length})` },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? 'border-harykims-600 text-harykims-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed">{product.description}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Truck className="w-4 h-4 text-harykims-600" />
                                <span className="text-gray-600">Fast Shipping</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Shield className="w-4 h-4 text-harykims-600" />
                                <span className="text-gray-600">Secure Payment</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Award className="w-4 h-4 text-harykims-600" />
                                <span className="text-gray-600">Quality Guarantee</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Specifications Tab */}
                {activeTab === 'specs' && product.specifications && Object.keys(product.specifications).length > 0 ? (
                    <div className="space-y-3">
                        {Object.entries(product.specifications).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-4 py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-700 capitalize min-w-[120px]">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-gray-600">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No specifications available</p>
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        {isAuthenticated && (
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                    className={`w-8 h-8 ${
                                                        star <= newReview.rating
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                >
                                                    <Star className="w-6 h-6" />
                                                </button>
                                            ))}
                                            <span className="text-sm text-gray-500 ml-2">{newReview.rating}/5</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                                        <textarea
                                            value={newReview.comment}
                                            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                            className="input-field"
                                            rows="3"
                                            placeholder="Share your experience with this product"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary">
                                        Submit Review
                                    </button>
                                </form>
                            </div>
                        )}

                        {!isAuthenticated && (
                            <div className="bg-gray-50 rounded-xl p-6 text-center">
                                <p className="text-gray-600 mb-2">You must be logged in to write a review</p>
                                <Link to="/login" className="btn-primary inline-flex items-center">
                                    Sign In
                                </Link>
                            </div>
                        )}

                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review this product.</p>
                            ) : (
                                reviews.map((review) => (
                                    <div key={review._id || review.id} className="bg-white rounded-lg border border-gray-200 p-5">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-harykims-100 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-harykims-700">
                                                        {(review.user_name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{review.user_name || 'Anonymous'}</p>
                                                    {review.is_verified_purchase && (
                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Verified Purchase
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${
                                                                i < (review.rating || 0)
                                                                    ? 'text-yellow-400 fill-current'
                                                                    : 'text-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                {(review.user_name === user?.first_name + ' ' + user?.last_name || review.user_name === user?.email) && (
                                                    <button
                                                        onClick={() => handleDeleteReview(review._id || review.id)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                        aria-label="Delete review"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-gray-700">{review.comment}</p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString('en-KE', {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
             </div>
         </div>
    );
};

export default ProductDetail;
