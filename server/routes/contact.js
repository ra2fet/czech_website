const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assuming db.js handles MySQL connection
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Import auth middleware
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

  // Validation with localized messages
  const validationErrors = [];
  if (!name) validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('name') }));
  if (!email) validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('email') }));
  if (!subject) validationErrors.push(req.t('errors.validation.required', { field: 'Subject' }));
  if (!message) validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('message') }));

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const newMessage = { name, email, phone, subject, message };

  const sql = 'INSERT INTO messages SET ?';
  db.query(sql, newMessage, (err, result) => {
    if (err) {
      console.error('Error inserting message:', err);
      return res.status(500).json({ error: req.t('errors.general.internal_error') });
    }
    res.status(201).json({ 
      message: req.t('success.email.contact_submitted'), 
      messageId: result.insertId 
    });
  });
});

// @route   GET /api/contact/open-positions
// @desc    Get a list of open job positions
// @access  Public
router.get('/open-positions', (req, res) => {
  const languageCode = req.language;
  const sql = `
    SELECT op.id, opt.title, opt.description, opt.requirements, opt.location, op.salary_range, op.is_active, op.created_at, op.updated_at
    FROM open_positions op
    JOIN open_positions_translations opt ON op.id = opt.position_id
    WHERE op.is_active = TRUE AND opt.language_code = ?
    ORDER BY op.created_at DESC
  `;
  db.query(sql, [languageCode], (err, results) => {
    if (err) {
      console.error('Error fetching open positions:', err);
      return res.status(500).json({ error: req.t('errors.resources.fetch_failed', { resource: req.getResource('position', true) }) });
    }
    res.json(results);
  });
});

// @route   POST /api/contact/upload-resume
// @desc    Upload a resume file
// @access  Public
router.post('/upload-resume', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: req.t('errors.file.upload_failed') });
  }
  // Return the path where the file is stored relative to the server's root
  const filePath = `/uploads/resumes/${req.file.filename}`;
  res.status(200).json({ 
    message: req.t('success.general.operation_completed'), 
    filePath: filePath 
  });
}, (error, req, res, next) => {
  // Multer error handling
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: req.t('errors.file.size_exceeded') });
    }
    return res.status(400).json({ error: req.t('errors.file.upload_failed') });
  } else if (error) {
    return res.status(400).json({ error: req.t('errors.file.invalid_format') });
  }
  next();
});

// @route   POST /api/contact/apply-job
// @desc    Apply for a job position
// @access  Public
router.post('/apply-job', (req, res) => {
  const { position_id, name, email, phone, resume_url, cover_letter } = req.body;

  // Validation with localized messages
  const validationErrors = [];
  if (!position_id) validationErrors.push(req.t('errors.validation.required', { field: 'Position' }));
  if (!name) validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('name') }));
  if (!email) validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('email') }));
  if (!phone) validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('phone') }));
  if (!resume_url) validationErrors.push(req.t('errors.validation.required', { field: 'Resume URL' }));

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const newApplication = { position_id, name, email, phone, resume_url, cover_letter };

  const sql = 'INSERT INTO job_applications SET ?';
  db.query(sql, newApplication, (err, result) => {
    if (err) {
      console.error('Error inserting job application:', err);
      return res.status(500).json({ error: req.t('errors.general.internal_error') });
    }
    res.status(201).json({ 
      message: req.t('success.general.operation_completed'), 
      applicationId: result.insertId 
    });
  });
});

// @route   GET /api/contact/messages
// @desc    Get all contact messages (Admin only)
// @access  Private
router.get('/messages', authenticateToken, adminProtect, (req, res) => {
  const sql = 'SELECT * FROM messages ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: req.t('errors.resources.fetch_failed', { resource: 'Messages' }) });
    }
    res.json(results);
  });
});

// @route   DELETE /api/contact/messages/:id
// @desc    Delete a contact message by ID (Admin only)
// @access  Private
router.delete('/messages/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM messages WHERE id = ?';
  db.query(sql, id, (err, result) => {
    if (err) {
      console.error('Error deleting message:', err);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: 'Message' }) });
    }
    res.json({ message: req.t('success.resources.deleted', { resource: 'Message' }) });
  });
});

// @route   GET /api/contact/jobs
// @desc    Get all open job positions (Admin only)
// @access  Private
router.get('/jobs', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [positions] = await db.promise().query('SELECT * FROM open_positions ORDER BY created_at DESC');
    const [translations] = await db.promise().query('SELECT * FROM open_positions_translations');

    const positionsWithTranslations = positions.map((position) => {
      const positionTranslations = {};
      translations.forEach((t) => {
        if (t.position_id === position.id) {
          positionTranslations[t.language_code] = { 
            title: t.title, 
            description: t.description, 
            requirements: t.requirements, 
            location: t.location 
          };
        }
      });
      return {
        ...position,
        title: positionTranslations[req.language]?.title || positionTranslations['en']?.title || '',
        description: positionTranslations[req.language]?.description || positionTranslations['en']?.description || '',
        requirements: positionTranslations[req.language]?.requirements || positionTranslations['en']?.requirements || '',
        location: positionTranslations[req.language]?.location || positionTranslations['en']?.location || '',
        translations: positionTranslations,
      };
    });
    res.json(positionsWithTranslations);
  } catch (error) {
    console.error('Error fetching all positions with translations:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('position', true) })
    });
  }
});

// @route   POST /api/contact/jobs
// @desc    Add a new job position (Admin only)
// @access  Private
router.post('/jobs', authenticateToken, adminProtect, async (req, res) => {
  const { salary_range, is_active, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.title) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('title') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.description) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('description') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.requirements) {
    validationErrors.push(req.t('errors.validation.required', { field: 'Requirements' }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const [positionResult] = await db.promise().query(
      'INSERT INTO open_positions (salary_range, is_active) VALUES (?, ?)',
      [salary_range || null, is_active || true]
    );
    const positionId = positionResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.title) {
        await db.promise().query(
          'INSERT INTO open_positions_translations (position_id, language_code, title, description, requirements, location) VALUES (?, ?, ?, ?, ?, ?)',
          [positionId, langCode, translations[langCode].title, translations[langCode].description || null, translations[langCode].requirements || null, translations[langCode].location || null]
        );
      }
    }

    res.status(201).json({ 
      message: req.t('success.resources.created', { resource: req.getResource('position') }),
      id: positionId 
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ error: req.t('errors.resources.creation_failed', { resource: req.getResource('position') }) });
  }
});

// @route   PUT /api/contact/jobs/:id
// @desc    Update a job position by ID (Admin only)
// @access  Private
router.put('/jobs/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { salary_range, is_active, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.title) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('title') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.description) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('description') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.requirements) {
    validationErrors.push(req.t('errors.validation.required', { field: 'Requirements' }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Check if position exists
    const [positionExists] = await db.promise().query('SELECT id FROM open_positions WHERE id = ?', [id]);

    if (positionExists.length === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('position') })
      });
    }

    // Update the main open_positions table
    await db.promise().query(
      'UPDATE open_positions SET salary_range = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [salary_range || null, is_active, id]
    );

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.title) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM open_positions_translations WHERE position_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE open_positions_translations SET title = ?, description = ?, requirements = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE position_id = ? AND language_code = ?',
            [translations[langCode].title, translations[langCode].description || null, translations[langCode].requirements || null, translations[langCode].location || null, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO open_positions_translations (position_id, language_code, title, description, requirements, location) VALUES (?, ?, ?, ?, ?, ?)',
            [id, langCode, translations[langCode].title, translations[langCode].description || null, translations[langCode].requirements || null, translations[langCode].location || null]
          );
        }
      }
    }

    res.json({ message: req.t('success.resources.updated', { resource: req.getResource('position') }) });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ error: req.t('errors.resources.update_failed', { resource: req.getResource('position') }) });
  }
});

// @route   DELETE /api/contact/jobs/:id
// @desc    Delete a job position by ID (Admin only)
// @access  Private
router.delete('/jobs/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  try {
    // Deleting from the main open_positions table will cascade delete from open_positions_translations
    const [result] = await db.promise().query('DELETE FROM open_positions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: req.getResource('position') }) });
    }
    res.json({ message: req.t('success.resources.deleted', { resource: req.getResource('position') }) });
  } catch (error) {
    console.error('Error deleting job position:', error);
    res.status(500).json({ error: req.t('errors.resources.deletion_failed', { resource: req.getResource('position') }) });
  }
});

// @route   GET /api/contact/applications
// @desc    Get all job applications (Admin only)
// @access  Private
router.get('/applications', authenticateToken, adminProtect, (req, res) => {
  const sql = `
    SELECT ja.*, opt.title as position_title 
    FROM job_applications ja 
    JOIN open_positions op ON ja.position_id = op.id 
    LEFT JOIN open_positions_translations opt ON op.id = opt.position_id AND opt.language_code = ?
    ORDER BY ja.applied_at DESC
  `;
  db.query(sql, [req.language || 'en'], (err, results) => {
    if (err) {
      console.error('Error fetching job applications:', err);
      return res.status(500).json({ error: req.t('errors.resources.fetch_failed', { resource: 'Job Applications' }) });
    }
    res.json(results);
  });
});

// @route   DELETE /api/contact/applications/:id
// @desc    Delete a job application by ID (Admin only)
// @access  Private
router.delete('/applications/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM job_applications WHERE id = ?';
  db.query(sql, id, (err, result) => {
    if (err) {
      console.error('Error deleting job application:', err);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: 'Job Application' }) });
    }
    res.json({ message: req.t('success.resources.deleted', { resource: 'Job Application' }) });
  });
});

module.exports = router;
