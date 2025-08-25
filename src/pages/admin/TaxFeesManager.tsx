import React, { useState, useEffect } from 'react';
import config from '../../config';

interface TaxFee {
    id: number;
    name: string;
    rate: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const TaxFeesManager: React.FC = () => {
    const [taxFees, setTaxFees] = useState<TaxFee[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        rate: '',
        is_active: true,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchTaxFees();
    }, []);

    const fetchTaxFees = async () => {
        setLoading(true);
        try {
            const response = await config.axios.get('tax-fees');
            setTaxFees(response.data);
        } catch (err) {
            setError('Failed to fetch tax fees.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (name === 'rate' && value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
            setError('Rate must be a positive number.');
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

        const rateValue = formData.rate ? parseFloat(formData.rate) / 100 : 0;

        if (rateValue <= 0 || isNaN(rateValue)) {
            setError('Please enter a valid rate greater than 0.');
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                name: formData.name,
                rate: rateValue,
                is_active: formData.is_active,
            };

            if (editingId) {
                await config.axios.put(`tax-fees/${editingId}`, dataToSend);
            } else {
                await config.axios.post('tax-fees', dataToSend);
            }
            setFormData({ name: '', rate: '', is_active: true });
            setEditingId(null);
            fetchTaxFees();
        } catch (err) {
            setError('Failed to save tax fee. Please check your input.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (taxFee: TaxFee) => {
        setFormData({
            name: taxFee.name,
            rate: (taxFee.rate * 100).toString(),
            is_active: taxFee.is_active,
        });
        setEditingId(taxFee.id);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this tax fee?')) {
            setLoading(true);
            try {
                await config.axios.delete(`tax-fees/${id}`);
                fetchTaxFees();
            } catch (err) {
                setError('Failed to delete tax fee.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Manage Tax Fees</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
            {loading && <div className="text-blue-500 mb-4">Loading...</div>}

            {(editingId || taxFees.length === 0) && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Rate (e.g., 5 for 5%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="rate"
                                    name="rate"
                                    value={formData.rate}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                            </div>
                        </div>
                    </div>
                    <div className="mb-4">
                        {/* <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">Active</label> */}
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Active</span>
                    </div>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={loading}
                    >
                        {editingId ? 'Update Tax Fee' : 'Add Tax Fee'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', rate: '', is_active: true });
                            }}
                            className="ml-4 bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Existing Tax Fees</h2>
                {taxFees.length === 0 ? (
                    <p>No tax fees found. Please add a tax fee.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {taxFees.map((taxFee) => (
                                    <tr key={taxFee.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{taxFee.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{(taxFee.rate * 100).toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{taxFee.is_active ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(taxFee)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(taxFee.id)}
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

export default TaxFeesManager;