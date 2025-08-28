import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check, Award, Target, Users, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PortfolioPage = () => {
  const { t } = useTranslation();
  
  // Company values data
  const values = [
    {
      icon: <Target size={32} className="text-primary-600" />,
      title: t('portfolio_value_excellence_title'),
      description: t('portfolio_value_excellence_desc')
    },
    {
      icon: <Award size={32} className="text-primary-600" />,
      title: t('portfolio_value_quality_title'),
      description: t('portfolio_value_quality_desc')
    },
    {
      icon: <Lightbulb size={32} className="text-primary-600" />,
      title: t('portfolio_value_innovation_title'),
      description: t('portfolio_value_innovation_desc')
    },
    {
      icon: <Users size={32} className="text-primary-600" />,
      title: t('portfolio_value_customer_focus_title'),
      description: t('portfolio_value_customer_focus_desc')
    }
  ];
  
  // Projects data
  const projects = [
    {
      id: 1,
      title: t('portfolio_project_enterprise_title'),
      client: t('portfolio_project_enterprise_client'),
      description: t('portfolio_project_enterprise_desc'),
      image: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
      id: 2,
      title: t('portfolio_project_supply_chain_title'),
      client: t('portfolio_project_supply_chain_client'),
      description: t('portfolio_project_supply_chain_desc'),
      image: 'https://images.pexels.com/photos/2977565/pexels-photo-2977565.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
      id: 3,
      title: t('portfolio_project_smart_factory_title'),
      client: t('portfolio_project_smart_factory_client'),
      description: t('portfolio_project_smart_factory_desc'),
      image: 'https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    }
  ];
  
  // Achievements data
  const achievements = [
    {
      number: '15+',
      label: t('portfolio_achievement_years_experience')
    },
    {
      number: '500+',
      label: t('portfolio_achievement_satisfied_clients')
    },
    {
      number: '1000+',
      label: t('portfolio_achievement_projects_completed')
    },
    {
      number: '25+',
      label: t('portfolio_achievement_industry_awards')
    }
  ];
  const valuesRef = useRef(null);
  const projectsRef = useRef(null);
  const achievementsRef = useRef(null);
  
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.2 });
  const projectsInView = useInView(projectsRef, { once: true, amount: 0.2 });
  const achievementsInView = useInView(achievementsRef, { once: true, amount: 0.2 });
  
  return (
    <div>
      {/* Hero Section */}
      <section className="rafatbg text-white py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('portfolio_hero_title')}</h1>
            <p className="text-xl opacity-90 mb-8">
              {t('portfolio_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>
      
      {/* Company Values */}
      <section ref={valuesRef} className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={valuesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {t('portfolio_core_values_title')}
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={valuesInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-20 h-1 bg-primary-600 mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={valuesInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-2xl mx-auto text-gray-600"
            >
              {t('portfolio_core_values_subtitle')}
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 * index, duration: 0.6 }}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{value.title}</h3>
                <p className="text-gray-600 text-center">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Achievements */}
      <section ref={achievementsRef} className="py-16 bg-gradient-to-r from-primary-700 to-secondary-800 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={achievementsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{achievement.number}</div>
                <div className="text-lg opacity-90">{achievement.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Projects */}
      <section ref={projectsRef} className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={projectsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {t('portfolio_featured_projects_title')}
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={projectsInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-20 h-1 bg-primary-600 mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={projectsInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-2xl mx-auto text-gray-600"
            >
              {t('portfolio_featured_projects_subtitle')}
            </motion.p>
          </div>
          
          <div className="space-y-12">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={projectsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 * index, duration: 0.6 }}
                className={`md:flex ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''} bg-white rounded-lg shadow-md overflow-hidden`}
              >
                <div className="md:w-1/2">
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
                  <p className="text-primary-600 font-medium mb-4">{t('portfolio_client_label')} {project.client}</p>
                  <p className="text-gray-600 mb-6">{project.description}</p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <Check size={20} className="text-success-500 mr-2 flex-shrink-0 mt-1" />
                      <span>{t('portfolio_project_custom_implementation')}</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-success-500 mr-2 flex-shrink-0 mt-1" />
                      <span>{t('portfolio_project_seamless_integration')}</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-success-500 mr-2 flex-shrink-0 mt-1" />
                      <span>{t('portfolio_project_comprehensive_support')}</span>
                    </li>
                  </ul>
                  <a 
                    href="#" 
                    className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
                  >
                    {t('portfolio_view_case_study')} <ArrowRight size={16} className="ml-1" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gray-100">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('portfolio_cta_title')}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t('portfolio_cta_subtitle')}
            </p>
            <a 
              href="/contact" 
              className="btn btn-primary"
            >
              {t('portfolio_cta_get_in_touch')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
