import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import config from '../../config';

const DEFAULT_BLOG_IMAGE = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000';

interface Blog {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  created_at: string;
  // Add other blog properties as needed
}

export const NewsSection = () => {
  const { t, i18n } = useTranslation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, [i18n.language]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      let data;

      if (config.useSupabase) {
        if (!supabase) {
          console.error('Supabase client is not initialized');
          throw new Error('Supabase client is not initialized');
        }
        const { data: supabaseData, error } = await supabase
          .from('blogs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        data = supabaseData;
      } else {
        const response = await config.axios.get(`${config.apiEndpoints.blogs}?limit=3`);
        // If the API doesn't support limit param, we might get all of them, so we slice here just in case
        data = Array.isArray(response.data) ? response.data.slice(0, 3) : [];
      }

      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      // Fallback to empty array on error
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section ref={ref} className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-4 text-accent-900"
          >
            {t('news_section_title')}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-20 h-1 bg-gradient-to-r from-primary-600 to-secondary-500 mx-auto mb-6 rounded-full"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="max-w-2xl mx-auto text-gray-600"
          >
            {t('news_section_subtitle')}
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-500">
              {t('no_blog_posts_found')}
            </div>
          ) : (
            blogs.map((blog) => (
              <motion.div
                key={blog.id}
                variants={itemVariants}
                className="card card-hover"
              >
                <div className="h-48 relative overflow-hidden group">
                  <img
                    src={blog.image_url || DEFAULT_BLOG_IMAGE}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== DEFAULT_BLOG_IMAGE) {
                        target.src = DEFAULT_BLOG_IMAGE;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {!blog.image_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
                      <BookOpen size={48} className="text-primary-200" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center text-gray-500 mb-2">
                    <Calendar size={16} className="mr-1" />
                    <span className="text-sm">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{blog.title}</h3>
                  <p className="text-gray-600 mb-4">{blog.summary}</p>
                  <Link
                    to={`/blog/${blog.id}`}
                    className="inline-flex items-center text-primary-600 font-medium hover:text-secondary-500 transition-colors"
                  >
                    {t('read_more_button')} <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </section>
  );
};
