import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import config from '../config';
import toast from 'react-hot-toast';

interface Language {
  code: string;
  name: string;
  native_name: string;
  is_default: boolean;
  is_active: boolean;
}

interface LanguageContextType {
  languages: Language[];
  loadingLanguages: boolean;
  defaultLanguage: Language | undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState<Language | undefined>(undefined);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await config.axios.get('languages');
        const fetchedLanguages: Language[] = response.data;
        setLanguages(fetchedLanguages);
        setDefaultLanguage(fetchedLanguages.find(lang => lang.is_default));
      } catch (error) {
        console.error('Error fetching languages:', error);
        toast.error('Failed to load supported languages.');
      } finally {
        setLoadingLanguages(false);
      }
    };

    fetchLanguages();
  }, []);

  return (
    <LanguageContext.Provider value={{ languages, loadingLanguages, defaultLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
