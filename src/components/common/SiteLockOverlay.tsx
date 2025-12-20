import React from 'react';
import { Lock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFeatures } from '../../contexts/FeatureContext';
import { Link } from 'react-router-dom';

export const SiteLockOverlay = () => {
    const { features, loading } = useFeatures();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    // Don't show lock screen for admin routes or if data is loading
    if (loading || isAdminRoute) {
        return null;
    }

    // Check if the lock is enabled
    if (!features.enableUnpaidSiteLock) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 p-4 rounded-full">
                        <Lock className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Website Temporarily Suspended
                </h1>
                <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ direction: 'rtl' }}>
                    الموقع متوقف مؤقتاً
                </h2>

                <p className="text-gray-600 mb-6">
                    This website has been temporarily locked due to a billing issue.
                    Please contact the administrator to resolve this matter.
                </p>

                <p className="text-gray-600 mb-8" style={{ direction: 'rtl' }}>
                    تم إيقاف الموقع مؤقتاً بسبب مشاكل في الدفع. يرجى التواصل مع الإدارة لحل المشكلة.
                </p>

                <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">
                        Are you the administrator? <Link to="/admin/login" className="text-blue-600 hover:text-blue-800 font-semibold">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
