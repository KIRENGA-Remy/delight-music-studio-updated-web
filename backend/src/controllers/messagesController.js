const db = require('../config/db');

// ── GET inbox (received messages) ──────────────────────────────
exports.getInbox = async (req, res) => {
  const { id: userId } = req.user;
  try {
    const [rows] = await db.query(`
      SELECT m.*,
        s.fullname as sender_name, s.role as sender_role,
        r.fullname as receiver_name, r.role as receiver_role,
        (SELECT COUNT(*) FROM messages rep WHERE rep.parent_id = m.id) as reply_count
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.receiver_id = ? AND m.deleted_by_receiver = FALSE AND m.parent_id IS NULL
      ORDER BY m.created_at DESC
    `, [userId]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET sent messages ──────────────────────────────────────────
exports.getSent = async (req, res) => {
  const { id: userId } = req.user;
  try {
    const [rows] = await db.query(`
      SELECT m.*,
        s.fullname as sender_name, s.role as sender_role,
        r.fullname as receiver_name, r.role as receiver_role,
        (SELECT COUNT(*) FROM messages rep WHERE rep.parent_id = m.id) as reply_count
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.sender_id = ? AND m.deleted_by_sender = FALSE AND m.parent_id IS NULL
      ORDER BY m.created_at DESC
    `, [userId]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET thread (message + its replies) ────────────────────────
exports.getThread = async (req, res) => {
  const { id: userId } = req.user;
  const { id: msgId } = req.params;
  try {
    // get the root message
    const [[root]] = await db.query(`
      SELECT m.*, s.fullname as sender_name, s.role as sender_role,
        r.fullname as receiver_name, r.role as receiver_role
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.id = ? AND (m.sender_id = ? OR m.receiver_id = ?)
    `, [msgId, userId, userId]);
    if (!root) return res.status(404).json({ error: 'Message not found' });

    // get replies
    const [replies] = await db.query(`
      SELECT m.*, s.fullname as sender_name, s.role as sender_role,
        r.fullname as receiver_name, r.role as receiver_role
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.parent_id = ?
      ORDER BY m.created_at ASC
    `, [msgId]);

    // mark as read if receiver
    if (root.receiver_id === userId && !root.is_read) {
      await db.query('UPDATE messages SET is_read = TRUE WHERE id = ?', [msgId]);
    }

    return res.json({ message: root, replies });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── SEND a message ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  const { receiver_id, subject, body, parent_id } = req.body;
  const { id: senderId } = req.user;
  if (!receiver_id || !body) return res.status(400).json({ error: 'receiver_id and body required' });
  try {
    // verify receiver exists
    const [[receiver]] = await db.query('SELECT id, fullname, role FROM users WHERE id = ?', [receiver_id]);
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, subject, body, parent_id) VALUES (?,?,?,?,?)',
      [senderId, receiver_id, subject || null, body, parent_id || null]
    );
    return res.status(201).json({ message: 'Message sent', id: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── MARK message as read ───────────────────────────────────────
exports.markRead = async (req, res) => {
  const { id: userId } = req.user;
  const { id: msgId } = req.params;
  try {
    await db.query('UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?', [msgId, userId]);
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── SOFT DELETE for sender/receiver ───────────────────────────
exports.deleteMessage = async (req, res) => {
  const { id: userId } = req.user;
  const { id: msgId } = req.params;
  try {
    const [[msg]] = await db.query('SELECT * FROM messages WHERE id = ?', [msgId]);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    if (msg.sender_id === userId) {
      await db.query('UPDATE messages SET deleted_by_sender = TRUE WHERE id = ?', [msgId]);
    } else if (msg.receiver_id === userId) {
      await db.query('UPDATE messages SET deleted_by_receiver = TRUE WHERE id = ?', [msgId]);
    } else {
      return res.status(403).json({ error: 'Not your message' });
    }

    return res.json({ message: 'Message deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET all users the current user can message ─────────────────
exports.getContacts = async (req, res) => {
  const { id: userId } = req.user;
  try {
    // Return all users except self
    const [rows] = await db.query(
      "SELECT id, fullname, role, client_type FROM users WHERE id != ? ORDER BY role, fullname",
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET unread count ───────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  const { id: userId } = req.user;
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE AND deleted_by_receiver = FALSE',
      [userId]
    );
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
