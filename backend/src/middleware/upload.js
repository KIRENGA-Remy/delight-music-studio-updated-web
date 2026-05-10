const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Detect resource type from mimetype / extension
function getResourceType(mimetype, originalname) {
  if (!mimetype && !originalname) return 'auto';
  const ext = (originalname || '').split('.').pop().toLowerCase();
  if (mimetype?.startsWith('video/') || ['mp4','webm','mov','avi','mkv'].includes(ext)) return 'video';
  if (mimetype?.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'image';
  // audio and documents → use 'raw' so Cloudinary stores them as-is
  return 'raw';
}

function getFolder(mimetype, originalname) {
  const ext = (originalname || '').split('.').pop().toLowerCase();
  if (mimetype?.startsWith('audio/') || ['mp3','wav','ogg','aac','flac','m4a'].includes(ext)) return 'delight/audio';
  if (mimetype?.startsWith('video/') || ['mp4','webm','mov','avi','mkv'].includes(ext)) return 'delight/video';
  if (mimetype?.startsWith('image/') || ['jpg','jpeg','png','gif','webp'].includes(ext)) return 'delight/images';
  return 'delight/documents';
}

// Cloudinary storage engine for multer
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const resourceType = getResourceType(file.mimetype, file.originalname);
    const folder       = getFolder(file.mimetype, file.originalname);
    const publicId     = `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_')}`;
    return {
      folder,
      resource_type: resourceType,
      public_id:     publicId,
      // For audio: allow_formats to ensure MP3 passes through
      ...(resourceType === 'raw' ? { format: undefined } : {}),
    };
  },
});

// Fallback: local disk storage (for dev / when Cloudinary not configured)
const localStorageDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localStorageDir)) fs.mkdirSync(localStorageDir, { recursive: true });

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, localStorageDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

// Choose storage based on environment
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const upload = multer({
  storage: useCloudinary ? cloudinaryStorage : localStorage,
  limits:  { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

function getFileUrl(file) {
  if (!file) return null;
  if (file.path && file.path.startsWith('http')) return file.path; // Cloudinary
  return `/uploads/${file.filename}`;                              // local
}

module.exports = { upload, getFileUrl, cloudinary, useCloudinary };
