const nodemailer = require('nodemailer');

// Create a transporter using your email service details
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendRatingEmail = async (userEmail, orderId, ratingLink) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: 'We\'d love your feedback on your recent order! - Babobamboo',
        html: `
            <p>Dear Customer,</p>
            <p>Thank you for your recent purchase from us! We hope you are enjoying your new products.</p>
            <p>We would greatly appreciate it if you could take a moment to rate your order and the products you received. Your feedback helps us improve our services and product offerings.</p>
            <p>Please click on the link below to provide your rating:</p>
            <p><a href="${ratingLink}">Rate Your Order and Products</a></p>
            <p>This link can only be used once.</p>
            <p>Thank you again for your business!</p>
            <p>Sincerely,</p>
            <p>The Team</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Rating email sent to ${userEmail} for order ${orderId}`);
        return true;
    } catch (error) {
        console.error(`Error sending rating email to ${userEmail} for order ${orderId}:`, error);
        return false;
    }
};

const sendVerificationEmail = async (userEmail, verificationCode) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: 'Verify Your Account - Babobamboo',
        html: `
            <p>Dear Customer,</p>
            <p>Thank you for registering with us! To complete your registration and activate your account, please use the following verification code:</p>
            <h3>${verificationCode}</h3>
            <p>Please enter this code on the verification page to proceed.</p>
            <p>If you did not register for an account, please ignore this email.</p>
            <p>Sincerely,</p>
            <p>The Team</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error(`Error sending verification email to ${userEmail}:`, error);
        return false;
    }
};

module.exports = {
    sendRatingEmail,
    sendVerificationEmail,
};
