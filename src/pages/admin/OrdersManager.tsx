import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Package, DollarSign, Calendar, User, Mail, Phone, MapPin } from 'lucide-react';
import config from '../../config';

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  total_amount: number;
  payment_status: string;
  order_date: string;
  items: OrderItem[];
}

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await config.axios.get('/orders');
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order =>
    order.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toString().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-error-700 p-4 bg-error-100 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Orders Management</h2>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search orders by customer name, email, or order ID..."
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-600 p-8 border border-gray-300 rounded-lg bg-white shadow-sm">
          <p className="text-lg">No orders found matching your search criteria.</p>
          <p className="text-sm mt-2">Try adjusting your search or clear the search box.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Order #{order.id}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.payment_status === 'completed' ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>

              <div className="space-y-3 text-gray-700 mb-4">
                <p className="flex items-center text-sm">
                  <User size={16} className="mr-2 text-gray-500" />
                  <strong>Customer:</strong> {order.full_name}
                </p>
                {order.email && (
                  <p className="flex items-center text-sm">
                    <Mail size={16} className="mr-2 text-gray-500" />
                    <strong>Email:</strong> {order.email}
                  </p>
                )}
                {order.phone_number && (
                  <p className="flex items-center text-sm">
                    <Phone size={16} className="mr-2 text-gray-500" />
                    <strong>Phone:</strong> {order.phone_number}
                  </p>
                )}
                {order.address && (
                  <p className="flex items-start text-sm">
                    <MapPin size={16} className="mr-2 text-gray-500 flex-shrink-0 mt-1" />
                    <strong>Address:</strong> {order.address}
                  </p>
                )}
                <p className="flex items-center text-sm">
                  <DollarSign size={16} className="mr-2 text-gray-500" />
                  <strong>Total:</strong> ${Number(order.total_amount).toFixed(2)}
                </p>
                <p className="flex items-center text-sm">
                  <Calendar size={16} className="mr-2 text-gray-500" />
                  <strong>Date:</strong> {format(new Date(order.order_date), 'PPP p')}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 rounded-b-xl -mx-6 px-6 pb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Order Items:</h4>
                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center">
                        <Package size={14} className="mr-2 text-gray-400" />
                        {item.product_name} (x{item.quantity})
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
