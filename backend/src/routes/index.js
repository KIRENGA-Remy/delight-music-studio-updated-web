const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');
const auth     = require('../controllers/authController');
const manager  = require('../controllers/managerController');
const producer = require('../controllers/producerController');
const client   = require('../controllers/clientController');
const pub      = require('../controllers/publicController');
const assets   = require('../controllers/assetsController');
const ratings  = require('../controllers/ratingsController');
const messages = require('../controllers/messagesController');
const content  = require('../controllers/contentController');

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ── AUTH ──────────────────────────────────────────────────────
router.post('/auth/login',          auth.login);
router.post('/auth/register',      auth.register);
router.post('/auth/otp-verify',     auth.verifyOTP);
router.post('/auth/forgot-password',auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);

// ── PUBLIC ────────────────────────────────────────────────────
router.get( '/public/testimonials',        pub.getTestimonials);
router.get( '/public/projects-completed',  pub.getCompletedProjects);
router.post('/public/partner-request',     pub.submitPartnerRequest);
router.get( '/public/content',             content.getPublicContent);

// ── NOTIFICATIONS (authenticated) ─────────────────────────────
router.post('/notifications/send',     verifyToken, pub.sendNotification);
router.put( '/notifications/:id/read', verifyToken, pub.markNotificationRead);

// ── MESSAGES (all authenticated users) ────────────────────────
const auth_any = [verifyToken];
router.get( '/messages/inbox',        ...auth_any, messages.getInbox);
router.get( '/messages/sent',         ...auth_any, messages.getSent);
router.get( '/messages/contacts',     ...auth_any, messages.getContacts);
router.get( '/messages/unread-count', ...auth_any, messages.getUnreadCount);
router.get( '/messages/:id',          ...auth_any, messages.getThread);
router.post('/messages',              ...auth_any, messages.sendMessage);
router.put( '/messages/:id/read',     ...auth_any, messages.markRead);
router.delete('/messages/:id',        ...auth_any, messages.deleteMessage);

// ── ASSETS (shared, role-checked inside) ──────────────────────
router.get(   '/assets/project/:projectId', verifyToken, assets.getProjectAssets);
router.put(   '/assets/:id',               verifyToken, assets.updateAsset);
router.delete('/assets/:id',               verifyToken, assets.softDeleteAsset);
router.put(   '/assets/:id/restore',       verifyToken, requireRole('manager'), assets.restoreAsset);
router.delete('/assets/:id/hard',          verifyToken, requireRole('manager'), assets.hardDeleteAsset);

// ── RATINGS (client + manager) ────────────────────────────────
const cli_mgr = [verifyToken, requireRole('client', 'manager')];
router.post('/ratings',                  ...cli_mgr, ratings.submitRating);
router.get( '/ratings/project/:projectId', verifyToken, ratings.getProjectRatings);
router.delete('/ratings/:id',            ...cli_mgr, ratings.deleteRating);

// ── MANAGER ───────────────────────────────────────────────────
const mgr = [verifyToken, requireRole('manager')];
router.post('/manager/create-user',              ...mgr, manager.createUser);
router.post('/manager/resend-otp',               ...mgr, manager.resendOTP);
router.get( '/manager/dashboard',               ...mgr, manager.getDashboard);
router.get( '/manager/notifications',           ...mgr, manager.getNotifications);
router.get( '/manager/partner-requests',        ...mgr, manager.getPartnerRequests);
router.put( '/manager/partner-requests/:id/status', ...mgr, manager.updatePartnerStatus);
router.post('/manager/testimonials',            ...mgr, manager.addTestimonial);
router.get( '/manager/users',                   ...mgr, manager.getAllUsers);
router.post('/manager/projects',                ...mgr, manager.createProject);
router.put( '/manager/projects/:id',            ...mgr, manager.updateProject);
router.delete('/manager/projects/:id',          ...mgr, manager.deleteProject);
router.post('/manager/certificates',            ...mgr, upload.single('certificate'), manager.uploadCertificate);
router.get( '/manager/ratings',                 ...mgr, ratings.getAllRatings);

// ── MANAGER PUBLIC CONTENT CMS ────────────────────────────────
router.get(   '/manager/content',         ...mgr, content.getAllContent);
router.post(  '/manager/content',         ...mgr, upload.single('image'), content.createContent);
router.put(   '/manager/content/:id',     ...mgr, upload.single('image'), content.updateContent);
router.delete('/manager/content/:id',     ...mgr, content.deleteContent);
router.put(   '/manager/content/:id/toggle', ...mgr, content.toggleActive);

// ── PRODUCER ──────────────────────────────────────────────────
const prd = [verifyToken, requireRole('producer')];
router.get( '/producer/tasks',            ...prd, producer.getTasks);
router.put( '/producer/tasks/:id/status', ...prd, producer.updateTaskStatus);
router.post('/producer/upload-asset',     ...prd, upload.single('file'), producer.uploadAsset);
router.get( '/producer/notifications',    ...prd, producer.getNotifications);
router.get( '/producer/earnings',         ...prd, producer.getEarnings);

// ── CLIENT ────────────────────────────────────────────────────
const cli = [verifyToken, requireRole('client')];
router.get('/client/projects',              ...cli, client.getProjects);
router.get('/client/assets/:projectId',     ...cli, client.getAssets);
router.get('/client/notifications',         ...cli, client.getNotifications);
router.get('/client/certificates',          ...cli, client.getCertificate);

module.exports = router;
