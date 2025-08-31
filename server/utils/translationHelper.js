const db = require('../config/db');

class TranslationHelper {
  constructor() {
    this.db = db;
  }

  /**
   * Get localized content with fallback for multiple items
   * @param {string} table - Main table name (e.g., 'products', 'blogs')
   * @param {Array|number} ids - Array of IDs or single ID
   * @param {string} language - Target language code
   * @param {string} fallbackLanguage - Fallback language code
   * @returns {Promise} - Localized content
   */
  async getLocalizedContent(table, ids, language = 'en', fallbackLanguage = 'en') {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    const isMultiple = Array.isArray(ids);
    
    if (idsArray.length === 0) {
      return isMultiple ? [] : null;
    }

    const placeholders = idsArray.map(() => '?').join(',');
    const translationTable = `${table}_translations`;
    const entityIdField = this.getEntityIdField(table);
    
    const query = `
      SELECT 
        t1.*,
        COALESCE(tt1.title, tt2.title) as title,
        COALESCE(tt1.content, tt2.content) as content,
        COALESCE(tt1.description, tt2.description) as description,
        COALESCE(tt1.excerpt, tt2.excerpt) as excerpt,
        COALESCE(tt1.name, tt2.name) as name,
        COALESCE(tt1.address, tt2.address) as address,
        COALESCE(tt1.question, tt2.question) as question,
        COALESCE(tt1.answer, tt2.answer) as answer,
        COALESCE(tt1.message, tt2.message) as message,
        COALESCE(tt1.requirements, tt2.requirements) as requirements,
        COALESCE(tt1.location, tt2.location) as location
      FROM ${table} t1
      LEFT JOIN ${translationTable} tt1 ON t1.id = tt1.${entityIdField} AND tt1.language_code = ?
      LEFT JOIN ${translationTable} tt2 ON t1.id = tt2.${entityIdField} AND tt2.language_code = ?
      WHERE t1.id IN (${placeholders})
      ORDER BY t1.created_at DESC
    `;
    
    const params = [language, fallbackLanguage, ...idsArray];
    
    return new Promise((resolve, reject) => {
      this.db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(isMultiple ? results : (results[0] || null));
        }
      });
    });
  }

  /**
   * Get all content with translations for a table
   * @param {string} table - Table name
   * @param {string} language - Target language
   * @param {string} fallbackLanguage - Fallback language
   * @param {Object} options - Query options (limit, offset, where conditions)
   * @returns {Promise} - All localized content
   */
  async getAllLocalizedContent(table, language = 'en', fallbackLanguage = 'en', options = {}) {
    const translationTable = `${table}_translations`;
    const entityIdField = this.getEntityIdField(table);
    
    let whereClause = '';
    let limitClause = '';
    let orderClause = 'ORDER BY t1.created_at DESC';
    
    if (options.where) {
      whereClause = `WHERE ${options.where}`;
    }
    
    if (options.limit) {
      limitClause = `LIMIT ${options.limit}`;
      if (options.offset) {
        limitClause += ` OFFSET ${options.offset}`;
      }
    }
    
    if (options.orderBy) {
      orderClause = `ORDER BY ${options.orderBy}`;
    }

    const query = `
      SELECT 
        t1.*,
        COALESCE(tt1.title, tt2.title) as title,
        COALESCE(tt1.content, tt2.content) as content,
        COALESCE(tt1.description, tt2.description) as description,
        COALESCE(tt1.excerpt, tt2.excerpt) as excerpt,
        COALESCE(tt1.name, tt2.name) as name,
        COALESCE(tt1.address, tt2.address) as address,
        COALESCE(tt1.question, tt2.question) as question,
        COALESCE(tt1.answer, tt2.answer) as answer,
        COALESCE(tt1.message, tt2.message) as message,
        COALESCE(tt1.requirements, tt2.requirements) as requirements,
        COALESCE(tt1.location, tt2.location) as location
      FROM ${table} t1
      LEFT JOIN ${translationTable} tt1 ON t1.id = tt1.${entityIdField} AND tt1.language_code = ?
      LEFT JOIN ${translationTable} tt2 ON t1.id = tt2.${entityIdField} AND tt2.language_code = ?
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `;
    
    const params = [language, fallbackLanguage];
    
    return new Promise((resolve, reject) => {
      this.db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Save translation for an entity
   * @param {string} table - Table name
   * @param {number} entityId - Entity ID
   * @param {string} languageCode - Language code
   * @param {Object} translations - Translation data
   * @returns {Promise} - Save result
   */
  async saveTranslation(table, entityId, languageCode, translations) {
    const translationTable = `${table}_translations`;
    const entityIdField = this.getEntityIdField(table);
    
    const fields = Object.keys(translations);
    const values = Object.values(translations);
    const placeholders = fields.map(() => '?').join(',');
    const updateFields = fields.map(field => `${field} = VALUES(${field})`).join(',');
    
    const query = `
      INSERT INTO ${translationTable} (${entityIdField}, language_code, ${fields.join(',')})
      VALUES (?, ?, ${placeholders})
      ON DUPLICATE KEY UPDATE ${updateFields}
    `;
    
    const params = [entityId, languageCode, ...values];
    
    return new Promise((resolve, reject) => {
      this.db.query(query, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Delete translations for an entity
   * @param {string} table - Table name
   * @param {number} entityId - Entity ID
   * @param {string} languageCode - Optional: specific language to delete
   * @returns {Promise} - Delete result
   */
  async deleteTranslations(table, entityId, languageCode = null) {
    const translationTable = `${table}_translations`;
    const entityIdField = this.getEntityIdField(table);
    
    let query = `DELETE FROM ${translationTable} WHERE ${entityIdField} = ?`;
    let params = [entityId];
    
    if (languageCode) {
      query += ' AND language_code = ?';
      params.push(languageCode);
    }
    
    return new Promise((resolve, reject) => {
      this.db.query(query, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Get entity ID field name based on table name
   * @param {string} table - Table name
   * @returns {string} - Entity ID field name
   */
  getEntityIdField(table) {
    // Handle special cases
    const specialCases = {
      'open_positions': 'position_id'
    };
    
    if (specialCases[table]) {
      return specialCases[table];
    }
    
    // Default: remove 's' and add '_id'
    const singular = table.endsWith('s') ? table.slice(0, -1) : table;
    return `${singular}_id`;
  }

  /**
   * Check if translation exists
   * @param {string} table - Table name
   * @param {number} entityId - Entity ID
   * @param {string} languageCode - Language code
   * @returns {Promise<boolean>} - Translation exists
   */
  async translationExists(table, entityId, languageCode) {
    const translationTable = `${table}_translations`;
    const entityIdField = this.getEntityIdField(table);
    
    const query = `SELECT 1 FROM ${translationTable} WHERE ${entityIdField} = ? AND language_code = ? LIMIT 1`;
    const params = [entityId, languageCode];
    
    return new Promise((resolve, reject) => {
      this.db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results.length > 0);
        }
      });
    });
  }
}

module.exports = TranslationHelper;