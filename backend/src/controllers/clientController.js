const db = require('../config/db');

exports.getProjects = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, COALESCE(u.fullname,'Unassigned') as producer_name
      FROM projects p
      LEFT JOIN users u ON p.producer_id = u.id
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAssets = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, u.fullname as uploader_name
      FROM assets a JOIN users u ON a.uploaded_by = u.id
      WHERE a.project_id = ?
      ORDER BY a.uploaded_at DESC
    `, [req.params.projectId]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT n.*, u.fullname as sender_name
      FROM notifications n JOIN users u ON n.sender_id = u.id
      WHERE n.receiver_id = ? ORDER BY n.created_at DESC LIMIT 30
    `, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getCertificate = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM certificates WHERE user_id = ?', [req.user.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
