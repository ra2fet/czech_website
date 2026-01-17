import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  XCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import config from '../../config';
import { useLanguage } from '../../contexts/LanguageContext';

interface Blog {
  id: number;
  title: string; // Default language title
  content: string; // Default language content
  excerpt: string; // Default language excerpt
  image_url: string;
  created_at: string;
  sort_order: number;
  views: number;
  translations?: {
    [key: string]: {
      title: string;
      content: string;
      excerpt: string;
    }
  };
}

interface BlogFormState {
  image_url: string;
  sort_order: number;
  translations: {
    [key: string]: {
      title: string;
      content: string;
      excerpt: string;
    }
  };
}

export function BlogsManager() {
  const { languages, loadingLanguages, defaultLanguage } = useLanguage();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formState, setFormState] = useState<BlogFormState>({
    image_url: '',
    sort_order: 0,
    translations: {},
  });

  useEffect(() => {
    if (!loadingLanguages) {
      fetchBlogs();
    }
  }, [loadingLanguages]);

  useEffect(() => {
    if (currentBlog && languages.length > 0) {
      const existingTranslations: { [key: string]: { title: string; content: string; excerpt: string; } } = {};
      languages.forEach(lang => {
        existingTranslations[lang.code] = {
          title: currentBlog.translations?.[lang.code]?.title || '',
          content: currentBlog.translations?.[lang.code]?.content || '',
          excerpt: currentBlog.translations?.[lang.code]?.excerpt || '',
        };
      });
      setFormState({
        image_url: currentBlog.image_url || '',
        sort_order: currentBlog.sort_order || 0,
        translations: existingTranslations,
      });
    } else if (languages.length > 0) {
      const initialTranslations: { [key: string]: { title: string; content: string; excerpt: string; } } = {};
      languages.forEach(lang => {
        initialTranslations[lang.code] = { title: '', content: '', excerpt: '' };
      });
      setFormState({
        image_url: '',
        sort_order: 0,
        translations: initialTranslations,
      });
    }
  }, [currentBlog, languages]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await config.axios.get('blogs/admin');
      setBlogs(response.data || []);
    } catch (error) {
      toast.error('Error fetching blogs');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    if (!defaultLanguage || !formState.translations[defaultLanguage.code]?.title.trim() || !formState.translations[defaultLanguage.code]?.content.trim()) {
      toast.error(`Title and content in default language (${defaultLanguage?.name || 'English'}) are required.`);
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        image_url: formState.image_url,
        sort_order: formState.sort_order,
        title: formState.translations[defaultLanguage.code]?.title,
        content: formState.translations[defaultLanguage.code]?.content,
        excerpt: formState.translations[defaultLanguage.code]?.excerpt,
        translations: formState.translations,
      };

      if (currentBlog) {
        await config.axios.put(`blogs/${currentBlog.id}`, payload);
      } else {
        await config.axios.post('blogs', payload);
      }

      toast.success(currentBlog ? 'Blog updated successfully' : 'Blog created successfully');
      setIsModalOpen(false);
      fetchBlogs();
    } catch (error) {
      toast.error(currentBlog ? 'Error updating blog' : 'Error creating blog');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await config.axios.delete(`blogs/${id}`);
        toast.success('Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        toast.error('Error deleting blog');
        console.error('Error:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleTranslationChange = (langCode: string, field: 'title' | 'content' | 'excerpt', value: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-accent-900">Blog Management</h2>
        <button
          onClick={() => {
            setCurrentBlog(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Blog Post
        </button>
      </div>

      {/* Blogs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Excerpt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
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
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No blogs found
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={blog.image_url}
                        alt={blog.title}
                        className="h-12 w-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-accent-900">
                        {blog.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 truncate" title={blog.excerpt}>
                        {blog.excerpt}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-accent-900">
                        {blog.sort_order}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-accent-900">
                        {new Date(blog.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setCurrentBlog(blog);
                            setIsModalOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(blog.id)}
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

      {/* Blog Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {currentBlog ? 'Edit Blog Post' : 'Add New Blog Post'}
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
                      Title ({lang.code.toUpperCase()}){lang.is_default ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      name={`title-${lang.code}`}
                      value={formState.translations[lang.code]?.title || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'title', e.target.value)}
                      required={lang.is_default}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content ({lang.code.toUpperCase()}){lang.is_default ? '*' : ''}
                    </label>
                    <textarea
                      name={`content-${lang.code}`}
                      value={formState.translations[lang.code]?.content || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'content', e.target.value)}
                      required={lang.is_default}
                      rows={6}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excerpt ({lang.code.toUpperCase()})
                    </label>
                    <textarea
                      name={`excerpt-${lang.code}`}
                      value={formState.translations[lang.code]?.excerpt || ''}
                      onChange={(e) => handleTranslationChange(lang.code, 'excerpt', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Display Order (Low value first)
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formState.sort_order}
                    onChange={handleInputChange}
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
                      {currentBlog ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{currentBlog ? 'Update Blog Post' : 'Create Blog Post'}</>
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
