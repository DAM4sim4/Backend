const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const videoSessionRoutes = require("./routes/videoSessionRoutes");
const http = require("http");
const socketIo = require("socket.io");
const bonjour = require("bonjour")();

// Load environment variables
dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in the .env file.");
  process.exit(1);
}

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // Adjust for production
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(morgan("dev"));
app.use(cors());

// Database Connection
(async () => {
  try {
    await connectDB();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
})();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/video-sessions", videoSessionRoutes);

// WebSocket Setup
io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on("joinCall", ({ roomId, userId }) => {
    if (!roomId || !userId) {
      console.error("Invalid joinCall request", { roomId, userId });
      socket.emit("error", "Invalid joinCall request");
      return;
    }
    console.log(`${userId} joined room ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit("userJoined", { userId, roomId });
  });

  socket.on("offer", ({ roomId, offer, userId }) => {
    if (!roomId || !offer || !userId) {
      console.error("Invalid offer", { roomId, offer, userId });
      socket.emit("error", "Invalid offer");
      return;
    }
    console.log(`Offer from ${userId} in room ${roomId}`);
    socket.to(roomId).emit("offer", { offer, userId });
  });

  socket.on("answer", ({ roomId, answer, userId }) => {
    if (!roomId || !answer || !userId) {
      console.error("Invalid answer", { roomId, answer, userId });
      socket.emit("error", "Invalid answer");
      return;
    }
    console.log(`Answer from ${userId} in room ${roomId}`);
    socket.to(roomId).emit("answer", { answer, userId });
  });

  socket.on("candidate", ({ roomId, candidate, userId }) => {
    if (!roomId || !candidate || !userId) {
      console.error("Invalid candidate", { roomId, candidate, userId });
      socket.emit("error", "Invalid candidate");
      return;
    }
    console.log(`Candidate from ${userId} in room ${roomId}`);
    socket.to(roomId).emit("candidate", { candidate, userId });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

// Health Check Route
app.get("/", (req, res) => res.status(200).send("API is running..."));

// Start Server
const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  bonjour.publish({ name: "StudySync Server", type: "http", port: PORT });
});