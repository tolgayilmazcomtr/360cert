import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    }).format(amount);
};

export const getStorageUrl = (path) => {
    if (!path) return null;
    // Already a full URL — return as-is
    if (/^https?:\/\//i.test(path)) return path;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api')
        .trim()
        .replace(/\/api\/?$/, '') // remove trailing /api or /api/
        .replace(/\/$/, '');      // remove any trailing slash
    const cleanPath = path.replace(/^\/+/, ''); // remove leading slashes
    return `${base}/storage/${cleanPath}`;
};
