import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VideoHeroProps {
  scrollToContent: () => void;
}

export const VideoHero = ({ scrollToContent }: VideoHeroProps) => {
  const { t } = useTranslation();
  const [currentVideo, setCurrentVideo] = useState(0);
  
  const videos = [
  'https://videos.pexels.com/video-files/4144903/4144903-uhd_2560_1440_25fps.mp4'
  ];
  


    
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [videos.length]);

  return (
    <div className="video-container">
      {videos.map((video, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentVideo === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full"
          >
            <source src={video} type="video/mp4" />
            {t('video_not_supported')}
          </video>
        </div>
      ))}
      
      <div className="video-overlay">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center px-4 max-w-4xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t('video_hero_title')}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            {t('video_hero_subtitle')}
          </p>
          <button 
            className="bg-secondary-500 text-accent-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-secondary-400 transition-all duration-300 transform hover:scale-105 shadow-lg"
            onClick={() => window.location.href = '/products'}
          >
            {t('explore_products_button')}
          </button>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-10 flex flex-col items-center cursor-pointer"
          onClick={scrollToContent}
          whileHover={{ y: 5 }}
        >
          <span className="text-white text-sm mb-2">{t('scroll_down')}</span>
          <ChevronDown className="text-white animate-bounce" size={24} />
        </motion.button>
      </div>
    </div>
  );
};
