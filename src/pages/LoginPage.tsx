import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

interface ServerError {
  error: string;
}

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await signIn(formData.email, formData.password);
      toast.success(t('auth_sign_in_success'));
      if (loggedInUser && loggedInUser.userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/products'); // Default redirect to products page for customer/company
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      const axiosError = error as AxiosError<ServerError>;
      if (axiosError.response && axiosError.response.data && axiosError.response.data.error) {
        const errorMessage = axiosError.response.data.error;
        toast.error(errorMessage);
        if (errorMessage === 'Please verify your email address to sign in.') {
          navigate('/verify-email', { state: { email: formData.email } });
        }
      } else {
        toast.error(t('auth_sign_in_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth_sign_in_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth_sign_in_description')}{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              {t('auth_create_account_title').toLowerCase()}
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {t('auth_email_label')}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth_email_label')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth_password_label')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth_password_label')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={loading}
            >
              {loading ? t('auth_signing_in_button') : t('auth_sign_in_button')}
            </button>
          </div>

        </form>
        <div className="mt-6 text-center">
          <Link to="/" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth_return_home_link')}
          </Link>
        </div>
        <div className="mt-2 text-center">
          <a
            href="http://web.babobambo.com/webmail"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Login to Web Email
          </a>
        </div>
      </div>
    </div>
  );
};
