import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../config';

interface JobApplication {
  id: number;
  position_id: number;
  position_title: string; // Assuming the backend joins and provides this
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  cover_letter?: string;
  applied_at: string;
}

const ApplicationsManager: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await config.axios.get('/contact/applications');
      setApplications(response.data);
    } catch (err) {
      setError('Failed to fetch job applications.');
      toast.error('Failed to fetch job applications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        await config.axios.delete(`/contact/applications/${id}`);
        setApplications(applications.filter((app) => app.id !== id));
        toast.success('Job application deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete job application.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="text-center py-4">Loading job applications...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Job Applications</h1>
      {applications.length === 0 ? (
        <p className="text-gray-600">No job applications found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Position</th>
                <th className="py-3 px-4 text-left">Applicant Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Resume URL</th>
                <th className="py-3 px-4 text-left">Cover Letter</th>
                <th className="py-3 px-4 text-left">Applied At</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-4">{app.position_title}</td>
                  <td className="py-3 px-4">{app.name}</td>
                  <td className="py-3 px-4">{app.email}</td>
                  <td className="py-3 px-4">{app.phone}</td>
                  <td className="py-3 px-4">
                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      View Resume
                    </a>
                  </td>
                  <td className="py-3 px-4">{app.cover_letter || 'N/A'}</td>
                  <td className="py-3 px-4">{new Date(app.applied_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(app.id)}
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
    </div>
  );
};

export default ApplicationsManager;
