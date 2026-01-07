const http = require("http");
const express = require("express");
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(express.static(path.resolve("./public")));
app.get('/', (req, res) => {
    return res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const io = new Server(server);

io.on('connection', (socket) => {
    console.log('user connected', socket.id);

    // when a client sends a message string, broadcast an object with text, id and timestamp
    socket.on('user-message', (msg) => {
        io.emit('message', { text: msg, id: socket.id, ts: Date.now() });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });
});
server.listen(9000, () => {
    console.log(`server is started at PORT 9000`)
});
