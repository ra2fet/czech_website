import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import config from '../../config';

interface PaymentFormProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
}

interface FormData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export const PaymentForm = ({ amount, onSuccess, onError, onBack }: PaymentFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: { items: cartItems, total: totalAmount }, clearCart } = useCart();
  const [formData, setFormData] = useState<FormData>({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
    email: '',
    phoneNumber: '',
    address: ''
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Basic validation
    const requiredFields = ['cardNumber', 'expMonth', 'expYear', 'cvc', 'name', 'email', 'phoneNumber', 'address'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof FormData]);

    if (missingFields.length > 0) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await config.axios.post('/orders', {
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        totalAmount: totalAmount,
        cartItems: cartItems.map(item => ({
          id: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      });

      clearCart();
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Payment failed. Please try again.');
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            <span className="text-sm font-medium">Back</span>
          </button>
        )}
        <h3 className="text-xl font-bold text-gray-900 flex-grow text-center">
          Checkout
        </h3>
        <div className="flex items-center text-green-600">
          <Lock size={16} className="mr-1" />
          <span className="text-xs font-medium hidden sm:inline">Secure</span>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-6 bg-white">
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2">Order Summary</h4>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Items ({cartItems.length})</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-blue-200">
              <span>Total</span>
              <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-lg">Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Enter your full name"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="your@email.com"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="+1 (555) 123-4567"
                  required
                  aria-required="true"
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                placeholder="Street address, City, State, ZIP code"
                required
                aria-required="true"
              />
            </div>
          </div>

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
                  Month *
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
                  Year *
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
                  CVC *
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
            className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105 disabled:hover:scale-100 ${
              isProcessing ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'
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
                Processing Payment...
              </div>
            ) : (
              <span className="text-lg">
                Complete Payment • ${(amount / 100).toFixed(2)}
              </span>
            )}
          </button>
          <div className="text-center text-xs text-gray-500 flex items-center justify-center">
            <Lock size={12} className="mr-1" />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </div>
      </div>
      </div> {/* This closing div was missing */}
    </>
  );
};
