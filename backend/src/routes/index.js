const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');
const auth     = require('../controllers/authController');
const manager  = require('../controllers/managerController');
const producer = require('../controllers/producerController');
const client   = require('../controllers/clientController');
const pub      = require('../controllers/publicController');

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

// ── NOTIFICATIONS (authenticated) ─────────────────────────────
router.post('/notifications/send',         verifyToken, pub.sendNotification);
router.put( '/notifications/:id/read',     verifyToken, pub.markNotificationRead);

// ── MANAGER ───────────────────────────────────────────────────
const mgr = [verifyToken, requireRole('manager')];
router.post('/manager/create-user',             ...mgr, manager.createUser);
router.post('/manager/resend-otp',              ...mgr, manager.resendOTP);
router.get( '/manager/dashboard',              ...mgr, manager.getDashboard);
router.get( '/manager/notifications',          ...mgr, manager.getNotifications);
router.get( '/manager/partner-requests',       ...mgr, manager.getPartnerRequests);
router.put( '/manager/partner-requests/:id/status', ...mgr, manager.updatePartnerStatus);
router.post('/manager/testimonials',           ...mgr, manager.addTestimonial);
router.get( '/manager/users',                  ...mgr, manager.getAllUsers);
router.post('/manager/projects',               ...mgr, manager.createProject);
router.post('/manager/certificates',           ...mgr, upload.single('certificate'), manager.uploadCertificate);

// ── PRODUCER ──────────────────────────────────────────────────
const prd = [verifyToken, requireRole('producer')];
router.get( '/producer/tasks',         ...prd, producer.getTasks);
router.put( '/producer/tasks/:id/status', ...prd, producer.updateTaskStatus);
router.post('/producer/upload-asset',  ...prd, upload.single('file'), producer.uploadAsset);
router.get( '/producer/notifications', ...prd, producer.getNotifications);
router.get( '/producer/earnings',      ...prd, producer.getEarnings);

// ── CLIENT ────────────────────────────────────────────────────
const cli = [verifyToken, requireRole('client')];
router.get('/client/projects',              ...cli, client.getProjects);
router.get('/client/assets/:projectId',     ...cli, client.getAssets);
router.get('/client/notifications',         ...cli, client.getNotifications);
router.get('/client/certificates',          ...cli, client.getCertificate);

module.exports = router;
