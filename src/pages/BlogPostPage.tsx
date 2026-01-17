import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { motion } from 'framer-motion';
import { BookOpen, Calendar, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import config from '../config';
const DEFAULT_BLOG_IMAGE = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object to access state
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastIncrementedId = useRef<string | null>(null);

  useEffect(() => {
    const blogDataFromState = location.state?.blog;

    if (blogDataFromState && !blog) {
      setBlog(blogDataFromState);
      setLoading(false);
    }

    const fetchBlogPost = async () => {
      if (!id) {
        setError(t('blog_id_missing'));
        setLoading(false);
        return;
      }

      // Only show loading if we don't have existing blog data
      if (!blog && !blogDataFromState) {
        setLoading(true);
      }
      setError(null);

      try {
        let data;
        if (config.useSupabase) {
          if (!supabase) {
            console.error('Supabase client is not initialized');
            throw new Error('Supabase client is not initialized');
          }
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
          // If this ID was already incremented, don't do it again
          const shouldIncrement = lastIncrementedId.current !== id;
          if (shouldIncrement) {
            lastIncrementedId.current = id;
          }

          const response = await config.axios.get(`${config.apiEndpoints.blogs}/${id}`, {
            params: { noIncrement: !shouldIncrement }
          });
          data = response.data;
        }

        if (data) {
          setBlog(data);
        } else {
          setError(t('blog_post_not_found_message'));
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        if (err instanceof Error) {
          setError(`${t('failed_to_load_blog_post')}: ${err.message}`);
        } else {
          setError(t('failed_to_load_blog_post_unknown_error'));
        }
        toast.error(t('failed_to_load_blog_post'));
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id, i18n.language]); // Depend on id and language to refetch when language changes

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
        <h1 className="text-2xl font-bold text-red-800 mb-4">{t('blog_post_error_title')}</h1>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() => navigate('/blogs')}
          className="btn btn-primary"
        >
          <ArrowLeft size={18} className="mr-2" /> {t('back_to_blogs_button')}
        </button>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <BookOpen size={64} className="text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-yellow-800 mb-4">{t('blog_post_not_found_title')}</h1>
        <p className="text-gray-700 mb-6">{t('blog_post_not_found_message')}</p>
        <button
          onClick={() => navigate('/blogs')}
          className="btn btn-primary"
        >
          <ArrowLeft size={18} className="mr-2" /> {t('back_to_blogs_button')}
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
          <ArrowLeft size={20} className="mr-2" /> {t('back_to_blogs_button')}
        </button>
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img
            src={blog.image_url || DEFAULT_BLOG_IMAGE}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_BLOG_IMAGE) {
                target.src = DEFAULT_BLOG_IMAGE;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {!blog.image_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
              <BookOpen size={64} className="text-primary-200" />
            </div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <User size={16} className="mr-1" />
            <span>{blog.author || t('admin_label')}</span>
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
