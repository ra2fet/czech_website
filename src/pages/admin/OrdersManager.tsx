import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Package, Euro, Calendar, User, Mail, Phone, MapPin } from 'lucide-react';
import config from '../../config';

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  // These will be populated from the ratings array if available
  product_rating?: number;
  product_comment?: string;
}

interface Rating {
  id: number;
  order_id: number;
  user_id: number;
  product_id: number | null; // null for overall order rating
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  full_name: string;
  email: string;
  user_email?: string;
  phone_number: string;
  address: string;
  street_name?: string;
  house_number?: string;
  city?: string;
  province?: string;
  postcode?: string;
  address_name?: string;
  total_amount: number;
  payment_status: string;
  order_date: string;
  status: 'prepared' | 'on the way' | 'completed' | 'rejected';
  rejection_reason?: string;
  items: OrderItem[];
  ratings?: Rating[]; // Optional, as not all orders might have ratings
  overall_rating?: number; // Add overall order rating
  overall_comment?: string; // Add overall order comment
}

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderItems, setExpandedOrderItems] = useState<Set<number>>(new Set());

  const toggleOrderItems = (orderId: number) => {
    setExpandedOrderItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string, reason?: string) => {
    try {
      await config.axios.patch(`orders/update-status/${orderId}`, {
        status: newStatus,
        rejectionReason: reason
      });

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus as any, rejection_reason: reason } : order
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await config.axios.get<Order[]>('orders'); // Explicitly type the response data
        const ordersWithRatings = response.data.map((order: Order) => {
          const overallRating = order.ratings?.find(r => r.product_id === null);
          const itemsWithRatings = order.items.map(item => {
            const productRating = order.ratings?.find(r => r.product_id === item.product_id);
            return {
              ...item,
              product_rating: productRating?.rating || undefined,
              product_comment: productRating?.comment || undefined,
            };
          });

          return {
            ...order,
            overall_rating: overallRating?.rating || undefined,
            overall_comment: overallRating?.comment || undefined,
            items: itemsWithRatings,
          };
        });
        setOrders(ordersWithRatings);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order: Order) => { // Explicitly type order here
    const lowerCaseQuery = searchQuery.toLowerCase();
    const addressString = [
      order.street_name,
      order.house_number,
      order.city,
      order.province,
      order.postcode,
      order.address
    ].filter(Boolean).join(' ').toLowerCase();

    return (
      (order.full_name?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (order.email?.toLowerCase() || '').includes(lowerCaseQuery) ||
      (order.user_email?.toLowerCase() || '').includes(lowerCaseQuery) ||
      order.id.toString().includes(lowerCaseQuery) ||
      addressString.includes(lowerCaseQuery)
    );
  });

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
              <div className="flex flex-col space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Order #{order.id}</h3>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-success-100 text-success-800' :
                      order.status === 'rejected' ? 'bg-error-100 text-error-800' :
                        order.status === 'on the way' ? 'bg-blue-100 text-blue-800' :
                          'bg-warning-100 text-warning-800'
                      }`}>
                      {order.status || 'prepared'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <select
                    className="text-sm p-1 border rounded bg-gray-50 focus:ring-1 focus:ring-primary-500"
                    value={order.status || 'prepared'}
                    onChange={(e) => {
                      const nextStatus = e.target.value;
                      if (nextStatus === 'rejected') {
                        const reason = window.prompt('Enter rejection reason:');
                        if (reason) handleStatusUpdate(order.id, nextStatus, reason);
                      } else {
                        handleStatusUpdate(order.id, nextStatus);
                      }
                    }}
                  >
                    <option value="prepared">Prepared</option>
                    <option value="on the way">On the way</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {order.status === 'rejected' && order.rejection_reason && (
                  <p className="text-xs text-error-600 mt-1 italic">Reason: {order.rejection_reason}</p>
                )}
              </div>

              <div className="space-y-3 text-gray-700 mb-4">
                <p className="flex items-center text-sm">
                  <User size={16} className="mr-2 text-gray-500" />
                  <strong className='mr-1'>Customer: </strong> {order.full_name}
                </p>
                {(order.email || order.user_email) && (
                  <p className="flex items-center text-sm">
                    <Mail size={16} className="mr-2 text-gray-500" />
                    <strong>Email: </strong> {order.email || order.user_email}
                  </p>
                )}
                {order.phone_number && (
                  <p className="flex items-center text-sm">
                    <Phone size={16} className="mr-2 text-gray-500" />
                    <strong className='mr-1'>Phone: </strong> {order.phone_number}
                  </p>
                )}
                {(order.address || order.street_name) && (
                  <div className="flex items-start text-sm">
                    <MapPin size={16} className="mr-2 text-gray-500 flex-shrink-0 mt-1" />
                    <div>
                      <strong className='mr-1'>Address: </strong>
                      {order.address_name && <span className="text-xs bg-gray-100 px-1 rounded mr-1">{order.address_name}</span>}
                      {order.street_name ? (
                        <span>
                          {order.street_name} {order.house_number}, {order.city}, {order.province} {order.postcode}
                        </span>
                      ) : (
                        <span>{order.address}</span>
                      )}
                    </div>
                  </div>
                )}
                <p className="flex items-center text-sm">
                  <Euro size={16} className="mr-2 text-gray-500" />
                  <strong className='mr-1'>Total: </strong> {config.currencySymbol}{Number(order.total_amount).toFixed(2)}
                </p>
                <p className="flex items-center text-sm">
                  <Calendar size={16} className="mr-2 text-gray-500" />
                  <strong className='mr-1'>Date:</strong> {format(new Date(order.order_date), 'PPP p')}
                </p>
              </div>

              {order.overall_rating !== undefined && order.overall_rating !== null && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-2">Overall Order Rating:</h4>
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={`overall-star-${order.id}-${star}`}
                        className={`h-5 w-5 ${order.overall_rating && order.overall_rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {order.overall_comment && (
                    <p className="text-sm text-gray-600 italic">"{order.overall_comment}"</p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 rounded-b-xl -mx-6 px-6 pb-6">
                <button
                  onClick={() => toggleOrderItems(order.id)}
                  className="flex items-center justify-between w-full text-md font-semibold text-gray-800 mb-3 focus:outline-none"
                >
                  <span>Order Items ({order.items.length})</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${expandedOrderItems.has(order.id) ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {expandedOrderItems.has(order.id) && (
                  <ul className="space-y-4">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex flex-col text-sm text-gray-600 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center font-medium text-gray-700">
                            <Package size={14} className="mr-2 text-gray-400" />
                            {item.product_name} (x{item.quantity})
                          </span>
                          <span>{config.currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.product_rating !== undefined && item.product_rating !== null && (
                          <div className="ml-6">
                            <div className="flex items-center mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={`product-star-${item.id}-${star}`}
                                  className={`h-4 w-4 ${item.product_rating && item.product_rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {item.product_comment && (
                              <p className="text-xs text-gray-500 italic">"{item.product_comment}"</p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
