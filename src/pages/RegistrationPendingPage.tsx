import React from 'react';
import { Link } from 'react-router-dom';

export const RegistrationPendingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Registration Pending
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Thank you for registering your company!
        </p>
        <p className="text-gray-600">
          Your account is currently awaiting admin approval. You will receive an email notification once your account has been activated.
        </p>
        <div className="mt-6">
          <Link to="/signin" className="font-medium text-primary-600 hover:text-primary-500">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
