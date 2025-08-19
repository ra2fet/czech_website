import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Phone, Mail, MapPin, Send, FileText, Users, CheckCircle, XCircle } from 'lucide-react';
import config from '../config';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const ContactFormSection = () => {
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
      const response = await config.axios.post('/contact/send-message', {
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
      <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
      
      {formStatus === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-100 border border-success-300 text-success-700 p-4 rounded-lg mb-6 flex items-center"
        >
          <CheckCircle size={24} className="text-success-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">Message Sent Successfully!</p>
            <p>Thank you for contacting us. We'll get back to you shortly.</p>
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
            <p className="font-bold">Error Sending Message!</p>
            <p>There was an issue sending your message. Please try again later.</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name*
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
                Email Address*
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
                Phone Number
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
                Subject*
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="product">Product Information</option>
                <option value="support">Technical Support</option>
                <option value="partnership">Partnership Opportunities</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Your Message*
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
            className={`btn btn-primary w-full flex justify-center items-center ${
              formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {formStatus === 'submitting' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Send Message
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
  location: string;
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('resume', file); // 'resume' must match the field name in multer upload.single('resume')

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
          console.error('Error uploading resume:', response.data.msg);
          setFormStatus('error'); // Indicate an error in form status
        }
      } catch (error) {
        console.error('Error uploading resume:', error);
        setFormStatus('error'); // Indicate an error in form status
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    if (!formData.resume_url) {
      setFormStatus('error');
      console.error('Resume not uploaded.');
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
      <h3 className="text-2xl font-bold mb-6">Apply for a Job</h3>
      
      {formStatus === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-100 border border-success-300 text-success-700 p-4 rounded-lg mb-6 flex items-center"
        >
          <CheckCircle size={24} className="text-success-600 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">Application Submitted!</p>
            <p>Thank you for your interest in joining our team. We'll review your application and contact you soon.</p>
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
            <p className="font-bold">Error Submitting Application!</p>
            <p>There was an issue with your application. Please try again later.</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name*
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
                Email Address*
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
                Phone Number*
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
                Position*
              </label>
              {positionsLoading ? (
                <p className="text-gray-500">Loading positions...</p>
              ) : positionsError ? (
                <p className="text-danger-600">Error loading positions. Please try again.</p>
              ) : (
                <select
                  id="position_id"
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a position</option>
                  {openPositions.map((position) => (
                    <option key={position.id} value={position.id}>{position.title} ({position.location})</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label htmlFor="resume_url" className="block text-sm font-medium text-gray-700 mb-1">
                Resume/CV (PDF)*
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText size={24} className="text-gray-400 mb-2" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    name="resume_url"
                    id="resume_url"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
              {formData.resume_url && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected file: {formData.resume_url.split('/').pop()}
                </p>
              )}
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-1">
              Cover Letter
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
            className={`btn btn-primary w-full flex justify-center items-center ${
              formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {formStatus === 'submitting' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Submit Application
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export const ContactPage = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl opacity-90 mb-8">
              Have questions or need more information? Get in touch with our team and we'll
              be happy to assist you.
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
              <h3 className="text-xl font-bold mb-2">Phone</h3>
              <p className="text-gray-600 mb-2">Call us for quick inquiries</p>
              <a href="tel:+12345678900" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                +1 (234) 567-8900
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
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-gray-600 mb-2">Send us a detailed message</p>
              <a href="mailto:info@company.com" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                info@company.com
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
              <h3 className="text-xl font-bold mb-2">Headquarters</h3>
              <p className="text-gray-600 mb-2">Visit our main office</p>
              <address className="not-italic text-primary-600">
                123 Business Avenue,<br />
                Suite 100, New York, NY 10001
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
              <h3 className="text-2xl font-bold mb-6">We're Here to Help</h3>
              <p className="text-gray-700 mb-6">
                Our customer support team is available to assist you with any questions or concerns you may have about our products and services.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-4">
                    <CheckCircle size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">Product Support</h4>
                    <p className="text-gray-600">Get help with product specifications, usage, and troubleshooting.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-4">
                    <CheckCircle size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">Sales Inquiries</h4>
                    <p className="text-gray-600">Speak with our sales team about bulk orders, pricing, and customization.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-4">
                    <CheckCircle size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">Partnership Opportunities</h4>
                    <p className="text-gray-600">Explore potential collaboration and partnership opportunities.</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-bold mb-1">Business Hours:</p>
                <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                <p>Saturday: 10:00 AM - 2:00 PM EST</p>
                <p>Sunday: Closed</p>
              </div>
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
              Join Our Team
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
              We're always looking for talented individuals to join our growing team.
              Check out our open positions and submit your application.
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
                  <h3 className="text-xl font-bold">Open Positions</h3>
                </div>
                {/* The JobApplicationSection handles its own loading/error/empty states */}
                <p className="text-gray-500">Please refer to the application form for available positions.</p>
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
