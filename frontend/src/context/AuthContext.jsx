import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext({
    user: null,
    login: async () => { },
    logout: async () => { },
    register: async () => { },
    isLoading: true,
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const response = await api.get("/user");
            setUser(response.data);
        } catch (error) {
            console.error("User refresh failed", error);
        }
    };

    // Check if user is logged in
    const checkUser = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const response = await api.get("/user");
                setUser(response.data);
            } catch (error) {
                console.error("User validation failed", error);
                localStorage.removeItem("token");
                setUser(null);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post("/login", { email, password });
            const { token, user } = response.data; // Fixed key
            localStorage.setItem("token", token);
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || "Giriş başarısız.",
            };
        }
    };

    const register = async (data) => {
        try {
            const response = await api.post("/register", data);
            // Check if backend returns token for auto-login
            if (response.data.token) {
                const { token, user } = response.data;
                localStorage.setItem("token", token);
                setUser(user);
            }
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Register Error:", error.response); // Debug log
            return {
                success: false,
                error: error.response?.data?.message || "Kayıt başarısız.",
                errors: error.response?.data?.errors // Pass validation errors
            };
        }
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            // Ignore error on logout
        }
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, isLoading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
