import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Euro, CheckCircle, DownloadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import ApexChart from 'react-apexcharts';
import config from '../../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

interface DashboardData {
  total_sales: number;
  total_completed_orders: number;
  top_products: Array<{ product_name: string; quantity_sold: number }>;
  orders_by_month: Array<{ month: string; count: number }>;
  orders_by_branches: Array<{ branch_name: string; count: number }>;
  orders_by_clients?: Array<{ client_name: string; count: number }>;
  orders_by_product: Array<{ product_name: string; count: number }>;
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

  const handleDownload = () => {
    if (!dashboardData) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";

      // 1. Summary Section
      csvContent += "REPORT SUMMARY\n";
      csvContent += `Filter,${filter}\n`;
      if (filter === "Custom Date") csvContent += `Period,${fromDate} to ${toDate}\n`;
      csvContent += `Total Sales,${config.currencySymbol}${dashboardData.total_sales}\n`;
      csvContent += `Total Completed Orders,${dashboardData.total_completed_orders}\n\n`;

      // 2. Orders by Month
      csvContent += "ORDERS BY MONTH\nMonth,Count\n";
      dashboardData.orders_by_month.forEach(row => {
        csvContent += `${row.month},${row.count}\n`;
      });
      csvContent += "\n";

      // 3. Orders by Product (Full List)
      csvContent += "SALES BY PRODUCT\nProduct Name,Quantity Sold\n";
      dashboardData.orders_by_product.forEach(row => {
        csvContent += `"${row.product_name.replace(/"/g, '""')}",${row.count}\n`;
      });
      csvContent += "\n";

      // 4. Orders by Province/Branch
      csvContent += "SALES BY PROVINCE\nProvince Name,Count\n";
      dashboardData.orders_by_branches.forEach(row => {
        csvContent += `"${row.branch_name.replace(/"/g, '""')}",${row.count}\n`;
      });
      csvContent += "\n";

      // 5. Orders by Clients
      if (dashboardData.orders_by_clients && dashboardData.orders_by_clients.length > 0) {
        csvContent += "TOP CLIENTS\nClient Name,Order Count\n";
        dashboardData.orders_by_clients.forEach(row => {
          csvContent += `"${row.client_name.replace(/"/g, '""')}",${row.count}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = `Sales_Report_${filter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report downloaded successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate report");
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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-accent-900">Sales & Order Statistics</h2>
          <button
            onClick={handleDownload}
            disabled={!dashboardData || loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <DownloadCloud className="h-4 w-4" />
            Download
          </button>
        </div>
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

              {/* Orders by Product Treemap */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-accent-900">Product Distribution</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Sales Volume</span>
                </div>
                {dashboardData.orders_by_product && dashboardData.orders_by_product.length > 0 ? (
                  <ApexChart
                    options={{
                      legend: { show: false },
                      chart: {
                        type: 'treemap' as const,
                        toolbar: { show: false },
                        animations: {
                          enabled: true,
                          speed: 800,
                        }
                      },
                      plotOptions: {
                        treemap: {
                          distributed: true,
                          enableShades: false,
                          useFillColorAsStroke: true
                        }
                      },
                      colors: [
                        '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E',
                        '#F97316', '#FACC15', '#22C55E', '#06B6D4',
                        '#3B82F6', '#10B981'
                      ], // Vibrant Indigo-to-Cyan palette
                      dataLabels: {
                        enabled: true,
                        style: {
                          fontSize: '14px',
                          fontWeight: 'bold',
                          fontFamily: 'inherit'
                        },
                        offsetY: -2
                      },
                      tooltip: {
                        theme: 'light',
                        y: {
                          formatter: (val: number) => `${val} units sold`
                        }
                      }
                    }}
                    series={[{
                      data: dashboardData.orders_by_product.map(p => ({
                        x: p.product_name,
                        y: p.count
                      }))
                    }]}
                    type="treemap"
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
