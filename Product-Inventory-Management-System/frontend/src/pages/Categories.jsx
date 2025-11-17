import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../lib/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hoveredSection, setHoveredSection] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      // Backend returns { success: true, data: [...] }
      const categoryData = res.data.data || res.data;
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setFetchError('Failed to load categories. Make sure the backend server is running.');
      setCategories([]);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (currentCategory) {
        // Update existing category
        await api.put(`/api/categories/${currentCategory._id}`, formData);
        toast.success('Category updated successfully!', {
          icon: '✏️',
        });
      } else {
        // Create new category
        await api.post('/api/categories', formData);
        toast.success('Category created successfully!', {
          icon: '✨',
        });
      }

      // Reset form and close modal
      setFormData({
        name: '',
        description: ''
      });
      setIsModalOpen(false);
      setCurrentCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/api/categories/${id}`);
        toast.success('Category deleted successfully!', {
          icon: '🗑️',
        });
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Cannot delete category that has products associated with it');
      }
    }
  };

  // Dynamic background gradient based on hovered section
  const getBackgroundClass = () => {
    switch(hoveredSection) {
      case 'addbutton':
        return 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50';
      case 'table':
        return 'bg-gradient-to-br from-green-100 via-green-50 to-lime-50';
      default:
        return '';
    }
  };

  return (
    <Layout hoveredCard={hoveredSection}>
      <div className={`space-y-6 transition-all duration-700 ${getBackgroundClass()} ${hoveredSection ? 'p-8 rounded-2xl' : ''}`}>
        <div className="flex justify-between items-start">
          <div className="flex flex-col space-y-1">
            <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
            <p className="text-sm text-gray-500">Organize your products by category</p>
          </div>
          <button
            onClick={() => {
              setCurrentCategory(null);
              setFormData({
                name: '',
                description: ''
              });
              setIsModalOpen(true);
            }}
            onMouseEnter={() => setHoveredSection('addbutton')}
            onMouseLeave={() => setHoveredSection(null)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold flex items-center ring-4 ring-transparent hover:ring-green-300"
          >
            <span className="mr-2 text-xl">+</span>
            Add Category
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <span className="text-xl mr-2">✓</span>
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

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
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden border border-white/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.005] ring-4 ring-transparent hover:ring-green-200"
          >
            {categories.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-6xl mb-4 block">🏷️</span>
                <p className="text-gray-500 text-lg">No categories found. Add your first category!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr 
                        key={category._id}
                        className="
                          hover:bg-green-50
                          transition-all duration-300 ease-in-out
                          hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1
                          cursor-pointer relative
                          group
                        "
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{category.description || 'No description'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(category)}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md mr-2 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
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
          </div>
        )}

        {/* Category Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 m-4">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-100 rounded-lg mr-3">
                  <span className="text-2xl">🏷️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentCategory ? 'Edit Category' : 'Add New Category'}
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
                    Category Name
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
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {currentCategory ? 'Update Category' : 'Add Category'}
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

export default Categories;