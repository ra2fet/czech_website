import React, { useEffect, useState } from 'react';
import config from '../config';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Tag, Clock, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
}

interface Offer {
  id: number;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  products: Product[];
}

export const OffersPage = () => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await config.axios.get('offers');
        setOffers(response.data);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError(t('offers_failed_to_load'));
        toast.error(t('offers_failed_to_load'));
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const calculateDiscountedPrice = (originalPrice: number, offer: Offer) => {
    if (offer.discount_type === 'percentage') {
      return originalPrice * (1 - offer.discount_value / 100);
    } else if (offer.discount_type === 'fixed_amount') {
      return originalPrice - offer.discount_value;
    }
    return originalPrice;
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product, discountedPrice: number) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Stop event propagation to parent Link

    addItem({
      productId: String(product.id),
      name: product.name,
      description: '', // OffersPage doesn't have product description, can be fetched on product page
      image_url: product.image_url,
      price: discountedPrice,
      type: 'offer', // Changed to 'offer' as per user's suggestion
    });
    toast.success(t('added_to_cart_toast', { productName: product.name }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="rafatbg text-white py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('offers_hero_title')}</h1>
            <p className="text-xl opacity-90 mb-8">
              {t('offers_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-10">{t('offers_current_promotions_title')}</h1>

          {offers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">{t('offers_no_offers_message')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-blue-700 flex items-center">
                        <Tag size={24} className="mr-2" /> {offer.name}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${offer.discount_type === 'percentage' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                        {offer.discount_type === 'percentage' ? t('offers_percentage_off', { value: offer.discount_value }) : t('offers_amount_off', { value: Number(offer.discount_value).toFixed(0) })}
                      </span>
                    </div>
                    {offer.description && <p className="text-gray-600 mb-4">{offer.description}</p>}

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock size={16} className="mr-2" />
                      <span>{t('offers_valid_period', { startDate: new Date(offer.start_date).toLocaleDateString(), endDate: new Date(offer.end_date).toLocaleDateString() })}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('offers_products_in_offer')}</h3>
                    <div className="space-y-4">
                      {offer.products.map((product) => {
                        const discountedPrice = calculateDiscountedPrice(product.price, offer);
                        return (
                          <Link to={`/products/${product.id}`} key={product.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <img src={product.image_url} alt={product.name} className="w-16 h-16 object-contain rounded-md bg-white border border-gray-100" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <div className="flex items-baseline space-x-2">
                                <span className="text-lg font-bold text-blue-600">{config.currencySymbol}{Number(discountedPrice).toFixed(2)}</span>
                                <span className="text-sm text-gray-500 line-through">{config.currencySymbol}{Number(product.price).toFixed(2)}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(e, product, discountedPrice)}
                              className="ml-auto p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
                              aria-label={t('offers_add_to_cart_aria', { productName: product.name })}
                            >
                              <ShoppingCart size={20} />
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
