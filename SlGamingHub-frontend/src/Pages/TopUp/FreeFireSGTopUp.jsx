import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/User_Components/Header";
import Footer from "../../Components/User_Components/Footer";
import BankDetailsDisplay from "../../Components/User_Components/BankDetailsDisplay";
import { mockPackageData } from "../../utils/mockPackageData";
import { isLoggedIn } from "../../utils/authUtils";
import bankService from "../../services/bankService";
import { freeFireBanner, defaultCard } from "../../utils/imageUtils";

const FreeFireSGTopUp = () => {
  const [packageData, setPackageData] = useState([]);
  const [useruid, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const navigate = useNavigate();
  
  const gameId = "68adf809384ec2353d40f565"; // Free Fire SG
  const gameName = "Free Fire (SG)";

  useEffect(() => {
    // Load bank accounts from API
    const fetchBankAccounts = async () => {
      try {
        // Try to get bank accounts from API
        const accounts = await bankService.getAllBanks();
        console.log("Loaded bank accounts from API:", accounts);
        setBankAccounts(accounts);
      } catch (error) {
        console.error("Error loading bank accounts from API, using fallback:", error);
        // Use fallback if API fails
        const fallbackService = bankService.fallbackToLocalStorage();
        const accounts = fallbackService.getAllBanks();
        console.log("Loaded bank accounts from fallback:", accounts);
        setBankAccounts(accounts);
      }
    };
    
    fetchBankAccounts();
    
    // Load packages
    try {
      const packages = mockPackageData[gameId] || [];
      console.log(`Loaded ${packages.length} packages for gameId: ${gameId}`, packages);
      setPackageData(packages);
      if (packages.length === 0) {
        console.error(`No packages found for gameId: ${gameId}`);
      }
    } catch (error) {
      console.error("Error loading package data:", error);
      setPackageData([]);
    }
    setLoading(false);
    
    // Check auth status
    setIsAuthenticated(isLoggedIn());
    
    // Listen for auth changes
    const handleAuthChange = () => {
      setIsAuthenticated(isLoggedIn());
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

  // Handle package selection
  const handlePackageSelect = (packageItem) => {
    if (!isAuthenticated) {
      // Show login prompt if not authenticated
      if (window.confirm("You need to login to purchase packages. Would you like to login now?")) {
        navigate("/auth/login");
      }
      return;
    }
    
    // Set the selected package
    setSelectedPackage(packageItem);
    
    // Scroll to checkout section
    setTimeout(() => {
      document.getElementById('checkout-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  function handleCheckUsername(e) {
    e.preventDefault();
    
    // If not authenticated, prompt to login
    if (!isAuthenticated) {
      if (window.confirm("You need to login to check username. Would you like to login now?")) {
        navigate("/auth/login");
      }
      return;
    }
    
    // Process username check for authenticated users
    console.log("Checking username:", useruid);
    // Implement actual username check logic here
  }

  return (
    <div className="bg-blue-950 min-h-screen text-white p-2 sm:p-4 md:p-6">
      <Header />
      
      {/* Game Title Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-xl mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{gameName} Top-Up</h1>
      </div>
      
      {/* Auth Warning Banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-orange-500 text-white p-3 mb-4 rounded-lg text-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          You are in view-only mode. <a href="/auth/login" className="underline font-bold">Login</a> to purchase packages.
        </div>
      )}
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left Banner*/}
        <div className="bg-[#0e08ab] rounded-xl overflow-hidden">
          <img
            src={freeFireBanner}
            alt="Free Fire SG Banner"
            className="w-full h-40 sm:h-60 object-cover"
          />
        </div>

        {/* User ID Form */}
        <div className="bg-[#0e08ab] rounded-xl p-4 sm:p-6 lg:col-span-2 flex flex-col justify-center">
          <h2 className="text-xl font-bold mb-4">Enter your Free Fire ID</h2>
          <form onSubmit={handleCheckUsername}>
            <input
              id="player-id-input"
              type="text"
              placeholder={isAuthenticated ? "Enter Free Fire ID" : "Login required to use this feature"}
              value={useruid}
              onChange={(e) => setUserId(e.target.value)}
              className={`w-full p-3 sm:p-5 mb-3 rounded-md ${isAuthenticated ? 'bg-[#46a2da]' : 'bg-gray-600'} placeholder-blue-200 text-white`}
              disabled={!isAuthenticated}
            />
            <input
              id="username-input"
              type="text"
              placeholder={isAuthenticated ? "Enter your Username" : "Login required to use this feature"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

      {/* Game Info & Packages */}
      <div className="mt-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-black">Select Package</h2>
        
        {loading ? (
          <div className="text-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
            <p className="mt-3 text-blue-900">Loading packages...</p>
          </div>
        ) : packageData.length === 0 ? (
          <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-8 rounded mb-4">
            <p className="text-xl font-bold mb-2">No packages found</p>
            <p>Sorry, we couldn't find any packages for this game. Please try again later or contact support.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {packageData.map((pkg, index) => (
              <div 
                key={index}
                className={`${isAuthenticated 
                  ? selectedPackage && selectedPackage._id === pkg._id 
                    ? 'bg-green-600 border-2 border-yellow-400' 
                    : 'bg-[#0e08ab] hover:bg-blue-900' 
                  : 'bg-gray-700'} 
                  p-6 rounded-lg flex flex-col items-center relative transition-all duration-300 cursor-pointer`}
                onClick={() => {
                  if (!isAuthenticated && window.confirm("You need to login to purchase this package. Would you like to login now?")) {
                    navigate("/auth/login");
                  } else if (isAuthenticated) {
                    handlePackageSelect(pkg);
                  }
                }}
              >
                {selectedPackage && selectedPackage._id === pkg._id && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <img 
                    src={pkg.imageUrl} 
                    alt={pkg.packagename} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to a default image if the specified image fails to load
                      e.target.src = defaultCard;
                    }}
                  />
                </div>
                <h4 className="font-bold text-xl mb-1">
                  {pkg.packagename}
                </h4>
                <span className="text-white text-lg font-semibold">{pkg.price}</span>
                <p className="text-gray-300 text-sm mt-2 text-center">{pkg.description}</p>
                
                {!isAuthenticated && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-yellow-500 text-xs font-bold px-2 py-1 rounded text-black">
                      Login Required
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment and Checkout */}
      <div id="checkout-section" className="mt-8">
        {!isAuthenticated ? (
          <div className="bg-gray-700 p-5 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-3">Checkout</h3>
            <p className="mb-4">Please login to complete your purchase</p>
            <button 
              onClick={() => navigate("/auth/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Login to Continue
            </button>
          </div>
        ) : (
          <div className="bg-[#0e08ab] text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Complete Your Purchase</h2>
            
            {/* Selected Package */}
            {selectedPackage ? (
              <div className="bg-blue-900 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Selected Package</h3>
                <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 mr-4 flex items-center justify-center">
                      <img 
                        src={selectedPackage.imageUrl} 
                        alt={selectedPackage.packagename} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to a default image if the specified image fails to load
                          e.target.src = defaultCard;
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{selectedPackage.packagename || 'Package'}</h4>
                      <p className="text-sm text-gray-300">{selectedPackage.description || 'Diamond package'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold text-xl">{selectedPackage.price || '$0.00'}</p>
                    <button 
                      onClick={() => setSelectedPackage(null)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-500 text-black p-4 rounded-lg mb-6 text-center">
                <p className="font-medium">Please select a package from above to continue.</p>
              </div>
            )}
            
            {/* Payment Options Section */}
            <div className="bg-blue-800 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
              <p className="text-sm mb-3">
                Please transfer the exact amount using one of our payment methods.
                After payment, click the checkout button below to complete your order.
              </p>
              
              {selectedPackage && (
                <div className="bg-yellow-500 text-black p-3 rounded-lg text-sm font-bold mb-4">
                  Amount to Transfer: {selectedPackage.price}
                </div>
              )}
              
              {/* Payment Method Selection */}
              <div className="mb-5">
                <h4 className="text-lg font-semibold text-white mb-3">Select Payment Method</h4>
                
                {/* Interactive Payment Tabs */}
                <div className="flex border-b border-blue-700 mb-5">
                  <button 
                    className="py-3 px-6 font-medium border-b-2 border-green-500 text-green-300 flex items-center"
                    onClick={() => {}}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                    </svg>
                    eZcash
                    <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full text-center">
                      Fast
                    </span>
                  </button>
                  
                  <button 
                    className="py-3 px-6 font-medium border-b-2 border-transparent text-white hover:text-blue-300 hover:border-blue-400 transition-colors flex items-center"
                    onClick={() => {}}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    Bank Transfer
                  </button>
                </div>
                
                {/* Payment Details Card with Enhanced Styling */}
                <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-5 mb-5 border border-green-700">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-green-300 flex items-center">
                      eZcash Payment Details
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </h4>
                    <div className="text-green-300 text-sm font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Fast Processing
                    </div>
                  </div>
                  
                  <BankDetailsDisplay 
                    bankAccounts={bankAccounts} 
                    paymentType="ezcash"
                    theme="dark"
                    compact={true}
                    className="my-3"
                  />
                  
                  <div className="mt-2 bg-green-800 bg-opacity-50 rounded-lg p-3 text-sm text-green-200 border border-green-700">
                    <p className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Send the exact amount of <strong>{selectedPackage?.price || 'selected package price'}</strong> to one of the eZcash numbers above. After payment, take a screenshot of your confirmation message and upload it when checking out.</span>
                    </p>
                  </div>
                </div>
                
                {/* Bank Transfer Details */}
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-5 border border-blue-700">
                  <h4 className="font-medium text-blue-300 mb-3">Bank Account Details</h4>
                  <BankDetailsDisplay 
                    bankAccounts={bankAccounts} 
                    paymentType="bank"
                    theme="dark" 
                    compact={true}
                    className="mb-3"
                  />
                  
                  <div className="mt-2 bg-blue-800 bg-opacity-50 rounded-lg p-3 text-sm text-blue-200 border border-blue-700">
                    <p className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Transfer the exact amount of <strong>{selectedPackage?.price || 'selected package price'}</strong> to one of the bank accounts above. Include your Player ID in the reference when making the transfer.</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Banking Instructions in Sinhala */}
              <div className="mt-4 bg-yellow-600 bg-opacity-30 border border-yellow-500 rounded-lg p-4 text-sm">
                <h4 className="font-bold text-yellow-300 mb-2">මුදල් ගෙවීමේ උපදෙස්</h4>
                <ul className="space-y-2 text-yellow-100">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>නිවැරදි ගිණුම් තොරතුරු වලට අදාල මුදල බැර කරන්න</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>අද දිනයේ මුදල් ගෙවීම් සදහා පමණක් top-up ලබා ගත හැක</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>මුදල් දැමීමේදී රිසිට් 2 ක් ඇත්නම් 2 ම එක image එකකින් පහලින් uplode කරන්න</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>කිහිපවරක් එකම රිසිට් පත එවීමෙන් ඔබව web side එකෙන් banned වනු ඇත</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Checkout Button */}
            <button 
              onClick={() => {
                if (!selectedPackage) {
                  alert("Please select a package first!");
                  return;
                }
                
                // Check if user ID is provided
                if (!useruid || useruid.trim() === "") {
                  alert("Please enter your Free Fire ID in the form above!");
                  // Scroll to the user ID input
                  document.getElementById('player-id-input').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                  // Focus on the input
                  document.getElementById('player-id-input').focus();
                  return;
                }
                
                // Check if username is provided
                if (!username || username.trim() === "") {
                  alert("Please enter your Username in the form above!");
                  // Scroll to the username input
                  document.getElementById('username-input').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                  // Focus on the input
                  document.getElementById('username-input').focus();
                  return;
                }
                
                // Navigate to checkout page with order details
                navigate("/checkout", {
                  state: {
                    orderDetails: {
                      gameName: gameName,
                      gameId: gameId,
                      playerId: useruid, // Changed from userId to playerId
                      username: username,
                      packageName: selectedPackage.packagename,
                      packageDescription: selectedPackage.description,
                      packagePrice: selectedPackage.price,
                      packageId: selectedPackage._id
                    }
                  }
                });
              }}
              className={`w-full ${selectedPackage ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 cursor-not-allowed'} text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
              disabled={!selectedPackage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {selectedPackage ? 'Proceed to Checkout' : 'Select a Package First'}
            </button>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FreeFireSGTopUp;
