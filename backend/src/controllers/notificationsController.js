const db = require('../config/db');

// GET all notifications for current user
exports.getMyNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT n.*, u.fullname as sender_name, u.role as sender_role,
        u.avatar_url as sender_avatar
      FROM notifications n
      JOIN users u ON n.sender_id = u.id
      WHERE n.receiver_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE receiver_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// SEND notification (manager can send to anyone; others can notify manager)
exports.sendNotification = async (req, res) => {
  const { receiver_id, message, type } = req.body;
  if (!receiver_id || !message) return res.status(400).json({ error: 'receiver_id and message required' });
  try {
    const [[receiver]] = await db.query('SELECT id FROM users WHERE id = ?', [receiver_id]);
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const [result] = await db.query(
      'INSERT INTO notifications (sender_id, receiver_id, message, type) VALUES (?,?,?,?)',
      [req.user.id, receiver_id, message, type || 'task_update']
    );
    return res.status(201).json({ message: 'Notification sent', id: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// MARK one as read
exports.markRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// MARK ALL as read
exports.markAllRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE receiver_id = ?',
      [req.user.id]
    );
    return res.json({ message: 'All marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE one notification
exports.deleteNotification = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE id = ? AND receiver_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE ALL notifications for user
exports.deleteAllNotifications = async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE receiver_id = ?', [req.user.id]);
    return res.json({ message: 'All notifications cleared' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Manager: broadcast to all users of a role
exports.broadcastNotification = async (req, res) => {
  const { role, message, type } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  try {
    let query = 'SELECT id FROM users WHERE id != ?';
    const params = [req.user.id];
    if (role) { query += ' AND role = ?'; params.push(role); }

    const [users] = await db.query(query, params);
    if (!users.length) return res.status(404).json({ error: 'No users found' });

    const values = users.map(u => [req.user.id, u.id, message, type || 'task_update']);
    await db.query(
      'INSERT INTO notifications (sender_id, receiver_id, message, type) VALUES ?',
      [values]
    );
    return res.status(201).json({ message: `Broadcast sent to ${users.length} users` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
