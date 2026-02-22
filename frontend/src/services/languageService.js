import api from '../api/axios';

export const languageService = {
    getAll: async () => {
        const response = await api.get('/languages');
        return response.data;
    },

    updateStatus: async (id, isActive) => {
        const response = await api.put(`/languages/${id}`, { is_active: isActive });
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/languages', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/languages/${id}`);
        return response.data;
    }
};
