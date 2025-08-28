import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import config from '../config';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

interface ServerError {
  error: string;
}

export const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';
  const [email] = useState(initialEmail); // Email is now read-only from state
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30); // 60 seconds countdown for resend

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !resendLoading) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, resendLoading]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await config.axios.post('/auth/verify-email', { email, code });
      toast.success(response.data.message);
      navigate('/signin'); // Redirect to login page after successful verification
    } catch (error) {
      console.error('Verification error:', error);
      const axiosError = error as AxiosError<ServerError>;
      if (axiosError.response && axiosError.response.data && axiosError.response.data.error) {
        toast.error(axiosError.response.data.error);
      } else {
        toast.error(t('auth_verification_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setCountdown(60); // Reset countdown
    try {
      await config.axios.post('auth/resend-verification-code', { email });
      toast.success(t('auth_resend_code_success'));
    } catch (error) {
      console.error('Resend verification code error:', error);
      const axiosError = error as AxiosError<ServerError>;
      if (axiosError.response && axiosError.response.data && axiosError.response.data.error) {
        toast.error(axiosError.response.data.error);
      } else {
        toast.error(t('auth_resend_code_failed'));
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth_verify_email_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth_verify_email_description', { email })}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="code" className="sr-only">
                {t('auth_verification_code_label')}
              </label>
              <input
                id="code"
                name="code"
                type="text"
                autoComplete="off"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('auth_verification_code_label')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading || resendLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={loading}
            >
              {loading ? t('auth_verifying_button') : t('auth_verify_account_button')}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <button
            onClick={handleResendCode}
            className={`font-medium ${countdown === 0 && !resendLoading ? 'text-primary-600 hover:text-primary-500' : 'text-gray-400 cursor-not-allowed'}`}
            disabled={resendLoading || countdown > 0}
          >
            {resendLoading ? t('auth_sending_button') : countdown > 0 ? t('auth_resend_code_countdown', { countdown }) : t('auth_resend_code_button')}
          </button>
          <p className="mt-2">
            {t('auth_already_verified_question')}{' '}
            <Link to="/signin" className="font-medium text-primary-600 hover:text-primary-500">
              {t('auth_sign_in_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
