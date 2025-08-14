// src/components/ProductsPage.js
import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Package, ShoppingBag, Truck, Shield, Zap, DollarSign, ChevronDown } from 'lucide-react';
import { PaymentForm } from '../components/payment/PaymentForm';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import config from '../config'; // Import config

export const ProductsPage = () => {
  const [viewMode, setViewMode] = useState('retail');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let data;
      if (config.useSupabase) {
        console.log('Fetching products from Supabase...');
        const { data: supabaseData, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('Supabase response:', { data: supabaseData, error: fetchError });
        if (fetchError) {
          console.error('Supabase error:', fetchError);
          throw new Error(`Database error: ${fetchError.message}`);
        }
        data = supabaseData;
      } else {
        console.log('Fetching products from API...');
        const response = await config.axios.get(config.apiEndpoints.products);
        console.log('API response:', response.data);
        data = response.data;
      }

      if (data && Array.isArray(data)) {
        console.log('Setting products:', data.length, 'items');
        setProducts(data);
      } else {
        console.log('No data received or invalid format');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(`Failed to fetch products: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('Finished loading products');
    }
  };

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
  };

  const toggleProductDetails = (productId) => {
    setSelectedProduct(selectedProduct === productId ? null : productId);
  };

  // Handle adding product to cart
  const handleAddToCart = (product) => {
    const price = viewMode === 'wholesale' ? product.wholesale_price : product.retail_price;

    addItem({
      productId: product.id,
      name: product.name,
      description: product.description,
      image_url: product.image_url,
      price: price,
      type: viewMode,
    });

    toast.success(`${product.name} added to cart (${viewMode})`);
    
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-secondary-800 text-white py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Premium Products</h1>
            <p className="text-xl opacity-90 mb-8">
              Discover our range of high-quality products designed to meet your business needs
              with exceptional performance and reliability.
            </p>
          </div>
        </div>
      </section>

      {/* View Mode Selector */}
      <section className="bg-gray-100 py-6 border-b border-gray-200">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-2xl font-bold mb-4 md:mb-0">Product Catalog</h2>
            <div className="flex">
              <button
                onClick={() => handleToggleViewMode('retail')}
                className={`flex items-center px-4 py-2 rounded-l-md ${
                  viewMode === 'retail'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag size={18} className="mr-2" />
                Retail
              </button>
              <button
                onClick={() => handleToggleViewMode('wholesale')}
                className={`flex items-center px-4 py-2 rounded-r-md ${
                  viewMode === 'wholesale'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package size={18} className="mr-2" />
                Wholesale
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <Truck size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Shipping</h3>
              <p className="text-gray-600">
                {viewMode === 'wholesale'
                  ? 'Dedicated logistics for wholesale orders'
                  : 'Quick delivery to your doorstep'}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <Shield size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                All products undergo rigorous quality testing before shipping
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <DollarSign size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {viewMode === 'wholesale' ? 'Volume Discounts' : 'Competitive Pricing'}
              </h3>
              <p className="text-gray-600">
                {viewMode === 'wholesale'
                  ? 'Significant savings on bulk orders'
                  : 'Premium quality at reasonable prices'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products List */}
      <section ref={ref} className="section-padding bg-gray-50">
        <div className="container-custom">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package size={32} className="text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-yellow-800 mb-4">No Products Available</h2>
              <p className="text-yellow-600 mb-6">
                We're currently updating our product catalog. Please check back soon.
              </p>
              <button
                onClick={fetchProducts}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                Refresh
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="space-y-8"
            >
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="md:flex">
                    <div className="md:w-1/3 h-64 md:h-auto">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center"
                        style={{ display: product.image_url ? 'none' : 'flex' }}
                      >
                        <Package size={48} className="text-primary-600" />
                      </div>
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                          <p className="text-gray-600 mb-4">{product.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">
                            {viewMode === 'wholesale'
                              ? `$${product.wholesale_price}`
                              : `$${product.retail_price}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {viewMode === 'wholesale' ? 'Wholesale price' : 'Per unit'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <button
                          onClick={() => toggleProductDetails(product.id)}
                          className="flex items-center text-primary-600 font-medium hover:text-primary-700 mb-4 sm:mb-0"
                        >
                          {selectedProduct === product.id ? 'Hide Details' : 'View Details'}
                          <ChevronDown
                            size={16}
                            className={`ml-1 transition-transform duration-300 ${
                              selectedProduct === product.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="btn btn-primary"
                        >
                          Add to Cart
                        </button>
                      </div>

                      {/* Product Details */}
                      {selectedProduct === product.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-4 border-t border-gray-200"
                        >
                          <h4 className="text-lg font-bold mb-3">
                            {viewMode === 'wholesale' ? 'Wholesale Package Specifications' : 'Product Specifications'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {viewMode === 'wholesale' ? (
                              <>
                                <div className="flex items-center">
                                  <Package size={18} className="text-gray-500 mr-2" />
                                  <span>Quantity per package: {product.wholesale_specs.quantity} units</span>
                                </div>
                                <div className="flex items-center">
                                  <Zap size={18} className="text-gray-500 mr-2" />
                                  <span>Material: {product.wholesale_specs.material}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-500 mr-2"
                                  >
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  </svg>
                                  <span>Package dimensions: {product.wholesale_specs.dimensions}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-500 mr-2"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                  </svg>
                                  <span>Total weight: {product.wholesale_specs.weight}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-500 mr-2"
                                  >
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  </svg>
                                  <span>Dimensions: {product.retail_specs.dimensions}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-500 mr-2"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                  </svg>
                                  <span>Weight: {product.retail_specs.weight}</span>
                                </div>
                                <div className="flex items-center">
                                  <Zap size={18} className="text-gray-500 mr-2" />
                                  <span>Material: {product.retail_specs.material}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};