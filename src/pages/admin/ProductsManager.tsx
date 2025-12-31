import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import config from '../../config';
import { useLanguage } from '../../contexts/LanguageContext';

interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  retail_price: number;
  wholesale_price: number;
  retail_specs: object;
  wholesale_specs: object;
  translations?: {
    [key: string]: {
      name: string;
      description: string;
    }
  };
}

interface ProductFormState {
  image_url: string;
  retail_price: string;
  wholesale_price: string;
  retail_specs: object;
  wholesale_specs: object;
  translations: {
    [key: string]: {
      name: string;
      description: string;
    }
  };
}

export function ProductsManager() {
  const { languages, loadingLanguages, defaultLanguage } = useLanguage();

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Remove /api suffix to get the root URL
    const baseUrl = config.backendBaseUrl.replace(/\/api.*$/, '');
    return `${baseUrl}${url}`;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<ProductFormState>({
    image_url: '',
    retail_price: '',
    wholesale_price: '',
    retail_specs: {},
    wholesale_specs: {},
    translations: {},
  });

  useEffect(() => {
    if (!loadingLanguages) {
      fetchProducts();
    }
  }, [loadingLanguages]);

  useEffect(() => {
    setSelectedFile(null);
    if (currentProduct && languages.length > 0) {
      const existingTranslations: { [key: string]: { name: string; description: string; } } = {};
      languages.forEach(lang => {
        existingTranslations[lang.code] = {
          name: currentProduct.translations?.[lang.code]?.name || '',
          description: currentProduct.translations?.[lang.code]?.description || '',
        };
      });

      setFormData({
        image_url: currentProduct.image_url?.startsWith('http') ? currentProduct.image_url : '',
        retail_price: currentProduct.retail_price.toString(),
        wholesale_price: currentProduct.wholesale_price.toString(),
        retail_specs: currentProduct.retail_specs || {},
        wholesale_specs: currentProduct.wholesale_specs || {},
        translations: existingTranslations,
      });
    } else if (languages.length > 0) {
      const initialTranslations: { [key: string]: { name: string; description: string; } } = {};
      languages.forEach(lang => {
        initialTranslations[lang.code] = { name: '', description: '' };
      });

      setFormData({
        image_url: '',
        retail_price: '',
        wholesale_price: '',
        retail_specs: {},
        wholesale_specs: {},
        translations: initialTranslations,
      });
    }
  }, [currentProduct, languages]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (config.useSupabase) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } else {
        const response = await config.axios.get(`${config.apiEndpoints.products}/admin`);
        setProducts(response.data || []);
      }
    } catch (error) {
      toast.error('Error fetching products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        retail_price: parseFloat(formData.retail_price),
        wholesale_price: parseFloat(formData.wholesale_price)
      };

      // Preserve existing local image if not replaced and no new URL provided
      if (!productData.image_url && currentProduct?.image_url && !currentProduct.image_url.startsWith('http') && !selectedFile) {
        productData.image_url = currentProduct.image_url;
      }

      if (config.useSupabase) {
        let error;
        if (currentProduct) {
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', currentProduct.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('products')
            .insert([productData]);
          error = insertError;
        }

        if (error) throw error;
      } else {
        const data = new FormData();
        data.append('retail_price', formData.retail_price);
        data.append('wholesale_price', formData.wholesale_price);
        data.append('retail_specs', JSON.stringify(formData.retail_specs));
        data.append('wholesale_specs', JSON.stringify(formData.wholesale_specs));
        data.append('translations', JSON.stringify(formData.translations));

        if (selectedFile) {
          data.append('image', selectedFile);
        } else {
          if (formData.image_url) {
            data.append('image_url', formData.image_url);
          } else if (currentProduct?.image_url && !currentProduct.image_url.startsWith('http')) {
            // Preserve existing local image path if not replaced
            data.append('image_url', currentProduct.image_url);
          }
        }

        if (currentProduct) {
          await config.axios.put(`${config.apiEndpoints.products}/${currentProduct.id}`, data);
        } else {
          await config.axios.post(config.apiEndpoints.products, data);
        }
      }

      toast.success(currentProduct ? 'Product updated successfully' : 'Product created successfully');
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(currentProduct ? 'Error updating product' : 'Error creating product');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        if (config.useSupabase) {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } else {
          await config.axios.delete(`${config.apiEndpoints.products}/${id}`);
        }
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Error deleting product');
        console.error('Error:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: ProductFormState) => ({ ...prev, [name]: value }));
  };

  const handleTranslationChange = (langCode: string, field: 'name' | 'description', value: string) => {
    setFormData((prev: ProductFormState) => ({
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-accent-900">Products Management</h2>
        <button
          onClick={() => {
            setCurrentProduct(null);
            const initialTranslations: { [key: string]: { name: string; description: string; } } = {};
            languages.forEach(lang => {
              initialTranslations[lang.code] = { name: '', description: '' };
            });
            setFormData({
              image_url: '',
              retail_price: '',
              wholesale_price: '',
              retail_specs: {},
              wholesale_specs: {},
              translations: initialTranslations,
            });
            setSelectedFile(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Product
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
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retail Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wholesale Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-accent-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 truncate" title={product.description}>
                        {product.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-accent-900">
                        ${product.retail_price}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-accent-900">
                        ${product.wholesale_price}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setCurrentProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
                {currentProduct ? 'Edit Product' : 'Add New Product'}
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
                      name={`name-${lang.code}`}
                      value={formData.translations[lang.code]?.name || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'name', e.target.value)}
                      required={lang.is_default}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description ({lang.code.toUpperCase()})
                    </label>
                    <textarea
                      name={`description-${lang.code}`}
                      value={formData.translations[lang.code]?.description || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/image.jpg"
                />
                <div className="mt-2">
                  <span className="block text-sm text-gray-500 mb-1">Or upload an image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setFormData(prev => ({ ...prev, image_url: '' }));
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {selectedFile ? (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {selectedFile.name}
                    </p>
                  ) : currentProduct?.image_url && !currentProduct.image_url.startsWith('http') && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">
                        Current file: {currentProduct.image_url.split('/').pop()}
                      </p>
                      <img
                        src={getImageUrl(currentProduct.image_url)}
                        alt={currentProduct.name}
                        className="h-32 w-32 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retail Price*
                  </label>
                  <input
                    type="number"
                    name="retail_price"
                    value={formData.retail_price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wholesale Price*
                  </label>
                  <input
                    type="number"
                    name="wholesale_price"
                    value={formData.wholesale_price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
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
                      {currentProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{currentProduct ? 'Update Product' : 'Create Product'}</>
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
