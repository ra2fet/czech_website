import React, { useEffect, useState } from 'react';
import config from '../../config'; // Using config for axios instance
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast'; // Using react-hot-toast
import { PlusCircle, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface Announcement {
  id: number;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AnnouncementFormState {
  message: string;
  is_active: boolean;
}

const AnnouncementsManager: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [formState, setFormState] = useState<AnnouncementFormState>({
    message: '',
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || user.userType !== 'admin')) {
      // Handle unauthorized access, e.g., redirect to login or show an error
      toast.error('Unauthorized access. Only administrators can manage announcements.');
      setLoading(false);
      return;
    }
    if (user && user.userType === 'admin') {
      fetchAnnouncements();
    }
  }, [user, authLoading]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await config.axios.get('announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncementClick = () => {
    setIsEditing(false);
    setCurrentAnnouncement(null);
    setFormState({
      message: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEditAnnouncementClick = (announcement: Announcement) => {
    setIsEditing(true);
    setCurrentAnnouncement(announcement);
    setFormState({
      message: announcement.message,
      is_active: announcement.is_active,
    });
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.message.trim()) {
      toast.error('Announcement message cannot be empty.');
      return;
    }

    try {
      if (isEditing && currentAnnouncement) {
        await config.axios.put(`announcements/${currentAnnouncement.id}`, formState);
        toast.success('Announcement updated successfully!');
      } else {
        await config.axios.post('announcements', formState);
        toast.success('Announcement created successfully!');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement.');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      try {
        await config.axios.delete(`announcements/${id}`);
        toast.success('Announcement deleted successfully!');
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        toast.error('Failed to delete announcement.');
      }
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await config.axios.put(
        `announcements/${announcement.id}`,
        { ...announcement, is_active: !announcement.is_active }
      );
      toast.success(`Announcement ${announcement.is_active ? 'deactivated' : 'activated'} successfully!`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      toast.error('Failed to toggle announcement status.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Announcements</h1>

      <button
        onClick={handleAddAnnouncementClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center mb-6"
      >
        <PlusCircle size={20} className="mr-2" /> Add New Announcement
      </button>

      {announcements.length === 0 ? (
        <p className="text-gray-600">No announcements found. Click "Add New Announcement" to create one.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <tr key={announcement.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{announcement.message}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {announcement.is_active ? <Eye size={18} className="text-green-500" /> : <EyeOff size={18} className="text-red-500" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(announcement.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditAnnouncementClick(announcement)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit Announcement"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(announcement)}
                      className={`mr-3 ${
                        announcement.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                      }`}
                      title={announcement.is_active ? 'Deactivate Announcement' : 'Activate Announcement'}
                    >
                      {announcement.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Announcement"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Announcement' : 'Add New Announcement'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Announcement Message</label>
                <textarea
                  name="message"
                  id="message"
                  value={formState.message}
                  onChange={handleFormChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                ></textarea>
              </div>
              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formState.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Is Active
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isEditing ? 'Update Announcement' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManager;
