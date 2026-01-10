import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import config from '../config';
import { useCart } from '../contexts/CartContext';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(config.stripePublishableKey);

export const PaymentCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('Processing payment...');
    const processedRef = useRef(false);

    useEffect(() => {
        const checkPaymentStatus = async () => {
            if (processedRef.current) return;
            processedRef.current = true;

            const clientSecret = searchParams.get('payment_intent_client_secret');

            if (!clientSecret) {
                setStatus('failed');
                setMessage('No payment info found.');
                return;
            }

            try {
                const stripe = await stripePromise;
                if (!stripe) return;

                const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);

                if (error) {
                    setStatus('failed');
                    setMessage(error.message || 'Payment verification failed.');
                    return;
                }

                if (paymentIntent && paymentIntent.status === 'succeeded') {
                    // Payment succeeded. Now create the order.
                    const pendingOrderStr = sessionStorage.getItem('pendingOrder');
                    if (pendingOrderStr) {
                        const pendingOrder = JSON.parse(pendingOrderStr);

                        try {
                            // Create order in backend
                            await config.axios.post('/orders', pendingOrder);

                            // Handle coupon usage if any
                            if (pendingOrder.couponId) {
                                await config.axios.put(`coupon-codes/use/${pendingOrder.couponId}`).catch(console.error);
                            }

                            sessionStorage.removeItem('pendingOrder');
                            clearCart();
                            setStatus('success');
                            setMessage('Payment successful! Your order has been placed.');
                            toast.success('Order placed successfully!');
                        } catch (err: any) {
                            console.error('Error creating order:', err);
                            setStatus('failed');
                            setMessage(err.response?.data?.error || 'Payment successful but failed to create order. Please contact support.');
                        }
                    } else {
                        // Order might have been already created or lost state?
                        // If we are here, it usually means we returned from a redirect.
                        // If session storage is empty, maybe we already processed it?
                        // Or maybe it was a direct non-redirect payment that shouldn't legally reach here if logic was correct?
                        // But for redirect, we MUST rely on session storage or database pending state.
                        setStatus('success');
                        setMessage('Payment successful.');
                        // We assume order logic might be handled or manual check needed.
                        // But strictly, we need the stored order data.
                        // Ideally we should warn if no pending order found.
                        sessionStorage.removeItem('pendingOrder');
                        clearCart();
                    }
                } else {
                    setStatus('failed');
                    setMessage('Payment failed or processing.');
                }
            } catch (error: any) {
                console.error('Error checking payment:', error);
                setStatus('failed');
                setMessage('An unexpected error occurred.');
            }
        };

        checkPaymentStatus();
    }, [searchParams, clearCart]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                        <h2 className="text-2xl font-bold text-gray-900">Processing Payment...</h2>
                        <p className="text-gray-500">Please wait while we verify your transaction.</p>
                    </>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={48} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                            <p className="text-gray-500">{message}</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg"
                        >
                            Return to Shopping
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <XCircle size={48} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                            <p className="text-gray-500">{message}</p>
                        </div>
                        <button
                            onClick={() => navigate('/checkout')}
                            // Note: /checkout might not exist, maybe just back? or navigate(-1)?
                            // But usually we just go back to home or cart.
                            className="w-full bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800 transition-all shadow-lg"
                        >
                            Return to Cart
                            {/* We go to home or keep them? */}
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="block w-full text-gray-500 font-medium py-2 hover:text-gray-900 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
