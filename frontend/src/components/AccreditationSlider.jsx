import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';

export default function AccreditationSlider() {
    const [accreditations, setAccreditations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAccreditations = async () => {
            try {
                const res = await api.get('/public/accreditations');
                if (res.data) {
                    setAccreditations(res.data);
                }
            } catch (error) {
                console.error("Failed to load accreditations", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccreditations();
    }, []);

    if (isLoading || accreditations.length === 0) {
        return null;
    }

    // Duplicate the array to create a seamless infinite loop
    const duplicatedLogos = [...accreditations, ...accreditations];
    const apiBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://127.0.0.1:8000';

    return (
        <div className="w-full bg-slate-900 border-t border-b border-slate-800 py-12 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
                <h3 className="text-sm font-semibold text-slate-400 tracking-widest uppercase">
                    Uluslararası Akreditasyon ve Onay Kurumları
                </h3>
            </div>

            <div className="flex w-[200%] sm:w-[150%] md:w-full overflow-hidden relative group">
                {/* Left Fade */}
                <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-slate-900 to-transparent z-10"></div>

                {/* Right Fade */}
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-slate-900 to-transparent z-10"></div>

                <motion.div
                    className="flex items-center gap-12 sm:gap-20 whitespace-nowrap px-4"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        ease: "linear",
                        duration: 20, // Adjust speed as needed
                        repeat: Infinity,
                    }}
                >
                    {duplicatedLogos.map((acc, index) => (
                        <div key={`${acc.id}-${index}`} className="flex-shrink-0 flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors w-40 h-24 sm:w-48 sm:h-28">
                            {acc.logo_path ? (
                                <img
                                    src={`${apiBase}${acc.logo_path}`}
                                    alt={acc.name}
                                    className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
                                    title={acc.name}
                                />
                            ) : (
                                <span className="text-slate-300 font-semibold text-center whitespace-normal leading-tight text-sm">
                                    {acc.name}
                                </span>
                            )}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
