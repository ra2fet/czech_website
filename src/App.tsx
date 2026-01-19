import { useState, useEffect, ReactNode, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { X } from 'lucide-react';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const BlogsPage = lazy(() => import('./pages/BlogsPage').then(m => ({ default: m.BlogsPage })));
const LocationsPage = lazy(() => import('./pages/LocationsPage').then(m => ({ default: m.LocationsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage').then(m => ({ default: m.AboutUsPage })));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard').then(m => ({ default: m.CompanyDashboard })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const RegistrationPendingPage = lazy(() => import('./pages/RegistrationPendingPage').then(m => ({ default: m.RegistrationPendingPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const OffersPage = lazy(() => import('./pages/OffersPage').then(m => ({ default: m.OffersPage })));
const RatingPage = lazy(() => import('./pages/RatingPage')); // Default export
const PaymentCallbackPage = lazy(() => import('./pages/PaymentCallbackPage').then(m => ({ default: m.PaymentCallbackPage })));

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { ChatBot } from './components/chat/ChatBot';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import IntroScreen from './components/layout/IntroScreen'; // Import IntroScreen
import NewsletterPopup from './components/layout/NewsletterPopup'; // Import NewsletterPopup
import { SiteLockOverlay } from './components/common/SiteLockOverlay';
import { LanguageProvider } from './contexts/LanguageContext'; // Import LanguageProvider
import { FeatureProvider, FeatureGuard } from './contexts/FeatureContext'; // Import FeatureProvider


// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);


function App() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showIntro, setShowIntro] = useState(true); // New state for intro screen
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/company-dashboard') || location.pathname.startsWith('/signin') || location.pathname.startsWith('/register') || location.pathname.startsWith('/registration-pending') || location.pathname.startsWith('/rate-order') || location.pathname.startsWith('/verify-email');
  const shouldHideIntro = isAdminRoute || isDashboardRoute;

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (shouldHideIntro) {
      setShowIntro(false);
    }
  }, [shouldHideIntro]);

  const handleIntroFinish = () => {
    setShowIntro(false);
    // Ensure page starts from top when intro disappears
    window.scrollTo(0, 0);
  };

  return (
    <FeatureProvider>
      <AuthProvider>
        <CartProvider>
          <LanguageProvider> {/* Wrap with LanguageProvider */}
            <AuthAndCartHandler /> {/* New component to handle auth and cart logic */}
            <SiteLockOverlay />
            {showIntro && !shouldHideIntro && <IntroScreen onFinish={handleIntroFinish} />} {/* Render IntroScreen conditionally */}
            {!showIntro && !shouldHideIntro && (
              <FeatureGuard feature="enableEmailSubscriptionPopup">
                <NewsletterPopup /> {/* Render NewsletterPopup after intro and not on admin/dashboard routes */}
              </FeatureGuard>
            )}
            <div className="font-sans text-gray-900 bg-white">
              <ScrollToTop />
              {!isAdminRoute && !isDashboardRoute && !showIntro && <Header scrollPosition={scrollPosition} />}
              <main>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/blogs" element={<BlogsPage />} />
                    <Route path="/locations" element={<LocationsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/about-us" element={<AboutUsPage />} />
                    <Route path="/register" element={<RegisterPage />} /> {/* New route for registration */}
                    <Route path="/registration-pending" element={<RegistrationPendingPage />} /> {/* New route for pending company registration */}
                    <Route path="/verify-email" element={<VerifyEmailPage />} /> {/* New route for email verification */}
                    <Route path="/blog/:id" element={<BlogPostPage />} /> {/* New route for individual blog posts */}
                    <Route path="/offers" element={<OffersPage />} /> {/* New route for offers page */}
                    <Route path="/signin" element={<LoginPage />} /> {/* New route for general signin */}
                    <Route path="/rate-order/:ratingToken" element={<RatingPage />} /> {/* New route for order rating */}
                    <Route path="/admin/login" element={<AdminLoginPage />} /> {/* Admin login route */}
                    <Route path="/payment-callback" element={<PaymentCallbackPage />} /> {/* Stripe payment callback */}
                    <Route
                      path="/admin/*"
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <CustomerDashboard /> {/* Default dashboard for customers */}
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/company-dashboard"
                      element={
                        <ProtectedRoute companyOnly={true}> {/* Protect company dashboard */}
                          <CompanyDashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </main>
              {!isAdminRoute && <Footer />}
              {!isAdminRoute && <ChatBot />}
              <Toaster
                position="top-right"
                containerStyle={{
                  top: 60,
                }}
                toastOptions={{
                  duration: 2000,
                  className: 'bg-white text-gray-900 shadow-xl border border-gray-100',
                }}
              >
                {(t) => (
                  <ToastBar toast={t}>
                    {({ icon, message }: { icon: ReactNode; message: ReactNode }) => (
                      <div className="flex items-center">
                        {icon}
                        <div className="mx-2">{message}</div>
                        {t.type !== 'loading' && (
                          <button
                            onClick={() => toast.dismiss(t.id)}
                            className="ml-2 hover:bg-gray-100 rounded-full p-1 transition-colors text-gray-400 hover:text-gray-600"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </ToastBar>
                )}
              </Toaster>
            </div>
          </LanguageProvider>
        </CartProvider>
      </AuthProvider>
    </FeatureProvider>
  );
}

function AuthAndCartHandler() {
  const { user, loading } = useAuth();
  const { clearCart } = useCart();
  const [lastUser, setLastUser] = useState<any>(undefined);

  useEffect(() => {
    // Only proceed if we're not loading the initial auth state
    if (!loading) {
      // If we had a user and now we don't, it's a logout
      if (lastUser !== undefined && lastUser !== null && user === null) {
        clearCart();
        console.log('Cart cleared due to user logout.');
      }
      setLastUser(user);
    }
  }, [user, loading, clearCart, lastUser]);

  return null; // This component doesn't render anything
}

export default App;
