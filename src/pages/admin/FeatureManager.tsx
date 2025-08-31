
// src/pages/admin/FeatureManager.tsx

import React, { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import config from '../../config';

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
}

export function FeatureManager() {
  const [features, setFeatures] = useState<FeatureSettings>({
    // Tax and Billing Features
    enableTaxPurchase: true,
    enableShippingByPriceZone: true,
    
    // Language and Localization
    enableDutchLanguage: true,
    enableFourPartAddress: true,
    enableProvincesList: true,
    
    // Site Features
    enableNewsMarquee: true,
    enableDiscountCoupons: true,
    enableProductOffers: true,
    
    // Order and Rating System
    enableOrderRating: true,
    enableAutoRatingEmail: true,
    enableRatingLinkAfter3Days: true,
    
    // Dashboard and Analytics
    enableAccountingDashboard: true,
    enableDataCharts: true,
    enableTopProductsAnalytics: true,
    enableSalesReporting: true,
    
    // User Management
    enableUserRegistration: true,
    enableCustomerAccounts: true,
    enableCompanyAccounts: true,
    enableEmailSubscriptionPopup: true,
    
    // Customer/Company Features
    enableCustomerDashboard: true,
    enableCompanyDashboard: true,
    enableMultipleAddresses: true,
    enableWholesaleProducts: true,
    enableCompanyOnlyWholesale: true,
    
    // Email Verification
    enableEmailVerification: true,
    enableVerificationCode: true,
    enableActivationLink: true,
    
    // Company Features
    enableCompanyNameField: true,
    enableLicenseNumberField: true,
    enableCompanyApproval: true,
    enableAdminApprovalRequired: true,
    
    // Cart Features
    enableRestrictedCompanyCart: true,
    enableWholesaleRetailSeparation: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFeatureSettings();
  }, []);

  const loadFeatureSettings = async () => {
    setLoading(true);
    try {
      const response = await config.axios.get('/admin/feature-settings');
      setFeatures(response.data);
    } catch (error) {
      console.error('Error loading feature settings:', error);
      toast.info('Using default feature settings');
    } finally {
      setLoading(false);
    }
  };

  const saveFeatureSettings = async () => {
    setSaving(true);
    try {
      await config.axios.put('/admin/feature-settings', features);
      toast.success('Feature settings saved successfully!');
    } catch (error) {
      console.error('Error saving feature settings:', error);
      toast.error('Failed to save feature settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (key: keyof FeatureSettings) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const FeatureToggle = ({ 
    label, 
    description, 
    featureKey, 
    arabicLabel 
  }: { 
    label: string;
    description: string;
    featureKey: keyof FeatureSettings;
    arabicLabel: string;
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{label}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <p className="text-sm text-blue-600 mt-1" style={{ direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
            {arabicLabel}
          </p>
        </div>
        <button
          onClick={() => toggleFeature(featureKey)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            features[featureKey] ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              features[featureKey] ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Management</h1>
          <p className="text-gray-600 mt-2">Enable or disable features across the platform</p>
        </div>
        <button
          onClick={saveFeatureSettings}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tax and Billing Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Tax & Billing Features</h2>
        
        <FeatureToggle
          label="Purchase Tax System"
          description="Enable tax calculations for invoices and accounts"
          arabicLabel="اضافة ضريبية شراء للفواتير والحسابات"
          featureKey="enableTaxPurchase"
        />
        
        <FeatureToggle
          label="Shipping by Price Zone"
          description="Enable delivery charges based on price zones"
          arabicLabel="اضافة رسم التوصيل حسب المجال السعري"
          featureKey="enableShippingByPriceZone"
        />
      </div>

      {/* Language and Localization */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Language & Localization</h2>
        
        <FeatureToggle
          label="Dutch Language Support"
          description="Enable Dutch language for the website"
          arabicLabel="اضافة اللغة الهولندية للموقع"
          featureKey="enableDutchLanguage"
        />
        
        <FeatureToggle
          label="Four-Part Address System"
          description="Split address into city, province, house number, postal code"
          arabicLabel="تقسيم العنوان لاربع اقسام مع اضافة قائمة معرفة مسبقا ل province"
          featureKey="enableFourPartAddress"
        />
      </div>

      {/* Site Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Site Features</h2>
        
        <FeatureToggle
          label="News Marquee"
          description="Enable news ticker/marquee on the website"
          arabicLabel="برمجة الشريط الاخباري للموقع"
          featureKey="enableNewsMarquee"
        />
        
        <FeatureToggle
          label="Discount Coupons"
          description="Enable creation of discount coupons for invoices and cart"
          arabicLabel="اضافة ميزة انشاء كوبونات خصم للفواتير وربطها بالسلة"
          featureKey="enableDiscountCoupons"
        />
        
        <FeatureToggle
          label="Product Offers"
          description="Enable product offers page"
          arabicLabel="برمجة صفحة عروض المنتجات"
          featureKey="enableProductOffers"
        />
      </div>

      {/* Order and Rating System */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Order & Rating System</h2>
        
        <FeatureToggle
          label="Order Rating System"
          description="Enable order rating and review system"
          arabicLabel="عمل سيستم تقييم الطلبيات"
          featureKey="enableOrderRating"
        />
        
        <FeatureToggle
          label="Automated Rating Emails"
          description="Automate rating email sending process"
          arabicLabel="اتمتة عملية الارسال وبرمجة الرابط للتقييم"
          featureKey="enableAutoRatingEmail"
        />
        
        <FeatureToggle
          label="3-Day Rating Link"
          description="Send rating link after 3 days"
          arabicLabel="لتصبح بعد ٣ أيام"
          featureKey="enableRatingLinkAfter3Days"
        />
      </div>

      {/* Dashboard and Analytics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Dashboard & Analytics</h2>
        
        <FeatureToggle
          label="Accounting Dashboard"
          description="Convert dashboard to accounting program with charts"
          arabicLabel="تحويل لوحة التحكم لبرنامج محاسبي يعتمد على مخططات بيانية"
          featureKey="enableAccountingDashboard"
        />
        
        <FeatureToggle
          label="Top Products Analytics"
          description="Show most requested products analytics"
          arabicLabel="اظهار اكثر منتجات طلبا"
          featureKey="enableTopProductsAnalytics"
        />
        
        <FeatureToggle
          label="Sales Reporting"
          description="Daily, monthly, yearly sales totals"
          arabicLabel="مجموع المبيعات بشكل يومي - شهري - سنوي"
          featureKey="enableSalesReporting"
        />
      </div>

      {/* User Management */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">User Management</h2>
        
        <FeatureToggle
          label="User Registration System"
          description="Complete user registration system with all features"
          arabicLabel="عمل سيستم تسجيل مستخدمين متكامل بكل مميزاته"
          featureKey="enableUserRegistration"
        />
        
        <FeatureToggle
          label="Customer Accounts"
          description="Enable customer account type"
          arabicLabel="حساب زبون"
          featureKey="enableCustomerAccounts"
        />
        
        <FeatureToggle
          label="Company Accounts"
          description="Enable company account type"
          arabicLabel="حساب شركة"
          featureKey="enableCompanyAccounts"
        />
        
        <FeatureToggle
          label="Email Subscription Popup"
          description="Enable email registration popup"
          arabicLabel="برمجة popup الخاص بتسجيل الايميل"
          featureKey="enableEmailSubscriptionPopup"
        />
      </div>

      {/* Customer/Company Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Customer & Company Features</h2>
        
        <FeatureToggle
          label="Customer Dashboard"
          description="Enable customer control panel to view orders"
          arabicLabel="لوحة تحكم خاصة بالزبون"
          featureKey="enableCustomerDashboard"
        />
        
        <FeatureToggle
          label="Company Dashboard"
          description="Enable company control panel to view orders"
          arabicLabel="لوحة تحكم خاصة بالشركة"
          featureKey="enableCompanyDashboard"
        />
        
        <FeatureToggle
          label="Multiple Addresses"
          description="Allow saving multiple addresses for users"
          arabicLabel="ميزة حفظ اكثر من عنوان لهم"
          featureKey="enableMultipleAddresses"
        />
        
        <FeatureToggle
          label="Wholesale Products"
          description="Enable wholesale products linked to companies only"
          arabicLabel="تعديل المنتجات الخاصة بالجملة و ربطها وقفلها بالشركة فقط"
          featureKey="enableWholesaleProducts"
        />
      </div>

      {/* Email Verification */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Email Verification</h2>
        
        <FeatureToggle
          label="Email Verification"
          description="Enable email verification for registered emails"
          arabicLabel="اضافة ميزة التحقق من الايميل المسجل"
          featureKey="enableEmailVerification"
        />
        
        <FeatureToggle
          label="Verification Code"
          description="Send verification code to email"
          arabicLabel="برمجة عملية ارسال كود للتحقق من الايميل"
          featureKey="enableVerificationCode"
        />
        
        <FeatureToggle
          label="Activation Link"
          description="Send activation link for email verification"
          arabicLabel="رابط تفعيله"
          featureKey="enableActivationLink"
        />
      </div>

      {/* Company Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Company Management</h2>
        
        <FeatureToggle
          label="Company Name Field"
          description="Add company name field for companies"
          arabicLabel="اضافة اسم الشركة"
          featureKey="enableCompanyNameField"
        />
        
        <FeatureToggle
          label="License Number Field"
          description="Add license number field for companies"
          arabicLabel="رقم الرخصة للشركة"
          featureKey="enableLicenseNumberField"
        />
        
        <FeatureToggle
          label="Company Account Approval"
          description="Enable company account activation requiring admin approval"
          arabicLabel="اضافة امكانية تفعيل حساب شركة ليحتاج لموافقة ادمن لتنشيطه"
          featureKey="enableCompanyApproval"
        />
      </div>

      {/* Cart Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Cart Features</h2>
        
        <FeatureToggle
          label="Restricted Company Cart"
          description="Restrict company cart to one type only (wholesale or retail)"
          arabicLabel="حصرا السلة الخاصة بالشركة بنوع واحد اما جملة او مفرق"
          featureKey="enableRestrictedCompanyCart"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={saveFeatureSettings}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-lg"
        >
          <Save className="mr-2 h-5 w-5" />
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}