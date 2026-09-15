import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Eye, Check, Leaf } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (product && product.id) {
            addToCart(product, 1);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
        }
    };

    const getImages = () => {
        if (!product.image_urls) return [];
        if (Array.isArray(product.image_urls)) {
            return product.image_urls.filter(url => typeof url === 'string' && url.length > 0);
        }
        if (typeof product.image_urls === 'string') {
            try {
                const images = JSON.parse(product.image_urls);
                return Array.isArray(images) ? images.filter(url => typeof url === 'string' && url.length > 0) : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const images = getImages();
    const firstImage = images.length > 0 ? images[0] : '/api/placeholder/400/400';
    const secondImage = images.length > 1 ? images[1] : firstImage;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const originalPrice = product.price * (1 + (Math.random() * 0.3 + 0.1));
    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

    return (
        <div 
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100 p-3 sm:p-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link to={`/product/${product.id}`} className="block">
                <div className="relative overflow-hidden">
                    <img
                        src={isHovered && secondImage !== firstImage ? secondImage : firstImage}
                        alt={product.name}
                        className="w-full h-40 sm:h-48 md:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            e.target.src = '/api/placeholder/400/400';
                        }}
                    />
                    
                    {discount > 10 && (
                        <span className="absolute top-2 left-2 bg-harykims-600 text-white text-xs px-2 py-1 rounded-full">
                            -{discount}%
                        </span>
                    )}
                    
                    {images.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded hidden md:block">
                            {images.length} photos
                        </span>
                    )}
                    
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                            <Heart className="w-4 h-4 text-gray-600 hover:text-harykims-600" />
                        </button>
                        <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                    
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-harykims-600/90 text-white text-xs px-2 py-1 rounded hidden md:flex">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                    </div>
                </div>
                
                <div className="p-0">
                    <h3 className="font-semibold text-gray-800 truncate text-xs sm:text-sm md:text-base">
                        {product.name}
                    </h3>
                    
                    <div className="flex items-center mt-1 hidden md:block">
                        <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm ml-1 font-medium">{product.average_rating || 0}</span>
                        </div>
                        <span className="text-sm text-gray-500 ml-2">
                            ({product.total_reviews || 0})
                        </span>
                    </div>
                    
                    <div className="mt-2">
                        <span className="text-sm sm:text-base md:text-xl font-bold text-harykims-600">
                            {formatPrice(product.price)}
                        </span>
                        {discount > 10 && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through ml-2 hidden sm:inline">
                                {formatPrice(originalPrice)}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500 hidden md:flex">
                        <span>MOQ: {product.min_order_quantity || 1}</span>
                        <span className={product.stock_quantity > 0 ? 'text-harykims-600' : 'text-red-600'}>
                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                        </span>
                    </div>
                    
                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock_quantity === 0}
                        className={`w-full mt-3 py-2 rounded-lg transition-colors flex items-center justify-center text-sm font-medium ${
                            added 
                                ? 'bg-harykims-600 text-white' 
                                : product.stock_quantity === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-harykims-600 text-white hover:bg-harykims-700'
                        }`}
                    >
                        {added ? (
                            <>
                                <Check className="w-4 h-4 mr-0 sm:mr-2" />
                                <span className="hidden sm:inline">Added!</span>
                            </>
                        ) : product.stock_quantity === 0 ? (
                            'Out of Stock'
                        ) : (
                            <>
                                <ShoppingCart className="w-4 h-4 mr-0 sm:mr-2" />
                                <span className="hidden sm:inline">Add to Cart</span>
                            </>
                        )}
                    </button>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;
