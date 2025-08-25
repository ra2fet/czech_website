import React, { useState, useEffect } from 'react';
import config from '../../config';
 
interface CouponCode {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_cart_value: number | null;
    max_uses: number | null;
    uses_count: number;
    expiry_date: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
 const CouponCodesManager: React.FC = () => {
    const [couponCodes, setCouponCodes] = useState<CouponCode[]>([]);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        min_cart_value: '',
        max_uses: '',
        expiry_date: '',
        is_active: true,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchCouponCodes();
    }, []);

    const fetchCouponCodes = async () => {
        setLoading(true);
        try {
            const response = await config.axios.get('coupon-codes');
            setCouponCodes(response.data);
        } catch (err) {
            setError('Failed to fetch coupon codes.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const discount_value = formData.discount_value ? formData.discount_type ==  'percentage' ? parseFloat(formData.discount_value) / 100 : parseFloat(formData.discount_value)  : 0;

        try {
            const dataToSend = {
                ...formData,
                discount_value: discount_value,
                min_cart_value: formData.min_cart_value === '' ? null : parseFloat(formData.min_cart_value),
                max_uses: formData.max_uses === '' ? null : parseInt(formData.max_uses),
                expiry_date: formData.expiry_date === '' ? null : formData.expiry_date,
            };

            if (editingId) {
                await config.axios.put(`coupon-codes/${editingId}`, dataToSend);
            } else {
                await config.axios.post('coupon-codes', dataToSend);
            }
            setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_cart_value: '',
                max_uses: '',
                expiry_date: '',
                is_active: true,
            });
            setEditingId(null);
            fetchCouponCodes();
        } catch (err) {
            setError('Failed to save coupon code. Please check your input.');
            console.error(err);

        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (coupon: CouponCode) => {
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: Number(coupon.discount_value * 100).toString(),
            min_cart_value: coupon.min_cart_value !== null ? coupon.min_cart_value.toString() : '',
            max_uses: coupon.max_uses !== null ? coupon.max_uses.toString() : '',
            expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '', // Format date for input
            is_active: coupon.is_active,
        });
        setEditingId(coupon.id);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this coupon code?')) {
            setLoading(true);
            try {
                await config.axios.delete(`coupon-codes/${id}`);
                fetchCouponCodes();
            } catch (err) {
                setError('Failed to delete coupon code.');
                console.error(err);

                  
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Manage Coupon Codes</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
            {loading && <div className="text-blue-500 mb-4">Loading...</div>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">Discount Type</label>
                        <select
                            id="discount_type"
                            name="discount_type"
                            value={formData.discount_type}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">Discount Value</label>
                        <input
                            type="number"
                            id="discount_value"
                            name="discount_value"
                            value={formData.discount_value}
                            onChange={handleChange}
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="min_cart_value" className="block text-sm font-medium text-gray-700">Min Cart Value (optional)</label>
                        <input
                            type="number"
                            id="min_cart_value"
                            name="min_cart_value"
                            value={formData.min_cart_value}
                            onChange={handleChange}
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="max_uses" className="block text-sm font-medium text-gray-700">Max Uses (optional)</label>
                        <input
                            type="number"
                            id="max_uses"
                            name="max_uses"
                            value={formData.max_uses}
                            onChange={handleChange}
                            step="1"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700">Expiry Date (optional)</label>
                        <input
                            type="date"
                            id="expiry_date"
                            name="expiry_date"
                            value={formData.expiry_date}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div className="flex items-center mt-6">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">Is Active</label>
                    </div>
                </div>
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    disabled={loading}
                >
                    {editingId ? 'Update Coupon Code' : 'Add Coupon Code'}
                </button>
                {editingId && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                code: '',
                                discount_type: 'percentage',
                                discount_value: '',
                                min_cart_value: '',
                                max_uses: '',
                                expiry_date: '',
                                is_active: true,
                            });
                        }}
                        className="ml-4 bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                )}
            </form>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Existing Coupon Codes</h2>
                {couponCodes.length === 0 ? (
                    <p>No coupon codes found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Cart</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {couponCodes.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{coupon.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{coupon.discount_type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {coupon.discount_type === 'percentage' ? `${(coupon.discount_value * 100).toFixed(0)}%` : `$${Number(coupon.discount_value).toFixed(0)}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{coupon.min_cart_value !== null ? `$${Number(coupon.min_cart_value).toFixed(0)}` : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{coupon.uses_count}{coupon.max_uses !== null ? `/${coupon.max_uses}` : ''}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{coupon.is_active ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(coupon)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponCodesManager;
