-- Feature Settings Table Migration
-- This table stores the feature toggle settings for the application

CREATE TABLE IF NOT EXISTS feature_settings (
    id INT PRIMARY KEY DEFAULT 1,
    
    -- Tax and Billing Features
    enableTaxPurchase BOOLEAN DEFAULT TRUE,
    enableShippingByPriceZone BOOLEAN DEFAULT TRUE,
    
    -- Language and Localization
    enableDutchLanguage BOOLEAN DEFAULT TRUE,
    enableFourPartAddress BOOLEAN DEFAULT TRUE,
    enableProvincesList BOOLEAN DEFAULT TRUE,
    
    -- Site Features
    enableNewsMarquee BOOLEAN DEFAULT TRUE,
    enableDiscountCoupons BOOLEAN DEFAULT TRUE,
    enableProductOffers BOOLEAN DEFAULT TRUE,
    
    -- Order and Rating System
    enableOrderRating BOOLEAN DEFAULT TRUE,
    enableAutoRatingEmail BOOLEAN DEFAULT TRUE,
    enableRatingLinkAfter3Days BOOLEAN DEFAULT TRUE,
    
    -- Dashboard and Analytics
    enableAccountingDashboard BOOLEAN DEFAULT TRUE,
    enableDataCharts BOOLEAN DEFAULT TRUE,
    enableTopProductsAnalytics BOOLEAN DEFAULT TRUE,
    enableSalesReporting BOOLEAN DEFAULT TRUE,
    
    -- User Management
    enableUserRegistration BOOLEAN DEFAULT TRUE,
    enableCustomerAccounts BOOLEAN DEFAULT TRUE,
    enableCompanyAccounts BOOLEAN DEFAULT TRUE,
    enableEmailSubscriptionPopup BOOLEAN DEFAULT TRUE,
    
    -- Customer/Company Features
    enableCustomerDashboard BOOLEAN DEFAULT TRUE,
    enableCompanyDashboard BOOLEAN DEFAULT TRUE,
    enableMultipleAddresses BOOLEAN DEFAULT TRUE,
    enableWholesaleProducts BOOLEAN DEFAULT TRUE,
    enableCompanyOnlyWholesale BOOLEAN DEFAULT TRUE,
    
    -- Email Verification
    enableEmailVerification BOOLEAN DEFAULT TRUE,
    enableVerificationCode BOOLEAN DEFAULT TRUE,
    enableActivationLink BOOLEAN DEFAULT TRUE,
    
    -- Company Features
    enableCompanyNameField BOOLEAN DEFAULT TRUE,
    enableLicenseNumberField BOOLEAN DEFAULT TRUE,
    enableCompanyApproval BOOLEAN DEFAULT TRUE,
    enableAdminApprovalRequired BOOLEAN DEFAULT TRUE,
    
    -- Cart Features
    enableRestrictedCompanyCart BOOLEAN DEFAULT TRUE,
    enableWholesaleRetailSeparation BOOLEAN DEFAULT TRUE,
    
    -- Additional Features
    enableContactForms BOOLEAN DEFAULT TRUE,
    enableJobApplications BOOLEAN DEFAULT TRUE,
    enableOrderCreation BOOLEAN DEFAULT TRUE,
    
    -- Admin Controls
    enableUnpaidSiteLock BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Ensure only one row exists
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings if table is empty
INSERT IGNORE INTO feature_settings (id) VALUES (1);