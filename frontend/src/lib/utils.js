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
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
    // Remove /api suffix if present to get root URL
    const rootUrl = baseUrl.replace(/\/api$/, '');
    // Ensure path doesn't start with / to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${rootUrl}/storage/${cleanPath}`;
};
