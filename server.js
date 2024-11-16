const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');

dotenv.config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Connect to database
connectDB();

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);

// Define a simple route
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
