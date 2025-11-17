import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStockProducts: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get products count
        const productsRes = await api.get('/api/products');
        
        // Get categories count
        const categoriesRes = await api.get('/api/categories');
        
        // Get low stock products
        const lowStockRes = await api.get('/api/products/low-stock');
        
        // Ensure we have arrays (backend might return { data: [...] } or just [...])
        const products = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.data || []);
        const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data.data || []);
        const lowStock = Array.isArray(lowStockRes.data) ? lowStockRes.data : (lowStockRes.data.data || []);
        
        setStats({
          totalProducts: products.length,
          totalCategories: categories.length,
          lowStockProducts: lowStock.length
        });
        
        setLowStockItems(lowStock);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Make sure the backend server is running.');
        setLowStockItems([]); // Ensure it's always an array
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Dynamic background gradient based on hovered card
  const getBackgroundClass = () => {
    switch(hoveredCard) {
      case 'products':
        return 'bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-50';
      case 'categories':
        return 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50';
      case 'lowstock':
        return 'bg-gradient-to-br from-red-100 via-pink-50 to-rose-50';
      default:
        return '';
    }
  };

  return (
    <Layout hoveredCard={hoveredCard}>
      <div className={`space-y-6 transition-all duration-700 ${getBackgroundClass()} ${hoveredCard ? 'p-8 rounded-2xl' : ''}`}>
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back! Here's your inventory overview
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-2">Please ensure:</p>
            <ul className="list-disc list-inside text-sm">
              <li>MongoDB is running</li>
              <li>Backend server is running on port 5000</li>
            </ul>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards - Now Interactive with Background Change! */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Products Card - Clickable */}
              <div 
                onClick={() => navigate('/products')}
                onMouseEnter={() => setHoveredCard('products')}
                onMouseLeave={() => setHoveredCard(null)}
                className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-white transform hover:-translate-y-2 hover:scale-105 cursor-pointer group relative overflow-hidden ring-4 ring-transparent hover:ring-blue-300"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Products</p>
                    <p className="text-4xl font-bold mb-2">{stats.totalProducts}</p>
                    <div className="flex items-center text-xs text-blue-100 group-hover:text-white transition-colors">
                      <span className="mr-1">View all products</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all group-hover:rotate-12 transform duration-300">
                    <span className="text-4xl">📦</span>
                  </div>
                </div>
              </div>
              
              {/* Total Categories Card - Clickable */}
              <div 
                onClick={() => navigate('/categories')}
                onMouseEnter={() => setHoveredCard('categories')}
                onMouseLeave={() => setHoveredCard(null)}
                className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-white transform hover:-translate-y-2 hover:scale-105 cursor-pointer group relative overflow-hidden ring-4 ring-transparent hover:ring-green-300"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Total Categories</p>
                    <p className="text-4xl font-bold mb-2">{stats.totalCategories}</p>
                    <div className="flex items-center text-xs text-green-100 group-hover:text-white transition-colors">
                      <span className="mr-1">Manage categories</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all group-hover:rotate-12 transform duration-300">
                    <span className="text-4xl">🏷️</span>
                  </div>
                </div>
              </div>
              
              {/* Low Stock Items Card - Clickable */}
              <div 
                onClick={() => navigate('/products')}
                onMouseEnter={() => setHoveredCard('lowstock')}
                onMouseLeave={() => setHoveredCard(null)}
                className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-white transform hover:-translate-y-2 hover:scale-105 cursor-pointer group relative overflow-hidden ring-4 ring-transparent hover:ring-red-300"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-red-100 text-sm font-medium mb-1">Low Stock Items</p>
                    <p className="text-4xl font-bold mb-2">{stats.lowStockProducts}</p>
                    <div className="flex items-center text-xs text-red-100 group-hover:text-white transition-colors">
                      <span className="mr-1">Restock products</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all group-hover:rotate-12 transform duration-300">
                    <span className="text-4xl">⚠️</span>
                  </div>
                </div>
                {stats.lowStockProducts > 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Low Stock Products */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">⚠️</span>
                <h2 className="text-xl font-bold text-gray-800">Low Stock Products</h2>
              </div>
              
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-5xl mb-2 block">✅</span>
                  <p className="text-gray-500 font-medium">All products are well stocked!</p>
                  <p className="text-gray-400 text-sm mt-1">Low stock = less than 10 items</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lowStockItems.map((product) => (
                        <tr 
                          key={product._id}
                          onClick={() => navigate('/products')}
                          className="hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {product.name}
                              </div>
                              <span className="ml-2 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                →
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{product.category?.name || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">${product.price.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 group-hover:bg-red-600 group-hover:text-white transition-colors">
                              {product.quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;