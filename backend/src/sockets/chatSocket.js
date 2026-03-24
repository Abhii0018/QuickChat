const jwt = require('jsonwebtoken');
const User = require('../models/User');
const messageService = require('../services/messageService');

// Map socket.id -> { _id, username }
const onlineUsers = new Map();
// Simple spam prevention: Map socket.id -> last message timestamp
const userLastMessageTime = new Map();

const chatSocket = (io) => {
    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // lean() query for faster load since we only need ID and username
            const user = await User.findById(decoded.id).select('username email _id').lean();
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user._id.toString();
        console.log(`User connected: ${socket.user.username} (${socket.id})`);

        // Track user mapping
        onlineUsers.set(socket.id, { _id: userId, username: socket.user.username });
        
        // Asynchronously update online status without blocking socket connection
        User.findByIdAndUpdate(userId, { isOnline: true }).exec().catch(err => console.error(err));
        
        // Broadcast single minimal status to others
        socket.broadcast.emit('userStatus', { userId, status: 'online' });

        // Join a specific room
        socket.on('joinRoom', (room) => {
            if (!room || typeof room !== 'string') return;
            socket.join(room);
            
            socket.to(room).emit('notification', {
                message: `${socket.user.username} joined.`
            });
        });

        // Leave a specific room
        socket.on('leaveRoom', (room) => {
            if (!room) return;
            socket.leave(room);
            socket.to(room).emit('notification', {
                message: `${socket.user.username} left.`
            });
        });

        // Chat message event with basic spam throttle
        socket.on('chatMessage', async (data) => {
            const { room, text, fileUrl, fileType } = data;
            if (!room || (!text && !fileUrl)) return; // Invalid input check

            // Simple rate limit: 1 message per 500ms
            const now = Date.now();
            const lastTime = userLastMessageTime.get(socket.id);
            if (lastTime && (now - lastTime < 500)) {
                return socket.emit('error', { message: 'You are sending messages too fast.' });
            }
            userLastMessageTime.set(socket.id, now);

            try {
                // Save and broadcast message
                const populatedMessage = await messageService.saveMessage({
                    senderId: socket.user._id,
                    room,
                    text: text?.trim(),
                    fileUrl,
                    fileType
                });

                // Emit to participants in the room
                io.to(room).emit('message', populatedMessage);
            } catch (error) {
                console.error('Message save error:', error);
                socket.emit('error', { message: 'Message could not be sent.' });
            }
        });

        // Rapid typing indicators
        socket.on('typing', ({ room }) => {
            if (!room) return;
            socket.to(room).emit('typing', { username: socket.user.username });
        });

        socket.on('stopTyping', ({ room }) => {
            if (!room) return;
            socket.to(room).emit('stopTyping', { username: socket.user.username });
        });

        // Delete message
        const Message = require('../models/Message');
        socket.on('deleteMessage', async (messageId) => {
            try {
                const msg = await Message.findById(messageId);
                if (msg && msg.sender.toString() === userId) {
                    await msg.deleteOne();
                    io.to(msg.room).emit('messageDeleted', messageId);
                    socket.emit('messageDeleted', messageId); // also emit to sender
                }
            } catch (err) {
                console.error(err);
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
             console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
             onlineUsers.delete(socket.id);
             userLastMessageTime.delete(socket.id);
             
             // Update database offline status async
             User.findByIdAndUpdate(userId, { 
                 isOnline: false, 
                 lastSeen: new Date() 
             }).exec().catch(err => console.error(err));

             socket.broadcast.emit('userStatus', { 
                 userId, 
                 status: 'offline',
                 lastSeen: new Date()
             });
        });
    });
};

module.exports = chatSocket;
