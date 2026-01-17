import { useState, useEffect, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Truck, Shield, Zap, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import toast from 'react-hot-toast';
import config from '../config'; // Import config
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import { useTranslation } from 'react-i18next';
import { useFeatures, FeatureGuard } from '../contexts/FeatureContext'; // Import feature context

interface Product {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  retail_price: number;
  wholesale_price: number;
  created_at: string;
  retail_specs?: {
    dimensions: string;
    weight: string;
    material: string;
  };
  wholesale_specs?: {
    quantity: number;
    dimensions: string;
    weight: string;
    material: string;
  };
}

export const ProductsPage = () => {
  const { t } = useTranslation();
  const { isFeatureEnabled } = useFeatures(); // Get feature status
  const [viewMode, setViewMode] = useState<'retail' | 'wholesale'>('retail');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { state: cartState, addItem, clearCart } = useCart(); // Get clearCart from useCart
  const { user } = useAuth(); // Get user from useAuth
  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Initialize useLocation

  // State for the confirmation dialog
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [productToAddToCart, setProductToAddToCart] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);


  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let data: Product[];
      if (config.useSupabase && supabase) {
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
        data = supabaseData as Product[];
      } else {
        console.log('Fetching products from API...');
        const response = await config.axios.get(config.apiEndpoints.products);
        console.log('API response:', response.data);
        data = response.data as Product[];
      }

      if (data && Array.isArray(data)) {
        console.log('Setting products:', data.length, 'items');
        // Parse specs if they are strings (common with some database drivers)
        const parsedData = data.map(p => ({
          ...p,
          retail_specs: typeof p.retail_specs === 'string' ? JSON.parse(p.retail_specs) : p.retail_specs,
          wholesale_specs: typeof p.wholesale_specs === 'string' ? JSON.parse(p.wholesale_specs) : p.wholesale_specs
        }));
        setProducts(parsedData);
      } else {
        console.log('No data received or invalid format');
        setProducts([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching products:', error);
      if (error instanceof Error) {
        toast.error(`${t('failed_to_fetch_products')}: ${error.message}`);
      } else {
        toast.error(t('failed_to_fetch_products_unknown_error'));
      }
    } finally {
      setLoading(false);
      console.log('Finished loading products');
    }
  };

  // Scroll to product if hash exists in URL
  useLayoutEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          // Adjust for fixed header
          const yOffset = -100;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [loading, location.hash, products]);

  const handleToggleViewMode = (mode: 'retail' | 'wholesale') => {
    if (mode === 'wholesale') {
      // Check if wholesale feature is enabled
      if (!isFeatureEnabled('enableWholesaleProducts')) {
        toast.error(t('wholesale_feature_disabled'));
        return;
      }

      if (!user) {
        toast.error(t('login_to_access_wholesale'));
        navigate('/signin'); // Redirect to login page
        return;
      }

      // Check if company-only wholesale is enabled
      if (isFeatureEnabled('enableCompanyOnlyWholesale') && user.userType !== 'company') {
        toast.error(t('wholesale_for_company_users_only'));
        return;
      }

      if (user.userType === 'company' && !user.isActive) {
        toast.error(t('company_account_not_active'));
        return;
      }
    }
    setViewMode(mode);
  };


  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    const productType = viewMode;
    const price = productType === 'wholesale' ? product.wholesale_price : product.retail_price;

    // Check for mixed cart types
    if (cartState.items.length > 0 && cartState.items[0].type !== productType) {
      setProductToAddToCart(product);
      setShowClearCartDialog(true);
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      description: product.description,
      image_url: product.image_url || '',
      price: price,
      type: productType,
    });

    toast.success(`${product.name} ${t('added_to_cart_toast')} (${productType})`);
  };

  const confirmClearCart = () => {
    clearCart();
    if (productToAddToCart) {
      const productType = viewMode;
      const price = productType === 'wholesale' ? productToAddToCart.wholesale_price : productToAddToCart.retail_price;
      addItem({
        productId: productToAddToCart.id,
        name: productToAddToCart.name,
        description: productToAddToCart.description,
        image_url: productToAddToCart.image_url || '',
        price: price,
        type: productType,
      });
      toast.success(`${t('cart_cleared_toast')} ${productToAddToCart.name} ${t('added_to_cart_toast')} (${productType})`);
    }
    setShowClearCartDialog(false);
    setProductToAddToCart(null);
  };

  const cancelClearCart = () => {
    setShowClearCartDialog(false);
    setProductToAddToCart(null);
    toast.error(t('product_not_added_toast'));
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
      <section className="rafatbg  text-white py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('products_page_hero_title')}</h1>
            <p className="text-xl opacity-90 mb-8">
              {t('products_page_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      <FeatureGuard feature="enableWholesaleProducts">
        <section className="bg-gray-100 py-6 border-b border-gray-200">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <h2 className="text-2xl font-bold mb-4 md:mb-0">{t('product_catalog_title')}</h2>
              <div className="flex">
                <button
                  onClick={() => handleToggleViewMode('retail')}
                  className={`flex items-center px-4 py-2 rounded-l-md ${viewMode === 'retail'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <ShoppingBag size={18} className="mr-2" />
                  {t('retail_mode')}
                </button>
                {/* Only show wholesale button if user has access or feature allows it */}
                {(!isFeatureEnabled('enableCompanyOnlyWholesale') || (user && user.userType === 'company')) && (
                  <button
                    onClick={() => handleToggleViewMode('wholesale')}
                    className={`flex items-center px-4 py-2 rounded-r-md ${viewMode === 'wholesale'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Package size={18} className="mr-2" />
                    {t('wholesale_mode')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </FeatureGuard>


      <div id="product-list" className="sr-only" />

      {/* Products List */}
      <section className="section-padding bg-gray-50">
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
              <h2 className="text-xl font-bold text-yellow-800 mb-4">{t('no_products_available_title')}</h2>
              <p className="text-yellow-600 mb-6">
                {t('no_products_available_message')}
              </p>
              <button
                onClick={fetchProducts}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                {t('refresh_button')}
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  id={product.id}
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="card card-hover flex flex-col h-full scroll-mt-24 max-w-[340px] mx-auto w-full"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[6/7] overflow-hidden group bg-white">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-primary-100/50 to-secondary-100/50 flex items-center justify-center"
                      style={{ display: product.image_url ? 'none' : 'flex' }}
                    >
                      <Package size={64} className="text-primary-600/50" />
                    </div>

                    {/* Price Overlay on Image */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <div className="text-lg font-bold text-primary-600">
                        {viewMode === 'wholesale'
                          ? `${config.currencySymbol}${product.wholesale_price}`
                          : `${config.currencySymbol}${product.retail_price}`}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 min-h-[2rem]">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-auto space-y-4 text-center">
                      <div className="flex items-center justify-between text-sm text-gray-500 pb-4 border-b border-gray-100">
                        <span>{viewMode === 'wholesale' ? t('wholesale_price_label') : t('per_unit_label')}</span>
                        <div className="flex items-center gap-1">
                          <Truck size={14} className="text-primary-500" />
                          <span>{t('fast_shipping_title')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setQuickViewProduct(product)}
                          className="flex items-center justify-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg text-primary-600 border border-primary-200 hover:bg-primary-50 transition-all duration-300"
                        >
                          {t('details')}
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="btn btn-primary !py-2 !px-4 text-sm"
                        >
                          {t('add_to_cart_button')}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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
              <h3 className="text-xl font-bold mb-2">{t('fast_shipping_title')}</h3>
              <p className="text-gray-600">
                {viewMode === 'wholesale'
                  ? t('fast_shipping_wholesale_desc')
                  : t('fast_shipping_retail_desc')}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <Shield size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('quality_guaranteed_title')}</h3>
              <p className="text-gray-600">
                {t('quality_guaranteed_desc')}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <Euro size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {viewMode === 'wholesale' ? t('volume_discounts_title') : t('competitive_pricing_title')}
              </h3>
              <p className="text-gray-600">
                {viewMode === 'wholesale'
                  ? t('volume_discounts_desc')
                  : t('competitive_pricing_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickViewProduct(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row"
          >
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Left: Image */}
            <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8">
              <img
                src={quickViewProduct.image_url}
                alt={quickViewProduct.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-inner"
              />
            </div>

            {/* Right: Info */}
            <div className="md:w-1/2 p-8 overflow-y-auto">
              <div className="mb-6">
                <div className="text-primary-600 font-bold text-sm uppercase tracking-wider mb-2">
                  {viewMode === 'wholesale' ? t('wholesale_mode') : t('retail_mode')}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{quickViewProduct.name}</h2>
                <div className="text-2xl font-bold text-gray-900 mb-6">
                  {config.currencySymbol}{viewMode === 'wholesale' ? quickViewProduct.wholesale_price : quickViewProduct.retail_price}
                </div>
                <div className="prose prose-sm text-gray-600 leading-relaxed mb-8">
                  {quickViewProduct.description}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
                  {viewMode === 'wholesale' ? t('wholesale_specs_title') : t('product_specs_title')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewMode === 'wholesale' ? (
                    <>
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-primary-500" />
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{t('quantity')}</div>
                          <div className="text-sm text-gray-900">{quickViewProduct.wholesale_specs?.quantity} {t('units_label')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Zap size={18} className="text-primary-500" />
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{t('material_label')}</div>
                          <div className="text-sm text-gray-900">{quickViewProduct.wholesale_specs?.material}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-[18px] text-center font-bold text-primary-500 text-xs">D</div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold text-nowrap">{t('package_dimensions_label')}</div>
                          <div className="text-sm text-gray-900">{quickViewProduct.wholesale_specs?.dimensions}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-[18px] h-[18px] border-2 border-primary-500 rounded-full"></div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{t('total_weight_label')}</div>
                          <div className="text-sm text-gray-900">{quickViewProduct.wholesale_specs?.weight}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-[18px] text-center font-bold text-primary-500 text-xs">D</div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{t('dimensions_label')}</div>
                          <div className="text-sm text-gray-900">{quickViewProduct.retail_specs?.dimensions}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-[18px] h-[18px] border-2 border-primary-500 rounded-full"></div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{t('weight_label')}</div>
                          <div className="text-sm text-gray-900">{quickViewProduct.retail_specs?.weight}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Zap size={18} className="text-primary-500" />
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{t('material_label')}</div>
                          <div className="text-sm text-gray-900">{quickViewProduct.retail_specs?.material}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  handleAddToCart(quickViewProduct);
                  setQuickViewProduct(null);
                }}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <ShoppingBag size={20} />
                {t('add_to_cart_button')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      {showClearCartDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm mx-auto text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('clear_cart_dialog_title')}</h3>
            <p className="text-gray-600 mb-6">
              {t('clear_cart_dialog_message')}
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmClearCart}
                className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {t('confirm_clear_cart_button')}
              </button>
              <button
                onClick={cancelClearCart}
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                {t('cancel_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
