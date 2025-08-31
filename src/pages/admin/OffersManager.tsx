import React, { useEffect, useState } from 'react';
import config from '../../config';
import toast from 'react-hot-toast';
import { PlusCircle, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLanguage } from '../../contexts/LanguageContext';

interface Product {
  id: number;
  name: string;
  retail_price: number;
  image_url: string;
}

interface Offer {
  id: number;
  name: string; // Default language name
  description: string; // Default language description
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  products: Product[];
  created_at: string;
  updated_at: string;
  translations?: { 
    [key: string]: { 
      name: string; 
      description: string; 
    } 
  };
}

interface OfferFormState {
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  start_date: Date | null;
  end_date: Date | null;
  is_active: boolean;
  product_ids: number[];
  translations: { 
    [key: string]: { 
      name: string; 
      description: string; 
    } 
  };
}

export const OffersManager = () => {
  const { languages, loadingLanguages, defaultLanguage } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // All available products
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [formState, setFormState] = useState<OfferFormState>({
    discount_type: 'percentage',
    discount_value: 0,
    start_date: null,
    end_date: null,
    is_active: true,
    product_ids: [],
    translations: {},
  });

  useEffect(() => {
    if (!loadingLanguages) {
      fetchOffers();
      fetchProducts();
    }
  }, [loadingLanguages]);

  useEffect(() => {
    if (currentOffer && languages.length > 0) {
      const existingTranslations: { [key: string]: { name: string; description: string; } } = {};
      languages.forEach(lang => {
        existingTranslations[lang.code] = {
          name: currentOffer.translations?.[lang.code]?.name || '',
          description: currentOffer.translations?.[lang.code]?.description || '',
        };
      });
      setFormState({
        discount_type: currentOffer.discount_type,
        discount_value: currentOffer.discount_value,
        start_date: currentOffer.start_date ? new Date(currentOffer.start_date) : null,
        end_date: currentOffer.end_date ? new Date(currentOffer.end_date) : null,
        is_active: currentOffer.is_active,
        product_ids: currentOffer.products.map(p => p.id),
        translations: existingTranslations,
      });
    } else if (languages.length > 0) {
      const initialTranslations: { [key: string]: { name: string; description: string; } } = {};
      languages.forEach(lang => {
        initialTranslations[lang.code] = { name: '', description: '' };
      });
      setFormState({
        discount_type: 'percentage',
        discount_value: 0,
        start_date: null,
        end_date: null,
        is_active: true,
        product_ids: [],
        translations: initialTranslations,
      });
    }
  }, [currentOffer, languages]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await config.axios.get('offers/admin');
      setOffers(response.data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await config.axios.get('products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products for selection.');
    }
  };

  const handleAddOfferClick = () => {
    if (loadingLanguages) {
      toast.error('Languages are still loading. Please wait.');
      return;
    }
    setIsEditing(false);
    setCurrentOffer(null);
    setShowModal(true);
  };

  const handleEditOfferClick = (offer: Offer) => {
    if (loadingLanguages) {
      toast.error('Languages are still loading. Please wait.');
      return;
    }
    setIsEditing(true);
    setCurrentOffer(offer);
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTranslationChange = (langCode: string, field: 'name' | 'description', value: string) => {
    setFormState(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langCode]: {
          ...prev.translations[langCode],
          [field]: value
        }
      }
    }));
  };

  const handleProductSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => parseInt(option.value));
    setFormState(prev => ({ ...prev, product_ids: selectedOptions }));
  };

  const handleDateChange = (date: Date | null, name: 'start_date' | 'end_date') => {
    setFormState(prev => ({ ...prev, [name]: date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!defaultLanguage || !formState.translations[defaultLanguage.code]?.name.trim() || formState.discount_value <= 0 || !formState.start_date || !formState.end_date) {
      toast.error(`Please fill in all required fields including offer name in default language (${defaultLanguage?.name || 'English'}) and ensure discount value is positive.`);
      return;
    }

    if (formState.start_date > formState.end_date) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    const offerData = {
      discount_type: formState.discount_type,
      discount_value: formState.discount_value,
      start_date: formState.start_date?.toISOString(),
      end_date: formState.end_date?.toISOString(),
      is_active: formState.is_active,
      product_ids: formState.product_ids,
      translations: formState.translations,
    };

    try {
      if (isEditing && currentOffer) {
        await config.axios.put(`offers/${currentOffer.id}`, offerData);
        toast.success('Offer updated successfully!');
      } else {
        await config.axios.post('offers', offerData);
        toast.success('Offer created successfully!');
      }
      setShowModal(false);
      fetchOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer.');
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      try {
        await config.axios.delete(`offers/${id}`);
        toast.success('Offer deleted successfully!');
        fetchOffers();
      } catch (error) {
        console.error('Error deleting offer:', error);
        toast.error('Failed to delete offer.');
      }
    }
  };

  if (loading || loadingLanguages) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Offers</h1>

      <button
        onClick={handleAddOfferClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center mb-6"
      >
        <PlusCircle size={20} className="mr-2" /> Add New Offer
      </button>

      {offers.length === 0 ? (
        <p className="text-gray-600">No offers found. Click "Add New Offer" to create one.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{offer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `$${Number(offer.discount_value).toFixed(0)} OFF`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(offer.start_date).toLocaleDateString()} - {new Date(offer.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {offer.is_active ? <Eye size={18} className="text-green-500" /> : <EyeOff size={18} className="text-red-500" />}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {offer.products.length > 0 ? offer.products.map(p => p.name).join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditOfferClick(offer)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit Offer"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Offer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Offer' : 'Add New Offer'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {languages.map(lang => (
                <div key={lang.code} className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-semibold text-lg text-gray-800">{lang.name}</h4>
                  <div>
                    <label htmlFor={`name-${lang.code}`} className="block text-sm font-medium text-gray-700">
                      Offer Name ({lang.code.toUpperCase()}){lang.is_default ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      id={`name-${lang.code}`}
                      value={formState.translations[lang.code]?.name || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'name', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required={lang.is_default}
                    />
                  </div>
                  <div>
                    <label htmlFor={`description-${lang.code}`} className="block text-sm font-medium text-gray-700">
                      Description ({lang.code.toUpperCase()})
                    </label>
                    <textarea
                      id={`description-${lang.code}`}
                      value={formState.translations[lang.code]?.description || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'description', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">Discount Type</label>
                  <select
                    name="discount_type"
                    id="discount_type"
                    value={formState.discount_type}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">Discount Value</label>
                  <input
                    type="number"
                    name="discount_value"
                    id="discount_value"
                    value={formState.discount_value}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <DatePicker
                    selected={formState.start_date}
                    onChange={(date: Date | null) => handleDateChange(date, 'start_date')}
                    dateFormat="Pp"
                    showTimeSelect
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                  <DatePicker
                    selected={formState.end_date}
                    onChange={(date: Date | null) => handleDateChange(date, 'end_date')}
                    dateFormat="Pp"
                    showTimeSelect
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="product_ids" className="block text-sm font-medium text-gray-700">Products (Select multiple)</label>
                <select
                  name="product_ids"
                  id="product_ids"
                  multiple
                  value={formState.product_ids.map(String)} // Convert numbers to strings for select value
                  onChange={handleProductSelection}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-40"
                >
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${Number(product.retail_price).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formState.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Is Active
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isEditing ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
