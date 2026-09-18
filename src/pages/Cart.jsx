import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { X, Plus, Minus, ShoppingBag, ArrowLeft, Phone, CreditCard, CheckCircle, MapPin, AlertCircle } from 'lucide-react';

const Cart = () => {
    const { cartItems, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [showCheckout, setShowCheckout] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [order, setOrder] = useState(null);
    const [shippingAddress, setShippingAddress] = useState(user?.address || '');
    const [shippingCity, setShippingCity] = useState('Nairobi');
    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mpesa');

    const formatPrice = (price) => new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price || 0);

    const getImage = (item) => {
        if (Array.isArray(item.image_urls)) return item.image_urls[0] || '/api/placeholder/400/300';
        return item.image_url || item.image || '/api/placeholder/400/300';
    };

    const handleProceedToCheckout = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setError('');
        setShowCheckout(true);
    };

    const createIdempotencyKey = () => {
        const cartKey = JSON.stringify(cartItems.map((item) => [item.id, item.quantity]));
        return `cart-${user?.id || 'guest'}-${cartKey.length}-${[...cartKey].reduce((sum, char) => sum + char.charCodeAt(0), 0)}`;
    };

    const handleCheckout = async (event) => {
        event.preventDefault();
        if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 10) {
            setError('Enter a valid M-Pesa phone number.');
            return;
        }
        if (!shippingAddress.trim()) {
            setError('Enter a delivery address.');
            return;
        }

        setIsProcessing(true);
        setError('');
        try {
            const payload = {
                items: cartItems.map((item) => ({
                    product: item.id || item.product_id,
                    quantity: Number(item.quantity || 1),
                })),
                shipping_address: shippingAddress,
                shipping_city: shippingCity,
                shipping_country: 'Kenya',
                payment_method: paymentMethod,
                payment_phone: phoneNumber,
                notes,
                shipping_fee: 0,
                tax_amount: 0,
            };
            const response = await apiService.createOrder(payload, createIdempotencyKey());
            const createdOrder = response.order;
            setOrder(createdOrder);

            if (paymentMethod === 'mpesa') {
                try {
                    await apiService.initiateMpesa(createdOrder.id || createdOrder._id, phoneNumber, createdOrder.total_amount);
                } catch (mpesaError) {
                    setError(`Order created. M-Pesa prompt could not be started: ${mpesaError.message}`);
                }
            }

            clearCart();
            navigate(`/order/track/${createdOrder.id || createdOrder._id}`, { state: { paymentPending: paymentMethod === 'mpesa' } });
        } catch (err) {
            setError(err.message || 'Unable to create your order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartItems.length === 0 && !showCheckout) {
        return (
            <div className="container-custom py-12 text-center">
                <ShoppingBag className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Your Cart is Empty</h2>
                <p className="text-gray-600 mb-8 text-lg">Start shopping to add items to your cart</p>
                <Link to="/products" className="btn-primary inline-flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Start Shopping
                </Link>
            </div>
        );
    }

    if (showCheckout) {
        return (
            <div className="container-custom py-8 max-w-5xl mx-auto">
                <button onClick={() => setShowCheckout(false)} className="text-gray-500 hover:text-gray-700 mb-6 flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <form onSubmit={handleCheckout} className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-2xl font-bold mb-6">Delivery and payment</h2>
                        {error && <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{error}</div>}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery address</label>
                                <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="input-field" placeholder="Street, building, floor" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Town / city</label>
                                    <input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} className="input-field" placeholder="Nairobi" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 w-5 h-5 text-gray-400" />
                                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="input-field pl-10" placeholder="0712 345 678" required />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Order notes <span className="text-gray-400 font-normal">(optional)</span></label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows="3" placeholder="Gate code, pickup instructions, or business requirements" />
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-gray-700 mb-2">Payment method</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setPaymentMethod('mpesa')} className={`p-4 border-2 rounded-lg text-left ${paymentMethod === 'mpesa' ? 'border-harykims-600 bg-harykims-50' : 'border-gray-200'}`}>
                                        <Phone className="w-5 h-5 text-harykims-600 mb-2" /><strong>M-Pesa</strong><p className="text-sm text-gray-500">STK push to your phone</p>
                                    </button>
                                    <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-4 border-2 rounded-lg text-left ${paymentMethod === 'cash' ? 'border-harykims-600 bg-harykims-50' : 'border-gray-200'}`}>
                                        <CreditCard className="w-5 h-5 text-harykims-600 mb-2" /><strong>Cash / pickup</strong><p className="text-sm text-gray-500">Pay when the order is collected</p>
                                    </button>
                                </div>
                            </div>
                            <button disabled={isProcessing} className="w-full btn-primary py-3 text-lg flex items-center justify-center">
                                {isProcessing ? <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" /> Creating order...</> : <><MapPin className="w-5 h-5 mr-2" /> Place order · {formatPrice(totalPrice)}</>}
                            </button>
                            <p className="text-xs text-gray-500 text-center">Orders are reserved atomically. You will receive an M-Pesa prompt after the order is created.</p>
                        </div>
                    </form>
                    <aside className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                        <h3 className="font-semibold text-lg mb-4">Order summary</h3>
                        <div className="space-y-3 text-sm">
                            {cartItems.map((item) => <div key={item.id} className="flex justify-between gap-3"><span className="text-gray-600">{item.name} × {item.quantity}</span><span className="font-medium">{formatPrice((item.price || 0) * (item.quantity || 1))}</span></div>)}
                            <div className="border-t pt-3 flex justify-between"><span className="text-gray-600">Delivery</span><span className="font-medium">Calculated by dispatch</span></div>
                            <div className="border-t pt-3 flex justify-between text-lg font-bold"><span>Total</span><span className="text-harykims-700">{formatPrice(totalPrice)}</span></div>
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                <span className="text-gray-600">{totalItems} item{totalItems === 1 ? '' : 's'}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
                    {cartItems.map((item) => <div key={item.id} className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50">
                        <img src={getImage(item)} alt={item.name} className="w-24 h-24 object-cover rounded-lg" onError={(e) => { e.target.src = '/api/placeholder/100/100'; }} />
                        <div className="flex-1 ml-4"><Link to={`/product/${item.id}`} className="font-semibold hover:text-harykims-600">{item.name}</Link><p className="text-harykims-600 font-bold text-lg">{formatPrice(item.price)}</p><p className="text-sm text-gray-500">MOQ: {item.min_order_quantity || 1}</p></div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center border rounded-lg"><button onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} className="px-3 py-2 hover:bg-gray-50"><Minus className="w-4 h-4" /></button><span className="px-4 py-2 min-w-[3rem] text-center font-semibold">{item.quantity}</span><button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} className="px-3 py-2 hover:bg-gray-50"><Plus className="w-4 h-4" /></button></div>
                            <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:text-red-700"><X className="w-5 h-5" /></button>
                        </div>
                    </div>)}
                    <div className="flex justify-between items-center mt-4"><button onClick={() => clearCart()} className="text-red-600 hover:text-red-800 text-sm font-medium">Clear Cart</button><Link to="/products" className="text-harykims-600 hover:text-harykims-700 text-sm font-medium flex items-center"><ArrowLeft className="w-4 h-4 mr-1" /> Continue Shopping</Link></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 h-fit">
                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                    <div className="space-y-3 border-b pb-4"><div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{formatPrice(totalPrice)}</span></div><div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className="text-green-600 font-medium">Dispatch quote</span></div></div>
                    <div className="flex justify-between pt-4 mb-6"><span className="text-lg font-bold">Total</span><span className="text-2xl font-bold text-harykims-600">{formatPrice(totalPrice)}</span></div>
                    <button onClick={handleProceedToCheckout} className="w-full btn-primary py-3 text-lg">Proceed to Checkout</button>
                    <p className="text-xs text-gray-500 text-center mt-3">Secure checkout with M-Pesa and real-time order tracking.</p>
                </div>
            </div>
        </div>
    );
};

export default Cart;
