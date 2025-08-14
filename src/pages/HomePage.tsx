import { useRef, createRef } from 'react';
import { motion } from 'framer-motion';

import { VideoHero } from '../components/home/VideoHero';
import { ProductsSection } from '../components/home/ProductsSection';
import { NewsSection } from '../components/home/NewsSection';
import { CtaSection } from '../components/home/CtaSection';

export const HomePage = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50">
      {/* Video Hero Section */}
      <VideoHero scrollToContent={scrollToContent} />
      
      {/* Content Sections */}
      <div ref={contentRef}>
        {/* Products Section */}
        <ProductsSection />
        
        {/* News Section */}
        <NewsSection />
        
        {/* CTA Section */}
        <CtaSection />
      </div>
    </div>
  );
};