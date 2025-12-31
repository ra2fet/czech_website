import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Target, Lightbulb, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AboutUsPage = () => {
    const { t } = useTranslation();
    const storyRef = useRef(null);
    const visionRef = useRef(null);
    const missionRef = useRef(null);

    const storyInView = useInView(storyRef, { once: true, amount: 0.2 });
    const visionInView = useInView(visionRef, { once: true, amount: 0.2 });
    const missionInView = useInView(missionRef, { once: true, amount: 0.2 });

    return (
        <div>
            {/* Hero Section */}
            <section className="rafatbg text-white py-24 md:py-32">
                <div className="container-custom">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('about_us_hero_title')}</h1>
                        <p className="text-xl opacity-90 mb-8">
                            {t('about_us_hero_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section ref={storyRef} className="section-padding">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={storyInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-primary-100 text-primary-600">
                                <History size={32} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('about_us_story_title')}</h2>
                            <div className="space-y-4 text-lg text-gray-700">
                                <p>{t('about_us_story_p1')}</p>
                                <p>{t('about_us_story_p2')}</p>
                                <p>{t('about_us_story_p3')}</p>
                                <p>{t('about_us_story_p4')}</p>
                                <p className="font-bold text-primary-700 italic border-l-4 border-primary-500 pl-4 py-2 mt-8">
                                    {t('about_us_story_footer')}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={storyInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="relative"
                        >
                            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&q=80&w=800"
                                    alt="Bamboo Sustainable Material"
                                    className="w-full h-full object-cover"
                                />
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
                            ref={visionRef}
                            initial={{ opacity: 0, y: 20 }}
                            animate={visionInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6 }}
                            className="bg-white p-8 md:p-12 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center text-accent-600 mb-6">
                                <Lightbulb size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{t('our_vision_title')}</h3>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {t('our_vision_description')}
                            </p>
                        </motion.div>

                        <motion.div
                            ref={missionRef}
                            initial={{ opacity: 0, y: 20 }}
                            animate={missionInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="bg-white p-8 md:p-12 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                                <Target size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{t('our_mission_title')}</h3>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {t('our_mission_description')}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Sustainability Highlight */}
            <section className="py-20 bg-primary-900 text-white overflow-hidden relative">
                <div className="container-custom relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-8 italic">
                            "Babo is more than paper products — it’s a conscious choice for a cleaner home and a calmer planet."
                        </h2>
                        <div className="inline-block h-1 w-24 bg-secondary-400"></div>
                    </div>
                </div>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-800 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500 rounded-full -ml-32 -mb-32 opacity-10 blur-3xl"></div>
            </section>
        </div>
    );
};
