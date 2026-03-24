import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { MessageSquare, Search, LogOut, Paperclip, Send, Camera, Trash2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';

// ─── Toast Subcomponent ─────────────────────────────
function Toast() {
    const { toast } = useChat();
    return (
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {toast.message}
        </div>
    );
}

// ─── Sidebar Subcomponent ─────────────────────────────
function Sidebar() {
    const { user, logout } = useAuth();
    const { isConnected, allUsers, currentRoom, switchRoom, fetchUsers } = useChat();
    
    const generalActive = currentRoom === 'general-room';
    
    // Count online (excluding me)
    const onlineCount = allUsers.filter(u => u.isOnline && u._id !== user._id).length;

    const handleSearch = (e) => fetchUsers(e.target.value);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon sm">
                    <MessageSquare size={14} fill="currentColor" strokeWidth={0} />
                </div>
                <span className="brand-name">QuickChat</span>
                <div className={`conn-badge ${isConnected ? 'live' : 'dead'}`} title={isConnected ? 'Connected' : 'Disconnected'}>
                    <span className="conn-dot"></span>
                </div>
            </div>

            <div className="sidebar-search">
                <div className="search-field">
                    <Search className="search-ico" size={14} />
                    <input type="text" placeholder="Search" onChange={handleSearch} spellCheck="false" />
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <p className="nav-label">Channels</p>
                    <div 
                        className={`nav-item ${generalActive ? 'active' : ''}`}
                        onClick={() => switchRoom('general-room')}
                    >
                        <span className="nav-hash">#</span>
                        <span>general</span>
                    </div>
                </div>

                <div className="nav-section">
                    <p className="nav-label">
                        Direct Messages
                        <span className="online-badge">{onlineCount}</span>
                    </p>
                    <div>
                        {allUsers.length === 0 ? (
                            <p className="nav-empty">No users found.</p>
                        ) : (
                            allUsers.filter(u => u._id !== user._id).map(u => {
                                const roomId = 'dm_' + [user._id, u._id].sort().join('_');
                                return (
                                    <div 
                                        key={u._id}
                                        className={`user-item ${roomId === currentRoom ? 'active' : ''}`}
                                        onClick={() => switchRoom(roomId)}
                                    >
                                        {u.profilePic ? (
                                            <img src={`${axios.defaults.baseURL || 'http://localhost:9000'}${u.profilePic}`} className="me-avatar sm" style={{objectFit:'cover'}} alt="" />
                                        ) : (
                                            <div className="me-avatar sm">{(u.username || '?')[0].toUpperCase()}</div>
                                        )}
                                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{u.username}</span>
                                        <span className={`user-presence ${u.isOnline ? 'online' : ''}`}>
                                            {u.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="me-row">
                    {user.profilePic ? (
                        <img src={`${axios.defaults.baseURL || 'http://localhost:9000'}${user.profilePic}`} className="me-avatar" style={{objectFit:'cover'}} alt="" />
                    ) : (
                        <div className="me-avatar">{(user.username || '?')[0].toUpperCase()}</div>
                    )}
                    <span className="me-name">{user.username}</span>
                </div>
                <button className="btn-logout" onClick={logout} title="Sign out">
                    <LogOut size={15} />
                </button>
            </div>
        </aside>
    );
}

// ─── ChatWindow Subcomponent ─────────────────────────────
function ChatWindow() {
    const { token, user, updateProfile } = useAuth();
    const { currentRoom, allUsers, messages, typingUsers, sendMessage, emitTyping, emitStopTyping, showToast, deleteMessage } = useChat();
    
    const fileRef = useRef(null);
    const profileRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [msgText, setMsgText] = useState('');
    const [hoveredMsg, setHoveredMsg] = useState(null);

    const isDM = currentRoom.startsWith('dm_');
    let roomLabel = 'general';
    let otherProfilePic = '';
    if (isDM && allUsers.length > 0) {
        const otherId = currentRoom.replace('dm_', '').replace(user._id, '').replace('_', '');
        const other = allUsers.find(u => u._id === otherId);
        roomLabel = other ? other.username : 'direct message';
        otherProfilePic = other ? other.profilePic : '';
    }

    // Auto-scroll inside effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView();
    }, [messages]);

    const handleSend = () => {
        if (!msgText.trim()) return;
        sendMessage(msgText.trim());
        setMsgText('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Typing debounce
    const typingTimer = useRef(null);
    const handleInput = (e) => {
        setMsgText(e.target.value);
        emitTyping();
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => emitStopTyping(), 1500);
    };

    // File upload
    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await axios.post('/api/files/upload', fd, {
                headers: { Authorization: `Bearer ${token}` }
            });
            sendMessage('', res.data.fileUrl, res.data.fileType);
            if (fileRef.current) fileRef.current.value = '';
        } catch {
            showToast('Upload failed — max 5 MB, images/docs only.', 'error');
        }
    };

    const handleProfilePic = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await axios.post('/api/users/profile-pic', fd, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateProfile({ profilePic: res.data.profilePic });
            showToast('Profile photo updated!', 'success');
        } catch {
            showToast('Profile photo upload failed.', 'error');
        }
    };

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';

    return (
        <main className="chat-main">
            {/* Hidden Profile Input globally accessible by ID */}
            <input id="profile-upload-input" type="file" ref={profileRef} className="hidden" accept="image/*" onChange={handleProfilePic} />
            
            <header className="chat-topbar">
                <div className="topbar-left">
                    <span className="topbar-channel">
                        {isDM ? (
                            <>
                                {otherProfilePic ? (
                                    <img src={`${baseUrl}${otherProfilePic}`} className="topbar-avatar" style={{objectFit:'cover'}} alt="" />
                                ) : (
                                    <div className="topbar-avatar">{roomLabel.substring(0, 2)}</div>
                                )}
                                {roomLabel}
                            </>
                        ) : (
                            `# ${roomLabel}`
                        )}
                    </span>
                    {Object.keys(typingUsers).length > 0 && (
                        <span className="typing-label">
                            <span className="typing-anim"><span></span><span></span><span></span></span>
                            {Object.keys(typingUsers)[0]} is typing
                        </span>
                    )}
                </div>
                <div className="topbar-right">
                    {/* Intentionally left blank as requested */}
                </div>
            </header>

            <section className="messages-pane">
                {messages.length === 0 ? (
                    <div className="empty-pane">
                        <div className="empty-icon">
                            <MessageSquare size={32} opacity={0.3} />
                        </div>
                        <p className="empty-title">This is the beginning of the conversation.</p>
                        <p className="empty-sub">Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        if (msg.isSystem) {
                            return <div key={idx} className="msg-system">{msg.text}</div>;
                        }

                        const senderId = msg.sender?._id || msg.sender;
                        const isMe = String(senderId) === String(user._id);
                        const senderName = msg.sender?.username || 'Someone';
                        const initial = senderName[0].toUpperCase();
                        const senderPic = msg.sender?.profilePic || (isMe && user.profilePic) || '';
                        
                        const timeString = msg.createdAt 
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div 
                                key={msg._id || idx} 
                                className={`msg-row ${isMe ? 'mine' : ''}`}
                                onMouseEnter={() => setHoveredMsg(msg._id)}
                                onMouseLeave={() => setHoveredMsg(null)}
                            >
                                {!isMe && (
                                    senderPic ? (
                                        <img src={`${baseUrl}${senderPic}`} className="msg-avatar" style={{objectFit:'cover'}} alt="" />
                                    ) : (
                                        <div className="msg-avatar">{initial}</div>
                                    )
                                )}
                                <div className="msg-body">
                                    {!isMe && <div className="msg-meta">{senderName}</div>}
                                    <div className="msg-bubble">
                                        {msg.fileUrl && (
                                            msg.fileType?.includes('image') ? (
                                                <img 
                                                    src={`${baseUrl}${msg.fileUrl}`} 
                                                    className="file-preview" 
                                                    onClick={() => window.open(`${baseUrl}${msg.fileUrl}`)}
                                                    alt="Attachment" 
                                                />
                                            ) : (
                                                <a href={`${baseUrl}${msg.fileUrl}`} target="_blank" rel="noreferrer">
                                                    📎 Open Attachment
                                                </a>
                                            )
                                        )}
                                        {msg.text && <span>{msg.text}</span>}
                                        <span className="msg-time">{timeString}</span>
                                    </div>
                                </div>
                                {isMe && hoveredMsg === msg._id && !msg.isSystem && msg._id && (
                                    <div className="msg-actions">
                                        <button className="btn-action" onClick={() => deleteMessage(msg._id)} title="Delete message">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </section>

            <footer className="chat-composer">
                <button className="btn-attach" onClick={() => fileRef.current?.click()} title="Attach file">
                    <Paperclip size={16} />
                </button>
                <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFile} />

                <div className="composer-input-wrap">
                    <input 
                        type="text" 
                        placeholder={`Message ${isDM ? '@' : '#'} ${roomLabel}`} 
                        value={msgText}
                        onChange={handleInput}
                        onKeyDown={handleKey}
                    />
                </div>

                <button className="btn-send" onClick={handleSend} title="Send">
                    <Send size={16} />
                </button>
            </footer>
        </main>
    );
}

// ─── Main View ─────────────────────────────
export default function ChatView() {
    return (
        <div className="chat-view">
            <Toast />
            <Sidebar />
            <ChatWindow />
        </div>
    );
}
