import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface CartIconProps {
  onClick: () => void;
  isScrolled: boolean;
}

export const CartIcon = ({ onClick, isScrolled }: CartIconProps) => {
  const { state } = useCart();

  return (
    <motion.button
      onClick={onClick}
      className={`relative p-2 rounded-lg transition-colors ${
        isScrolled 
          ? 'text-accent-900 hover:bg-gray-100' 
          : 'text-white hover:bg-white/20'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <ShoppingCart size={24} />
      
      {/* Cart item count badge */}
      {state.itemCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-secondary-500 text-accent-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
        >
          {state.itemCount > 99 ? '99+' : state.itemCount}
        </motion.span>
      )}
    </motion.button>
  );
};