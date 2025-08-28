import React, { useState, useEffect } from 'react';
import config from '../../config';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

interface ErrorResponseData {
  message: string;
}

const NewsletterPopup: React.FC = () => {
  const { t } = useTranslation();
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
      setMessage(t('email_required'));
      return;
    }

    try {
      // Replace with your actual API endpoint
      await config.axios.post('newsletter/subscribe', { email });
      setMessage(t('subscription_success'));
      localStorage.setItem('newsletter_shown', 'true');
      toast.success(t('subscription_success'));

      setIsOpen(false);
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      const axiosError = error as AxiosError<ErrorResponseData>;
      if (axiosError.response && axiosError.response.status === 409 && axiosError.response.data && axiosError.response.data.message === 'Email already subscribed.') {
        setMessage(t('already_subscribed'));
        localStorage.setItem('newsletter_shown', 'true'); // Hide popup if already subscribed
        setIsOpen(false);
        toast.success(t('already_subscribed'));
      } else {
        setMessage(t('subscription_failed'));
        toast.error(t('subscription_failed'));
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-4">{t('newsletter_title')}</h2>
        <p className="mb-6 text-gray-700">
          {t('newsletter_description')}
        </p>
        <input
          type="email"
          placeholder={t('email_placeholder')}
          className="w-full p-3 border border-gray-300  rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleJoin}
          className="btn btn-primary text-white py-3  mr-4   transition duration-300"
        >
          {t('join_button')}
        </button>
        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
        <button
          onClick={() => {
            localStorage.setItem('newsletter_shown', 'true'); // Mark as seen even if closed
            setIsOpen(false);
          }}
          className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
        >
          {t('no_thanks_button')}
        </button>
      </div>
    </div>
  );
};

export default NewsletterPopup;
