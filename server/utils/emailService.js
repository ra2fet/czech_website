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

/**
 * Send an order confirmation email to the buyer
 * @param {string} userEmail 
 * @param {object} orderData { orderId, totalAmount, items, address, customerName }
 * @param {string} language 'en' or 'nl'
 */
const sendOrderConfirmationEmail = async (userEmail, orderData, language = 'en') => {
    const isDutch = language === 'nl';
    const { orderId, totalAmount, items, address, customerName } = orderData;

    const subject = isDutch
        ? `Bestelgegevens #${orderId} - Babo Bamboo`
        : `Order Confirmation #${orderId} - Babo Bamboo`;

    const currencySymbol = '€'; // Defaulting to Euro as per previous project context

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name || 'Product'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${currencySymbol}${parseFloat(item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff; }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #27ae60; }
                .content { padding: 30px 0; }
                .invoice-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .status-badge { background: #e8f5e9; color: #2e7d32; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
                .footer { text-align: center; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
                .brand { color: #27ae60; font-weight: bold; font-size: 28px; text-decoration: none; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #f8f8f8; text-align: left; padding: 10px; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="brand">BABO BAMBOO</div>
                </div>
                <div class="content">
                    <h2>${isDutch ? 'Bedankt voor uw bestelling!' : 'Thank you for your order!'}</h2>
                    <p>${isDutch ? `Beste ${customerName},` : `Dear ${customerName},`}</p>
                    <p>${isDutch
            ? 'Uw betaling is succesvol ontvangen en uw bestelling is bevestigd.'
            : 'Your payment has been successfully received and your order is confirmed.'}</p>
                    
                    <div class="status-badge">
                        ${isDutch ? 'Status: Wordt voorbereid' : 'Status: Being prepared'}
                    </div>

                    <div class="invoice-box">
                        <h3 style="margin-top: 0;">${isDutch ? 'Factuur Gegevens' : 'Invoice Details'}</h3>
                        <p><strong>${isDutch ? 'Bestelnummer' : 'Order ID'}:</strong> #${orderId}</p>
                        <p><strong>${isDutch ? 'Datum' : 'Date'}:</strong> ${new Date().toLocaleDateString()}</p>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>${isDutch ? 'Product' : 'Product'}</th>
                                    <th style="text-align: center;">${isDutch ? 'Aantal' : 'Qty'}</th>
                                    <th style="text-align: right;">${isDutch ? 'Prijs' : 'Price'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">${isDutch ? 'Totaal' : 'Total'}</td>
                                    <td style="padding: 10px; font-weight: bold; text-align: right; color: #27ae60; font-size: 18px;">${currencySymbol}${parseFloat(totalAmount).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div style="margin-top: 20px;">
                        <h4>${isDutch ? 'Verzendadres' : 'Shipping Address'}</h4>
                        <p style="color: #666; font-style: italic;">
                            ${address.street_name} ${address.house_number}<br>
                            ${address.postcode} ${address.city}<br>
                            ${address.province}
                        </p>
                    </div>

                    <p>${isDutch
            ? 'We laten het u weten zodra uw bestelling is verzonden.'
            : 'We will notify you as soon as your order has been shipped.'}</p>
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
        headers: {
            'X-Mailer': 'Nodemailer Babobambo Order Service',
            'X-Priority': '2 (High)',
        }
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Order confirmation email sent to ${userEmail} for order #${orderId}`);
        return true;
    } catch (error) {
        console.error(`Error sending order confirmation email:`, error);
        return false;
    }
};

/**
 * Send an order status update email to the buyer
 * @param {string} userEmail 
 * @param {object} statusData { orderId, status, rejectionReason, customerName }
 * @param {string} language 'en' or 'nl'
 */
const sendOrderStatusUpdateEmail = async (userEmail, statusData, language = 'en') => {
    const isDutch = language === 'nl';
    const { orderId, status, rejectionReason, customerName } = statusData;

    const statusMap = {
        'prepared': isDutch ? 'Voorbereid' : 'Prepared',
        'on the way': isDutch ? 'Onderweg' : 'On the way',
        'completed': isDutch ? 'Voltooid' : 'Completed',
        'rejected': isDutch ? 'Geweigerd' : 'Rejected'
    };

    const statusLabel = statusMap[status] || status;

    const subject = isDutch
        ? `Bestelling #${orderId} Status Update - Babo Bamboo`
        : `Order #${orderId} Status Update - Babo Bamboo`;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff; }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #27ae60; }
                .content { padding: 30px 0; }
                .status-badge { background: #e8f5e9; color: #2e7d32; padding: 10px 20px; border-radius: 30px; font-weight: bold; display: inline-block; margin: 20px 0; font-size: 18px; }
                .rejected-badge { background: #ffebee; color: #c62828; }
                .footer { text-align: center; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
                .brand { color: #27ae60; font-weight: bold; font-size: 28px; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="brand">BABO BAMBOO</div>
                </div>
                <div class="content">
                    <h2>${isDutch ? 'Update over uw bestelling' : 'Update about your order'}</h2>
                    <p>${isDutch ? `Beste ${customerName},` : `Dear ${customerName},`}</p>
                    <p>${isDutch
            ? `De status van uw bestelling #${orderId} is bijgewerkt:`
            : `The status of your order #${orderId} has been updated:`}</p>
                    
                    <div class="status-badge ${status === 'rejected' ? 'rejected-badge' : ''}">
                        ${statusLabel}
                    </div>

                    ${status === 'rejected' && rejectionReason ? `
                        <div style="background: #fff3f3; padding: 15px; border-radius: 8px; border-left: 4px solid #c62828; margin: 10px 0;">
                            <p style="margin: 0; color: #c62828;"><strong>${isDutch ? 'Reden voor afwijzing:' : 'Reason for rejection:'}</strong></p>
                            <p style="margin: 5px 0 0 0;">${rejectionReason}</p>
                        </div>
                    ` : ''}

                    <p>${isDutch
            ? 'U kunt uw bestelling volgen via uw dashboard op onze website.'
            : 'You can track your order via your dashboard on our website.'}</p>
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
        headers: {
            'X-Mailer': 'Nodemailer Babobambo Status Service',
            'X-Priority': '2 (High)',
        }
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`Error sending status update email:`, error);
        return false;
    }
};

module.exports = {
    sendRatingEmail,
    sendVerificationEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail,
};

