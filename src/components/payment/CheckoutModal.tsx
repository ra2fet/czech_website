import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MapPin, PlusCircle,
    ChevronRight, ArrowLeft, CheckCircle2, ShieldCheck,
    ShoppingBag, Truck, User
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures } from '../../contexts/FeatureContext';
import { useTranslation } from 'react-i18next';
import config from '../../config';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(config.stripePublishableKey);

interface Address {
    id: number;
    address_name: string;
    city: string;
    province: string;
    street_name: string;
    house_number: string;
    postcode: string;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    couponCode: string | null;
    couponId: number | null;
    taxFee: number;
    shippingFee: number;
    discount: number;
    onSuccess: () => void;
}

const CheckoutForm = ({
    onSuccess,
    amount,
    addressId,
    couponCode,
    couponId,
    taxFee,
    shippingFee,
    discount,
    guestInfo,
    guestAddress
}: {
    onSuccess: () => void;
    amount: number;
    addressId: number | null;
    couponCode: string | null;
    couponId: number | null;
    taxFee: number;
    shippingFee: number;
    discount: number;
    guestInfo?: any;
    guestAddress?: any;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    const { state: { items: cartItems }, clearCart } = useCart();
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setErrorMessage(submitError.message || 'An error occurred.');
            setIsProcessing(false);
            return;
        }

        try {
            // Create PaymentIntent on server
            const { data: { clientSecret } } = await config.axios.post('/stripe/create-payment-intent', {
                amount,
                currency: 'eur',
            });

            // Save pending order for redirect scenarios (e.g. Ideal, Klarna)
            const pendingOrder = {
                userId: user?.id, // Can be undefined for guest
                totalAmount: amount,
                addressId, // Can be null for guest initially
                cartItems: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    type: item.type,
                })),
                couponCode,
                couponId,
                taxFee,
                shippingFee,
                discount,
                guestInfo,
                guestAddress
            };
            sessionStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));

            // Confirm payment with Stripe
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-callback`,
                    payment_method_data: {
                        billing_details: {
                            name: user?.full_name || guestInfo?.name,
                            email: user?.email || guestInfo?.email,
                            phone: user?.phone_number || guestInfo?.phone,
                            address: guestAddress ? {
                                city: guestAddress.city,
                                line1: `${guestAddress.street_name} ${guestAddress.house_number}`,
                                postal_code: guestAddress.postcode,
                                state: guestAddress.province
                            } : undefined
                        }
                    }
                },
                redirect: 'if_required',
            });

            if (confirmError) {
                setErrorMessage(confirmError.message || 'Payment confirmation failed.');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment successful, create order
                await config.axios.post('/orders', {
                    userId: user?.id,
                    totalAmount: amount,
                    addressId,
                    cartItems: cartItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        type: item.type,
                    })),
                    couponCode,
                    couponId,
                    taxFee,
                    shippingFee,
                    discount,
                    guestInfo,
                    guestAddress
                });

                if (couponId) {
                    await config.axios.put(`coupon-codes/use/${couponId}`).catch(console.error);
                }

                sessionStorage.removeItem('pendingOrder');
                clearCart();
                onSuccess();
                toast.success('Payment successful and order placed!');
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setErrorMessage(err.response?.data?.error || err.message || 'Checkout failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    layout: 'tabs',
                    defaultValues: {
                        billingDetails: {
                            email: user?.email || guestInfo?.email || undefined,
                            name: user?.full_name || guestInfo?.name || undefined,
                        }
                    }
                }}
                onLoadError={(event) => {
                    console.error('Stripe Payment Element load error:', event);
                    setErrorMessage(t('checkout_error_country_not_supported'));
                }}
            />
            {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}
            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t('checkout_processing')}</span>
                    </>
                ) : (
                    <>
                        <ShieldCheck size={20} />
                        <span>{t('checkout_pay_button', { amount: `${config.currencySymbol}${amount.toFixed(2)}` })}</span>
                    </>
                )}
            </button>
        </form>
    );
};

export const CheckoutModal = ({
    isOpen,
    onClose,
    couponCode,
    couponId,
    taxFee,
    shippingFee,
    discount,
    onSuccess
}: CheckoutModalProps) => {
    const { user } = useAuth();
    const { state: { items: cartItems, subtotal } } = useCart();
    const { features } = useFeatures();
    const { t } = useTranslation();

    const [step, setStep] = useState<'guest_info' | 'address' | 'payment' | 'success'>('address');

    // Reset step based on user login status when opening
    useEffect(() => {
        if (isOpen) {
            if (!user) {
                setStep('guest_info');
            } else {
                setStep('address');
            }
        }
    }, [isOpen, user]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);


    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | ''>('');
    const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

    // Guest Info State
    const [guestInfo, setGuestInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [newAddress, setNewAddress] = useState({
        address_name: '',
        city: '',
        province: '',
        street_name: '',
        house_number: '',
        postcode: '',
    });

    // ... (keep fetchAddresses and fetchProvinces same)

    const fetchAddresses = useCallback(async () => {
        if (!user) return;
        try {
            const response = await config.axios.get(`/user_addresses/${user.id}`);
            setSavedAddresses(response.data);
            if (response.data.length > 0) {
                setSelectedAddressId(response.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching addresses:', err);
        }
    }, [user]);

    const fetchProvinces = useCallback(async () => {
        try {
            const response = await config.axios.get('provinces');
            setProvinces(response.data);
        } catch (err) {
            console.error('Error fetching provinces:', err);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchAddresses();
            fetchProvinces();
        }
    }, [isOpen, fetchAddresses, fetchProvinces]);

    const calculateTotal = () => {
        let total = subtotal;
        if (features.enableTaxPurchase) total += taxFee;
        if (features.enableShippingByPriceZone) total += shippingFee;
        if (features.enableDiscountCoupons) total -= discount;
        return Math.max(0, total);
    };

    const handleNextToPayment = async () => {
        if (!user) {
            // For guest, we require new address
            const required = ['address_name', 'city', 'province', 'street_name', 'house_number', 'postcode'];
            if (required.some(f => !newAddress[f as keyof typeof newAddress])) {
                toast.error(t('checkout_error_fill_all_fields'));
                return;
            }
            const province = provinces.find(p => p.name === newAddress.province);
            if (!province) {
                toast.error(t('checkout_error_invalid_province'));
                return;
            }
            // Prepare province ID for guest address
            // We can't save it to server yet (since no user ID), so pass it to payment step
            setStep('payment');
            return;
        }

        if (selectedAddressId === 'new') {
            // Validate new address
            const required = ['address_name', 'city', 'province', 'street_name', 'house_number', 'postcode'];
            if (required.some(f => !newAddress[f as keyof typeof newAddress])) {
                toast.error(t('checkout_error_fill_all_fields'));
                return;
            }

            const province = provinces.find(p => p.name === newAddress.province);
            if (!province) {
                toast.error(t('checkout_error_invalid_province'));
                return;
            }

            try {
                const response = await config.axios.post(`/user_addresses/${user?.id}`, {
                    ...newAddress,
                    province_id: province.id
                });
                setSelectedAddressId(response.data.id);
                setStep('payment');
            } catch (err) {
                toast.error(t('checkout_error_save_address'));
            }
        } else if (selectedAddressId) {
            setStep('payment');
        } else {
            toast.error(t('checkout_error_select_address'));
        }
    };

    const handleGuestInfoNext = () => {
        if (!guestInfo.name || !guestInfo.email) {
            toast.error(t('checkout_error_fill_all_fields'));
            return;
        }
        setStep('address');
        setSelectedAddressId('new'); // Force new address for guests
        // Trigger generic address name for guest so they don't have to fill it unnecessarily, or prefill
        if (!newAddress.address_name) {
            setNewAddress(prev => ({ ...prev, address_name: 'Delivery Address' }));
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm">
                <div
                    className="flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative w-full ${step === 'success' ? 'max-w-2xl' : 'max-w-5xl'} bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto md:max-h-[90vh]`}
                    >
                        {/* Left Side: Form */}
                        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-2">
                                    {/* Steps Indicator */}
                                    {!user && (
                                        <>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'guest_info' ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-600'}`}>
                                                {step === 'guest_info' ? '1' : <CheckCircle2 size={18} />}
                                            </div>
                                            <div className="h-px w-6 bg-gray-200" />
                                        </>
                                    )}

                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'address' ? 'bg-blue-600 text-white' : (step === 'payment' || step === 'success' || (step !== 'guest_info' && !user)) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {step === 'success' || step === 'payment' ? <CheckCircle2 size={18} /> : (user ? '1' : '2')}
                                    </div>
                                    <div className="h-px w-6 bg-gray-200" />
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'payment' ? 'bg-blue-600 text-white' : step === 'success' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {step === 'success' ? <CheckCircle2 size={18} /> : (user ? '2' : '3')}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {step === 'guest_info' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('guest_info_title')}</h2>
                                        <p className="text-gray-500">{t('checkout_shipping_info_subtitle')}</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('guest_name_label')}</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={guestInfo.name}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('guest_email_label')}</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={guestInfo.email}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('guest_phone_label')}</label>
                                            <input
                                                type="tel"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={guestInfo.phone}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGuestInfoNext}
                                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2 mt-8"
                                    >
                                        <span>{t('checkout_continue_to_payment')}</span>
                                        <ChevronRight size={20} />
                                    </button>
                                    <div className="text-center mt-4">
                                        <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
                                            {t('cancel_button')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'address' && (
                                <div className="space-y-6 animate-fade-in">
                                    {!user && (
                                        <button
                                            onClick={() => setStep('guest_info')}
                                            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors mb-4"
                                        >
                                            <ArrowLeft size={18} className="mr-1" />
                                            <span>{t('checkout_back_to_address')} ({t('guest_info_title')})</span>
                                        </button>
                                    )}
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout_shipping_info_title')}</h2>
                                        <p className="text-gray-500">{t('checkout_shipping_info_subtitle')}</p>
                                    </div>

                                    <div className="space-y-4">
                                        {savedAddresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                onClick={() => setSelectedAddressId(addr.id)}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${selectedAddressId === addr.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            <MapPin size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{addr.address_name}</p>
                                                            <p className="text-sm text-gray-500">{addr.street_name}, {addr.city}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-blue-600' : 'border-gray-300'}`}>
                                                        {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div
                                            onClick={() => {
                                                if (user) setSelectedAddressId('new');
                                            }}
                                            className={`p-4 rounded-2xl border-2 ${user ? 'border-dashed cursor-pointer' : 'border-transparent'} transition-all ${selectedAddressId === 'new' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {user && (
                                                <div className="flex items-center space-x-3 text-gray-600">
                                                    <PlusCircle size={24} className={selectedAddressId === 'new' ? 'text-blue-600' : ''} />
                                                    <span className="font-semibold">{t('checkout_add_new_address')}</span>
                                                </div>
                                            )}

                                            <AnimatePresence>
                                                {(selectedAddressId === 'new' || !user) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="mt-6 grid grid-cols-2 gap-4"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            placeholder={t('checkout_address_name_placeholder')}
                                                            className="col-span-2 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={newAddress.address_name}
                                                            onChange={e => setNewAddress({ ...newAddress, address_name: e.target.value })}
                                                        />
                                                        <input
                                                            placeholder={t('checkout_street_placeholder')}
                                                            className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={newAddress.street_name}
                                                            onChange={e => setNewAddress({ ...newAddress, street_name: e.target.value })}
                                                        />
                                                        <input
                                                            placeholder={t('checkout_house_number_placeholder')}
                                                            className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={newAddress.house_number}
                                                            onChange={e => setNewAddress({ ...newAddress, house_number: e.target.value })}
                                                        />
                                                        <input
                                                            placeholder={t('checkout_city_placeholder')}
                                                            className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={newAddress.city}
                                                            onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                                        />
                                                        <select
                                                            className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                                            value={newAddress.province}
                                                            onChange={e => setNewAddress({ ...newAddress, province: e.target.value })}
                                                        >
                                                            <option value="">{t('checkout_select_province')}</option>
                                                            {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                        </select>
                                                        <input
                                                            placeholder={t('checkout_postcode_placeholder')}
                                                            className="col-span-2 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={newAddress.postcode}
                                                            onChange={e => setNewAddress({ ...newAddress, postcode: e.target.value })}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNextToPayment}
                                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2 mt-8"
                                    >
                                        <span>{t('checkout_continue_to_payment')}</span>
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}

                            {step === 'payment' && (
                                <div className="space-y-6 animate-fade-in">
                                    <button
                                        onClick={() => setStep('address')}
                                        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <ArrowLeft size={18} className="mr-1" />
                                        <span>{t('checkout_back_to_address')}</span>
                                    </button>

                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout_payment_details_title')}</h2>
                                        <p className="text-gray-500">{t('checkout_payment_details_subtitle')}</p>
                                    </div>

                                    <Elements
                                        stripe={stripePromise}
                                        options={{
                                            mode: 'payment',
                                            amount: Math.max(1, Math.round(calculateTotal() * 100)),
                                            currency: 'eur',
                                            payment_method_types: ['card', 'ideal', 'klarna'],
                                        }}
                                    >
                                        <CheckoutForm
                                            amount={calculateTotal()}
                                            addressId={selectedAddressId === 'new' ? null : selectedAddressId as number}
                                            couponCode={couponCode}
                                            couponId={couponId}
                                            taxFee={taxFee}
                                            shippingFee={shippingFee}
                                            discount={discount}
                                            onSuccess={() => setStep('success')}
                                            guestInfo={!user ? guestInfo : undefined}
                                            guestAddress={(!user || selectedAddressId === 'new') ? {
                                                ...newAddress,
                                                province_id: provinces.find(p => p.name === newAddress.province)?.id
                                            } : undefined}
                                        />
                                    </Elements>

                                    <div className="flex items-center justify-center space-x-4 pt-4 grayscale opacity-50">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                                    </div>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="text-center py-12 space-y-6 animate-fade-in">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('checkout_order_confirmed_title')}</h2>
                                        <p className="text-gray-500">{t('checkout_order_confirmed_message')}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            onSuccess();
                                            onClose();
                                        }}
                                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg"
                                    >
                                        {t('checkout_return_to_shopping')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Summary */}
                        {step !== 'success' && (
                            <div className="w-full md:w-80 bg-gray-50 p-6 md:p-8 border-l border-gray-100 overflow-y-auto">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                                    <ShoppingBag size={20} className="mr-2 text-blue-600" />
                                    {t('checkout_order_summary_title')}
                                </h3>

                                <div className="space-y-4 mb-8">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex space-x-3">
                                            <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">{t('checkout_qty_label')} {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">{config.currencySymbol}${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 border-t border-gray-200 pt-6">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>{t('cart_subtotal_label')}</span>
                                        <span>{config.currencySymbol}{subtotal.toFixed(2)}</span>
                                    </div>

                                    <FeatureGuard feature="enableTaxPurchase">
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>{t('checkout_tax_label')}</span>
                                            <span>{config.currencySymbol}{taxFee.toFixed(2)}</span>
                                        </div>
                                    </FeatureGuard>

                                    <FeatureGuard feature="enableShippingByPriceZone">
                                        <div className="flex justify-between text-sm text-gray-500" >
                                            <span className="flex items-center"><Truck size={14} className="mr-1" /> {t('checkout_shipping_label')}</span>
                                            <span>{config.currencySymbol}{shippingFee.toFixed(2)}</span>
                                        </div>
                                    </FeatureGuard>

                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm text-red-600 font-medium">
                                            <span>{t('checkout_discount_label', { code: couponCode })}</span>
                                            <span>-{config.currencySymbol}{discount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                                        <span>{t('cart_total_title')}</span>
                                        <span className="text-blue-600">{config.currencySymbol}{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                                    <div className="flex items-center space-x-2 text-gray-500 text-xs">
                                        <ShieldCheck size={14} className="text-green-600" />
                                        <span>{t('checkout_secure_ssl')}</span>
                                    </div>
                                    {/* <div className="flex items-center space-x-2 text-gray-500 text-xs">
                                    <ShieldCheck size={14} className="text-green-600" />
                                    <span>{t('checkout_money_back')}</span>
                                </div> */}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

const FeatureGuard = ({ feature, children }: { feature: string, children: React.ReactNode }) => {
    const { features } = useFeatures();
    if (features[feature as keyof typeof features]) return <>{children}</>;
    return null;
};
