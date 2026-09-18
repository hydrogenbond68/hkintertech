import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronRight, ShoppingBag } from 'lucide-react';

const Orders = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    processing: { icon: Package, color: 'bg-blue-100 text-blue-800' },
    shipped: { icon: Truck, color: 'bg-purple-100 text-purple-800' },
    delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800' }
  };

  if (loading) {
    return (
      <div className="container-custom py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-harykims-600"></div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-1">Track and manage your orders</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={fetchOrders} className="mt-2 text-harykims-600 hover:text-harykims-700 text-sm font-medium">
            Try Again
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">You haven't placed any orders. Start shopping to see them here.</p>
          <Link to="/products" className="btn-primary inline-flex items-center">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.order_number || order.id}</p>
                      <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {order.status || 'pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Amount</span>
                      <p className="font-semibold text-harykims-600">{formatPrice(order.total_amount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment</span>
                      <p className="font-medium capitalize">{order.payment_method || 'N/A'} · {order.payment_status || 'pending'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Items</span>
                      <p className="font-medium">{order.items?.length || 0} item(s)</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <Link
                      to={`/order/track/${order.id}`}
                      className="inline-flex items-center text-harykims-600 hover:text-harykims-700 text-sm font-medium"
                    >
                      Track Order <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      to={`/order/${order.id}`}
                      className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
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

export default Orders;