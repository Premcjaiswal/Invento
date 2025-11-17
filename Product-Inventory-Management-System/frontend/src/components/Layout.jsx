import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Layout = ({ children, hoveredCard }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredNav, setHoveredNav] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic background based on hovered card/section
  const getBackgroundGradient = () => {
    // Dashboard cards
    if (hoveredCard === 'products') {
      return 'from-blue-100 via-indigo-100 to-blue-50';
    } else if (hoveredCard === 'categories') {
      return 'from-green-100 via-emerald-100 to-green-50';
    } else if (hoveredCard === 'lowstock') {
      return 'from-red-100 via-pink-100 to-red-50';
    }
    // Products page sections
    else if (hoveredCard === 'search') {
      return 'from-cyan-100 via-blue-50 to-sky-50';
    } else if (hoveredCard === 'table') {
      return 'from-blue-100 via-indigo-50 to-purple-50';
    } else if (hoveredCard === 'addbutton') {
      return 'from-green-100 via-emerald-50 to-teal-50';
    }
    return 'from-blue-50 via-indigo-50 to-purple-50';
  };

  // Get blob colors based on hovered section
  const getBlobColors = () => {
    if (hoveredCard === 'products') {
      return ['bg-blue-300', 'bg-indigo-300', 'bg-blue-400'];
    } else if (hoveredCard === 'categories' || hoveredCard === 'addbutton') {
      return ['bg-green-300', 'bg-emerald-300', 'bg-teal-300'];
    } else if (hoveredCard === 'lowstock') {
      return ['bg-red-300', 'bg-pink-300', 'bg-rose-300'];
    } else if (hoveredCard === 'search') {
      return ['bg-cyan-300', 'bg-blue-300', 'bg-sky-300'];
    } else if (hoveredCard === 'table') {
      return ['bg-blue-300', 'bg-indigo-300', 'bg-purple-300'];
    }
    return ['bg-blue-200', 'bg-purple-200', 'bg-pink-200'];
  };

  const [blob1, blob2, blob3] = getBlobColors();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/categories', label: 'Categories', icon: '🏷️' },
    { path: '/stock-movements', label: 'Stock Movements', icon: '📋' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className={`flex h-screen bg-gradient-to-br ${getBackgroundGradient()} relative overflow-hidden transition-all duration-700 ease-in-out`}>
      {/* Animated Background Pattern */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${hoveredCard ? 'opacity-50' : 'opacity-30'}`}>
        <div className={`absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob transition-colors duration-700 ${blob1}`}></div>
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 transition-colors duration-700 ${blob2}`}></div>
        <div className={`absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 transition-colors duration-700 ${blob3}`}></div>
      </div>
      
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white/95 backdrop-blur-sm shadow-xl border-r border-gray-200 relative z-10 transition-all duration-500 ease-in-out`}>
        {/* Header with animated logo */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden group">
          {/* Animated background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center">
              <span className="text-3xl mr-3 animate-bounce hover:animate-spin transition-all duration-300">📦</span>
              {!isCollapsed && (
                <h1 className="text-xl font-bold text-white transition-opacity duration-300">
                  Inventory Manager
                </h1>
              )}
            </div>
            
            {/* Collapse/Expand Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-180"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <span className="text-lg">{isCollapsed ? '»' : '«'}</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 relative">
          <ul className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              const isHovered = hoveredNav === item.path;
              
              return (
                <li key={item.path} className="relative">
                  {/* Active Indicator - Slides in from left */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full animate-pulse"></div>
                  )}
                  
                  <Link
                    to={item.path}
                    onMouseEnter={() => setHoveredNav(item.path)}
                    onMouseLeave={() => setHoveredNav(null)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg 
                      transition-all duration-300 ease-in-out
                      transform hover:translate-x-2 hover:scale-105
                      relative overflow-hidden group
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    style={{
                      transitionDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Ripple effect on hover */}
                    {isHovered && !isActive && (
                      <div className="absolute inset-0 bg-blue-100 animate-ping opacity-20 rounded-lg"></div>
                    )}
                    
                    {/* Icon with animation */}
                    <span className={`
                      text-xl transition-all duration-300
                      ${isHovered ? 'animate-bounce' : ''}
                      ${isActive ? 'scale-110' : ''}
                      ${isCollapsed ? '' : 'mr-3'}
                    `}>
                      {item.icon}
                    </span>
                    
                    {/* Label */}
                    {!isCollapsed && (
                      <span className="font-medium relative z-10">
                        {item.label}
                      </span>
                    )}
                    
                    {/* Hover indicator arrow */}
                    {!isCollapsed && isHovered && (
                      <span className="ml-auto text-sm animate-pulse">→</span>
                    )}

                    {/* Active glow effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 blur-xl"></div>
                    )}
                  </Link>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && isHovered && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap z-50 animate-fadeIn">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left Side - Breadcrumb / Page Info */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="text-lg">
                  {navItems.find((item) => item.path === location.pathname)?.icon || '📄'}
                </span>
                <span className="font-medium text-gray-400">Inventory Manager</span>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-gray-700">
                  {navItems.find((item) => item.path === location.pathname)?.label || 'Page'}
                </span>
              </div>
            </div>

            {/* Center - Quick Stats or Time */}
            <div className="hidden lg:flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📅</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🕐</span>
                <span className="font-medium">
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Right Side - User & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-md group">
                <span className="text-lg mr-2 transition-transform duration-300 group-hover:rotate-12">👤</span>
                <span className="text-sm font-semibold text-gray-700">
                  {currentUser?.name || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-xl transition-all duration-300 flex items-center space-x-1 group hover:scale-110 active:scale-95 relative overflow-hidden"
              >
                {/* Animated background on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className="relative z-10 transition-transform duration-300 group-hover:rotate-12">🚪</span>
                <span className="relative z-10">Logout</span>
                
                {/* Slide out arrow on hover */}
                <span className="relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">→</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;