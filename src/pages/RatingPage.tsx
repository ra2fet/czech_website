import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import config from '../config';
import { Star } from 'lucide-react';
import { AxiosError } from 'axios'; // Import AxiosError type
import { useTranslation } from 'react-i18next';

// Simple Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">X</button>
    </div>
  );
};

interface Product {
  id: number;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  order_date: string;
  total_amount: number;
  items: Product[];
}

const RatingPage: React.FC = () => {
  const { t } = useTranslation();
  const { ratingToken } = useParams<{ ratingToken: string }>(); // Only extract ratingToken
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [overallComment, setOverallComment] = useState<string>('');
  const [productRatings, setProductRatings] = useState<{ [key: number]: { rating: number; comment: string } }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Hide toast after 5 seconds
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!ratingToken) {
        setError(t('rating_invalid_link_error'));
        setLoading(false);
        return;
      }

      try {
        // Fetch order details using the new public single order endpoint
        const response = await config.axios.get(`orders/public-single-by-token/${ratingToken}`);
        setOrder(response.data);

        if (response.data.rating_token_used) {
          setError(t('rating_already_rated_error'));
          setLoading(false);
          return;
        }

        // Initialize product ratings
        const initialProductRatings: { [key: number]: { rating: number; comment: string } } = {};
        response.data.items.forEach((item: Product) => {
          initialProductRatings[item.id] = { rating: 0, comment: '' };
        });
        setProductRatings(initialProductRatings);

      } catch (err: unknown) { // Use unknown for better type safety
        console.error('Error fetching order details:', err);
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response) {
          showToast(axiosError.response.data.message || t('rating_failed_to_load'), 'error');
        } else if (err instanceof Error) {
          showToast(err.message, 'error');
        } else {
          setError(t('rating_failed_to_load'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [ratingToken]);

  const handleProductRatingChange = (productId: number, rating: number) => {
    setProductRatings(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating },
    }));
  };

  const handleProductCommentChange = (productId: number, comment: string) => {
    setProductRatings(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment },
    }));
  };

  const handleSubmitRatings = async () => {
    if (!order || !ratingToken) { // Check if order is available
      setError(t('rating_invalid_link_error'));
      return;
    }

    if (overallRating === 0) {
      showToast(t('rating_provide_overall_error'), 'error');
      return;
    }

    const allProductsRated = Object.values(productRatings).every(pr => pr.rating > 0);
    if (!allProductsRated) {
      showToast(t('rating_rate_all_products_error'), 'error');
      return;
    }

    setSubmitting(true);
    setToast(null); // Clear any existing toasts
    setMessage(null);

    try {
      const formattedProductRatings = Object.entries(productRatings).map(([productId, data]) => ({
        productId: parseInt(productId),
        rating: data.rating,
        comment: data.comment,
      }));

      await config.axios.post('/ratings', {
        orderId: order.id, // Use order.id from the fetched order object
        ratingToken,
        overallRating,
        overallComment,
        productRatings: formattedProductRatings,
      });

      setMessage(t('rating_thank_you_message'));
      // Optionally redirect or disable form
      setTimeout(() => navigate('/'), 3000);

    } catch (err: unknown) { // Use unknown for better type safety
      console.error('Error submitting ratings:', err);
      const axiosError = err as AxiosError<{ message: string }>;
      if (axiosError.response) {
        showToast(axiosError.response.data.message || t('rating_submit_failed'), 'error');
      } else if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast(t('rating_submit_unknown_error'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">{t('rating_loading_order')}</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
  }

  if (message) {
    return <div className="flex justify-center items-center h-screen text-green-600">{message}</div>;
  }
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('rating_order_not_found_title')}</h2>
          <p className="text-gray-600 mb-6">
            {t('rating_order_not_found_message')}
          </p>
          <Link to="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            {t('rating_return_home_button')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('rating_page_title')} #{order.id}</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">{t('rating_order_info_title')}</h2>
        <p><strong>{t('rating_order_date', { date: new Date(order.order_date).toLocaleDateString() })}</strong></p>
        <p><strong>{t('rating_order_total', { amount: Number(order.total_amount).toFixed(2) })}</strong></p>

        <h3 className="text-xl font-semibold mt-6 mb-3">{t('rating_overall_experience_title')}</h3>
        <div className="flex items-center space-x-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`cursor-pointer ${overallRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
              onClick={() => setOverallRating(star)}
              size={30}
            />
          ))}
        </div>
        <textarea
          className="w-full mt-4 p-2 border rounded-md"
          placeholder={t('rating_overall_comment_placeholder')}
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
        />

        <h3 className="text-xl font-semibold mt-6 mb-3">{t('rating_product_ratings_title')}</h3>
        <div className="space-y-6">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center border-b pb-4">
              <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-md mr-4" />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                <p className="text-sm text-gray-600">Price: ${Number(item.price).toFixed(2)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`cursor-pointer ${productRatings[item.id]?.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                      onClick={() => handleProductRatingChange(item.id, star)}
                      size={20}
                    />
                  ))}
                </div>
                <textarea
                  className="w-full mt-2 p-2 border rounded-md"
                  placeholder={t('rating_optional_comment_placeholder')}
                  value={productRatings[item.id]?.comment || ''}
                  onChange={(e) => handleProductCommentChange(item.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmitRatings}
          disabled={submitting}
          className="mt-8 w-full bg-primary-600 text-white py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('rating_submitting_button') : t('rating_submit_button')}
        </button>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RatingPage;
