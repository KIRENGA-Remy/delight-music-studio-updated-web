const bcrypt = require('bcryptjs');
const db      = require('../config/db');

// GET own profile
exports.getProfile = async (req, res) => {
  try {
    const [[user]] = await db.query(
      'SELECT id, fullname, email, phone, role, client_type, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE profile (name, bio, client_type)
exports.updateProfile = async (req, res) => {
  const { fullname, bio, client_type, phone } = req.body;
  const avatar_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    const fields = [], values = [];
    if (fullname)              { fields.push('fullname = ?');    values.push(fullname); }
    if (bio !== undefined)     { fields.push('bio = ?');         values.push(bio); }
    if (client_type)           { fields.push('client_type = ?'); values.push(client_type); }
    if (phone)                 { fields.push('phone = ?');       values.push(phone); }
    if (avatar_url)            { fields.push('avatar_url = ?');  values.push(avatar_url); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.user.id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    // Return fresh user
    const [[updated]] = await db.query(
      'SELECT id, fullname, email, phone, role, client_type, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Phone already in use' });
    return res.status(500).json({ error: err.message });
  }
};

// CHANGE password
exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Both current and new password required' });
  if (new_password.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const [[user]] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!user.password) return res.status(400).json({ error: 'No password set — use OTP login' });
    const match = await bcrypt.compare(current_password, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
