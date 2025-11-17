import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const BulkActionsMenu = ({ selectedProducts, categories, onSuccess }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState({ type: 'percentage', value: '' });
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleExportCSV = async () => {
    try {
      const response = await api.post('/api/bulk-actions/products/export-csv', {
        productIds: selectedProducts
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Products exported successfully!');
    } catch (error) {
      toast.error('Failed to export products');
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      try {
        await api.post('/api/bulk-actions/products/delete', {
          productIds: selectedProducts
        });
        toast.success(`${selectedProducts.length} products deleted successfully!`);
        onSuccess();
      } catch (error) {
        toast.error('Failed to delete products');
      }
    }
  };

  const handlePriceAdjustment = async () => {
    try {
      await api.post('/api/bulk-actions/products/adjust-price', {
        productIds: selectedProducts,
        adjustmentType: priceAdjustment.type,
        value: parseFloat(priceAdjustment.value)
      });
      toast.success('Prices adjusted successfully!');
      setShowPriceModal(false);
      setPriceAdjustment({ type: 'percentage', value: '' });
      onSuccess();
    } catch (error) {
      toast.error('Failed to adjust prices');
    }
  };

  const handleCategoryChange = async () => {
    try {
      await api.post('/api/bulk-actions/products/change-category', {
        productIds: selectedProducts,
        categoryId: selectedCategory
      });
      toast.success('Category changed successfully!');
      setShowCategoryModal(false);
      setSelectedCategory('');
      onSuccess();
    } catch (error) {
      toast.error('Failed to change category');
    }
  };

  if (selectedProducts.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold flex items-center"
      >
        <span className="mr-2">⚡</span>
        Bulk Actions ({selectedProducts.length})
      </button>

      {showMenu && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 w-64">
          <button
            onClick={() => { handleExportCSV(); setShowMenu(false); }}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center"
          >
            <span className="mr-3 text-xl">📥</span>
            <span className="font-medium">Export Selected</span>
          </button>
          <button
            onClick={() => { setShowPriceModal(true); setShowMenu(false); }}
            className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center"
          >
            <span className="mr-3 text-xl">💰</span>
            <span className="font-medium">Adjust Prices</span>
          </button>
          <button
            onClick={() => { setShowCategoryModal(true); setShowMenu(false); }}
            className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center"
          >
            <span className="mr-3 text-xl">🏷️</span>
            <span className="font-medium">Change Category</span>
          </button>
          <button
            onClick={() => { handleBulkDelete(); setShowMenu(false); }}
            className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center text-red-600"
          >
            <span className="mr-3 text-xl">🗑️</span>
            <span className="font-medium">Delete Selected</span>
          </button>
        </div>
      )}

      {/* Price Adjustment Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl m-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">💰 Adjust Prices</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Adjustment Type</label>
                <select
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={priceAdjustment.type}
                  onChange={(e) => setPriceAdjustment({ ...priceAdjustment, type: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {priceAdjustment.type === 'percentage' ? 'Percentage (e.g., 10 for +10%, -5 for -5%)' : 'Amount (e.g., 5 for +₹5, -3 for -₹3)'}
                </label>
                <input
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  type="number"
                  step="0.01"
                  value={priceAdjustment.value}
                  onChange={(e) => setPriceAdjustment({ ...priceAdjustment, value: e.target.value })}
                  placeholder="Enter value"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setShowPriceModal(false); setPriceAdjustment({ type: 'percentage', value: '' }); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePriceAdjustment}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Change Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl m-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">🏷️ Change Category</h3>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Select New Category</label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setShowCategoryModal(false); setSelectedCategory(''); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCategoryChange}
                disabled={!selectedCategory}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionsMenu;

