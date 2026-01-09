import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowLeft, MapPin, PlusCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import toast from 'react-hot-toast';
import { useFeatures, FeatureGuard } from '../../contexts/FeatureContext'; // Import feature context
import { useTranslation } from 'react-i18next';

interface PaymentFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
  couponCode: string | null;
  couponId: number | null;
  taxFee: number;
  shippingFee: number;
  discount: number;
}

interface Address {
  id: number;
  address_name: string;
  city: string;
  province: string;
  street_name: string;
  house_number: string;
  postcode: string;
}

interface FormData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}

export const PaymentForm = ({ onSuccess, onError, onBack, couponCode, couponId, taxFee, shippingFee, discount }: PaymentFormProps) => {
  const { user } = useAuth();
  const { state: { items: cartItems, subtotal, couponStatus }, clearCart, applyCoupon, removeCoupon, fetchAndCalculateFees } = useCart();
  const { features } = useFeatures();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
  });
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | ''>('');
  const [newAddress, setNewAddress] = useState({
    address_name: '',
    city: '',
    province: '',
    street_name: '',
    house_number: '',
    postcode: '',
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [hasAttemptedCoupon, setHasAttemptedCoupon] = useState(false); // Track if coupon was attempted
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await config.axios.get(`/user_addresses/${user?.id}`);
      setSavedAddresses(response.data);
      if (response.data.length > 0) {
        setSelectedAddressId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      toast.error('Failed to load addresses.');

    }
  }, [user, setSavedAddresses, setSelectedAddressId]);

  const fetchProvinces = useCallback(async () => {
    try {
      const response = await config.axios.get('provinces');
      setProvinces(response.data);
    } catch (err) {
      console.error('Error fetching provinces:', err);
      toast.error('Failed to load provinces.');
    }
  }, []);

  useEffect(() => {
    setCouponInput(couponCode || '');
    setHasAttemptedCoupon(!!couponCode); // Set initial attempt status
  }, [couponCode]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
    fetchProvinces(); // Fetch provinces when component mounts
    fetchAndCalculateFees();
  }, [user, fetchAndCalculateFees, fetchAddresses, fetchProvinces]);

  useEffect(() => {
    // Show toast based on couponStatus only once after an attempt
    if (couponStatus && hasAttemptedCoupon) {
      if (couponStatus === 'invalid') {
        toast.error('Invalid or expired coupon code.');
      } else if (couponStatus === 'min_cart_value') {
        toast.error(`Coupon requires a minimum cart subtotal value of ${config.currencySymbol}1000.`);
      } else if (couponStatus === 'valid') {
        toast.success(`Coupon "${couponInput}" applied successfully!`);
      }
      setHasAttemptedCoupon(false); // Reset to prevent repeated toasts
    }
  }, [couponStatus, hasAttemptedCoupon, couponInput]);

  const handleAddressSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAddressId(value === 'new' ? 'new' : parseInt(value));
    setShowNewAddressForm(value === 'new');
  };

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    let total = subtotal;

    // Only add tax fee if tax feature is enabled
    if (features.enableTaxPurchase) {
      total += taxFee;
    }

    // Only add shipping fee if shipping feature is enabled
    if (features.enableShippingByPriceZone) {
      total += shippingFee;
    }

    // Only subtract discount if coupon feature is enabled
    if (features.enableDiscountCoupons) {
      total -= discount;
    }

    return total;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Basic validation for payment details
    const requiredPaymentFields = ['cardNumber', 'expMonth', 'expYear', 'cvc'];
    const missingPaymentFields = requiredPaymentFields.filter(field => !formData[field as keyof FormData]);

    if (missingPaymentFields.length > 0) {
      setError('Please fill in all required payment fields.');
      return;
    }

    let finalAddress: Address | null = null;
    let provinceIdToSend: number | null = null;

    if (showNewAddressForm) {
      const requiredNewAddressFields = ['address_name', 'city', 'province', 'street_name', 'house_number', 'postcode'];
      const missingNewAddressFields = requiredNewAddressFields.filter(field => !newAddress[field as keyof typeof newAddress]);
      if (missingNewAddressFields.length > 0) {
        setError('Please fill in all new address fields.');
        return;
      }

      const selectedProvince = provinces.find(p => p.name === newAddress.province);
      if (!selectedProvince) {
        setError('Please select a valid province.');
        return;
      }
      provinceIdToSend = selectedProvince.id;

      finalAddress = { ...newAddress, province: selectedProvince.name } as Address; // Keep province name for local state
    } else if (selectedAddressId && selectedAddressId !== 'new') {
      finalAddress = savedAddresses.find(addr => addr.id === selectedAddressId) || null;
      if (finalAddress) {
        const selectedProvince = provinces.find(p => p.name === finalAddress?.province);
        if (selectedProvince) {
          provinceIdToSend = selectedProvince.id;
        }
      }
    }

    if (!finalAddress) {
      setError('Please select or add a shipping address.');
      return;
    }

    if (!provinceIdToSend) {
      setError('Failed to determine province ID.');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      let addressIdToSend: number | null = null;

      if (showNewAddressForm && user) {
        const addressDataToSend = {
          ...newAddress,
          province_id: provinceIdToSend, // Send province_id instead of province name
        };
        const addressResponse = await config.axios.post(`/user_addresses/${user.id}`, addressDataToSend);
        finalAddress = addressResponse.data;
        addressIdToSend = addressResponse.data.id;
        toast.success('New address saved!');
      } else if (selectedAddressId && selectedAddressId !== 'new') {
        addressIdToSend = selectedAddressId as number;
      }

      if (!addressIdToSend) {
        setError('Failed to determine shipping address ID.');
        setIsProcessing(false);
        return;
      }

      await config.axios.post('/orders', {
        userId: user?.id,
        totalAmount: calculateTotal(),
        addressId: addressIdToSend,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          type: item.type,
        })),
        couponCode: couponCode,
        couponId: couponId, // Include couponId
        taxFee: taxFee,
        shippingFee: shippingFee,
        discount: discount,
      });

      // if (couponCode) {
      //   try {
      //     await config.axios.put(`coupon-codes/use/${couponCode}`);
      //   } catch (couponErr) {
      //     console.error('Error updating coupon usage:', couponErr);
      //     toast.error('Failed to update coupon usage.');
      //   }
      // }
      if (couponId) {
        try {
          await config.axios.put(`coupon-codes/use/${couponId}`);
          console.log(`Incremented uses_count for couponId: ${couponId}`);
        } catch (couponErr) {
          console.error('Error updating coupon usage:', couponErr);
          // toast.error('Failed to update coupon usage.');
        }
      }

      clearCart();
      onSuccess?.();
      toast.success('Order placed successfully!');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Payment failed. Please try again.');
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="flex flex-col min-h-0 h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="mr-1" />
              <span className="text-sm font-medium">{t('dashboard_back_button')}</span>
            </button>
          )}
          <h3 className="text-xl font-bold text-gray-900 flex-grow text-center">
            {t('payment_form_checkout')}
          </h3>
          <div className="flex items-center text-green-600">
            <Lock size={16} className="mr-1" />
            <span className="text-xs font-medium hidden sm:inline">{t('payment_form_secure')}</span>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-6 bg-white">
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <h4 className="font-semibold text-gray-900 mb-2">{t('checkout_order_summary_title')}</h4>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{t('cart_subtotal_label')} ({t('cart_items_count', { count: cartItems.length })})</span>
                <span>{config.currencySymbol}{subtotal.toFixed(2)}</span>
              </div>

              {/* Conditionally show tax fee based on feature toggle */}
              <FeatureGuard feature="enableTaxPurchase">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t('checkout_tax_label')}</span>
                  <span>{config.currencySymbol}{taxFee.toFixed(2)}</span>
                </div>
              </FeatureGuard>

              {/* Conditionally show shipping fee based on feature toggle */}
              <FeatureGuard feature="enableShippingByPriceZone">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t('checkout_shipping_label')}</span>
                  <span>{config.currencySymbol}{shippingFee.toFixed(2)}</span>
                </div>
              </FeatureGuard>

              {/* Conditionally show discount based on coupon feature */}
              <FeatureGuard feature="enableDiscountCoupons">
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{t('checkout_discount_label', { code: couponCode })}</span>
                    <span className="text-red-600">-{config.currencySymbol}{Number(discount).toFixed(0)}</span>
                  </div>
                )}
              </FeatureGuard>

              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-blue-200">
                <span>{t('cart_total_title')}</span>
                <span className="text-blue-600">{config.currencySymbol}{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">{t('checkout_shipping_info_title')}</h4>
              <div>
                <label htmlFor="address-select" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dashboard_address_name_label')} *
                </label>
                <div className="relative">
                  <select
                    id="address-select"
                    name="address-select"
                    value={selectedAddressId}
                    onChange={handleAddressSelectChange}
                    className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm appearance-none"
                    required
                  >
                    <option value="" disabled>{t('checkout_select_province')}</option>
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.address_name} ({address.street_name}, {address.city})
                      </option>
                    ))}
                    <option value="new">{t('checkout_add_new_address')}</option>
                  </select>
                  <MapPin size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {showNewAddressForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50"
                >
                  <h5 className="font-semibold text-gray-800 flex items-center">
                    <PlusCircle size={18} className="mr-2 text-blue-600" /> {t('checkout_add_new_address')}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="address_name" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard_address_name_label')} *
                      </label>
                      <input
                        type="text"
                        id="address_name"
                        name="address_name"
                        value={newAddress.address_name}
                        onChange={handleNewAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder={t('checkout_address_name_placeholder')}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="street_name" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard_street_name_label')} *
                      </label>
                      <input
                        type="text"
                        id="street_name"
                        name="street_name"
                        value={newAddress.street_name}
                        onChange={handleNewAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder={t('checkout_street_placeholder')}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="house_number" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard_house_number_label')} *
                      </label>
                      <input
                        type="text"
                        id="house_number"
                        name="house_number"
                        value={newAddress.house_number}
                        onChange={handleNewAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder={t('checkout_house_number_placeholder')}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard_city_label')} *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={newAddress.city}
                        onChange={handleNewAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder={t('checkout_city_placeholder')}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard_province_label')} *
                      </label>
                      <select
                        id="province"
                        name="province"
                        value={newAddress.province}
                        onChange={(e) => handleNewAddressChange(e as React.ChangeEvent<HTMLSelectElement>)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        required
                      >
                        <option value="">{t('checkout_select_province')}</option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard_postcode_label')} *
                      </label>
                      <input
                        type="text"
                        id="postcode"
                        name="postcode"
                        value={newAddress.postcode}
                        onChange={handleNewAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder={t('checkout_postcode_placeholder')}
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Coupon Code Input - Only show if discount coupons are enabled */}
            <FeatureGuard feature="enableDiscountCoupons">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">{t('payment_form_have_coupon')}</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder={t('payment_form_coupon_placeholder')}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={couponCode !== null} // Disable input when coupon is applied
                  />
                  {couponCode ? (
                    <button
                      onClick={() => {
                        removeCoupon();
                        setCouponInput('');
                        toast.success('Coupon removed.');
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    >
                      {t('payment_form_remove_coupon')}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (couponInput.trim()) {
                          setHasAttemptedCoupon(true); // Mark coupon as attempted
                          await applyCoupon(couponInput);
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      disabled={!couponInput.trim()}
                    >
                      {t('payment_form_apply_coupon')}
                    </button>
                  )}
                </div>
              </div>
            </FeatureGuard>

            {/* Payment Information */}
            <div id="payment-details" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 text-lg">Payment Details</h4>
                <div className="flex items-center space-x-2">
                  <CreditCard size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-500">All major cards</span>
                </div>
              </div>
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    required
                    aria-required="true"
                  />
                  <CreditCard size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="expMonth" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('payment_form_month_label')}
                  </label>
                  <input
                    type="text"
                    id="expMonth"
                    name="expMonth"
                    value={formData.expMonth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-center"
                    placeholder="MM"
                    maxLength={2}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="expYear" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('payment_form_year_label')}
                  </label>
                  <input
                    type="text"
                    id="expYear"
                    name="expYear"
                    value={formData.expYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-center"
                    placeholder="YY"
                    maxLength={2}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('payment_form_cvc_label')}
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    name="cvc"
                    value={formData.cvc}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-center"
                    placeholder="123"
                    maxLength={3}
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">{error}</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 z-10">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105 disabled:hover:scale-100 ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'
                }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('checkout_processing')}
                </div>
              ) : (
                <span className="text-lg">
                  {t('payment_form_complete_payment', { amount: `${config.currencySymbol}${calculateTotal().toFixed(2)}` })}
                </span>
              )}
            </button>
            <div className="text-center text-xs text-gray-500 flex items-center justify-center">
              <Lock size={12} className="mr-1" />
              <span>{t('payment_form_encrypted_notice')}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
