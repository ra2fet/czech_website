import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { LocationsPage } from './pages/LocationsPage';
import { ContactPage } from './pages/ContactPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { LoginPage } from './pages/admin/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { ChatBot } from './components/chat/ChatBot';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';


function App() {
  const [scrollPosition, setScrollPosition] = useState(0);
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

  return (
    <AuthProvider>
      <CartProvider>
        <div className="font-sans text-gray-900 bg-white">
          <ScrollToTop />
          {!isAdminRoute && <Header scrollPosition={scrollPosition} />}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
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