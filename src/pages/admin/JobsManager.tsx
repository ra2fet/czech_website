import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../config';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Pencil, Trash2, XCircle } from 'lucide-react';

interface JobPosition {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location?: string;
  salary_range?: string;
  is_active: boolean;
  created_at: string;
  translations?: {
    [key: string]: {
      title: string;
      description: string;
      requirements: string;
      location?: string;
    }
  };
}

const JobsManager: React.FC = () => {
  const { languages, loadingLanguages } = useLanguage();
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<JobPosition | null>(null);
  const [formData, setFormData] = useState<{
    salary_range: string;
    is_active: boolean;
    translations: {
      [key: string]: {
        title: string;
        description: string;
        requirements: string;
        location: string;
      }
    };
  }>({
    salary_range: '',
    is_active: true,
    translations: {},
  });

  useEffect(() => {
    if (!loadingLanguages && languages.length > 0) {
      const initialTranslations: any = {};
      languages.forEach(lang => {
        initialTranslations[lang.code] = {
          title: '',
          description: '',
          requirements: '',
          location: '',
        };
      });
      setFormData(prev => ({ ...prev, translations: initialTranslations }));
    }
  }, [languages, loadingLanguages]);

  useEffect(() => {
    fetchJobPositions();
  }, []);

  const fetchJobPositions = async () => {
    try {
      setLoading(true);
      const response = await config.axios.get('/contact/jobs');
      setJobPositions(response.data);
    } catch (err) {
      setError('Failed to fetch job positions.');
      toast.error('Failed to fetch job positions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleTranslationChange = (langCode: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langCode]: {
          ...prev.translations[langCode],
          [field]: value,
        },
      },
    }));
  };

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentJob) {
        // Edit existing job
        await config.axios.put(`/contact/jobs/${currentJob.id}`, formData);
        toast.success('Job position updated successfully!');
      } else {
        // Add new job
        await config.axios.post('/contact/jobs', formData);
        toast.success('Job position added successfully!');
      }
      setIsModalOpen(false);
      setCurrentJob(null);

      const resetTranslations: any = {};
      languages.forEach(lang => {
        resetTranslations[lang.code] = {
          title: '',
          description: '',
          requirements: '',
          location: '',
        };
      });

      setFormData({
        salary_range: '',
        is_active: true,
        translations: resetTranslations,
      });
      fetchJobPositions();
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors?.[0] || err.response?.data?.error || 'Failed to save job position.';
      toast.error(errorMessage);
      console.error(err);
    }
  };

  const handleEditClick = (job: JobPosition) => {
    setCurrentJob(job);

    const existingTranslations: any = {};
    languages.forEach(lang => {
      existingTranslations[lang.code] = {
        title: job.translations?.[lang.code]?.title || '',
        description: job.translations?.[lang.code]?.description || '',
        requirements: job.translations?.[lang.code]?.requirements || '',
        location: job.translations?.[lang.code]?.location || '',
      };
    });

    setFormData({
      salary_range: job.salary_range || '',
      is_active: job.is_active,
      translations: existingTranslations,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this job position? All associated job applications will also be permanently removed.')) {
      try {
        await config.axios.delete(`/contact/jobs/${id}`);
        setJobPositions(jobPositions.filter((job) => job.id !== id));
        toast.success('Job position and associated applications deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete job position.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="text-center py-4">Loading job positions...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Job Positions Manager</h1>
      <button
        onClick={() => {
          setCurrentJob(null);
          const initialTranslations: any = {};
          languages.forEach(lang => {
            initialTranslations[lang.code] = {
              title: '',
              description: '',
              requirements: '',
              location: '',
            };
          });
          setFormData({
            salary_range: '',
            is_active: true,
            translations: initialTranslations,
          });
          setIsModalOpen(true);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mb-6 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <Plus size={20} className="mr-2" />
        Add New Job
      </button>

      {jobPositions.length === 0 ? (
        <p className="text-gray-600">No job positions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-left">Requirements</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-left">Salary Range</th>
                <th className="py-3 px-4 text-left">Active</th>
                <th className="py-3 px-4 text-left">Created At</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {jobPositions.map((job) => (
                <tr key={job.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-4">{job.title}</td>
                  <td className="py-3 px-4">{job.description.substring(0, 50)}...</td>
                  <td className="py-3 px-4">{job.requirements.substring(0, 50)}...</td>
                  <td className="py-3 px-4">{job.location || 'N/A'}</td>
                  <td className="py-3 px-4">{job.salary_range || 'N/A'}</td>
                  <td className="py-3 px-4">{job.is_active ? 'Yes' : 'No'}</td>
                  <td className="py-3 px-4">{new Date(job.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(job)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">{currentJob ? 'Edit Job Position' : 'Add New Job Position'}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={28} />
              </button>
            </div>
            <form onSubmit={handleAddEditSubmit} className="space-y-6">
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
                {languages.map((lang) => (
                  <div key={lang.code} className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4 border-b pb-2">{lang.name} {lang.is_default && '*'}</h3>
                    <div className="mb-4">
                      <label htmlFor={`title-${lang.code}`} className="block text-gray-700 text-sm font-bold mb-2">Title ({lang.code}):</label>
                      <input
                        type="text"
                        id={`title-${lang.code}`}
                        value={formData.translations[lang.code]?.title || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'title', e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required={lang.is_default}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor={`description-${lang.code}`} className="block text-gray-700 text-sm font-bold mb-2">Description ({lang.code}):</label>
                      <textarea
                        id={`description-${lang.code}`}
                        value={formData.translations[lang.code]?.description || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'description', e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                        required={lang.is_default}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor={`requirements-${lang.code}`} className="block text-gray-700 text-sm font-bold mb-2">Requirements ({lang.code}):</label>
                      <textarea
                        id={`requirements-${lang.code}`}
                        value={formData.translations[lang.code]?.requirements || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'requirements', e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                        required={lang.is_default}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor={`location-${lang.code}`} className="block text-gray-700 text-sm font-bold mb-2">Location ({lang.code}):</label>
                      <input
                        type="text"
                        id={`location-${lang.code}`}
                        value={formData.translations[lang.code]?.location || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'location', e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                  </div>
                ))}

                <div className="border p-4 rounded-md bg-white">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4 border-b pb-2">General Info</h3>
                  <div className="mb-4">
                    <label htmlFor="salary_range" className="block text-gray-700 text-sm font-bold mb-2">Salary Range:</label>
                    <input
                      type="text"
                      id="salary_range"
                      name="salary_range"
                      value={formData.salary_range}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4 flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="mr-2 leading-tight"
                    />
                    <label htmlFor="is_active" className="text-gray-700 text-sm font-bold">Is Active</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors flex items-center"
                >
                  {currentJob ? (
                    <>
                      <Pencil size={18} className="mr-2" />
                      Update Job
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="mr-2" />
                      Add Job
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsManager;
