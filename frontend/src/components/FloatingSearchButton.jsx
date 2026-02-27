import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloatingSearchButton() {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 100 }}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] hidden md:flex"
            >
                <Link to="/sertifika-dogrula" className="group flex items-center">
                    {/* The sliding text part */}
                    <div className="overflow-hidden w-0 group-hover:w-48 transition-all duration-300 ease-in-out flex justify-end">
                        <div className="bg-slate-900/90 backdrop-blur-md text-white font-medium py-3 px-6 h-14 flex items-center whitespace-nowrap border-y border-l border-white/10 rounded-l-2xl shadow-xl">
                            Sertifika Sorgula
                        </div>
                    </div>

                    {/* The main icon button */}
                    <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-l-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20 group-hover:rounded-none group-hover:rounded-r-2xl relative overflow-hidden transition-all">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                        <Award className="w-6 h-6 z-10" />
                    </div>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
}
