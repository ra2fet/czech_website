import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Lightbulb, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

interface AboutUsData {
    image_url: string;
    hero_title: string;
    hero_subtitle: string;
    story_title: string;
    story_content: string;
    story_footer: string;
    vision_title: string;
    vision_description: string;
    mission_title: string;
    mission_description: string;
    sustainability_quote: string;
}

const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const AboutUsPage = () => {
    const { i18n } = useTranslation();
    const [data, setData] = useState<AboutUsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/about-us');
                if (response.data) {
                    setData(response.data);
                }
            } catch (error) {
                console.error('Error fetching about us data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [i18n.language]);

    return (
        <div className="overflow-x-hidden bg-white">
            {/* Hero Section */}
            <section className="rafatbg text-white py-24 md:py-32">
                <div className="container-custom">
                    <div className="max-w-3xl">
                        {loading ? (
                            <div className="space-y-6">
                                <Skeleton className="h-14 w-3/4 bg-white/20" />
                                <Skeleton className="h-8 w-1/2 bg-white/20" />
                            </div>
                        ) : (
                            <>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl md:text-5xl font-bold mb-6"
                                >
                                    {data?.hero_title}
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl opacity-90 mb-8"
                                >
                                    {data?.hero_subtitle}
                                </motion.p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-primary-100 text-primary-600">
                                <History size={32} />
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-1/2 mb-6" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-10 w-full mt-8" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">{data?.story_title}</h2>
                                    <div className="space-y-4 text-lg text-gray-700 whitespace-pre-wrap">
                                        {data?.story_content?.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                                            <p key={index}>{paragraph}</p>
                                        ))}
                                        {data?.story_footer && (
                                            <p className="font-bold text-primary-700 italic border-l-4 border-primary-500 pl-4 py-2 mt-8">
                                                {data.story_footer}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="relative"
                        >
                            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gray-50">
                                {loading ? (
                                    <Skeleton className="w-full h-full" />
                                ) : (
                                    data?.image_url && (
                                        <img
                                            src={data.image_url}
                                            alt="About Us Story"
                                            className="w-full h-full object-cover"
                                        />
                                    )
                                )}
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-secondary-400 rounded-2xl -z-10 opacity-20"></div>
                            <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary-500 rounded-2xl -z-10 opacity-20"></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Vision & Mission Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white p-8 md:p-12 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center text-accent-600 mb-6">
                                <Lightbulb size={28} />
                            </div>
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-1/3 mb-4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{data?.vision_title}</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {data?.vision_description}
                                    </p>
                                </>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="bg-white p-8 md:p-12 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                                <Target size={28} />
                            </div>
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-1/3 mb-4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{data?.mission_title}</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {data?.mission_description}
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Sustainability Highlight */}
            {!loading && data?.sustainability_quote && (
                <section className="py-20 bg-primary-900 text-white overflow-hidden relative">
                    <div className="container-custom relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center max-w-4xl mx-auto"
                        >
                            <h2 className="text-3xl md:text-5xl font-bold mb-8 italic">
                                "{data.sustainability_quote}"
                            </h2>
                            <div className="inline-block h-1 w-24 bg-secondary-400"></div>
                        </motion.div>
                    </div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-800 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500 rounded-full -ml-32 -mb-32 opacity-10 blur-3xl"></div>
                </section>
            )}
        </div>
    );
};
