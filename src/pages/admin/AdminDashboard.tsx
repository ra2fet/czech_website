import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  // MapPin,
  LogOut,
  Menu,
  X,
  FileText,
  Mail,
  Briefcase, 
  ClipboardList,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardHome } from './DashboardHome';
import { ProductsManager } from './ProductsManager';
import { LocationsManager } from './LocationsManager';
import { BlogsManager } from './BlogsManager';
import MessagesManager from './MessagesManager';
import JobsManager from './JobsManager';
import ApplicationsManager from './ApplicationsManager';
import { FaqsManager } from './FaqsManager'; // Import FaqsManager
import { HelpCircle, ShoppingCart, Building, DollarSign, Truck, Gift, Settings } from 'lucide-react';
import { OrdersManager } from './OrdersManager'; // Import OrdersManager
import { CompanyManager } from './CompanyManager'; // Import CompanyManager
import TaxFeesManager from './TaxFeesManager';
import ShippingRatesManager from './ShippingRatesManager';
import CouponCodesManager from './CouponCodesManager';
import { OffersManager } from './OffersManager'; // Import OffersManager
import AnnouncementsManager from './AnnouncementsManager'; // Import AnnouncementsManager
import { UsersManager } from './UsersManager';
import { FeatureManager } from './FeatureManager';

export function AdminDashboard() {
  // State for sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { signOut } = useAuth();
  const location = useLocation();

  // Navigation items for sidebar
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Companies', href: '/admin/companies', icon: Building },
    { name: 'Products', href: '/admin/products', icon: Package },
    // { name: 'Locations', href: '/admin/locations', icon: MapPin },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
    { name: 'Messages', href: '/admin/messages', icon: Mail },
    { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
    { name: 'Applications', href: '/admin/applications', icon: ClipboardList },
    { name: 'FAQs', href: '/admin/faqs', icon: HelpCircle }, // Add new FAQ navigation item
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart }, // Add new Orders navigation item
    { name: 'Tax Fees', href: '/admin/tax-fees', icon: DollarSign },
    { name: 'Shipping Rates', href: '/admin/shipping-rates', icon: Truck },
    { name: 'Coupon Codes', href: '/admin/coupon-codes', icon: Gift },
    { name: 'Offers', href: '/admin/offers', icon: Gift }, // Add new Offers navigation item
    { name: 'Announcements', href: '/admin/announcements', icon: ClipboardList }, // Add new Announcements navigation item
    { name: 'Feature Settings', href: '/admin/features', icon: Settings },

  ];

  // Handle user sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-accent-900">Admin Panel CMS</h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-accent-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-500' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg bg-white shadow-lg text-gray-500 hover:text-gray-600"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Main content area */}
      <main className="flex-1 min-h-screen p-8 lg:ml-0">
        <Routes>
          {/* Route definitions for different admin pages */}
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="companies" element={<CompanyManager />} /> {/* Add new Companies route */}
          <Route path="products" element={<ProductsManager />} />
          <Route path="locations" element={<LocationsManager />} />
          <Route path="blog" element={<BlogsManager />} />
          <Route path="messages" element={<MessagesManager />} />
          <Route path="jobs" element={<JobsManager />} />
          <Route path="applications" element={<ApplicationsManager />} />
          <Route path="faqs" element={<FaqsManager />} /> {/* Add new FAQ route */}
          <Route path="orders" element={<OrdersManager />} /> {/* Add new Orders route */}
          <Route path="tax-fees" element={<TaxFeesManager />} />
          <Route path="shipping-rates" element={<ShippingRatesManager />} />
          <Route path="coupon-codes" element={<CouponCodesManager />} />
          <Route path="offers" element={<OffersManager />} /> {/* Add new Offers route */}
          <Route path="announcements" element={<AnnouncementsManager />} /> {/* Add new Announcements route */}
          <Route path="features" element={<FeatureManager />} />
        </Routes>
      </main>
    </div>
  );
}
