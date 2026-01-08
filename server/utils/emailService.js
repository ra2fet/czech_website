const nodemailer = require('nodemailer');
const i18n = require('./i18n');

// Create a transporter using your email service details
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Add timeout and retries for reliability
    connectionTimeout: 10000,
    greetingTimeout: 5000,
});

/**
 * Send a verification email to a new user
 * @param {string} userEmail 
 * @param {string} verificationCode 
 * @param {string} language 'en' or 'nl'
 */
const sendVerificationEmail = async (userEmail, verificationCode, language = 'en') => {
    // Determine language-specific content
    const isDutch = language === 'nl';

    const subject = isDutch
        ? 'Verifieer uw account - Babo Bamboo'
        : 'Verify Your Account - Babo Bamboo';

    // Premium HTML Template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f8f8f8; }
                .content { padding: 30px 0; }
                .code-container { text-align: center; margin: 30px 0; }
                .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2c3e50; padding: 15px 30px; background: #f0f3f6; border-radius: 5px; display: inline-block; }
                .footer { text-align: center; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
                .brand { color: #27ae60; font-weight: bold; font-size: 24px; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <a href="https://babonederland.com" class="brand">BABO BAMBOO</a>
                </div>
                <div class="content">
                    <h2>${isDutch ? 'Welkom!' : 'Welcome!'}</h2>
                    <p>${isDutch
            ? 'Bedankt voor uw registratie bij ons! Gebruik de volgende verificatiecode om uw registratie te voltooien en uw account te activeren:'
            : 'Thank you for registering with us! To complete your registration and activate your account, please use the following verification code:'}</p>
                    
                    <div class="code-container">
                        <div class="code">${verificationCode}</div>
                    </div>
                    
                    <p>${isDutch
            ? 'Voer deze code in op de verificatiepagina om verder te gaan.'
            : 'Please enter this code on the verification page to proceed.'}</p>
                    
                    <p>${isDutch
            ? 'Als u zich niet heeft geregistreerd voor een account, kunt u deze e-mail negeren.'
            : 'If you did not register for an account, please ignore this email.'}</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Babo Bamboo. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: userEmail,
        subject: subject,
        html: htmlContent,
        text: `${isDutch ? 'Code' : 'Code'}: ${verificationCode}`, // Plain text fallback
        headers: {
            'X-Mailer': 'Nodemailer Babobambo Verification code',
            'X-Priority': '3 (Normal)',
        }
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${userEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending verification email to ${userEmail}:`, error);
        throw error; // Rethrow to let the caller handle it
    }
};

const sendRatingEmail = async (userEmail, orderId, ratingLink, language = 'en') => {
    const isDutch = language === 'nl';

    const subject = isDutch
        ? 'We horen graag uw feedback! - Babo Bamboo'
        : 'We\'d love your feedback! - Babo Bamboo';

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: userEmail,
        subject: subject,
        html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2>${isDutch ? 'Bedankt voor uw aankoop!' : 'Thank you for your purchase!'}</h2>
                <p>${isDutch
                ? 'We hopen dat u geniet van uw nieuwe producten. Uw feedback helpt ons enorm.'
                : 'We hope you are enjoying your new products. Your feedback helps us improve.'}</p>
                <p><a href="${ratingLink}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    ${isDutch ? 'Beoordeel uw bestelling' : 'Rate Your Order'}
                </a></p>
            </div>
        `,
        headers: {
            'X-Mailer': 'Nodemailer Babobambo Rating Service',
            'X-Priority': '3 (Normal)',
        }
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`Error sending rating email:`, error);
        throw error;
    }
};

module.exports = {
    sendRatingEmail,
    sendVerificationEmail,
};

