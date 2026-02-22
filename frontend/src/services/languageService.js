import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Axios interceptor for appending the auth token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const languageService = {
    getAll: async () => {
        const response = await apiClient.get('/languages');
        return response.data;
    },

    updateStatus: async (id, isActive) => {
        const response = await apiClient.put(`/languages/${id}`, { is_active: isActive });
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/languages', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/languages/${id}`);
        return response.data;
    }
};
