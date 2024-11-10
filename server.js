const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

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

// Define a simple route
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
