import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Phone, Mail, MapPin, Send, FileText, Users, CheckCircle, XCircle } from 'lucide-react';
import config from '../config';
import { useTranslation } from 'react-i18next';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const ContactFormSection = () => {
  const { t } = useTranslation();
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '', // Add phone to formData
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    try {
      const response = await config.axios.post('contact/send-message', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone, // Send phone number
        subject: formData.subject,
        message: formData.message,
      });

      if (response.status === 201) {
        setFormStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setFormStatus('error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold mb-6">{t('contact_send_message_title')}</h3>

      {formStatus === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-100 border border-success-300 text-success-700 p-4 rounded-lg mb-6 flex items-center"
        >
          <CheckCircle size={24} className="text-success-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">{t('contact_message_sent_success_title')}</p>
            <p>{t('contact_message_sent_success_description')}</p>
          </div>
        </motion.div>
      ) : formStatus === 'error' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger-100 border border-danger-300 text-danger-700 p-4 rounded-lg mb-6 flex items-center"
        >
          <XCircle size={24} className="text-danger-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">{t('contact_message_sent_error_title')}</p>
            <p>{t('contact_message_sent_error_description')}</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('contact_your_name_label')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('contact_email_address_label')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('contact_phone_number_label')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                {t('contact_subject_label')}
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('contact_select_subject_option')}</option>
                <option value="general">{t('contact_general_inquiry_option')}</option>
                <option value="product">{t('contact_product_information_option')}</option>
                <option value="support">{t('contact_technical_support_option')}</option>
                <option value="partnership">{t('contact_partnership_opportunities_option')}</option>
                <option value="other">{t('contact_other_option')}</option>
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              {t('contact_your_message_label')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={formStatus === 'submitting'}
            className={`btn btn-primary w-full flex justify-center items-center ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {formStatus === 'submitting' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('contact_sending_button')}
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                {t('contact_send_message_button')}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

interface Position {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range?: string;
}

interface JobApplicationFormData {
  name: string;
  email: string;
  phone: string;
  position_id: string;
  resume_url: string;
  cover_letter: string;
}

const JobApplicationSection = () => {
  const { t } = useTranslation();
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<JobApplicationFormData>({
    name: '',
    email: '',
    phone: '',
    position_id: '', // Changed from 'position' to 'position_id'
    resume_url: '', // Changed from 'resume' to 'resume_url'
    cover_letter: '', // Changed from 'message' to 'cover_letter'
  });
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionsError, setPositionsError] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Position | null>(null);

  useEffect(() => {
    const fetchOpenPositions = async () => {
      try {
        const response = await config.axios.get('/contact/open-positions');
        setOpenPositions(response.data);
      } catch (error) {
        console.error('Error fetching open positions:', error);
        setPositionsError(true);
      } finally {
        setPositionsLoading(false);
      }
    };
    fetchOpenPositions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Frontend validation for file extension
      const allowedExtensions = ['pdf', 'doc', 'docx'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        setFileError(t('job_invalid_file_format_error') || 'Invalid file format. Please upload PDF, DOC, or DOCX.');
        return;
      }

      // Check file size (optional, but good practice since backend has a limit)
      if (file.size > 10 * 1024 * 1024) {
        setFileError(t('errors.file.size_exceeded') || 'File size exceeds 10MB limit.');
        return;
      }

      const formData = new FormData();
      formData.append('resume', file);

      try {
        const response = await config.axios.post('/contact/upload-resume', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.status === 200) {
          setFormData(prev => ({ ...prev, resume_url: response.data.filePath }));
          console.log('Resume uploaded successfully:', response.data.filePath);
        } else {
          setFormData(prev => ({ ...prev, resume_url: '' }));
          setFileError(response.data.error || t('errors.file.upload_failed') || 'Upload failed');
        }
      } catch (error: any) {
        console.error('Error uploading resume:', error);
        setFormData(prev => ({ ...prev, resume_url: '' }));
        const errorMessage = error.response?.data?.error || t('errors.file.upload_failed') || 'Upload failed';
        setFileError(errorMessage);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    if (!formData.resume_url) {
      setFormStatus('error');
      console.error(t('job_resume_not_uploaded_error'));
      return;
    }

    try {
      const response = await config.axios.post('/contact/apply-job', {
        position_id: parseInt(formData.position_id),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        resume_url: formData.resume_url, // This will now be the path from the upload
        cover_letter: formData.cover_letter,
      });

      if (response.status === 201) {
        setFormStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          position_id: '',
          resume_url: '',
          cover_letter: '',
        });
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setFormStatus('error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold mb-6">{t('job_apply_title')}</h3>

      {formStatus === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-100 border border-success-300 text-success-700 p-4 rounded-lg mb-6 flex items-center"
        >
          <CheckCircle size={24} className="text-success-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">{t('job_application_success_title')}</p>
            <p>{t('job_application_success_description')}</p>
          </div>
        </motion.div>
      ) : formStatus === 'error' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger-100 border border-danger-300 text-danger-700 p-4 rounded-lg mb-6 flex items-center"
        >
          <XCircle size={24} className="text-danger-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">{t('job_application_error_title')}</p>
            <p>{t('job_application_error_description')}</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('job_your_name_label')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('job_email_address_label')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('job_phone_number_label')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="position_id" className="block text-sm font-medium text-gray-700 mb-1">
                {t('job_position_label')}
              </label>
              {positionsLoading ? (
                <p className="text-gray-500">{t('job_loading_positions')}</p>
              ) : positionsError ? (
                <p className="text-danger-600">{t('job_error_loading_positions')}</p>
              ) : (
                <div className="flex flex-col space-y-2">
                  <select
                    id="position_id"
                    name="position_id"
                    value={formData.position_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{t('job_select_position_option')}</option>
                    {openPositions.map((position) => (
                      <option key={position.id} value={position.id}>{position.title} ({position.location})</option>
                    ))}
                  </select>
                  {formData.position_id && (
                    <button
                      type="button"
                      onClick={() => {
                        const job = openPositions.find(p => p.id === parseInt(formData.position_id));
                        if (job) {
                          setSelectedJob(job);
                          setIsModalOpen(true);
                        }
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center self-start"
                    >
                      <FileText size={16} className="mr-1" />
                      {t('job_see_details_button')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="resume_url" className="block text-sm font-medium text-gray-700 mb-1">
                {t('job_resume_label')}
              </label>
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center pt-5 w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${fileError
                  ? 'border-danger-500 bg-danger-50'
                  : formData.resume_url
                    ? 'border-success-500 bg-success-100'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText size={24} className={`${fileError ? 'text-danger-500' : formData.resume_url ? 'text-success-600' : 'text-gray-400'} mb-2`} />
                    <p className={`mb-2 text-sm ${fileError ? 'text-danger-700' : formData.resume_url ? 'text-success-700' : 'text-gray-500'}`}>
                      <span className="font-semibold">{t('job_click_to_upload')}</span> {t('job_or_drag_and_drop')}
                    </p>
                    <p className={`text-xs ${fileError ? 'text-danger-600' : formData.resume_url ? 'text-success-600' : 'text-gray-500'}`}>{t('job_pdf_max_size')}</p>
                  </div>
                  <input
                    type="file"
                    name="resume_url"
                    id="resume_url"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
              {fileError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200"
                >
                  {fileError}
                </motion.p>
              )}
              {formData.resume_url && !fileError && (
                <p className="mt-2 text-sm text-success-600 font-medium">
                  {t('job_selected_file')} {formData.resume_url.split('/').pop()}
                </p>
              )}
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('job_cover_letter_label')}
            </label>
            <textarea
              id="cover_letter"
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={formStatus === 'submitting'}
            className={`btn btn-primary w-full flex justify-center items-center ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {formStatus === 'submitting' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('job_submitting_button')}
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                {t('job_submit_application_button')}
              </>
            )}
          </button>
        </form>
      )}

      {/* Job Details Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">{selectedJob.title}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={28} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('job_location_label')}</h4>
                  <p className="text-gray-800 flex items-center mt-1">
                    <MapPin size={16} className="text-primary-600 mr-2" />
                    {selectedJob.location}
                  </p>
                </div>
                {selectedJob.salary_range && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('job_salary_label')}</h4>
                    <p className="text-gray-800 mt-1">{selectedJob.salary_range}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{t('job_description_label')}</h4>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedJob.description}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{t('job_requirements_label')}</h4>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedJob.requirements}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-primary px-8"
              >
                {t('job_close_button')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export const ContactPage = () => {
  const { t } = useTranslation();
  const contactRef = useRef(null);
  const jobsRef = useRef(null);

  const contactInView = useInView(contactRef, { once: true, amount: 0.2 });
  const jobsInView = useInView(jobsRef, { once: true, amount: 0.2 });

  return (
    <div>
      {/* Hero Section */}
      <section className="rafatbg text-white py-24 md:py-32">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('contact_page_hero_title')}</h1>
            <p className="text-xl opacity-90 mb-8">
              {t('contact_page_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section ref={contactRef} className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={contactInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="inline-flex justify-center items-center w-16 h-16 mb-4 rounded-full bg-primary-100">
                <Phone size={28} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('contact_phone_title')}</h3>
              <p className="text-gray-600 mb-2">{t('contact_phone_description')}</p>
              <a href="tel:+31640887984" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                +31-640887984
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={contactInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="inline-flex justify-center items-center w-16 h-16 mb-4 rounded-full bg-primary-100">
                <Mail size={28} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('contact_email_title')}</h3>
              <p className="text-gray-600 mb-2">{t('contact_email_description')}</p>
              <a href="mailto:info@babobamboo.com" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                info@babobamboo.com
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={contactInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="inline-flex justify-center items-center w-16 h-16 mb-4 rounded-full bg-primary-100">
                <MapPin size={28} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('contact_headquarters_title')}</h3>
              <p className="text-gray-600 mb-2">{t('contact_headquarters_description')}</p>
              <address className="not-italic text-primary-600">
                Papenkamp 20-P,6836 BD Arnhem
                {/* <br />
                Suite 100, New York, NY 10001 */}
              </address>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={contactInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <ContactFormSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={contactInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="bg-gray-100 p-8 rounded-lg flex flex-col justify-center"
            >
              <h3 className="text-2xl font-bold mb-6">{t('contact_here_to_help_title')}</h3>
              <p className="text-gray-700 mb-6">
                {t('contact_here_to_help_description')}
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-4">
                    <CheckCircle size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">{t('contact_product_support_title')}</h4>
                    <p className="text-gray-600">{t('contact_product_support_description')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-4">
                    <CheckCircle size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">{t('contact_sales_inquiries_title')}</h4>
                    <p className="text-gray-600">{t('contact_sales_inquiries_description')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-4">
                    <CheckCircle size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">{t('contact_partnership_opportunities_title')}</h4>
                    <p className="text-gray-600">{t('contact_partnership_opportunities_description')}</p>
                  </div>
                </div>
              </div>
              {/* <div className="text-sm text-gray-600">
                <p className="font-bold mb-1">{t('contact_business_hours_title')}</p>
                <p>{t('contact_business_hours_mon_fri')}</p>
                <p>{t('contact_business_hours_sat')}</p>
                <p>{t('contact_business_hours_sun')}</p>
              </div> */}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section ref={jobsRef} className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={jobsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {t('contact_join_our_team_title')}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={jobsInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-20 h-1 bg-primary-600 mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={jobsInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-2xl mx-auto text-gray-600"
            >
              {t('contact_join_our_team_description')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={jobsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <Users size={24} className="text-primary-600 mr-2" />
                  <h3 className="text-xl font-bold">{t('contact_open_positions_title')}</h3>
                </div>
                <p className="text-gray-500">{t('contact_open_positions_message')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={jobsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="lg:col-span-2"
            >
              <JobApplicationSection />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
