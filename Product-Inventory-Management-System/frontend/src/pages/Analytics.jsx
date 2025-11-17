import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../lib/api';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSection, setHoveredSection] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/analytics/dashboard');
      setAnalyticsData(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getBackgroundClass = () => {
    if (hoveredSection === 'overview') {
      return 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50';
    }
    return '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hoveredCard={hoveredSection}>
      <div className={`space-y-6 transition-all duration-700 ${getBackgroundClass()} ${hoveredSection ? 'p-8 rounded-2xl' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col space-y-1">
            <h1 className="text-3xl font-bold text-gray-800">📊 Reports & Analytics</h1>
            <p className="text-sm text-gray-500">Comprehensive insights into your inventory</p>
          </div>
        </div>

        {/* Analytics Content */}
        {analyticsData && (
          <div 
            onMouseEnter={() => setHoveredSection('overview')}
            onMouseLeave={() => setHoveredSection(null)}
            className="space-y-6"
          >
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Products</p>
                    <p className="text-3xl font-bold text-blue-600">{analyticsData.inventory.totalProducts}</p>
                  </div>
                  <span className="text-4xl">📦</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                    <p className="text-3xl font-bold text-green-600">{analyticsData.inventory.totalQuantity}</p>
                  </div>
                  <span className="text-4xl">📊</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Value</p>
                    <p className="text-3xl font-bold text-purple-600">₹{analyticsData.inventory.totalValue.toFixed(2)}</p>
                  </div>
                  <span className="text-4xl">💰</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                    <p className="text-3xl font-bold text-indigo-600">{analyticsData.inventory.profitMargin}%</p>
                  </div>
                  <span className="text-4xl">📈</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            {analyticsData.categoryBreakdown && analyticsData.categoryBreakdown.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Value Distribution */}
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Category Value Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Quantity Chart */}
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📦 Category Quantity</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantity" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Products */}
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top 10 Products by Value</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analyticsData.topProducts.map((product, index) => (
                        <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-gray-600">{product.category || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">{product.quantity}</td>
                          <td className="px-4 py-3 font-bold text-green-600">₹{product.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;

