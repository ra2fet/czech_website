import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { BookOpen, Calendar, User } from 'lucide-react'; // Icons for blog posts
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useTranslation } from 'react-i18next';

interface Blog {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  author?: string;
  created_at: string;
  content: string; // Assuming there's a content field for the full blog post
}
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import config from '../config'; // Import config

export const BlogsPage = () => {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);

      let data;
      if (config.useSupabase) {
        console.log('Fetching blogs from Supabase...');
        const { data: supabaseData, error: fetchError } = await supabase
          .from('blogs') // Assuming a 'blogs' table in Supabase
          .select('*')
          .order('created_at', { ascending: false });

        console.log('Supabase response:', { data: supabaseData, error: fetchError });
        if (fetchError) {
          console.error('Supabase error:', fetchError);
          throw new Error(`Database error: ${fetchError.message}`);
        }
        data = supabaseData;
      } else {
        console.log('Fetching blogs from API...');
        const response = await config.axios.get(config.apiEndpoints.blogs); // Assuming a 'blogs' endpoint
        console.log('API response:', response.data);
        data = response.data;
      }

      if (data && Array.isArray(data)) {
        console.log('Setting blogs:', data.length, 'items');
        setBlogs(data);
      } else {
        console.log('No data received or invalid format');
        setBlogs([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching blogs:', error);
      if (error instanceof Error) {
        toast.error(`${t('failed_to_fetch_blogs')}: ${error.message}`);
      } else {
        toast.error(t('failed_to_fetch_blogs_unknown_error'));
      }
    } finally {
      setLoading(false);
      console.log('Finished loading blogs');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div>
      {/* Hero Section - Reusing rafatbg style */}
      <section className="rafatbg text-white py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('blogs_page_hero_title')}</h1>
            <p className="text-xl opacity-90 mb-8">
              {t('blogs_page_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Blog List */}
      <section ref={ref} className="section-padding bg-gray-50">
        <div className="container-custom">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen size={32} className="text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-yellow-800 mb-4">{t('no_blog_posts_available_title')}</h2>
              <p className="text-yellow-600 mb-6">
                {t('no_blog_posts_available_message')}
              </p>
              <button
                onClick={fetchBlogs}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                {t('refresh_button')}
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="space-y-8"
            >
              {blogs.map((blog) => (
                <motion.div
                  key={blog.id}
                  variants={itemVariants}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="md:flex">
                    <div className="md:w-1/3 h-64 md:h-auto">
                      <img
                        src={blog.image_url}
                        alt={blog.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.nextElementSibling instanceof HTMLElement) {
                            target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div
                        className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center"
                        style={{ display: blog.image_url ? 'none' : 'flex' }}
                      >
                        <BookOpen size={48} className="text-primary-600" />
                      </div>
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{blog.title}</h3>
                        <p className="text-gray-600 mb-4">{blog.summary}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <User size={16} className="mr-1" />
                          <span>{blog.author || t('admin_label')}</span>
                          <Calendar size={16} className="ml-4 mr-1" />
                          <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <a
                          href={`/blog/${blog.id}`} // Link to individual blog post page
                          className="text-primary-600 font-medium hover:text-primary-700"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent default link behavior
                            navigate(`/blog/${blog.id}`, { state: { blog } }); // Pass blog object in state
                          }}
                        >
                          {t('read_more_link')} &rarr;
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};
