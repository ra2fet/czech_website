# Backend Multilingual Support Documentation

## Overview

The backend now supports multilingual functionality with separate translation tables for content and JSON-based translation files for system messages. This implementation provides a scalable solution for international applications.

## Architecture

### 1. Translation System Components

- **`utils/i18n.js`**: Centralized translation system for system messages
- **`middleware/i18n.js`**: Language detection middleware
- **`utils/translationHelper.js`**: Helper for database content translations
- **`locales/`**: Translation files directory
- **`routes/languages.js`**: API endpoints for language management

### 2. Database Schema

#### Languages Table
```sql
CREATE TABLE `languages` (
  `code` VARCHAR(5) PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `native_name` VARCHAR(50) NOT NULL,
  `is_default` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Translation Tables (Example: Products)
```sql
CREATE TABLE `products_translations` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `language_code` VARCHAR(5) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`language_code`) REFERENCES `languages`(`code`) ON DELETE CASCADE,
  UNIQUE KEY `unique_product_lang` (`product_id`, `language_code`)
);
```

## Implementation

### 1. Language Detection

The system detects language in this priority order:
1. Query parameter: `?lang=nl`
2. `Accept-Language` header
3. Default: English (`en`)

```javascript
// Example API call with language
GET /api/products?lang=nl
// or with header
Accept-Language: nl,en;q=0.9
```

### 2. Translation Usage in Routes

```javascript
// routes/products.js
const TranslationHelper = require('../utils/translationHelper');
const translationHelper = new TranslationHelper();

router.get('/', async (req, res) => {
  try {
    const localizedProducts = await translationHelper.getAllLocalizedContent(
      'products', 
      req.language,
      'en'
    );
    res.json(localizedProducts);
  } catch (error) {
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('product', true) })
    });
  }
});
```

### 3. System Messages Translation

```javascript
// Available helper functions in routes
req.t('errors.validation.required', { field: 'Name' })
req.getResource('product') // Returns "Product" or "Product"
req.getFieldName('email') // Returns "Email" or "E-mail"
```

### 4. Content Translation Management

```javascript
// Save translation
await translationHelper.saveTranslation('products', productId, 'nl', {
  name: 'Nederlandse productnaam',
  description: 'Nederlandse beschrijving'
});

// Get localized content
const product = await translationHelper.getLocalizedContent(
  'products', 
  productId, 
  'nl', 
  'en' // fallback
);
```

## API Endpoints

### Language Management
- `GET /api/languages` - Get all active languages
- `GET /api/languages/current` - Get current language info
- `GET /api/languages/codes` - Get supported language codes

### Content Endpoints
All content endpoints now support language detection:
- `GET /api/products` - Returns localized products
- `GET /api/blogs` - Returns localized blogs
- `GET /api/faqs` - Returns localized FAQs
- etc.

## Frontend Integration

### Axios Configuration
```typescript
// src/api/axios.ts
instance.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language;
  return config;
});
```

### Usage Example
```typescript
// The backend automatically returns content in the user's language
const products = await api.get('/products'); // Uses current i18n language
```

## Adding New Languages

### 1. Create Translation File
```bash
# Create new language directory
mkdir server/locales/fr

# Create translation file
cp server/locales/en/backend.json server/locales/fr/backend.json
# Edit the file with French translations
```

### 2. Update Language Support
```javascript
// In utils/i18n.js
this.supportedLanguages = ['en', 'nl', 'fr']; // Add 'fr'
```

### 3. Add to Database
```sql
INSERT INTO languages (code, name, native_name, is_active) 
VALUES ('fr', 'French', 'Français', TRUE);
```

### 4. Create Content Translations
```sql
-- Example for products
INSERT INTO products_translations (product_id, language_code, name, description)
VALUES (1, 'fr', 'Nom du produit français', 'Description française');
```

## Translation File Structure

### Backend Messages (locales/en/backend.json)
```json
{
  "errors": {
    "validation": {
      "required": "{{field}} is required",
      "invalid_email": "Please provide a valid email address"
    },
    "resources": {
      "not_found": "{{resource}} not found"
    }
  },
  "success": {
    "resources": {
      "created": "{{resource}} created successfully"
    }
  },
  "resources": {
    "product": "Product",
    "products": "Products"
  }
}
```

## Best Practices

### 1. Validation Messages
```javascript
// Use localized field names
const validationErrors = [];
if (!name) {
  validationErrors.push(req.t('errors.validation.required', { 
    field: req.getFieldName('name') 
  }));
}
```

### 2. Error Handling
```javascript
// Always provide localized error messages
catch (error) {
  res.status(500).json({ 
    error: req.t('errors.resources.fetch_failed', { 
      resource: req.getResource('product', true) 
    })
  });
}
```

### 3. Content Management
```javascript
// Save both English and additional languages
await translationHelper.saveTranslation('products', id, 'en', { name, description });
if (translations) {
  for (const [lang, content] of Object.entries(translations)) {
    await translationHelper.saveTranslation('products', id, lang, content);
  }
}
```

## Testing

### Language Detection
```bash
# Test with query parameter
curl "http://localhost:5001/api/products?lang=nl"

# Test with header
curl -H "Accept-Language: nl" "http://localhost:5001/api/products"
```

### Error Messages
```bash
# Test validation errors in Dutch
curl -X POST -H "Accept-Language: nl" -H "Content-Type: application/json" \
  -d '{}' "http://localhost:5001/api/products"
```

## Migration Notes

1. **Database Migration**: Run the migration SQL to create translation tables
2. **Content Migration**: Existing content is automatically migrated to English translations
3. **API Compatibility**: All existing API endpoints remain compatible
4. **Gradual Rollout**: Can implement translations route by route

## Performance Considerations

1. **Indexing**: Translation tables have indexes on (entity_id, language_code)
2. **Caching**: Translation files are loaded once at startup
3. **Fallback**: Always falls back to English if translation missing
4. **Query Optimization**: Uses LEFT JOINs with COALESCE for efficient queries

## Troubleshooting

### Common Issues
1. **Missing Translations**: Check if translation exists in database
2. **Wrong Language**: Verify Accept-Language header or query parameter
3. **Fallback Not Working**: Ensure English translations exist
4. **Performance**: Check database indexes on translation tables

### Debug Mode
```javascript
// Enable debug logging
console.log('Current language:', req.language);
console.log('Translation:', req.t('some.key'));
```