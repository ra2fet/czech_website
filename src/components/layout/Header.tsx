import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../ui/Logo';
import { CartIcon } from '../cart/CartIcon';
import { CartSidebar } from '../cart/CartSidebar';

interface HeaderProps {
  scrollPosition: number;
}

export const Header = ({ scrollPosition }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    setIsScrolled(scrollPosition > 50);
  }, [scrollPosition]);
  
  useEffect(() => {
    // Close menu when changing routes
    setIsMenuOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Locations', href: '/locations' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        <div className="flex-shrink-0">
          <Link to="/" className="block">
            <Logo isScrolled={isScrolled} />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-6 xl:space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`font-medium transition-colors duration-300 whitespace-nowrap text-sm xl:text-base
                ${location.pathname === item.href 
                  ? (isScrolled 
                      ? 'text-primary-600 border-b-2 border-secondary-500' 
                      : 'text-secondary-500 border-b-2 border-secondary-500 bg-black/20 px-3 py-1 rounded-md backdrop-blur-sm') 
                  : isScrolled ? 'text-accent-900 hover:text-primary-600' : 'text-white hover:text-secondary-400'}
              `}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Cart Icon and Mobile Menu Button */}
        <div className="flex items-center space-x-2">
          <CartIcon onClick={() => setIsCartOpen(true)} isScrolled={isScrolled} />
          
          <button 
            onClick={toggleMenu}
            className={`lg:hidden p-2 ${isScrolled ? 'text-accent-900' : 'text-white'}`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200"
          >
            <div className="container-custom py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block py-2 font-medium ${
                    location.pathname === item.href 
                      ? 'text-primary-600' 
                      : 'text-accent-900 hover:text-primary-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};