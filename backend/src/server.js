require('dotenv').config();
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const chatSocket = require('./sockets/chatSocket');

const PORT = process.env.PORT || 9000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: '*', // For development. Update to actual origins in production
        methods: ['GET', 'POST']
    }
});

// Pass the io instance to the socket handler
chatSocket(io);

// Start Server
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
