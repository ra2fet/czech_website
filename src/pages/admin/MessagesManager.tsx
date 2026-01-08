import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Eye,
  Trash2,
  X,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
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
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

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
        if (selectedMessage?.id === id) setSelectedMessage(null);
      } catch (err) {
        toast.error('Failed to delete message.');
        console.error(err);
      }
    }
  };

  const truncateMessage = (text: string, length: number = 50) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <MessageSquare size={48} className="mb-4 opacity-20" />
        <p className="text-xl font-semibold">{error}</p>
        <button
          onClick={fetchMessages}
          className="mt-4 px-6 py-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-500 mt-1">Manage and respond to inquiries from your website visitors.</p>
        </div>
        <div className="bg-primary-50 px-4 py-2 rounded-lg border border-primary-100">
          <span className="text-primary-700 font-semibold">{messages.length}</span>
          <span className="text-primary-600 ml-2 text-sm">Total Messages</span>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
            <MessageSquare size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No messages found</h3>
          <p className="text-gray-500 mt-2">When visitors send messages through the contact form, they will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Sender</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Subject & Message</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                          {message.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">{message.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {message.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          {message.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 mb-1">{message.subject}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{truncateMessage(message.message)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-900 font-medium">
                          {new Date(message.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedMessage(message)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Message"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gray-50 px-8 py-6 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200">
                  <MessageSquare size={24} />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
                  <p className="text-sm text-gray-500">Inquiry ID: #{selectedMessage.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400 mr-3 mt-0.5">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sender Name</p>
                      <p className="text-gray-900 font-semibold">{selectedMessage.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400 mr-3 mt-0.5">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                      <a href={`mailto:${selectedMessage.email}`} className="text-primary-600 font-semibold hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400 mr-3 mt-0.5">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                      <p className="text-gray-900 font-semibold">{selectedMessage.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400 mr-3 mt-0.5">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date Received</p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(selectedMessage.created_at).toLocaleString(undefined, {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Subject</p>
                  <p className="text-lg font-bold text-gray-900">{selectedMessage.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</p>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-5 flex items-center justify-between border-t border-gray-100">
              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="flex items-center text-red-500 font-semibold hover:text-red-600 transition-colors"
              >
                <Trash2 size={18} className="mr-2" />
                Delete Message
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center"
                >
                  <Mail size={18} className="mr-2" />
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default MessagesManager;

