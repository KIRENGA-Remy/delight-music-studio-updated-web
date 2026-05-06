const db = require('../config/db');

// Submit or update a rating (client or manager)
exports.submitRating = async (req, res) => {
  const { project_id, score, comment } = req.body;
  const { id: userId, role } = req.user;
  if (!project_id || !score || score < 1 || score > 5)
    return res.status(400).json({ error: 'project_id and score (1-5) are required' });
  if (!['client', 'manager'].includes(role))
    return res.status(403).json({ error: 'Only clients and managers can rate' });
  try {
    // Upsert
    await db.query(`
      INSERT INTO ratings (project_id, rated_by, rater_role, score, comment)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE score = VALUES(score), comment = VALUES(comment)
    `, [project_id, userId, role, score, comment || null]);
    return res.status(201).json({ message: 'Rating submitted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get ratings for a project
exports.getProjectRatings = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.fullname as rater_name
      FROM ratings r JOIN users u ON r.rated_by = u.id
      WHERE r.project_id = ?
      ORDER BY r.created_at DESC
    `, [projectId]);
    const avg = rows.length
      ? (rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1)
      : null;
    return res.json({ ratings: rows, average: avg, count: rows.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all ratings (manager view — across all projects)
exports.getAllRatings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.fullname as rater_name, p.title as project_title,
        pu.fullname as producer_name
      FROM ratings r
      JOIN users u ON r.rated_by = u.id
      JOIN projects p ON r.project_id = p.id
      LEFT JOIN users pu ON p.producer_id = pu.id
      ORDER BY r.created_at DESC
    `);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete a rating
exports.deleteRating = async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;
  try {
    const where = role === 'manager' ? 'WHERE id = ?' : 'WHERE id = ? AND rated_by = ?';
    const params = role === 'manager' ? [id] : [id, userId];
    const [result] = await db.query(`DELETE FROM ratings ${where}`, params);
    if (!result.affectedRows) return res.status(404).json({ error: 'Rating not found' });
    return res.json({ message: 'Rating deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
