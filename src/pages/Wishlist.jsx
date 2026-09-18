import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getWishlist();
      setItems((data.wishlist || []).map((item) => item.product || item));
    } catch (err) {
      setError(err.message || 'Unable to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const remove = async (productId) => {
    await apiService.removeFromWishlist(productId);
    setItems((current) => current.filter((item) => String(item._id || item.id) !== String(productId)));
  };

  if (loading) return <div className="container-custom py-16 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-harykims-600 mx-auto" /></div>;

  return (
    <div className="container-custom py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-gray-600 mt-1">Save products and come back when you are ready to source.</p>
        </div>
        <Heart className="w-10 h-10 text-harykims-500" />
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {!items.length ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
          <p className="text-gray-600 mt-2 mb-6">Browse the marketplace and save products for later.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((product) => {
            const image = Array.isArray(product.image_urls) ? product.image_urls[0] : '';
            return (
              <div key={product._id || product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Link to={`/product/${product._id || product.id}`} className="block bg-gray-50">
                  <img src={image || '/api/placeholder/400/300'} alt={product.name} className="w-full h-48 object-cover" onError={(e) => { e.target.src = '/api/placeholder/400/300'; }} />
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product._id || product.id}`} className="font-semibold hover:text-harykims-600">{product.name}</Link>
                  <p className="text-harykims-700 font-bold mt-2">KES {Number(product.price || 0).toLocaleString('en-KE')}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => addToCart(product, product.min_order_quantity || 1)} className="btn-primary flex-1 text-sm"><ShoppingCart className="w-4 h-4 mr-1 inline" /> Add</button>
                    <button onClick={() => remove(product._id || product.id)} className="px-3 border rounded-lg text-red-600 hover:bg-red-50" aria-label="Remove from wishlist"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
