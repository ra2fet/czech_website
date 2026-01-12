import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import Logo from '../ui/Logo';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import config from '../../config';

interface Product {
  id: string;
  name: string;
}

export const Footer = () => {
  const { t } = useTranslation();
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
          {/* Company Info */}
          <div className="space-y-4">
            <Logo isScrolled={true} isFooter={true} />
            {/* <p className="text-gray-400 mt-4">
              {t('footer_company_description', 'Providing sustainable products and exceptional service since 2010. Your trusted partner for eco-friendly solutions.')}
            </p> */}
            <div className="flex space-x-4">
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
              {/* <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a> */}
              <a href="https://www.instagram.com/babo_bamboe?igsh=MzJtcmw5NHZub3ox&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              {/* <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a> */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer_quick_links', 'Quick Links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">{t('home')}</Link>
              </li>
              <li>
                <Link to="/about-us" className="text-gray-400 hover:text-white transition-colors">{t('about_us')}</Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white transition-colors">{t('products')}</Link>
              </li>
              {/* <li>
                <Link to="/portfolio" className="text-gray-400 hover:text-white transition-colors">{t('portfolio')}</Link>
              </li> */}

              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">{t('contact')}</Link>
              </li>
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

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('contact')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin size={20} className="mr-2 flex-shrink-0 mt-1 text-primary-500" />
                <span className="text-gray-400"> Papenkamp 20-P,6836 BD Arnhem</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 flex-shrink-0 text-primary-500" />
                <a href="tel:+31640887984" className="text-gray-400 hover:text-white transition-colors">+31-640887984</a>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 flex-shrink-0 text-primary-500" />
                <a href="https://wa.me/31624330577" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">+31 6 24330577</a>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-2 flex-shrink-0 text-primary-500" />
                <a href="mailto:info@babobamboo.com" className="text-gray-400 hover:text-secondary-400 transition-colors">info@babobamboo.com</a>
              </li>
            </ul>
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