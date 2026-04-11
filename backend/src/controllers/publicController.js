const db = require('../config/db');

exports.getTestimonials = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM testimonials WHERE is_approved = TRUE ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getCompletedProjects = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.title, p.description, p.created_at
      FROM projects p WHERE p.status = 'completed'
      ORDER BY p.created_at DESC LIMIT 20
    `);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.submitPartnerRequest = async (req, res) => {
  const { fullname, email, phone, message } = req.body;
  if (!fullname || !email) return res.status(400).json({ error: 'fullname and email are required' });
  try {
    await db.query('INSERT INTO partner_requests (fullname, email, phone, message) VALUES (?,?,?,?)',
      [fullname, email, phone || null, message || null]);
    return res.status(201).json({ message: 'Request submitted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.sendNotification = async (req, res) => {
  const { receiver_id, message, type, file_url } = req.body;
  try {
    await db.query('INSERT INTO notifications (sender_id, receiver_id, message, type, file_url) VALUES (?,?,?,?,?)',
      [req.user.id, receiver_id, message, type || 'question', file_url || null]);
    return res.status(201).json({ message: 'Notification sent' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
      [req.params.id, req.user.id]);
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
