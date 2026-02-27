import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingWhatsApp({ number, message }) {
    if (!number) return null;

    // Clean number for WA link
    const stringNumber = String(number);
    const cleanNumber = stringNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message || 'Merhaba, bilgi almak istiyorum.');
    const waLink = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    return (
        <AnimatePresence>
            <motion.a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 lg:bottom-10 right-6 lg:right-10 z-[100] flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-[#25D366] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.6)] transition-shadow duration-300"
                title="Bize Ulaşın"
            >
                {/* Pulse Ring */}
                <span className="absolute w-full h-full rounded-full bg-[#25D366] opacity-40 animate-ping"></span>

                {/* WhatsApp SVG Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 lg:w-9 lg:h-9 relative z-10"
                >
                    <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.477 2 12c0 1.8.468 3.518 1.34 5.034L2 22l5.127-1.319A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm.178 15.688a8.315 8.315 0 01-4.234-1.157l-.304-.18-3.14.808.825-3.056-.197-.313A8.303 8.303 0 013.682 12c0-4.582 3.737-8.318 8.318-8.318 4.582 0 8.318 3.736 8.318 8.318 0 4.582-3.736 8.318-8.318 8.318zm4.566-6.204c-.25-.125-1.48-.732-1.708-.816-.23-.083-.396-.125-.563.125-.167.25-.646.816-.792.983-.146.167-.292.188-.542.063-.25-.125-1.056-.39-2.013-1.242-.744-.664-1.247-1.485-1.393-1.735-.146-.25-.016-.385.11-.51.112-.11.25-.292.375-.438.125-.146.167-.25.25-.417.083-.167.042-.313-.021-.438-.063-.125-.563-1.354-.77-1.854-.204-.492-.41-.425-.563-.433h-.48c-.167 0-.438.063-.667.313-.23.25-.875.854-.875 2.083 0 1.23.896 2.417 1.021 2.583.125.167 1.76 2.688 4.264 3.768.596.257 1.06.41 1.424.524.598.19 1.142.163 1.571.099.478-.073 1.48-.604 1.688-1.188.208-.583.208-1.083.146-1.188-.063-.104-.23-.167-.48-.292z"
                        clipRule="evenodd"
                    />
                </svg>
            </motion.a>
        </AnimatePresence>
    );
}
