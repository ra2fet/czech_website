// server/routes/featureSettings.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

// Get feature settings
router.get('/', async (req, res) => {
  try {
    const [settings] = await db.promise().query('SELECT * FROM feature_settings WHERE id = 1');

    if (settings.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        enableTaxPurchase: true,
        enableShippingByPriceZone: true,
        enableDutchLanguage: true,
        enableFourPartAddress: true,
        enableProvincesList: true,
        enableNewsMarquee: true,
        enableDiscountCoupons: true,
        enableProductOffers: true,
        enableOrderRating: true,
        enableAutoRatingEmail: true,
        enableRatingLinkAfter3Days: true,
        enableAccountingDashboard: true,
        enableDataCharts: true,
        enableTopProductsAnalytics: true,
        enableSalesReporting: true,
        enableUserRegistration: true,
        enableCustomerAccounts: true,
        enableCompanyAccounts: true,
        enableEmailSubscriptionPopup: true,
        enableCustomerDashboard: true,
        enableCompanyDashboard: true,
        enableMultipleAddresses: true,
        enableWholesaleProducts: true,
        enableCompanyOnlyWholesale: true,
        enableEmailVerification: true,
        enableVerificationCode: true,
        enableActivationLink: true,
        enableCompanyNameField: true,
        enableLicenseNumberField: true,
        enableCompanyApproval: true,
        enableAdminApprovalRequired: true,
        enableRestrictedCompanyCart: true,
        enableWholesaleRetailSeparation: true,
        enableContactForms: true,
        enableJobApplications: true,
        enableOrderCreation: true,
        enableUnpaidSiteLock: false,
      };
      return res.json(defaultSettings);
    }

    res.json(settings[0]);
  } catch (error) {
    console.error('Error fetching feature settings:', error);
    res.status(500).json({ error: 'Failed to fetch feature settings' });
  }
});

// Update feature settings
router.put('/', authenticateToken, adminProtect, async (req, res) => {
  try {
    const settings = req.body;

    // Check if settings exist
    const [existingSettings] = await db.promise().query('SELECT id FROM feature_settings WHERE id = 1');

    if (existingSettings.length === 0) {
      // Insert new settings
      await db.promise().query(
        `INSERT INTO feature_settings (
          id, enableTaxPurchase, enableShippingByPriceZone, enableDutchLanguage, 
          enableFourPartAddress, enableProvincesList, enableNewsMarquee, 
          enableDiscountCoupons, enableProductOffers, enableOrderRating, 
          enableAutoRatingEmail, enableRatingLinkAfter3Days, enableAccountingDashboard, 
          enableDataCharts, enableTopProductsAnalytics, enableSalesReporting, 
          enableUserRegistration, enableCustomerAccounts, enableCompanyAccounts, 
          enableEmailSubscriptionPopup, enableCustomerDashboard, enableCompanyDashboard, 
          enableMultipleAddresses, enableWholesaleProducts, enableCompanyOnlyWholesale, 
          enableEmailVerification, enableVerificationCode, enableActivationLink, 
          enableCompanyNameField, enableLicenseNumberField, enableCompanyApproval, 
          enableAdminApprovalRequired, enableRestrictedCompanyCart, enableWholesaleRetailSeparation,
          enableUnpaidSiteLock
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.enableTaxPurchase, settings.enableShippingByPriceZone, settings.enableDutchLanguage,
          settings.enableFourPartAddress, settings.enableProvincesList, settings.enableNewsMarquee,
          settings.enableDiscountCoupons, settings.enableProductOffers, settings.enableOrderRating,
          settings.enableAutoRatingEmail, settings.enableRatingLinkAfter3Days, settings.enableAccountingDashboard,
          settings.enableDataCharts, settings.enableTopProductsAnalytics, settings.enableSalesReporting,
          settings.enableUserRegistration, settings.enableCustomerAccounts, settings.enableCompanyAccounts,
          settings.enableEmailSubscriptionPopup, settings.enableCustomerDashboard, settings.enableCompanyDashboard,
          settings.enableMultipleAddresses, settings.enableWholesaleProducts, settings.enableCompanyOnlyWholesale,
          settings.enableEmailVerification, settings.enableVerificationCode, settings.enableActivationLink,
          settings.enableCompanyNameField, settings.enableLicenseNumberField, settings.enableCompanyApproval,
          settings.enableAdminApprovalRequired, settings.enableRestrictedCompanyCart, settings.enableWholesaleRetailSeparation,
          settings.enableUnpaidSiteLock
        ]
      );
    } else {
      // Update existing settings
      await db.promise().query(
        `UPDATE feature_settings SET 
          enableTaxPurchase = ?, enableShippingByPriceZone = ?, enableDutchLanguage = ?, 
          enableFourPartAddress = ?, enableProvincesList = ?, enableNewsMarquee = ?, 
          enableDiscountCoupons = ?, enableProductOffers = ?, enableOrderRating = ?, 
          enableAutoRatingEmail = ?, enableRatingLinkAfter3Days = ?, enableAccountingDashboard = ?, 
          enableDataCharts = ?, enableTopProductsAnalytics = ?, enableSalesReporting = ?, 
          enableUserRegistration = ?, enableCustomerAccounts = ?, enableCompanyAccounts = ?, 
          enableEmailSubscriptionPopup = ?, enableCustomerDashboard = ?, enableCompanyDashboard = ?, 
          enableMultipleAddresses = ?, enableWholesaleProducts = ?, enableCompanyOnlyWholesale = ?, 
          enableEmailVerification = ?, enableVerificationCode = ?, enableActivationLink = ?, 
          enableCompanyNameField = ?, enableLicenseNumberField = ?, enableCompanyApproval = ?, 
          enableAdminApprovalRequired = ?, enableRestrictedCompanyCart = ?, enableWholesaleRetailSeparation = ?,
          enableUnpaidSiteLock = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`,
        [
          settings.enableTaxPurchase, settings.enableShippingByPriceZone, settings.enableDutchLanguage,
          settings.enableFourPartAddress, settings.enableProvincesList, settings.enableNewsMarquee,
          settings.enableDiscountCoupons, settings.enableProductOffers, settings.enableOrderRating,
          settings.enableAutoRatingEmail, settings.enableRatingLinkAfter3Days, settings.enableAccountingDashboard,
          settings.enableDataCharts, settings.enableTopProductsAnalytics, settings.enableSalesReporting,
          settings.enableUserRegistration, settings.enableCustomerAccounts, settings.enableCompanyAccounts,
          settings.enableEmailSubscriptionPopup, settings.enableCustomerDashboard, settings.enableCompanyDashboard,
          settings.enableMultipleAddresses, settings.enableWholesaleProducts, settings.enableCompanyOnlyWholesale,
          settings.enableEmailVerification, settings.enableVerificationCode, settings.enableActivationLink,
          settings.enableCompanyNameField, settings.enableLicenseNumberField, settings.enableCompanyApproval,
          settings.enableAdminApprovalRequired, settings.enableRestrictedCompanyCart, settings.enableWholesaleRetailSeparation,
          settings.enableUnpaidSiteLock
        ]
      );
    }

    res.json({ message: 'Feature settings updated successfully' });
  } catch (error) {
    console.error('Error updating feature settings:', error);
    res.status(500).json({ error: 'Failed to update feature settings' });
  }
});

module.exports = router;