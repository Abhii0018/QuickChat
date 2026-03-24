import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import heroImg from '../assets/frontPage.png';

export default function AuthView() {
    const { login, register, authError, setAuthError } = useAuth();
    const [viewMode, setViewMode] = useState('landing'); // 'landing', 'login', 'register'
    const [loading, setLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (viewMode === 'login') {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (mode) => {
        setViewMode(mode);
        setAuthError(null);
    };

    return (
        <div className="auth-view">
            <div className="auth-panel">
                <div className="auth-brand" onClick={() => switchMode('landing')} style={{cursor:'pointer'}}>
                    <div className="brand-icon">
                        <MessageSquare size={18} fill="currentColor" strokeWidth={0} />
                    </div>
                    <span className="brand-name">QuickChat</span>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'landing' ? (
                        <motion.div 
                            key="landing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="auth-box center-content"
                        >
                            <div className="auth-header">
                                <h1>The fastest way to chat with your team.</h1>
                                <p>Join thousands of users who trust QuickChat for their daily communication.</p>
                            </div>
                            <button className="btn-primary btn-large" onClick={() => switchMode('register')}>
                                Try QuickChat for Free <ArrowRight size={18} />
                            </button>
                            <p className="auth-footer-text">
                                Already have an account? <span className="link-text" onClick={() => switchMode('login')}>Sign in</span>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="auth-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="auth-box"
                        >
                            <div className="auth-header">
                                <h1>{viewMode === 'login' ? 'Welcome back' : 'Create an account'}</h1>
                                <p>{viewMode === 'login' ? 'Enter your details to continue.' : 'Start your journey with QuickChat today.'}</p>
                            </div>

                            <div className="tabs">
                                <button 
                                    className={`tab-btn ${viewMode === 'login' ? 'active' : ''}`}
                                    onClick={() => switchMode('login')}
                                >Login</button>
                                <button 
                                    className={`tab-btn ${viewMode === 'register' ? 'active' : ''}`}
                                    onClick={() => switchMode('register')}
                                >Register</button>
                            </div>

                            <form onSubmit={handleSubmit} noValidate>
                                {viewMode === 'register' && (
                                    <div className="field">
                                        <label htmlFor="username">Username</label>
                                        <input 
                                            type="text" 
                                            id="username" 
                                            placeholder="e.g. john_doe"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            spellCheck="false" 
                                        />
                                    </div>
                                )}
                                <div className="field">
                                    <label htmlFor="email">Email address</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        placeholder="you@company.com" 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="password">Password</label>
                                    <input 
                                        type="password" 
                                        id="password" 
                                        placeholder="Min. 6 characters" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required 
                                    />
                                </div>

                                <button type="submit" className="btn-primary" disabled={loading}>
                                    <span className={loading ? 'hidden' : 'btn-text'}>
                                        {viewMode === 'login' ? 'Sign in' : 'Create account'}
                                    </span>
                                    {loading && <span className="btn-loader"></span>}
                                </button>

                                {authError && <p className="field-error">{authError}</p>}
                                
                                <button type="button" className="btn-secondary" onClick={() => switchMode('landing')} style={{marginTop:'12px', width:'100%', background:'transparent', border:'none', color:'var(--c-t2)', fontSize:'13px', cursor:'pointer'}}>
                                    Back to home
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="auth-visual">
                <div className="visual-content">
                    <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="visual-title-animated"
                    >
                        Have your best chat.
                    </motion.h2>
                    <div className="hero-img-container shadow-premium">
                        <img src={heroImg} className="hero-mockup-img" alt="QuickChat Interface Mockup" />
                    </div>
                    <p className="visual-caption">Private, real-time, and secure messaging everywhere.</p>
                </div>
            </div>
        </div>
    );
}
