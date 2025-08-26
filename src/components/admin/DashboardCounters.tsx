import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Package, MapPin, FileText, Loader2, Mail, Briefcase, ShoppingCart, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import config from '../../config';

export function DashboardCounters() {
  const [productCount, setProductCount] = useState(0);
  // const [locationCount, setLocationCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [blogCount, setBlogCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const response = await config.axios.get(`admin/dashboard/counts`);

      const data = response.data;
      setProductCount(data.productCount || 0);
      // setLocationCount(data.locationCount || 0);
      setUserCount(data.userCount || 0);
      setBlogCount(data.blogCount || 0);
      setMessageCount(data.messageCount || 0);
      setApplicationCount(data.applicationCount || 0);
      setOrderCount(data.orderCount || 0);
    } catch (error) {
      toast.error('Error fetching dashboard counts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-accent-900">Dashboard Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                ) : (
                  productCount.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-4 bg-blue-600 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
{/* 
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl shadow-sm border border-primary-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 font-medium">Total Locations</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                ) : (
                  locationCount.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-4 bg-primary-600 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div> */}

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl shadow-sm border border-primary-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                ) : (
                  userCount.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-4 bg-primary-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 rounded-xl shadow-sm border border-secondary-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 font-medium">Total Blog Posts</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
                ) : (
                  blogCount.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-4 bg-secondary-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Messages</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                ) : (
                  messageCount.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-4 bg-green-600 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Applications</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                ) : (
                  applicationCount.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-4 bg-purple-600 rounded-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-accent-900 mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                ) : (
                  orderCount.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-4 bg-orange-600 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>
{/* 
      <div className="mt-8">
        <p className="text-gray-600">
          Quick actions: Select a section from the sidebar to manage your website content.
        </p>
      </div> */}
    </div>
  );
}
