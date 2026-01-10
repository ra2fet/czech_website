const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');

// Public route to create payment intent (allows guest checkout)
router.post('/create-payment-intent', async (req, res) => {
    const { amount, currency } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency || 'eur',
            payment_method_types: ['card', 'ideal', 'klarna'],
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
