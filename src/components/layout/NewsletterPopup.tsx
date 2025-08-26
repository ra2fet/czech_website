import React, { useState, useEffect } from 'react';
import config from '../../config';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface ErrorResponseData {
  message: string;
}

const NewsletterPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('newsletter_shown');
    if (!hasSeenPopup) {
      // Delay showing the popup slightly after the intro screen might have finished
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000); // Adjust delay as needed
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoin = async () => {
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    try {
      // Replace with your actual API endpoint
      await config.axios.post('newsletter/subscribe', { email });
      setMessage('Thank you for subscribing!');
      localStorage.setItem('newsletter_shown', 'true');
      toast.success(`Thank you for subscribing!`);

      setIsOpen(false);
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      const axiosError = error as AxiosError<ErrorResponseData>;
      if (axiosError.response && axiosError.response.status === 409 && axiosError.response.data && axiosError.response.data.message === 'Email already subscribed.') {
        setMessage('Email already subscribed.');
        localStorage.setItem('newsletter_shown', 'true'); // Hide popup if already subscribed
        setIsOpen(false);
        toast.success('You are already subscribed!');
      } else {
        setMessage('Failed to subscribe. Please try again.');
        toast.error('Failed to subscribe. Please try again.');
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Join Our Newsletter</h2>
        <p className="mb-6 text-gray-700">
          Stay updated with our latest news and offers!
        </p>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 border border-gray-300  rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleJoin}
          className="btn btn-primary text-white py-3  mr-4   transition duration-300"
        >
          Join
        </button>
        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
        <button
          onClick={() => {
            // localStorage.setItem('newsletter_shown', 'true'); // Mark as seen even if closed
            setIsOpen(false);
          }}
          className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
        >
          No, thanks
        </button>
      </div>
    </div>
  );
};

export default NewsletterPopup;
