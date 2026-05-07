const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { verifyToken, requireRole } = require('../middleware/auth');

const auth          = require('../controllers/authController');
const manager       = require('../controllers/managerController');
const producer      = require('../controllers/producerController');
const client        = require('../controllers/clientController');
const pub           = require('../controllers/publicController');
const assets        = require('../controllers/assetsController');
const ratings       = require('../controllers/ratingsController');
const messages      = require('../controllers/messagesController');
const content       = require('../controllers/contentController');
const profile       = require('../controllers/profileController');
const notifications = require('../controllers/notificationsController');

const router = express.Router();

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ── AUTH ──────────────────────────────────────────────────────
router.post('/auth/login',           auth.login);
router.post('/auth/register',        auth.register);
router.post('/auth/otp-verify',      auth.verifyOTP);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password',  auth.resetPassword);

// ── PUBLIC ────────────────────────────────────────────────────
router.get( '/public/testimonials',       pub.getTestimonials);
router.get( '/public/projects-completed', pub.getCompletedProjects);
router.post('/public/partner-request',    pub.submitPartnerRequest);
router.get( '/public/content',            content.getPublicContent);

// ── PROFILE (any authenticated user) ─────────────────────────
const authAny = [verifyToken];
router.get( '/profile',          ...authAny, profile.getProfile);
router.put( '/profile',          ...authAny, upload.single('avatar'), profile.updateProfile);
router.put( '/profile/password', ...authAny, profile.changePassword);

// ── NOTIFICATIONS (any authenticated user) ────────────────────
router.get(   '/notifications',           ...authAny, notifications.getMyNotifications);
router.get(   '/notifications/unread-count', ...authAny, notifications.getUnreadCount);
router.post(  '/notifications/send',      ...authAny, notifications.sendNotification);
router.post(  '/notifications/broadcast', verifyToken, requireRole('manager'), notifications.broadcastNotification);
router.put(   '/notifications/:id/read',  ...authAny, notifications.markRead);
router.put(   '/notifications/read-all',  ...authAny, notifications.markAllRead);
router.delete('/notifications/all',       ...authAny, notifications.deleteAllNotifications);
router.delete('/notifications/:id',       ...authAny, notifications.deleteNotification);

// ── MESSAGES (any authenticated user) ─────────────────────────
router.get(   '/messages/inbox',         ...authAny, messages.getInbox);
router.get(   '/messages/sent',          ...authAny, messages.getSent);
router.get(   '/messages/contacts',      ...authAny, messages.getContacts);
router.get(   '/messages/unread-count',  ...authAny, messages.getUnreadCount);
router.get(   '/messages/:id',           ...authAny, messages.getThread);
router.post(  '/messages',               ...authAny, messages.sendMessage);
router.put(   '/messages/:id/read',      ...authAny, messages.markRead);
router.delete('/messages/:id',           ...authAny, messages.deleteMessage);

// ── ASSETS (role-checked inside controller) ───────────────────
router.get(   '/assets/project/:projectId', ...authAny, assets.getProjectAssets);
router.put(   '/assets/:id',                ...authAny, assets.updateAsset);
router.delete('/assets/:id',                ...authAny, assets.softDeleteAsset);
router.put(   '/assets/:id/restore',        verifyToken, requireRole('manager'), assets.restoreAsset);
router.delete('/assets/:id/hard',           verifyToken, requireRole('manager'), assets.hardDeleteAsset);

// ── RATINGS ───────────────────────────────────────────────────
const cliMgr = [verifyToken, requireRole('client', 'manager')];
router.post(  '/ratings',                   ...cliMgr, ratings.submitRating);
router.get(   '/ratings/project/:projectId',...authAny, ratings.getProjectRatings);
router.delete('/ratings/:id',               ...cliMgr, ratings.deleteRating);

// ── MANAGER ───────────────────────────────────────────────────
const mgr = [verifyToken, requireRole('manager')];
router.post('/manager/create-user',               ...mgr, manager.createUser);
router.post('/manager/resend-otp',                ...mgr, manager.resendOTP);
router.get( '/manager/dashboard',                 ...mgr, manager.getDashboard);
router.get( '/manager/users',                     ...mgr, manager.getAllUsers);
router.get( '/manager/partner-requests',          ...mgr, manager.getPartnerRequests);
router.put( '/manager/partner-requests/:id/status',...mgr, manager.updatePartnerStatus);
router.post('/manager/testimonials',              ...mgr, manager.addTestimonial);
router.post('/manager/projects',                  ...mgr, manager.createProject);
router.put( '/manager/projects/:id',              ...mgr, manager.updateProject);
router.delete('/manager/projects/:id',            ...mgr, manager.deleteProject);
router.post('/manager/certificates',              ...mgr, upload.single('certificate'), manager.uploadCertificate);
router.get( '/manager/ratings',                   ...mgr, ratings.getAllRatings);
// Content CMS
router.get(  '/manager/content',            ...mgr, content.getAllContent);
router.post( '/manager/content',            ...mgr, upload.single('image'), content.createContent);
router.put(  '/manager/content/:id',        ...mgr, upload.single('image'), content.updateContent);
router.delete('/manager/content/:id',       ...mgr, content.deleteContent);
router.put(  '/manager/content/:id/toggle', ...mgr, content.toggleActive);

// ── PRODUCER ──────────────────────────────────────────────────
const prd = [verifyToken, requireRole('producer')];
router.get('/producer/tasks',             ...prd, producer.getTasks);
router.put('/producer/tasks/:id/status',  ...prd, producer.updateTaskStatus);
router.post('/producer/upload-asset',     ...prd, upload.single('file'), producer.uploadAsset);
router.get('/producer/earnings',          ...prd, producer.getEarnings);

// ── CLIENT ────────────────────────────────────────────────────
const cli = [verifyToken, requireRole('client')];
router.get('/client/projects',          ...cli, client.getProjects);
router.get('/client/assets/:projectId', ...cli, client.getAssets);
router.get('/client/certificates',      ...cli, client.getCertificate);

module.exports = router;
