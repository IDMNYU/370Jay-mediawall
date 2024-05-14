const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    // Handle play event
    socket.on('play', () => {
        console.log('play event received');
        io.emit('play'); // broadcast the play event to all clients
    });

    // Handle pause event
    socket.on('pause', () => {
        console.log('pause event received');
        io.emit('pause'); // broadcast the pause event to all clients
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});