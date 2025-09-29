import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../../Components/User_Components/Footer";
import PaymentMethod from "../../Components/User_Components/PaymentMethod";
import { mockPackageData } from "../../utils/mockPackageData";
import Header from "../../Components/User_Components/Header";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";
import { bannerImage } from "../../utils/imageUtils";

const GamePage = () => {
  const [gameData, setGameData] = useState([]);
  const [useruid, setUserId] = useState(""); // Added state for User ID input
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const gameId = useParams().gameId;
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    
    // Fetch package data
    fetchPackages(token);

    // Listen for auth changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem("token");
      setIsAuthenticated(!!newToken);
    };
    
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        setIsAuthenticated(!!e.newValue);
      }
    });
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [gameId]);

  // Function to fetch package data
  const fetchPackages = (token) => {
    setLoading(true);
    
    if (token) {
      // If logged in, try to get real data from API
      axios.get(getApiUrl(`/api/package/game/${gameId}`), {
        headers: getApiHeaders()
      })
        .then((response) => {
          setGameData(response.data.data || []);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching package data:", error);
          // Use the correct mock data for this game
          setGameData(mockPackageData[gameId] || []);
          setLoading(false);
        });
    } else {
      // If not logged in, use mock data immediately
      setGameData(mockPackageData[gameId] || []);
      setLoading(false);
    }
  };

function handleCheckUsername(e) {
  e.preventDefault();
  
  // If not authenticated, prompt to login
  if (!isAuthenticated) {
    if (window.confirm("You need to login to check username. Would you like to login now?")) {
      navigate("/login");
    }
    return;
  }
  
  const token = localStorage.getItem("token");
  
  // Example: Replace with your actual endpoint and logic
  axios.get("TUFtAEuiwTBDDL8dEDIYHBhBaFV5NC"+useruid, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((response) => {
      // Handle success (show username, etc.)
      // alert(`Username found: ${response.result}`);
      console.log(`Username found: ${response.data}`);
    })
    .catch((error) => {
      // Handle error (user not found, etc.)
      alert("User not found or error occurred.");
      console.error(error);
    });
}
  

  return (
    <div className="bg-blue-200 min-h-screen text-white p-2 sm:p-4 md:p-6">
      <Header />
      
      {/* Auth Warning Banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-orange-500 text-white p-3 mb-4 rounded-lg text-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          You are in view-only mode. <a href="/login" className="underline font-bold">Login</a> to purchase packages.
        </div>
      )}
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left Banner*/}
        <div className="bg-[#0e08ab] rounded-xl overflow-hidden">
          <img
            src={bannerImage}
            alt="Banner"
            className="w-full h-40 sm:h-60 object-cover"
          />
        </div>

        {/* User ID Form */}
        <div className="bg-[#0e08ab] rounded-xl p-4 sm:p-6 lg:col-span-2 flex flex-col justify-center">
          <h2 className="text-xl font-bold mb-4">Enter the User ID</h2>
          <form onSubmit={handleCheckUsername}>
            <input
              type="text"
              placeholder={isAuthenticated ? "Enter User ID" : "Login required to use this feature"}
              value={useruid}
              onChange={(e) => setUserId(e.target.value)}
              className={`w-full p-3 sm:p-5 mb-5 rounded-md ${isAuthenticated ? 'bg-[#46a2da]' : 'bg-gray-600'} placeholder-blue-200 text-white`}
              disabled={!isAuthenticated}
            />
            <button
              type="submit"
              className={`w-full ${isAuthenticated ? 'bg-orange-500 hover:bg-orange-200' : 'bg-gray-500 cursor-not-allowed'} text-lg py-3 rounded-full font-semibold transition`}
              disabled={!isAuthenticated}
            >
              {isAuthenticated ? "Check Username" : "Login to Check Username"}
            </button>
          </form>
        </div>
      </div>

      {/*Game Name*/}
      <h2 className="text-2xl sm:text-4xl p-4 sm:p-6 font-bold mb-4 text-black text-center">
        Free Fire SG Packages
      </h2>
      
      {loading ? (
        <div className="text-center my-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-3 text-blue-900">Loading packages...</p>
        </div>
      ) : (
        <>
          {/* Game Info & Packages */}
          {gameData.map((pkg, index) => (
            <div key={index}>
              {/* Packages */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div 
                  className={`${isAuthenticated ? 'bg-[#0e08ab] hover:bg-blue-900 cursor-pointer' : 'bg-gray-700'} p-4 rounded-lg flex flex-col items-center relative transition-all duration-300`}
                  onClick={() => {
                    if (!isAuthenticated && window.confirm("You need to login to purchase this package. Would you like to login now?")) {
                      navigate("/login");
                    }
                  }}
                >
                  <div className="w-12 h-12 bg-orange-300 rounded-md mb-2"></div>
                  <h4 className="font-semibold">
                    {pkg.packagename || pkg.gamename || "Package"}
                  </h4>
                  <span className="text-white">{pkg.price || "N/A"}</span>
                  
                  {!isAuthenticated && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-500 text-xs font-bold px-2 py-1 rounded text-black">
                        Login Required
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Payment Method */}
      <div className="mt-8">
        {!isAuthenticated ? (
          <div className="bg-gray-700 p-5 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-3">Payment Methods</h3>
            <p className="mb-4">Please login to access payment options</p>
            <button 
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Login to Continue
            </button>
          </div>
        ) : (
          <PaymentMethod />
        )}
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default GamePage;
