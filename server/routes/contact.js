const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assuming db.js handles MySQL connection
const auth = require('../middleware/auth'); // Import auth middleware
const multer = require('multer');
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use path.join to create an absolute path for the upload directory
    // __dirname is the directory of the current module (server/routes)
    // '..' goes up one level to 'server'
    // 'uploads/resumes' specifies the target subdirectory
    cb(null, path.join(__dirname, '..', 'uploads', 'resumes'));
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Filter for PDF files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// @route   POST /api/contact/send-message
// @desc    Send a message from the contact form
// @access  Public
router.post('/send-message', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ msg: 'Please enter all required fields: name, email, subject, message' });
  }

  const newMessage = { name, email, phone, subject, message };

  const sql = 'INSERT INTO messages SET ?';
  db.query(sql, newMessage, (err, result) => {
    if (err) {
      console.error('Error inserting message:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.status(201).json({ msg: 'Message sent successfully', messageId: result.insertId });
  });
});

// @route   GET /api/contact/open-positions
// @desc    Get a list of open job positions
// @access  Public
router.get('/open-positions', (req, res) => {
  const sql = 'SELECT * FROM open_positions WHERE is_active = TRUE ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching open positions:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(results);
  });
});

// @route   POST /api/contact/upload-resume
// @desc    Upload a resume file
// @access  Public
router.post('/upload-resume', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded or file type not allowed (only PDF).' });
  }
  // Return the path where the file is stored relative to the server's root
  const filePath = `/uploads/resumes/${req.file.filename}`;
  res.status(200).json({ msg: 'File uploaded successfully', filePath: filePath });
}, (error, req, res, next) => {
  // Multer error handling
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'File size too large. Max 10MB allowed.' });
    }
    return res.status(400).json({ msg: error.message });
  } else if (error) {
    return res.status(400).json({ msg: error.message });
  }
  next();
});

// @route   POST /api/contact/apply-job
// @desc    Apply for a job position
// @access  Public
router.post('/apply-job', (req, res) => {
  const { position_id, name, email, phone, resume_url, cover_letter } = req.body;

  if (!position_id || !name || !email || !phone || !resume_url) {
    return res.status(400).json({ msg: 'Please enter all required fields: position, name, email, phone, resume URL' });
  }

  const newApplication = { position_id, name, email, phone, resume_url, cover_letter };

  const sql = 'INSERT INTO job_applications SET ?';
  db.query(sql, newApplication, (err, result) => {
    if (err) {
      console.error('Error inserting job application:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.status(201).json({ msg: 'Job application submitted successfully', applicationId: result.insertId });
  });
});

// @route   GET /api/contact/messages
// @desc    Get all contact messages (Admin only)
// @access  Private
router.get('/messages', auth, (req, res) => {
  const sql = 'SELECT * FROM messages ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(results);
  });
});

// @route   DELETE /api/contact/messages/:id
// @desc    Delete a contact message by ID (Admin only)
// @access  Private
router.delete('/messages/:id', auth, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM messages WHERE id = ?';
  db.query(sql, id, (err, result) => {
    if (err) {
      console.error('Error deleting message:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Message not found' });
    }
    res.json({ msg: 'Message deleted successfully' });
  });
});

// @route   GET /api/contact/jobs
// @desc    Get all open job positions (Admin only)
// @access  Private
router.get('/jobs', auth, (req, res) => {
  const sql = 'SELECT * FROM open_positions ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching open positions:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(results);
  });
});

// @route   POST /api/contact/jobs
// @desc    Add a new job position (Admin only)
// @access  Private
router.post('/jobs', auth, (req, res) => {
  const { title, description, requirements, location, salary_range, is_active } = req.body;
  if (!title || !description || !requirements) {
    return res.status(400).json({ msg: 'Please enter all required fields: title, description, requirements' });
  }
  const newJob = { title, description, requirements, location, salary_range, is_active: is_active || true };
  const sql = 'INSERT INTO open_positions SET ?';
  db.query(sql, newJob, (err, result) => {
    if (err) {
      console.error('Error adding job position:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.status(201).json({ msg: 'Job position added successfully', jobId: result.insertId });
  });
});

// @route   PUT /api/contact/jobs/:id
// @desc    Update a job position by ID (Admin only)
// @access  Private
router.put('/jobs/:id', auth, (req, res) => {
  const { id } = req.params;
  const { title, description, requirements, location, salary_range, is_active } = req.body;
  const updatedJob = { title, description, requirements, location, salary_range, is_active };
  const sql = 'UPDATE open_positions SET ? WHERE id = ?';
  db.query(sql, [updatedJob, id], (err, result) => {
    if (err) {
      console.error('Error updating job position:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Job position not found' });
    }
    res.json({ msg: 'Job position updated successfully' });
  });
});

// @route   DELETE /api/contact/jobs/:id
// @desc    Delete a job position by ID (Admin only)
// @access  Private
router.delete('/jobs/:id', auth, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM open_positions WHERE id = ?';
  db.query(sql, id, (err, result) => {
    if (err) {
      console.error('Error deleting job position:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Job position not found' });
    }
    res.json({ msg: 'Job position deleted successfully' });
  });
});

// @route   GET /api/contact/applications
// @desc    Get all job applications (Admin only)
// @access  Private
router.get('/applications', auth, (req, res) => {
  const sql = 'SELECT ja.*, op.title as position_title FROM job_applications ja JOIN open_positions op ON ja.position_id = op.id ORDER BY ja.applied_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching job applications:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(results);
  });
});

// @route   DELETE /api/contact/applications/:id
// @desc    Delete a job application by ID (Admin only)
// @access  Private
router.delete('/applications/:id', auth, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM job_applications WHERE id = ?';
  db.query(sql, id, (err, result) => {
    if (err) {
      console.error('Error deleting job application:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Job application not found' });
    }
    res.json({ msg: 'Job application deleted successfully' });
  });
});

module.exports = router;
