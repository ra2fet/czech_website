import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { motion } from 'framer-motion';
import { BookOpen, Calendar, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import config from '../config';

interface Blog {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  author?: string;
  created_at: string;
  content: string;
}

export const BlogPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object to access state
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const blogDataFromState = location.state?.blog;

    if (blogDataFromState) {
      setBlog(blogDataFromState);
      setLoading(false);
      return;
    }

    const fetchBlogPost = async () => {
      if (!id) {
        setError('Blog ID is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let data;
        if (config.useSupabase) {
          const { data: supabaseData, error: fetchError } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', id)
            .single();

          if (fetchError) {
            throw new Error(`Database error: ${fetchError.message}`);
          }
          data = supabaseData;
        } else {
          const response = await config.axios.get(`${config.apiEndpoints.blogs}/${id}`);
          data = response.data;
        }

        if (data) {
          setBlog(data);
        } else {
          setError('Blog post not found.');
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        if (err instanceof Error) {
          setError(`Failed to load blog post: ${err.message}`);
        } else {
          setError('Failed to load blog post: An unknown error occurred');
        }
        toast.error('Failed to load blog post.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id, location.state?.blog]); // Depend on id and specific blog data from state

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <BookOpen size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-800 mb-4">Error</h1>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() => navigate('/blogs')}
          className="btn btn-primary"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Blogs
        </button>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <BookOpen size={64} className="text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-yellow-800 mb-4">Blog Post Not Found</h1>
        <p className="text-gray-700 mb-6">The blog post you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/blogs')}
          className="btn btn-primary"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 py-12"
    >
      <div className="container-custom max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => navigate('/blogs')}
          className="flex items-center text-primary-600 hover:text-primary-800 transition-colors p-6 pb-0"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Blogs
        </button>
        {blog.image_url && (
          <img
            src={blog.image_url}
            alt={blog.title}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <User size={16} className="mr-1" />
            <span>{blog.author || 'Admin'}</span>
            <Calendar size={16} className="ml-4 mr-1" />
            <span>{new Date(blog.created_at).toLocaleDateString()}</span>
          </div>
          <div className="prose prose-lg max-w-none text-gray-800">
            <p className="text-xl font-semibold mb-4">{blog.summary}</p>
            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
