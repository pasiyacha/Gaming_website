import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Profile from "./Profile";

function Topbar() {
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const location = useLocation();
  
  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/Order')) {
      setPageTitle('Orders');
    } else if (path.includes('/admin/Package')) {
      setPageTitle('Packages');
    } else if (path.includes('/admin/Users')) {
      setPageTitle('Users');
    } else if (path.includes('/admin/Bank_Details')) {
      setPageTitle('Bank Details');
    } else if (path.includes('/admin/Settings')) {
      setPageTitle('Settings');
    } else {
      setPageTitle('Dashboard');
    }
  }, [location]);

  return (
    <div className="w-full flex px-1 py-1 justify-center items-center">
      <div className="w-full flex items-center justify-between px-4 h-[49px] rounded-lg bg-[#0e08ab] text-white">
        <h1 className="text-xl font-bold hidden sm:block">{pageTitle}</h1>
        <Profile/>
      </div>
    </div>
  )
}

export default Topbar;