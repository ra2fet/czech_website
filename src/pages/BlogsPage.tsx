import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { BookOpen, Calendar, User, Search, TrendingUp, Clock } from 'lucide-react'; // Icons for blog posts
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
const DEFAULT_BLOG_IMAGE = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000';

export const BlogsPage = () => {
  const { t, i18n } = useTranslation();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [sidebarData, setSidebarData] = useState<{ latest: any[], popular: any[] }>({ latest: [], popular: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchBlogs();
    fetchSidebarData();
  }, [i18n.language, debouncedSearch]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);

      let data;
      if (config.useSupabase) {
        if (!supabase) {
          console.error('Supabase client is not initialized');
          throw new Error('Supabase client is not initialized');
        }
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
        const response = await config.axios.get(config.apiEndpoints.blogs, {
          params: { search: debouncedSearch }
        });
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

  const fetchSidebarData = async () => {
    try {
      const response = await config.axios.get(`${config.apiEndpoints.blogs}/sidebar`);
      setSidebarData(response.data);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
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

      {/* Blog Content */}
      <section ref={ref} className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main Content */}
            <div className="lg:w-2/3">
              {/* Search Bar - Mobile/Tablet */}
              <div className="mb-8 lg:hidden relative">
                <input
                  type="text"
                  placeholder={t('search_blogs_placeholder', 'Search articles...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary-500 bg-white"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>

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
                      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
                    >
                      <div className="md:flex">
                        <div className="md:w-1/3 h-56 md:h-auto relative overflow-hidden group">
                          <img
                            src={blog.image_url || DEFAULT_BLOG_IMAGE}
                            alt={blog.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== DEFAULT_BLOG_IMAGE) {
                                target.src = DEFAULT_BLOG_IMAGE;
                              }
                            }}
                          />
                          {!blog.image_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
                              <BookOpen size={48} className="text-primary-200" />
                            </div>
                          )}
                        </div>
                        <div className="md:w-2/3 p-8">
                          <div className="flex items-center gap-4 text-sm text-primary-600 font-medium mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(blog.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp size={14} />
                              {t('views_count', { count: (blog as any).views || 0 })}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold mb-3 text-gray-900 leading-tight">
                            {blog.title}
                          </h3>
                          <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">
                            {blog.summary || blog.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                            <div className="flex items-center text-sm text-gray-500">
                              <User size={16} className="mr-2" />
                              <span>{blog.author || t('admin_label')}</span>
                            </div>
                            <button
                              onClick={() => navigate(`/blog/${blog.id}`, { state: { blog } })}
                              className="text-primary-600 font-bold hover:text-primary-700 flex items-center gap-2 group transition-colors"
                            >
                              {t('read_more_link')}
                              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-1/3 space-y-10">
              {/* Search Bar - Desktop */}
              <div className="hidden lg:block relative sticky top-24">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="text-lg font-bold mb-4 text-gray-900">{t('sidebar_search_title', 'Search')}</h4>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('search_blogs_placeholder', 'Search articles...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>

                {/* Latest Posts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock size={20} className="text-primary-600" />
                    <h4 className="text-lg font-bold text-gray-900">{t('latest_posts_title')}</h4>
                  </div>
                  <div className="space-y-6">
                    {sidebarData.latest.map((post) => (
                      <div
                        key={post.id}
                        className="flex gap-4 group cursor-pointer"
                        onClick={() => navigate(`/blog/${post.id}`)}
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                          <img
                            src={post.image_url || DEFAULT_BLOG_IMAGE}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== DEFAULT_BLOG_IMAGE) {
                                target.src = DEFAULT_BLOG_IMAGE;
                              }
                            }}
                          />
                          {!post.image_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
                              <BookOpen size={24} className="text-primary-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <h5 className="font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug mb-1">
                            {post.title}
                          </h5>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{t('views_count', { count: (post as any).views || 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Posts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={20} className="text-primary-600" />
                    <h4 className="text-lg font-bold text-gray-900">{t('popular_posts_title')}</h4>
                  </div>
                  <div className="space-y-6">
                    {sidebarData.popular.map((post) => (
                      <div
                        key={post.id}
                        className="flex gap-4 group cursor-pointer"
                        onClick={() => navigate(`/blog/${post.id}`)}
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                          <img
                            src={post.image_url || DEFAULT_BLOG_IMAGE}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== DEFAULT_BLOG_IMAGE) {
                                target.src = DEFAULT_BLOG_IMAGE;
                              }
                            }}
                          />
                          {!post.image_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
                              <BookOpen size={24} className="text-primary-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <h5 className="font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug mb-1">
                            {post.title}
                          </h5>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{t('views_count', { count: post.views || 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};
