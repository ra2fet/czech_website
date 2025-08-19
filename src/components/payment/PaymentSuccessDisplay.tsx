import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import Confetti from 'react-confetti';
import useWindowSize from '../../hooks/useWindowSize';

interface PaymentSuccessDisplayProps {
  onClose: () => void;
}

export const PaymentSuccessDisplay = ({ onClose }: PaymentSuccessDisplayProps) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
      onClose(); // Close the sidebar after a delay
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="min-h-full flex items-center justify-center relative overflow-hidden">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-auto p-8 relative z-10"
      >
        <div className="bg-white rounded-xl shadow-2xl p-10 text-center transform transition-all duration-300 hover:scale-105">
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <CheckCircle size={80} className="text-green-500" />
          </motion.div>
          
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Your order has been placed successfully. Thank you for your purchase!
          </p>
          
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
