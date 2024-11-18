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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware setup
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Connect to database
connectDB();

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/video-sessions', videoSessionRoutes);


// WebSocket setup
io.on('connection', (socket) => {
    console.log('A user connected');
  
    // Event: Join a room (this will trigger WebRTC signaling)
    socket.on('joinCall', (roomId, userId) => {
      console.log(`${userId} joined room ${roomId}`);
      socket.join(roomId); // Join the room
      io.to(roomId).emit('userJoined', userId); // Notify other participants
    });
  
    // Event: Send offer (SDP)
    socket.on('offer', (roomId, offer, userId) => {
      console.log(`Offer from ${userId} to room ${roomId}`);
      socket.to(roomId).emit('offer', offer, userId); // Send the offer to the room
    });
  
    // Event: Send answer (SDP)
    socket.on('answer', (roomId, answer, userId) => {
      console.log(`Answer from ${userId} to room ${roomId}`);
      socket.to(roomId).emit('answer', answer, userId); // Send the answer to the room
    });
  
    // Event: ICE Candidate
    socket.on('candidate', (roomId, candidate, userId) => {
      console.log(`Candidate from ${userId} to room ${roomId}`);
      socket.to(roomId).emit('candidate', candidate, userId); // Send the candidate to the room
    });
  
    // Event: Disconnect
    socket.on('disconnect', () => {
      io.to(roomId).emit('userLeft', userId);
      console.log('A user disconnected');
    });
  });

// Define a simple route
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
