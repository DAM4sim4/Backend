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

// Store video call data (in-memory or using a DB)
let videoCalls = {};

// WebSocket setup
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
  
    // Event: Join a video call (this will trigger WebRTC signaling)
    socket.on('joinVideoCall', (videoCallId, userId) => {
        console.log(`${userId} joined video call ${videoCallId}`);
        socket.join(videoCallId); // Join the video call
        
        // If video call doesn't exist, create it
        if (!videoCalls[videoCallId]) {
            videoCalls[videoCallId] = { participants: [] };
        }

        // Add user to the video call
        videoCalls[videoCallId].participants.push(userId);
        io.to(videoCallId).emit('userJoined', userId); // Notify other participants
    });
  
    // Event: Send offer (SDP) for video call
    socket.on('offer', (videoCallId, offer, userId) => {
        console.log(`Offer from ${userId} to video call ${videoCallId}`);
        // Validate video call existence
        if (videoCalls[videoCallId]) {
            socket.to(videoCallId).emit('offer', offer, userId); // Send the offer to the video call
        } else {
            console.error(`Video call ${videoCallId} not found`);
        }
    });
  
    // Event: Send answer (SDP) for video call
    socket.on('answer', (videoCallId, answer, userId) => {
        console.log(`Answer from ${userId} to video call ${videoCallId}`);
        // Validate video call existence
        if (videoCalls[videoCallId]) {
            socket.to(videoCallId).emit('answer', answer, userId); // Send the answer to the video call
        } else {
            console.error(`Video call ${videoCallId} not found`);
        }
    });
  
    // Event: Send ICE Candidate for video call
    socket.on('candidate', (videoCallId, candidate, userId) => {
        console.log(`Candidate from ${userId} to video call ${videoCallId}`);
        // Validate video call existence
        if (videoCalls[videoCallId]) {
            socket.to(videoCallId).emit('candidate', candidate, userId); // Send the candidate to the video call
        } else {
            console.error(`Video call ${videoCallId} not found`);
        }
    });
  
    // Event: User disconnects from the video call
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);

        // Handle video call cleanup
        for (const [videoCallId, videoCall] of Object.entries(videoCalls)) {
            const index = videoCall.participants.indexOf(socket.id);
            if (index !== -1) {
                videoCall.participants.splice(index, 1); // Remove user from the video call
                io.to(videoCallId).emit('userLeft', socket.id); // Notify other participants

                // If no more participants in the video call, remove the video call from memory
                if (videoCall.participants.length === 0) {
                    delete videoCalls[videoCallId];
                }
                break;
            }
        }
    });
});

// Define a simple route
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 2000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
