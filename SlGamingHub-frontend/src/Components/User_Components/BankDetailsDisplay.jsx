import React, { useEffect, useState } from "react";
import bankService from "../../services/bankService";

/**
 * A reusable component to display bank details
 * @param {Object} props
 * @param {Array} props.bankAccounts - Array of bank account objects
 * @param {string} props.theme - "light" or "dark" theme
 * @param {boolean} props.compact - Whether to show a compact version
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.paymentType - Filter by payment type ("bank", "ezcash", or "all")
 */
const BankDetailsDisplay = ({ 
  bankAccounts = [], 
  theme = "light", 
  compact = false,
  className = "",
  paymentType = "all"
}) => {
  // Hardcoded bank details
  const hardcodedBanks = [
    {
      _id: '1',
      accountHolderName: 'K.W.A.Rasanga',
      accountHolder: 'K.W.A.Rasanga',
      accountNumber: '86800581',
      bankName: 'Bank of Ceylon',
      branch: 'Katuwana Branch',
      paymentType: 'bank',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      accountHolderName: 'K.W.A.Rasanga',
      accountHolder: 'K.W.A.Rasanga',
      accountNumber: '115857695088',
      bankName: 'Sampath Bank',
      branch: 'Middeniya Branch',
      paymentType: 'bank',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: '3',
      accountHolderName: 'K.W.A.Rasanga',
      accountHolder: 'K.W.A.Rasanga',
      accountNumber: '0773043667',
      bankName: 'eZcash',
      branch: 'Mobile',
      paymentType: 'ezcash',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: '4',
      accountHolderName: 'K.W.A.Rasanga',
      accountHolder: 'K.W.A.Rasanga',
      accountNumber: '0741880764',
      bankName: 'eZcash',
      branch: 'Mobile',
      paymentType: 'ezcash',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  const [accounts, setAccounts] = useState([]);

  // Load bank accounts from API with fallback options
  useEffect(() => {
    const loadBankAccounts = async () => {
      let availableBanks = [];
      
      // If explicit bank accounts are provided, use those
      if (bankAccounts && bankAccounts.length > 0) {
        availableBanks = bankAccounts;
      } else {
        // Try to get banks from API
        try {
          const apiData = await bankService.getAllBanks();
          if (apiData && apiData.length > 0) {
            availableBanks = apiData;
          } else {
            // Fallback to localStorage
            try {
              const fallbackService = bankService.fallbackToLocalStorage();
              const banks = fallbackService.getAllBanks();
              if (banks && banks.length > 0) {
                availableBanks = banks;
              } else {
                // Use hardcoded banks as last resort
                availableBanks = hardcodedBanks;
              }
            } catch (error) {
              console.log("Using hardcoded bank details");
              availableBanks = hardcodedBanks;
            }
          }
        } catch (error) {
          console.error("API fetch failed, using fallback", error);
          // Use hardcoded banks as default
          availableBanks = hardcodedBanks;
        }
      }
      
      // Filter by payment type if specified
      if (paymentType !== "all") {
        availableBanks = availableBanks.filter(bank => bank.paymentType === paymentType);
      }
      
      setAccounts(availableBanks);
    };
    
    loadBankAccounts();
  }, [bankAccounts, paymentType]);

  if (!accounts || accounts.length === 0) {
    return (
      <div className={`${theme === "dark" ? "bg-red-600 text-white" : "bg-red-50 text-red-700"} p-3 rounded-lg text-sm ${className}`}>
        <p>No bank accounts available. Please contact support.</p>
      </div>
    );
  }

  const tableHeaderClass = theme === "dark" 
    ? "p-2 border border-gray-600 text-white bg-[#0e08ab]" 
    : "p-2 border border-gray-300 text-gray-700 bg-gray-100";
  
  const tableCellClass = theme === "dark"
    ? "p-2 border border-gray-600 bg-gray-700 text-white"
    : "p-2 border border-gray-300 bg-white text-gray-800";
  
  // Title class is now defined below with the title text

  // Compact version shows a simplified view
  if (compact) {
    return (
      <div className={className}>
        <h4 className={paymentType === "ezcash" ? 
          (theme === "dark" ? "font-semibold mb-3 text-green-300 flex items-center" : "font-semibold mb-3 text-green-700 flex items-center") : 
          (theme === "dark" ? "font-semibold mb-3 text-blue-300" : "font-semibold mb-3 text-blue-700")}>
          
          {paymentType === "ezcash" ? "eZcash Payment Details" : "Bank Account Details"}
          
          {paymentType === "ezcash" && (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </h4>
        
        <div className="space-y-3">
          {accounts.map((bank, index) => {
            const isEzcash = bank.paymentType === "ezcash";
            const bgColor = isEzcash 
              ? (theme === "dark" ? "bg-green-900" : "bg-green-50") 
              : (theme === "dark" ? "bg-gray-700" : "bg-gray-50");
            const borderColor = isEzcash
              ? (theme === "dark" ? "border-green-700" : "border-green-300")
              : (theme === "dark" ? "border-gray-600" : "border-gray-300");
            
            return (
              <div 
                key={bank._id || index} 
                className={`${bgColor} p-4 rounded-lg border ${borderColor} shadow-sm`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    {isEzcash ? (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                        </svg>
                        <span className={`font-medium ${theme === "dark" ? "text-green-300" : "text-green-700"}`}>{bank.bankName}</span>
                      </div>
                    ) : (
                      <span className="font-medium">{bank.bankName}</span>
                    )}
                    
                    <p className={`text-lg font-mono font-bold mt-1 ${isEzcash ? (theme === "dark" ? "text-green-300" : "text-green-700") : ""}`}>
                      {bank.accountNumber}
                    </p>
                  </div>
                  
                  {isEzcash && (
                    <div className={`${theme === "dark" ? "bg-green-800" : "bg-green-100"} rounded-full p-1`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === "dark" ? "text-green-300" : "text-green-700"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <p className="text-sm mt-1">{bank.accountHolderName || bank.accountHolder || 'Unknown'}</p>
                {bank.branch && <p className="text-xs opacity-75 mt-1">{bank.branch}</p>}
                
                {isEzcash && (
                  <div className={`text-xs mt-2 ${theme === "dark" ? "text-green-300" : "text-green-700"}`}>
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Fast Processing
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Determine the title based on the payment type
  let titleText = "Payment Details";
  let titleClass = theme === "dark" ? "font-semibold mb-2 text-yellow-200" : "font-medium text-gray-700 mb-2";
  
  if (paymentType === "bank") {
    titleText = "Bank Account Details";
  }
  
  if (paymentType === "ezcash") {
    titleText = "eZcash Payment Details";
    titleClass = theme === "dark" 
      ? "font-semibold mb-2 text-green-300 flex items-center" 
      : "font-medium text-green-800 mb-2 flex items-center";
  }
  
  // Different headers based on payment type
  const renderTableHeaders = () => {
    if (accounts.length > 0 && accounts[0].paymentType === "ezcash") {
      const ezcashHeaderClass = theme === "dark" 
        ? "p-3 border border-green-700 text-white bg-green-800 font-medium" 
        : "p-3 border border-green-400 text-green-900 bg-green-100 font-medium";
        
      return (
        <tr>
          <th className={ezcashHeaderClass}>
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Holder
            </div>
          </th>
          <th className={ezcashHeaderClass}>
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone Number
            </div>
          </th>
          <th className={ezcashHeaderClass}>
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
              </svg>
              Payment Method
            </div>
          </th>
        </tr>
      );
    }
    
    const bankHeaderClass = theme === "dark" 
      ? "p-3 border border-blue-700 text-white bg-blue-800 font-medium" 
      : "p-3 border border-blue-400 text-blue-900 bg-blue-100 font-medium";
    
    return (
      <tr>
        <th className={bankHeaderClass}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account Holder
          </div>
        </th>
        <th className={bankHeaderClass}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Account Number
          </div>
        </th>
        <th className={bankHeaderClass}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            Bank
          </div>
        </th>
        <th className={bankHeaderClass}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Branch
          </div>
        </th>
      </tr>
    );
  };
  
  // Different row display based on payment type
  const renderTableRow = (bank, index) => {
    // Support both naming conventions (backend uses accountHolderName, frontend uses accountHolder)
    const accountHolder = bank.accountHolderName || bank.accountHolder || 'Unknown';
    
    if (bank.paymentType === "ezcash") {
      // Enhanced eZcash row with better styling and visual indicators
      const bgClass = theme === "dark" ? "bg-green-900" : "bg-green-50";
      const textClass = theme === "dark" ? "text-green-300" : "text-green-700";
      
      return (
        <tr key={bank._id || index} className="text-center hover:bg-opacity-90 transition-colors">
          <td className={`${tableCellClass} ${bgClass} border-green-600`}>
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {accountHolder}
            </div>
          </td>
          <td className={`${tableCellClass} font-mono font-bold ${bgClass} ${textClass} border-green-600 text-lg`}>
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {bank.accountNumber}
            </div>
          </td>
          <td className={`${tableCellClass} ${bgClass} border-green-600`}>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
              </svg>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-green-600">
                  {bank.bankName}
                </span>
                <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded mt-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Fast Processing
                </span>
              </div>
            </div>
          </td>
        </tr>
      );
    }
    
    const bgClass = theme === "dark" ? "bg-blue-900 bg-opacity-50" : "bg-blue-50";
    const textClass = theme === "dark" ? "text-blue-300" : "text-blue-700";
    
    return (
      <tr key={bank._id || index} className="text-center hover:bg-opacity-90 transition-colors">
        <td className={`${tableCellClass} ${bgClass}`}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {accountHolder}
          </div>
        </td>
        <td className={`${tableCellClass} font-mono font-semibold ${bgClass}`}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {bank.accountNumber}
          </div>
        </td>
        <td className={`${tableCellClass} ${bgClass}`}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            {bank.bankName}
          </div>
        </td>
        <td className={`${tableCellClass} ${bgClass}`}>
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {bank.branch || "Main Branch"}
          </div>
        </td>
      </tr>
    );
  };

  // Full table view
  return (
    <div className={className}>
      <h4 className={titleClass}>
        {titleText}
        {paymentType === "ezcash" && (
          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
            Recommended
          </span>
        )}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {renderTableHeaders()}
          </thead>
          <tbody>
            {accounts.map((bank, index) => renderTableRow(bank, index))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankDetailsDisplay;
