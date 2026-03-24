const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Security Middlewares
app.use(helmet()); // Set secure HTTP headers

// CORS specific config for deployment
app.use(cors({
    origin: process.env.CLIENT_URL || '*', // Set restrictive origin for frontend in PROD
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// API Rate Limiting to prevent spam/bots floods
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100, // limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Built-in body parsing
app.use(express.json({ limit: '10kb' })); // Body parser limit to block huge payloads
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// General Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
