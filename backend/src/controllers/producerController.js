const db = require('../config/db');

exports.getTasks = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.fullname as client_name, wo.id as work_order_id,
        wo.status as work_status, wo.draft_url, wo.requirements
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN work_orders wo ON wo.project_id = p.id AND wo.producer_id = ?
      WHERE p.producer_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id, req.user.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { status, progress_percentage } = req.body;
  try {
    if (progress_percentage !== undefined) {
      await db.query(
        'UPDATE projects SET progress_percentage = ?, status = ? WHERE id = ? AND producer_id = ?',
        [progress_percentage, status || 'in_progress', req.params.id, req.user.id]
      );
    } else {
      await db.query(
        'UPDATE projects SET status = ? WHERE id = ? AND producer_id = ?',
        [status, req.params.id, req.user.id]
      );
    }
    await db.query(
      "UPDATE work_orders SET status = ? WHERE project_id = ? AND producer_id = ?",
      [status === 'completed' ? 'completed' : 'in_progress', req.params.id, req.user.id]
    );
    return res.json({ message: 'Task updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.uploadAsset = async (req, res) => {
  const { project_id, file_type } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Check multipart/form-data and file field name.' });
  }

  // Use helper attached by route middleware, or fall back
  const getUrl = req.getFileUrl || ((f) => f.path || `/uploads/${f.filename}`);
  const file_url = getUrl(req.file);

  // Store original filename for display
  const original_name = req.file.originalname || req.file.filename;

  try {
    const [result] = await db.query(
      'INSERT INTO assets (project_id, file_url, file_type, uploaded_by, original_name) VALUES (?,?,?,?,?)',
      [project_id, file_url, file_type || 'audio', req.user.id, original_name]
    );

    // Update work order draft URL
    await db.query(
      'UPDATE work_orders SET draft_url = ? WHERE project_id = ? AND producer_id = ?',
      [file_url, project_id, req.user.id]
    ).catch(() => {}); // Non-fatal if work_order doesn't exist

    return res.status(201).json({
      message: 'Asset uploaded successfully',
      file_url,
      original_name,
      id: result.insertId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.title, p.price, p.status, p.progress_percentage,
        u.fullname as client_name, p.created_at
      FROM projects p JOIN users u ON p.client_id = u.id
      WHERE p.producer_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    const total = rows.filter(r => r.status === 'completed')
      .reduce((s, r) => s + Number(r.price || 0), 0);
    return res.json({ earnings: rows, total_earned: total });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
