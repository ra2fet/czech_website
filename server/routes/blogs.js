const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

// Get all blogs with translations for the current language
router.get('/', (req, res) => {
  const languageCode = req.language;
  const search = req.query.search || '';

  let query = `
    SELECT b.id, bt.title, bt.content, bt.excerpt, b.image_url, b.created_at, b.updated_at, b.sort_order, b.views
    FROM blogs b
    JOIN blogs_translations bt ON b.id = bt.blog_id
    WHERE bt.language_code = ?
  `;

  const queryParams = [languageCode];

  if (search) {
    query += ` AND (bt.title LIKE ? OR bt.content LIKE ? OR bt.excerpt LIKE ?)`;
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY b.sort_order ASC, b.created_at DESC`;

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching blogs:', err);
      return res.status(500).json({
        error: req.t('errors.resources.fetch_failed', { resource: req.getResource('blog', true) })
      });
    }
    res.json(results);
  });
});

// Admin: Get all blogs (active and inactive) with all translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [blogs] = await db.promise().query('SELECT * FROM blogs ORDER BY sort_order ASC, created_at DESC');
    const [translations] = await db.promise().query('SELECT * FROM blogs_translations');

    const blogsWithTranslations = blogs.map((blog) => {
      const blogTranslations = {};

      translations.forEach((t) => {
        if (t.blog_id === blog.id) {
          blogTranslations[t.language_code] = { title: t.title, content: t.content, excerpt: t.excerpt };
        }
      });
      return {
        ...blog,
        title: blogTranslations[req.language]?.title || blogTranslations['en']?.title || '',
        content: blogTranslations[req.language]?.content || blogTranslations['en']?.content || '',
        excerpt: blogTranslations[req.language]?.excerpt || blogTranslations['en']?.excerpt || '',
        translations: blogTranslations,
      };
    });
    res.json(blogsWithTranslations);
  } catch (error) {
    console.error('Error fetching all blogs with translations:', error);
    res.status(500).json({
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('blog', true) })
    });
  }
});

// GET popular and latest blogs
router.get('/sidebar', (req, res) => {
  const languageCode = req.language;

  const latestQuery = `
    SELECT b.id, bt.title, b.image_url, b.created_at
    FROM blogs b
    JOIN blogs_translations bt ON b.id = bt.blog_id
    WHERE bt.language_code = ?
    ORDER BY b.created_at DESC
    LIMIT 5
  `;

  const popularQuery = `
    SELECT b.id, bt.title, b.image_url, b.created_at, b.views
    FROM blogs b
    JOIN blogs_translations bt ON b.id = bt.blog_id
    WHERE bt.language_code = ?
    ORDER BY b.views DESC, b.created_at DESC
    LIMIT 5
  `;

  db.query(latestQuery, [languageCode], (err, latestResults) => {
    if (err) {
      console.error('Error fetching latest blogs:', err);
      return res.status(500).json({ error: 'Failed to fetch sidebar data' });
    }

    db.query(popularQuery, [languageCode], (err, popularResults) => {
      if (err) {
        console.error('Error fetching popular blogs:', err);
        return res.status(500).json({ error: 'Failed to fetch sidebar data' });
      }

      res.json({
        latest: latestResults,
        popular: popularResults
      });
    });
  });
});

// GET a single blog post by ID with translations
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const languageCode = req.language;

  // Increment views
  db.query('UPDATE blogs SET views = views + 1 WHERE id = ?', [id]);

  db.query(
    `SELECT b.id, bt.title, bt.content, bt.excerpt, b.image_url, b.created_at, b.updated_at, b.views
     FROM blogs b
     JOIN blogs_translations bt ON b.id = bt.blog_id
     WHERE b.id = ? AND bt.language_code = ?`,
    [id, languageCode],
    (err, results) => {
      if (err) {
        console.error('Error fetching blog post:', err);
        return res.status(500).json({
          error: req.t('errors.resources.fetch_failed', { resource: req.getResource('blog') })
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          error: req.t('errors.resources.not_found', { resource: req.getResource('blog') })
        });
      }

      res.json(results[0]);
    }
  );
});

router.post('/', authenticateToken, adminProtect, async (req, res) => {
  const { image_url, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.title) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('title') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.content) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('content') }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    await db.promise().beginTransaction();

    const [blogResult] = await db.promise().query(
      'INSERT INTO blogs (image_url, sort_order) VALUES (?, ?)',
      [image_url || null, req.body.sort_order || 0]
    );
    const blogId = blogResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.title && translations[langCode]?.content) {
        await db.promise().query(
          'INSERT INTO blogs_translations (blog_id, language_code, title, content, excerpt) VALUES (?, ?, ?, ?, ?)',
          [blogId, langCode, translations[langCode].title, translations[langCode].content, translations[langCode].excerpt || null]
        );
      }
    }

    await db.promise().commit();
    res.status(201).json({
      message: req.t('success.resources.created', { resource: req.getResource('blog') }),
      id: blogId
    });
  } catch (error) {
    await db.promise().rollback();
    console.error('Error creating blog:', error);
    res.status(500).json({
      error: req.t('errors.resources.creation_failed', { resource: req.getResource('blog') })
    });
  }
});

router.put('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { image_url, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.title) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('title') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.content) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('content') }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    await db.promise().beginTransaction();

    const [updateBlogResult] = await db.promise().query(
      'UPDATE blogs SET image_url = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [image_url || null, req.body.sort_order || 0, id]
    );

    if (updateBlogResult.affectedRows === 0) {
      await db.promise().rollback();
      return res.status(404).json({
        error: req.t('errors.resources.not_found', { resource: req.getResource('blog') })
      });
    }

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.title && translations[langCode]?.content) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM blogs_translations WHERE blog_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE blogs_translations SET title = ?, content = ?, excerpt = ?, updated_at = CURRENT_TIMESTAMP WHERE blog_id = ? AND language_code = ?',
            [translations[langCode].title, translations[langCode].content, translations[langCode].excerpt || null, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO blogs_translations (blog_id, language_code, title, content, excerpt) VALUES (?, ?, ?, ?, ?)',
            [id, langCode, translations[langCode].title, translations[langCode].content, translations[langCode].excerpt || null]
          );
        }
      }
    }

    await db.promise().commit();
    res.json({
      message: req.t('success.resources.updated', { resource: req.getResource('blog') })
    });
  } catch (error) {
    await db.promise().rollback();
    console.error('Error updating blog:', error);
    res.status(500).json({
      error: req.t('errors.resources.update_failed', { resource: req.getResource('blog') })
    });
  }
});

router.delete('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;

  try {
    // Deleting from the main blogs table will cascade delete from blogs_translations
    const [result] = await db.promise().query('DELETE FROM blogs WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: req.t('errors.resources.not_found', { resource: req.getResource('blog') })
      });
    }

    res.json({
      message: req.t('success.resources.deleted', { resource: req.getResource('blog') })
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      error: req.t('errors.resources.deletion_failed', { resource: req.getResource('blog') })
    });
  }
});

module.exports = router;
