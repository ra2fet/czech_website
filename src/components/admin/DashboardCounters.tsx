import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Package, FileText, Loader2, Mail, Briefcase, ShoppingCart, Users } from 'lucide-react';
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Products</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 mx-auto" />
                ) : (
                  productCount.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-primary-200 transition-colors"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Users</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600 mx-auto" />
                ) : (
                  userCount.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-secondary-200 transition-colors"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-2 bg-secondary-50 rounded-lg text-secondary-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Blogs</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-secondary-600 mx-auto" />
                ) : (
                  blogCount.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Messages</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-green-600 mx-auto" />
                ) : (
                  messageCount.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Applications</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600 mx-auto" />
                ) : (
                  applicationCount.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 transition-colors"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Orders</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600 mx-auto" />
                ) : (
                  orderCount.toLocaleString()
                )}
              </p>
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
