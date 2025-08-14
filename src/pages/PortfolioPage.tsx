import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check, Award, Target, Users, Lightbulb } from 'lucide-react';

// Company values data
const values = [
  {
    icon: <Target size={32} className="text-primary-600" />,
    title: 'Excellence',
    description: 'We strive for excellence in everything we do, from product development to customer service.'
  },
  {
    icon: <Award size={32} className="text-primary-600" />,
    title: 'Quality',
    description: 'Quality is at the heart of our business. We use only the finest materials and processes.'
  },
  {
    icon: <Lightbulb size={32} className="text-primary-600" />,
    title: 'Innovation',
    description: 'We constantly innovate to bring you cutting-edge solutions that drive your business forward.'
  },
  {
    icon: <Users size={32} className="text-primary-600" />,
    title: 'Customer Focus',
    description: 'Our customers are our priority. We listen to your needs and develop solutions accordingly.'
  }
];

// Projects data
const projects = [
  {
    id: 1,
    title: 'Enterprise Technology Upgrade',
    client: 'Global Manufacturing Corp',
    description: 'Implemented a comprehensive technology solution that improved efficiency by 35% and reduced operational costs by 28%.',
    image: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 2,
    title: 'Supply Chain Optimization',
    client: 'Logistics International',
    description: 'Developed a custom solution that streamlined the supply chain process, resulting in 40% faster delivery times and improved customer satisfaction.',
    image: 'https://images.pexels.com/photos/2977565/pexels-photo-2977565.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 3,
    title: 'Smart Factory Implementation',
    client: 'TechIndustries Ltd',
    description: 'Transformed traditional manufacturing facilities into smart factories with IoT integration, increasing production output by 45%.',
    image: 'https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  }
];

// Achievements data
const achievements = [
  {
    number: '15+',
    label: 'Years of Experience'
  },
  {
    number: '500+',
    label: 'Satisfied Clients'
  },
  {
    number: '1000+',
    label: 'Projects Completed'
  },
  {
    number: '25+',
    label: 'Industry Awards'
  }
];

export const PortfolioPage = () => {
  const valuesRef = useRef(null);
  const projectsRef = useRef(null);
  const achievementsRef = useRef(null);
  
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.2 });
  const projectsInView = useInView(projectsRef, { once: true, amount: 0.2 });
  const achievementsInView = useInView(achievementsRef, { once: true, amount: 0.2 });
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-secondary-800 text-white py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Portfolio</h1>
            <p className="text-xl opacity-90 mb-8">
              Discover our company's values, achievements, and the impactful projects we've completed
              for clients across various industries.
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
              Our Core Values
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
              Our values are the foundation of everything we do. They guide our decisions,
              shape our culture, and define how we work with our clients and each other.
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
              Featured Projects
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
              Our track record of success speaks for itself. Here are some of our most
              impactful projects that have transformed our clients' businesses.
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
                  <p className="text-primary-600 font-medium mb-4">Client: {project.client}</p>
                  <p className="text-gray-600 mb-6">{project.description}</p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <Check size={20} className="text-success-500 mr-2 flex-shrink-0 mt-1" />
                      <span>Custom implementation tailored to client needs</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-success-500 mr-2 flex-shrink-0 mt-1" />
                      <span>Seamless integration with existing systems</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-success-500 mr-2 flex-shrink-0 mt-1" />
                      <span>Comprehensive training and support</span>
                    </li>
                  </ul>
                  <a 
                    href="#" 
                    className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
                  >
                    View Case Study <ArrowRight size={16} className="ml-1" />
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
              Ready to Start Your Project?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Let's work together to transform your business with our proven solutions 
              and expertise. Contact us today to discuss your project.
            </p>
            <a 
              href="/contact" 
              className="btn btn-primary"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};