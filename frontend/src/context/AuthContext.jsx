import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('qc_token') || null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Setup axios defaults
    useEffect(() => {
        axios.defaults.baseURL = 'http://localhost:9000';
    }, []);

    useEffect(() => {
        if (token) {
            axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setUser({ ...res.data, token }))
                .catch(() => {
                    localStorage.removeItem('qc_token');
                    setToken(null);
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        setAuthError(null);
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            const { token: newToken, ...userData } = res.data;
            localStorage.setItem('qc_token', newToken);
            setToken(newToken);
            setUser({ ...userData, token: newToken });
        } catch (err) {
            let msg = err.response?.data?.message || 'Authentication failed.';
            if (err.response?.data?.errors) msg = err.response.data.errors[0].msg;
            setAuthError(msg);
            throw err;
        }
    };

    const register = async (username, email, password) => {
        setAuthError(null);
        try {
            const res = await axios.post('/api/auth/register', { username, email, password });
            const { token: newToken, ...userData } = res.data;
            localStorage.setItem('qc_token', newToken);
            setToken(newToken);
            setUser({ ...userData, token: newToken });
        } catch (err) {
            let msg = err.response?.data?.message || 'Authentication failed.';
            if (err.response?.data?.errors) msg = err.response.data.errors[0].msg;
            setAuthError(msg);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('qc_token');
        setToken(null);
        setUser(null);
    };

    const updateProfile = (newData) => {
        setUser(prev => ({ ...prev, ...newData }));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, authError, setAuthError, updateProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
