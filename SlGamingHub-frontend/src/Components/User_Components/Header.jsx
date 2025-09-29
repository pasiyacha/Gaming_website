import React, { useState, useEffect } from 'react';
// Correct the logo import path (relative to this file)
import logo from '../../assets/logo.jpeg';
// Correct the Register and LoginForm import paths
import Register from './Register';
import LoginForm from './LoginForm';
import Reset from './Reset';
import { Link } from 'react-router-dom';
import { isLoggedIn, getUserName, isAdmin, logout } from '../../utils/authUtils';

function Header() {
  const [showpopup, setshowpopup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [userName, setUserName] = useState(getUserName());
  const [isAdminUser, setIsAdminUser] = useState(isAdmin());

  // Check auth status when component mounts and on auth changes
  useEffect(() => {
    const updateAuthStatus = () => {
      setIsAuthenticated(isLoggedIn());
      setUserName(getUserName());
      setIsAdminUser(isAdmin());
    };
    
    // Listen for auth changes via custom event
    window.addEventListener('authChange', updateAuthStatus);
    
    // Listen for storage changes (for cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userRole' || e.key === 'userName') {
        updateAuthStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('authChange', updateAuthStatus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handler functions for popup navigation
  const handleShowRegister = () => setshowpopup('register');
  const handleShowLogin = () => setshowpopup('login');
  const handleShowReset = () => setshowpopup('reset');
  const handleClosePopup = () => setshowpopup(false);
  
  // Logout handler
  const handleLogout = () => {
    logout(); // Use the utility function that dispatches the auth event
  };

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        {/* Logo with home redirect */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <img
            src={logo}
            alt="Logo"
            className="w-12 h-12 rounded-full border-2 border-white"
          />
          <span className="text-lg font-bold">SL Gaming Hub</span>
        </Link>

        {/* Conditional Authentication Buttons */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isAdminUser && (
                <Link 
                  to="/admin/Order" 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
                >
                  Admin Panel
                </Link>
              )}
              <div className="text-orange-400 font-medium mr-3">
                Welcome, {userName || 'User'}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleShowLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Login
              </button>
              <button
                onClick={handleShowRegister}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition ml-2"
              >
                Register
              </button>
            </>
          )}
        </div>
        {/* Popup Login/Register Form */}
        {showpopup === 'login' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 relative">
              <button
                className="absolute top-2 right-2 text-white bg-red-600 rounded-full px-2 py-1"
                onClick={handleClosePopup}
              >
                ✕
              </button>
              <LoginForm
                onClose={handleClosePopup}
                onShowRegister={handleShowRegister}
                onShowReset={handleShowReset}
              />
            </div>
          </div>
        )}
        {showpopup === 'register' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 relative">
              <button
                className="absolute top-2 right-2 text-white bg-red-600 rounded-full px-2 py-1"
                onClick={handleClosePopup}
              >
                ✕
              </button>
              <Register 
                onClose={handleClosePopup}
                onShowLogin={handleShowLogin}
                onShowReset={handleShowReset}
              />
            </div>
          </div>
        )}
        {showpopup === 'reset' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 relative">
              <button
                className="absolute top-2 right-2 text-white bg-red-600 rounded-full px-2 py-1"
                onClick={handleClosePopup}
              >
                ✕
              </button>
              <Reset 
                onClose={handleClosePopup}
                onShowLogin={handleShowLogin}
                onShowRegister={handleShowRegister}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

