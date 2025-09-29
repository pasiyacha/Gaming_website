import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import logo from "../assets/logo.jpeg";

function AuthLayout() {
  return (
    <div className="bg-blue-950 min-h-screen">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/">
              <img
                src={logo}
                alt="Logo"
                className="w-12 h-12 rounded-full border-2 border-white"
              />
            </Link>
            <span className="text-lg font-bold">SL Gaming Hub</span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Link to="/" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition">
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)] py-8">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
