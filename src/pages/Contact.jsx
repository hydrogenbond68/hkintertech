import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = () => {
        window.open('https://wa.me/254118477340', '_blank');
    };

    const contactInfo = [
        {
            icon: Phone,
            title: 'Phone',
            details: ['+254714 818 100', '+254118 477 340'],
            color: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            icon: Mail,
            title: 'Email',
            details: ['harykimsintertech@gmail.com', 'hkcyber20@gmail.com'],
            color: 'bg-green-50',
            iconColor: 'text-green-600'
        },
        {
            icon: MapPin,
            title: 'Address',
            details: ['Wangige, Kabete Makumi building', 'P.O. Box 183-00614'],
            color: 'bg-red-50',
            iconColor: 'text-red-600'
        },
        {
            icon: Clock,
            title: 'Working Hours',
            details: ['Mon-Mon: 24hrs'],
            color: 'bg-purple-50',
            iconColor: 'text-purple-600'
        }
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-harykims-700 to-harykims-500 text-white py-16">
                <div className="container-custom text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
                    <p className="text-xl text-harykims-100 max-w-2xl mx-auto">
                        Have questions or need assistance? We're here to help you.
                    </p>
                </div>
            </div>

            <div className="container-custom py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                        <div className="space-y-4">
                            {contactInfo.map((info, index) => (
                                <div key={index} className={`${info.color} p-4 rounded-xl`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${info.color} bg-white`}>
                                            <info.icon className={`w-5 h-5 ${info.iconColor}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{info.title}</h3>
                                            {info.details.map((detail, i) => (
                                                <p key={i} className="text-sm text-gray-600">{detail}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* WhatsApp Contact */}
                        <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-green-600 p-2 rounded-lg">
                                    <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-green-800">WhatsApp</h3>
                            </div>
                            <p className="text-2xl font-bold text-green-700">0118 477 340</p>
                            <button
                                onClick={handleWhatsApp}
                                className="inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Chat with us on WhatsApp →
                            </button>
                        </div>

                        {/* M-Pesa Info */}
                        <div className="mt-4 bg-harykims-50 border-2 border-harykims-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-harykims-600 p-2 rounded-lg">
                                    <Phone className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-harykims-800">M-Pesa Paybill</h3>
                            </div>
                            <p className="text-2xl font-bold text-harykims-700">3646096</p>
                            <p className="text-sm text-gray-600 mt-1">For payments and transactions</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                            
                            {success && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700">Message sent successfully! We'll respond within 24 hours.</span>
                                </div>
                            )}
                            
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Your Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="input-field"
                                        required
                                        placeholder="What's this about?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message *
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="input-field min-h-[150px]"
                                        rows="5"
                                        required
                                        placeholder="Tell us how we can help you..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                                <p className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-harykims-600" />
                                    We typically respond within 24 hours during business days.
                                </p>
                                <p className="flex items-center gap-2 mt-2">
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                    For immediate assistance, chat with us on WhatsApp at <strong>0118 477 340</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Section - Static */}
                <div className="mt-12 bg-gray-200 rounded-xl overflow-hidden h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-2 text-harykims-600" />
                        <p className="font-medium">Wangige, Kabete</p>
                        <p className="text-sm">📍 Find us at our Wangige office</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
