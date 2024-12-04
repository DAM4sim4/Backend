const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const videoSessionRoutes = require('./routes/videoSessionRoutes');
const http = require('http');
const socketIo = require('socket.io');
const bonjour = require('bonjour')();

// Load environment variables from .env file
dotenv.config();

if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in the .env file.");
    process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // Adjust the origin to restrict access if necessary
        methods: ['GET', 'POST'],
    },
});

// Middleware setup
app.use(express.json({ limit: '10mb' })); // Increase body size limit to 10MB
app.use(express.urlencoded({ limit: '10mb', extended: true })); // For handling form-encoded data
app.use(morgan('dev'));
app.use(cors({ origin: '*' })); // Adjust the origin to restrict access if necessary

// Connect to database
connectDB();

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/video-sessions', videoSessionRoutes);

// WebSocket setup
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinCall', (roomId, userId) => {
        if (!roomId || !userId) {
            console.error('Invalid joinCall request:', { roomId, userId });
            socket.emit('error', 'Invalid joinCall request');
            return;
        }
        console.log(`${userId} joined room ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit('userJoined', { userId, roomId });
    });

    socket.on('offer', (roomId, offer, userId) => {
        if (!roomId || !offer || !userId) {
            console.error('Invalid offer:', { roomId, offer, userId });
            socket.emit('error', 'Invalid offer');
            return;
        }
        console.log(`Offer from ${userId} in room ${roomId}`);
        socket.to(roomId).emit('offer', { offer, userId });
    });

    socket.on('answer', (roomId, answer, userId) => {
        if (!roomId || !answer || !userId) {
            console.error('Invalid answer:', { roomId, answer, userId });
            socket.emit('error', 'Invalid answer');
            return;
        }
        console.log(`Answer from ${userId} in room ${roomId}`);
        socket.to(roomId).emit('answer', { answer, userId });
    });

    socket.on('candidate', (roomId, candidate, userId) => {
        if (!roomId || !candidate || !userId) {
            console.error('Invalid candidate:', { roomId, candidate, userId });
            socket.emit('error', 'Invalid candidate');
            return;
        }
        console.log(`Candidate from ${userId} in room ${roomId}`);
        socket.to(roomId).emit('candidate', { candidate, userId });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

// Define a simple route
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Advertise the service via Bonjour (optional, used for network discovery)
    bonjour.publish({ name: 'StudySync Server', type: 'http', port: PORT });
});
