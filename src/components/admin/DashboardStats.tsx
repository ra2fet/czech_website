import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Euro, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ApexChart from 'react-apexcharts';
import config from '../../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardData {
  total_sales: number;
  total_completed_orders: number;
  top_products: Array<{ product_name: string; quantity_sold: number }>;
  orders_by_month: Array<{ month: string; count: number }>;
  orders_by_branches: Array<{ branch_name: string; count: number }>;
  orders_by_clients?: Array<{ client_name: string; count: number }>;
}

type DateFilter = "All Orders" | "Today" | "Yesterday" | "This Month" | "This Year" | "Custom Date";

export function DashboardStats() {
  const [filter, setFilter] = useState<DateFilter>("All Orders");
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let apiUrl = `admin/dashboard?filter=${encodeURIComponent(filter)}`;

      if (filter === "Custom Date") {
        if (!fromDate || !toDate || new Date(fromDate) > new Date(toDate)) {
          setError("Please select valid 'From' and 'To' dates.");
          setLoading(false);
          return;
        }
        apiUrl += `&from_date=${fromDate}&to_date=${toDate}`;
      }

      const response = await config.axios.get(apiUrl);
      setDashboardData(response.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch dashboard data.");
      toast.error("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter !== "Custom Date") {
      fetchData();
    }
  }, [filter]);

  const handleCustomDateFetch = () => {
    if (filter === "Custom Date") {
      fetchData();
    }
  };

  const barChartData = useMemo(() => {
    if (!dashboardData?.orders_by_month) return { labels: [], datasets: [] };
    const labels = dashboardData.orders_by_month.map(item => item.month);
    const data = dashboardData.orders_by_month.map(item => item.count);
    return {
      labels,
      datasets: [
        {
          label: 'Orders by Month',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [dashboardData]);

  const pieChartBranchOptions = useMemo(() => {
    if (!dashboardData?.orders_by_branches) return { series: [], labels: [] };
    const labels = dashboardData.orders_by_branches.map(item => item.branch_name);
    return {
      chart: { type: 'donut' as const },
      labels: labels,
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    };
  }, [dashboardData]);

  const pieChartBranchSeries = useMemo(() => {
    return dashboardData?.orders_by_branches?.map(item => item.count) || [];
  }, [dashboardData]);

  const pieChartClientOptions = useMemo(() => {
    if (!dashboardData?.orders_by_clients) return { series: [], labels: [] };
    const labels = dashboardData.orders_by_clients.map(item => item.client_name);
    return {
      chart: { type: 'donut' as const },
      labels: labels,
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    };
  }, [dashboardData]);

  const pieChartClientSeries = useMemo(() => {
    return dashboardData?.orders_by_clients?.map(item => item.count) || [];
  }, [dashboardData]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-accent-900">Sales & Order Statistics</h2>
        <div className="flex items-center gap-4">
          <label htmlFor="filter">Filter By:</label>
          <select
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            id='filter'
            onChange={(e) => setFilter(e.target.value as DateFilter)}
          >
            <option>All Orders</option>
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Month</option>
            <option>This Year</option>
            <option>Custom Date</option>
          </select>

          {filter === "Custom Date" && (
            <>
              <input
                type="date"
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date"
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button
                onClick={handleCustomDateFetch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4 border border-red-300 rounded-md">{error}</div>
      ) : (
        dashboardData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Sales Card */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-50 rounded-lg text-green-600">
                    <Euro className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Sales</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      {config.currencySymbol}{dashboardData.total_sales ? dashboardData.total_sales.toLocaleString() : '0.00'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Total Completed Orders Card */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Completed Orders</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      {dashboardData.total_completed_orders ? dashboardData.total_completed_orders.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders by Month Bar Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-accent-900 mb-4">Orders by Month</h3>
                {barChartData.labels.length > 0 ? (
                  <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: 'top' as const }, title: { display: false } } }} />
                ) : (
                  <p className="text-gray-600">No orders by month data available.</p>
                )}
              </div>

              {/* Orders by Product Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-accent-900 mb-4">Orders by Product</h3>
                {dashboardData.top_products && dashboardData.top_products.length > 0 ? (
                  <ApexChart
                    options={{
                      chart: { type: 'donut' as const },
                      labels: dashboardData.top_products.map(p => p.product_name),
                      legend: { position: 'bottom' },
                      responsive: [{
                        breakpoint: 480,
                        options: {
                          chart: { width: 250 },
                          legend: { position: 'bottom' }
                        }
                      }]
                    }}
                    series={dashboardData.top_products.map(p => p.quantity_sold)}
                    type="donut"
                    height={350}
                  />
                ) : (
                  <p className="text-gray-600">No product sales data available.</p>
                )}
              </div>

              {/* Orders by Province Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-accent-900 mb-4">Orders by Province</h3>
                {pieChartBranchSeries.length > 0 ? (
                  <ApexChart options={pieChartBranchOptions} series={pieChartBranchSeries} type="donut" height={350} />
                ) : (
                  <p className="text-gray-600">No orders by province data available.</p>
                )}
              </div>

              {/* Orders by Clients Pie Chart (Optional) */}
              {dashboardData.orders_by_clients && dashboardData.orders_by_clients.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-accent-900 mb-4">Orders by Clients</h3>
                  <ApexChart options={pieChartClientOptions} series={pieChartClientSeries} type="donut" height={350} />
                </div>
              )}
            </div>

            {/* Top Products Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-accent-900 mb-4">Quantity Sold (Top Products)</h3>
              {dashboardData.top_products && dashboardData.top_products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity Sold
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.top_products.map((product, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantity_sold.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No top products data available.</p>
              )}
            </div>
          </div>
        )
      )}
    </motion.div>
  );
}
