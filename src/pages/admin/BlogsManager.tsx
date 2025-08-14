import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  XCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import config from '../../config';

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  created_at: string;
}

export function BlogsManager() {
  // State for blogs data and UI
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: ''
  });

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Update form data when current blog changes
  useEffect(() => {
    if (currentBlog) {
      setFormData({
        title: currentBlog.title,
        content: currentBlog.content,
        excerpt: currentBlog.excerpt || '',
        image_url: currentBlog.image_url || ''
      });
    } else {
      // Reset form for new blog
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        image_url: ''
      });
    }
  }, [currentBlog]);

  // Fetch all blogs
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      if (config.useSupabase) {
        // Supabase fetch
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBlogs(data || []);
      } else {
        // Axios fetch
        const response = await config.axios.get(config.apiEndpoints.blogs);
        setBlogs(response.data || []);
      }
    } catch (error) {
      toast.error('Error fetching blogs');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for create/update
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (config.useSupabase) {
        // Supabase create/update
        let error;
        if (currentBlog) {
          // Update existing blog
          const { error: updateError } = await supabase
            .from('blogs')
            .update(formData)
            .eq('id', currentBlog.id);
          error = updateError;
        } else {
          // Create new blog
          const { error: insertError } = await supabase
            .from('blogs')
            .insert([formData]);
          error = insertError;
        }

        if (error) throw error;
      } else {
        // Axios create/update
        if (currentBlog) {
          // Update existing blog
           await axios.put(`${config.apiEndpoints.blogs}/${currentBlog.id}`, formData);
        } else {
          // Create new blog
          await axios.post(config.apiEndpoints.blogs, formData);
        }
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

  // Handle blog deletion
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
      if (config.useSupabase) {
          // Supabase delete
          const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } else {
          // Axios delete
          await axios.delete(`${config.apiEndpoints.blogs}/${id}`);
        }
        toast.success('Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        toast.error('Error deleting blog');
        console.error('Error:', error);
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content*
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
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
                />
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
