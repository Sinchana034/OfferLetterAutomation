require('dotenv').config();
const { verifyGoogleSheetsConnection } = require('./utils/googleSheets');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const offerRoutes = require('./routes/offerRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const userRoutes = require('./routes/userRoutes');

connectDB();

verifyGoogleSheetsConnection();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://offerletterautomation.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, Render health checks)
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured production frontend
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Serve generated PDFs statically (e.g. so the candidate portal / dashboard
// can link directly to a letter). Swap for signed S3/Cloudinary URLs in prod.
app.use('/generated-pdfs', express.static(path.join(__dirname, 'generated-pdfs')));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
