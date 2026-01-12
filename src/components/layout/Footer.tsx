import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import Logo from '../ui/Logo';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import config from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures } from '../../contexts/FeatureContext';

interface Product {
  id: string;
  name: string;
}

export const Footer = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const currentYear = new Date().getFullYear();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let data: Product[] = [];
      if (config.useSupabase && supabase) {
        const { data: supabaseData, error: fetchError } = await supabase
          .from('products')
          .select('id, name')
          .limit(4);

        if (fetchError) throw fetchError;
        data = supabaseData as Product[];
      } else {
        const response = await config.axios.get(config.apiEndpoints.products);
        data = (response.data as Product[]).slice(0, 4);
      }

      if (data && Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products for footer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-accent-900 text-white">
      <div className="container-custom pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Account */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer_account')}</h3>
            <ul className="space-y-2">
              {isFeatureEnabled('enableUserRegistration') && (
                <>
                  {user ? (
                    <li>
                      <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">{t('footer_my_account')}</Link>
                    </li>
                  ) : (
                    <li>
                      <Link to="/signin" className="text-gray-400 hover:text-white transition-colors">{t('footer_login_register')}</Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('products')}</h3>
            <ul className="space-y-2">
              {loading ? (
                <li className="text-gray-500 animate-pulse">{t('loading', 'Loading...')}</li>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <li key={product.id}>
                    <Link
                      to={`/products#${product.id}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {product.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/products" className="text-gray-400 hover:text-white transition-colors">{t('footer_toilet_paper', 'Babo Toilet Paper')}</Link>
                  </li>
                  <li>
                    <Link to="/products" className="text-gray-400 hover:text-white transition-colors">{t('footer_kitchen_rolls', 'Babo Kitchen Rolls')}</Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white transition-colors font-semibold">
                  {t('view_all', 'View All')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer_info')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about-us" className="text-gray-400 hover:text-white transition-colors">{t('footer_about_us')}</Link>
              </li>
              <li>
                <Link to="/blogs" className="text-gray-400 hover:text-white transition-colors">{t('footer_blog')}</Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white transition-colors">{t('products')}</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">{t('contact')}</Link>
              </li>
              {/* <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">{t('privacy_policy')}</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">{t('terms_of_service')}</a>
              </li> */}
            </ul>
          </div>

          {/* Contact & Company */}
          <div className="space-y-4">
            <Logo isScrolled={true} isFooter={true} />
            <ul className="space-y-4 mt-4">
              <li className="flex items-start">
                <MapPin size={20} className="mr-2 flex-shrink-0 mt-1 text-primary-500" />
                <span className="text-gray-400"> Papenkamp 20-P,6836 BD Arnhem</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 flex-shrink-0 text-primary-500" />
                <a href="tel:+31640887984" className="text-gray-400 hover:text-white transition-colors">+31-640887984</a>
              </li>
              {/* <li className="flex items-center">
                <Phone size={20} className="mr-2 flex-shrink-0 text-primary-500" />
                <a href="https://wa.me/31624330577" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">+31 6 24330577</a>
              </li> */}
              <li className="flex items-center">
                <Mail size={20} className="mr-2 flex-shrink-0 text-primary-500" />
                <a href="mailto:info@babobamboo.com" className="text-gray-400 hover:text-secondary-400 transition-colors">info@babobamboo.com</a>
              </li>
            </ul>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://wa.me/31624330577"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#25D366] transition-colors flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 512 512"
                  aria-hidden="true"
                  className="mr-2 flex-shrink-0"
                >
                  <path

                    fill="currentColor"
                    d="M256 0C114.9 0 0 114.9 0 256c0 45.2 12 88 34.7 126.1L16 512l134.9-35.1C187.9 489.9 221.3 496 256 496 397.1 496 512 381.1 512 240S397.1 0 256 0z"
                  />
                  <path
                    // fill="#fff"
                    d="M381.3 301.7c-6.3-3.1-37.4-18.4-43.2-20.5-5.8-2.1-10.1-3.1-14.4 3.1-4.2 6.3-16.5 20.5-20.3 24.7-3.7 4.2-7.4 4.7-13.7 1.6-6.3-3.1-26.5-9.8-50.5-31.2-18.6-16.6-31.1-37.1-34.7-43.4-3.7-6.3-.4-9.7 2.8-12.8 2.9-2.9 6.3-7.4 9.4-11.1 3.1-3.7 4.2-6.3 6.3-10.5 2.1-4.2 1.1-7.9-.5-11.1-1.6-3.1-14.4-34.6-19.7-47.5-5.2-12.5-10.5-10.8-14.4-11-3.7-.2-8-.2-12.3-.2s-11.3 1.6-17.2 7.9c-5.8 6.3-22.6 22.1-22.6 53.8 0 31.7 23.1 62.3 26.3 66.5 3.1 4.2 45.5 69.4 110.4 97.3 15.4 6.6 27.4 10.6 36.7 13.6 15.4 4.9 29.4 4.2 40.5 2.6 12.3-1.8 37.4-15.3 42.7-30.1 5.3-14.7 5.3-27.3 3.7-30.1-1.6-2.8-5.8-4.4-12.1-7.5z"
                  />
                </svg>
                <span className="sr-only">WhatsApp</span>
              </a>




              <a
                href="https://www.facebook.com/share/1aNXnXD8xx/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://www.tiktok.com/@babo.bambo.b.v?_r=1&_t=ZG-92tQFhyomBd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-music"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
                <span className="sr-only">TikTok</span>
              </a>
              <a href="https://www.instagram.com/babo_bamboe?igsh=MzJtcmw5NHZub3ox&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-accent-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Babo. {t('footer_all_rights_reserved', 'All rights reserved.')}
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-4 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-secondary-400 transition-colors">{t('privacy_policy', 'Privacy Policy')}</a>
                </li>
                <li>
                  <a href="#" className="hover:text-secondary-400 transition-colors">{t('terms_of_service', 'Terms of Service')}</a>
                </li>
                <li>
                  <a href="#" className="hover:text-secondary-400 transition-colors">{t('cookie_policy', 'Cookie Policy')}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};