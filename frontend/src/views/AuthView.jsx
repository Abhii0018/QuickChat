import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';

export default function AuthView() {
    const { login, register, authError, setAuthError } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
        } catch (err) {
            // Error handled in context
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (loginMode) => {
        setIsLogin(loginMode);
        setAuthError(null);
    };

    return (
        <div className="auth-view">
            <div className="auth-panel">
                <div className="auth-brand">
                    <div className="brand-icon">
                        <MessageSquare size={18} fill="currentColor" strokeWidth={0} />
                    </div>
                    <span className="brand-name">QuickChat</span>
                </div>

                <div className="auth-box">
                    <div className="auth-header">
                        <h1>{isLogin ? 'Sign in to QuickChat' : 'Create your account'}</h1>
                        <p>{isLogin ? 'Enter your credentials to continue.' : 'Free forever. No credit card required.'}</p>
                    </div>

                    <div className="tabs" role="tablist">
                        <button 
                            className={`tab-btn ${isLogin ? 'active' : ''}`}
                            onClick={() => switchMode(true)}
                        >Login</button>
                        <button 
                            className={`tab-btn ${!isLogin ? 'active' : ''}`}
                            onClick={() => switchMode(false)}
                        >Register</button>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {!isLogin && (
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
                                {isLogin ? 'Sign in' : 'Create account'}
                            </span>
                            {loading && <span className="btn-loader"></span>}
                        </button>

                        {authError && <p className="field-error" role="alert">{authError}</p>}
                    </form>
                </div>
            </div>

            <div className="auth-visual" aria-hidden="true">
                <div className="visual-content">
                    <div className="chat-mockup">
                        <div className="mock-msg mock-other"><div className="mock-avatar">S</div><div className="mock-bubble">Hey, did you review the PR?</div></div>
                        <div className="mock-msg mock-mine"><div className="mock-bubble">Just left some comments 👍</div></div>
                        <div className="mock-msg mock-other"><div className="mock-avatar">S</div><div className="mock-bubble">Perfect, merging now!</div></div>
                        <div className="mock-msg mock-mine"><div className="mock-bubble">Deploying to staging ✅</div></div>
                    </div>
                    <p className="visual-caption">Private, real-time, and secure messaging.</p>
                </div>
            </div>
        </div>
    );
}
