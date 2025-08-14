import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { PaymentForm } from '../payment/PaymentForm';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const [showPayment, setShowPayment] = useState(false);

  // Handle payment success
  const handlePaymentSuccess = () => {
    clearCart();
    setShowPayment(false);
    onClose();
  };

  // Handle payment error
  const handlePaymentError = (error: Error) => {
    console.error('Payment failed:', error);
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
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <ShoppingCart size={24} className="text-primary-600 mr-2" />
                <h2 className="text-xl font-bold">Shopping Cart</h2>
                {state.itemCount > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                    {state.itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto">
              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Your cart is empty</p>
                  <p className="text-sm">Add some products to get started</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {state.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="font-semibold text-gray-900 text-lg leading-tight">{item.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'wholesale' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type === 'wholesale' ? 'Wholesale' : 'Retail'}
                            </span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-full"
                              title="Remove item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-primary-600">${Number(item?.price).toFixed(2)}</p>
                            <div className="text-sm text-gray-500">per unit</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center bg-gray-50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 rounded-md bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <div className="px-4 py-2 min-w-[60px] text-center">
                            <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                            <div className="text-xs text-gray-500">qty</div>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 rounded-md bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            ${(Number(item.price) * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">total</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
                {/* Total */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal ({state.itemCount} items):</span>
                    <span className="text-lg font-semibold">${state.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary-600">${state.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!showPayment ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowPayment(true)}
                      className="w-full btn btn-primary text-lg py-4 font-bold"
                    >
                      Proceed to Checkout • ${state.total.toFixed(2)}
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full text-gray-600 hover:text-red-600 transition-colors py-2 text-sm"
                    >
                      Clear Cart
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <PaymentForm
                      amount={Math.round(state.total * 100)} // Convert to cents
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                    <button
                      onClick={() => setShowPayment(false)}
                      className="w-full text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      ← Back to Cart
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
