import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

export const CtaSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-20 rafatbg text-white">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Ready to Grow Your Business Sustainably?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl opacity-90 mb-8"
          >
            Our sustainable solutions are designed to help your business reach new heights.
            Join thousands of satisfied customers worldwide.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              to="/products" 
              className="bg-secondary-500 text-accent-900 px-8 py-4 rounded-lg font-bold hover:bg-secondary-400 transition-all duration-300 transform hover:scale-105"
            >
              Explore Products
            </Link>
            <Link 
              to="/contact" 
              className="bg-transparent border-2 border-secondary-500 text-secondary-500 px-8 py-4 rounded-lg font-bold hover:bg-secondary-500 hover:text-accent-900 transition-all duration-300"
            >
              Contact Sales
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};