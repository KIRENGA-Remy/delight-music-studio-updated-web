const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateOTP = () => Math.floor(10000 + Math.random() * 90000).toString();

exports.login = async (req, res) => {
  const { email, phone, password } = req.body;
  if (!password || (!email && !phone))
    return res.status(400).json({ error: 'Credentials required' });
  try {
    const field = email ? 'email' : 'phone';
    const value = email || phone;
    const [rows] = await db.query(`SELECT * FROM users WHERE ${field} = ?`, [value]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    if (!user.password) return res.status(401).json({ error: 'Account not activated. Use OTP.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, role: user.role, fullname: user.fullname, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    return res.json({
      token,
      user: { id: user.id, fullname: user.fullname, email: user.email, phone: user.phone, role: user.role, client_type: user.client_type }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, phone, otp, password } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP required' });
  try {
    const field = email ? 'email' : 'phone';
    const value = email || phone;
    const [rows] = await db.query(`SELECT * FROM users WHERE ${field} = ?`, [value]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    if (user.otp_code !== otp) return res.status(401).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.otp_expires)) return res.status(401).json({ error: 'OTP expired' });
    const hashed = await bcrypt.hash(password || otp, 10);
    await db.query('UPDATE users SET password = ?, otp_code = NULL, otp_expires = NULL WHERE id = ?', [hashed, user.id]);
    const token = jwt.sign(
      { id: user.id, role: user.role, fullname: user.fullname, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    return res.json({
      message: 'Account activated',
      token,
      user: { id: user.id, fullname: user.fullname, email: user.email, phone: user.phone, role: user.role, client_type: user.client_type }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, phone } = req.body;
  try {
    const field = email ? 'email' : 'phone';
    const value = email || phone;
    const [rows] = await db.query(`SELECT id FROM users WHERE ${field} = ?`, [value]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const otp = generateOTP();
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await db.query('UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?', [otp, expires, rows[0].id]);
    console.log(`OTP for ${value}: ${otp}`);
    return res.json({ message: 'OTP sent', otp_preview: otp }); // remove otp_preview in production
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, phone, otp, newPassword } = req.body;
  try {
    const field = email ? 'email' : 'phone';
    const value = email || phone;
    const [rows] = await db.query(`SELECT * FROM users WHERE ${field} = ?`, [value]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    if (user.otp_code !== otp) return res.status(401).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.otp_expires)) return res.status(401).json({ error: 'OTP expired' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ?, otp_code = NULL, otp_expires = NULL WHERE id = ?', [hashed, user.id]);
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


exports.register = async (req, res) => {
  const { fullname, email, phone, password } = req.body;
  if (!fullname || !email || !phone || !password)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const [exists] = await db.query('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (exists.length) return res.status(409).json({ error: 'Email or phone already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const [result] = await db.query(
      'INSERT INTO users (fullname, email, phone, password, otp_code, otp_expires) VALUES (?, ?, ?, ?, ?, ?)',
      [fullname, email, phone, hashed, otp, expires]
    );
    console.log(`OTP for ${email || phone}: ${otp}`);
    return res.json({ message: 'Registration successful. Use OTP to activate.', userId: result.insertId, otp_preview: otp }); // remove otp_preview in production
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};