import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { BlogsPage } from './pages/BlogsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { LocationsPage } from './pages/LocationsPage';
import { ContactPage } from './pages/ContactPage';
import { BlogPostPage } from './pages/BlogPostPage'; // Import the new blog post page
import { LoginPage } from './pages/LoginPage'; // Import the new general LoginPage
import { AdminLoginPage } from './pages/admin/AdminLoginPage'; // Import the admin LoginPage
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CustomerDashboard } from './pages/CustomerDashboard'; // Import CustomerDashboard
import { CompanyDashboard } from './pages/CompanyDashboard'; // Import CompanyDashboard
import { ScrollToTop } from './components/utils/ScrollToTop';
import { ChatBot } from './components/chat/ChatBot';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import IntroScreen from './components/layout/IntroScreen'; // Import IntroScreen
import NewsletterPopup from './components/layout/NewsletterPopup'; // Import NewsletterPopup
import { RegisterPage } from './pages/RegisterPage'; // Import RegisterPage
import { SiteLockOverlay } from './components/common/SiteLockOverlay';
import { RegistrationPendingPage } from './pages/RegistrationPendingPage'; // Import RegistrationPendingPage
import { VerifyEmailPage } from './pages/VerifyEmailPage'; // Import VerifyEmailPage
import { OffersPage } from './pages/OffersPage'; // Import OffersPage
import RatingPage from './pages/RatingPage'; // Import RatingPage
import { LanguageProvider } from './contexts/LanguageContext'; // Import LanguageProvider
import { FeatureProvider, FeatureGuard } from './contexts/FeatureContext'; // Import FeatureProvider


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
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/blogs" element={<BlogsPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/locations" element={<LocationsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/register" element={<RegisterPage />} /> {/* New route for registration */}
                  <Route path="/registration-pending" element={<RegistrationPendingPage />} /> {/* New route for pending company registration */}
                  <Route path="/verify-email" element={<VerifyEmailPage />} /> {/* New route for email verification */}
                  <Route path="/blog/:id" element={<BlogPostPage />} /> {/* New route for individual blog posts */}
                  <Route path="/offers" element={<OffersPage />} /> {/* New route for offers page */}
                  <Route path="/signin" element={<LoginPage />} /> {/* New route for general signin */}
                  <Route path="/rate-order/:ratingToken" element={<RatingPage />} /> {/* New route for order rating */}
                  <Route path="/admin/login" element={<AdminLoginPage />} /> {/* Admin login route */}
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
              </main>
              {!isAdminRoute && <Footer />}
              {!isAdminRoute && <ChatBot />}
              <Toaster position="top-right" />
            </div>
          </LanguageProvider>
        </CartProvider>
      </AuthProvider>
    </FeatureProvider>
  );
}

function AuthAndCartHandler() {
  const { user } = useAuth();
  const { clearCart } = useCart();

  useEffect(() => {
    if (user === null) {
      // User has logged out (either manually or due to timeout)
      clearCart();
      console.log('Cart cleared due to user logout.');
    }
  }, [user, clearCart]);

  return null; // This component doesn't render anything
}

export default App;
