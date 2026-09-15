import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Plus, Minus, ShoppingBag, ArrowLeft, Phone, CreditCard, CheckCircle } from 'lucide-react';

const Cart = () => {
    const { cartItems, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const [showCheckout, setShowCheckout] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mpesa');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');

    const TILL_NUMBER = '3646096';

    useEffect(() => {
        console.log('Cart page rendered with items:', cartItems);
        console.log('Total items:', totalItems);
        console.log('Total price:', totalPrice);
    }, [cartItems, totalItems, totalPrice]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const getImage = (item) => {
        if (item.image_urls && typeof item.image_urls === 'string') {
            try {
                const images = JSON.parse(item.image_urls);
                return images.length > 0 ? images[0] : '/api/placeholder/100/100';
            } catch {
                return '/api/placeholder/100/100';
            }
        }
        return '/api/placeholder/100/100';
    };

    const handleProceedToCheckout = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowCheckout(true);
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        
        if (!phoneNumber || phoneNumber.length < 10) {
            alert('Please enter a valid phone number (e.g., 0712345678)');
            return;
        }

        setShowCheckout(false);
        setShowPaymentModal(true);
    };

    const handlePaymentModalConfirm = async () => {
        if (paymentMethod === 'card') {
            if (!cardNumber || cardNumber.length < 12 || !cardExpiry || !cardCvv || !cardName) {
                alert('Please fill in all card details');
                return;
            }
        }

        setIsProcessing(true);

        setTimeout(() => {
            setPaymentSuccess(true);
            setIsProcessing(false);
            
            setTimeout(() => {
                setOrderComplete(true);
                clearCart();
                setShowPaymentModal(false);
            }, 3000);
        }, 2000);
    };

    const handleCardPaymentSubmit = (e) => {
        e.preventDefault();
        handlePaymentModalConfirm();
    };

    if (cartItems.length === 0 && !orderComplete) {
        return (
            <div className="container-custom py-12 text-center">
                <ShoppingBag className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Your Cart is Empty</h2>
                <p className="text-gray-600 mb-8 text-lg">Start shopping to add items to your cart</p>
                <Link to="/products" className="btn-primary inline-flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Start Shopping
                </Link>
            </div>
        );
    }

    if (orderComplete) {
        return (
            <div className="container-custom py-12 text-center">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h2>
                    <p className="text-gray-600 mb-4">Thank you for your order!</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-700">You will receive a confirmation SMS shortly.</p>
                        <p className="text-sm text-gray-700">Order reference: #HK-{Date.now().toString().slice(-6)}</p>
                    </div>
                    <Link to="/" className="btn-primary">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (showCheckout) {
        return (
            <div className="container-custom py-8 max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <button
                        onClick={() => setShowCheckout(false)}
                        className="text-gray-500 hover:text-gray-700 mb-6 flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Cart
                    </button>

                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>
                    
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Order Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Items:</span>
                                <span>{totalItems}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Amount:</span>
                                <span className="font-bold text-harykims-600">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handlePayment}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('mpesa')}
                                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                                        paymentMethod === 'mpesa' 
                                            ? 'border-harykims-600 bg-harykims-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="block text-2xl mb-1">📱</span>
                                    <span className="font-medium">M-Pesa</span>
                                    <span className="text-xs text-gray-500 block">Pay with M-Pesa</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                                        paymentMethod === 'card' 
                                            ? 'border-harykims-600 bg-harykims-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="block text-2xl mb-1">💳</span>
                                    <span className="font-medium">Card</span>
                                    <span className="text-xs text-gray-500 block">Coming Soon</span>
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'mpesa' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        M-Pesa Till Number
                                    </label>
                                    <div className="bg-harykims-100 border-2 border-harykims-300 rounded-lg p-3 text-center">
                                        <span className="text-2xl font-bold text-harykims-700">{TILL_NUMBER}</span>
                                        <p className="text-xs text-gray-600 mt-1">Pay to this till number</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="e.g., 0712345678"
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Enter the M-Pesa registered phone number
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Instructions:</strong>
                                    </p>
                                    <ol className="text-sm text-yellow-700 list-decimal list-inside mt-1 space-y-1">
                                        <li>Open M-Pesa on your phone</li>
                                        <li>Select "Lipa Na M-Pesa"</li>
                                        <li>Choose "Pay Bill" or "Buy Goods"</li>
                                        <li>Enter till number: <strong>{TILL_NUMBER}</strong></li>
                                        <li>Enter amount: <strong>{formatPrice(totalPrice)}</strong></li>
                                        <li>Enter your M-Pesa PIN</li>
                                        <li>Confirm payment</li>
                                    </ol>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full btn-primary py-3 text-lg flex items-center justify-center"
                        >
                            {isProcessing ? (
                                <>
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Pay {formatPrice(totalPrice)}
                                </>
                            )}
                        </button>

                        {paymentSuccess && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 text-center">
                                    ✅ Payment initiated! Please check your phone and enter M-Pesa PIN.
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        );
    }

    if (showPaymentModal) {
        return (
            <div className="container-custom py-8 max-w-lg mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <button
                        onClick={() => { setShowPaymentModal(false); setShowCheckout(true); }}
                        className="text-gray-500 hover:text-gray-700 mb-6 flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Checkout
                    </button>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Gateway</h2>
                    <p className="text-gray-600 mb-6">Secure payment processed via MockPay Gateway</p>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Order Summary</h3>
                        <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="font-bold text-harykims-600">{formatPrice(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span>Payment Method:</span>
                            <span className="font-medium capitalize">{paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}</span>
                        </div>
                    </div>

                    {paymentMethod === 'card' ? (
                        <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                                <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="Full name on card"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="0000 0000 0000 0000"
                                    className="input-field"
                                    maxLength={19}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                    <input
                                        type="text"
                                        value={cardExpiry}
                                        onChange={(e) => setCardExpiry(e.target.value)}
                                        placeholder="MM/YY"
                                        className="input-field"
                                        maxLength={5}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                    <input
                                        type="text"
                                        value={cardCvv}
                                        onChange={(e) => setCardCvv(e.target.value)}
                                        placeholder="123"
                                        className="input-field"
                                        maxLength={4}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full btn-primary py-3 text-lg flex items-center justify-center mt-4"
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Confirm Payment {formatPrice(totalPrice)}
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 border rounded-lg">
                                <div className="bg-harykims-100 p-3 rounded-full">
                                    <Phone className="w-5 h-5 text-harykims-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">M-Pesa Payment</p>
                                    <p className="text-sm text-gray-500">Pay to Till Number: <strong>{TILL_NUMBER}</strong></p>
                                </div>
                            </div>
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800"><strong>Amount:</strong> {formatPrice(totalPrice)}</p>
                                <p className="text-sm text-yellow-700 mt-1">You will be prompted to enter your M-Pesa PIN on your phone.</p>
                            </div>
                            <button
                                onClick={handlePaymentModalConfirm}
                                disabled={isProcessing}
                                className="w-full btn-primary py-3 text-lg flex items-center justify-center"
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Confirm M-Pesa Payment
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                <span className="text-gray-600">{totalItems} items</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                                <img
                                    src={getImage(item)}
                                    alt={item.name}
                                    className="w-24 h-24 object-cover rounded-lg"
                                    onError={(e) => {
                                        e.target.src = '/api/placeholder/100/100';
                                    }}
                                />
                                <div className="flex-1 ml-4">
                                    <Link to={`/product/${item.id}`} className="font-semibold hover:text-harykims-600">
                                        {item.name}
                                    </Link>
                                    <p className="text-harykims-600 font-bold text-lg">
                                        {formatPrice(item.price)}
                                    </p>
                                    <p className="text-sm text-gray-500">MOQ: {item.min_order_quantity || 1}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="px-3 py-2 hover:bg-gray-50 rounded-l-lg"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="px-4 py-2 min-w-[3rem] text-center font-semibold">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="px-3 py-2 hover:bg-gray-50 rounded-r-lg"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={clearCart}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Clear Cart
                        </button>
                        <Link to="/products" className="text-harykims-600 hover:text-harykims-700 text-sm font-medium flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        
                        <div className="space-y-3 border-b pb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">{formatPrice(totalPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax</span>
                                <span className="text-gray-600">Included</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between pt-4 mb-6">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-2xl font-bold text-harykims-600">
                                {formatPrice(totalPrice)}
                            </span>
                        </div>
                        
                        <button
                            onClick={handleProceedToCheckout}
                            className="w-full btn-primary py-3 text-lg"
                        >
                            Proceed to Checkout
                        </button>
                        
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Secure checkout powered by M-Pesa
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
