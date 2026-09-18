import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

const WhatsAppButton = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Phone number (without + sign)
    const phoneNumber = '254118477340';
    // Formatted phone number for display
    const displayNumber = '0118 477 340';
    // WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}`;

    // Auto-hide tooltip after 5 seconds
    useEffect(() => {
        setShowTooltip(true);
        const timer = setTimeout(() => {
            setShowTooltip(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleClick = () => {
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Tooltip */}
            {showTooltip && (
                <div className="mb-3 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-bounce relative">
                    Chat with us on WhatsApp!
                    <div className="absolute -bottom-2 right-4 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                </div>
            )}

            {/* WhatsApp Button */}
            <button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    relative flex items-center justify-center
                    w-14 h-14 rounded-full shadow-lg
                    transition-all duration-300 transform
                    bg-green-500 hover:bg-green-600
                    ${isHovered ? 'scale-110' : 'scale-100'}
                    ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                aria-label="Chat on WhatsApp"
            >
                <MessageCircle className="w-7 h-7 text-white" />
                
                {/* Notification dot */}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                
                {/* Hover tooltip on button */}
                {isHovered && (
                    <div className="absolute right-full mr-3 bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
                        Chat with us
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                )}
            </button>

            {/* Business Hours indicator */}
            <div className="mt-2 text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                Available 24hrs
            </div>
        </div>
    );
};

export default WhatsAppButton;
