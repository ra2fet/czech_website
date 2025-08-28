import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  isScrolled: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isScrolled }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const buttonClass = (lng: string) => `
    px-2 py-1 rounded-md text-sm font-medium transition-colors duration-200
    ${isScrolled ? 'text-accent-900' : 'text-white'}
    ${i18n.language === lng 
      ? (isScrolled ? 'bg-primary-100 text-primary-700' : 'bg-white/20 text-white') 
      : (isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10')
    }
  `;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={buttonClass('en')}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('nl')}
        className={buttonClass('nl')}
        aria-label="Switch to Dutch"
      >
        NL
      </button>
    </div>
  );
};

export default LanguageSwitcher;
