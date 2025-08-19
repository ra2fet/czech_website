import React, { useEffect, useState } from 'react';
 import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../config';

interface JobPosition {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location?: string;
  salary_range?: string;
  is_active: boolean;
  created_at: string;
}

const JobsManager: React.FC = () => {
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<JobPosition | null>(null);
  const [formData, setFormData] = useState<Omit<JobPosition, 'id' | 'created_at'>>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_range: '',
    is_active: true,
  });

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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
      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        salary_range: '',
        is_active: true,
      });
      fetchJobPositions();
    } catch (err) {
      toast.error('Failed to save job position.');
      console.error(err);
    }
  };

  const handleEditClick = (job: JobPosition) => {
    setCurrentJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location || '',
      salary_range: job.salary_range || '',
      is_active: job.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this job position?')) {
      try {
        await config.axios.delete(`/contact/jobs/${id}`);
        setJobPositions(jobPositions.filter((job) => job.id !== id));
        toast.success('Job position deleted successfully!');
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
          setFormData({
            title: '',
            description: '',
            requirements: '',
            location: '',
            salary_range: '',
            is_active: true,
          });
          setIsModalOpen(true);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
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
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{currentJob ? 'Edit Job Position' : 'Add New Job Position'}</h2>
            <form onSubmit={handleAddEditSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="requirements" className="block text-gray-700 text-sm font-bold mb-2">Requirements:</label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Location:</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
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
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  {currentJob ? 'Update Job' : 'Add Job'}
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
