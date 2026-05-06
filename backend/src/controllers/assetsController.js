const db = require('../config/db');

// ── GET assets for a project (role-aware) ─────────────────────
// manager sees all; producer sees only their own; client sees non-deleted only
exports.getProjectAssets = async (req, res) => {
  const { projectId } = req.params;
  const { role, id: userId } = req.user;
  try {
    let query, params;
    if (role === 'manager') {
      // manager sees ALL including soft-deleted
      query = `
        SELECT a.*, u.fullname as uploader_name, u.role as uploader_role,
          du.fullname as deleted_by_name
        FROM assets a
        JOIN users u ON a.uploaded_by = u.id
        LEFT JOIN users du ON a.deleted_by = du.id
        WHERE a.project_id = ?
        ORDER BY a.is_deleted ASC, a.uploaded_at DESC
      `;
      params = [projectId];
    } else if (role === 'producer') {
      // producer sees all non-deleted assets for their projects + their own deleted
      query = `
        SELECT a.*, u.fullname as uploader_name, u.role as uploader_role,
          du.fullname as deleted_by_name
        FROM assets a
        JOIN users u ON a.uploaded_by = u.id
        LEFT JOIN users du ON a.deleted_by = du.id
        WHERE a.project_id = ?
          AND (a.is_deleted = FALSE OR a.uploaded_by = ?)
        ORDER BY a.uploaded_at DESC
      `;
      params = [projectId, userId];
    } else {
      // client sees only active
      query = `
        SELECT a.*, u.fullname as uploader_name, u.role as uploader_role
        FROM assets a
        JOIN users u ON a.uploaded_by = u.id
        WHERE a.project_id = ? AND a.is_deleted = FALSE
        ORDER BY a.uploaded_at DESC
      `;
      params = [projectId];
    }
    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── UPDATE asset metadata ──────────────────────────────────────
exports.updateAsset = async (req, res) => {
  const { id } = req.params;
  const { original_name, file_type } = req.body;
  const { role, id: userId } = req.user;
  try {
    // producers can only edit their own; managers can edit any
    const where = role === 'manager' ? 'WHERE id = ?' : 'WHERE id = ? AND uploaded_by = ?';
    const params = role === 'manager' ? [original_name, file_type, id] : [original_name, file_type, id, userId];
    const [result] = await db.query(
      `UPDATE assets SET original_name = ?, file_type = ? ${where}`,
      params
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Asset not found or access denied' });
    return res.json({ message: 'Asset updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── SOFT DELETE asset ──────────────────────────────────────────
exports.softDeleteAsset = async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req.user;
  try {
    const where = role === 'manager' ? 'WHERE id = ? AND is_deleted = FALSE'
      : 'WHERE id = ? AND uploaded_by = ? AND is_deleted = FALSE';
    const params = role === 'manager' ? [userId, id] : [userId, id, userId];
    const [result] = await db.query(
      `UPDATE assets SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? ${where}`,
      params
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Asset not found or already deleted' });
    return res.json({ message: 'Asset deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── RESTORE (rollback) — manager only ─────────────────────────
exports.restoreAsset = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE assets SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id = ? AND is_deleted = TRUE',
      [id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Asset not found or not deleted' });
    return res.json({ message: 'Asset restored' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── HARD DELETE — manager only ────────────────────────────────
exports.hardDeleteAsset = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM assets WHERE id = ?', [id]);
    return res.json({ message: 'Asset permanently deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
