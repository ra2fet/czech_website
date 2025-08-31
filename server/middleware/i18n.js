const i18n = require('../utils/i18n');

/**
 * Language detection middleware
 * Detects user language from query params, Accept-Language header, or defaults to English
 * Attaches language and translation function to request object
 */
const detectLanguage = (req, res, next) => {
  // Priority order: query param -> header -> default
  let language = req.query.lang || 
                 extractLanguageFromHeader(req.headers['accept-language']) ||
                 'en';

  // Validate language is supported
  if (!i18n.isLanguageSupported(language)) {
    language = 'en';
  }

  // Attach to request object
  req.language = language;
  req.t = (key, params = {}) => i18n.t(key, language, params);
  
  // Add helper functions
  req.getResource = (resourceKey, plural = false) => {
    const key = plural ? `resources.${resourceKey}s` : `resources.${resourceKey}`;
    return req.t(key);
  };

  req.getFieldName = (fieldKey) => {
    return req.t(`validation.fields.${fieldKey}`);
  };

  next();
};

/**
 * Extract language from Accept-Language header
 * @param {string} acceptLanguageHeader 
 * @returns {string|null}
 */
function extractLanguageFromHeader(acceptLanguageHeader) {
  if (!acceptLanguageHeader) return null;

  // Parse Accept-Language header
  // Example: "en-US,en;q=0.9,nl;q=0.8" -> ["en-US", "en", "nl"]
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => {
      const [code, quality] = lang.trim().split(';');
      return {
        code: code.split('-')[0], // Extract main language code (en from en-US)
        quality: quality ? parseFloat(quality.split('=')[1]) : 1.0
      };
    })
    .sort((a, b) => b.quality - a.quality) // Sort by quality (preference)
    .map(item => item.code);

  // Return first supported language
  return languages.find(lang => i18n.isLanguageSupported(lang)) || null;
}

/**
 * Middleware to set response language headers
 */
const setLanguageHeaders = (req, res, next) => {
  // Set Content-Language header in response
  res.set('Content-Language', req.language || 'en');
  
  // Add Vary header to indicate response varies by Accept-Language
  res.set('Vary', 'Accept-Language');
  
  next();
};

/**
 * Middleware to validate language parameter
 */
const validateLanguage = (req, res, next) => {
  const { lang } = req.query;
  
  if (lang && !i18n.isLanguageSupported(lang)) {
    return res.status(400).json({
      error: 'Unsupported language',
      supportedLanguages: i18n.getSupportedLanguages()
    });
  }
  
  next();
};

module.exports = {
  detectLanguage,
  setLanguageHeaders,
  validateLanguage,
  extractLanguageFromHeader
};