import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const RegistrationPendingPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {t('auth_registration_pending_title')}
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          {t('auth_registration_pending_thanks')}
        </p>
        <p className="text-gray-600">
          {t('auth_registration_pending_description')}
        </p>
        <div className="mt-6">
          <Link to="/signin" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth_return_to_signin_link')}
          </Link>
        </div>
      </div>
    </div>
  );
};
