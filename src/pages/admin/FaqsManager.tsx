import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Save, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import config from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface FAQ {
  id: number;
  question: string; // Default language question
  answer: string; // Default language answer
  created_at: string;
  updated_at: string;
  translations?: { 
    [key: string]: { 
      question: string; 
      answer: string; 
    } 
  };
}

interface FaqFormState {
  translations: { 
    [key: string]: { 
      question: string; 
      answer: string; 
    } 
  };
}

export const FaqsManager = () => {
  const { user } = useAuth();
  const { languages, loadingLanguages, defaultLanguage } = useLanguage();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<FAQ | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formState, setFormState] = useState<FaqFormState>({
    translations: {},
  });

  useEffect(() => {
    if (!loadingLanguages) {
      fetchFaqs();
    }
  }, [user, loadingLanguages]);

  useEffect(() => {
    if (currentFaq && languages.length > 0) {
      const existingTranslations: { [key: string]: { question: string; answer: string; } } = {};
      languages.forEach(lang => {
        existingTranslations[lang.code] = {
          question: currentFaq.translations?.[lang.code]?.question || '',
          answer: currentFaq.translations?.[lang.code]?.answer || '',
        };
      });
      setFormState({
        translations: existingTranslations,
      });
    } else if (languages.length > 0) {
      const initialTranslations: { [key: string]: { question: string; answer: string; } } = {};
      languages.forEach(lang => {
        initialTranslations[lang.code] = { question: '', answer: '' };
      });
      setFormState({
        translations: initialTranslations,
      });
    }
  }, [currentFaq, languages]);

  const fetchFaqs = async () => {
    if (!user) {
      setError('Authentication required to fetch FAQs.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await config.axios.get('faqs/admin');
      setFaqs(response.data || []);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to fetch FAQs.');
      toast.error('Failed to fetch FAQs.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (faq?: FAQ) => {
    if (loadingLanguages) {
      toast.error('Languages are still loading. Please wait.');
      return;
    }
    setCurrentFaq(faq || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentFaq(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!defaultLanguage || !formState.translations[defaultLanguage.code]?.question.trim() || !formState.translations[defaultLanguage.code]?.answer.trim()) {
      toast.error(`Question and answer in default language (${defaultLanguage?.name || 'English'}) are required.`);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        translations: formState.translations,
      };

      if (currentFaq) {
        await config.axios.put(`faqs/${currentFaq.id}`, payload);
        toast.success('FAQ updated successfully!');
      } else {
        await config.axios.post('faqs', payload);
        toast.success('FAQ created successfully!');
      }
      fetchFaqs();
      closeModal();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      toast.error(`Failed to save FAQ: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }
    try {
      await config.axios.delete(`faqs/${id}`);
      toast.success('FAQ deleted successfully!');
      fetchFaqs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      toast.error(`Failed to delete FAQ: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleTranslationChange = (langCode: string, field: 'question' | 'answer', value: string) => {
    setFormState(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langCode]: {
          ...prev.translations[langCode],
          [field]: value
        }
      }
    }));
  };

  if (loading || loadingLanguages) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-600">
        <p>{error}</p>
        {!user && <p className="mt-2">Please log in to manage FAQs.</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage FAQs</h1>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={20} className="mr-2" /> Add New FAQ
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg">No FAQs found. Click "Add New FAQ" to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Question</th>
                <th className="py-3 px-6 text-left">Answer</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              <AnimatePresence>
                {faqs.map((faq) => (
                  <motion.tr
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-6 text-left max-w-xs truncate">{faq.question}</td>
                    <td className="py-3 px-6 text-left max-w-md truncate">{faq.answer}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center space-x-3">
                        <button
                          onClick={() => openModal(faq)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {currentFaq ? 'Edit FAQ' : 'Add New FAQ'}
              </h2>
              <form onSubmit={handleSubmit}>
                {languages.map(lang => (
                  <div key={lang.code} className="space-y-2 border p-4 rounded-md mb-4">
                    <h4 className="font-semibold text-lg text-gray-800">{lang.name}</h4>
                    <div className="mb-4">
                      <label htmlFor={`question-${lang.code}`} className="block text-gray-700 text-sm font-bold mb-2">
                        Question ({lang.code.toUpperCase()}){lang.is_default ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        id={`question-${lang.code}`}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formState.translations[lang.code]?.question || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'question', e.target.value)}
                        required={lang.is_default}
                      />
                    </div>
                    <div className="mb-6">
                      <label htmlFor={`answer-${lang.code}`} className="block text-gray-700 text-sm font-bold mb-2">
                        Answer ({lang.code.toUpperCase()}){lang.is_default ? '*' : ''}
                      </label>
                      <textarea
                        id={`answer-${lang.code}`}
                        rows={4}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formState.translations[lang.code]?.answer || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'answer', e.target.value)}
                        required={lang.is_default}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-secondary flex items-center"
                    disabled={isSaving}
                  >
                    <XCircle size={20} className="mr-2" /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex items-center"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 size={20} className="animate-spin mr-2" />
                    ) : (
                      <Save size={20} className="mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save FAQ'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
