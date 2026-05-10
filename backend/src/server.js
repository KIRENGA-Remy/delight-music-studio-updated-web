require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Ensure local uploads dir exists (used when Cloudinary not configured)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// CORS
app.use(cors({
  origin: '*',
  credentials: true,
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local uploads (fallback when Cloudinary not configured)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Accept-Ranges', 'bytes');
  next();
}, express.static(uploadsDir));

// Email: gitoliremy@gmail.com    Password: SecurePass@123
// hakizimanaroger@gmail.com   Password: SecurePass@123   Producer
// gitoliremyclaudien5@gmail.com   SecurePass@123   CLIENT=Artist
// API routes
app.use('/api', require('./routes/index'));

app.get('/', (req, res) => res.json({
  message: '✅ Delight Music Studio API',
  storage: process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary' : 'Local disk',
}));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const storage = process.env.CLOUDINARY_CLOUD_NAME ? ' Cloudinary' : ' Local disk';
  console.log(`✅ Delight Music Studio API running on port ${PORT}`);
  console.log(`📁 File storage: ${storage}`);
});
