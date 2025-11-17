import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../lib/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hoveredSection, setHoveredSection] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFilter, setExportDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const getFilteredProductsByDate = () => {
    if (exportDateFilter === 'all') {
      return products;
    }

    const now = new Date();
    let startDate;

    switch (exportDateFilter) {
      case '1day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '2days':
        startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        break;
      case '3days':
        startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          toast.error('Please select both start and end dates');
          return [];
        }
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        return products.filter(p => {
          const productDate = new Date(p.createdAt || p.updatedAt);
          return productDate >= start && productDate <= end;
        });
      default:
        return products;
    }

    return products.filter(p => {
      const productDate = new Date(p.createdAt || p.updatedAt);
      return productDate >= startDate;
    });
  };

  const handleExportCSV = async () => {
    try {
      const filteredProducts = getFilteredProductsByDate();
      
      if (filteredProducts.length === 0) {
        toast.error('No products found for the selected date range');
        return;
      }

      const productIds = filteredProducts.map(p => p._id);
      
      const response = await api.post('/api/bulk-actions/products/export-csv', {
        productIds: productIds
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename with date range info
      let filename = 'products-export';
      if (exportDateFilter !== 'all') {
        filename += `-${exportDateFilter}`;
      }
      filename += `-${Date.now()}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${filteredProducts.length} products exported to CSV successfully!`);
      setShowExportModal(false);
      setExportDateFilter('all');
      setCustomStartDate('');
      setCustomEndDate('');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category?._id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      // Backend might return { data: [...] } or just [...]
      const productData = res.data.data || res.data;
      setProducts(Array.isArray(productData) ? productData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setFetchError('Failed to load products. Make sure the backend server is running.');
      setProducts([]);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      // Backend returns { success: true, data: [...] }
      const categoryData = res.data.data || res.data;
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      };

      if (currentProduct) {
        // Update existing product
        await api.put(`/api/products/${currentProduct._id}`, productData);
        toast.success('Product updated successfully!', {
          icon: '✏️',
        });
      } else {
        // Create new product
        await api.post('/api/products', productData);
        toast.success('Product added successfully!', {
          icon: '✨',
        });
      }

      // Reset form and close modal
      setFormData({
        name: '',
        category: '',
        price: '',
        quantity: '',
        description: ''
      });
      setIsModalOpen(false);
      setCurrentProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      category: product.category?._id || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/${id}`);
        toast.success('Product deleted successfully!', {
          icon: '🗑️',
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  // Dynamic background gradient based on hovered section
  const getBackgroundClass = () => {
    switch(hoveredSection) {
      case 'search':
        return 'bg-gradient-to-br from-cyan-100 via-blue-50 to-indigo-50';
      case 'table':
        return 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50';
      case 'addbutton':
        return 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50';
      default:
        return '';
    }
  };

  return (
    <Layout hoveredCard={hoveredSection}>
      <div className={`space-y-6 transition-all duration-700 ${getBackgroundClass()} ${hoveredSection ? 'p-8 rounded-2xl' : ''}`}>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col space-y-1">
              <h1 className="text-3xl font-bold text-gray-800">Products</h1>
              <p className="text-sm text-gray-500">
                Manage your product inventory • 
                <span className="text-red-600 font-semibold">Low Stock Alert: Less than 10 items</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowExportModal(true)}
                disabled={products.length === 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold flex items-center ring-4 ring-transparent hover:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="mr-2 text-xl">📥</span>
                Export CSV
              </button>
          <button
            onClick={() => {
              setCurrentProduct(null);
              setFormData({
                name: '',
                category: '',
                price: '',
                quantity: '',
                description: ''
              });
              setIsModalOpen(true);
            }}
                onMouseEnter={() => setHoveredSection('addbutton')}
                onMouseLeave={() => setHoveredSection(null)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold flex items-center ring-4 ring-transparent hover:ring-blue-300"
              >
                <span className="mr-2 text-xl">+</span>
                Add Product
              </button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div 
            onMouseEnter={() => setHoveredSection('search')}
            onMouseLeave={() => setHoveredSection(null)}
            className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-md border border-white/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ring-4 ring-transparent hover:ring-cyan-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Bar */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Search Products
              </label>
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏷️ Filter by Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Summary */}
            {(searchTerm || selectedCategory) && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-bold text-blue-600">{filteredProducts.length}</span> of {products.length} products
                  {searchTerm && <span> matching "<span className="font-semibold">{searchTerm}</span>"</span>}
                  {selectedCategory && <span> in category "<span className="font-semibold">{categories.find(c => c._id === selectedCategory)?.name}</span>"</span>}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Clear Filters
          </button>
              </div>
            )}
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-bold">Error:</p>
            <p>{fetchError}</p>
            <p className="text-sm mt-2">Please ensure the backend server is running on port 5000.</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div 
            onMouseEnter={() => setHoveredSection('table')}
            onMouseLeave={() => setHoveredSection(null)}
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden border border-white/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.005] ring-4 ring-transparent hover:ring-indigo-200"
          >
            {products.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-6xl mb-4 block">📦</span>
                <p className="text-gray-500 text-lg">No products found. Add your first product!</p>
              </div>
            ) : (
              <>
                {/* Low Stock Info Banner */}
                {products.filter(p => p.quantity < 10).length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 font-semibold">
                          You have <span className="font-bold text-yellow-900">{products.filter(p => p.quantity < 10).length}</span> product(s) with low stock (less than 10 items)
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          💡 Products highlighted in red need restocking soon!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Results Message */}
                {filteredProducts.length === 0 && products.length > 0 && (
                  <div className="p-12 text-center">
                    <span className="text-6xl mb-4 block">🔍</span>
                    <p className="text-gray-500 text-lg font-semibold">No products found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Try adjusting your search or filter criteria
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('');
                      }}
                      className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}

              {filteredProducts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr 
                          key={product._id} 
                          className={`
                            ${product.quantity < 10 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'}
                            transition-all duration-300 ease-in-out
                            hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1
                            cursor-pointer relative
                            group
                          `}
                        >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {product.quantity < 10 && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  ⚠️ Low Stock
                                </span>
                              )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.category?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">₹{product.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                                product.quantity < 10 
                                  ? 'bg-red-600 text-white animate-pulse' 
                                  : 'bg-green-100 text-green-800'
                          }`}>
                            {product.quantity}
                          </span>
                              {product.quantity < 10 && (
                                <span className="ml-2 text-xs text-red-600 font-semibold">
                                  Restock soon!
                                </span>
                              )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md mr-2 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md transition-colors"
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
              </>
            )}
          </div>
        )}

        {/* Product Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 m-4">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-lg mr-3">
                  <span className="text-2xl">📦</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Product Name
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                    Category
                  </label>
                  {categories.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded">
                      <p className="text-sm">No categories available.</p>
                      <p className="text-sm mt-1">
                        Please{' '}
                        <a 
                          href="/categories" 
                          className="font-bold underline hover:text-yellow-900"
                          onClick={() => setIsModalOpen(false)}
                        >
                          create a category
                        </a>
                        {' '}first before adding products.
                      </p>
                    </div>
                  ) : (
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                    Price
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    id="price"
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                    Quantity
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    id="quantity"
                    type="number"
                    name="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={categories.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Export CSV Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 m-4">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-100 rounded-lg mr-3">
                  <span className="text-2xl">📥</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Export Products to CSV
                </h2>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-3">
                  Select Date Range
                </label>
                
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                  value={exportDateFilter}
                  onChange={(e) => setExportDateFilter(e.target.value)}
                >
                  <option value="all">All Products (No Date Filter)</option>
                  <option value="1day">Last 24 Hours</option>
                  <option value="2days">Last 2 Days</option>
                  <option value="3days">Last 3 Days</option>
                  <option value="7days">Last 7 Days (Week)</option>
                  <option value="30days">Last 30 Days (Month)</option>
                  <option value="custom">Custom Date Range</option>
                </select>

                {/* Custom Date Range Inputs */}
                {exportDateFilter === 'custom' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        min={customStartDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* Preview count */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">
                      {getFilteredProductsByDate().length} products
                    </span>
                    {' '}will be exported
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportModal(false);
                    setExportDateFilter('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={getFilteredProductsByDate().length === 0}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <span className="mr-2">📥</span>
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;