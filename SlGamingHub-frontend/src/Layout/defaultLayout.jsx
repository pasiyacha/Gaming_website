import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from '../Components/Admi_Dashbord/Sidebar'
import Topbar from "../Components/Admi_Dashbord/Topbar";

function DefaultLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Admin layout - Token check:", token ? "Token exists" : "No token found");
    setIsAuthenticated(!!token);
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/auth/Login" />;
  }

  return (
    <div className="flex flex-row bg-blue-200 min-h-screen">
      {/* Sidebar */}
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-grow">
        {/* Header */}
        <div className="h-14 sticky top-0 z-10">
          <Topbar />
        </div>

        {/* Page content */}
        <div className="flex-grow ">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DefaultLayout;