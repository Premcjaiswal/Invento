import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../lib/api';
import { format } from 'date-fns';

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    type: 'sale',
    quantity: '',
    notes: '',
    reference: ''
  });
  const [hoveredSection, setHoveredSection] = useState(null);

  useEffect(() => {
    fetchMovements();
    fetchProducts();
  }, []);

  const fetchMovements = async () => {
    try {
      const res = await api.get('/api/stock-movements');
      setMovements(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast.error('Failed to load stock movements');
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      const productData = res.data.data || res.data;
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/stock-movements', formData);
      toast.success('Stock movement recorded successfully!');
      resetForm();
      fetchMovements();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record movement');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      type: 'sale',
      quantity: '',
      notes: '',
      reference: ''
    });
    setIsModalOpen(false);
  };

  const filteredMovements = movements.filter(movement => {
    const matchesType = filterType === '' || movement.type === filterType;
    const matchesProduct = filterProduct === '' || movement.product?._id === filterProduct;
    return matchesType && matchesProduct;
  });

  const getTypeColor = (type) => {
    const colors = {
      sale: 'bg-red-100 text-red-800',
      purchase: 'bg-green-100 text-green-800',
      return: 'bg-blue-100 text-blue-800',
      adjustment: 'bg-yellow-100 text-yellow-800',
      damage: 'bg-pink-100 text-pink-800',
      transfer: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      sale: '💰',
      purchase: '📦',
      return: '↩️',
      adjustment: '⚖️',
      damage: '❌',
      transfer: '🔄'
    };
    return icons[type] || '📋';
  };

  const getBackgroundClass = () => {
    switch(hoveredSection) {
      case 'filters':
        return 'bg-gradient-to-br from-cyan-100 via-blue-50 to-indigo-50';
      case 'table':
        return 'bg-gradient-to-br from-purple-100 via-pink-50 to-rose-50';
      case 'addbutton':
        return 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50';
      default:
        return '';
    }
  };

  return (
    <Layout hoveredCard={hoveredSection}>
      <div className={`space-y-6 transition-all duration-700 ${getBackgroundClass()} ${hoveredSection ? 'p-8 rounded-2xl' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col space-y-1">
            <h1 className="text-3xl font-bold text-gray-800">📊 Stock Movements</h1>
            <p className="text-sm text-gray-500">Track all inventory changes and transactions</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={() => setHoveredSection('addbutton')}
            onMouseLeave={() => setHoveredSection(null)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold flex items-center ring-4 ring-transparent hover:ring-green-300"
          >
            <span className="mr-2 text-xl">+</span>
            Record Movement
          </button>
        </div>

        {/* Filters */}
        <div 
          onMouseEnter={() => setHoveredSection('filters')}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-md border border-white/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ring-4 ring-transparent hover:ring-cyan-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="sale">Sales</option>
                <option value="purchase">Purchases</option>
                <option value="return">Returns</option>
                <option value="adjustment">Adjustments</option>
                <option value="damage">Damages</option>
                <option value="transfer">Transfers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📦 Filter by Product</label>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div 
            onMouseEnter={() => setHoveredSection('table')}
            onMouseLeave={() => setHoveredSection(null)}
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden border border-white/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.005] ring-4 ring-transparent hover:ring-purple-200"
          >
            {filteredMovements.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-6xl mb-4 block">📊</span>
                <p className="text-gray-500 text-lg">No stock movements found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Change</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMovements.map((movement) => (
                      <tr 
                        key={movement._id}
                        className="hover:bg-purple-50 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer relative group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{movement.product?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{movement.product?.sku || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(movement.type)}`}>
                            {getTypeIcon(movement.type)} {movement.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">{movement.quantity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-gray-500">{movement.previousQuantity}</span>
                          <span className="mx-2">→</span>
                          <span className="font-bold text-gray-900">{movement.newQuantity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {movement.performedBy?.name || 'System'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {movement.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Movement Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 m-4">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-100 rounded-lg mr-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Record Stock Movement</h2>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Product *</label>
                    <select
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      name="productId"
                      value={formData.productId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} (Stock: {product.quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Movement Type *</label>
                    <select
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="sale">Sale (Decrease)</option>
                      <option value="purchase">Purchase (Increase)</option>
                      <option value="return">Return (Increase)</option>
                      <option value="adjustment">Adjustment (Set Exact)</option>
                      <option value="damage">Damage (Decrease)</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {formData.type === 'adjustment' ? 'New Quantity *' : 'Quantity *'}
                    </label>
                    <input
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      type="number"
                      name="quantity"
                      min="0"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Reference</label>
                    <input
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      type="text"
                      name="reference"
                      placeholder="Invoice #, PO #, etc."
                      value={formData.reference}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Notes</label>
                    <textarea
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      name="notes"
                      rows="3"
                      placeholder="Additional details..."
                      value={formData.notes}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Record Movement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StockMovements;



