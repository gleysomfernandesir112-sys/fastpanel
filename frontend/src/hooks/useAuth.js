import axios from 'axios';

// --- CORRECTION 1: USE RELATIVE PATH FOR PROXY ---
// The API is served through Nginx at /api, which redirects to port 3000 internally.
const API_URL = '/api/auth';

// --- CORRECTION 2: EXPORT THE HOOK ---
export const useAuth = () => {
    const register = async (username, password, role) => {
        try {
            // It's generally better practice to use an axios instance that already has the base URL set.
            const response = await axios.post(`${API_URL}/register`, {
                username,
                password,
                role,
            });
            return response.data;
        } catch (error) {
            // Error handling logic remains the same
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                throw new Error('Could not connect to the server. Is the backend running?');
            } else {
                throw new Error(error.message);
            }
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, {
                username,
                password,
            });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response.data;
        } catch (error) {
            // Error handling logic remains the same
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            } else if (error.request) {
                // This error will now correctly point to the Nginx issue, not the localhost one.
                throw new Error('Could not connect to the server. Is the backend running?');
            } else {
                throw new Error(error.message);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
    };

    return {
        register,
        login,
        logout,
    };
};