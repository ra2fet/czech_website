import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import config from '../config';
import { LogOut, ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface Order {
  id: number;
  order_date: string;
  total_amount: number;
  status: 'prepared' | 'on the way' | 'completed' | 'rejected';
  rejection_reason?: string;
  address_name: string; // Added address_name
  street_name: string;
  house_number: string;
  city: string;
  province: string;
  postcode: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    product_type: 'retail' | 'wholesale'; // Added product_type
  }>;
}

interface Address {
  id: number;
  address_name: string; // Added address_name
  city: string;
  province: string;
  street_name: string;
  house_number: string;
  postcode: string;
}

export const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    address_name: '',
    city: '',
    province: '',
    street_name: '',
    house_number: '',
    postcode: '',
  });
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

  const fetchProvinces = async () => {
    try {
      const response = await config.axios.get('provinces');
      setProvinces(response.data);
    } catch (err) {
      console.error('Error fetching provinces:', err);
      toast.error('Failed to load provinces.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchAddresses();
      fetchProvinces();
    }
  }, [user]);

  const handleEditAddressClick = (address: Address) => {
    setCurrentAddress(address);
    setAddressForm({
      address_name: address.address_name,
      city: address.city,
      province: address.province,
      street_name: address.street_name,
      house_number: address.house_number,
      postcode: address.postcode,
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!user || !user.id) {
      toast.error('User not authenticated.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await config.axios.delete(`/user_addresses/${user.id}/${addressId}`);
        toast.success('Address deleted successfully!');
        fetchAddresses(); // Refresh the address list
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Failed to delete address.');
      }
    }
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) {
      toast.error('User not authenticated.');
      return;
    }

    const selectedProvince = provinces.find(p => p.name === addressForm.province);
    if (!selectedProvince) {
      toast.error('Please select a valid province.');
      return;
    }

    const addressDataToSend = {
      ...addressForm,
      province_id: selectedProvince.id, // Send province_id instead of province name
    };

    try {
      if (currentAddress) {
        // Update existing address
        await config.axios.put(`user_addresses/${user.id}/${currentAddress.id}`, addressDataToSend);
        toast.success('Address updated successfully!');
      } else {
        // Add new address
        await config.axios.post(`user_addresses/${user.id}`, addressDataToSend);
        toast.success('Address added successfully!');
      }
      setShowAddressModal(false);
      setCurrentAddress(null);
      setAddressForm({
        address_name: '',
        city: '',
        province: '',
        street_name: '',
        house_number: '',
        postcode: '',
      });
      fetchAddresses(); // Refresh the address list
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address.');
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await config.axios.get(`/orders/${user?.id}`);
      const ordersData = response.data.map((order: Order) => ({
        ...order,
        total_amount: Number(order.total_amount).toFixed(2), // Ensure total_amount is a number
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch order history.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await config.axios.get(`user_addresses/${user?.id}`);
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to fetch saved addresses.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
          >
            <ArrowLeft size={20} className="mr-1" />
            Back to Main
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome, {user.email}!</h1>
        </div>
        <p className="text-gray-600 mb-8">Manage your orders and addresses here.</p>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Order History
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'addresses'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Saved Addresses
            </button>
          </nav>
        </div>

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Orders</h2>
            {loadingOrders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-gray-600">You haven't placed any orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-gray-50 p-4 rounded-md shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            order.status === 'on the way' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.status || 'prepared'}
                      </span>
                    </div>
                    {order.status === 'rejected' && order.rejection_reason && (
                      <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700">
                        <strong>Reason for rejection: </strong> {order.rejection_reason}
                      </div>
                    )}
                    <p className="text-sm text-gray-600">Date: {new Date(order.order_date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Total: {config.currencySymbol}{Number(order.total_amount).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Shipping Address: {order.address_name} ({order.street_name}, {order.house_number}, {order.city}, {order.postcode})</p>
                    <div className="mt-2 border-t border-gray-200 pt-2">
                      <p className="font-medium text-gray-700">Items:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {order.items.map((item, index) => (
                          <li key={index}>{item.product_name} (x{item.quantity}) - {config.currencySymbol}{Number(item.price).toFixed(2)} ({item.product_type})</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Saved Addresses</h2>
            {loadingAddresses ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : addresses.length === 0 ? (
              <p className="text-gray-600">You haven't saved any addresses yet.</p>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="bg-gray-50 p-4 rounded-md shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{address.address_name}</p>
                      <p className="text-sm text-gray-600">{address.street_name}, {address.house_number}</p>
                      <p className="text-sm text-gray-600">{address.city}, {address.province}, {address.postcode}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAddressClick(address)}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        title="Edit Address"
                      >
                        <Edit size={18} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setCurrentAddress(null);
                setAddressForm({
                  address_name: '',
                  city: '',
                  province: '',
                  street_name: '',
                  house_number: '',
                  postcode: '',
                });
                setShowAddressModal(true);
              }}
              className="mt-6 btn btn-primary"
            >
              Add New Address
            </button>
          </div>
        )}

        {showAddressModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-2xl font-bold mb-6">{currentAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <form onSubmit={handleAddressFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="address_name" className="block text-sm font-medium text-gray-700">Address Name</label>
                  <input
                    type="text"
                    name="address_name"
                    id="address_name"
                    value={addressForm.address_name}
                    onChange={handleAddressFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="street_name" className="block text-sm font-medium text-gray-700">Street Name</label>
                  <input
                    type="text"
                    name="street_name"
                    id="street_name"
                    value={addressForm.street_name}
                    onChange={handleAddressFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="house_number" className="block text-sm font-medium text-gray-700">House Number</label>
                  <input
                    type="text"
                    name="house_number"
                    id="house_number"
                    value={addressForm.house_number}
                    onChange={handleAddressFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={addressForm.city}
                    onChange={handleAddressFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700">Province</label>
                  <select
                    name="province"
                    id="province"
                    value={addressForm.province}
                    onChange={handleAddressFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Province</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.name}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">Postcode</label>
                  <input
                    type="text"
                    name="postcode"
                    id="postcode"
                    value={addressForm.postcode}
                    onChange={handleAddressFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {currentAddress ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
