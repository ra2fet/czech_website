import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import config from '../../config';
import { useLanguage } from '../../contexts/LanguageContext';

interface Location {
  id: number;
  name: string; // Default language name
  address: string; // Default language address
  phone: string;
  email: string;
  image_url: string;
  latitude: number;
  longitude: number;
  position: string;
  created_at: string;
  updated_at: string;
  translations?: { 
    [key: string]: { 
      name: string; 
      address: string; 
    } 
  };
}

interface LocationFormState {
  phone: string;
  email: string;
  image_url: string;
  position: string;
  translations: { 
    [key: string]: { 
      name: string; 
      address: string; 
    } 
  };
}

export function LocationsManager() {
  const { languages, loadingLanguages, defaultLanguage } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formState, setFormState] = useState<LocationFormState>({
    phone: '',
    email: '',
    image_url: '',
    position: '',
    translations: {},
  });

  useEffect(() => {
    if (!loadingLanguages) {
      fetchLocations();
    }
  }, [loadingLanguages]);

  useEffect(() => {
    if (currentLocation && languages.length > 0) {
      const existingTranslations: { [key: string]: { name: string; address: string; } } = {};
      languages.forEach(lang => {
        existingTranslations[lang.code] = {
          name: currentLocation.translations?.[lang.code]?.name || '',
          address: currentLocation.translations?.[lang.code]?.address || '',
        };
      });
      setFormState({
        phone: currentLocation.phone || '',
        email: currentLocation.email || '',
        image_url: currentLocation.image_url || '',
        position: currentLocation.position ? `(${currentLocation.latitude},${currentLocation.longitude})` : '',
        translations: existingTranslations,
      });
    } else if (languages.length > 0) {
      const initialTranslations: { [key: string]: { name: string; address: string; } } = {};
      languages.forEach(lang => {
        initialTranslations[lang.code] = { name: '', address: '' };
      });
      setFormState({
        phone: '',
        email: '',
        image_url: '',
        position: '',
        translations: initialTranslations,
      });
    }
  }, [currentLocation, languages]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await config.axios.get('locations/admin');
      setLocations(response.data || []);
    } catch (error) {
      toast.error('Error fetching locations');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!defaultLanguage || !formState.translations[defaultLanguage.code]?.name.trim() || !formState.translations[defaultLanguage.code]?.address.trim()) {
      toast.error(`Name and address in default language (${defaultLanguage?.name || 'English'}) are required.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        phone: formState.phone,
        email: formState.email,
        image_url: formState.image_url,
        position: formState.position,
        translations: formState.translations,
      };

      if (currentLocation) {
        await config.axios.put(`locations/${currentLocation.id}`, payload);
        toast.success('Location updated successfully');
      } else {
        await config.axios.post('locations', payload);
        toast.success('Location created successfully');
      }
      
      setIsModalOpen(false);
      fetchLocations();
    } catch (error) {
      toast.error(currentLocation ? 'Error updating location' : 'Error creating location');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await config.axios.delete(`locations/${id}`);
        toast.success('Location deleted successfully');
        fetchLocations();
      } catch (error) {
        toast.error('Error deleting location');
        console.error('Error:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleTranslationChange = (langCode: string, field: 'name' | 'address', value: string) => {
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

  const openModal = (location?: Location) => {
    if (loadingLanguages) {
      toast.error('Languages are still loading. Please wait.');
      return;
    }
    setCurrentLocation(location || null);
    setIsModalOpen(true);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-accent-900">Locations Management</h2>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Location
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No locations found
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={location.image_url}
                        alt={location.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-accent-900">
                        {location.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 truncate" title={location.address}>
                        {location.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-accent-900">
                        {location.phone}<br />
                        {location.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(location)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {currentLocation ? 'Edit Location' : 'Add New Location'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {languages.map(lang => (
                <div key={lang.code} className="space-y-2 border p-4 rounded-md">
                  <h4 className="font-semibold text-lg text-gray-800">{lang.name}</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name ({lang.code.toUpperCase()}){lang.is_default ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={formState.translations[lang.code]?.name || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'name', e.target.value)}
                      required={lang.is_default}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address ({lang.code.toUpperCase()}){lang.is_default ? '*' : ''}
                    </label>
                    <textarea
                      value={formState.translations[lang.code]?.address || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'address', e.target.value)}
                      required={lang.is_default}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formState.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formState.image_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position (format: (latitude,longitude))
                </label>
                <input
                  type="text"
                  name="position"
                  value={formState.position}
                  onChange={handleInputChange}
                  placeholder="(0,0)"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Example: (51.5074,-0.1278) for London
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      {currentLocation ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{currentLocation ? 'Update Location' : 'Create Location'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
