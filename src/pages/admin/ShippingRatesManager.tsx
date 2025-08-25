import React, { useState, useEffect } from 'react';
import config from '../../config';
 
interface ShippingRate {
    id: number;
    min_price: number;
    max_price: number | null;
    percentage_rate: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const ShippingRatesManager: React.FC = () => {
    const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
    const [formData, setFormData] = useState({
        min_price: '',
        max_price: '',
        percentage_rate: '',
        is_active: true,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchShippingRates();
    }, []);

    const fetchShippingRates = async () => {
        setLoading(true);
        try {
            const response = await config.axios.get('shipping-rates');
            setShippingRates(response.data);
        } catch (err) {
            setError('Failed to fetch shipping rates.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        if (name === 'percentage_rate' && value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
            setError('Percentage rate must be a positive number.');
            return;
        }
        if (name === 'min_price' && value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
            setError('Min price must be a positive number.');
            return;
        }
        if (name === 'max_price' && value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
            setError('Max price must be a positive number.');
            return;
        }
        setError(null);
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const minPrice = formData.min_price ? parseFloat(formData.min_price) : 0;
        const maxPrice = formData.max_price ? parseFloat(formData.max_price) : null;
        const percentageRate = formData.percentage_rate ? parseFloat(formData.percentage_rate) / 100 : 0;

        if (minPrice < 0 || isNaN(minPrice)) {
            setError('Please enter a valid min price.');
            setLoading(false);
            return;
        }
        if (maxPrice !== null && (maxPrice < 0 || isNaN(maxPrice))) {
            setError('Please enter a valid max price.');
            setLoading(false);
            return;
        }
        if ( isNaN(percentageRate)) {
            setError('Please enter a valid percentage rate greater than 0.');
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                min_price: minPrice,
                max_price: maxPrice,
                percentage_rate: percentageRate, // Send as decimal
                is_active: formData.is_active,
            };

            if (editingId) {
                await config.axios.put(`shipping-rates/${editingId}`, dataToSend);
            } else {
                await config.axios.post('shipping-rates', dataToSend);
            }
            setFormData({ min_price: '', max_price: '', percentage_rate: '', is_active: true });
            setEditingId(null);
            fetchShippingRates();
        } catch (error) {
            setError('Failed to save shipping rate. Please check your input.');
            console.error(error);
            
     

        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rate: ShippingRate) => {
        setFormData({
            min_price: rate.min_price.toString(),
            max_price: rate.max_price !== null ? rate.max_price.toString() : '',
            percentage_rate: (rate.percentage_rate * 100).toString(), // Convert decimal to percentage
            is_active: rate.is_active,
        });
        setEditingId(rate.id);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this shipping rate?')) {
            setLoading(true);
            try {
                await config.axios.delete(`shipping-rates/${id}`);
                fetchShippingRates();
            } catch (err) {
                setError('Failed to delete shipping rate.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Manage Shipping Rates</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
            {loading && <div className="text-blue-500 mb-4">Loading...</div>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label htmlFor="min_price" className="block text-sm font-medium text-gray-700">Min Price</label>
                        <input
                            type="number"
                            id="min_price"
                            name="min_price"
                            value={formData.min_price}
                            onChange={handleChange}
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="max_price" className="block text-sm font-medium text-gray-700">Max Price (leave empty for no upper limit)</label>
                        <input
                            type="number"
                            id="max_price"
                            name="max_price"
                            value={formData.max_price}
                            onChange={handleChange}
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="percentage_rate" className="block text-sm font-medium text-gray-700">Percentage Rate (e.g., 10 for 10%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                id="percentage_rate"
                                name="percentage_rate"
                                value={formData.percentage_rate}
                                onChange={handleChange}
                                step="0.01"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
                                required
                                min="0"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                        </div>
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
                    {editingId ? 'Update Shipping Rate' : 'Add Shipping Rate'}
                </button>
                {editingId && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ min_price: '', max_price: '', percentage_rate: '', is_active: true });
                        }}
                        className="ml-4 bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                )}
            </form>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Existing Shipping Rates</h2>
                {shippingRates.length === 0 ? (
                    <p>No shipping rates found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Price</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Price</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {shippingRates.map((rate) => (
                                    <tr key={rate.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">${Number(rate.min_price).toFixed(0)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{rate.max_price !== null ? `$${Number(rate.max_price).toFixed(0)}` : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{(Number(rate.percentage_rate * 100).toFixed(2))}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{rate.is_active ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(rate)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rate.id)}
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

export default ShippingRatesManager;