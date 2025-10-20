import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Usando a instância central

// CORREÇÃO 1: Adicionar 'export' para que outros arquivos possam importar o Context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
            delete axiosInstance.defaults.headers.common['Authorization'];
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axiosInstance.post('/auth/login', { username, password });
            if (response.data.token) {
                const newToken = response.data.token;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                return response.data;
            }
        } catch (error) {
            logout(); // Clear any stale auth state
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                throw new Error('Could not connect to the server. Is the backend running?');
            } else {
                throw new Error(error.message);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        delete axiosInstance.defaults.headers.common['Authorization'];
    };

    const isAuthenticated = () => {
        // Isso pode ser melhorado decodificando o JWT e checando a expiração
        return !!token;
    };

    const value = {
        token,
        login,
        logout,
        isAuthenticated,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// CORREÇÃO 2: O Hook useAuth DEVE estar neste arquivo (para o seu projeto) e ser exportado
// Ele é o que será importado pelos componentes.
export const useAuth = () => {
    return useContext(AuthContext);
};