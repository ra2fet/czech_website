import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../config';

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: string;
}

const MessagesManager: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await config.axios.get('/contact/messages');
      setMessages(response.data);
    } catch (err) {
      setError('Failed to fetch messages.');
      toast.error('Failed to fetch messages.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await config.axios.delete(`/contact/messages/${id}`);
        setMessages(messages.filter((message) => message.id !== id));
        toast.success('Message deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete message.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="text-center py-4">Loading messages...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Contact Messages</h1>
      {messages.length === 0 ? (
        <p className="text-gray-600">No messages found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Subject</th>
                <th className="py-3 px-4 text-left">Message</th>
                <th className="py-3 px-4 text-left">Received At</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {messages.map((message) => (
                <tr key={message.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-4">{message.name}</td>
                  <td className="py-3 px-4">{message.email}</td>
                  <td className="py-3 px-4">{message.phone}</td>
                  <td className="py-3 px-4">{message.subject}</td>
                  <td className="py-3 px-4">{message.message}</td>
                  <td className="py-3 px-4">{new Date(message.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(message.id)}
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

export default MessagesManager;
