const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get about us content with translations for the current language
router.get('/', (req, res) => {
    const languageCode = req.language || 'en';

    db.query(
        `SELECT a.image_url, at.hero_title, at.hero_subtitle, at.story_title, at.story_content, at.story_footer, at.vision_title, at.vision_description, at.mission_title, at.mission_description, at.sustainability_quote
     FROM about_us a
     JOIN about_us_translations at ON a.id = at.about_us_id
     WHERE at.language_code = ?
     LIMIT 1`,
        [languageCode],
        (err, results) => {
            if (err) {
                console.error('Error fetching about us content:', err);
                return res.status(500).json({ error: 'Failed to fetch about us content' });
            }

            if (results.length === 0) {
                // Fallback to English if current language not found
                db.query(
                    `SELECT a.image_url, at.hero_title, at.hero_subtitle, at.story_title, at.story_content, at.story_footer, at.vision_title, at.vision_description, at.mission_title, at.mission_description, at.sustainability_quote
           FROM about_us a
           JOIN about_us_translations at ON a.id = at.about_us_id
           WHERE at.language_code = 'en'
           LIMIT 1`,
                    (err2, fallbackResults) => {
                        if (err2 || fallbackResults.length === 0) {
                            return res.status(404).json({ error: 'About us content not found' });
                        }
                        res.json(fallbackResults[0]);
                    }
                );
            } else {
                res.json(results[0]);
            }
        }
    );
});

// Admin: Get all data with all translations
router.get('/admin', (req, res) => {
    db.query('SELECT * FROM about_us LIMIT 1', (err, aboutUs) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query('SELECT * FROM about_us_translations WHERE about_us_id = ?', [aboutUs[0]?.id], (err2, translations) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const transMap = {};
            translations.forEach(t => {
                transMap[t.language_code] = t;
            });

            res.json({
                ...aboutUs[0],
                translations: transMap
            });
        });
    });
});

// Admin: Update content
router.put('/', async (req, res) => {
    const { image_url, translations } = req.body;

    try {
        await db.promise().beginTransaction();

        // Check if about_us entry exists
        const [rows] = await db.promise().query('SELECT id FROM about_us LIMIT 1');
        let aboutUsId;

        if (rows.length === 0) {
            const [result] = await db.promise().query('INSERT INTO about_us (image_url) VALUES (?)', [image_url]);
            aboutUsId = result.insertId;
        } else {
            aboutUsId = rows[0].id;
            await db.promise().query('UPDATE about_us SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [image_url, aboutUsId]);
        }

        // Update translations
        for (const langCode in translations) {
            const trans = translations[langCode];
            const [existing] = await db.promise().query('SELECT id FROM about_us_translations WHERE about_us_id = ? AND language_code = ?', [aboutUsId, langCode]);

            const values = [
                trans.hero_title, trans.hero_subtitle, trans.story_title,
                trans.story_content, trans.story_footer,
                trans.vision_title, trans.vision_description, trans.mission_title, trans.mission_description,
                trans.sustainability_quote
            ];

            if (existing.length > 0) {
                await db.promise().query(
                    `UPDATE about_us_translations SET
            hero_title = ?, hero_subtitle = ?, story_title = ?,
            story_content = ?, story_footer = ?,
            vision_title = ?, vision_description = ?, mission_title = ?, mission_description = ?,
            sustainability_quote = ?
          WHERE about_us_id = ? AND language_code = ?`,
                    [...values, aboutUsId, langCode]
                );
            } else {
                await db.promise().query(
                    `INSERT INTO about_us_translations (
            hero_title, hero_subtitle, story_title,
            story_content, story_footer,
            vision_title, vision_description, mission_title, mission_description,
            sustainability_quote, about_us_id, language_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [...values, aboutUsId, langCode]
                );
            }
        }

        await db.promise().commit();
        res.json({ message: 'About Us content updated successfully' });
    } catch (error) {
        await db.promise().rollback();
        console.error('Error updating about us:', error);
        res.status(500).json({ error: 'Failed to update about us content' });
    }
});

module.exports = router;
