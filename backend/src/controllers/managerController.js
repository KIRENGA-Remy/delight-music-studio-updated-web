const db = require('../config/db');

const generateOTP = () => Math.floor(10000 + Math.random() * 90000).toString();

exports.createUser = async (req, res) => {
  const { fullname, email, phone, role, client_type } = req.body;
  if (!fullname || !role || (!email && !phone))
    return res.status(400).json({ error: 'fullname, role, and email or phone are required' });
  try {
    const otp = generateOTP();
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO users (fullname, email, phone, role, client_type, otp_code, otp_expires) VALUES (?,?,?,?,?,?,?)',
      [fullname, email || null, phone || null, role, client_type || null, otp, expires]
    );
    console.log(`New user OTP [${fullname}]: ${otp}`);
    return res.status(201).json({ message: 'User created. OTP sent.', otp_preview: otp });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email or phone already exists' });
    return res.status(500).json({ error: err.message });
  }
};

exports.resendOTP = async (req, res) => {
  const { userId } = req.body;
  try {
    const otp = generateOTP();
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const [result] = await db.query(
      'UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?',
      [otp, expires, userId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
    console.log(`Resent OTP for user ${userId}: ${otp}`);
    return res.json({ message: 'OTP resent', otp_preview: otp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query("SELECT COUNT(*) as total_users FROM users WHERE role != 'manager'");
    const [[{ total_projects }]] = await db.query('SELECT COUNT(*) as total_projects FROM projects');
    const [[{ active_projects }]] = await db.query("SELECT COUNT(*) as active_projects FROM projects WHERE status = 'in_progress'");
    const [[{ completed_projects }]] = await db.query("SELECT COUNT(*) as completed_projects FROM projects WHERE status = 'completed'");
    const [[{ pending_leads }]] = await db.query("SELECT COUNT(*) as pending_leads FROM partner_requests WHERE status = 'pending'");
    const [[{ total_revenue }]] = await db.query("SELECT COALESCE(SUM(price),0) as total_revenue FROM projects WHERE status = 'completed'");
    const [producers] = await db.query(`
      SELECT u.id, u.fullname, COUNT(p.id) as project_count,
        COALESCE(AVG(p.progress_percentage),0) as avg_progress
      FROM users u
      LEFT JOIN projects p ON p.producer_id = u.id AND p.status = 'in_progress'
      WHERE u.role = 'producer'
      GROUP BY u.id
    `);
    const [recent_projects] = await db.query(`
      SELECT p.*, u.fullname as client_name,
        COALESCE(pr.fullname,'Unassigned') as producer_name
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN users pr ON p.producer_id = pr.id
      ORDER BY p.created_at DESC LIMIT 10
    `);
    return res.json({ total_users, total_projects, active_projects, completed_projects, pending_leads, total_revenue, producers, recent_projects });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT n.*, u.fullname as sender_name
      FROM notifications n
      JOIN users u ON n.sender_id = u.id
      WHERE n.receiver_id = ?
      ORDER BY n.created_at DESC LIMIT 50
    `, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getPartnerRequests = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM partner_requests ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updatePartnerStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE partner_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ message: 'Status updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.addTestimonial = async (req, res) => {
  const { client_name, message, rating } = req.body;
  try {
    await db.query('INSERT INTO testimonials (client_name, message, rating, is_approved) VALUES (?,?,?,?)',
      [client_name, message, rating || 5, true]);
    return res.status(201).json({ message: 'Testimonial added' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, fullname, email, phone, role, client_type, created_at FROM users WHERE role != 'manager' ORDER BY created_at DESC"
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.createProject = async (req, res) => {
  const { client_id, producer_id, title, description, price, deadline } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO projects (client_id, producer_id, title, description, price, deadline) VALUES (?,?,?,?,?,?)',
      [client_id, producer_id || null, title, description || null, price || null, deadline || null]
    );
    if (producer_id) {
      await db.query(
        'INSERT INTO work_orders (project_id, producer_id, requirements) VALUES (?,?,?)',
        [result.insertId, producer_id, description || null]
      );
    }
    return res.status(201).json({ message: 'Project created', id: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.uploadCertificate = async (req, res) => {
  const { user_id, issued_date } = req.body;
  const getUrl = req.getFileUrl || ((f) => f.path || `/uploads/${f.filename}`);
  const file_url = req.file ? getUrl(req.file) : req.body.certificate_url;
  try {
    await db.query('INSERT INTO certificates (user_id, certificate_url, issued_date) VALUES (?,?,?)',
      [user_id, file_url, issued_date]);
    return res.status(201).json({ message: 'Certificate uploaded' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, producer_id, price, deadline, status, progress_percentage } = req.body;
  try {
    const fields = [], values = [];
    if (title !== undefined)               { fields.push('title = ?');               values.push(title); }
    if (description !== undefined)         { fields.push('description = ?');         values.push(description); }
    if (producer_id !== undefined)         { fields.push('producer_id = ?');         values.push(producer_id || null); }
    if (price !== undefined)               { fields.push('price = ?');               values.push(price || null); }
    if (deadline !== undefined)            { fields.push('deadline = ?');            values.push(deadline || null); }
    if (status !== undefined)              { fields.push('status = ?');              values.push(status); }
    if (progress_percentage !== undefined) { fields.push('progress_percentage = ?'); values.push(progress_percentage); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(id);
    await db.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'Project updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM projects WHERE id = ?', [id]);
    return res.json({ message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTestimonials = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.updateTestimonial = async (req, res) => {
  const { client_name, message, rating, is_approved } = req.body;
  try {
    const fields = [], values = [];
    if (client_name !== undefined)  { fields.push('client_name = ?');  values.push(client_name); }
    if (message !== undefined)      { fields.push('message = ?');      values.push(message); }
    if (rating !== undefined)       { fields.push('rating = ?');       values.push(rating); }
    if (is_approved !== undefined)  { fields.push('is_approved = ?');  values.push(is_approved); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.id);
    await db.query(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'Testimonial updated' });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.deleteTestimonial = async (req, res) => {
  try {
    await db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Testimonial deleted' });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
