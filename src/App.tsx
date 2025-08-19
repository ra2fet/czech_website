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
import { LoginPage } from './pages/admin/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { ChatBot } from './components/chat/ChatBot';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import IntroScreen from './components/layout/IntroScreen'; // Import IntroScreen


function App() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showIntro, setShowIntro] = useState(true); // New state for intro screen
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleIntroFinish = () => {
    setShowIntro(false);
  };

  return (
    <AuthProvider>
      <CartProvider>
        {showIntro && <IntroScreen onFinish={handleIntroFinish} />} {/* Render IntroScreen */}
        <div className="font-sans text-gray-900 bg-white">
          <ScrollToTop />
          {!isAdminRoute && <Header scrollPosition={scrollPosition} />}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog/:id" element={<BlogPostPage />} /> {/* New route for individual blog posts */}
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          {!isAdminRoute && <Footer />}
          {!isAdminRoute &&  <ChatBot />}
          <Toaster position="top-right" />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
