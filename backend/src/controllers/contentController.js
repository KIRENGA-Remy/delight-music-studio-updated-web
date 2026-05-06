const db = require('../config/db');

// ── GET all public content (sections) ─────────────────────────
exports.getPublicContent = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pc.*, u.fullname as created_by_name
      FROM public_content pc
      JOIN users u ON pc.created_by = u.id
      WHERE pc.is_active = TRUE
      ORDER BY pc.section, pc.sort_order ASC
    `);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET all content including inactive (manager only) ─────────
exports.getAllContent = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pc.*, u.fullname as created_by_name
      FROM public_content pc
      JOIN users u ON pc.created_by = u.id
      ORDER BY pc.section, pc.sort_order ASC
    `);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── CREATE content item ────────────────────────────────────────
exports.createContent = async (req, res) => {
  const { section, title, subtitle, body, image_url, video_url, sort_order } = req.body;
  const file_url = req.file ? `/uploads/${req.file.filename}` : (image_url || null);
  if (!section) return res.status(400).json({ error: 'section is required' });
  try {
    const [result] = await db.query(`
      INSERT INTO public_content (section, title, subtitle, body, image_url, video_url, sort_order, created_by)
      VALUES (?,?,?,?,?,?,?,?)
    `, [section, title || null, subtitle || null, body || null, file_url, video_url || null, sort_order || 0, req.user.id]);
    return res.status(201).json({ message: 'Content created', id: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── UPDATE content item ────────────────────────────────────────
exports.updateContent = async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, body, image_url, video_url, sort_order, is_active } = req.body;
  const file_url = req.file ? `/uploads/${req.file.filename}` : (image_url || undefined);
  try {
    const fields = [];
    const values = [];
    if (title !== undefined)      { fields.push('title = ?');      values.push(title); }
    if (subtitle !== undefined)   { fields.push('subtitle = ?');   values.push(subtitle); }
    if (body !== undefined)       { fields.push('body = ?');       values.push(body); }
    if (file_url !== undefined)   { fields.push('image_url = ?');  values.push(file_url); }
    if (video_url !== undefined)  { fields.push('video_url = ?');  values.push(video_url); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
    if (is_active !== undefined)  { fields.push('is_active = ?');  values.push(is_active); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    await db.query(`UPDATE public_content SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'Content updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── DELETE content item ────────────────────────────────────────
exports.deleteContent = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM public_content WHERE id = ?', [id]);
    return res.json({ message: 'Content deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── TOGGLE active status ───────────────────────────────────────
exports.toggleActive = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE public_content SET is_active = NOT is_active WHERE id = ?', [id]);
    return res.json({ message: 'Toggled' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
