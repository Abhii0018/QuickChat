import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user, token } = useAuth();
    
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // UI State: Fixed initialization from localStorage
    const [currentRoom, setCurrentRoom] = useState(localStorage.getItem('qc_room') || 'general-room');
    const [allUsers, setAllUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    // Toast helper
    const showToast = useCallback((msg, type = 'info') => {
        setToast({ show: true, message: msg, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3500);
    }, []);

    // Init Socket
    useEffect(() => {
        if (!token) return;

        const newSocket = io('http://localhost:9000', {
            auth: { token }
        });

        newSocket.on('connect', () => setIsConnected(true));
        newSocket.on('disconnect', () => setIsConnected(false));
        newSocket.on('error', ({ message }) => showToast(message || 'Socket error', 'error'));

        newSocket.on('message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        newSocket.on('messageDeleted', (messageId) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

        newSocket.on('notification', ({ message }) => {
            setMessages(prev => [...prev, { _id: Date.now(), isSystem: true, text: message }]);
        });

        newSocket.on('typing', ({ username }) => {
            setTypingUsers(prev => ({ ...prev, [username]: true }));
        });

        newSocket.on('stopTyping', ({ username }) => {
            setTypingUsers(prev => {
                const next = { ...prev };
                delete next[username];
                return next;
            });
        });

        newSocket.on('userStatus', ({ userId, status }) => {
            setAllUsers(prev => prev.map(u => 
                u._id === userId ? { ...u, isOnline: status === 'online' } : u
            ));
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, [token, showToast]);

    // Fetch users initially
    useEffect(() => {
        if (token) {
            fetchUsers('');
        }
    }, [token]);

    const fetchUsers = async (search = '') => {
        try {
            const url = search ? `/api/users?search=${encodeURIComponent(search)}` : '/api/users';
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setAllUsers(res.data);
        } catch (e) {
            console.error('Failed to fetch users', e);
        }
    };

    // Join room & fetch history
    useEffect(() => {
        if (!socket || !token) return;

        socket.emit('joinRoom', currentRoom);
        
        axios.get(`/api/users/messages/${currentRoom}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        })
        .then(res => setMessages(res.data))
        .catch(e => console.error('History fetch failed', e));

        return () => {
            socket.emit('leaveRoom', currentRoom);
            setMessages([]);
        };
    }, [socket, currentRoom, token]);

    const switchRoom = (newRoom) => {
        if (newRoom !== currentRoom) {
            setCurrentRoom(newRoom);
            localStorage.setItem('qc_room', newRoom);
        }
    };

    const sendMessage = (text, fileUrl = '', fileType = '') => {
        if (!socket || (!text && !fileUrl)) return;
        socket.emit('chatMessage', { room: currentRoom, text, fileUrl, fileType });
        socket.emit('stopTyping', { room: currentRoom });
    };

    const emitTyping = () => {
        if (socket) socket.emit('typing', { room: currentRoom });
    };

    const emitStopTyping = () => {
        if (socket) socket.emit('stopTyping', { room: currentRoom });
    };

    const deleteMessage = (messageId) => {
        if (socket) socket.emit('deleteMessage', messageId);
    };

    return (
        <ChatContext.Provider value={{
            socket,
            isConnected,
            currentRoom,
            allUsers,
            messages,
            typingUsers,
            toast,
            showToast,
            switchRoom,
            sendMessage,
            emitTyping,
            emitStopTyping,
            fetchUsers,
            deleteMessage
        }}>
            {children}
        </ChatContext.Provider>
    );
};
