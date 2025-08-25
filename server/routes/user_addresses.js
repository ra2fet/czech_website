const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Import auth middleware

// Middleware to protect user-specific address routes
router.use('/:userId', authenticateToken);

// Route to get addresses for a specific user
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT ua.*, p.name AS province_name
        FROM user_addresses ua
        JOIN provinces p ON ua.province_id = p.id
        WHERE ua.user_id = ?
        ORDER BY ua.created_at DESC
    `;
    db.query(query, [userId], (err, addresses) => {
        if (err) {
            console.error('Error fetching user addresses:', err);
            return res.status(500).json({ message: 'Failed to fetch addresses', error: err.message });
        }
        // Map province_name back to province for frontend compatibility if needed, or update frontend to use province_name
        const formattedAddresses = addresses.map(address => ({
            ...address,
            province: address.province_name // Use province_name as province
        }));
        res.status(200).json(formattedAddresses);
    });
});

// Route to add a new address for a user
router.post('/:userId', (req, res) => {
    const { userId } = req.params;
    const { address_name, city, province_id, street_name, house_number, postcode } = req.body;

    if (!address_name || !city || !province_id || !street_name || !house_number || !postcode) {
        return res.status(400).json({ message: 'All address fields are required.' });
    }

    const query = 'INSERT INTO user_addresses (user_id, address_name, city, province_id, street_name, house_number, postcode) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [userId, address_name, city, province_id, street_name, house_number, postcode];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error adding new address:', err);
            return res.status(500).json({ message: 'Failed to add address', error: err.message });
        }
        res.status(201).json({ id: result.insertId, address_name, city, province_id, street_name, house_number, postcode, message: 'Address added successfully.' });
    });
});

// Route to update an existing address for a user
router.put('/:userId/:addressId', (req, res) => {
    const { userId, addressId } = req.params;
    const { address_name, city, province_id, street_name, house_number, postcode } = req.body;

    if (!address_name || !city || !province_id || !street_name || !house_number || !postcode) {
        return res.status(400).json({ message: 'All address fields are required.' });
    }

    const query = 'UPDATE user_addresses SET address_name = ?, city = ?, province_id = ?, street_name = ?, house_number = ?, postcode = ? WHERE id = ? AND user_id = ?';
    const values = [address_name, city, province_id, street_name, house_number, postcode, addressId, userId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating address:', err);
            return res.status(500).json({ message: 'Failed to update address', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Address not found or not authorized to update.' });
        }
        res.status(200).json({ message: 'Address updated successfully.' });
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
            return res.status(500).json({ message: 'Failed to delete address', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Address not found or not authorized to delete.' });
        }
        res.status(200).json({ message: 'Address deleted successfully.' });
    });
});

module.exports = router;
