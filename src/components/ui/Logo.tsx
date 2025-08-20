import { motion } from 'framer-motion';

interface LogoProps {
  isScrolled: boolean;
  isFooter?: boolean;
}

const Logo = ({ isScrolled, isFooter = false }: LogoProps) => {
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <img 
        src="./balogo2.png" 
        alt="Company Logo" 
        className={`transition-all duration-300 ${
          isScrolled ? 'h-8' : 'h-10'
        } w-auto object-contain`}
      />
    </motion.div>
  );
};

export default Logo;
