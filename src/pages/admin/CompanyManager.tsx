import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import config from '../../config';

interface CompanyUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  user_type: 'customer' | 'company' | 'admin';
  is_active: boolean;
  company_name: string;
  license_number: string;
}

export const CompanyManager = () => {
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanyUsers();
  }, []);

  const fetchCompanyUsers = async () => {
    setLoading(true);
    try {
      const response = await config.axios.get('/admin/companies');
      setCompanyUsers(response.data);
    } catch (error) {
      console.error('Error fetching company users:', error);
      toast.error('Failed to fetch company users.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCompany = async (userId: number) => {
    try {
      await config.axios.put(`/admin/companies/${userId}/approve`);
      toast.success('Company approved successfully!');
      fetchCompanyUsers(); // Refresh the list
    } catch (error) {
      console.error('Error approving company:', error);
      toast.error('Failed to approve company.');
    }
  };

  const handleDeclineCompany = async (userId: number) => {
    try {
      await config.axios.put(`/admin/companies/${userId}/decline`);
      toast.success('Company declined and deactivated.');
      fetchCompanyUsers(); // Refresh the list
    } catch (error) {
      console.error('Error declining company:', error);
      toast.error('Failed to decline company.');
    }
  };
 const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };


   const filteredCompanies = companyUsers.filter(company =>
    company.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Approvals</h2>

      {companyUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No company registrations awaiting approval or active companies found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">

           <div className="mb-4">
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.license_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Pending Approval'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!user.is_active ? (
                      <button
                        onClick={() => handleApproveCompany(user.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                      >
                        Approve
                      </button>
                    ):(
                      <button
                        onClick={() => handleDeclineCompany(user.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Deactivate
                      </button>
                    ) }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
