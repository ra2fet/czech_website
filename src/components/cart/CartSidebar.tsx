import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { PaymentForm } from '../payment/PaymentForm';
import { PaymentSuccessDisplay } from '../payment/PaymentSuccessDisplay';
import toast from 'react-hot-toast'; // Import toast
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccessDisplay, setShowSuccessDisplay] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false); // New state for sign-in prompt


  const handlePaymentSuccess = () => {
    clearCart();
    setShowPayment(false);
    setShowSuccessDisplay(true);
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again.');
  };

  const handleCheckoutClick = () => {
    if (!user) {
      setShowSignInPrompt(true);
    } else {
      setShowPayment(true);
    }
  };

  const handleSignInRedirect = () => {
    setShowSignInPrompt(false);
    onClose(); // Close cart sidebar
    navigate('/signin'); // Redirect to sign-in page
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-lg bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center">
                <ShoppingCart size={24} className="text-blue-600 mr-3" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Cart</h2>
                  {state.itemCount > 0 && (
                    <span className="text-sm text-gray-500">{state.itemCount} items</span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Main Content Area */}
            {showSuccessDisplay ? (
              <div className="flex-1 min-h-0">
                <PaymentSuccessDisplay
                  onClose={() => {
                    setShowSuccessDisplay(false);
                    onClose();
                  }}
                />
              </div>
            ) : showPayment ? (
              <div className="flex-1 min-h-0">
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onBack={() => setShowPayment(false)}
                  couponCode={state.couponCode}
                   couponId={state.couponId} 
                  taxFee={state.taxFee}
                  shippingFee={state.shippingFee}
                  discount={state.discount}
                />
              </div>
            ) : (
              <>
                {/* Cart Content */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
                  {state.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart size={32} className="opacity-50" />
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">Your cart is empty</h3>
                      <p className="text-sm text-center">Add some amazing products to get started on your shopping journey</p>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6 space-y-4">
                      {state.items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-sm flex-shrink-0"
                              />
                              <span
                                className={`absolute -top-2 -right-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.type === 'wholesale'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {item.type === 'wholesale' ? 'Wholesale' : 'Retail'}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900 text-base leading-tight pr-2">
                                  {item.name}
                                </h3>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-full flex-shrink-0"
                                  title="Remove item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-lg font-bold text-blue-600">
                                    ${Number(item?.price).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500">per unit</p>
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center bg-gray-50 rounded-xl p-1">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200 disabled:opacity-50"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <div className="px-4 py-1 min-w-[50px] text-center">
                                    <span className="font-bold text-gray-900">{item.quantity}</span>
                                  </div>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900">
                                    ${(Number(item.price) * item.quantity).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-500">total</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {state.items.length > 0 && (
                  <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 sticky bottom-0 z-10">
                    <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">${state.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                        <span>Total</span>
                        <span className="text-blue-600">${state.subtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleCheckoutClick}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <span className="text-lg">Checkout • ${state.subtotal.toFixed(2)}</span>
                      </button>
                      <button
                        onClick={clearCart}
                        className="w-full text-gray-600 hover:text-red-600 transition-colors py-2 text-sm font-medium"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Sign-in Prompt Dialog */}
          {showSignInPrompt && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm mx-auto text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sign In Required</h3>
                <p className="text-gray-600 mb-6">
                  You need to sign in to proceed with checkout.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleSignInRedirect}
                    className="px-5 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowSignInPrompt(false)}
                    className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
