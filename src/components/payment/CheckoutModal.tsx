import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MapPin, PlusCircle,
    ChevronRight, ArrowLeft, CheckCircle2, ShieldCheck,
    ShoppingBag, Truck
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
    discount
}: {
    onSuccess: () => void;
    amount: number;
    addressId: number;
    couponCode: string | null;
    couponId: number | null;
    taxFee: number;
    shippingFee: number;
    discount: number;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    const { state: { items: cartItems }, clearCart } = useCart();
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

            // Confirm payment with Stripe
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
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
                });

                if (couponId) {
                    await config.axios.put(`coupon-codes/use/${couponId}`).catch(console.error);
                }

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
            <PaymentElement options={{ layout: 'tabs' }} />
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
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <ShieldCheck size={20} />
                        <span>Pay {config.currencySymbol}{amount.toFixed(2)}</span>
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

    const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | ''>('');
    const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
    const [newAddress, setNewAddress] = useState({
        address_name: '',
        city: '',
        province: '',
        street_name: '',
        house_number: '',
        postcode: '',
    });

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
        if (selectedAddressId === 'new') {
            // Validate new address
            const required = ['address_name', 'city', 'province', 'street_name', 'house_number', 'postcode'];
            if (required.some(f => !newAddress[f as keyof typeof newAddress])) {
                toast.error('Please fill all address fields');
                return;
            }

            const province = provinces.find(p => p.name === newAddress.province);
            if (!province) {
                toast.error('Invalid province');
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
                toast.error('Failed to save address');
            }
        } else if (selectedAddressId) {
            setStep('payment');
        } else {
            toast.error('Please select an address');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                >
                    {/* Left Side: Form */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'address' ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-600'}`}>
                                    {step === 'address' ? '1' : <CheckCircle2 size={18} />}
                                </div>
                                <div className="h-px w-8 bg-gray-200" />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'payment' ? 'bg-blue-600 text-white' : step === 'success' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {step === 'success' ? <CheckCircle2 size={18} /> : '2'}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {step === 'address' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Information</h2>
                                    <p className="text-gray-500">Where should we send your order?</p>
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
                                        onClick={() => setSelectedAddressId('new')}
                                        className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${selectedAddressId === 'new' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center space-x-3 text-gray-600">
                                            <PlusCircle size={24} className={selectedAddressId === 'new' ? 'text-blue-600' : ''} />
                                            <span className="font-semibold">Add New Address</span>
                                        </div>

                                        <AnimatePresence>
                                            {selectedAddressId === 'new' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-6 grid grid-cols-2 gap-4"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        placeholder="Address Name (e.g. Home)"
                                                        className="col-span-2 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newAddress.address_name}
                                                        onChange={e => setNewAddress({ ...newAddress, address_name: e.target.value })}
                                                    />
                                                    <input
                                                        placeholder="Street Name"
                                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newAddress.street_name}
                                                        onChange={e => setNewAddress({ ...newAddress, street_name: e.target.value })}
                                                    />
                                                    <input
                                                        placeholder="House Number"
                                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newAddress.house_number}
                                                        onChange={e => setNewAddress({ ...newAddress, house_number: e.target.value })}
                                                    />
                                                    <input
                                                        placeholder="City"
                                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newAddress.city}
                                                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                                    />
                                                    <select
                                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                                        value={newAddress.province}
                                                        onChange={e => setNewAddress({ ...newAddress, province: e.target.value })}
                                                    >
                                                        <option value="">Select Province</option>
                                                        {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                    </select>
                                                    <input
                                                        placeholder="Postcode"
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
                                    <span>Continue to Payment</span>
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
                                    <span>Back to Address</span>
                                </button>

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h2>
                                    <p className="text-gray-500">Secure payment powered by Stripe</p>
                                </div>

                                <Elements stripe={stripePromise} options={{ mode: 'payment', amount: Math.round(calculateTotal() * 100), currency: 'eur' }}>
                                    <CheckoutForm
                                        amount={calculateTotal()}
                                        addressId={selectedAddressId as number}
                                        couponCode={couponCode}
                                        couponId={couponId}
                                        taxFee={taxFee}
                                        shippingFee={shippingFee}
                                        discount={discount}
                                        onSuccess={() => setStep('success')}
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
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                                    <p className="text-gray-500">Thank you for your purchase. We've sent a confirmation email to your inbox.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        onSuccess();
                                        onClose();
                                    }}
                                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg"
                                >
                                    Return to Shopping
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Summary */}
                    <div className="w-full md:w-80 bg-gray-50 p-6 md:p-8 border-l border-gray-100 overflow-y-auto">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                            <ShoppingBag size={20} className="mr-2 text-blue-600" />
                            Order Summary
                        </h3>

                        <div className="space-y-4 mb-8">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex space-x-3">
                                    <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{config.currencySymbol}${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 border-t border-gray-200 pt-6">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>{config.currencySymbol}{subtotal.toFixed(2)}</span>
                            </div>

                            <FeatureGuard feature="enableTaxPurchase">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Estimated Tax</span>
                                    <span>{config.currencySymbol}{taxFee.toFixed(2)}</span>
                                </div>
                            </FeatureGuard>

                            <FeatureGuard feature="enableShippingByPriceZone">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span className="flex items-center"><Truck size={14} className="mr-1" /> Shipping</span>
                                    <span>{config.currencySymbol}{shippingFee.toFixed(2)}</span>
                                </div>
                            </FeatureGuard>

                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-red-600 font-medium">
                                    <span>Discount ({couponCode})</span>
                                    <span>-{config.currencySymbol}{discount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                                <span>Total</span>
                                <span className="text-blue-600">{config.currencySymbol}{calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                            <div className="flex items-center space-x-2 text-gray-500 text-xs">
                                <ShieldCheck size={14} className="text-green-600" />
                                <span>Secure SSL Encryption</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-500 text-xs">
                                <ShieldCheck size={14} className="text-green-600" />
                                <span>30-Day Money Back Guarantee</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const FeatureGuard = ({ feature, children }: { feature: string, children: React.ReactNode }) => {
    const { features } = useFeatures();
    if (features[feature as keyof typeof features]) return <>{children}</>;
    return null;
};
