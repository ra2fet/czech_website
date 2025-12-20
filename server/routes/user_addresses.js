const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Import auth middleware

// Middleware to protect user-specific address routes
// This middleware will ensure that only the authenticated user (or an admin) can access their own addresses.
router.use('/:userId', authenticateToken, (req, res, next) => {
    const { userId } = req.params;
    // Ensure the authenticated user matches the userId in the URL or is an admin
    if (req.user.id !== parseInt(userId) && req.user.userType !== 'admin') {
        return res.status(403).json({ error: req.t('errors.auth.insufficient_permissions') });
    }
    next();
});

// Route to get addresses for a specific user
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    const languageCode = req.language || 'en';
    const query = `
        SELECT ua.*, pt.name AS province_name
        FROM user_addresses ua
        LEFT JOIN provinces p ON ua.province_id = p.id
        LEFT JOIN provinces_translations pt ON p.id = pt.province_id AND pt.language_code = ?
        WHERE ua.user_id = ?
        ORDER BY ua.created_at DESC
    `;
    db.query(query, [languageCode, userId], (err, addresses) => {
        if (err) {
            console.error('Error fetching user addresses:', err);
            return res.status(500).json({ error: req.t('errors.resources.fetch_failed', { resource: req.getResource('address', true) }) });
        }
        const formattedAddresses = addresses.map(address => ({
            ...address,
            province: address.province_name
        }));
        res.status(200).json(formattedAddresses);
    });
});

// Route to add a new address for a user
router.post('/:userId', (req, res) => {
    const { userId } = req.params;
    const { address_name, city, province_id, street_name, house_number, postcode } = req.body;

    // Validation with localized messages
    const validationErrors = [];
    if (!address_name) validationErrors.push(req.t('errors.validation.required', { field: 'Address Name' }));
    if (!city) validationErrors.push(req.t('errors.validation.required', { field: 'City' }));
    if (!province_id) validationErrors.push(req.t('errors.validation.required', { field: 'Province' }));
    if (!street_name) validationErrors.push(req.t('errors.validation.required', { field: 'Street Name' }));
    if (!house_number) validationErrors.push(req.t('errors.validation.required', { field: 'House Number' }));
    if (!postcode) validationErrors.push(req.t('errors.validation.required', { field: 'Postcode' }));

    if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
    }

    const query = 'INSERT INTO user_addresses (user_id, address_name, city, province_id, street_name, house_number, postcode) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [userId, address_name, city, province_id, street_name, house_number, postcode];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error adding new address:', err);
            return res.status(500).json({ error: req.t('errors.resources.creation_failed', { resource: req.getResource('address') }) });
        }
        res.status(201).json({ 
            id: result.insertId, 
            address_name, 
            city, 
            province_id, 
            street_name, 
            house_number, 
            postcode, 
            message: req.t('success.resources.created', { resource: req.getResource('address') })
        });
    });
});

// Route to update an existing address for a user
router.put('/:userId/:addressId', (req, res) => {
    const { userId, addressId } = req.params;
    const { address_name, city, province_id, street_name, house_number, postcode } = req.body;

    // Validation with localized messages
    const validationErrors = [];
    if (!address_name) validationErrors.push(req.t('errors.validation.required', { field: 'Address Name' }));
    if (!city) validationErrors.push(req.t('errors.validation.required', { field: 'City' }));
    if (!province_id) validationErrors.push(req.t('errors.validation.required', { field: 'Province' }));
    if (!street_name) validationErrors.push(req.t('errors.validation.required', { field: 'Street Name' }));
    if (!house_number) validationErrors.push(req.t('errors.validation.required', { field: 'House Number' }));
    if (!postcode) validationErrors.push(req.t('errors.validation.required', { field: 'Postcode' }));

    if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
    }

    const query = 'UPDATE user_addresses SET address_name = ?, city = ?, province_id = ?, street_name = ?, house_number = ?, postcode = ? WHERE id = ? AND user_id = ?';
    const values = [address_name, city, province_id, street_name, house_number, postcode, addressId, userId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating address:', err);
            return res.status(500).json({ error: req.t('errors.resources.update_failed', { resource: req.getResource('address') }) });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: req.getResource('address') }) });
        }
        res.status(200).json({ message: req.t('success.resources.updated', { resource: req.getResource('address') }) });
    });
});

// Route to delete an address for a user
router.delete('/:userId/:addressId', (req, res) => {
    const { userId, addressId } = req.params;

    const query = 'DELETE FROM user_addresses WHERE id = ? AND user_id = ?';
    const values = [addressId, userId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error deleting address:', err);
            return res.status(500).json({ error: req.t('errors.resources.deletion_failed', { resource: req.getResource('address') }) });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: req.getResource('address') }) });
        }
        res.status(200).json({ message: req.t('success.resources.deleted', { resource: req.getResource('address') }) });
    });
});

module.exports = router;
