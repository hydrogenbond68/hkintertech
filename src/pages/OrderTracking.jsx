import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Clock, Truck, CheckCircle, Package, Navigation, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import apiService from '../services/api';
import MapView from '../components/common/MapView';

const statusLabels = {
  pending: 'Order received',
  processing: 'Preparing order',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { on } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getOrder(id);
      setOrder(data.order);
    } catch (err) {
      setError(err.message || 'Unable to load this order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    const updateOrder = (nextOrder) => {
      if (!nextOrder || nextOrder.id !== id && nextOrder._id !== id) return;
      setOrder((current) => current ? { ...current, ...nextOrder } : nextOrder);
    };
    const offUpdated = on('order:updated', updateOrder);
    const offLocation = on('order:location', updateOrder);
    return () => {
      if (offUpdated) offUpdated();
      if (offLocation) offLocation();
    };
  }, [id, on]);

  if (loading) {
    return <div className="container-custom py-16 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-harykims-600 mx-auto" /></div>;
  }

  if (error || !order) {
    return (
      <div className="container-custom py-16 text-center">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order unavailable</h1>
        <p className="text-gray-600 mb-6">{error || 'This order could not be found.'}</p>
        <Link to="/orders" className="btn-primary">Back to My Orders</Link>
      </div>
    );
  }

  const latitude = order.latitude;
  const longitude = order.longitude;
  const eta = order.estimated_delivery_at
    ? new Date(order.estimated_delivery_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Our dispatch team will confirm the delivery window shortly.';

  return (
    <div className="container-custom py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/orders" className="text-harykims-600 hover:text-harykims-700 text-sm font-medium">← Back to My Orders</Link>
          <h1 className="text-3xl font-bold mt-3">Track Order #{order.order_number || order.id}</h1>
          <p className="text-gray-600 mt-1">Live order status and delivery coordination</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-harykims-50 text-harykims-700'}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Delivery map</h2>
              <p className="text-sm text-gray-500">Current known location for this order</p>
            </div>
            {latitude != null && longitude != null ? <Navigation className="w-6 h-6 text-harykims-600" /> : <MapPin className="w-6 h-6 text-gray-400" />}
          </div>
          <MapView orders={[order]} center={latitude != null && longitude != null ? [latitude, longitude] : [-1.286389, 36.817223]} zoom={latitude != null ? 14 : 12} height="440px" />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold mb-4">Order details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Total</dt><dd className="font-semibold">KES {Number(order.total_amount || 0).toLocaleString('en-KE')}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Payment</dt><dd className="font-medium capitalize">{order.payment_status || 'pending'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Destination</dt><dd className="font-medium text-right">{order.shipping_city || order.shipping_address || 'Kenya'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">ETA</dt><dd className="font-medium text-right">{eta}</dd></div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-harykims-600" /> Progress</h2>
            <ol className="space-y-4">
              {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                const complete = order.status === 'delivered' || ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
                return (
                  <li key={status} className="flex gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${complete ? 'bg-harykims-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{complete ? <CheckCircle className="w-4 h-4" /> : index + 1}</span>
                    <div><p className="font-medium text-sm">{statusLabels[status]}</p><p className="text-xs text-gray-500">{status === 'pending' ? 'Checkout and payment confirmation' : status === 'processing' ? 'Warehouse preparation' : status === 'shipped' ? 'Delivery agent coordination' : 'Order completed'}</p></div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="bg-harykims-50 border border-harykims-100 rounded-xl p-5">
            <Truck className="w-6 h-6 text-harykims-600 mb-2" />
            <h2 className="font-semibold">Need pickup help?</h2>
            <p className="text-sm text-gray-600 mt-1">Our dispatch team is available around the clock. Call +254 118 477 340 with order #{order.order_number || order.id}.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
