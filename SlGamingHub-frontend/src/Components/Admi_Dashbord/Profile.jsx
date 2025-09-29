import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { decodeToken } from '../../utils/authUtils';
import { getApiUrl, getApiHeaders } from '../../utils/apiUtils';

export default function Profile() {
  const [adminName, setAdminName] = useState('Admin');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch admin's name when component mounts
    fetchAdminName();
  }, []);

  const fetchAdminName = async () => {
    try {
      // First check if the name is stored in localStorage
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        setAdminName(storedName);
        return;
      }
      
      // If not in localStorage, try to get from token
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Try to get name from decoded token
      try {
        const decoded = decodeToken(token);
        if (decoded && decoded.name) {
          setAdminName(decoded.name);
          localStorage.setItem('userName', decoded.name);
          return;
        }
        if (decoded && decoded.firstName) {
          setAdminName(decoded.firstName);
          localStorage.setItem('userName', decoded.firstName);
          return;
        }
      } catch (err) {
        console.error('Error decoding token:', err);
      }
      
      // If token doesn't have name, fetch from API
      try {
        const response = await axios.get(getApiUrl('/api/users/profile'), {
          headers: getApiHeaders()
        });
        
        if (response.data) {
          // Check various possible field names
          const name = response.data.name || 
                      response.data.firstName || 
                      response.data.username || 
                      'Admin';
          setAdminName(name);
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        
        // Try alternative endpoints
        try {
          const response = await axios.get(getApiUrl('/api/users/me'), {
            headers: getApiHeaders()
          });
          
          if (response.data) {
            const name = response.data.name || 
                        response.data.firstName || 
                        response.data.username || 
                        'Admin';
            setAdminName(name);
          }
        } catch (error) {
          console.error('Error fetching admin profile from alternative endpoint:', error);
        }
      }
    } catch (err) {
      console.error('Error in fetchAdminName:', err);
    }
  };

  const handleLogout = () => {
    // Clear token and other user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    // Redirect to login page
    navigate('/auth/Login');
  };

  return (
    <div className="flex w-auto sm:w-64 items-center justify-between bg-white rounded-xl shadow-md px-2 sm:px-4 py-2">
      <div className="flex items-center gap-1 sm:gap-2">
        <p className="text-gray-600 font-medium text-xs sm:text-sm">Hello:</p>
        <span className="text-gray-900 font-semibold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[120px]">{adminName}</span>
      </div>

      <button 
        className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium px-2 sm:px-4 py-1 rounded-lg shadow-sm transition-all duration-200 ml-1 sm:ml-2"
        onClick={handleLogout}
      >
        Log out
      </button>
    </div>
  );
}
