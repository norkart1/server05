

const express = require('express');
const app = express();
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const Pusher = require('pusher');
const dotenv = require('dotenv');
const resultRoute = require('./routes/result');
const { errorHandle } = require('./middlewares/errorHandle');
const connectDb = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

app.set('trust proxy', true);


// Connect to Database
connectDb();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Middleware setup
app.use(cors({
  origin: ['https://artsfest05.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(compression());
app.use(helmet());
app.use(morgan('dev'));
app.use(limiter);
app.use(express.json());

// Attach Pusher to request object
app.use((req, res, next) => {
  req.pusher = pusher;
  next();
});

// API Routes
app.use('/api', resultRoute);

// Root Route (Fix for 404 at '/')
app.get('/', (req, res) => {
  res.send('Arts Festival API is running');
});

// Favicon Handler (optional)
app.get('/favicon.ico', (req, res) => res.status(204));

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({ message: "This page does not exist" });
});

// Central error handler
app.use(errorHandle);

// Start server (only in non-production environments)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3006;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;