require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// CORS — allow all origins (including audio/video cross-origin playback)
app.use(cors({
  origin: '*',
  credentials: true,
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with proper headers for audio/video streaming
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Accept-Ranges', 'bytes');
  next();
}, express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
    const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    if (audioExts.includes(ext)) res.setHeader('Content-Type', 'audio/' + ext.slice(1).replace('mp3','mpeg'));
    else if (videoExts.includes(ext)) res.setHeader('Content-Type', 'video/' + ext.slice(1).replace('mov','quicktime'));
    else if (imageExts.includes(ext)) {
      const imgType = ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : ext.slice(1);
      res.setHeader('Content-Type', 'image/' + imgType);
    }
  },
}));

// Email: gitoliremy@gmail.com    Password: SecurePass@123
// hakizimanaroger@gmail.com   Password: SecurePass@123   Producer
// gitoliremyclaudien5@gmail.com   SecurePass@123   CLIENT=Artist
app.use('/api', require('./routes/index'));
app.get('/', (req, res) => res.json({ message: '✅ Delight Music API running' }));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Delight Music Studio API → https://delightmusicstudio.onrender.com`);
});
