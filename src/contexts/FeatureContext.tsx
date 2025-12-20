import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import config from '../config';

interface FeatureSettings {
  // Tax and Billing Features
  enableTaxPurchase: boolean;
  enableShippingByPriceZone: boolean;

  // Language and Localization
  enableDutchLanguage: boolean;
  enableFourPartAddress: boolean;
  enableProvincesList: boolean;

  // Site Features
  enableNewsMarquee: boolean;
  enableDiscountCoupons: boolean;
  enableProductOffers: boolean;

  // Order and Rating System
  enableOrderRating: boolean;
  enableAutoRatingEmail: boolean;
  enableRatingLinkAfter3Days: boolean;

  // Dashboard and Analytics
  enableAccountingDashboard: boolean;
  enableDataCharts: boolean;
  enableTopProductsAnalytics: boolean;
  enableSalesReporting: boolean;

  // User Management
  enableUserRegistration: boolean;
  enableCustomerAccounts: boolean;
  enableCompanyAccounts: boolean;
  enableEmailSubscriptionPopup: boolean;

  // Customer/Company Features
  enableCustomerDashboard: boolean;
  enableCompanyDashboard: boolean;
  enableMultipleAddresses: boolean;
  enableWholesaleProducts: boolean;
  enableCompanyOnlyWholesale: boolean;

  // Email Verification
  enableEmailVerification: boolean;
  enableVerificationCode: boolean;
  enableActivationLink: boolean;

  // Company Features
  enableCompanyNameField: boolean;
  enableLicenseNumberField: boolean;
  enableCompanyApproval: boolean;
  enableAdminApprovalRequired: boolean;

  // Cart Features
  enableRestrictedCompanyCart: boolean;
  enableWholesaleRetailSeparation: boolean;

  // Additional Features
  enableContactForms: boolean;
  enableJobApplications: boolean;
  enableOrderCreation: boolean;

  // Admin Controls
  enableUnpaidSiteLock: boolean;
}

interface FeatureContextType {
  features: FeatureSettings;
  loading: boolean;
  refreshFeatures: () => Promise<void>;
  isFeatureEnabled: (feature: keyof FeatureSettings) => boolean;
}

const defaultFeatures: FeatureSettings = {
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

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

interface FeatureProviderProps {
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureSettings>(defaultFeatures);
  const [loading, setLoading] = useState(true);

  const loadFeatures = async () => {
    try {
      const response = await config.axios.get('feature-settings');
      setFeatures(response.data);
    } catch (error) {
      console.error('Error loading feature settings:', error);
      // Keep default features if API call fails
    } finally {
      setLoading(false);
    }
  };

  const refreshFeatures = async () => {
    setLoading(true);
    await loadFeatures();
  };

  const isFeatureEnabled = (feature: keyof FeatureSettings): boolean => {
    return features[feature];
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  return (
    <FeatureContext.Provider value={{
      features,
      loading,
      refreshFeatures,
      isFeatureEnabled
    }}>
      {children}
    </FeatureContext.Provider>
  );
};

// Feature guard component for conditional rendering
interface FeatureGuardProps {
  feature: keyof FeatureSettings;
  children: ReactNode;
  fallback?: ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback = null
}) => {
  const { isFeatureEnabled } = useFeatures();

  return isFeatureEnabled(feature) ? <>{children}</> : <>{fallback}</>;
};