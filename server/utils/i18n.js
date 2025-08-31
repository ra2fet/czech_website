const fs = require('fs');
const path = require('path');

class BackendI18n {
  constructor() {
    this.translations = {};
    this.fallbackLanguage = 'en';
    this.supportedLanguages = ['en', 'nl']; // Easy to extend
    this.loadTranslations();
  }

  loadTranslations() {
    this.supportedLanguages.forEach(lang => {
      try {
        const translationPath = path.join(__dirname, `../locales/${lang}/backend.json`);
        const translationContent = fs.readFileSync(translationPath, 'utf8');
        this.translations[lang] = JSON.parse(translationContent);
        console.log(`✅ Loaded ${lang} translations for backend`);
      } catch (error) {
        console.warn(`⚠️  Translation file for ${lang} not found, using fallback`);
        if (lang === this.fallbackLanguage) {
          this.translations[lang] = {};
        }
      }
    });
  }

  // Main translation function
  t(key, language = 'en', params = {}) {
    const translation = this.getTranslation(key, language) || 
                       this.getTranslation(key, this.fallbackLanguage) || 
                       key;

    return this.interpolate(translation, params);
  }

  getTranslation(key, language) {
    const keys = key.split('.');
    let current = this.translations[language];
    
    for (const k of keys) {
      current = current?.[k];
      if (current === undefined) break;
    }
    
    return current;
  }

  interpolate(text, params) {
    if (typeof text !== 'string') return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  // Add new language support dynamically
  addLanguage(langCode, translations) {
    if (!this.supportedLanguages.includes(langCode)) {
      this.supportedLanguages.push(langCode);
    }
    this.translations[langCode] = translations;
    console.log(`✅ Added ${langCode} language support`);
  }

  // Get all supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Reload translations (useful for development)
  reloadTranslations() {
    this.translations = {};
    this.loadTranslations();
  }

  // Check if a language is supported
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }

  // Get translation with fallback chain
  getTranslationWithFallback(key, language, fallbackLang = null) {
    const fallback = fallbackLang || this.fallbackLanguage;
    
    return this.getTranslation(key, language) || 
           this.getTranslation(key, fallback) || 
           key;
  }
}

// Create and export a singleton instance
const i18n = new BackendI18n();

module.exports = i18n;